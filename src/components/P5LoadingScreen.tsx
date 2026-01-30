import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function P5LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9999] bg-phantom-red overflow-hidden flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
            
            {/* Main Content Container with Skew */}
            <div className="relative z-10 transform -skew-x-12">
                {/* Big Text */}
                <motion.h1 
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="text-8xl font-p5 text-white bg-black px-8 py-2 mb-2 shadow-[10px_10px_0px_rgba(0,0,0,0.5)]"
                >
                    PHANTOM
                </motion.h1>
                <motion.h1 
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: "circOut" }}
                    className="text-6xl font-p5 text-black bg-white px-8 py-2 shadow-[10px_10px_0px_rgba(0,0,0,0.5)]"
                >
                    LIBRARY
                </motion.h1>
            </div>

            {/* Loading Status */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 flex flex-col items-center"
            >
                <div className="flex items-center space-x-3 bg-black text-white px-6 py-2 rounded-full border-2 border-white transform -skew-x-6">
                    <Loader2 className="animate-spin" />
                    <span className="font-bold tracking-widest text-sm font-mono">
                        ESTABLISHING SECURE CONNECTION...
                    </span>
                </div>
                
                {/* Decorative Stars */}
                <div className="mt-8 flex space-x-2">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            animate={{ 
                                scale: [1, 1.5, 1],
                                rotate: [0, 180, 360] 
                            }}
                            transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                delay: i * 0.3 
                            }}
                            className="w-4 h-4 bg-white clip-path-star"
                            style={{ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Bottom Right "Take Your Time" */}
            <div className="absolute bottom-8 right-8 animate-pulse">
                <div className="transform rotate-[-10deg] bg-black text-white px-4 py-1 font-p5 text-2xl border-2 border-white">
                    LOADING...
                </div>
            </div>
        </div>
    );
}
