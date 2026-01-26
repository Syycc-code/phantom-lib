import { useState, useRef, useEffect } from 'react';
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
    Move 
} from 'lucide-react';
import type { Paper, PlaySoundFunction } from '../../types';

interface ReaderOverlayProps {
    paper: Paper;
    onClose: () => void;
    onLevelUp: (s: keyof import('../../types').PhantomStats) => void;
    playSfx: PlaySoundFunction;
}

export const ReaderOverlay = ({ paper, onClose, onLevelUp, playSfx }: ReaderOverlayProps) => {
    const [selectionMenu, setSelectionMenu] = useState<{ visible: boolean; x: number; y: number; text: string } | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{ visible: boolean; type: string; content: string } | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [numPages, setNumPages] = useState<number>(0);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => { onLevelUp('guts'); }, []);

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) return;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const x = Math.min(Math.max(rect.left + (rect.width / 2), 100), window.innerWidth - 100);
        const y = Math.max(rect.top - 50, 80); 
        setSelectionMenu({ visible: true, x, y, text: selection.toString() });
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
            console.error("Mind Hack Error:", e);
            setTimeout(() => { 
                setAnalysisResult({ 
                    visible: true, 
                    type, 
                    content: `⚠️ SYSTEM ERROR // ${e.message || "Unknown Error"}\n\n请检查后端连接或 API Key 配置。` 
                }); 
            }, 1000);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
             const target = e.target as HTMLElement;
             if (selectionMenu?.visible && !target.closest('.phantom-menu')) {
                 setSelectionMenu(null);
             }
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [selectionMenu]);

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col"
        >
            <div className="h-20 bg-phantom-red flex items-center justify-between px-8 shrink-0 relative overflow-hidden shadow-lg z-20">
                <div className="absolute inset-0 bg-halftone opacity-20 mix-blend-overlay" />
                <div className="z-10 flex items-center space-x-4">
                    <Maximize2 className="text-black" />
                    <h2 className="font-p5 text-3xl text-black truncate max-w-4xl transform -skew-x-12">
                        READING // {paper.title}
                    </h2>
                    {paper.ocrStatus === 'scanning' && (
                        <div className="flex items-center space-x-2 bg-black/80 px-3 py-1 rounded-full">
                            <Loader2 className="animate-spin text-phantom-yellow" size={14} />
                            <span className="text-xs font-mono text-phantom-yellow">OCR SCANNING...</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-4 z-10">
                    <button onClick={() => { onClose(); onLevelUp('knowledge'); playSfx('rankup'); }} className="bg-black text-white px-4 py-2 font-p5 text-sm hover:bg-phantom-yellow hover:text-black transition-colors border-2 border-white rounded-full">
                        FINISH READING
                    </button>
                    <button onClick={() => { onClose(); playSfx('cancel'); }} className="bg-black text-white p-3 hover:rotate-90 transition-transform rounded-full shadow-lg border-2 border-white z-10">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-zinc-900 relative overflow-auto flex justify-center p-8 custom-scrollbar" onMouseUp={handleMouseUp}>
                {paper.fileUrl ? (
                    <div className="shadow-2xl selection:bg-phantom-red selection:text-black flex flex-col items-center pb-20">
                        <Document
                            file={paper.fileUrl}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            className="flex flex-col items-center gap-4"
                        >
                            {Array.from(new Array(numPages), (_, index) => (
                                <Page 
                                    key={`page_${index + 1}`}
                                    pageNumber={index + 1} 
                                    renderTextLayer={true} 
                                    renderAnnotationLayer={true}
                                    scale={1.2}
                                    className="bg-white shadow-xl"
                                    loading={<div className="h-[800px] w-[600px] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-phantom-red"/></div>}
                                />
                            ))}
                        </Document>
                    </div>
                ) : (
                    <div ref={contentRef} className="max-w-4xl w-full bg-zinc-800/50 p-12 min-h-full border-l-4 border-zinc-700 selection:bg-phantom-red selection:text-black">
                        <div className="font-serif text-xl leading-loose text-zinc-300 whitespace-pre-wrap">
                            {paper.content || (paper.ocrStatus === 'scanning' ? "SCANNING DOCUMENT FOR COGNITIVE DATA..." : "NO TEXT EXTRACTED.")}
                        </div>
                    </div>
                )}
                
                <AnimatePresence>
                    {selectionMenu && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0 }}
                            style={{ top: selectionMenu.y, left: selectionMenu.x }}
                            className="phantom-menu fixed transform -translate-x-1/2 -translate-y-full z-[150] flex space-x-2 pb-2 pointer-events-auto"
                        >
                             <button onClick={() => handleAction('DECIPHER')} className="bg-black text-white px-4 py-2 font-p5 text-sm border-2 border-phantom-red shadow-[4px_4px_0px_#E60012] hover:scale-110 transition-transform flex items-center space-x-2">
                                <Sparkles size={14} className="text-phantom-yellow" /> <span>DECIPHER</span>
                             </button>
                             <button onClick={() => handleAction('TRANSLATE')} className="bg-white text-black px-4 py-2 font-p5 text-sm border-2 border-black shadow-[4px_4px_0px_#000] hover:scale-110 transition-transform flex items-center space-x-2">
                                <Languages size={14} /> <span>TRANSLATE</span>
                             </button>
                             <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-phantom-red"></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {analysisResult && (
                        <motion.div
                            drag
                            dragMomentum={false}
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="fixed z-[200] top-1/3 left-1/3 w-[400px] bg-white border-4 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.8)] cursor-move"
                        >
                            <div className="bg-black p-2 flex justify-between items-center cursor-grab active:cursor-grabbing">
                                <div className="flex items-center space-x-2">
                                    <Move size={16} className="text-phantom-red" />
                                    <span className="text-white font-p5 text-sm tracking-widest">
                                        {loadingAnalysis ? "ESTABLISHING LINK..." : "PHANTOM ANALYSIS"}
                                    </span>
                                </div>
                                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => { setAnalysisResult(null); playSfx('cancel'); }} className="text-white hover:text-phantom-red">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 bg-zinc-100 cursor-default" onPointerDown={(e) => e.stopPropagation()}>
                                {loadingAnalysis ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <BrainCircuit className="w-12 h-12 animate-spin text-phantom-red" />
                                        <span className="font-mono text-xs animate-pulse text-gray-500">DECRYPTING COGNITION...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                            <div className="font-sans text-sm text-black leading-relaxed whitespace-pre-wrap font-medium">
                                                {analysisResult.content}
                                            </div>
                                        </div>
                                        <div className="border-t-2 border-zinc-300 pt-2 flex justify-between items-center">
                                            <span className="text-[10px] uppercase font-bold text-phantom-red">CONFIDENCE: 99.8%</span>
                                            <MessageSquare size={14} className="text-gray-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
