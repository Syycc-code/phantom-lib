/**
 * 等级提升通知组件
 * 显示统计数据提升的动画通知
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react';

interface RankUpNotificationProps {
  stat: string | null;
}

export const RankUpNotification = ({ stat }: RankUpNotificationProps) => (
  <AnimatePresence>
    {stat && (
      <div className="fixed top-20 right-20 z-[9999] pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.5 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: -50 }} 
          className="relative"
        >
          <Music className="text-phantom-yellow w-12 h-12 absolute -top-8 -left-8 animate-bounce" />
          <div className="bg-black border-2 border-phantom-red text-white p-4 font-p5 text-2xl shadow-[8px_8px_0px_#E60012] transform -skew-x-12">
            {stat.toUpperCase()} UP!
          </div>
          <div className="text-phantom-yellow font-mono text-sm mt-1 bg-black inline-block px-1">
            RANK INCREASED
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
