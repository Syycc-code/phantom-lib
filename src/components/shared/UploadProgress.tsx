import { motion, AnimatePresence } from 'framer-motion';

export const UploadProgress = ({ active, current, total }: { active: boolean, current: number, total: number }) => {
    return (
        <AnimatePresence>
            {active && (
                <motion.div 
                    initial={{ y: 100 }} 
                    animate={{ y: 0 }} 
                    exit={{ y: 100 }} 
                    className="fixed bottom-0 left-0 w-full z-[200] pointer-events-none"
                >
                    <div className="bg-phantom-black border-t-4 border-phantom-red p-6 relative overflow-hidden">
                        {/* 半色调背景 */}
                        <div className="absolute inset-0 bg-halftone opacity-20" />
                        
                        {/* 主内容 */}
                        <div className="flex items-center justify-between z-10 relative">
                            {/* 左侧：动画图标 */}
                            <div className="flex items-center space-x-6">
                                {/* P5风格脉冲圆环 */}
                                <div className="relative w-16 h-16">
                                    <motion.div 
                                        className="absolute inset-0 border-4 border-phantom-red rounded-full"
                                        animate={{ 
                                            scale: [1, 1.2, 1],
                                            opacity: [1, 0.5, 1] 
                                        }}
                                        transition={{ 
                                            repeat: Infinity, 
                                            duration: 1.5 
                                        }}
                                    />
                                    <motion.div 
                                        className="absolute inset-2 border-4 border-phantom-yellow rounded-full"
                                        animate={{ 
                                            rotate: 360 
                                        }}
                                        transition={{ 
                                            repeat: Infinity, 
                                            duration: 2,
                                            ease: "linear" 
                                        }}
                                    />
                                    <div className="absolute inset-4 bg-phantom-red rounded-full" />
                                </div>
                                
                                {/* 文字提示 */}
                                <div className="text-white">
                                    <div className="font-p5 text-3xl tracking-widest transform -skew-x-12">
                                        INFILTRATING PALACE
                                    </div>
                                    <div className="text-phantom-yellow font-mono text-lg mt-1">
                                        Target: {current} / {total} Secured
                                    </div>
                                </div>
                            </div>
                            
                            {/* 右侧：进度条 */}
                            <div className="w-96">
                                <div className="h-6 bg-zinc-900 transform -skew-x-12 overflow-hidden border-2 border-white relative">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-phantom-red to-phantom-yellow" 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${(current / total) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                    {/* 扫描线效果 */}
                                    <motion.div 
                                        className="absolute inset-0 bg-white/20 w-1/5"
                                        animate={{ x: ['-100%', '500%'] }}
                                        transition={{ 
                                            repeat: Infinity, 
                                            duration: 1,
                                            ease: "linear" 
                                        }}
                                    />
                                </div>
                                <div className="text-right text-xs text-gray-400 mt-1 font-mono">
                                    {Math.round((current / total) * 100)}% COMPLETE
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
