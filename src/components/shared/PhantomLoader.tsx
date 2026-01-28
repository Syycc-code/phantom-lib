import { motion } from 'framer-motion';

interface PhantomLoaderProps {
    message?: string;
    submessage?: string;
}

export const PhantomLoader = ({ message = "LOADING", submessage }: PhantomLoaderProps) => {
    return (
        <div className="h-full w-full flex items-center justify-center bg-black overflow-hidden relative">
            {/* Background: Moving Stripes */}
            <div className="absolute inset-0 opacity-20 transform -skew-x-12 scale-150">
                <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,#333_25%,#333_50%,transparent_50%,transparent_75%,#333_75%,#333_100%)] bg-[length:40px_40px] animate-[slide_2s_linear_infinite]" />
            </div>

            {/* Central Star Animation */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative w-40 h-40 mb-8">
                    {/* Rotating Star Background */}
                    <motion.div
                        className="absolute inset-0 bg-phantom-red"
                        style={{
                            clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                    />
                    
                    {/* Inner Black Star */}
                    <motion.div
                        className="absolute inset-2 bg-black"
                        style={{
                            clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                        }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                    />

                    {/* Core Pulse */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="w-4 h-4 bg-white transform rotate-45 animate-pulse" />
                    </motion.div>

                    {/* Orbiting Particles */}
                    <motion.div 
                        className="absolute inset-[-20px] border-2 border-dashed border-phantom-yellow rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, ease: "linear", repeat: Infinity }}
                    />
                </div>

                {/* Typography: TAKE YOUR TIME Style */}
                <div className="relative">
                    {/* Background Block for Text */}
                    <motion.div 
                        className="absolute -inset-4 bg-black transform -skew-x-12 border-2 border-white"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <motion.h2 
                            className="font-p5 text-5xl text-white tracking-widest whitespace-nowrap"
                            style={{ textShadow: "4px 4px 0 #E60012" }}
                            animate={{ 
                                x: [-2, 2, -2],
                                skewX: [-12, -10, -12]
                            }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                        >
                            {message}
                        </motion.h2>
                        
                        {submessage && (
                            <motion.div 
                                className="mt-2 bg-phantom-yellow px-2 py-1 transform skew-x-12"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <p className="text-black font-bold text-sm tracking-widest uppercase transform -skew-x-12">
                                    {submessage}
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Corner Decoration */}
            <div className="absolute bottom-10 right-10">
                <motion.div 
                    className="text-white font-p5 text-xl opacity-50"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    TAKE YOUR TIME
                </motion.div>
            </div>
        </div>
    );
};
