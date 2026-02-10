import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader, Zap, Brain, FileText, Map, BarChart3, Video, Mic2, Presentation, Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StudioLoadingOverlayProps {
    isVisible: boolean;
    toolType: string;
    toolName: string;
}

const toolIcons: Record<string, any> = {
    mindmap: Map,
    infomap: BarChart3,
    report: FileText,
    flashcards: Sparkles,
    poster: Lightbulb,
    presentation: Presentation,
    audio: Mic2,
    video: Video,
};

const loadingSteps = [
    { label: 'Analyzing context...', icon: Brain, duration: 1500 },
    { label: 'Processing information...', icon: Zap, duration: 2000 },
    { label: 'Generating content...', icon: Sparkles, duration: 2500 },
    { label: 'Finalizing...', icon: Loader, duration: 1000 },
];

export default function StudioLoadingOverlay({ isVisible, toolType, toolName }: StudioLoadingOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const ToolIcon = toolIcons[toolType] || Sparkles;

    useEffect(() => {
        if (!isVisible) {
            setCurrentStep(0);
            setProgress(0);
            return;
        }

        // Step progression
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => {
                if (prev < loadingSteps.length - 1) {
                    return prev + 1;
                }
                return prev;
            });
        }, 2000);

        // Smooth progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev < 95) {
                    return prev + 1;
                }
                return prev;
            });
        }, 80);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-[#0f0f0f] border-4 border-phantom-red/60 shadow-[0_0_50px_rgba(230,0,18,0.5)] max-w-2xl w-full mx-8 overflow-hidden"
                    >
                        {/* Header with Phantom Thieves style */}
                        <div className="relative bg-gradient-to-r from-phantom-red to-phantom-red/80 p-6 border-b-4 border-black overflow-hidden">
                            {/* Animated background pattern */}
                            <motion.div
                                className="absolute inset-0 opacity-10"
                                animate={{
                                    backgroundPosition: ['0% 0%', '100% 100%'],
                                }}
                                transition={{
                                    duration: 20,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                                style={{
                                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                                    backgroundSize: '200% 200%',
                                }}
                            />
                            
                            <div className="relative flex items-center gap-4">
                                <motion.div
                                    className="w-16 h-16 bg-white/20 border-2 border-white/40 flex items-center justify-center backdrop-blur-sm"
                                    animate={{
                                        rotate: [0, 360],
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                                        scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                                    }}
                                >
                                    <ToolIcon className="text-white" size={32} />
                                </motion.div>
                                <div className="flex-1">
                                    <h2 className="text-3xl font-black uppercase tracking-wider text-white mb-1">
                                        GENERATING
                                    </h2>
                                    <p className="text-white/90 text-lg font-bold">{toolName}</p>
                                </div>
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                >
                                    <Sparkles className="text-phantom-yellow" size={40} />
                                </motion.div>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="p-8 space-y-6">
                            {loadingSteps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isActive = index === currentStep;
                                const isCompleted = index < currentStep;

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.2 }}
                                        className="flex items-center gap-4"
                                    >
                                        <motion.div
                                            className={`w-12 h-12 border-2 flex items-center justify-center transition-all ${
                                                isCompleted
                                                    ? 'bg-green-500 border-green-400'
                                                    : isActive
                                                    ? 'bg-phantom-red border-phantom-red animate-pulse'
                                                    : 'bg-gray-800 border-gray-700'
                                            }`}
                                            animate={isActive ? {
                                                scale: [1, 1.1, 1],
                                            } : {}}
                                            transition={{
                                                duration: 1,
                                                repeat: isActive ? Infinity : 0,
                                            }}
                                        >
                                            {isCompleted ? (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-white"
                                                >
                                                    ✓
                                                </motion.div>
                                            ) : (
                                                <StepIcon
                                                    className={`${
                                                        isActive ? 'text-white' : 'text-gray-500'
                                                    }`}
                                                    size={20}
                                                />
                                            )}
                                        </motion.div>
                                        <div className="flex-1">
                                            <p
                                                className={`font-bold uppercase tracking-wide transition-colors ${
                                                    isCompleted
                                                        ? 'text-green-400'
                                                        : isActive
                                                        ? 'text-white'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                {step.label}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Progress Bar */}
                        <div className="px-8 pb-8">
                            <div className="relative h-3 bg-gray-800 border-2 border-gray-700 overflow-hidden">
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-phantom-red via-phantom-yellow to-phantom-red"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                                {/* Shine effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    animate={{
                                        x: ['-100%', '200%'],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                    style={{ width: '50%' }}
                                />
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-xs text-gray-500 font-bold uppercase">Processing...</span>
                                <span className="text-xs text-phantom-yellow font-bold">{progress}%</span>
                            </div>
                        </div>

                        {/* Bottom accent */}
                        <motion.div
                            className="h-2 bg-gradient-to-r from-phantom-red via-phantom-yellow to-phantom-red"
                            animate={{
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
