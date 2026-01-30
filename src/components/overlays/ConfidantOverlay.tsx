import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MoreHorizontal, Minimize2, Cpu, Zap, Network, LogOut, Reply } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Citation {
    index: number;
    text: string;
    source: string;
    page: number;
    bbox: string;
}

interface ChatMessage {
    id: number;
    role: 'oracle' | 'user';
    content: string;
    sources?: string[];
    citations?: Citation[];
}

interface ConfidantOverlayProps {
    initialMessages: ChatMessage[];
    onClose: (updatedMessages: ChatMessage[]) => void;
    playSfx: (type: 'click' | 'hover' | 'confirm' | 'cancel' | 'impact' | 'rankup') => void;
    scope?: { folder_id: number; name?: string };
}

export default function ConfidantOverlay({ initialMessages, onClose, playSfx, scope }: ConfidantOverlayProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });

    // Parallax Effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setBgOffset({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userText = input;
        const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: userText };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);
        playSfx('confirm');

        // Logic duplicated from PhantomIM for standalone functionality
        // Ideally this should be shared via hook/context
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
                    history: historyPayload,
                    scope: scope
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
                            if (data.citations) {
                                setMessages(prev => prev.map(msg => 
                                    msg.id === botMsgId ? { ...msg, citations: data.citations } : msg
                                ));
                            }
                            if (data.sources) {
                                setMessages(prev => prev.map(msg => 
                                    msg.id === botMsgId ? { ...msg, sources: data.sources } : msg
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
                msg.id === botMsgId ? { ...msg, content: msg.content + `\n\n[CONNECTION LOST]` } : msg
            ));
        } finally {
            setIsTyping(false);
            playSfx('hover');
        }
    };

    const handleClose = () => {
        playSfx('cancel');
        onClose(messages); // Return updated history
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-0 left-0 z-[2000] bg-black text-white font-sans overflow-hidden flex flex-col"
        >
            {/* --- DYNAMIC BACKGROUND --- */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                {/* Red Shards */}
                <motion.div 
                    className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[repeating-linear-gradient(45deg,#220000,#220000_20px,transparent_20px,transparent_40px)]"
                    style={{ x: bgOffset.x, y: bgOffset.y }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)]" />
            </div>

            {/* --- HEADER --- */}
            {/* FIXED: Switch to relative positioning to prevent overlapping/z-index issues */}
            <div className="relative z-[3000] flex-shrink-0 flex items-center justify-between p-6 mt-24 border-b border-phantom-red/30 bg-black/90 backdrop-blur-md shadow-lg rounded-xl mx-4">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full border-2 border-phantom-red flex items-center justify-center bg-black shadow-[0_0_10px_#E60012]">
                        <Cpu className="text-phantom-red animate-pulse" />
                    </div>
                    <div>
                        <h1 className="font-p5 text-3xl text-white tracking-wider italic drop-shadow-md">CONFIDANT LINK</h1>
                        <div className="flex items-center space-x-2 text-xs text-gray-400 font-mono">
                            <Network size={12} />
                            <span>SECURE CHANNEL // {scope?.name || 'GLOBAL'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CHAT AREA --- */}
            {/* Added large pb to prevent overlap with absolute input area */}
            <div className="flex-1 relative z-10 overflow-y-auto px-8 pt-12 pb-48 md:px-32 lg:px-64 space-y-8 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'oracle' && (
                            <div className="mr-4 mt-2">
                                <div className="w-10 h-10 bg-phantom-red rounded-tl-xl rounded-br-xl flex items-center justify-center shadow-[4px_4px_0px_#000]">
                                    <Zap size={20} className="text-white" />
                                </div>
                            </div>
                        )}
                        
                        <div className={`max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                            {msg.role === 'user' && (
                                <span className="text-xs text-gray-500 mb-1 font-mono uppercase">YOU</span>
                            )}
                            
                            <div className={`p-6 text-lg relative backdrop-blur-sm border ${
                                msg.role === 'user' 
                                    ? 'bg-white/10 border-white/20 rounded-2xl rounded-tr-sm' 
                                    : 'bg-black/80 border-phantom-red/50 rounded-2xl rounded-tl-sm shadow-[0_0_20px_rgba(230,0,18,0.2)]'
                            }`}>
                                <div className="prose prose-invert max-w-none break-words whitespace-pre-wrap !text-white">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkMath]} 
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            p: ({children}) => <p className="text-white mb-2">{children}</p>,
                                            span: ({children}) => <span className="text-white">{children}</span>,
                                            li: ({children}) => <li className="text-white">{children}</li>,
                                            strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
                                            em: ({children}) => <em className="text-white italic">{children}</em>,
                                            h1: ({children}) => <h1 className="text-white text-2xl font-bold my-2">{children}</h1>,
                                            h2: ({children}) => <h2 className="text-white text-xl font-bold my-2">{children}</h2>,
                                            h3: ({children}) => <h3 className="text-white text-lg font-bold my-1">{children}</h3>,
                                            blockquote: ({children}) => <blockquote className="border-l-4 border-phantom-red pl-4 text-gray-300 italic my-2">{children}</blockquote>,
                                            code: ({className, children, ...props}) => {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return match ? (
                                                    <code className={`${className} bg-gray-900 text-phantom-yellow p-2 rounded block overflow-x-auto my-2 border border-gray-700`} {...props}>
                                                        {children}
                                                    </code>
                                                ) : (
                                                    <code className="bg-gray-800 text-phantom-yellow px-1 py-0.5 rounded font-mono text-sm" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>

                                {/* Citations */}
                                {msg.citations && msg.citations.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 gap-2">
                                        {msg.citations.map((c, i) => (
                                            <div key={i} className="text-xs bg-white/5 p-2 rounded border-l-2 border-phantom-red hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between">
                                                <span className="font-mono text-phantom-red font-bold mr-2">[{c.index}]</span>
                                                <span className="truncate flex-1">{c.text}</span>
                                                <span className="ml-2 text-gray-500 text-[10px]">{c.source} (p.{c.page})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {msg.role === 'user' && (
                            <div className="ml-4 mt-2">
                                <div className="w-10 h-10 bg-white rounded-tr-xl rounded-bl-xl flex items-center justify-center shadow-[4px_4px_0px_#000]">
                                    <div className="w-3 h-3 bg-black rounded-full" />
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
                
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2 text-phantom-red font-mono">
                        <Cpu className="animate-spin" size={16} />
                        <span>PROCESSING_COGNITION...</span>
                    </motion.div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* --- INPUT AREA --- */}
            {/* CHANGED: Used fixed positioning relative to viewport to ensure it sticks to bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-[4000] px-8 pb-4 pt-12 bg-gradient-to-t from-black via-black to-transparent">
                <div className="max-w-5xl mx-auto relative flex items-end gap-6">
                    {/* RETURN BUTTON - MOVED TO BOTTOM */}
                    <button 
                        onClick={handleClose}
                        className="flex items-center justify-center bg-black text-white w-14 h-14 border-2 border-white shadow-[4px_4px_0px_#E60012] hover:bg-phantom-red hover:scale-110 transition-all transform -skew-x-10 mb-2 group-hover:shadow-[6px_6px_0px_#FFF]"
                        title="Return"
                    >
                        <Reply size={24} className="transform skew-x-10" />
                    </button>

                    <div className="flex-1 relative">
                        {/* Decorative Elements */}
                        <div className="absolute -top-4 left-0 text-[10px] font-mono text-gray-500 tracking-[0.5em]">INPUT // QUERY // COMMAND</div>
                        
                        <form onSubmit={handleSend} className="relative group w-full">
                            <div className="absolute inset-0 bg-phantom-red transform skew-x-[-10deg] opacity-0 group-hover:opacity-100 transition-opacity blur-lg duration-500" />
                            <div className="relative bg-black border-2 border-white group-hover:border-phantom-red transition-colors transform skew-x-[-10deg] flex items-center p-2 shadow-[8px_8px_0px_rgba(255,255,255,0.1)]">
                                <Mic className="text-gray-500 mx-4" />
                                <input 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="What is your desire?"
                                    className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-white placeholder-gray-600 px-4 py-2 font-p5 tracking-wide transform skew-x-[10deg]" // Counter-skew text
                                />
                                <button 
                                    type="submit"
                                    className="bg-white text-black p-3 hover:bg-phantom-red hover:text-white transition-colors transform skew-x-[10deg] mr-2"
                                >
                                    <Send size={24} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
