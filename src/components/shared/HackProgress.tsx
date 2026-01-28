import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Zap } from 'lucide-react';

interface HackProgressProps {
    show: boolean;
    stage: 'download' | 'ocr' | 'analyze' | 'complete';
    message?: string;
}

export const HackProgress = ({ show, stage, message }: HackProgressProps) => {
    const stages = [
        { key: 'download', label: 'DOWNLOADING', icon: Zap },
        { key: 'ocr', label: 'SCANNING', icon: FileText },
        { key: 'analyze', label: 'ANALYZING', icon: FileText },
        { key: 'complete', label: 'COMPLETE', icon: Zap }
    ];
    
    const currentIndex = stages.findIndex(s => s.key === stage);
    
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-24 right-8 z-[150] w-80 bg-black border-4 border-phantom-red shadow-[8px_8px_0px_rgba(230,0,18,0.5)]"
                >
                    {/* Header */}
                    <div className="bg-phantom-red p-3 flex items-center justify-between">
                        <span className="font-p5 text-xl text-black tracking-wider">HACKING TARGET</span>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="w-6 h-6 border-4 border-black border-t-transparent rounded-full"
                        />
                    </div>
                    
                    {/* Progress Stages */}
                    <div className="p-4 space-y-3">
                        {stages.map((s, index) => {
                            const Icon = s.icon;
                            const isActive = index === currentIndex;
                            const isComplete = index < currentIndex;
                            
                            return (
                                <div 
                                    key={s.key}
                                    className={`flex items-center space-x-3 transition-all ${
                                        isActive ? 'scale-105' : 'scale-100'
                                    }`}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center border-2 ${
                                        isComplete ? 'bg-phantom-yellow border-phantom-yellow' :
                                        isActive ? 'bg-phantom-red border-phantom-red animate-pulse' :
                                        'bg-zinc-800 border-zinc-700'
                                    }`}>
                                        <Icon size={16} className={
                                            isComplete ? 'text-black' :
                                            isActive ? 'text-white' :
                                            'text-gray-500'
                                        } />
                                    </div>
                                    <span className={`font-p5 text-sm tracking-wider ${
                                        isComplete ? 'text-phantom-yellow' :
                                        isActive ? 'text-white' :
                                        'text-gray-600'
                                    }`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Current Message */}
                    {message && (
                        <div className="px-4 pb-4">
                            <div className="bg-zinc-900 p-2 border-l-2 border-phantom-yellow">
                                <p className="text-xs text-gray-400 font-mono">{message}</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
