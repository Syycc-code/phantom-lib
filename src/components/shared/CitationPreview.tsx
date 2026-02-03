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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[3000] pointer-events-auto"
            style={{
                left: position.x,
                top: position.y - 10,
                transform: 'translate(-50%, -100%)',
                maxWidth: '400px'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* 悬浮窗主体 */}
            <div className="bg-[#0a0a0a] border-2 border-phantom-red/60 shadow-[8px_8px_0px_rgba(230,0,18,0.3)] overflow-hidden">
                {/* 头部 */}
                <div className="bg-phantom-red/90 p-3 border-b-2 border-gray-800 flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 border border-white/30 flex items-center justify-center">
                        <FileText size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-xs uppercase tracking-wider truncate">
                            Citation [{citation.index}]
                        </p>
                        <p className="text-white/70 text-[10px] truncate">
                            {citation.source} · p.{citation.page}
                        </p>
                    </div>
                </div>

                {/* 引用内容 */}
                <div className="p-4 bg-[#0f0f0f]">
                    {/* 装饰性引号 */}
                    <div className="text-phantom-red/40 font-serif text-4xl leading-none mb-2">"</div>
                    
                    {/* 引用文本 */}
                    <p className="text-white text-sm leading-relaxed italic pl-4 border-l-2 border-phantom-red/40 mb-3">
                        {citation.text}
                    </p>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={onOpenSplit}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center gap-2"
                        >
                            <Maximize2 size={14} />
                            Split View
                        </button>
                        <button
                            onClick={onViewFull}
                            className="flex-1 bg-phantom-red/90 hover:bg-phantom-red text-white border border-phantom-red/30 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[3px_3px_0px_rgba(230,0,18,0.4)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center gap-2"
                        >
                            <ExternalLink size={14} />
                            Full Page
                        </button>
                    </div>
                </div>

                {/* 底部装饰条 */}
                <div className="h-1 bg-gradient-to-r from-phantom-red/60 via-phantom-yellow/60 to-phantom-red/60" />
            </div>

            {/* 指向箭头 */}
            <div className="absolute left-1/2 bottom-0 transform translate-y-full -translate-x-1/2">
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-phantom-red/60" />
            </div>
        </motion.div>
    );
}
