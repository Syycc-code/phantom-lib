import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  BookOpen, 
  Tag, 
  Settings, 
  Plus, 
  FileText, 
  Clock, 
  Star,
  BrainCircuit,
  X,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Hash,
  Send,
  Folder,
  Trash2,
  PlusCircle,
  Upload,
  Cpu,
  Eye,
  Maximize2,
  Languages,
  Sparkles,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Move,
  Loader2,
  Map as MapIcon,
  Gem, 
  Combine,
  SplitSquareHorizontal,
  Minimize2,
  User, 
  Music,
  Search
} from 'lucide-react';

import PhantomIM from './components/PhantomIM';

// --- PDF WORKER SETUP ---
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// --- AUDIO ENGINE (SYNTHESIZER) ---
const useAudioSystem = () => {
    const audioCtxRef = useRef<AudioContext | null>(null);

    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    }, []);

    const playSound = useCallback((type: 'click' | 'hover' | 'confirm' | 'cancel' | 'impact' | 'rankup') => {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'click':
                // Sharp mechanical click
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'hover':
                // Subtle high tick
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.02, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
                break;
            case 'confirm':
                // "Schwing" - High pitch slide
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'cancel':
                // Low thud
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'impact':
                // Heavy Crash
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
            case 'rankup':
                // Jingle (Arpeggio)
                const playNote = (freq: number, time: number) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.1, time);
                    g.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
                    o.start(time);
                    o.stop(time + 0.3);
                };
                playNote(523.25, now); // C
                playNote(659.25, now + 0.1); // E
                playNote(783.99, now + 0.2); // G
                playNote(1046.50, now + 0.3); // C (High)
                break;
        }
    }, [initAudio]);

    return playSound;
};

// --- Types ---
interface FolderType {
    id: string;
    name: string;
}

interface Paper {
  id: number;
  title: string;
  author: string;
  year: string;
  type: string;
  folderId?: string;
  tags: string[];
  abstract: string;
  content?: string; 
  fileUrl?: string; 
  shadow_problem?: string;
  persona_solution?: string;
  weakness_flaw?: string;
  ocrStatus?: 'idle' | 'scanning' | 'complete' | 'failed';
}

interface ChatMessage {
    role: 'igor' | 'user';
    content: string;
}

interface PhantomStats {
    knowledge: number;
    guts: number;
    proficiency: number;
    kindness: number;
    charm: number;
}

// --- Mock Data ---
const INITIAL_FOLDERS: FolderType[] = [
    { id: 'f1', name: 'Cognitive Science' },
    { id: 'f2', name: 'Metaverse Tech' }
];

const INITIAL_PAPERS: Paper[] = [
  { 
    id: 1, 
    title: "Cognitive Psience in the Metaverse", 
    author: "Dr. Maruki", 
    year: "2020",
    type: "PDF",
    folderId: 'f1',
    tags: ["Cognition", "Reality", "Psychology"],
    abstract: "This paper explores the theoretical framework of cognitive psience.",
    content: "CHAPTER 1: THE COGNITIVE WORLD...",
    ocrStatus: 'complete',
    shadow_problem: "Escapism from Reality",
    persona_solution: "Actualization of Will",
    weakness_flaw: "Subjective Tyranny"
  },
  { 
    id: 2, 
    title: "Mamba: Linear-Time Sequence Modeling", 
    author: "Gu, A. & Dao, T.", 
    year: "2023",
    type: "Arxiv",
    folderId: 'f2',
    tags: ["AI", "LLM", "Cognition"],
    abstract: "Foundation models, now powering most of the exciting applications...",
    content: "ABSTRACT\n\nTransformers have become the de facto standard...",
    ocrStatus: 'complete'
  }
];

const INITIAL_STATS: PhantomStats = {
    knowledge: 1,
    guts: 1,
    proficiency: 1,
    kindness: 1,
    charm: 1
};

// --- Components ---

