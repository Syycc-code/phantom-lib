import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BrainCircuit, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';
import { Paper } from '../../api';

interface RightPaneProps {
  paper: Paper | null;
  onClose: () => void;
  onAnalyze: () => void;
}

export default function RightPane({ paper, onClose, onAnalyze }: RightPaneProps) {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeClick = async () => {
    setAnalyzing(true);
    await onAnalyze();
    setAnalyzing(false);
  };

  const hasAnalysis = paper?.shadow_problem;

  return (
    <AnimatePresence>
      {paper && (
        <motion.div
          initial={{ x: "100%", skewX: -10, opacity: 0 }}
          animate={{ x: 0, skewX: 0, opacity: 1 }}
          exit={{ x: "100%", skewX: 10, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-[500px] bg-white h-full shadow-2xl relative z-50 flex flex-col border-l-8 border-phantom-black overflow-hidden"
        >
          {/* Header */}
          <div className="h-48 bg-phantom-red relative overflow-hidden flex items-end p-6 shrink-0">
            <div className="absolute top-0 right-0 p-4 z-20">
               <button onClick={onClose} className="text-black hover:text-white transition-colors">
                 <X size={32} strokeWidth={3} />
               </button>
            </div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <motion.div 
              key={paper.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative z-10"
            >
              <h1 className="text-3xl font-black text-black leading-none uppercase italic transform -rotate-1 origin-bottom-left line-clamp-3">
                {paper.title}
              </h1>
            </motion.div>
          </div>

          {/* Body */}
          <div className="flex-1 p-8 bg-zinc-50 overflow-y-auto custom-scrollbar">
             <div className="space-y-6">
                {/* Metadata Box */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-3 rounded-sm border-l-4 border-gray-400">
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Author</span>
                    <span className="font-bold text-sm">{paper.author}</span>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-sm border-l-4 border-gray-400">
                     <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Year</span>
                     <span className="font-bold text-sm">{paper.year}</span>
                  </div>
                </div>

                {/* Abstract Section */}
                <div className="text-sm text-gray-600 leading-relaxed font-serif italic border-l-2 border-phantom-red pl-4 opacity-80">
                    "{paper.abstract ? paper.abstract.substring(0, 150) + "..." : "No abstract available."}"
                </div>

                {/* ANALYSIS SECTION */}
                {!hasAnalysis ? (
                    <motion.button
                      onClick={handleAnalyzeClick}
                      disabled={analyzing}
                      whileHover={{ scale: 1.02, backgroundColor: "#000", color: "#FCEC0C" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-4 py-6 bg-phantom-red text-white font-black text-xl italic tracking-tighter shadow-lg flex items-center justify-center space-x-3 group relative overflow-hidden clip-path-jagged"
                    >
                      {analyzing ? (
                          <BrainCircuit className="w-8 h-8 animate-spin" />
                      ) : (
                          <>
                            <BrainCircuit className="w-6 h-6 animate-pulse" />
                            <span>ACTIVATE THIRD EYE</span>
                          </>
                      )}
                    </motion.button>
                ) : (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-4 mt-8"
                    >
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="h-1 flex-1 bg-black"></div>
                            <span className="font-black text-xl italic tracking-tighter bg-black text-white px-2 transform -skew-x-12">TRUTH REVEALED</span>
                            <div className="h-1 flex-1 bg-black"></div>
                        </div>

                        {/* CARD 1: SHADOW */}
                        <div className="bg-[#222] text-white p-4 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                             <div className="absolute top-0 right-0 p-2 opacity-20"><AlertTriangle size={48} /></div>
                             <h4 className="text-phantom-red font-bold uppercase tracking-widest text-xs mb-1">The Shadow (Problem)</h4>
                             <p className="font-serif text-lg leading-tight">{paper.shadow_problem}</p>
                        </div>

                        {/* CARD 2: PERSONA */}
                        <div className="bg-[#E60012] text-black p-4 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                             <div className="absolute top-0 right-0 p-2 opacity-20"><Lightbulb size={48} /></div>
                             <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-1">The Persona (Solution)</h4>
                             <p className="font-bold text-lg leading-tight italic">{paper.persona_solution}</p>
                        </div>

                        {/* CARD 3: WEAKNESS */}
                        <div className="bg-white border-4 border-black text-black p-4 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                             <div className="absolute top-0 right-0 p-2 opacity-10"><ShieldAlert size={48} /></div>
                             <h4 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Weakness (Flaw)</h4>
                             <p className="font-mono text-sm leading-tight text-red-600">{paper.weakness_flaw}</p>
                        </div>
                    </motion.div>
                )}
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
