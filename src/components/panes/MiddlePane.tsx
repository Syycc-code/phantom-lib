import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Combine, Star, Gem, Upload } from 'lucide-react';

interface MiddlePaneProps {
    activeMenu: string;
    papers: any[]; 
    selectedId: number | null;
    onSelect: (paper: any) => void;
    onAddPaper: (url: string) => void;
    onEditPaper: (id: number, data: { title?: string, author?: string }) => void; // NEW PROP
    onDeletePaper: (id: number, e: React.MouseEvent) => void;
    onBulkImport: (files: FileList) => void;
    onBulkDelete: (ids: number[]) => void;
    onMovePaper?: (paperId: number, folderId: string | null) => void; // New prop
    toggleFusionSelection: (id: number) => void;
    fusionTargetIds: number[];
    isFusing: boolean;
    setIsFusing: (v: boolean) => void;
    setFusionResult: (v: string | null) => void;
    fusionResult: string | null;
    showCurtain: boolean;
    setShowCurtain: (v: boolean) => void;
    onLevelUp: (stat: any) => void;
    playSfx: (type: any) => void;
    requestConfirm: (message: string, action: () => void, title?: string) => void; // NEW PROP
}

// Memoized Paper Row Component to prevent unnecessary re-renders
const PaperRow = memo(({ paper, index, isSelected, isSelectionMode, onSelect, toggleFusionSelection, toggleSelection, isVelvet, onEditPaper }: any) => {
    const cardVariants = {
        hidden: { opacity: 0, x: -50, rotateX: 90 },
        visible: (i: number) => ({ 
            opacity: 1, 
            x: 0, 
            rotateX: 0,
            transition: { delay: Math.min(i * 0.05, 0.5), type: "spring", stiffness: 100 } // Limit delay
        }),
        hover: { 
            scale: 1.02, 
            x: 12,
            skewX: 0,
            backgroundColor: "#FFFFFF",
            color: "#000000",
            boxShadow: "8px 0px 0px #E60012, 4px 4px 0px rgba(0,0,0,0.8)",
            zIndex: 10,
            transition: { duration: 0.1 }
        },
        tap: { scale: 0.95, x: 8, skewX: 0 },
        selected: { 
            x: 20, 
            backgroundColor: "#000", 
            color: "#E60012",
            borderLeftWidth: "16px",
            borderColor: "#E60012",
            skewX: -5
        }
    };

    const handleClick = useCallback(() => {
        if (isVelvet) {
            toggleFusionSelection(paper.id);
        } else if (isSelectionMode) {
            toggleSelection(paper.id);
        } else {
            onSelect(paper);
        }
    }, [isVelvet, isSelectionMode, paper, toggleFusionSelection, toggleSelection, onSelect]);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('paperId', paper.id.toString());
        e.dataTransfer.effectAllowed = 'move';
        // Add a ghost image or effect if desired
    };

    const handleAuthorClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection
        const newAuthor = prompt("UPDATE ENTITY TAG (AUTHOR):", paper.author);
        if (newAuthor && newAuthor !== paper.author) {
            onEditPaper(paper.id, { author: newAuthor });
        }
    };

    return (
        <motion.div 
            layoutId={`paper-${paper.id}`} // Keeps layout stable
            draggable={!isVelvet && !isSelectionMode} // Enable drag
            onDragStart={handleDragStart}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate={isSelected ? "selected" : "visible"}
            whileHover="hover"
            whileTap="tap"
            onClick={handleClick}
            className={`relative p-5 cursor-pointer group transition-colors duration-100 transform border-2 border-transparent ${
                isSelected ? '' : 'bg-zinc-900 border-zinc-700 text-gray-300'
            }`}
            style={{ 
                clipPath: "polygon(0 0, 98% 0, 100% 5%, 100% 95%, 95% 100%, 2% 98%, 0 90%, 3% 10%)",
                willChange: "transform, opacity" // Hardware acceleration
            }}
        >
            {/* DECORATIVE SPIKE ON HOVER */}
            <div className="absolute -left-10 top-0 bottom-0 w-8 bg-black transform skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
            
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h3 className="font-p5 text-2xl tracking-wide line-clamp-1">{paper.title}</h3>
                    <div className="flex items-center space-x-2 mt-2 opacity-80 font-mono text-xs">
                        <span className="bg-white/20 px-1">{paper.year}</span>
                        {/* 标签化作者名，未来可扩展为点击编辑 */}
                        <span 
                            onClick={handleAuthorClick}
                            className="px-2 py-0.5 border border-white/30 rounded-sm hover:bg-white/10 transition-colors z-20 flex items-center gap-1"
                            title="Click to Edit Entity Tag"
                        >
                            <span className="opacity-50 text-[10px]">TAG:</span>
                            {paper.author === "Unknown Author" || paper.author === "Unknown Entity" ? "UNTAGGED" : paper.author}
                        </span>
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Star className="fill-current" size={24} />
                </div>
            </div>
            {/* SELECTION INDICATOR */}
            {isSelected && <div className="absolute right-2 top-2 text-phantom-red"><Gem size={24} /></div>}
        </motion.div>
    );
}, (prev, next) => {
    // Custom comparison for performance
    return (
        prev.paper.id === next.paper.id && 
        prev.paper.author === next.paper.author && // Check author change
        prev.isSelected === next.isSelected &&
        prev.isSelectionMode === next.isSelectionMode && 
        prev.isVelvet === next.isVelvet
    );
});

