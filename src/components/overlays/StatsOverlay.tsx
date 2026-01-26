/**
 * 统计数据覆盖层组件
 * 显示玩家的5维统计雷达图
 */

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { PhantomStats, PlaySoundFunction } from '../../types';

interface StatsOverlayProps {
  stats: PhantomStats;
  onClose: () => void;
  playSfx: PlaySoundFunction;
}

export const StatsOverlay = ({ stats, onClose, playSfx }: StatsOverlayProps) => {
  const data = [
    { subject: 'Knowledge', A: stats.knowledge, fullMark: 10 }, 
    { subject: 'Guts', A: stats.guts, fullMark: 10 }, 
    { subject: 'Proficiency', A: stats.proficiency, fullMark: 10 }, 
    { subject: 'Kindness', A: stats.kindness, fullMark: 10 }, 
    { subject: 'Charm', A: stats.charm, fullMark: 10 }
  ];

  const currentRank = Math.floor((stats.knowledge + stats.guts + stats.proficiency + stats.kindness + stats.charm) / 5);

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      exit={{ scale: 0.8, opacity: 0 }} 
      className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center" 
      onClick={() => { onClose(); playSfx('cancel'); }}
    >
      <div 
        className="relative w-[600px] h-[600px] bg-[#1a1a1a] border-4 border-phantom-red p-8 shadow-[0_0_50px_#E60012]" 
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-4xl font-p5 text-white mb-8 text-center bg-black border-b-4 border-phantom-red pb-2">
          PHANTOM STATS
        </h2>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'white', fontSize: 14, fontFamily: 'Fjalla One' }} 
              />
              <Radar 
                name="Joker" 
                dataKey="A" 
                stroke="#E60012" 
                strokeWidth={3} 
                fill="#E60012" 
                fillOpacity={0.6} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => { onClose(); playSfx('cancel'); }} 
            className="text-white hover:text-phantom-red"
          >
            <X size={32}/>
          </button>
        </div>
        
        <div className="text-center font-mono text-xs text-gray-500 mt-4">
          CURRENT RANK: {currentRank} // LEGEND
        </div>
      </div>
    </motion.div>
  );
};
