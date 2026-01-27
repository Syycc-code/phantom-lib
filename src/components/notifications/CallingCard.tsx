import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface CallingCardProps {
    show: boolean;
    onComplete: () => void;
    title?: string;
    message?: string;
}

export const CallingCard = ({ show, onComplete, title = "TAKE YOUR TIME", message = "MISSION ACCOMPLISHED" }: CallingCardProps) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onComplete, 3000); // Show for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <motion.div 
                        initial={{ scale: 0, rotate: -720, y: 500 }}
                        animate={{ scale: 1, rotate: -15, y: 0 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                        className="relative w-[500px] h-[300px] bg-phantom-red border-4 border-black shadow-[20px_20px_0px_#fff]"
                        style={{ clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0% 100%)" }}
                    >
                        {/* Inner Decoration */}
                        <div className="absolute inset-4 border-2 border-black border-dashed flex flex-col items-center justify-center p-6 text-center transform skew-x-12">
                            <motion.h2 
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="font-p5 text-6xl text-white drop-shadow-[4px_4px_0px_#000] mb-2 leading-none"
                            >
                                {title}
                            </motion.h2>
                            <div className="w-full h-1 bg-black mb-4"></div>
                            <p className="font-p5 text-2xl text-black bg-white px-2 transform -skew-x-12 inline-block shadow-[4px_4px_0px_#000]">
                                {message}
                            </p>
                            
                            {/* Logo / Icon Placeholder */}
                            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-black rounded-full flex items-center justify-center border-4 border-white">
                                <span className="text-phantom-red font-p5 text-4xl">P</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