const MiddlePane = ({ activeMenu, papers, selectedId, onSelect, onAddPaper, onDeletePaper, onEditPaper, onBulkImport, onBulkDelete, onMovePaper, toggleFusionSelection, fusionTargetIds, isFusing, setIsFusing, setFusionResult, setShowCurtain, onLevelUp, playSfx, requestConfirm }: MiddlePaneProps) => {
    const [inputUrl, setInputUrl] = useState('');
    const [isStealing, setIsStealing] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    
    const isVelvet = activeMenu === 'velvet';
    const isFolderView = activeMenu.startsWith('folder_'); // Detect folder view
    const currentFolderId = isFolderView ? activeMenu.split('folder_')[1] : null;
    
    // Memoize filtering to prevent recalc on every render
    const filteredPapers = React.useMemo(() => papers.filter((p: any) => { 
        if (activeMenu === 'all' || activeMenu === 'velvet') return true; 
        if (activeMenu === 'recent') return true; 
        // Important: Match folder_id (int) with currentFolderId (string)
        if (activeMenu.startsWith('folder_')) return p.folder_id == activeMenu.split('folder_')[1]; 
        return false; 
    }), [papers, activeMenu]);

    const handleSteal = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!inputUrl.trim()) return;
        setIsStealing(true); 
        playSfx('confirm'); 
        try {
            await onAddPaper(inputUrl); 
            setInputUrl(''); 
        } catch (error) {
            console.error('Steal failed:', error);
            playSfx('cancel');
        } finally {
            setIsStealing(false); 
        }
    };

    const toggleSelection = useCallback((id: number) => { 
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); 
        playSfx('click'); 
    }, [playSfx]);

    const executeBulkDelete = () => { 
        requestConfirm(`BURN ${selectedIds.length} INTEL ITEMS?`, () => {
            onBulkDelete(selectedIds); 
            setSelectedIds([]); 
            setIsSelectionMode(false); 
            playSfx('impact'); 
        }, "MASS DESTRUCTION");
    };

    const handleRemoveFromFolder = () => {
        if (!currentFolderId || !onMovePaper) return;
        requestConfirm(`REMOVE ${selectedIds.length} ITEMS FROM MISSION?`, () => {
            selectedIds.forEach(id => onMovePaper(id, null)); // Move to root
            setSelectedIds([]);
            setIsSelectionMode(false);
            playSfx('confirm');
        }, "EXTRACT INTEL");
    };

    const startFusion = () => { 
        setShowCurtain(true); 
        setTimeout(() => { 
            setIsFusing(true); 
            setFusionResult("The twins are converging... Ask me anything about their connection.");
            setShowCurtain(false); 
        }, 600); 
        playSfx('confirm'); 
    };

    return (
        <div className={`h-full flex-1 flex flex-col relative overflow-hidden transition-colors duration-500 ${isVelvet ? 'bg-[#000022]' : 'bg-[#161616]'}`}>
            {/* Hidden Input for File Upload */}
            <input 
                type="file" 
                id="middle-pane-upload"
                multiple 
                className="hidden" 
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        onBulkImport(e.target.files);
                        e.target.value = ''; 
                    }
                }} 
            />

            <div className={`h-24 flex items-center justify-between px-8 relative z-10 border-b-4 shrink-0 transition-colors duration-500 ${isVelvet ? 'bg-[#000033] border-[#D4AF37]' : 'bg-phantom-black border-current'}`}>
                <div className="absolute inset-0 bg-halftone opacity-30" />
                <div className="z-10 flex items-center">
                    <h2 className={`text-4xl font-p5 tracking-wide transform -skew-x-12 uppercase truncate max-w-xs ${isVelvet ? 'text-[#D4AF37]' : ''}`}>
                        {activeMenu === 'add' ? 'INFILTRATION' : activeMenu === 'velvet' ? 'VELVET ROOM' : 'MEMENTOS'}
                    </h2>
                    {isSelectionMode && !isVelvet && <span className="ml-4 bg-phantom-red text-black font-bold px-2 transform -skew-x-12">SELECT MODE</span>}
                </div>
                {!isVelvet && activeMenu !== 'add' && (
                    <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); playSfx('click'); }} className={`z-10 p-2 rounded border-2 transition-all ${isSelectionMode ? 'bg-white text-black border-phantom-red' : 'text-zinc-500 border-zinc-700 hover:text-current'}`}>
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 custom-scrollbar bg-halftone relative">
                {activeMenu !== 'add' ? (
                    // Using normal div instead of AnimatePresence for list to improve performance on large lists
                    // Only animate individual items entering/leaving if really needed, or rely on layout animations
                    <div className="space-y-4">
                    {filteredPapers.map((paper: any, i: number) => { 
                        const isSelected = isVelvet ? fusionTargetIds.includes(paper.id) : (isSelectionMode ? selectedIds.includes(paper.id) : selectedId === paper.id); 
                        return (
                            <PaperRow 
                                key={paper.id}
                                index={i}
                                paper={paper}
                                isSelected={isSelected}
                                isSelectionMode={isSelectionMode}
                                onSelect={onSelect}
                                toggleFusionSelection={toggleFusionSelection}
                                toggleSelection={toggleSelection}
                                isVelvet={isVelvet}
                                onEditPaper={onEditPaper}
                            />
                        );
                    })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-500">
                        <Upload size={80} className="text-phantom-red mb-6 animate-bounce" />
                        <h2 className="text-4xl font-p5 mb-4">DRAG & DROP INTEL</h2>
                        <p className="text-gray-400 max-w-md font-mono mb-8">
                            Target PDFs, Images, or Text Logs.<br/>
                            The system will automatically analyze and index the data.
                        </p>
                        
                        <form onSubmit={handleSteal} className="w-full max-w-md mb-8 flex gap-2">
                            <input 
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="TARGET URL (ARXIV / PDF)..." 
                                disabled={isStealing}
                                className="flex-1 bg-black border-2 border-phantom-red text-white px-4 py-2 font-mono outline-none focus:bg-zinc-900 disabled:opacity-50"
                            />
                            <button 
                                type="submit" 
                                disabled={isStealing || !inputUrl.trim()} 
                                className="relative bg-phantom-red text-black font-bold px-6 py-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                            >
                                {isStealing ? (
                                    <>
                                        <span className="relative z-10">HACKING...</span>
                                        <div className="absolute inset-0 bg-phantom-yellow animate-pulse opacity-50" />
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-white/30" 
                                            style={{
                                                width: '20%',
                                                animation: 'scan 1s linear infinite'
                                            }}
                                        />
                                    </>
                                ) : 'HACK'}
                            </button>
                        </form>

                        <button 
                            onClick={() => document.getElementById('middle-pane-upload')?.click()}
                            className="bg-phantom-red text-white px-8 py-3 text-2xl font-p5 border-4 border-black shadow-[8px_8px_0px_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            SELECT FILES
                        </button>
                    </div>
                )}
            </div>
            
            {isSelectionMode && selectedIds.length > 0 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
                    {isFolderView && (
                        <button onClick={handleRemoveFromFolder} className="bg-zinc-800 text-white text-2xl font-p5 px-8 py-4 border-4 border-gray-500 shadow-[8px_8px_0px_#000] hover:bg-white hover:text-black transition-all flex items-center space-x-3">
                            <Upload className="rotate-180" /><span>EXTRACT ({selectedIds.length})</span>
                        </button>
                    )}
                    <button onClick={executeBulkDelete} className="bg-phantom-red text-white text-2xl font-p5 px-8 py-4 border-4 border-black shadow-[8px_8px_0px_#000] hover:bg-black hover:text-phantom-red transition-all flex items-center space-x-3">
                        <Trash2 /><span>BURN ({selectedIds.length})</span>
                    </button>
                </div>
            )}
            
            {isVelvet && fusionTargetIds.length === 2 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <button onClick={startFusion} className="bg-[#D4AF37] text-black text-3xl font-p5 px-12 py-6 border-4 border-white shadow-[0px_0px_20px_#D4AF37] hover:scale-110 transition-transform flex items-center space-x-3">
                        <Combine size={32} /><span>EXECUTE FUSION</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MiddlePane;