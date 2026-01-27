import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Move, SplitSquareHorizontal, Send } from 'lucide-react';
import type { Paper, ChatMessage, PlaySoundFunction } from '../../types';

interface FusionWorkspaceProps {
    paperA: Paper;
    paperB: Paper;
    initialReport: string;
    onClose: () => void;
    playSfx: PlaySoundFunction;
}

const PaperView = ({ paper, label }: { paper: Paper, label: string }) => (
    <div className="flex-1 flex flex-col border-r-4 border-[#D4AF37] bg-zinc-100 relative overflow-hidden h-full">
        <div className="bg-[#000033] text-[#D4AF37] p-3 font-p5 text-xl flex justify-between items-center px-4 shrink-0 shadow-md z-10 border-b border-[#D4AF37]">
            <span className="truncate max-w-[70%]">{label}: {paper.title}</span>
            <span className="text-xs font-mono opacity-80">{paper.author}</span>
        </div>
        <div className="flex-1 bg-gray-200">
            <iframe 
               src={paper.fileUrl} 
               className="w-full h-full border-none"
               title={label}
            />
        </div>
    </div>
);

export const FusionWorkspace = ({ paperA, paperB, initialReport, onClose, playSfx }: FusionWorkspaceProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, role: 'igor', content: initialReport }]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => { 
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, [messages]);
    
    const handleSend = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!input.trim()) return; 
        playSfx('click'); 
        const userMsg = input; 
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userMsg }]); 
        setInput(""); 
        setIsTyping(true); 
        try { 
            const context = `PAPER A: ${paperA.title}\n${paperA.content || paperA.abstract}\n\nPAPER B: ${paperB.title}\n${paperB.content || paperB.abstract}`; 
            const prompt = `Context:\n${context}\n\nUser Question: ${userMsg}\n\nAnswer as Igor. Compare them.`; 
            const response = await fetch('/api/mind_hack', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ text: prompt, mode: 'decipher' }) 
            }); 
            const data = await response.json(); 
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'igor', content: data.result }]); 
        } catch (e) { 
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'igor', content: "My apologies. Link severed." }]); 
        } finally { 
            setIsTyping(false); 
        } 
    };
    
    return (
        <div className="fixed inset-0 z-[250] bg-[#000022] flex flex-col text-white">
            <div className="h-16 bg-[#000033] border-b-4 border-[#D4AF37] flex items-center justify-between px-6 shadow-xl z-20 shrink-0">
                <div className="flex items-center space-x-2 text-[#D4AF37]">
                    <SplitSquareHorizontal />
                    <h2 className="font-p5 text-2xl tracking-widest">FUSION RESULT // TWIN COGNITION</h2>
                </div>
                <button onClick={() => { onClose(); playSfx('cancel'); }} className="bg-[#D4AF37] text-black px-4 py-1 font-bold hover:bg-white transition-colors flex items-center gap-2">
                    <X size={20} /> EXIT FUSION
                </button>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
                <PaperView paper={paperA} label="ARCANA A" />
                <PaperView paper={paperB} label="ARCANA B" />
                <motion.div drag dragMomentum={false} initial={{ y: 100, x: "-50%", left: "50%" }} animate={{ y: 0 }} className="absolute bottom-10 w-[600px] h-[500px] bg-[#000033] border-4 border-[#D4AF37] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col z-50 cursor-move">
                    <div className="bg-[#D4AF37] text-black px-4 py-2 font-p5 text-lg flex justify-between items-center shrink-0 cursor-grab active:cursor-grabbing">
                        <div className="flex items-center gap-2">
                            <Sparkles size={20} /> VELVET ATTENDANT
                        </div>
                        <Move size={16} />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] cursor-auto" onPointerDown={(e) => e.stopPropagation()}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-sm border shadow-lg ${m.role === 'user' ? 'bg-white text-black border-black' : 'bg-black/90 text-[#D4AF37] border-[#D4AF37]'}`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                                </div>
                            </div>
                        ))}
                        {isTyping && <div className="text-[#D4AF37] text-xs animate-pulse pl-2">Consulting the Arcana...</div>}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSend} className="p-3 bg-black border-t-2 border-[#D4AF37] flex gap-2 shrink-0 cursor-auto" onPointerDown={(e) => e.stopPropagation()}>
                        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about the comparison..." className="flex-1 bg-[#111] text-white border border-[#D4AF37] px-4 py-2 outline-none font-mono text-sm focus:bg-[#222]" />
                        <button type="submit" className="bg-[#D4AF37] text-black px-4 font-bold hover:bg-white transition-colors">
                            <Send size={18} />
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};
