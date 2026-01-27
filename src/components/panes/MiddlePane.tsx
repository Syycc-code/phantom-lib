import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Combine, Star, Gem, Upload } from 'lucide-react';

interface MiddlePaneProps {
    activeMenu: string;
    papers: any[]; // Todo: Fix type
    selectedId: number | null;
    onSelect: (paper: any) => void;
    onAddPaper: (url: string) => void;
    onDeletePaper: (id: number, e: React.MouseEvent) => void;
    onBulkImport: (files: FileList) => void;
    onBulkDelete: (ids: number[]) => void;
    toggleFusionSelection: (id: number) => void;
    fusionTargetIds: number[];
    isFusing: boolean;
    setIsFusing: (v: boolean) => void;
    setFusionResult: (v: string | null) => void;
    fusionResult: string | null;
    showCurtain: boolean;
    setShowCurtain: (v: boolean) => void;
    onLevelUp: (stat: string) => void;
    playSfx: (type: any) => void;
}

const MiddlePane = ({ activeMenu, papers, selectedId, onSelect, onAddPaper, onDeletePaper, onBulkImport, onBulkDelete, toggleFusionSelection, fusionTargetIds, isFusing, setIsFusing, setFusionResult, setShowCurtain, onLevelUp, playSfx }: MiddlePaneProps) => {
    const [inputUrl, setInputUrl] = useState('');
    const [isStealing, setIsStealing] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    
    const isVelvet = activeMenu === 'velvet';
    
    const filteredPapers = papers.filter((p: any) => { 
        if (activeMenu === 'all' || activeMenu === 'velvet') return true; 
        if (activeMenu === 'recent') return true; // Todo: filter recent
        if (activeMenu.startsWith('folder_')) return p.folderId === activeMenu.split('folder_')[1]; 
        return false; 
    });

    const handleSteal = (e: React.FormEvent) => { 
        e.preventDefault(); 
        setIsStealing(true); 
        playSfx('confirm'); 
        setTimeout(() => { 
            onAddPaper(inputUrl); 
            setInputUrl(''); 
            setIsStealing(false); 
        }, 1000); 
    };

    const toggleSelection = (id: number) => { 
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); 
        playSfx('click'); 
    };

    const executeBulkDelete = () => { 
        if (window.confirm(`BURN ${selectedIds.length} INTEL ITEMS?`)) { 
            onBulkDelete(selectedIds); 
            setSelectedIds([]); 
            setIsSelectionMode(false); 
            playSfx('impact'); 
        } 
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

    // JUICY INTERACTION VARIANTS
    const cardVariants = {
        hidden: { opacity: 0, x: -50, rotateX: 90 },
        visible: (i: number) => ({ 
            opacity: 1, 
            x: 0, 
            rotateX: 0,
            transition: { delay: i * 0.05, type: "spring" }
        }),
        hover: { 
            scale: 1.05, 
            x: 30,
            skewX: 0,
            backgroundColor: "#FFFFFF",
            color: "#000000",
            boxShadow: "20px 0px 0px #E60012, 8px 8px 0px rgba(0,0,0,0.8)",
            zIndex: 10,
            transition: { duration: 0.1 }
        },
        tap: { scale: 0.95, x: 10, skewX: 0 },
        selected: { 
            x: 30, 
            backgroundColor: "#000", 
            color: "#E60012",
            borderLeftWidth: "16px",
            borderColor: "#E60012",
            skewX: -5
        }
    };

    return (
        <div className={`h-full flex-1 flex flex-col relative overflow-hidden transition-colors duration-500 ${isVelvet ? 'bg-[#000022]' : 'bg-[#161616]'}`}>
            {/* Hidden Input for File Upload - Kept mounted at all times */}
            <input 
                type="file" 
                id="middle-pane-upload"
                multiple 
                className="hidden" 
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        onBulkImport(e.target.files);
                        e.target.value = ''; // Reset to allow re-uploading same file
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
                    <AnimatePresence>
                    {filteredPapers.map((paper: any, i: number) => { 
                        const isSelected = isVelvet ? fusionTargetIds.includes(paper.id) : (isSelectionMode ? selectedIds.includes(paper.id) : selectedId === paper.id); 
                        return (
                            <motion.div 
                                key={paper.id} 
                                layoutId={`paper-${paper.id}`}
                                custom={i}
                                variants={cardVariants}
                                initial="hidden"
                                animate={isSelected ? "selected" : "visible"}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => isVelvet ? toggleFusionSelection(paper.id) : (isSelectionMode ? toggleSelection(paper.id) : onSelect(paper))} 
                                className={`relative p-5 cursor-pointer group transition-colors duration-100 transform border-2 border-transparent ${
                                    isSelected ? '' : 'bg-zinc-900 border-zinc-700 text-gray-300'
                                }`}
                                style={{ clipPath: "polygon(0 0, 98% 0, 100% 5%, 100% 95%, 95% 100%, 2% 98%, 0 90%, 3% 10%)" }}
                            >
                                {/* DECORATIVE SPIKE ON HOVER */}
                                <div className="absolute -left-10 top-0 bottom-0 w-8 bg-black transform skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <h3 className="font-p5 text-2xl tracking-wide line-clamp-1">{paper.title}</h3>
                                        <div className="flex items-center space-x-2 mt-2 opacity-80 font-mono text-xs">
                                            <span className="bg-white/20 px-1">{paper.year}</span>
                                            <span>// {paper.author}</span>
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
                    })}
                    </AnimatePresence>
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
                                className="flex-1 bg-black border-2 border-phantom-red text-white px-4 py-2 font-mono outline-none focus:bg-zinc-900"
                            />
                            <button type="submit" disabled={isStealing} className="bg-phantom-red text-black font-bold px-4 hover:bg-white transition-colors">
                                {isStealing ? 'STEALING...' : 'HACK'}
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
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
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
