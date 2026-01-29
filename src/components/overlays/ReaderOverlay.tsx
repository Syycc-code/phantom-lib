import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page } from 'react-pdf';
import { 
    X, 
    Loader2, 
    Maximize2, 
    Sparkles, 
    Languages, 
    BrainCircuit, 
    MessageSquare, 
    Move,
    FileText,
    Eye,
    Columns,
    GripVertical,
    RefreshCw
} from 'lucide-react';
import type { Paper, PlaySoundFunction } from '../../types';
import { NoteEditor } from '../shared/NoteEditor';
import { PhantomLoader } from '../shared/PhantomLoader';

interface ReaderOverlayProps {
    paper: Paper;
    onClose: () => void;
    onLevelUp: (s: keyof import('../../types').PhantomStats) => void;
    playSfx: PlaySoundFunction;
    onSaveNote: (content: string) => Promise<void>;
    markerStyle?: string; // 'default', 'neon', 'redact'
    fontStyle?: string; // NEW PROP
}

interface TranslationBlock {
    src: string;
    dst: string;
}

interface TranslationData {
    blocks: TranslationBlock[];
    status: 'pending' | 'loading' | 'success' | 'error';
}

export const ReaderOverlay = ({ paper, onClose, onLevelUp, playSfx, onSaveNote, markerStyle = 'default', fontStyle = 'default' }: ReaderOverlayProps) => {
    const [selectionMenu, setSelectionMenu] = useState<{ visible: boolean; x: number; y: number; text: string } | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{ visible: boolean; type: string; content: string } | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [numPages, setNumPages] = useState<number>(0);
    const [showNotes, setShowNotes] = useState(false);
    const [safeMode, setSafeMode] = useState(false);
    
    // Split View & Translation State
    const [splitMode, setSplitMode] = useState(false);
    const [splitRatio, setSplitRatio] = useState(0.5);
    const [activePage, setActivePage] = useState(1);
    const [translations, setTranslations] = useState<Record<number, TranslationData>>({});
    
    // Highlight State
    const [highlightedText, setHighlightedText] = useState<string | null>(null);
    
    // Refs
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null); // Left Panel
    const rightPanelRef = useRef<HTMLDivElement>(null); // Right Panel
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const translationRefs = useRef<(HTMLDivElement | null)[]>([]);
    const activeDriver = useRef<'left' | 'right' | null>(null);

    useEffect(() => { onLevelUp('guts'); }, []);

    // --- INTERSECTION OBSERVER ---
    useEffect(() => {
        if (!numPages || !splitMode) return;
        const observer = new IntersectionObserver((entries) => {
            const visibleEntry = entries.reduce((prev, current) => {
                return (current.intersectionRatio > prev.intersectionRatio) ? current : prev;
            });
            if (visibleEntry.isIntersecting && visibleEntry.intersectionRatio > 0.05) {
                const pageIndex = Number(visibleEntry.target.getAttribute('data-page-index'));
                if (!isNaN(pageIndex)) setActivePage(pageIndex + 1);
            }
        }, { root: containerRef.current, threshold: [0.05, 0.5] });
        pageRefs.current.forEach(el => { if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [numPages, splitMode]);

    // --- EAGER TRANSLATION QUEUE ---
    useEffect(() => {
        if (!splitMode || numPages === 0) return;

        // Check if we already started eager loading to avoid double execution
        // We use a ref to track processed pages in this session
        const processedPages = new Set<number>();
        let isCancelled = false;

        const processQueue = async () => {
            const CONCURRENT_LIMIT = 3;
            // FIX: Load ALL pages, not just the first few.
            // Filter pages that haven't been loaded or failed
            const pagesToLoad = Array.from({ length: numPages }, (_, i) => i + 1)
                .filter(p => !translations[p] || translations[p].status === 'error');

            // Helper to process a single page
            const processPage = async (page: number) => {
                if (isCancelled) return;
                // Check status again just in case
                if (translations[page]?.status === 'success' || translations[page]?.status === 'loading') return;
                
                await fetchPageTranslation(page);
            };

            // Simple chunked execution
            for (let i = 0; i < pagesToLoad.length; i += CONCURRENT_LIMIT) {
                if (isCancelled) break;
                const chunk = pagesToLoad.slice(i, i + CONCURRENT_LIMIT);
                await Promise.all(chunk.map(processPage));
            }
        };

        // Start the queue
        processQueue();

        return () => { isCancelled = true; };
    }, [splitMode, numPages]); // Only run when split mode opens or numPages loads

    // --- SCROLL SYNC ---
    const handleScroll = (source: 'left' | 'right') => {
        if (!splitMode) return;
        if (activeDriver.current && activeDriver.current !== source) return;

        const sourceContainer = source === 'left' ? containerRef.current : rightPanelRef.current;
        const targetContainer = source === 'left' ? rightPanelRef.current : containerRef.current;
        const sourceItems = source === 'left' ? pageRefs.current : translationRefs.current;
        const targetItems = source === 'left' ? translationRefs.current : pageRefs.current;

        if (!sourceContainer || !targetContainer) return;

        const scrollTop = sourceContainer.scrollTop;
        let activeIndex = -1;
        let progress = 0;

        for (let i = 0; i < sourceItems.length; i++) {
            const item = sourceItems[i];
            if (!item) continue;
            const itemTop = item.offsetTop;
            const itemHeight = item.clientHeight;
            if (scrollTop >= itemTop && scrollTop < itemTop + itemHeight) {
                activeIndex = i;
                progress = (scrollTop - itemTop) / itemHeight;
                break;
            }
        }
        
        if (activeIndex === -1 && sourceItems.length > 0) {
            const lastItem = sourceItems[sourceItems.length - 1];
            if (lastItem && scrollTop >= lastItem.offsetTop + lastItem.clientHeight) {
                activeIndex = sourceItems.length - 1;
                progress = 1;
            } else if (sourceItems[0] && scrollTop < sourceItems[0].offsetTop) {
                activeIndex = 0;
                progress = 0;
            }
        }

        if (activeIndex !== -1) {
            const targetItem = targetItems[activeIndex];
            if (targetItem) {
                const targetScroll = targetItem.offsetTop + (targetItem.clientHeight * progress);
                targetContainer.scrollTo({ top: targetScroll, behavior: 'auto' });
            }
        }
    };

    const fetchPageTranslation = async (page: number) => {
        if (translations[page]?.status === 'loading') return;
        setTranslations(prev => ({
            ...prev,
            [page]: { ...prev[page], blocks: prev[page]?.blocks || [], status: 'loading' }
        }));
        try {
            const res = await fetch(`/api/papers/${paper.id}/translate_page`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page })
            });
            if (res.ok) {
                const data = await res.json();
                setTranslations(prev => ({
                    ...prev,
                    [page]: { ...data, status: 'success' }
                }));
            } else {
                setTranslations(prev => ({
                    ...prev,
                    [page]: { blocks: [], status: 'error' }
                }));
            }
        } catch (e) {
            setTranslations(prev => ({
                ...prev,
                [page]: { blocks: [], status: 'error' }
            }));
        }
    };

    // --- SELECTION SYNC ---
    const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            setHighlightedText(selection.toString().trim());
        }
    };

    // --- P5 LOADING STAR ---
    const P5Star = () => (
        <div className="relative w-16 h-16 animate-spin-slow">
            <div className="absolute inset-0 bg-phantom-red clip-star" />
            <div className="absolute inset-2 bg-black clip-star" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rotate-45 animate-pulse" />
            </div>
        </div>
    );

    // --- RESIZER ---
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = containerRef.current ? containerRef.current.parentElement?.offsetWidth || window.innerWidth : window.innerWidth;
        const startRatio = splitRatio;
        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            setSplitRatio(Math.min(Math.max(0.2, startRatio + (deltaX / startWidth)), 0.8));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [splitRatio]);

    // --- EXISTING ---
    const handleMouseUp = () => {
        handleSelection(); // Check for highlight
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) return;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // ... (Menu positioning logic)
        setSelectionMenu({ 
            visible: true, 
            x: Math.min(window.innerWidth - 150, Math.max(10, rect.left + rect.width / 2)), 
            y: rect.top - 50 < 60 ? rect.bottom + 10 : rect.top - 50, 
            text: selection.toString() 
        });
        playSfx('hover');
    };

    const handleAction = async (type: 'DECIPHER' | 'TRANSLATE') => {
        if (!selectionMenu) return;
        playSfx('click');
        setSelectionMenu(null); 
        setLoadingAnalysis(true); 
        setAnalysisResult({ visible: true, type, content: "" });
        onLevelUp('proficiency');
        try {
            const response = await fetch('/api/mind_hack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: selectionMenu.text, mode: type.toLowerCase() })
            });
            if (!response.ok) throw new Error("Cognitive Link Failed");
            const data = await response.json();
            setAnalysisResult({ visible: true, type, content: data.result });
            playSfx('confirm');
        } catch (e: any) {
            setAnalysisResult({ visible: true, type, content: `Error: ${e.message}` });
        } finally {
            setLoadingAnalysis(false);
        }
    };

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-0 z-[100] flex flex-col transition-colors duration-500 bg-white text-black reader-light-mode font-${fontStyle}`}
        >
            <style>{`
                .clip-star { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
                .animate-spin-slow { animation: spin 4s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                /* DYNAMIC SELECTION STYLES - Light Mode Optimized */
                ::selection {
                    background: #E60012; /* Phantom Red */
                    color: white;
                }
            `}</style>

            {/* HEADER - Light Mode Style */}
            <div className={`h-20 flex items-center justify-between px-8 shrink-0 relative overflow-hidden shadow-sm z-20 border-b-2 border-black bg-white`}>
                <div className="z-10 flex items-center space-x-4">
                    <Maximize2 className="text-black" />
                    <h2 className="font-p5 text-3xl truncate max-w-xl text-black">
                        READING // {paper.title}
                    </h2>
                </div>
                <div className="flex items-center space-x-4 z-10">
                    <button onClick={() => { setSplitMode(!splitMode); playSfx('click'); }} className={`px-4 py-2 font-p5 text-sm border-2 border-black rounded-full flex items-center space-x-2 ${splitMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}>
                        <Languages size={16} /> <span>TRANSLATE</span>
                    </button>
                    {/* Removed Safe Mode Toggle since it's now always safe/light */}
                    <button onClick={() => onClose()} className="p-3 rounded-full border-2 border-black bg-white text-black hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"><X size={24} /></button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex overflow-hidden relative w-full bg-white">
                {/* LEFT PDF - Light Mode Background */}
                <div 
                    ref={containerRef}
                    onMouseEnter={() => activeDriver.current = 'left'}
                    onScroll={() => handleScroll('left')}
                    style={{ width: splitMode ? `${splitRatio * 100}%` : '100%' }}
                    className="relative overflow-auto flex flex-col items-center p-8 custom-scrollbar bg-[#F5F5F5]" 
                    onMouseUp={handleMouseUp}
                >
                    {paper.fileUrl && (
                        <Document file={paper.fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)} className="flex flex-col items-center gap-4 w-full">
                            {Array.from(new Array(numPages), (_, index) => (
                                <div 
                                    key={`page_${index + 1}`} 
                                    data-page-index={index}
                                    ref={el => { pageRefs.current[index] = el; }}
                                    className="relative w-full flex justify-center"
                                >
                                    <Page pageNumber={index + 1} renderTextLayer={true} renderAnnotationLayer={true} width={splitMode ? (containerRef.current ? containerRef.current.offsetWidth * 0.9 : 500) : undefined} scale={splitMode ? undefined : 1.2} className="bg-white shadow-lg border border-gray-200 max-w-full" loading={<PhantomLoader message="DECRYPTING" />} />
                                    <div className="absolute -left-8 top-0 text-xs font-mono opacity-50 text-black">{index + 1}</div>
                                </div>
                            ))}
                        </Document>
                    )}
                </div>

                {splitMode && <div className="w-2 bg-gray-200 hover:bg-phantom-red cursor-col-resize flex items-center justify-center z-50 transition-colors border-l border-r border-gray-300" onMouseDown={handleMouseDown}><GripVertical size={16} className="text-gray-500" /></div>}

                {/* RIGHT TRANSLATION - Light Mode Background */}
                <AnimatePresence>
                    {splitMode && (
                        <motion.div 
                            initial={{ x: "100%", width: 0 }}
                            animate={{ x: 0, width: `${(1 - splitRatio) * 100}%` }}
                            exit={{ x: "100%", width: 0 }}
                            className="h-full border-l-2 border-black flex flex-col bg-white"
                        >
                            <div className="bg-white border-b-2 border-black text-black p-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                                <div className="flex items-center space-x-4"><Languages className="text-phantom-red" /><h3 className="font-p5 text-xl tracking-wider hidden lg:block">COGNITIVE TRANSLATION</h3></div>
                                <span className="font-mono text-sm text-gray-500">SYNC: PAGE {activePage}</span>
                            </div>

                            <div ref={rightPanelRef} onMouseEnter={() => activeDriver.current = 'right'} onScroll={() => handleScroll('right')} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12 text-gray-900 bg-white">
                                {numPages > 0 ? (
                                    Array.from(new Array(numPages), (_, index) => {
                                        const pageNum = index + 1;
                                        const data = translations[pageNum];
                                        return (
                                            <div 
                                                key={`trans_page_${pageNum}`} 
                                                ref={el => { translationRefs.current[index] = el; }}
                                                className={`min-h-[50vh] transition-opacity duration-500 border-l-2 pl-4 ${activePage === pageNum ? 'border-phantom-red opacity-100' : 'border-transparent opacity-40 hover:opacity-80'}`}
                                            >
                                                <div className="flex items-center space-x-4 mb-4 select-none"><span className={`font-p5 text-xl ${activePage === pageNum ? 'text-phantom-red' : 'text-gray-400'}`}>#{pageNum}</span></div>
                                                
                                                {data?.status === 'success' ? (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                                        {data.blocks.map((block, idx) => {
                                                            const isHighlighted = highlightedText && block.src.includes(highlightedText);
                                                            
                                                            // MARKER EFFECTS
                                                            let effectClass = "p-2 rounded transition-all duration-300 ";
                                                            if (isHighlighted) {
                                                                 effectClass += "bg-phantom-yellow text-black shadow-sm border border-black scale-[1.02] z-10 relative";
                                                            } else {
                                                                effectClass += "hover:bg-gray-100";
                                                            }

                                                            const formatContent = (content: string) => {
                                                                // Simple check if content has HTML tags
                                                                if (/<[a-z][\s\S]*>/i.test(content)) {
                                                                    return content;
                                                                }
                                                                // If plain text, convert newlines to breaks
                                                                return content.replace(/\n/g, '<br/>');
                                                            };

                                                            return (
                                                                <div key={idx} className={effectClass}>
                                                                    <div 
                                                                        className="font-serif text-lg leading-loose prose prose-invert max-w-none text-black"
                                                                        dangerouslySetInnerHTML={{ __html: formatContent(block.dst) }}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : data?.status === 'loading' ? (
                                                    <div className="flex flex-col items-center justify-center h-32 space-y-4">
                                                        <div className="relative w-16 h-16 animate-spin-slow">
                                                            <div className="absolute inset-0 bg-phantom-red clip-star" />
                                                            <div className="absolute inset-2 bg-black clip-star" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-2 h-2 bg-white rotate-45 animate-pulse" />
                                                            </div>
                                                        </div>
                                                        <p className="font-p5 tracking-widest text-sm text-black animate-pulse">DECODING REALITY...</p>
                                                    </div>
                                                ) : (
                                                    <div className="h-24 flex items-center justify-center border border-dashed border-gray-300 rounded-lg text-gray-400"><span className="font-p5 text-xs tracking-widest">WAITING...</span></div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : <div className="h-full flex items-center justify-center"><BrainCircuit size={48} /></div>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* OVERLAYS - Fixed Z-Index and Positioning */}
            <AnimatePresence>
                {selectionMenu && (
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0, opacity: 0 }} 
                        style={{ top: selectionMenu.y, left: selectionMenu.x }} 
                        className="fixed z-[9999] flex space-x-2 pb-2 pointer-events-auto"
                    >
                        <div className="phantom-menu flex space-x-2"> {/* Wrapper for click detection */}
                            <button onClick={() => handleAction('DECIPHER')} className="bg-black text-white px-4 py-2 font-p5 text-sm border-2 border-phantom-red shadow-lg hover:scale-110 transition-transform flex items-center gap-2">
                                <Sparkles size={14} /> DECIPHER
                            </button>
                            <button onClick={() => handleAction('TRANSLATE')} className="bg-white text-black px-4 py-2 font-p5 text-sm border-2 border-black shadow-lg hover:scale-110 transition-transform flex items-center gap-2">
                                <Languages size={14} /> TRANSLATE
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {analysisResult && (
                    <motion.div drag dragMomentum={false} className="fixed z-[200] top-1/4 left-1/4 w-[500px] max-w-[90vw] bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col max-h-[60vh]">
                        <div className="bg-black p-3 flex justify-between items-center cursor-grab active:cursor-grabbing shrink-0">
                            <span className="text-white font-p5 text-lg tracking-widest flex items-center gap-2">
                                <Sparkles size={16} className="text-phantom-red" /> 
                                COGNITION ANALYSIS
                            </span>
                            <X onClick={() => setAnalysisResult(null)} className="text-white cursor-pointer hover:text-phantom-red transition-colors" />
                        </div>
                        <div className="p-6 bg-[#F2F2F2] text-black whitespace-pre-wrap overflow-y-auto custom-scrollbar font-sans text-lg leading-relaxed border-t-2 border-black min-h-[100px]">
                            {loadingAnalysis ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                    <Loader2 className="animate-spin text-phantom-red" size={32} />
                                    <p className="font-p5 animate-pulse">HACKING COGNITION...</p>
                                </div>
                            ) : (
                                analysisResult.content
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Note Editor Overlay */}
            <AnimatePresence>
                {showNotes && (
                    <motion.div 
                        initial={{ x: "100%" }} 
                        animate={{ x: 0 }} 
                        exit={{ x: "100%" }} 
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        className="fixed right-0 top-0 w-[400px] max-w-[40vw] min-w-[300px] h-full bg-phantom-yellow border-l-4 border-black shadow-[-8px_0_16px_rgba(0,0,0,0.3)] z-[110]"
                    >
                        <div className="h-full flex flex-col">
                            <div className="bg-black text-white p-4 flex items-center justify-between shrink-0">
                                <h3 className="font-p5 text-xl tracking-wider">INTEL NOTES</h3>
                                <button 
                                    onClick={() => { setShowNotes(false); playSfx('cancel'); }}
                                    className="hover:text-phantom-red hover:rotate-90 transition-transform"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <NoteEditor 
                                    initialContent={paper.user_notes} 
                                    paperId={paper.id} 
                                    onSave={onSaveNote} 
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};