import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Smartphone, Loader2, Terminal, MessageCircle } from 'lucide-react';

interface ChatMessage {
    id: number;
    role: 'oracle' | 'user';
    content: string;
    sources?: string[];
}

interface PhantomIMProps {
    variant?: string; // 'default', 'sns', 'terminal'
}

export default function PhantomIM({ variant = 'default' }: PhantomIMProps) {
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

        const botMsgId = Date.now() + 1;
        setMessages(prev => [...prev, { id: botMsgId, role: 'oracle', content: "" }]);

        const historyPayload = messages
            .slice(-6)
            .filter(m => m.id !== 0)
            .map(m => ({
                role: m.role,
                content: m.content
            }));

        try {
            const res = await fetch('/api/chat_stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: userText,
                    history: historyPayload 
                })
            });

            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let currentContent = "";
            let buffer = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                
                const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
                buffer += chunk;
                
                const lines = buffer.split('\n');
                buffer = !done ? lines.pop() || "" : "";
                
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

    // --- STYLES BASED ON VARIANT ---
    const getTriggerIcon = () => {
        if (variant === 'terminal') return <Terminal size={32} />;
        if (variant === 'sns') return <MessageCircle size={32} />;
        return <Smartphone size={32} />;
    };

    const getWindowStyle = () => {
        if (variant === 'terminal') return "bg-black border-4 border-green-500 font-mono shadow-[0_0_20px_#00ff00]";
        if (variant === 'sns') return "bg-[#FF4D4D] border-4 border-white rounded-3xl font-sans shadow-xl";
        return "bg-[#d61919] border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.5)] font-sans clip-path-jagged";
    };

    const getBubbleStyle = (role: string) => {
        if (variant === 'terminal') {
            return role === 'user' 
                ? "text-green-500 text-right border-b border-green-900 pb-1"
                : "text-green-400 text-left border-l-2 border-green-500 pl-2";
        }
        if (variant === 'sns') {
            return role === 'user'
                ? "bg-white text-black rounded-2xl rounded-tr-none shadow-md"
                : "bg-black text-white rounded-2xl rounded-tl-none shadow-md";
        }
        // Default
        return role === 'user' 
            ? "bg-white text-black rounded-tl-xl rounded-bl-xl rounded-br-xl shadow-lg"
            : "bg-black text-white rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-lg";
    };

    return (
        <>
            {/* FLOATING TRIGGER */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1, rotate: variant === 'terminal' ? 0 : -10 }}
                whileTap={{ scale: 0.9 }}
                className={`fixed bottom-8 right-8 z-[200] p-4 shadow-[4px_4px_0px_#000] border-2 border-black transition-colors ${
                    variant === 'terminal' ? 'bg-black text-green-500 border-green-500 rounded-none' : 
                    variant === 'sns' ? 'bg-[#FF4D4D] text-white rounded-full border-white' : 
                    'bg-phantom-red text-white rounded-full'
                }`}
            >
                {isOpen ? <X size={32} /> : getTriggerIcon()}
            </motion.button>

            {/* IM WINDOW */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, rotate: variant === 'default' ? 5 : 0 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, y: 100, rotate: variant === 'default' ? 5 : 0 }}
                        className={`fixed bottom-24 right-8 z-[190] w-96 h-[600px] flex flex-col overflow-hidden ${getWindowStyle()}`}
                        style={variant === 'default' ? { clipPath: "polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)" } : {}}
                    >
                        {/* Header */}
                        <div className={`p-3 flex items-center justify-between border-b-4 ${
                            variant === 'terminal' ? 'bg-black border-green-500' :
                            variant === 'sns' ? 'bg-[#FF4D4D] border-white text-white' :
                            'bg-black border-white'
                        }`}>
                            <span className={`font-p5 text-xl tracking-widest ${
                                variant === 'terminal' ? 'text-green-500 font-mono' : 'text-white italic'
                            }`}>
                                {variant === 'terminal' ? '>_ TERMINAL_LINK' : variant === 'sns' ? 'PHANTOM CHAT' : 'PHANTOM IM // LOG'}
                            </span>
                            <div className={`w-3 h-3 rounded-full animate-pulse ${
                                variant === 'terminal' ? 'bg-green-500' : 'bg-green-400'
                            }`} />
                        </div>

                        {/* Background Pattern */}
                        {variant === 'default' && (
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)] pointer-events-none" />
                        )}
                        {variant === 'terminal' && (
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                        )}
                        {variant === 'sns' && (
                            <div className="absolute inset-0 bg-white opacity-10 pointer-events-none bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-[size:10px_10px]" />
                        )}

                        {/* Messages Area */}
                        <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-10 ${
                            variant === 'terminal' ? 'bg-black/90' : ''
                        }`}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[85%]">
                                        {msg.role === 'oracle' && variant !== 'sns' && (
                                            <div className={`text-xs font-bold mb-1 ml-2 ${
                                                variant === 'terminal' ? 'text-green-700' : 'text-black'
                                            }`}>
                                                {variant === 'terminal' ? 'ROOT@ORACLE:~$' : 'NAVI'}
                                            </div>
                                        )}
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={`p-3 text-sm relative ${getBubbleStyle(msg.role)}`}
                                        >
                                            <div>
                                                {msg.content}
                                                {msg.sources && msg.sources.length > 0 && (
                                                    <div className={`mt-2 pt-2 border-t ${
                                                        variant === 'terminal' ? 'border-green-800' : 'border-gray-600'
                                                    }`}>
                                                        <div className={`text-[10px] uppercase ${
                                                            variant === 'terminal' ? 'text-green-600' : 'text-phantom-yellow'
                                                        }`}>Sources:</div>
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
                                <div className={`flex items-center space-x-2 font-bold text-xs ml-4 ${
                                    variant === 'terminal' ? 'text-green-500' : 'text-black'
                                }`}>
                                    <Loader2 className="animate-spin" size={12} />
                                    <span>{variant === 'terminal' ? 'EXECUTING...' : variant === 'sns' ? 'Typing...' : 'ORACLE IS THINKING...'}</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className={`p-3 relative z-20 ${
                            variant === 'terminal' ? 'bg-black border-t-4 border-green-500' :
                            variant === 'sns' ? 'bg-white/20 backdrop-blur border-t border-white/30' :
                            'bg-black/20 border-t-4 border-black'
                        }`}>
                            <div className={`flex items-center border-2 ${
                                variant === 'terminal' ? 'bg-black border-green-500' :
                                variant === 'sns' ? 'bg-white border-transparent rounded-full px-2' :
                                'bg-white border-black transform -skew-x-6'
                            }`}>
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={variant === 'terminal' ? "./enter_query.sh" : "Ask the network..."}
                                    className={`flex-1 bg-transparent px-3 py-2 outline-none ${
                                        variant === 'terminal' ? 'text-green-500 font-mono placeholder-green-800' :
                                        'text-black font-bold placeholder-gray-500'
                                    } ${variant === 'default' ? 'transform skew-x-6' : ''}`}
                                />
                                <button 
                                    type="submit" 
                                    className={`p-2 transition-colors ${
                                        variant === 'terminal' ? 'text-green-500 hover:text-white' :
                                        variant === 'sns' ? 'bg-[#FF4D4D] text-white rounded-full p-2 ml-2' :
                                        'bg-black text-phantom-red hover:bg-phantom-red hover:text-white'
                                    }`}
                                >
                                    <Send size={20} className={variant === 'default' ? 'transform skew-x-6' : ''} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
