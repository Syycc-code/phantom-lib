import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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
                    <div className="bg-phantom-black border-t-4 border-phantom-red p-4 flex items-center justify-between relative overflow-hidden">
                        <div className="absolute inset-0 bg-halftone opacity-20" />
                        <div className="flex items-center space-x-4 z-10">
                            <Loader2 className="animate-spin text-phantom-red w-8 h-8" />
                            <div className="text-white font-p5 text-2xl tracking-widest">
                                INFILTRATING TARGETS... {current} / {total}
                            </div>
                        </div>
                        <div className="h-4 bg-zinc-800 w-96 transform -skew-x-12 overflow-hidden border-2 border-white">
                            <motion.div 
                                className="h-full bg-phantom-red" 
                                initial={{ width: 0 }} 
                                animate={{ width: `${(current / total) * 100}%` }} 
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
