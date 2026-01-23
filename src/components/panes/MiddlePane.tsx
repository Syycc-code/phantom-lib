import { motion } from 'framer-motion';
import { FileText, Clock, Star } from 'lucide-react';

interface Paper {
  id: number;
  title: string;
  author: string;
  year: string;
}

interface MiddlePaneProps {
  papers: Paper[];
  onSelect: (paper: Paper) => void;
  selectedId: number | null;
}

export default function MiddlePane({ papers, onSelect, selectedId }: MiddlePaneProps) {
  return (
    <div className="h-full bg-[#1a1a1a] flex-1 flex flex-col border-r border-zinc-800 relative overflow-hidden">
      {/* Jagged Header */}
      <div className="h-16 bg-phantom-black border-b-2 border-phantom-red flex items-center px-6 relative z-10">
        <div className="absolute inset-0 bg-phantom-red/5 transform skew-x-12 origin-top-left" />
        <h2 className="text-xl font-bold text-white italic tracking-wide z-10">MEMENTOS // LIST</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10 custom-scrollbar">
        {papers.map((paper) => (
          <motion.div
            key={paper.id}
            onClick={() => onSelect(paper)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
              scale: 1.02, 
              x: 5,
              clipPath: "polygon(0 0, 100% 0, 98% 100%, 0% 100%)" // Subtle jagged cut
            }}
            className={`
              relative p-4 cursor-pointer group transition-all duration-200
              ${selectedId === paper.id 
                ? 'bg-phantom-red text-black clip-path-jagged' 
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-l-4 border-transparent hover:border-phantom-red'}
            `}
          >
            {/* Selected Indicator - The "Calling Card" mark */}
            {selectedId === paper.id && (
              <motion.div 
                layoutId="selection-indicator"
                className="absolute -left-1 top-0 bottom-0 w-2 bg-black" 
              />
            )}

            <div className="flex justify-between items-start">
              <h3 className={`font-bold text-lg leading-tight ${selectedId === paper.id ? 'text-black' : 'text-white group-hover:text-phantom-red'}`}>
                {paper.title}
              </h3>
              {selectedId === paper.id && <Star className="w-4 h-4 text-black fill-current animate-spin-slow" />}
            </div>
            
            <div className="mt-2 flex items-center space-x-4 text-xs font-mono opacity-80">
              <span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> PDF</span>
              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {paper.year}</span>
              <span className="uppercase tracking-wider">:: {paper.author}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
