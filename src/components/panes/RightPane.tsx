import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Loader2 } from 'lucide-react';
import { NoteEditor } from '../shared/NoteEditor';

interface RightPaneProps {
    paper: any; // Todo: Fix type
    onClose: () => void;
    onAnalyze: () => void;
    onRead: () => void;
    playSfx: (type: any) => void;
    onSaveNote: (content: string) => Promise<void>;
    onEditPaper?: (id: number, data: { title?: string, author?: string }) => void; // NEW PROP
}

const RightPane = ({ paper, onClose, onAnalyze, onRead, playSfx, onSaveNote, onEditPaper }: RightPaneProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  
  const handleAnalyze = async () => { 
      setAnalyzing(true); 
      await onAnalyze(); 
      setAnalyzing(false); 
  };

  const handleAuthorClick = () => {
      if (!onEditPaper) return;
      const newAuthor = prompt("UPDATE ENTITY TAG (AUTHOR):", paper.author);
      if (newAuthor && newAuthor !== paper.author) {
          onEditPaper(paper.id, { author: newAuthor });
      }
  };

  return (
    <AnimatePresence>
        {paper && (
            <motion.div 
                initial={{ x: "100%", skewX: -20 }} 
                animate={{ x: 0, skewX: 0 }} 
                exit={{ x: "100%", skewX: 20 }} 
                transition={{ type: "spring", bounce: 0, duration: 0.4 }} 
                className="w-[600px] max-w-[50vw] min-w-[400px] bg-white h-full shadow-[-20px_0_40px_rgba(0,0,0,0.5)] relative z-50 flex border-l-[12px] border-phantom-black"
            >
                {/* Main Content (Full Width) */}
                <div className="flex-1 flex flex-col h-full border-r-2 border-black">
                    <div className="h-64 bg-phantom-red relative overflow-hidden flex items-end p-8 shrink-0 clip-path-jagged">
                        <div className="absolute inset-0 bg-halftone opacity-20 mix-blend-overlay" />
                        <button onClick={() => { onClose(); playSfx('cancel'); }} className="absolute top-4 right-4 text-black hover:text-white hover:rotate-90 transition-transform z-20">
                            <X size={40} strokeWidth={4} />
                        </button>
                        <motion.h1 
                            key={paper.id} 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            className="text-5xl font-p5 text-black leading-[0.9] transform -rotate-1 origin-bottom-left"
                        >
                            {paper.title}
                        </motion.h1>
                    </div>
                    
                    <div className="flex-1 p-10 bg-zinc-100 overflow-y-auto">
                        <div className="space-y-8">
                            <div className="border-b-2 border-black pb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex space-x-4 font-mono text-sm">
                                        <div 
                                            onClick={handleAuthorClick}
                                            className={`bg-black text-white px-3 py-1 transform -skew-x-12 cursor-pointer hover:bg-phantom-red transition-colors flex items-center gap-2`}
                                            title="Click to Edit"
                                        >
                                            <span className="opacity-50 text-[10px]">TAG:</span>
                                            {paper.author === "Unknown Author" || paper.author === "Unknown Entity" ? "UNTAGGED" : paper.author}
                                        </div>
                                        <div className="bg-black text-white px-3 py-1 transform -skew-x-12">TYPE: {paper.type}</div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <motion.button 
                                            onClick={() => { onRead(); playSfx('confirm'); }} 
                                            whileHover={{ scale: 1.1, rotate: 3 }} 
                                            whileTap={{ scale: 0.9 }} 
                                            className="flex items-center space-x-2 bg-phantom-red text-white px-4 py-2 font-p5 text-xl tracking-widest border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-black hover:text-phantom-red transition-all"
                                        >
                                            <Eye size={20} /> <span>READ</span>
                                        </motion.button>
                                    </div>
                                </div>
                                {paper.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {paper.tags.map((tag: string, i: number) => (
                                            <span key={i} className={`font-p5 text-lg px-3 py-1 transform -skew-x-12 border-2 border-black ${i % 2 === 0 ? 'bg-phantom-yellow text-black' : 'bg-transparent text-black'}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                {!paper.shadow_problem ? (
                                    <div className="p-6 border-4 border-dashed border-gray-400 text-center">
                                        <p className="font-p5 text-2xl text-gray-400 mb-4">UNKOWN COGNITION</p>
                                    <motion.button 
                                        onClick={handleAnalyze} 
                                        disabled={analyzing} 
                                        whileHover={{ scale: 1.05 }} 
                                        whileTap={{ scale: 0.95 }} 
                                        className="bg-black text-white font-p5 text-xl px-6 py-3 border-2 border-phantom-red shadow-[4px_4px_0px_#E60012] flex items-center justify-center mx-auto space-x-2"
                                    >
                                        {analyzing ? <Loader2 className="animate-spin" /> : <Eye className="text-phantom-red" />}
                                        <span>ACTIVATE THIRD EYE</span>
                                    </motion.button>
                                </div>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="bg-black text-white p-4 transform skew-x-[-2deg] shadow-lg border-l-4 border-phantom-red">
                                        <h3 className="font-p5 text-xl text-phantom-red mb-2">SHADOW (PROBLEM)</h3>
                                        <p className="font-mono text-sm leading-relaxed">{paper.shadow_problem}</p>
                                    </div>
                                    <div className="bg-white border-2 border-black p-4 transform skew-x-[1deg] shadow-lg">
                                        <h3 className="font-p5 text-xl text-black mb-2">PERSONA (SOLUTION)</h3>
                                        <p className="font-mono text-sm leading-relaxed">{paper.persona_solution}</p>
                                    </div>
                                    <div className="bg-zinc-800 text-gray-300 p-4 transform skew-x-[-1deg] shadow-lg border-r-4 border-phantom-blue">
                                        <h3 className="font-p5 text-xl text-phantom-blue mb-2">WEAKNESS (FLAW)</h3>
                                        <p className="font-mono text-sm leading-relaxed">{paper.weakness_flaw}</p>
                                    </div>
                                    {/* Re-Analyze Button (Optional, for re-running) */}
                                    <button onClick={handleAnalyze} className="text-xs text-gray-400 hover:text-black underline w-full text-center">
                                        {analyzing ? "Recalibrating..." : "Recalibrate Analysis"}
                                    </button>
                                </motion.div>
                            )}
                            </div>
                            
                            <div className="mt-8 pt-8 border-t-2 border-black">
                                <h3 className="font-p5 text-2xl mb-4">ABSTRACT</h3>
                                <p className="font-serif text-lg leading-relaxed text-gray-800">{paper.abstract}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};

export default RightPane;
