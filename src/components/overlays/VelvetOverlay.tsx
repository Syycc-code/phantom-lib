import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Paper, PlaySoundFunction } from '../../types';

interface ShatterEffectProps {}

export const ShatterEffect = () => (
    <motion.div initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 2 }} transition={{ duration: 0.6 }} className="absolute inset-0 z-50 pointer-events-none mix-blend-overlay">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
            <path d="M0 0 L100 100 L0 100 Z" />
            <path d="M100 0 L0 0 L100 100 Z" />
        </svg>
    </motion.div>
);

interface VelvetOverlayProps {
    papers: Paper[];
    onComplete: (result: string) => void;
    onLevelUp: (stat: string) => void;
    playSfx: PlaySoundFunction;
}

export const VelvetOverlay = ({ papers, onComplete, onLevelUp, playSfx }: VelvetOverlayProps) => {
    const [step, setStep] = useState(0); 
    useEffect(() => {
        const timer1 = setTimeout(() => { setStep(1); playSfx('impact'); }, 500); 
        const timer2 = setTimeout(() => setStep(2), 800); 
        const fuse = async () => { 
            try { 
                const minTime = new Promise(resolve => setTimeout(resolve, 1500)); 
                const apiCall = fetch('/api/fuse', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ 
                        title_a: papers[0].title, 
                        text_a: papers[0].content || papers[0].abstract, 
                        title_b: papers[1].title, 
                        text_b: papers[1].content || papers[1].abstract 
                    }) 
                }).then(res => res.json()); 
                const [_, data] = await Promise.all([minTime, apiCall]); 
                const finalResult = data.result || "【数据丢失】\n融合成功，但未收到预报。\n请检查后端连接。"; 
                onComplete(finalResult); 
                onLevelUp('charm'); 
            } catch (e) { 
                setTimeout(() => onComplete("【仪式失败】\n\n无法连接到天鹅绒房间。"), 3000); 
            } 
        };
        fuse(); 
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);
    
    return (
        <div className="fixed inset-0 z-[200] bg-[#000033] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle,_#000066_1px,_transparent_1px)] bg-[length:20px_20px] opacity-30" />
            <div className="relative z-10 flex space-x-20 mt-32">
                {papers.map((p, i) => (
                    <motion.div key={p.id} initial={{ y: 500, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-64 h-80 bg-white border-4 border-[#D4AF37] p-4 flex flex-col items-center justify-center text-center shadow-[0_0_50px_#D4AF37]">
                        <div className="text-black font-p5 text-xl">{p.title.substring(0, 30)}...</div>
                        {step < 2 && (
                            <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} className="absolute -top-64 left-1/2 w-2 h-64 bg-black z-20" />
                        )}
                    </motion.div>
                ))}
            </div>
            <motion.div initial={{ y: "-100vh" }} animate={step >= 1 ? { y: "0" } : { y: "-100vh" }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 2 }} className="absolute top-0 left-0 right-0 h-[80vh] z-30 flex justify-center items-end">
                <div className="w-full h-full bg-[#000033] border-b-[20px] border-[#D4AF37] shadow-[0_50px_100px_#000] relative flex items-end justify-center pb-10">
                    <div className="absolute bottom-[-10px] w-full h-4 bg-red-600 shadow-[0_0_20px_red]" />
                    <div className="text-[#D4AF37] font-p5 text-[20rem] leading-none opacity-20 tracking-tighter">V</div>
                </div>
            </motion.div>
            {step === 2 && (
                <>
                    <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-white z-50" />
                    <ShatterEffect />
                </>
            )}
        </div>
    );
};
