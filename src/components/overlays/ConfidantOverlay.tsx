import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Search, Plus, ChevronLeft, ChevronRight, Video, Mic2, Map, Presentation, BarChart3, Lightbulb, Sparkles, Clock, Copy, Download, Loader, Cpu, FileText, MoreVertical, RefreshCw, Trash2 } from 'lucide-react';
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

interface Source {
    id: number;
    title: string;
    type: string;
    checked: boolean;
}

export default function ConfidantOverlay({ initialMessages, onClose, playSfx, scope }: ConfidantOverlayProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    
    // Real sources from backend
    const [sources, setSources] = useState<Source[]>([]);
    const [sourcesLoading, setSourcesLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);
    
    // Studio tool states
    const [activeToolResult, setActiveToolResult] = useState<{ type: string; content: string; title: string } | null>(null);
    const [isGeneratingTool, setIsGeneratingTool] = useState(false);
    
    // History states
    const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; messages: ChatMessage[]; date: Date }>>([]);
    const [messageMenuOpen, setMessageMenuOpen] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    
    // Load sources from backend
    useEffect(() => {
        const fetchSources = async () => {
            try {
                setSourcesLoading(true);
                const endpoint = scope?.folder_id 
                    ? `/api/papers?folder_id=${scope.folder_id}`
                    : '/api/papers';
                const res = await fetch(endpoint);
                if (res.ok) {
                    const data = await res.json();
                    const mappedSources: Source[] = data.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        type: p.url?.includes('arxiv') ? 'arxiv' : 'pdf',
                        checked: false
                    }));
                    setSources(mappedSources);
                }
            } catch (e) {
                console.error('Failed to fetch sources:', e);
            } finally {
                setSourcesLoading(false);
            }
        };
        fetchSources();
    }, [scope?.folder_id]);
    
    // Studio tools
    const studioTools = [
        { id: 'audio', name: 'Audio Preview', icon: Mic2, color: 'text-purple-400' },
        { id: 'video', name: 'Video Preview', icon: Video, color: 'text-purple-400' },
        { id: 'mindmap', name: 'Mind Map', icon: Map, color: 'text-green-400' },
        { id: 'report', name: 'Report', icon: FileText, color: 'text-blue-400' },
        { id: 'flashcards', name: 'Flashcards', icon: Sparkles, color: 'text-yellow-400' },
        { id: 'poster', name: 'Poster', icon: Lightbulb, color: 'text-pink-400' },
        { id: 'infomap', name: 'Info Map', icon: BarChart3, color: 'text-cyan-400' },
        { id: 'presentation', name: 'Presentation', icon: Presentation, color: 'text-green-400' },
    ];
    
    // Suggested questions
    const [suggestedQuestions] = useState([
        "Why can teacher forcing reduce variance?",
        "What are the main advantages of diffusion models?",
        "How does attention mechanism work?",
    ]);

    const handleJumpToCitation = (citation: Citation) => {
        // Dispatch Custom Event for ReaderOverlay (if it's open)
        const event = new CustomEvent('PHANTOM_JUMP_TO_PDF', { 
            detail: { 
                page: citation.page, 
                bbox: citation.bbox,
                source: citation.source
            } 
        });
        window.dispatchEvent(event);
        playSfx('confirm');
    };
    
    // Generate content using Studio tools
    const handleToolGenerate = async (toolType: string) => {
        playSfx('confirm');
        setIsGeneratingTool(true);
        
        // Collect conversation context
        const conversationContext = messages
            .slice(-10)  // Last 10 messages
            .map(m => `${m.role === 'user' ? 'User' : 'Oracle'}: ${m.content}`)
            .join('\n\n');
        
        let prompt = '';
        let title = '';
        
        switch (toolType) {
            case 'mindmap':
                title = 'Mind Map';
                prompt = `Based on the following conversation, generate a detailed mind map in Markdown format using nested bullet points.

Conversation:
${conversationContext}

Create a comprehensive mind map with:
- Main topic at the root
- 3-5 major branches
- Sub-branches with detailed points
- Use clear hierarchy with bullet points (-, *)

Output only the mind map structure in Markdown format.`;
                break;
                
            case 'report':
                title = 'Research Report';
                prompt = `Based on the following conversation, generate a comprehensive research report in Markdown format.

Conversation:
${conversationContext}

Include these sections:
# Executive Summary
# Background & Context
# Key Findings
# Methodology
# Conclusions
# References

Make it professional and well-structured with proper headings, bullet points, and formatting.`;
                break;
                
            case 'flashcards':
                title = 'Flashcards';
                prompt = `Based on the following conversation, generate study flashcards in Markdown format.

Conversation:
${conversationContext}

Create 8-10 flashcards with:
**Q:** [Question]
**A:** [Answer]

Focus on key concepts, definitions, and important details.`;
                break;
                
            default:
                title = toolType.charAt(0).toUpperCase() + toolType.slice(1);
                prompt = `Generate ${toolType} based on this conversation:\n\n${conversationContext}`;
        }
        
        try {
            // Call backend API that proxies to DeepSeek
            const res = await fetch('/api/mind_hack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: prompt,
                    mode: 'general'
                })
            });
            
            const data = await res.json();
            const content = data.raw || data.response || 'Generation failed.';
            
            setActiveToolResult({ type: toolType, content, title });
            playSfx('rankup');
        } catch (e) {
            console.error('Tool generation failed:', e);
            setActiveToolResult({ 
                type: toolType, 
                content: 'Failed to generate content. Please try again.', 
                title 
            });
            playSfx('cancel');
        } finally {
            setIsGeneratingTool(false);
        }
    };
    
    // Save current conversation to history
    const handleSaveToHistory = () => {
        const newHistoryItem = {
            id: Date.now().toString(),
            title: messages[1]?.content.slice(0, 50) || 'New Conversation',
            messages: [...messages],
            date: new Date()
        };
        
        const updatedHistory = [newHistoryItem, ...chatHistory].slice(0, 10); // Keep last 10
        setChatHistory(updatedHistory);
        localStorage.setItem('phantom_chat_history', JSON.stringify(updatedHistory));
        playSfx('confirm');
    };
    
    // Load conversation from history
    const handleLoadHistory = (historyItem: typeof chatHistory[0]) => {
        setMessages(historyItem.messages);
        playSfx('click');
    };
    
    // Load history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('phantom_chat_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setChatHistory(parsed.map((item: any) => ({
                    ...item,
                    date: new Date(item.date)
                })));
            } catch (e) {
                console.error('Failed to load history:', e);
            }
        }
    }, []);
    
    // Message operations
    const handleCopyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        playSfx('confirm');
        setMessageMenuOpen(null);
    };
    
    const handleDeleteMessage = (messageId: number) => {
        setMessages(messages.filter(m => m.id !== messageId));
        playSfx('cancel');
        setMessageMenuOpen(null);
    };
    
    // Handle file upload
    const handleFileUpload = async (files: FileList) => {
        playSfx('confirm');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type !== 'application/pdf') {
                console.warn('Only PDF files are supported');
                continue;
            }
            
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const res = await fetch('/api/upload', { 
                    method: 'POST', 
                    body: formData 
                });
                
                if (res.ok) {
                    const p = await res.json();
                    const newSource: Source = {
                        id: p.id,
                        title: p.title,
                        type: 'pdf',
                        checked: false
                    };
                    setSources(prev => [newSource, ...prev]);
                    playSfx('rankup');
                }
            } catch (e) {
                console.error('Upload failed:', e);
                playSfx('cancel');
            }
        }
    };
    
    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if leaving the drop zone completely
        if (e.currentTarget === dropZoneRef.current) {
            setIsDragging(false);
        }
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files);
        }
    };
    
    // Export conversation to Markdown
    const handleExportConversation = () => {
        const markdown = messages.map(msg => {
            const role = msg.role === 'user' ? '**You**' : '**Oracle**';
            let content = `${role}:\n\n${msg.content}\n\n`;
            
            if (msg.sources && msg.sources.length > 0) {
                content += `*Sources: ${msg.sources.join(', ')}*\n\n`;
            }
            
            if (msg.citations && msg.citations.length > 0) {
                content += `*Citations:*\n${msg.citations.map(c => `- [${c.index}] ${c.source} (p.${c.page}): ${c.text}`).join('\n')}\n\n`;
            }
            
            return content;
        }).join('---\n\n');
        
        const fullMarkdown = `# AI Research Conversation\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n${markdown}`;
        
        const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation_${Date.now()}.md`;
        a.click();
        playSfx('rankup');
    };
    
    const handleRegenerateMessage = async (messageId: number) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex <= 0) return; // Can't regenerate first message or if not found
        
        const userMessage = messages[messageIndex - 1]; // Get the user message before this one
        if (userMessage.role !== 'user') return;
        
        // Remove the AI response
        setMessages(messages.slice(0, messageIndex));
        setMessageMenuOpen(null);
        
        // Resend the user's message
        setIsTyping(true);
        playSfx('confirm');
        
        const botMsgId = Date.now();
        setMessages(prev => [...prev, { id: botMsgId, role: 'oracle', content: "" }]);
        
        const historyPayload = messages
            .slice(0, messageIndex - 1)
            .slice(-6)
            .map(m => ({
                role: m.role,
                content: m.content
            }));
        
        try {
            const selectedSourceIds = sources.filter(s => s.checked).map(s => s.id);
            
            const res = await fetch('/api/chat_stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: userMessage.content,
                    history: historyPayload,
                    scope: scope,
                    paper_ids: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
                    use_web_search: deepResearchEnabled
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
            console.error("Regenerate Error:", e);
            setMessages(prev => prev.map(msg => 
                msg.id === botMsgId ? { ...msg, content: `[REGENERATION FAILED: ${e.message}]` } : msg
            ));
        } finally {
            setIsTyping(false);
        }
    };

    // Scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
                playSfx('click');
            }
            
            // Ctrl/Cmd + Enter: Send message
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (input.trim() && !isTyping) {
                    const form = messageInputRef.current?.closest('form');
                    form?.requestSubmit();
                }
            }
            
            // Escape: Close overlay
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
            
            // Ctrl/Cmd + L: Clear chat (optional)
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                if (confirm('Clear all messages?')) {
                    setMessages([initialMessages[0]]);
                    playSfx('cancel');
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [input, isTyping, playSfx]);

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
            const selectedSourceIds = sources.filter(s => s.checked).map(s => s.id);
            
            const res = await fetch('/api/chat_stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: userText,
                    history: historyPayload,
                    scope: scope,
                    paper_ids: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
                    use_web_search: deepResearchEnabled
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
            className="fixed inset-0 z-[2000] bg-[#0a0a0a] text-white font-sans overflow-hidden flex"
        >
            {/* P5 HALFTONE BACKGROUND - Softer */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,_#1a1a1a_1px,_transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />
            
            {/* RED ACCENT STRIPES - More subtle */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_35px,rgba(230,0,18,0.02)_35px,rgba(230,0,18,0.02)_70px)] pointer-events-none" />
            
            {/* ============ LEFT SIDEBAR: SOURCES (20%) ============ */}
            <div 
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`${leftCollapsed ? 'w-0' : 'w-1/5'} transition-all duration-300 bg-[#0f0f0f] border-r-2 ${isDragging ? 'border-phantom-red border-4' : 'border-gray-800'} flex flex-col overflow-hidden relative z-10`}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-phantom-red/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-black border-2 border-phantom-red p-6 shadow-[8px_8px_0px_rgba(230,0,18,0.3)]">
                            <p className="text-white font-black uppercase tracking-widest text-lg">DROP FILES HERE</p>
                            <p className="text-gray-400 text-sm mt-2 text-center">PDF files only</p>
                        </div>
                    </div>
                )}
                {!leftCollapsed && (
                    <>
                        {/* Header with P5 Style - Softer */}
                        <div className="p-4 border-b-2 border-gray-800 bg-[#0a0a0a] relative">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-phantom-red/50" />
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold uppercase tracking-wider italic transform -skew-x-6">
                                    <span className="inline-block transform skew-x-6 text-white">SOURCES</span>
                                </h2>
                                <button 
                                    onClick={() => { setLeftCollapsed(true); playSfx('click'); }}
                                    className="p-2 bg-gray-800 text-white hover:bg-phantom-red/80 hover:text-white transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.3)] border border-gray-700 transform hover:scale-105"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Add Source Button - Softer P5 Style */}
                        <div className="p-4">
                            <input
                                type="file"
                                id="file-upload"
                                accept=".pdf"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFileUpload(e.target.files);
                                    }
                                }}
                            />
                            <button 
                                onClick={() => {
                                    document.getElementById('file-upload')?.click();
                                    playSfx('click');
                                }}
                                className="w-full bg-phantom-red/90 hover:bg-phantom-red text-white py-3 px-4 border-2 border-phantom-red/30 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-wider transform -skew-x-6"
                            >
                                <Plus size={20} className="transform skew-x-6" />
                                <span className="transform skew-x-6">ADD SOURCE</span>
                            </button>
                        </div>
                        
                        {/* Deep Research Toggle - Softer */}
                        <div className="px-4 pb-4">
                            <div className="bg-white/5 p-3 border border-gray-700 shadow-[3px_3px_0px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold uppercase tracking-wide text-white">DEEP RESEARCH</span>
                                    <div 
                                        onClick={() => {
                                            setDeepResearchEnabled(!deepResearchEnabled);
                                            playSfx('click');
                                        }}
                                        className="w-12 h-6 bg-gray-800 border border-gray-600 relative cursor-pointer"
                                    >
                                        <motion.div 
                                            className="w-5 h-5 bg-phantom-red/90 border border-gray-700 absolute top-0"
                                            animate={{ left: deepResearchEnabled ? '24px' : '0px' }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            whileHover={{ scale: 1.1 }}
                                        />
                                    </div>
                                </div>
                                {deepResearchEnabled && (
                                    <motion.p 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-xs text-gray-500 mt-2"
                                    >
                                        Web search enabled
                                    </motion.p>
                                )}
                            </div>
                        </div>
                        
                        {/* Search - Softer P5 Style */}
                        <div className="px-4 pb-4">
                            <div className="relative transform -skew-x-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 skew-x-3" size={16} />
                                <input 
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="SEARCH SOURCES..."
                                    className="w-full bg-[#0a0a0a] border border-gray-700 pl-10 pr-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-phantom-red/50 transform skew-x-3 uppercase tracking-wide font-mono shadow-[3px_3px_0px_rgba(255,255,255,0.03)] text-white"
                                />
                            </div>
                        </div>
                        
                        {/* Sources List - Softer */}
                        <div className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar">
                            {sourcesLoading ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    <Cpu className="animate-spin mx-auto mb-2" size={20} />
                                    LOADING SOURCES...
                                </div>
                            ) : sources.filter(s => 
                                s.title.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    NO SOURCES FOUND
                                </div>
                            ) : (
                                sources
                                    .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(source => (
                                        <motion.div 
                                            key={source.id}
                                            whileHover={{ x: 3, y: -2 }}
                                            className="bg-[#0a0a0a] border border-gray-700 p-3 flex items-center gap-3 cursor-pointer relative shadow-[3px_3px_0px_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_0px_rgba(230,0,18,0.15)] hover:border-gray-600 transition-all"
                                        >
                                            {/* Corner Accent - Softer */}
                                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-phantom-red/60 border-l-[10px] border-l-transparent" />
                                            
                                            <div className={`w-10 h-10 border border-gray-700 flex items-center justify-center text-[10px] font-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)] ${
                                                source.type === 'pdf' ? 'bg-phantom-red/80 text-white' : 
                                                source.type === 'arxiv' ? 'bg-orange-500/80 text-white' :
                                                'bg-blue-500/80 text-white'
                                            }`}>
                                                {source.type.toUpperCase().slice(0, 3)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate tracking-wide text-white">{source.title}</p>
                                            </div>
                                            <div 
                                                className="w-5 h-5 border border-gray-600 bg-[#0a0a0a] flex items-center justify-center cursor-pointer hover:bg-phantom-red/80 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSources(sources.map(s => s.id === source.id ? {...s, checked: !s.checked} : s));
                                                    playSfx('click');
                                                }}
                                            >
                                                {source.checked && <div className="w-2 h-2 bg-gray-200" />}
                                            </div>
                                        </motion.div>
                                    ))
                            )}
                        </div>
                        
                        {/* Bottom Accent Line - Softer */}
                        <div className="h-1 bg-phantom-red/40 border-t border-gray-800" />
                    </>
                )}
            </div>
            
            {/* Collapse Toggle for Left - Softer */}
            {leftCollapsed && (
                <button 
                    onClick={() => { setLeftCollapsed(false); playSfx('click'); }}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-phantom-red/90 border border-gray-700 shadow-[3px_3px_0px_rgba(0,0,0,0.3)] p-3 hover:scale-110 transition-all z-10"
                >
                    <ChevronRight size={20} />
                </button>
            )}
            
            {/* ============ MIDDLE COLUMN: CONVERSATION (55%) ============ */}
            <div className="flex-1 flex flex-col bg-[#0a0a0a] relative">
                {/* Diagonal Accent Lines - Softer */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-phantom-red/40 via-gray-700 to-phantom-red/40" />
                
                {/* Header - Softer P5 Style */}
                <div className="p-6 border-b-2 border-gray-800 flex items-center justify-between relative bg-[#0f0f0f]">
                    <div className="flex items-center gap-4">
                        {/* Decorative Icon Box - Softer */}
                        <div className="w-12 h-12 bg-phantom-red/90 border-2 border-gray-700 shadow-[3px_3px_0px_rgba(0,0,0,0.3)] flex items-center justify-center">
                            <Cpu className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-widest italic text-white">CONVERSATION</h2>
                            <div className="h-0.5 w-32 bg-phantom-red/60 mt-1" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportConversation}
                            className="bg-[#0a0a0a] text-gray-200 border-2 border-gray-700 p-3 hover:bg-gray-800 hover:border-gray-600 transition-all shadow-[3px_3px_0px_rgba(255,255,255,0.1)] hover:shadow-[4px_4px_0px_rgba(255,255,255,0.15)]"
                            title="Export as Markdown"
                        >
                            <Download size={20} />
                        </button>
                        <button 
                            onClick={handleClose}
                            className="bg-[#0a0a0a] text-gray-200 border-2 border-gray-700 p-3 hover:bg-phantom-red/80 hover:border-phantom-red/50 transition-all shadow-[3px_3px_0px_rgba(255,255,255,0.1)] hover:shadow-[4px_4px_0px_rgba(230,0,18,0.2)] transform hover:scale-105"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                
                {/* Messages Area - Softer P5 Style */}
                <div className="flex-1 overflow-y-auto px-8 pt-8 pb-40 space-y-6 custom-scrollbar relative">
                            {messages.map((msg) => (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, x: msg.role === 'user' ? 30 : -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 150, damping: 20 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                {/* Role Label - Softer */}
                                <div className={`mb-2 px-3 py-1 border ${
                                    msg.role === 'user' 
                                        ? 'bg-gray-800 text-white border-gray-600' 
                                        : 'bg-phantom-red/85 text-white border-phantom-red/30'
                                } font-black text-xs uppercase tracking-widest inline-block shadow-[2px_2px_0px_rgba(0,0,0,0.2)]`}>
                                    {msg.role === 'user' ? 'YOU' : 'ORACLE'}
                                </div>
                                
                                <div className={`relative ${
                                    msg.role === 'user' 
                                        ? 'bg-white/5 border-gray-700 transform -skew-x-2' 
                                        : 'bg-[#0f0f0f] border-phantom-red/40 transform skew-x-2'
                                } p-5 border-2 shadow-[5px_5px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_rgba(230,0,18,0.15)] transition-all backdrop-blur-sm group`}>
                                    {/* Corner Accent - Softer */}
                                    <div className={`absolute top-0 ${msg.role === 'user' ? 'left-0' : 'right-0'} w-0 h-0 border-t-[15px] border-t-phantom-red/50 ${msg.role === 'user' ? 'border-r-[15px] border-r-transparent' : 'border-l-[15px] border-l-transparent'}`} />
                                    
                                    {/* Message Menu Button */}
                                    {msg.id !== 0 && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setMessageMenuOpen(messageMenuOpen === msg.id ? null : msg.id)}
                                                className="p-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-colors"
                                            >
                                                <MoreVertical size={14} className="text-gray-400" />
                                            </button>
                                            
                                            {/* Dropdown Menu */}
                                            <AnimatePresence>
                                                {messageMenuOpen === msg.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute right-0 mt-1 bg-[#0a0a0a] border border-gray-700 shadow-[4px_4px_0px_rgba(0,0,0,0.3)] min-w-[150px] z-10"
                                                    >
                                                        <button
                                                            onClick={() => handleCopyMessage(msg.content)}
                                                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Copy size={14} />
                                                            Copy
                                                        </button>
                                                        {msg.role === 'oracle' && (
                                                            <button
                                                                onClick={() => handleRegenerateMessage(msg.id)}
                                                                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2 transition-colors"
                                                            >
                                                                <RefreshCw size={14} />
                                                                Regenerate
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                    
                                    <div className={`prose prose-invert max-w-none ${msg.role === 'user' ? 'transform skew-x-2' : 'transform -skew-x-2'}`}>
                                        {msg.role === 'oracle' && msg.citations ? (
                                            // Render with citations for Oracle messages
                                            (() => {
                                                // Process LaTeX delimiters
                                                let processedContent = msg.content
                                                    .replace(/\\\[(.+?)\\\]/gs, '$$$$1$$') 
                                                    .replace(/\\\((.+?)\\\)/g, '$$$1$$');
                                                
                                                // Split by citation markers [1], [2], etc.
                                                const parts = processedContent.split(/(\[\d+\])/g);
                                                
                                                return parts.map((part, i) => {
                                                    const match = part.match(/^\[(\d+)\]$/);
                                                    if (match) {
                                                        const index = parseInt(match[1]);
                                                        const citation = msg.citations?.find(c => c.index === index);
                                                        
                                                        if (citation) {
                                                            return (
                                                                <span 
                                                                    key={i}
                                                                    className="inline-block mx-1 px-2 py-0.5 text-xs font-bold cursor-pointer bg-phantom-red/80 text-white border border-gray-700 hover:bg-phantom-red hover:scale-110 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
                                                                    onClick={() => handleJumpToCitation(citation)}
                                                                    title={`${citation.source} (p.${citation.page})`}
                                                                >
                                                                    {part}
                                                                </span>
                                                            );
                                                        }
                                                    }
                                                    // Regular text part - render with Markdown
                                                    return (
                                                        <span key={i}>
                                                            <ReactMarkdown 
                                                                remarkPlugins={[remarkMath]} 
                                                                rehypePlugins={[rehypeKatex]}
                                                                components={{
                                                                    p: ({children}) => <span className="inline text-white">{children}</span>,
                                                                    strong: ({children}) => <strong className="text-phantom-yellow/90 font-black uppercase">{children}</strong>,
                                                                    code: ({className, children, ...props}) => {
                                                                        const match = /language-(\w+)/.exec(className || '')
                                                                        return match ? (
                                                                            <code className={`${className} bg-black/30 text-green-400 p-3 block overflow-x-auto my-3 border-l-2 border-phantom-red/60 font-mono`} {...props}>
                                                                                {children}
                                                                            </code>
                                                                        ) : (
                                                                            <code className="bg-black/40 text-phantom-yellow/90 px-2 py-1 font-mono text-sm border border-phantom-red/30" {...props}>
                                                                                {children}
                                                                            </code>
                                                                        )
                                                                    }
                                                                }}
                                                            >
                                                                {part}
                                                            </ReactMarkdown>
                                                        </span>
                                                    );
                                                });
                                            })()
                                        ) : (
                                            // Normal Markdown rendering for user messages or messages without citations
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkMath]} 
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    p: ({children}) => <p className="text-white mb-3 leading-relaxed text-base">{children}</p>,
                                                    strong: ({children}) => <strong className="text-phantom-yellow/90 font-black uppercase">{children}</strong>,
                                                    ul: ({children}) => <ul className="list-none space-y-2 text-white my-3">{children}</ul>,
                                                    li: ({children}) => (
                                                        <li className="flex items-start gap-3 text-white">
                                                            <span className="text-phantom-red/80 font-black mt-1">▸</span>
                                                            <span>{children}</span>
                                                        </li>
                                                    ),
                                                    code: ({className, children, ...props}) => {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        return match ? (
                                                            <code className={`${className} bg-black/30 text-green-400 p-3 block overflow-x-auto my-3 border-l-2 border-phantom-red/60 font-mono`} {...props}>
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <code className="bg-black/40 text-phantom-yellow/90 px-2 py-1 font-mono text-sm border border-phantom-red/30" {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    }
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                    
                                    {/* Citations List - if available */}
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className={`mt-4 pt-4 border-t border-gray-700 ${msg.role === 'user' ? 'transform skew-x-2' : 'transform -skew-x-2'}`}>
                                            <p className="text-xs text-phantom-yellow/80 font-black mb-2 uppercase tracking-wider">CITATIONS:</p>
                                            <div className="space-y-2">
                                                {msg.citations.map((c, i) => (
                                                    <div 
                                                        key={i} 
                                                        onClick={() => handleJumpToCitation(c)}
                                                        className="text-xs text-white flex items-start gap-2 bg-white/5 p-2 border-l-2 border-phantom-red/50 hover:bg-white/10 cursor-pointer transition-colors group"
                                                    >
                                                        <span className="text-phantom-red/80 font-black min-w-[24px]">[{c.index}]</span>
                                                        <div className="flex-1">
                                                            <p className="font-mono line-clamp-2 group-hover:line-clamp-none">{c.text}</p>
                                                            <p className="text-gray-500 mt-1">{c.source} (p.{c.page})</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Sources - Softer */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className={`mt-4 pt-4 border-t border-gray-700 ${msg.role === 'user' ? 'transform skew-x-2' : 'transform -skew-x-2'}`}>
                                            <p className="text-xs text-phantom-yellow/80 font-black mb-2 uppercase tracking-wider">SOURCES:</p>
                                            <div className="space-y-2">
                                                {msg.sources.map((s, i) => (
                                                    <div key={i} className="text-xs text-white flex items-center gap-2 bg-white/5 p-2 border-l-2 border-phantom-red/50">
                                                        <FileText size={12} className="text-phantom-red/70" />
                                                        <span className="truncate font-mono">{s}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    
                    {isTyping && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 bg-phantom-red/85 border border-gray-700 p-3 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] w-fit backdrop-blur-sm"
                        >
                            <Cpu className="animate-spin text-white" size={18} />
                            <span className="text-white font-black uppercase tracking-widest text-sm">PROCESSING...</span>
                        </motion.div>
                    )}
                    
                    {/* Suggested Questions - Softer */}
                    {messages.length === 1 && (
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-gray-700" />
                                <p className="text-sm text-gray-400 font-black uppercase tracking-widest">SUGGESTED QUERIES</p>
                                <div className="h-px flex-1 bg-gray-700" />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {suggestedQuestions.map((q, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.03, x: -1, y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                            onClick={() => { setInput(q); playSfx('click'); }}
                                            className="px-4 py-3 bg-[#0f0f0f] border border-gray-700 text-white hover:bg-phantom-red/20 hover:border-phantom-red/40 transition-all text-sm font-bold uppercase shadow-[3px_3px_0px_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_0px_rgba(230,0,18,0.1)]"
                                        >
                                        {q}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div ref={chatEndRef} />
                </div>
                
                {/* Input Area (Fixed at bottom) - Softer P5 */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a] border-t-2 border-gray-800 pt-4 pb-6 px-8">
                    {/* Decorative Top Line - Softer */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-phantom-red/30 to-transparent" />
                    
                    <form onSubmit={handleSend} className="max-w-5xl mx-auto relative">
                        {/* Input Label */}
                        <div className="mb-2 flex items-center gap-2">
                            <div className="h-px flex-1 bg-gray-800" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">INPUT // COMMAND // QUERY</span>
                            <div className="h-px flex-1 bg-gray-800" />
                        </div>
                        
                        <div className="relative group">
                            {/* Glow Effect on Hover - Softer */}
                            <div className="absolute inset-0 bg-phantom-red/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                            
                            <div className="relative bg-[#0f0f0f] border-2 border-gray-700 group-hover:border-phantom-red/40 transition-all flex items-center p-1 shadow-[5px_5px_0px_rgba(0,0,0,0.15)] group-hover:shadow-[6px_6px_0px_rgba(230,0,18,0.1)] transform -skew-x-2">
                                <Paperclip className="text-gray-600 hover:text-phantom-red/80 mx-4 cursor-pointer transform skew-x-2 transition-colors" size={20} />
                                <input 
                                    ref={messageInputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="ENTER YOUR COMMAND..."
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-700 px-3 py-3 font-bold uppercase tracking-wide transform skew-x-2" 
                                />
                                <button 
                                    type="submit"
                                    className="bg-phantom-red/90 hover:bg-phantom-red text-white border border-phantom-red/30 p-3 transition-all transform skew-x-2 mr-2 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:scale-105"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            
            {/* ============ RIGHT SIDEBAR: STUDIO (25%) ============ */}
            <div className="w-1/4 bg-[#0f0f0f] border-l-2 border-gray-800 flex flex-col overflow-hidden relative">
                {/* Decorative Top Accent - Softer */}
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-phantom-red/30 to-transparent" />
                
                {/* Header - Softer P5 Style */}
                <div className="p-4 border-b-2 border-gray-800 relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-800 border border-gray-700 flex items-center justify-center shadow-[2px_2px_0px_rgba(230,0,18,0.3)]">
                            <Lightbulb className="text-phantom-red/80" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-wider italic text-white">STUDIO</h2>
                            <div className="h-px w-16 bg-phantom-red/50" />
                        </div>
                    </div>
                </div>
                
                {/* Section Label - Softer */}
                <div className="px-4 pt-4 pb-2">
                    <div className="bg-phantom-red/85 border border-gray-700 px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] inline-block">
                        <span className="text-white font-black text-xs uppercase tracking-widest">TOOLS</span>
                    </div>
                </div>
                
                {/* Tools Grid - Softer P5 Style */}
                <div className="p-4 grid grid-cols-2 gap-3 border-b-2 border-gray-800">
                    {studioTools.map((tool) => (
                        <motion.button
                            key={tool.id}
                            whileHover={{ scale: 1.03, x: -1, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleToolGenerate(tool.id)}
                            disabled={isGeneratingTool}
                            className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 hover:bg-[#141414] p-4 flex flex-col items-center justify-center gap-2 transition-all group relative shadow-[3px_3px_0px_rgba(255,255,255,0.03)] hover:shadow-[4px_4px_0px_rgba(230,0,18,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {/* Corner Accent - Softer */}
                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-t-phantom-red/40 border-l-[8px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {isGeneratingTool ? (
                                <Loader className="animate-spin text-phantom-red/80" size={24} />
                            ) : (
                                <tool.icon className={`${tool.color} group-hover:scale-110 transition-transform`} size={24} />
                            )}
                            <span className="text-[10px] text-white text-center font-bold uppercase tracking-wide">{tool.name}</span>
                        </motion.button>
                    ))}
                </div>
                
                {/* Section Label */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <div className="bg-gray-800 border border-gray-700 px-3 py-1.5 shadow-[2px_2px_0px_rgba(230,0,18,0.15)] inline-block">
                        <span className="text-white font-black text-xs uppercase tracking-widest">HISTORY</span>
                    </div>
                    <button
                        onClick={handleSaveToHistory}
                        className="p-1.5 bg-phantom-red/80 hover:bg-phantom-red border border-gray-700 transition-colors"
                        title="Save conversation"
                    >
                        <Plus size={14} className="text-white" />
                    </button>
                </div>
                
                {/* Recent Notes - Real History */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                    {chatHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-xs">
                            NO SAVED CONVERSATIONS
                        </div>
                    ) : (
                        chatHistory.map((item, idx) => (
                            <motion.div 
                                key={item.id}
                                whileHover={{ x: -2, y: -2 }}
                                onClick={() => handleLoadHistory(item)}
                                className="bg-[#0a0a0a] border border-gray-700 p-3 flex items-center justify-between cursor-pointer relative shadow-[3px_3px_0px_rgba(255,255,255,0.03)] hover:shadow-[4px_4px_0px_rgba(230,0,18,0.1)] hover:border-gray-600 transition-all group"
                            >
                                <div className="absolute top-0 left-0 w-full h-px bg-phantom-red/40" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-6 h-6 border border-gray-700 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.2)] ${
                                            idx % 3 === 0 ? 'bg-blue-500/80' : idx % 3 === 1 ? 'bg-purple-500/80' : 'bg-green-500/80'
                                        }`}>
                                            <Clock size={12} className="text-white" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wide text-white truncate">{item.title}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">{item.date.toLocaleDateString()}</p>
                                </div>
                                <div 
                                    className="w-6 h-6 border border-gray-700 bg-[#0a0a0a] flex items-center justify-center group-hover:bg-phantom-red/20 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setChatHistory(chatHistory.filter(h => h.id !== item.id));
                                        localStorage.setItem('phantom_chat_history', JSON.stringify(chatHistory.filter(h => h.id !== item.id)));
                                        playSfx('cancel');
                                    }}
                                >
                                    <X size={12} className="text-gray-500" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
                
                {/* Bottom Accent - Softer */}
                <div className="h-1 bg-gradient-to-r from-phantom-red/30 via-gray-700 to-phantom-red/30" />
            </div>
            
            {/* Tool Result Modal */}
            <AnimatePresence>
                {activeToolResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
                        onClick={() => setActiveToolResult(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0f0f0f] border-2 border-phantom-red/50 shadow-[8px_8px_0px_rgba(230,0,18,0.2)] max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b-2 border-gray-800 flex items-center justify-between bg-black">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-phantom-red/90 border border-gray-700 flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
                                        <Sparkles className="text-white" size={20} />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-wider text-gray-100">{activeToolResult.title}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(activeToolResult.content);
                                            playSfx('confirm');
                                        }}
                                        className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={16} className="text-gray-300" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const blob = new Blob([activeToolResult.content], { type: 'text/markdown' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${activeToolResult.type}_${Date.now()}.md`;
                                            a.click();
                                            playSfx('confirm');
                                        }}
                                        className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                                        title="Download as Markdown"
                                    >
                                        <Download size={16} className="text-gray-300" />
                                    </button>
                                    <button
                                        onClick={() => setActiveToolResult(null)}
                                        className="p-2 bg-phantom-red/80 hover:bg-phantom-red border border-gray-700 transition-colors"
                                    >
                                        <X size={16} className="text-white" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <div className="prose prose-invert max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            h1: ({children}) => <h1 className="text-2xl font-black uppercase text-phantom-red mb-4 border-b-2 border-phantom-red/30 pb-2">{children}</h1>,
                                            h2: ({children}) => <h2 className="text-xl font-bold uppercase text-gray-100 mt-6 mb-3">{children}</h2>,
                                            h3: ({children}) => <h3 className="text-lg font-bold text-gray-200 mt-4 mb-2">{children}</h3>,
                                            p: ({children}) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                                            ul: ({children}) => <ul className="list-none space-y-2 my-4">{children}</ul>,
                                            li: ({children}) => (
                                                <li className="flex items-start gap-3 text-gray-300">
                                                    <span className="text-phantom-red/80 font-black mt-1">▸</span>
                                                    <span>{children}</span>
                                                </li>
                                            ),
                                            strong: ({children}) => <strong className="text-phantom-yellow/90 font-bold">{children}</strong>,
                                            code: ({className, children, ...props}) => {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return match ? (
                                                    <code className={`${className} bg-black/50 text-green-400 p-3 block overflow-x-auto my-3 border-l-2 border-phantom-red/60 font-mono`} {...props}>
                                                        {children}
                                                    </code>
                                                ) : (
                                                    <code className="bg-black/50 text-phantom-yellow/90 px-2 py-1 font-mono text-sm" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {activeToolResult.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
