import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ExternalLink, Maximize2 } from 'lucide-react';

interface Citation {
    index: number;
    text: string;
    source: string;
    page: number;
    bbox: string;
}

interface CitationPreviewProps {
    citation: Citation;
    position: { x: number; y: number };
    onViewFull: () => void;
    onOpenSplit: () => void;
}

export default function CitationPreview({ citation, position, onViewFull, onOpenSplit }: CitationPreviewProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 25
            }}
            className="fixed z-[3500] pointer-events-auto"
            style={{
                left: position.x,
                top: position.y - 20,
                transform: 'translate(-50%, -100%)',
                maxWidth: '500px',
                minWidth: '350px'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => e.stopPropagation()}
        >
            {/* 外发光效果 */}
            <div className="absolute inset-0 bg-phantom-red/30 blur-xl" />
            
            {/* 悬浮窗主体 */}
            <div className="relative bg-[#0a0a0a] border-4 border-phantom-red shadow-[0_0_30px_rgba(230,0,18,0.5),_10px_10px_0px_rgba(0,0,0,0.4)] overflow-hidden">
                {/* 头部 - 增强视觉 */}
                <div className="bg-gradient-to-r from-phantom-red via-phantom-red/90 to-phantom-red p-4 border-b-4 border-black flex items-center gap-3 relative overflow-hidden">
                    {/* 动态背景 */}
                    <motion.div
                        className="absolute inset-0 opacity-10"
                        animate={{
                            backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                            backgroundSize: '200% 200%',
                        }}
                    />
                    
                    <div className="relative w-10 h-10 bg-white/20 border-2 border-white/40 flex items-center justify-center backdrop-blur-sm">
                        <FileText size={20} className="text-white" />
                    </div>
                    <div className="relative flex-1 min-w-0">
                        <p className="text-white font-black text-sm uppercase tracking-wider truncate flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-phantom-yellow text-black text-xs">[{citation.index}]</span>
                            CITATION PREVIEW
                        </p>
                        <p className="text-phantom-yellow text-xs font-bold truncate mt-1">
                            {citation.source} · Page {citation.page}
                        </p>
                    </div>
                </div>

                {/* 引用内容 - 更清晰的排版 */}
                <div className="p-5 bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
                    {/* 装饰性引号 - 更大更明显 */}
                    <div className="text-phantom-red/50 font-serif text-6xl leading-none mb-3 select-none">"</div>
                    
                    {/* 引用文本 - 增强可读性 */}
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-phantom-red via-phantom-yellow to-phantom-red" />
                        <p className="text-white text-base leading-relaxed italic pl-6 pr-2">
                            {citation.text}
                        </p>
                    </div>

                    {/* 操作按钮 - 更明显的分隔 */}
                    <div className="flex gap-3 mt-5 pt-4 border-t-2 border-gray-800">
                        <button
                            onClick={onOpenSplit}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-2 border-gray-600 hover:border-phantom-yellow px-4 py-3 text-sm font-black uppercase tracking-wider transition-all shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:shadow-[4px_4px_0px_rgba(252,236,12,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center gap-2"
                        >
                            <Maximize2 size={16} />
                            Split View
                        </button>
                        <button
                            onClick={onViewFull}
                            className="flex-1 bg-phantom-red hover:bg-phantom-yellow hover:text-black text-white border-2 border-phantom-red/30 hover:border-phantom-red px-4 py-3 text-sm font-black uppercase tracking-wider transition-all shadow-[3px_3px_0px_rgba(230,0,18,0.4)] hover:shadow-[5px_5px_0px_rgba(230,0,18,0.5)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center gap-2"
                        >
                            <ExternalLink size={16} />
                            Full Page
                        </button>
                    </div>
                </div>

                {/* 底部装饰条 - 更宽更明显 */}
                <motion.div 
                    className="h-2 bg-gradient-to-r from-phantom-red via-phantom-yellow to-phantom-red"
                    animate={{
                        opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            {/* 指向箭头 - 更大更明显 */}
            <div className="absolute left-1/2 bottom-0 transform translate-y-full -translate-x-1/2 flex flex-col items-center">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-phantom-red" />
                <div className="w-1 h-2 bg-phantom-red" />
            </div>
        </motion.div>
    );
}
