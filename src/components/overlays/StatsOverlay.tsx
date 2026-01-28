import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Zap, BookOpen, Layers, Share2, Target, BrainCircuit } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import type { PhantomStats, PlaySoundFunction } from '../../types';

interface StatsOverlayProps {
  stats: PhantomStats;
  onClose: () => void;
  playSfx: PlaySoundFunction;
}

// 映射表：属性 -> 描述和图标
const STAT_CONFIG = {
  knowledge: {
    label: "KNOWLEDGE",
    alias: "ACADEMIC INTEL",
    desc: "The depth of your cognitive archive.",
    icon: <BookOpen className="text-blue-400" size={24} />,
    perk: "Unlocks advanced RAG reasoning models.",
    color: "#3b82f6" // Blue
  },
  guts: {
    label: "GUTS",
    alias: "COGNITIVE DEPTH",
    desc: "Courage to face complex theories.",
    icon: <Zap className="text-yellow-400" size={24} />,
    perk: "Allows analysis of larger documents.",
    color: "#eab308" // Yellow
  },
  proficiency: {
    label: "PROFICIENCY",
    alias: "SYSTEM MASTERY",
    desc: "Skill in manipulating the Metaverse.",
    icon: <Layers className="text-purple-400" size={24} />,
    perk: "Speeds up OCR and batch operations.",
    color: "#a855f7" // Purple
  },
  kindness: {
    label: "KINDNESS",
    alias: "ARCHIVE ORG",
    desc: "Care for your cognitive palace.",
    icon: <Target className="text-green-400" size={24} />,
    perk: "Improves folder organization efficiency.",
    color: "#22c55e" // Green
  },
  charm: {
    label: "CHARM",
    alias: "SOCIAL LINK",
    desc: "Ability to influence outside cognition.",
    icon: <Share2 className="text-pink-400" size={24} />,
    perk: "Enhances translation nuance and tone.",
    color: "#ec4899" // Pink
  }
};

export const StatsOverlay = ({ stats, onClose, playSfx }: StatsOverlayProps) => {
  const [hoveredStat, setHoveredStat] = useState<keyof PhantomStats | null>(null);

  const data = [
    { subject: 'Knowledge', key: 'knowledge', A: stats.knowledge, fullMark: 10 }, 
    { subject: 'Guts', key: 'guts', A: stats.guts, fullMark: 10 }, 
    { subject: 'Proficiency', key: 'proficiency', A: stats.proficiency, fullMark: 10 }, 
    { subject: 'Kindness', key: 'kindness', A: stats.kindness, fullMark: 10 }, 
    { subject: 'Charm', key: 'charm', A: stats.charm, fullMark: 10 }
  ];

  const currentRank = Math.floor((stats.knowledge + stats.guts + stats.proficiency + stats.kindness + stats.charm) / 5);
  const activeConfig = hoveredStat ? STAT_CONFIG[hoveredStat] : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-8 backdrop-blur-sm" 
      onClick={() => { onClose(); playSfx('cancel'); }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Moving Stripes Background */}
          <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,#111_25%,#111_50%,transparent_50%,transparent_75%,#111_75%,#111_100%)] bg-[length:40px_40px] opacity-20" />
      </div>

      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl h-[600px] flex bg-zinc-900 border-4 border-phantom-red shadow-[0_0_100px_rgba(230,0,18,0.3)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* --- LEFT PANEL: RADAR CHART --- */}
        <div className="w-1/2 relative bg-black flex flex-col items-center justify-center border-r-4 border-phantom-red/30">
            <div className="absolute top-0 left-0 p-4 z-10">
                <h2 className="text-3xl font-p5 text-white tracking-widest transform -skew-x-12">
                    PHANTOM STATS
                </h2>
                <div className="flex items-center space-x-2 mt-2">
                    <Trophy className="text-phantom-yellow" size={16} />
                    <span className="font-mono text-phantom-yellow text-sm">RANK: {currentRank} // LEGEND</span>
                </div>
            </div>

            <div className="w-full h-[450px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="55%" outerRadius="70%" data={data}>
                        <PolarGrid gridType="polygon" stroke="#333" strokeWidth={2} />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={({ payload, x, y, textAnchor, stroke, radius }) => {
                                const isHovered = hoveredStat === data[payload.index].key;
                                return (
                                    <g 
                                        className="cursor-pointer"
                                        onMouseEnter={() => { setHoveredStat(data[payload.index].key as any); playSfx('hover'); }}
                                        onMouseLeave={() => setHoveredStat(null)}
                                    >
                                        <text
                                            x={x}
                                            y={y}
                                            textAnchor={textAnchor}
                                            fill={isHovered ? "#E60012" : "#FFF"}
                                            fontSize={14}
                                            fontFamily="Fjalla One"
                                            fontWeight="bold"
                                            className="transition-colors duration-200"
                                        >
                                            {payload.value.toUpperCase()}
                                        </text>
                                    </g>
                                );
                            }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                        <Radar 
                            name="Stats" 
                            dataKey="A" 
                            stroke="#E60012" 
                            strokeWidth={3} 
                            fill="#E60012" 
                            fillOpacity={0.6}
                            animationDuration={1000}
                        />
                    </RadarChart>
                </ResponsiveContainer>
                
                {/* Center Image/Icon */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <BrainCircuit size={64} className="text-white animate-pulse" />
                </div>
            </div>
        </div>

        {/* --- RIGHT PANEL: DETAILS --- */}
        <div className="w-1/2 bg-zinc-900 p-12 flex flex-col justify-center relative">
            <button 
                onClick={() => { onClose(); playSfx('cancel'); }} 
                className="absolute top-4 right-4 text-white hover:text-phantom-red hover:rotate-90 transition-all p-2"
            >
                <X size={32}/>
            </button>

            <AnimatePresence mode="wait">
                {activeConfig ? (
                    <motion.div 
                        key={hoveredStat}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center space-x-3 mb-4">
                                {activeConfig.icon}
                                <h3 className="text-xl font-mono text-gray-400 tracking-wider">
                                    {activeConfig.alias}
                                </h3>
                            </div>
                            <h2 
                                className="text-6xl font-p5 text-white transform -skew-x-12"
                                style={{ textShadow: `4px 4px 0 ${activeConfig.color}` }}
                            >
                                {activeConfig.label}
                            </h2>
                        </div>

                        <div className="w-full bg-black h-4 skew-x-[-12deg] border border-gray-700 relative overflow-hidden">
                            <motion.div 
                                className="h-full bg-white"
                                initial={{ width: 0 }}
                                animate={{ width: `${(stats[hoveredStat!] / 10) * 100}%` }}
                                style={{ backgroundColor: activeConfig.color }}
                            />
                        </div>
                        <div className="flex justify-between font-mono text-sm text-gray-400">
                            <span>LEVEL {stats[hoveredStat!]}</span>
                            <span>MAX 10</span>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-gray-700">
                            <div>
                                <h4 className="font-p5 text-lg text-white mb-2">DESCRIPTION</h4>
                                <p className="font-serif text-gray-300 leading-relaxed">
                                    {activeConfig.desc}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-p5 text-lg text-white mb-2">CONFIDANT PERK</h4>
                                <p className="font-mono text-sm text-phantom-yellow">
                                    // {activeConfig.perk}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30"
                    >
                        <Target size={64} className="animate-spin-slow" />
                        <h2 className="text-3xl font-p5 tracking-widest">SELECT A STAT</h2>
                        <p className="font-mono text-sm max-w-xs">
                            Hover over the chart nodes to analyze your cognitive parameters.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