const SubwayOverlay = ({ papers, folders, onClose, onRead, playSfx }: { papers: Paper[], folders: FolderType[], onClose: () => void, onRead: (p: Paper) => void, playSfx: any }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredPaperId, setHoveredPaperId] = useState<number | null>(null);

    const { tracks, connections } = useMemo(() => {
        const groups: { [key: string]: Paper[] } = {};
        const folderMap: { [key: string]: string } = {};
        folders.forEach(f => folderMap[f.id] = f.name);
        folderMap['uncategorized'] = "Uncategorized";
        Object.keys(folderMap).forEach(k => groups[k] = []);
        papers.forEach(p => {
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return;
            const fid = p.folderId && folderMap[p.folderId] ? p.folderId : 'uncategorized';
            groups[fid].push(p);
        });
        Object.keys(groups).forEach(k => groups[k].sort((a, b) => parseInt(a.year) - parseInt(b.year)));

        const activeTracks = Object.entries(groups).filter(([_, list]) => list.length > 0).map(([fid, list], index) => ({
            id: fid,
            name: folderMap[fid],
            papers: list,
            color: ['#E60012', '#00FFFF', '#FCEC0C', '#52FF00', '#A900FF'][index % 5],
            y: index * 120 + 100
        }));

        const links: { x1: number, y1: number, x2: number, y2: number, color: string }[] = [];
        const allPapers = activeTracks.flatMap((t, tIdx) => t.papers.map((p, pIdx) => ({ ...p, x: 300 + (pIdx * 200), y: t.y, color: t.color })));

        for (let i = 0; i < allPapers.length; i++) {
            for (let j = i + 1; j < allPapers.length; j++) {
                const p1 = allPapers[i];
                const p2 = allPapers[j];
                const shared = p1.tags.filter(t => p2.tags.includes(t));
                if (shared.length > 0) {
                    links.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color: 'rgba(255, 255, 255, 0.3)' });
                }
            }
        }
        return { tracks: activeTracks, connections: links };
    }, [papers, folders, searchQuery]);

    return (
        <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-[150] bg-[#101010] flex flex-col text-white overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[length:200px_100%] animate-track-flow pointer-events-none" />
            <div className="h-24 bg-phantom-black border-b-4 border-phantom-red flex items-center justify-between px-8 relative z-20">
                <div className="z-10">
                    <h1 className="text-5xl font-p5 text-white tracking-tighter leading-none" style={{ textShadow: "4px 4px 0px #E60012" }}>MEMENTOS NAVIGATOR</h1>
                    <div className="text-phantom-red font-mono text-xs mt-1 tracking-widest">COGNITIVE TRANSPORT LAYER</div>
                </div>
                <div className="flex items-center bg-black border-2 border-white px-4 py-2 w-96 transform -skew-x-12">
                    <Search className="text-phantom-red mr-2" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Cognition..." className="bg-transparent outline-none text-white font-mono text-sm w-full placeholder-gray-500" autoFocus />
                </div>
                <button onClick={() => { onClose(); playSfx('cancel'); }} className="z-10 bg-white text-black p-2 hover:bg-phantom-red transition-colors border-2 border-black"><X size={32} /></button>
            </div>
            <div className="flex-1 overflow-auto relative custom-scrollbar bg-[#101010]">
                <div className="relative min-w-[1500px] min-h-[800px] p-10">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {tracks.map(track => (<path key={track.id} d={`M 250 ${track.y} L ${300 + (track.papers.length * 200)} ${track.y}`} stroke={track.color} strokeWidth="4" fill="none" opacity="0.6" />))}
                        {connections.map((link, i) => (<path key={i} d={`M ${link.x1} ${link.y1} C ${link.x1} ${(link.y1 + link.y2)/2}, ${link.x2} ${(link.y1 + link.y2)/2}, ${link.x2} ${link.y2}`} stroke={link.color} strokeWidth="1" strokeDasharray="5,5" fill="none" />))}
                    </svg>
                    <div className="relative z-10">
                        {tracks.map((track, tIdx) => (
                            <div key={track.id} className="absolute left-0 w-full" style={{ top: track.y - 40 }}>
                                <div className="absolute left-10 top-2 w-48"><div className="bg-black border-2 text-white px-4 py-2 font-p5 text-xl transform -skew-x-12 shadow-[4px_4px_0px_#000]" style={{ borderColor: track.color }}>{track.name}</div></div>
                                {track.papers.map((paper, pIdx) => {
                                    const xPos = 300 + (pIdx * 200);
                                    return (
                                        <motion.button key={paper.id} onClick={() => { onRead(paper); onClose(); playSfx('confirm'); }} onMouseEnter={() => { setHoveredPaperId(paper.id); playSfx('hover'); }} onMouseLeave={() => setHoveredPaperId(null)} style={{ left: xPos, top: 24 }} className="absolute outline-none group" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: pIdx * 0.1 }}>
                                            <div className="relative flex flex-col items-center">
                                                <div className="w-8 h-8 bg-white border-4 border-black transform rotate-45 group-hover:scale-150 group-hover:bg-black group-hover:border-white transition-transform duration-200 z-20" style={{ borderColor: 'black', boxShadow: `0 0 15px ${track.color}` }} />
                                                <div className="absolute top-10 w-40 text-center pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity z-30">
                                                    <div className="bg-black/90 p-2 border border-zinc-500 rounded-sm">
                                                        <div className="text-phantom-yellow font-mono text-xs">{paper.year}</div>
                                                        <div className="text-white font-bold text-xs truncate">{paper.title}</div>
                                                        <div className="flex flex-wrap justify-center gap-1 mt-1">{paper.tags.slice(0,2).map(t => (<span key={t} className="text-[8px] bg-zinc-800 px-1">{t}</span>))}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const RankUpNotification = ({ stat }: { stat: string | null }) => (
    <AnimatePresence>{stat && (<div className="fixed top-20 right-20 z-[9999] pointer-events-none"><motion.div initial={{ opacity: 0, y: 50, scale: 0.5 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -50 }} className="relative"><Music className="text-phantom-yellow w-12 h-12 absolute -top-8 -left-8 animate-bounce" /><div className="bg-black border-2 border-phantom-red text-white p-4 font-p5 text-2xl shadow-[8px_8px_0px_#E60012] transform -skew-x-12">{stat.toUpperCase()} UP!</div><div className="text-phantom-yellow font-mono text-sm mt-1 bg-black inline-block px-1">RANK INCREASED</div></motion.div></div>)}</AnimatePresence>
);

const StatsOverlay = ({ stats, onClose, playSfx }: { stats: PhantomStats, onClose: () => void, playSfx: any }) => {
    const data = [{ subject: 'Knowledge', A: stats.knowledge, fullMark: 10 }, { subject: 'Guts', A: stats.guts, fullMark: 10 }, { subject: 'Proficiency', A: stats.proficiency, fullMark: 10 }, { subject: 'Kindness', A: stats.kindness, fullMark: 10 }, { subject: 'Charm', A: stats.charm, fullMark: 10 }];
    return (<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center" onClick={() => { onClose(); playSfx('cancel'); }}><div className="relative w-[600px] h-[600px] bg-[#1a1a1a] border-4 border-phantom-red p-8 shadow-[0_0_50px_#E60012]" onClick={e => e.stopPropagation()}><h2 className="text-4xl font-p5 text-white mb-8 text-center bg-black border-b-4 border-phantom-red pb-2">PHANTOM STATS</h2><div className="h-[400px] w-full"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}><PolarGrid stroke="#333" /><PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 14, fontFamily: 'Fjalla One' }} /><Radar name="Joker" dataKey="A" stroke="#E60012" strokeWidth={3} fill="#E60012" fillOpacity={0.6} /></RadarChart></ResponsiveContainer></div><div className="absolute top-4 right-4"><button onClick={() => { onClose(); playSfx('cancel'); }} className="text-white hover:text-phantom-red"><X size={32}/></button></div><div className="text-center font-mono text-xs text-gray-500 mt-4">CURRENT RANK: {Math.floor((stats.knowledge + stats.guts + stats.proficiency + stats.kindness + stats.charm) / 5)} // LEGEND</div></div></motion.div>);
};

const TransitionCurtain = ({ isActive }: { isActive: boolean }) => (<AnimatePresence>{isActive && (<motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 z-[9999] bg-[#000033] flex items-center justify-center overflow-hidden"><div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#D4AF37_20px,#D4AF37_40px)] opacity-10" /><motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }} className="text-[#D4AF37] font-p5 text-8xl tracking-tighter">FUSION IN PROGRESS...</motion.div></motion.div>)}</AnimatePresence>);
const ShatterEffect = () => (<motion.div initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 2 }} transition={{ duration: 0.6 }} className="absolute inset-0 z-50 pointer-events-none mix-blend-overlay"><svg viewBox="0 0 100 100" className="w-full h-full fill-white"><path d="M0 0 L100 100 L0 100 Z" /><path d="M100 0 L0 0 L100 100 Z" /></svg></motion.div>);

const FusionWorkspace = ({ paperA, paperB, initialReport, onClose, playSfx }: { paperA: Paper, paperB: Paper, initialReport: string, onClose: () => void, playSfx: any }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'igor', content: initialReport }]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    const handleSend = async (e: React.FormEvent) => { e.preventDefault(); if (!input.trim()) return; playSfx('click'); const userMsg = input; setMessages(prev => [...prev, { role: 'user', content: userMsg }]); setInput(""); setIsTyping(true); try { const context = `PAPER A: ${paperA.title}\n${paperA.content || paperA.abstract}\n\nPAPER B: ${paperB.title}\n${paperB.content || paperB.abstract}`; const prompt = `Context:\n${context}\n\nUser Question: ${userMsg}\n\nAnswer as Igor. Compare them.`; const response = await fetch('/api/mind_hack', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: prompt, mode: 'decipher' }) }); const data = await response.json(); setMessages(prev => [...prev, { role: 'igor', content: data.result }]); } catch (e) { setMessages(prev => [...prev, { role: 'igor', content: "My apologies. Link severed." }]); } finally { setIsTyping(false); } };
    const PaperView = ({ paper, label }: { paper: Paper, label: string }) => (<div className="flex-1 flex flex-col border-r-4 border-[#D4AF37] bg-zinc-100 relative overflow-hidden h-full"><div className="bg-[#000033] text-[#D4AF37] p-3 font-p5 text-xl flex justify-between items-center px-4 shrink-0 shadow-md z-10 border-b border-[#D4AF37]"><span className="truncate max-w-[70%]">{label}: {paper.title}</span><span className="text-xs font-mono opacity-80">{paper.author}</span></div><div className="flex-1 overflow-y-auto p-8 custom-scrollbar"><div className="font-serif text-lg leading-relaxed text-black whitespace-pre-wrap">{paper.content || paper.abstract || "NO DATA."}</div></div></div>);
    return (<div className="fixed inset-0 z-[250] bg-[#000022] flex flex-col text-white"><div className="h-16 bg-[#000033] border-b-4 border-[#D4AF37] flex items-center justify-between px-6 shadow-xl z-20 shrink-0"><div className="flex items-center space-x-2 text-[#D4AF37]"><SplitSquareHorizontal /><h2 className="font-p5 text-2xl tracking-widest">FUSION RESULT // TWIN COGNITION</h2></div><button onClick={() => { onClose(); playSfx('cancel'); }} className="bg-[#D4AF37] text-black px-4 py-1 font-bold hover:bg-white transition-colors flex items-center gap-2"><X size={20} /> EXIT FUSION</button></div><div className="flex-1 flex overflow-hidden relative"><PaperView paper={paperA} label="ARCANA A" /><PaperView paper={paperB} label="ARCANA B" /><motion.div drag dragMomentum={false} initial={{ y: 100, x: "-50%", left: "50%" }} animate={{ y: 0 }} className="absolute bottom-10 w-[600px] h-[500px] bg-[#000033] border-4 border-[#D4AF37] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col z-50 cursor-move"><div className="bg-[#D4AF37] text-black px-4 py-2 font-p5 text-lg flex justify-between items-center shrink-0 cursor-grab active:cursor-grabbing"><div className="flex items-center gap-2"><Sparkles size={20} /> VELVET ATTENDANT</div><Move size={16} /></div><div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] cursor-auto" onPointerDown={(e) => e.stopPropagation()}>{messages.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-sm border shadow-lg ${m.role === 'user' ? 'bg-white text-black border-black' : 'bg-black/90 text-[#D4AF37] border-[#D4AF37]'}`}><p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p></div></div>))}{isTyping && <div className="text-[#D4AF37] text-xs animate-pulse pl-2">Consulting the Arcana...</div>}<div ref={chatEndRef} /></div><form onSubmit={handleSend} className="p-3 bg-black border-t-2 border-[#D4AF37] flex gap-2 shrink-0 cursor-auto" onPointerDown={(e) => e.stopPropagation()}><input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about the comparison..." className="flex-1 bg-[#111] text-white border border-[#D4AF37] px-4 py-2 outline-none font-mono text-sm focus:bg-[#222]" /><button type="submit" className="bg-[#D4AF37] text-black px-4 font-bold hover:bg-white transition-colors"><Send size={18} /></button></form></motion.div></div></div>);
};

const VelvetOverlay = ({ papers, onComplete, onLevelUp, playSfx }: { papers: Paper[], onComplete: (result: string) => void, onLevelUp: (stat: string) => void, playSfx: any }) => {
    const [step, setStep] = useState(0); 
    useEffect(() => {
        const timer1 = setTimeout(() => { setStep(1); playSfx('impact'); }, 500); 
        const timer2 = setTimeout(() => setStep(2), 800); 
        const fuse = async () => { try { const minTime = new Promise(resolve => setTimeout(resolve, 1500)); const apiCall = fetch('/api/fuse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title_a: papers[0].title, text_a: papers[0].content || papers[0].abstract, title_b: papers[1].title, text_b: papers[1].content || papers[1].abstract }) }).then(res => res.json()); const [_, data] = await Promise.all([minTime, apiCall]); const finalResult = data.result || "【数据丢失】\n融合成功，但未收到预报。\n请检查后端连接。"; onComplete(finalResult); onLevelUp('charm'); } catch (e) { setTimeout(() => onComplete("【仪式失败】\n\n无法连接到天鹅绒房间。"), 3000); } };
        fuse(); return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);
    return (
        <div className="fixed inset-0 z-[200] bg-[#000033] flex items-center justify-center overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(circle,_#000066_1px,_transparent_1px)] bg-[length:20px_20px] opacity-30" /><div className="relative z-10 flex space-x-20 mt-32">{papers.map((p, i) => (<motion.div key={p.id} initial={{ y: 500, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-64 h-80 bg-white border-4 border-[#D4AF37] p-4 flex flex-col items-center justify-center text-center shadow-[0_0_50px_#D4AF37]"><div className="text-black font-p5 text-xl">{p.title.substring(0, 30)}...</div>{step < 2 && (<motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} className="absolute -top-64 left-1/2 w-2 h-64 bg-black z-20" />)}</motion.div>))}</div><motion.div initial={{ y: "-100vh" }} animate={step >= 1 ? { y: "0" } : { y: "-100vh" }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 2 }} className="absolute top-0 left-0 right-0 h-[80vh] z-30 flex justify-center items-end"><div className="w-full h-full bg-[#000033] border-b-[20px] border-[#D4AF37] shadow-[0_50px_100px_#000] relative flex items-end justify-center pb-10"><div className="absolute bottom-[-10px] w-full h-4 bg-red-600 shadow-[0_0_20px_red]" /><div className="text-[#D4AF37] font-p5 text-[20rem] leading-none opacity-20 tracking-tighter">V</div></div></motion.div>{step === 2 && (<><motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-white z-50" /><ShatterEffect /></>)}</div>
    );
};

const ReaderOverlay = ({ paper, onClose, onLevelUp, playSfx }: { paper: Paper, onClose: () => void, onLevelUp: (s: string) => void, playSfx: any }) => {
    const [selectionMenu, setSelectionMenu] = useState<{ visible: boolean; x: number; y: number; text: string } | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{ visible: boolean; type: string; content: string } | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [numPages, setNumPages] = useState<number>(0);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => { onLevelUp('guts'); }, []);

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) return;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const x = Math.min(Math.max(rect.left + (rect.width / 2), 100), window.innerWidth - 100);
        const y = Math.max(rect.top - 50, 80); 
        setSelectionMenu({ visible: true, x, y, text: selection.toString() });
        playSfx('hover');
    };

    const handleAction = async (type: 'DECIPHER' | 'TRANSLATE') => {
        if (!selectionMenu) return;
        playSfx('click');
        setSelectionMenu(null); 
        setLoadingAnalysis(true); 
        setAnalysisResult({ visible: true, type, content: "" });
        onLevelUp('proficiency');
        try {
            const response = await fetch('/api/mind_hack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: selectionMenu.text, mode: type.toLowerCase() })
            });
            if (!response.ok) throw new Error("Cognitive Link Failed");
            const data = await response.json();
            setAnalysisResult({ visible: true, type, content: data.result });
            playSfx('confirm');
        } catch (e: any) {
            console.error("Mind Hack Error:", e);
            setTimeout(() => { 
                setAnalysisResult({ 
                    visible: true, 
                    type, 
                    content: `⚠️ SYSTEM ERROR // ${e.message || "Unknown Error"}\n\n请检查后端连接或 API Key 配置。` 
                }); 
            }, 1000);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
             const target = e.target as HTMLElement;
             if (selectionMenu?.visible && !target.closest('.phantom-menu')) {
                 setSelectionMenu(null);
             }
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [selectionMenu]);

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col"
        >
            <div className="h-20 bg-phantom-red flex items-center justify-between px-8 shrink-0 relative overflow-hidden shadow-lg z-20">
                <div className="absolute inset-0 bg-halftone opacity-20 mix-blend-overlay" />
                <div className="z-10 flex items-center space-x-4">
                    <Maximize2 className="text-black" />
                    <h2 className="font-p5 text-3xl text-black truncate max-w-4xl transform -skew-x-12">
                        READING // {paper.title}
                    </h2>
                    {paper.ocrStatus === 'scanning' && (
                        <div className="flex items-center space-x-2 bg-black/80 px-3 py-1 rounded-full">
                            <Loader2 className="animate-spin text-phantom-yellow" size={14} />
                            <span className="text-xs font-mono text-phantom-yellow">OCR SCANNING...</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-4 z-10">
                    <button onClick={() => { onClose(); onLevelUp('knowledge'); playSfx('rankup'); }} className="bg-black text-white px-4 py-2 font-p5 text-sm hover:bg-phantom-yellow hover:text-black transition-colors border-2 border-white rounded-full">
                        FINISH READING
                    </button>
                    <button onClick={() => { onClose(); playSfx('cancel'); }} className="bg-black text-white p-3 hover:rotate-90 transition-transform rounded-full shadow-lg border-2 border-white z-10">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-zinc-900 relative overflow-auto flex justify-center p-8 custom-scrollbar" onMouseUp={handleMouseUp}>
                {paper.fileUrl ? (
                    <div className="shadow-2xl selection:bg-phantom-red selection:text-black flex flex-col items-center pb-20">
                        <Document
                            file={paper.fileUrl}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            className="flex flex-col items-center gap-4"
                        >
                            {Array.from(new Array(numPages), (el, index) => (
                                <Page 
                                    key={`page_${index + 1}`}
                                    pageNumber={index + 1} 
                                    renderTextLayer={true} 
                                    renderAnnotationLayer={true}
                                    scale={1.2}
                                    className="bg-white shadow-xl"
                                    loading={<div className="h-[800px] w-[600px] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-phantom-red"/></div>}
                                />
                            ))}
                        </Document>
                    </div>
                ) : (
                    <div ref={contentRef} className="max-w-4xl w-full bg-zinc-800/50 p-12 min-h-full border-l-4 border-zinc-700 selection:bg-phantom-red selection:text-black">
                        <div className="font-serif text-xl leading-loose text-zinc-300 whitespace-pre-wrap">
                            {paper.content || (paper.ocrStatus === 'scanning' ? "SCANNING DOCUMENT FOR COGNITIVE DATA..." : "NO TEXT EXTRACTED.")}
                        </div>
                    </div>
                )}
                
                <AnimatePresence>
                    {selectionMenu && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0 }}
                            style={{ top: selectionMenu.y, left: selectionMenu.x }}
                            className="phantom-menu fixed transform -translate-x-1/2 -translate-y-full z-[150] flex space-x-2 pb-2 pointer-events-auto"
                        >
                             <button onClick={() => handleAction('DECIPHER')} className="bg-black text-white px-4 py-2 font-p5 text-sm border-2 border-phantom-red shadow-[4px_4px_0px_#E60012] hover:scale-110 transition-transform flex items-center space-x-2">
                                <Sparkles size={14} className="text-phantom-yellow" /> <span>DECIPHER</span>
                             </button>
                             <button onClick={() => handleAction('TRANSLATE')} className="bg-white text-black px-4 py-2 font-p5 text-sm border-2 border-black shadow-[4px_4px_0px_#000] hover:scale-110 transition-transform flex items-center space-x-2">
                                <Languages size={14} /> <span>TRANSLATE</span>
                             </button>
                             <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-phantom-red"></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {analysisResult && (
                        <motion.div
                            drag
                            dragMomentum={false}
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="fixed z-[200] top-1/3 left-1/3 w-[400px] bg-white border-4 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.8)] cursor-move"
                        >
                            <div className="bg-black p-2 flex justify-between items-center cursor-grab active:cursor-grabbing">
                                <div className="flex items-center space-x-2">
                                    <Move size={16} className="text-phantom-red" />
                                    <span className="text-white font-p5 text-sm tracking-widest">
                                        {loadingAnalysis ? "ESTABLISHING LINK..." : "PHANTOM ANALYSIS"}
                                    </span>
                                </div>
                                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => { setAnalysisResult(null); playSfx('cancel'); }} className="text-white hover:text-phantom-red">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 bg-zinc-100 cursor-default" onPointerDown={(e) => e.stopPropagation()}>
                                {loadingAnalysis ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <BrainCircuit className="w-12 h-12 animate-spin text-phantom-red" />
                                        <span className="font-mono text-xs animate-pulse text-gray-500">DECRYPTING COGNITION...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                            <div className="font-sans text-sm text-black leading-relaxed whitespace-pre-wrap font-medium">
                                                {analysisResult.content}
                                            </div>
                                        </div>
                                        <div className="border-t-2 border-zinc-300 pt-2 flex justify-between items-center">
                                            <span className="text-[10px] uppercase font-bold text-phantom-red">CONFIDENCE: 99.8%</span>
                                            <MessageSquare size={14} className="text-gray-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const LeftPane = ({ activeMenu, setActiveMenu, folders, onAddFolder, onDeleteFolder, onBulkImport, onShowStats, playSfx }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVelvet = activeMenu === 'velvet';
  const systemItems = [{ icon: BookOpen, label: 'All References', id: 'all' }, { icon: Plus, label: 'Infiltrate (Add)', id: 'add' }, { icon: Gem, label: 'Velvet Room', id: 'velvet' }, { icon: Tag, label: 'Recent', id: 'recent' }];
  return (<div className={`h-full border-r-4 p-6 flex flex-col text-white w-72 shrink-0 relative overflow-hidden z-20 transition-colors duration-500 ${isVelvet ? 'bg-[#000033] border-[#D4AF37]' : 'bg-phantom-black border-phantom-red'}`}><div className="absolute top-0 left-0 w-full h-full bg-halftone opacity-50 pointer-events-none" /><div className="mb-10 relative transform -rotate-6 origin-top-left cursor-default"><h1 className={`text-6xl font-p5 tracking-tighter leading-none ${isVelvet ? 'text-[#D4AF37]' : 'text-white'}`} style={{ textShadow: isVelvet ? "2px 2px 0px #000" : "4px 4px 0px #E60012" }}>ARCHIVE</h1><div className="bg-white text-black text-xs font-bold px-2 inline-block transform skew-x-[-12deg] mt-1 ml-2">PHANTOM LIB V.2.7</div></div><button onClick={() => { onShowStats(); playSfx('click'); }} className="mb-6 flex items-center space-x-2 bg-black border-2 border-white text-white p-2 hover:bg-white hover:text-black transition-colors w-full group"><User className="group-hover:rotate-12 transition-transform" /><span className="font-p5 text-lg">PHANTOM STATS</span></button><nav className="space-y-4 z-10 mb-8">{systemItems.map((item) => (<button key={item.id} onClick={() => { setActiveMenu(item.id); playSfx('click'); }} className="relative w-full group cursor-pointer block text-left" onMouseEnter={() => playSfx('hover')}>{activeMenu === item.id && <div className={`absolute inset-0 bg-white shadow-[4px_4px_0px_#000] clip-path-slash ${isVelvet ? 'shadow-[#D4AF37]' : 'shadow-[#E60012]'}`} />}<div className={`relative flex items-center space-x-4 p-3 transform -skew-x-12 transition-colors duration-200 ${activeMenu === item.id ? 'text-black pl-8' : 'text-gray-400 hover:text-white'}`}><item.icon className={`w-6 h-6 ${activeMenu === item.id ? 'stroke-[3px]' : ''}`} /><span className="font-p5 text-xl tracking-wider uppercase">{item.label}</span></div></button>))}<input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onBulkImport(e.target.files)} multiple className="hidden" /><button onClick={() => { fileInputRef.current?.click(); playSfx('click'); }} className="relative w-full group cursor-pointer block text-left" onMouseEnter={() => playSfx('hover')}><div className={`relative flex items-center space-x-4 p-3 transform -skew-x-12 hover:text-white transition-colors ${isVelvet ? 'text-[#D4AF37]' : 'text-phantom-yellow'}`}><Upload className="w-6 h-6" /><span className="font-p5 text-xl tracking-wider uppercase">BULK UPLOAD</span></div></button></nav><div className={`flex items-center justify-between border-b-2 pb-2 mb-4 z-10 ${isVelvet ? 'border-[#D4AF37]' : 'border-zinc-700'}`}><h3 className={`text-sm font-bold tracking-[0.2em] ${isVelvet ? 'text-[#D4AF37]' : 'text-phantom-red'}`}>MISSIONS</h3><button onClick={() => { onAddFolder(); playSfx('confirm'); }} className={`text-white hover:rotate-90 transition-all ${isVelvet ? 'hover:text-[#D4AF37]' : 'hover:text-phantom-red'}`}><PlusCircle size={18} /></button></div><div className="flex-1 overflow-y-auto z-10 space-y-2 pr-2 custom-scrollbar">{folders.map((folder: FolderType) => (<button key={folder.id} onClick={() => { setActiveMenu(`folder_${folder.id}`); playSfx('click'); }} onMouseEnter={() => playSfx('hover')} className={`relative w-full group cursor-pointer block text-left p-2 rounded-sm transition-all ${activeMenu === `folder_${folder.id}` ? 'bg-zinc-800 border-l-4' : 'hover:bg-zinc-900'} ${isVelvet && activeMenu === `folder_${folder.id}` ? 'border-[#D4AF37]' : 'border-phantom-red'}`}><div className="flex items-center justify-between"><div className="flex items-center space-x-3 overflow-hidden"><Folder size={18} className={activeMenu === `folder_${folder.id}` ? 'text-white' : 'text-zinc-500'} /><span className={`font-p5 text-lg truncate ${activeMenu === `folder_${folder.id}` ? 'text-white' : 'text-zinc-400'}`}>{folder.name}</span></div><div onClick={(e) => { onDeleteFolder(folder.id, e); playSfx('cancel'); }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 transition-opacity"><Trash2 size={14} /></div></div></button>))}</div></div>);
};

const MiddlePane = ({ activeMenu, papers, selectedId, onSelect, onAddPaper, onDeletePaper, onBulkDelete, toggleFusionSelection, fusionTargetIds, isFusing, setIsFusing, setFusionResult, fusionResult, showCurtain, setShowCurtain, onLevelUp, playSfx }: any) => {
    const [inputUrl, setInputUrl] = useState('');
    const [isStealing, setIsStealing] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const isVelvet = activeMenu === 'velvet';
    const filteredPapers = papers.filter((p: Paper) => { if (activeMenu === 'all' || activeMenu === 'velvet') return true; if (activeMenu === 'recent') return true; if (activeMenu.startsWith('folder_')) return p.folderId === activeMenu.split('folder_')[1]; return false; });
    const handleSteal = (e: React.FormEvent) => { e.preventDefault(); setIsStealing(true); playSfx('confirm'); setTimeout(() => { onAddPaper(inputUrl); setInputUrl(''); setIsStealing(false); }, 1000); };
    const toggleSelection = (id: number) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); playSfx('click'); };
    const executeBulkDelete = () => { if (window.confirm(`BURN ${selectedIds.length} INTEL ITEMS?`)) { onBulkDelete(selectedIds); setSelectedIds([]); setIsSelectionMode(false); playSfx('impact'); } };
    const startFusion = () => { setShowCurtain(true); setTimeout(() => { setIsFusing(true); setShowCurtain(false); }, 600); playSfx('confirm'); };
    return (<div className={`h-full flex-1 flex flex-col relative overflow-hidden transition-colors duration-500 ${isVelvet ? 'bg-[#000022]' : 'bg-[#161616]'}`}><div className={`h-24 flex items-center justify-between px-8 relative z-10 border-b-4 shrink-0 transition-colors duration-500 ${isVelvet ? 'bg-[#000033] border-[#D4AF37]' : 'bg-phantom-black border-white'}`}><div className="absolute inset-0 bg-halftone opacity-30" /><div className="z-10 flex items-center"><h2 className={`text-4xl font-p5 tracking-wide transform -skew-x-12 uppercase truncate max-w-xs ${isVelvet ? 'text-[#D4AF37]' : 'text-white'}`}>{activeMenu === 'add' ? 'INFILTRATION' : activeMenu === 'velvet' ? 'VELVET ROOM' : 'MEMENTOS'}</h2>{isSelectionMode && !isVelvet && <span className="ml-4 bg-phantom-red text-black font-bold px-2 transform -skew-x-12">SELECT MODE</span>}</div>{!isVelvet && activeMenu !== 'add' && <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); playSfx('click'); }} className={`z-10 p-2 rounded border-2 transition-all ${isSelectionMode ? 'bg-white text-black border-phantom-red' : 'text-zinc-500 border-zinc-700 hover:text-white'}`}><Trash2 size={20} /></button>}</div><div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 custom-scrollbar bg-halftone relative">{activeMenu !== 'add' ? (filteredPapers.map((paper: Paper) => { const isSelected = isVelvet ? fusionTargetIds.includes(paper.id) : (isSelectionMode ? selectedIds.includes(paper.id) : selectedId === paper.id); return (<motion.div key={paper.id} onClick={() => isVelvet ? toggleFusionSelection(paper.id) : (isSelectionMode ? toggleSelection(paper.id) : onSelect(paper))} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: 10, scale: 1.01 }} className={`relative p-5 cursor-pointer group transition-all duration-200 transform -skew-x-6 ${isSelected ? (isVelvet ? 'bg-[#D4AF37] text-black shadow-[8px_8px_0px_#000033]' : (isSelectionMode ? 'bg-zinc-800 border-l-8 border-phantom-red' : 'bg-phantom-red text-white shadow-[8px_8px_0px_#000]')) : (isVelvet ? 'bg-[#000033] text-zinc-400 border-l-4 border-[#D4AF37] hover:bg-[#000044] hover:text-white' : 'bg-[#222] text-zinc-400 hover:bg-[#333] hover:text-white border-l-4 border-zinc-600')}`} onMouseEnter={() => playSfx('hover')}><div className="transform skew-x-6 flex items-start gap-4">{isSelectionMode && !isVelvet && <div className={`w-6 h-6 border-2 flex items-center justify-center ${selectedIds.includes(paper.id) ? 'bg-phantom-red border-phantom-red' : 'border-zinc-500'}`}>{selectedIds.includes(paper.id) && <X size={16} className="text-black" />}</div>}<div className="flex-1"><div className="flex justify-between items-start"><h3 className={`font-p5 text-2xl leading-none mb-2 ${isSelected ? 'text-black' : 'text-white'}`}>{paper.title}</h3>{!isSelectionMode && !isVelvet && <div className="flex items-center space-x-2">{paper.ocrStatus === 'scanning' && <Loader2 className="animate-spin text-phantom-yellow" size={16} />}{selectedId === paper.id && <Star className="w-6 h-6 text-black fill-current animate-spin-slow" />}<button onClick={(e) => { onDeletePaper(paper.id, e); playSfx('cancel'); }} className={`hover:text-white hover:bg-black rounded-full p-1 transition-colors ${selectedId === paper.id ? 'text-black' : 'text-zinc-600'}`}><Trash2 size={16} /></button></div>}</div><div className={`flex items-center space-x-4 text-xs font-mono uppercase tracking-widest ${isSelected ? 'text-black font-bold' : 'opacity-60'}`}><span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> {paper.type}</span><span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {paper.year}</span><span>:: {paper.author}</span></div></div></div></motion.div>) })) : (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full p-10"><div className="w-full max-w-xl bg-white p-8 border-4 border-phantom-black shadow-[16px_16px_0px_#E60012] transform -rotate-1"><h3 className="text-4xl font-p5 text-black mb-6 flex items-center"><Plus className="mr-2" strokeWidth={4} /> TARGET ACQUISITION</h3><form onSubmit={handleSteal} className="space-y-6"><input type="text" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} placeholder="https://arxiv.org/..." className="w-full bg-zinc-100 border-2 border-black p-4 font-mono text-lg focus:bg-black focus:text-phantom-red focus:outline-none transition-colors" autoFocus /><button type="submit" disabled={!inputUrl || isStealing} className="w-full bg-phantom-red text-white font-p5 text-2xl py-4 hover:bg-black hover:text-phantom-red border-2 border-transparent hover:border-phantom-red transition-all flex justify-center items-center">{isStealing ? "INFILTRATING..." : "SEND CALLING CARD"}</button></form></div></motion.div>)}</div><AnimatePresence>{isVelvet && fusionTargetIds.length === 2 && <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="absolute bottom-0 left-0 right-0 bg-[#000033] p-4 flex justify-between items-center z-50 border-t-4 border-[#D4AF37]"><span className="font-p5 text-2xl text-[#D4AF37]">RITUAL READY</span><button onClick={startFusion} className="bg-[#D4AF37] text-black px-6 py-2 font-p5 text-xl hover:bg-white transition-colors flex items-center gap-2"><Combine size={20} /> COMMENCE FUSION</button></motion.div>}{isSelectionMode && selectedIds.length > 0 && !isVelvet && <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="absolute bottom-0 left-0 right-0 bg-phantom-red p-4 flex justify-between items-center z-50 border-t-4 border-black"><span className="font-p5 text-2xl text-black">{selectedIds.length} ITEMS SELECTED</span><button onClick={executeBulkDelete} className="bg-black text-white px-6 py-2 font-p5 text-xl hover:bg-white hover:text-black transition-colors flex items-center gap-2"><Trash2 size={20} /> BURN EVIDENCE</button></motion.div>}</AnimatePresence><AnimatePresence>{isFusing && <VelvetOverlay papers={papers.filter(p => fusionTargetIds.includes(p.id))} onComplete={(result) => { setShowCurtain(true); setTimeout(() => { setIsFusing(false); setFusionResult(result); setTimeout(() => setShowCurtain(false), 500); }, 600); }} onLevelUp={onLevelUp} playSfx={playSfx} />}</AnimatePresence></div>);
};

const RightPane = ({ paper, onClose, onAnalyze, onRead, playSfx }: any) => {
  const [analyzing, setAnalyzing] = useState(false);
  const handleAnalyze = async () => { setAnalyzing(true); await onAnalyze(); setAnalyzing(false); };
  return (<AnimatePresence>{paper && (<motion.div initial={{ x: "100%", skewX: -20 }} animate={{ x: 0, skewX: 0 }} exit={{ x: "100%", skewX: 20 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="w-[600px] bg-white h-full shadow-[-20px_0_40px_rgba(0,0,0,0.5)] relative z-50 flex flex-col border-l-[12px] border-phantom-black"><div className="h-64 bg-phantom-red relative overflow-hidden flex items-end p-8 shrink-0 clip-path-jagged"><button onClick={() => { onClose(); playSfx('cancel'); }} className="absolute top-4 right-4 text-black hover:text-white hover:rotate-90 transition-transform"><X size={40} strokeWidth={4} /></button><div className="absolute inset-0 bg-halftone opacity-20 mix-blend-overlay" /><motion.h1 key={paper.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl font-p5 text-black leading-[0.9] transform -rotate-1 origin-bottom-left">{paper.title}</motion.h1></div><div className="flex-1 p-10 bg-zinc-100 overflow-y-auto"><div className="space-y-8"><div className="border-b-2 border-black pb-6"><div className="flex items-center justify-between mb-4"><div className="flex space-x-4 font-mono text-sm"><div className="bg-black text-white px-3 py-1 transform -skew-x-12">AUTH: {paper.author}</div><div className="bg-black text-white px-3 py-1 transform -skew-x-12">TYPE: {paper.type}</div></div><motion.button onClick={() => { onRead(); playSfx('confirm'); }} whileHover={{ scale: 1.1, rotate: 3 }} whileTap={{ scale: 0.9 }} className="flex items-center space-x-2 bg-phantom-red text-white px-4 py-2 font-p5 text-xl tracking-widest border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-black hover:text-phantom-red transition-all"><Eye size={20} /> <span>READ</span></motion.button></div>{paper.tags.length > 0 && (<div className="flex flex-wrap gap-2 mt-2">{paper.tags.map((tag: string, i: number) => (<span key={i} className={`font-p5 text-lg px-3 py-1 transform -skew-x-12 border-2 border-black ${i % 2 === 0 ? 'bg-phantom-yellow text-black rotate-2' : 'bg-phantom-black text-white -rotate-1'}`}>#{tag.toUpperCase()}</span>))}</div>)}</div><p className="font-serif text-xl italic text-gray-800 leading-relaxed pl-6 border-l-4 border-phantom-red">"{paper.abstract}"</p>{!paper.shadow_problem ? (<motion.button onClick={handleAnalyze} disabled={analyzing} whileHover={{ scale: 1.02, x: 5 }} className="w-full py-8 bg-black text-phantom-red font-p5 text-3xl tracking-widest flex items-center justify-center space-x-4 group border-4 border-transparent hover:border-phantom-red transition-all">{analyzing ? <BrainCircuit className="w-10 h-10 animate-spin text-white" /> : <><BrainCircuit className="w-8 h-8 group-hover:animate-pulse" /> <span>ACTIVATE THIRD EYE</span></>}</motion.button>) : (<div className="space-y-6 pt-4"><h2 className="text-4xl font-p5 text-center bg-black text-white transform -skew-x-12 py-2">TRUTH REVEALED</h2><div className="grid gap-4"><motion.div initial={{x:-50, opacity:0}} animate={{x:0, opacity:1}} className="bg-[#222] p-5 text-white shadow-[6px_6px_0px_#E60012] transform -rotate-1"><h4 className="text-phantom-red font-bold uppercase tracking-widest text-xs">Shadow</h4><p className="font-p5 text-2xl">{paper.shadow_problem}</p></motion.div><motion.div initial={{x:50, opacity:0}} animate={{x:0, opacity:1}} transition={{delay:0.1}} className="bg-white border-4 border-black p-5 text-black shadow-[6px_6px_0px_#222] transform rotate-1"><h4 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Persona</h4><p className="font-p5 text-2xl">{paper.persona_solution}</p></motion.div><motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.2}} className="bg-phantom-yellow border-4 border-black p-4 text-black transform -skew-x-6"><h4 className="text-black font-bold uppercase tracking-widest text-xs">Weakness</h4><p className="font-mono font-bold text-lg text-red-600">{paper.weakness_flaw}</p></motion.div></div></div>)}</div></div></motion.div>)}</AnimatePresence>);
};

// --- Main App ---

function App() {
  const [papers, setPapers] = useState<Paper[]>(() => { const saved = localStorage.getItem('phantom_papers'); return saved ? JSON.parse(saved) : INITIAL_PAPERS; });
  const [folders, setFolders] = useState<FolderType[]>(() => { const saved = localStorage.getItem('phantom_folders'); return saved ? JSON.parse(saved) : INITIAL_FOLDERS; });
  const [stats, setStats] = useState<PhantomStats>(() => { const saved = localStorage.getItem('phantom_stats'); return saved ? JSON.parse(saved) : INITIAL_STATS; });

  useEffect(() => { localStorage.setItem('phantom_papers', JSON.stringify(papers)); }, [papers]);
  useEffect(() => { localStorage.setItem('phantom_folders', JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('phantom_stats', JSON.stringify(stats)); }, [stats]);

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [activeMenu, setActiveMenu] = useState('all');
  const [isReading, setIsReading] = useState(false);
  const [readingPaper, setReadingPaper] = useState<Paper | null>(null);
  const [showSubway, setShowSubway] = useState(false);
  
  const [fusionTargetIds, setFusionTargetIds] = useState<number[]>([]);
  const [isFusing, setIsFusing] = useState(false);
  const [fusionResult, setFusionResult] = useState<string | null>(null);
  const [showCurtain, setShowCurtain] = useState(false);
  const [showRankUp, setShowRankUp] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  // INIT AUDIO
  const playSfx = useAudioSystem();

  const handleLevelUp = (statName: keyof PhantomStats) => {
      setStats(prev => ({ ...prev, [statName]: Math.min(10, prev[statName] + 1) }));
      setShowRankUp(statName);
      playSfx('rankup'); // AUDIO TRIGGER
      setTimeout(() => setShowRankUp(null), 3000);
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
              e.preventDefault();
              setShowSubway(prev => !prev);
              playSfx('confirm');
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const processOCR = async (file: File, paperId: number) => { try { const formData = new FormData(); formData.append('file', file); const response = await fetch('/api/scan_document', { method: 'POST', body: formData }); if (!response.ok) throw new Error("Scan Failed"); const data = await response.json(); setPapers(prev => prev.map(p => { if (p.id === paperId) { return { ...p, ocrStatus: 'complete', content: data.extracted_text, abstract: data.extracted_text.substring(0, 200) + "..." }; } return p; })); } catch (e) { setPapers(prev => prev.map(p => p.id === paperId ? { ...p, ocrStatus: 'failed' } : p)); } };
  const handleBulkImport = (files: FileList, targetFolderId?: string) => { const targetFolder = targetFolderId || (activeMenu.startsWith('folder_') ? activeMenu.split('folder_')[1] : undefined); const newPapers: Paper[] = []; Array.from(files).forEach((file, i) => { const isPdf = file.type === 'application/pdf'; const isText = file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt'); const id = Date.now() + i; const newPaper: Paper = { id, title: file.name.replace(/\.[^/.]+$/, ""), author: "Local Upload", year: "2024", type: isPdf ? "PDF" : (isText ? "FILE" : "IMG"), folderId: targetFolder, tags: ["Uploaded"], abstract: "Processing content...", content: "", fileUrl: isPdf ? URL.createObjectURL(file) : undefined, ocrStatus: 'scanning' }; newPapers.push(newPaper); processOCR(file, id); }); setPapers(prev => [...newPapers, ...prev]); if (newPapers.length > 0) { if (targetFolder) setActiveMenu(`folder_${targetFolder}`); else setActiveMenu('all'); } };
  const handleAddPaper = (url: string) => { const newPaper: Paper = { id: Date.now(), title: "Target: " + url.substring(0, 15) + "...", author: "Unknown Entity", year: "2025", type: "WEB", tags: ["Infiltrated"], abstract: "Data successfully extracted from the target URL.", content: "Web content would be scraped here.", ocrStatus: 'complete' }; setPapers(prev => [newPaper, ...prev]); setActiveMenu('all'); setSelectedPaper(newPaper); playSfx('confirm'); };
  const handleDeletePaper = (id: number, e: React.MouseEvent) => { e.stopPropagation(); if (window.confirm("DELETE THIS INTEL?")) { setPapers(prev => prev.filter(p => p.id !== id)); if (selectedPaper?.id === id) setSelectedPaper(null); playSfx('impact'); } };
  const handleBulkDelete = (ids: number[]) => { setPapers(prev => prev.filter(p => !ids.includes(p.id))); if (selectedPaper && ids.includes(selectedPaper.id)) setSelectedPaper(null); playSfx('impact'); };
  const handleThirdEye = async () => { if (!selectedPaper) return; playSfx('confirm'); const content = (selectedPaper.title + " " + selectedPaper.abstract).toLowerCase(); const aiTags = []; if (content.match(/vision|image/)) aiTags.push("CV"); if (content.match(/language|text/)) aiTags.push("NLP"); aiTags.push("DeepSeek-V3"); const updated = { ...selectedPaper, shadow_problem: "Obfuscated Truth", persona_solution: "Clarified Cognition", weakness_flaw: "Requires MP", tags: Array.from(new Set([...selectedPaper.tags, ...aiTags])) }; setPapers(prev => prev.map(p => p.id === updated.id ? updated : p)); setSelectedPaper(updated); handleLevelUp('proficiency'); };
  const handleAddFolder = () => { const name = window.prompt("ENTER MISSION NAME:"); if (name) { setFolders(prev => [...prev, { id: Date.now().toString(), name }]); handleLevelUp('kindness'); playSfx('confirm'); } };
  const handleDeleteFolder = (id: string, e: React.MouseEvent) => { e.stopPropagation(); if (window.confirm("BURN EVIDENCE?")) { setFolders(prev => prev.filter(f => f.id !== id)); if (activeMenu === `folder_${id}`) setActiveMenu('all'); playSfx('impact'); } };
  const handleRead = (paper?: Paper) => { const target = paper || selectedPaper; if (target) { setReadingPaper(target); setIsReading(true); playSfx('click'); } };
  const toggleFusionSelection = (id: number) => { if (fusionTargetIds.includes(id)) { setFusionTargetIds(prev => prev.filter(i => i !== id)); } else { if (fusionTargetIds.length < 2) { setFusionTargetIds(prev => [...prev, id]); } } playSfx('click'); };

  return (
    <div className="flex h-screen w-screen bg-phantom-black overflow-hidden font-sans text-white relative">
      <TransitionCurtain isActive={showCurtain} />
      <RankUpNotification stat={showRankUp} />
      {showStats && <StatsOverlay stats={stats} onClose={() => setShowStats(false)} playSfx={playSfx} />}
      <LeftPane activeMenu={activeMenu} setActiveMenu={setActiveMenu} folders={folders} onAddFolder={handleAddFolder} onDeleteFolder={handleDeleteFolder} onBulkImport={handleBulkImport} onShowStats={() => { setShowStats(true); playSfx('confirm'); }} playSfx={playSfx} />
      <div className="flex-1 flex relative">
        <MiddlePane 
            activeMenu={activeMenu} 
            papers={papers} 
            selectedId={selectedPaper?.id || null} 
            onSelect={(p: Paper) => { setSelectedPaper(p); playSfx('click'); }} 
            onAddPaper={handleAddPaper} 
            onDeletePaper={handleDeletePaper} 
            onBulkDelete={handleBulkDelete}
            toggleFusionSelection={toggleFusionSelection}
            fusionTargetIds={fusionTargetIds}
            isFusing={isFusing}
            setIsFusing={setIsFusing}
            setFusionResult={setFusionResult}
            fusionResult={fusionResult}
            showCurtain={showCurtain}
            setShowCurtain={setShowCurtain}
            onLevelUp={handleLevelUp}
            playSfx={playSfx} // PASSED
        />
      </div>
      <div className="relative">
         <RightPane paper={selectedPaper} onClose={() => setSelectedPaper(null)} onAnalyze={handleThirdEye} onRead={() => handleRead()} playSfx={playSfx} />
      </div>
      <AnimatePresence>
        {isReading && readingPaper && <ReaderOverlay paper={readingPaper} onClose={() => setIsReading(false)} onLevelUp={handleLevelUp} playSfx={playSfx} />}
        {showSubway && <SubwayOverlay papers={papers} folders={folders} onClose={() => setShowSubway(false)} onRead={handleRead} playSfx={playSfx} />}
        {fusionResult && fusionTargetIds.length === 2 && (
            <FusionWorkspace 
                paperA={papers.find(p => p.id === fusionTargetIds[0])!} 
                paperB={papers.find(p => p.id === fusionTargetIds[1])!} 
                initialReport={fusionResult} 
                onClose={() => setFusionResult(null)} 
                playSfx={playSfx}
            />
        )}
      </AnimatePresence>
      <PhantomIM />
    </div>
  );
}

export default App;
