import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOverlayProps {
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    playSfx: (type: 'click' | 'hover' | 'confirm' | 'cancel' | 'impact') => void;
}

export const ConfirmOverlay = ({ title = "CONFIRMATION", message, onConfirm, onCancel, playSfx }: ConfirmOverlayProps) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => { playSfx('cancel'); onCancel(); }}
        >
            <motion.div 
                initial={{ scale: 0.8, rotateZ: -5 }}
                animate={{ scale: 1, rotateZ: 0 }}
                exit={{ scale: 0.8, rotateZ: 5, opacity: 0 }}
                className="w-full max-w-md bg-white border-4 border-black shadow-[15px_15px_0px_#E60012] relative p-1"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-black text-white p-4 flex justify-between items-center transform -skew-x-6 mx-2 mt-2">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-phantom-red" />
                        <span className="font-p5 tracking-widest text-xl">{title}</span>
                    </div>
                    <X className="cursor-pointer hover:text-phantom-red" onClick={onCancel} />
                </div>

                <div className="p-8 text-center">
                    <h3 className="font-p5 text-3xl mb-2 text-black">{message}</h3>
                    <p className="font-mono text-xs text-gray-500 mb-8 uppercase tracking-widest">Action cannot be undone</p>
                    
                    <div className="flex justify-center gap-6">
                        <button
                            onClick={() => { playSfx('cancel'); onCancel(); }}
                            className="px-6 py-2 border-2 border-black font-bold hover:bg-gray-200 transition-colors transform skew-x-[-10deg]"
                        >
                            <span className="block transform skew-x-[10deg]">DISREGARD</span>
                        </button>
                        <button
                            onClick={() => { playSfx('impact'); onConfirm(); }}
                            className="px-8 py-3 bg-phantom-red text-white font-p5 text-xl border-2 border-black hover:bg-black hover:text-phantom-red transition-all shadow-[4px_4px_0px_#000] transform skew-x-[-10deg]"
                        >
                            <span className="block transform skew-x-[10deg]">EXECUTE</span>
                        </button>
                    </div>
                </div>
                
                {/* Decorative Tapes */}
                <div className="absolute -top-4 -left-4 w-20 h-8 bg-phantom-yellow text-black font-bold text-[10px] flex items-center justify-center transform -rotate-12 shadow-sm z-10 border border-black">
                    CAUTION
                </div>
            </motion.div>
        </motion.div>
    );
};
