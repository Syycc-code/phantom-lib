import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal } from 'lucide-react';

interface InputOverlayProps {
    title: string;
    placeholder?: string;
    initialValue?: string;
    onSubmit: (value: string) => void;
    onClose: () => void;
    playSfx: (type: 'click' | 'hover' | 'confirm' | 'cancel') => void;
}

export const InputOverlay = ({ title, placeholder = "", initialValue = "", onSubmit, onClose, playSfx }: InputOverlayProps) => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus input on mount
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            playSfx('confirm');
            onSubmit(value.trim());
        } else {
            playSfx('cancel');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => { playSfx('cancel'); onClose(); }}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20, rotateX: 10 }}
                animate={{ scale: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-zinc-900 border-4 border-phantom-red shadow-[10px_10px_0px_#000] relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-phantom-red p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-black font-p5 text-xl tracking-widest transform -skew-x-12">
                        <Terminal size={24} />
                        <span>{title}</span>
                    </div>
                    <button 
                        onClick={() => { playSfx('cancel'); onClose(); }}
                        className="text-black hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-halftone opacity-10 pointer-events-none" />
                    
                    <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
                        <div className="relative group">
                            <input
                                ref={inputRef}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={placeholder}
                                className="w-full bg-black border-b-2 border-gray-600 text-white font-mono text-2xl py-2 px-4 focus:border-phantom-red outline-none transition-colors placeholder:text-gray-700"
                            />
                            {/* Animated underline effect could go here */}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => { playSfx('cancel'); onClose(); }}
                                className="px-6 py-2 font-p5 text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
                            >
                                Disregard
                            </button>
                            <button
                                type="submit"
                                disabled={!value.trim()}
                                className="px-8 py-3 bg-white text-black font-p5 text-xl uppercase tracking-widest border-2 border-white hover:bg-phantom-red hover:text-white hover:border-phantom-red transition-all shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Execute
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute bottom-2 right-2 text-[10px] font-mono text-phantom-red opacity-50">
                    SYS_INPUT_V2
                </div>
            </motion.div>
        </motion.div>
    );
};
