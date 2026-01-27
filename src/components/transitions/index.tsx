/**
 * 过渡动画组件
 * 用于显示融合过程的过渡效果
 */

import { motion, AnimatePresence } from 'framer-motion';

interface TransitionCurtainProps {
  isActive: boolean;
}

export const TransitionCurtain = ({ isActive }: TransitionCurtainProps) => (
  <AnimatePresence>
    {isActive && (
      <motion.div 
        initial={{ x: "-100%" }} 
        animate={{ x: 0 }} 
        exit={{ x: "100%" }} 
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} 
        className="fixed inset-0 z-[9999] bg-[#000033] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#D4AF37_20px,#D4AF37_40px)] opacity-10" />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 1.2, opacity: 0 }} 
          className="text-[#D4AF37] font-p5 text-8xl tracking-tighter"
        >
          FUSION IN PROGRESS...
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ShatterEffect = () => (
  <motion.div 
    initial={{ opacity: 1, scale: 1 }} 
    animate={{ opacity: 0, scale: 2 }} 
    transition={{ duration: 0.6 }} 
    className="absolute inset-0 z-50 pointer-events-none mix-blend-overlay"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
      <path d="M0 0 L100 100 L0 100 Z" />
      <path d="M100 0 L0 0 L100 100 Z" />
    </svg>
  </motion.div>
);
