import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Smartphone, Loader2 } from 'lucide-react';

interface ChatMessage {
    id: number;
    role: 'oracle' | 'user';
    content: string;
    sources?: string[];
}

export default function PhantomIM() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 0, role: 'oracle', content: "The Phantom Network is online. What info do you need?" }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userText = input;
        const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: userText };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Placeholder for streaming response
        const botMsgId = Date.now() + 1;
        setMessages(prev => [...prev, { id: botMsgId, role: 'oracle', content: "" }]);

        try {
            const res = await fetch('/api/chat_stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userText })
            });

            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let currentContent = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.content) {
                                currentContent += data.content;
                                setMessages(prev => prev.map(msg => 
                                    msg.id === botMsgId ? { ...msg, content: currentContent } : msg
                                ));
                            }
                            if (data.sources) {
                                setMessages(prev => prev.map(msg => 
                                    msg.id === botMsgId ? { ...msg, sources: data.sources } : msg
                                ));
                            }
                            if (data.error) {
                                currentContent += `\n[ERROR: ${data.error}]`;
                                setMessages(prev => prev.map(msg => 
                                    msg.id === botMsgId ? { ...msg, content: currentContent } : msg
                                ));
                            }
                        } catch (e) {
                            console.warn("Stream parse error:", e);
                        }
                    }
                }
            }
        } catch (e: any) {
            console.error("Stream Error:", e);
            setMessages(prev => prev.map(msg => 
                msg.id === botMsgId ? { ...msg, content: msg.content + `\n\n[CONNECTION LOST: ${e.message}]` } : msg
            ));
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* FLOATING TRIGGER */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-8 right-8 z-[200] bg-phantom-red text-white p-4 rounded-full shadow-[4px_4px_0px_#000] border-2 border-black"
            >
                {isOpen ? <X size={32} /> : <Smartphone size={32} />}
            </motion.button>

            {/* IM WINDOW */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, rotate: 5 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, y: 100, rotate: 5 }}
                        className="fixed bottom-24 right-8 z-[190] w-96 h-[600px] bg-[#d61919] border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.5)] flex flex-col font-sans overflow-hidden"
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)" }}
                    >
                        {/* Header */}
                        <div className="bg-black p-3 flex items-center justify-between border-b-4 border-white">
                            <span className="text-white font-p5 text-xl tracking-widest italic">PHANTOM IM // LOG</span>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        </div>

                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)] pointer-events-none" />

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-10">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[85%]">
                                        {msg.role === 'oracle' && (
                                            <div className="text-xs font-bold text-black mb-1 ml-2">NAVI</div>
                                        )}
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={`p-3 text-sm relative shadow-lg ${
                                                msg.role === 'user' 
                                                ? 'bg-white text-black rounded-tl-xl rounded-bl-xl rounded-br-xl transform -skew-x-6' 
                                                : 'bg-black text-white rounded-tr-xl rounded-br-xl rounded-bl-xl transform skew-x-6'
                                            }`}
                                        >
                                            <div className={msg.role === 'user' ? 'transform skew-x-6' : 'transform -skew-x-6'}>
                                                {msg.content}
                                                {msg.sources && msg.sources.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-gray-600">
                                                        <div className="text-[10px] uppercase text-phantom-yellow">Sources:</div>
                                                        {msg.sources.map((s, i) => (
                                                            <div key={i} className="text-[10px] truncate opacity-70">📄 {s}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex items-center space-x-2 text-black font-bold text-xs ml-4">
                                    <Loader2 className="animate-spin" size={12} />
                                    <span>ORACLE IS THINKING...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-3 bg-black/20 border-t-4 border-black relative z-20">
                            <div className="flex items-center bg-white border-2 border-black transform -skew-x-6">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask the network..."
                                    className="flex-1 bg-transparent px-3 py-2 outline-none text-black font-bold placeholder-gray-500 transform skew-x-6"
                                />
                                <button 
                                    type="submit" 
                                    className="bg-black text-phantom-red p-2 hover:bg-phantom-red hover:text-white transition-colors"
                                >
                                    <Send size={20} className="transform skew-x-6" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
