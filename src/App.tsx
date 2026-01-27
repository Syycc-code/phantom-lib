import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pdfjs } from 'react-pdf';
// Import react-pdf styles to fix warnings and text selection
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { 
  BookOpen, 
  Tag, 
  Plus, 
  FileText, 
  Clock, 
  Star,
  X,
  Folder as FolderIcon,
  Trash2,
  PlusCircle,
  Upload,
  Eye,
  User, 
  Gem,
  Combine,
  Loader2,
  BrainCircuit
} from 'lucide-react';

import PhantomIM from './components/PhantomIM';
import { 
  SubwayOverlay, 
  ReaderOverlay, 
  VelvetOverlay, 
  FusionWorkspace,
  RankUpNotification,
  StatsOverlay,
  TransitionCurtain
} from './components';
import SystemMonitor from './components/SystemMonitor'; // Add import
import type { Paper, Folder, PhantomStats } from './types';
import { INITIAL_FOLDERS, INITIAL_PAPERS } from './constants';

// Backward compatibility alias
type FolderType = Folder;

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

const INITIAL_STATS: PhantomStats = {
    knowledge: 1,
    guts: 1,
    proficiency: 1,
    kindness: 1,
    charm: 1
};

// --- Components ---

const LeftPane = ({ activeMenu, setActiveMenu, folders, onAddFolder, onDeleteFolder, onBulkImport, onShowStats, playSfx }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVelvet = activeMenu === 'velvet';
  const systemItems = [{ icon: BookOpen, label: 'All References', id: 'all' }, { icon: Plus, label: 'Infiltrate (Add)', id: 'add' }, { icon: Gem, label: 'Velvet Room', id: 'velvet' }, { icon: Tag, label: 'Recent', id: 'recent' }];
  return (<div className={`h-full border-r-4 p-6 flex flex-col text-white w-72 shrink-0 relative overflow-hidden z-20 transition-colors duration-500 ${isVelvet ? 'bg-[#000033] border-[#D4AF37]' : 'bg-phantom-black border-phantom-red'}`}><div className="absolute top-0 left-0 w-full h-full bg-halftone opacity-50 pointer-events-none" /><div className="mb-10 relative transform -rotate-6 origin-top-left cursor-default"><h1 className={`text-6xl font-p5 tracking-tighter leading-none ${isVelvet ? 'text-[#D4AF37]' : 'text-white'}`} style={{ textShadow: isVelvet ? "2px 2px 0px #000" : "4px 4px 0px #E60012" }}>ARCHIVE</h1><div className="bg-white text-black text-xs font-bold px-2 inline-block transform skew-x-[-12deg] mt-1 ml-2">PHANTOM LIB V.2.7</div></div><button onClick={() => { onShowStats(); playSfx('click'); }} className="mb-6 flex items-center space-x-2 bg-black border-2 border-white text-white p-2 hover:bg-white hover:text-black transition-colors w-full group"><User className="group-hover:rotate-12 transition-transform" /><span className="font-p5 text-lg">PHANTOM STATS</span></button><nav className="space-y-4 z-10 mb-8">{systemItems.map((item) => (<button key={item.id} onClick={() => { setActiveMenu(item.id); playSfx('click'); }} className="relative w-full group cursor-pointer block text-left" onMouseEnter={() => playSfx('hover')}>{activeMenu === item.id && <div className={`absolute inset-0 bg-white shadow-[4px_4px_0px_#000] clip-path-slash ${isVelvet ? 'shadow-[#D4AF37]' : 'shadow-[#E60012]'}`} />}<div className={`relative flex items-center space-x-4 p-3 transform -skew-x-12 transition-colors duration-200 ${activeMenu === item.id ? 'text-black pl-8' : 'text-gray-400 hover:text-white'}`}><item.icon className={`w-6 h-6 ${activeMenu === item.id ? 'stroke-[3px]' : ''}`} /><span className="font-p5 text-xl tracking-wider uppercase">{item.label}</span></div></button>))}<input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onBulkImport(e.target.files)} multiple className="hidden" /><button onClick={() => { fileInputRef.current?.click(); playSfx('click'); }} className="relative w-full group cursor-pointer block text-left" onMouseEnter={() => playSfx('hover')}><div className={`relative flex items-center space-x-4 p-3 transform -skew-x-12 hover:text-white transition-colors ${isVelvet ? 'text-[#D4AF37]' : 'text-phantom-yellow'}`}><Upload className="w-6 h-6" /><span className="font-p5 text-xl tracking-wider uppercase">BULK UPLOAD</span></div></button></nav><div className={`flex items-center justify-between border-b-2 pb-2 mb-4 z-10 ${isVelvet ? 'border-[#D4AF37]' : 'border-zinc-700'}`}><h3 className={`text-sm font-bold tracking-[0.2em] ${isVelvet ? 'text-[#D4AF37]' : 'text-phantom-red'}`}>MISSIONS</h3><button onClick={() => { onAddFolder(); playSfx('confirm'); }} className={`text-white hover:rotate-90 transition-all ${isVelvet ? 'hover:text-[#D4AF37]' : 'hover:text-phantom-red'}`}><PlusCircle size={18} /></button></div><div className="flex-1 overflow-y-auto z-10 space-y-2 pr-2 custom-scrollbar">{folders.map((folder: FolderType) => (<button key={folder.id} onClick={() => { setActiveMenu(`folder_${folder.id}`); playSfx('click'); }} onMouseEnter={() => playSfx('hover')} className={`relative w-full group cursor-pointer block text-left p-2 rounded-sm transition-all ${activeMenu === `folder_${folder.id}` ? 'bg-zinc-800 border-l-4' : 'hover:bg-zinc-900'} ${isVelvet && activeMenu === `folder_${folder.id}` ? 'border-[#D4AF37]' : 'border-phantom-red'}`}><div className="flex items-center justify-between"><div className="flex items-center space-x-3 overflow-hidden"><FolderIcon size={18} className={activeMenu === `folder_${folder.id}` ? 'text-white' : 'text-zinc-500'} /><span className={`font-p5 text-lg truncate ${activeMenu === `folder_${folder.id}` ? 'text-white' : 'text-zinc-400'}`}>{folder.name}</span></div><div onClick={(e) => { onDeleteFolder(folder.id, e); playSfx('cancel'); }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 transition-opacity"><Trash2 size={14} /></div></div></button>))}</div></div>);
};

const MiddlePane = ({ activeMenu, papers, selectedId, onSelect, onAddPaper, onDeletePaper, onBulkDelete, toggleFusionSelection, fusionTargetIds, isFusing, setIsFusing, setFusionResult, setShowCurtain, onLevelUp, playSfx }: any) => {
    const [inputUrl, setInputUrl] = useState('');
    const [isStealing, setIsStealing] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const isVelvet = activeMenu === 'velvet';
    const filteredPapers = papers.filter((p: any) => { if (activeMenu === 'all' || activeMenu === 'velvet') return true; if (activeMenu === 'recent') return true; if (activeMenu.startsWith('folder_')) return p.folderId === activeMenu.split('folder_')[1]; return false; });
    const handleSteal = (e: React.FormEvent) => { e.preventDefault(); setIsStealing(true); playSfx('confirm'); setTimeout(() => { onAddPaper(inputUrl); setInputUrl(''); setIsStealing(false); }, 1000); };
    const toggleSelection = (id: number) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); playSfx('click'); };
    const executeBulkDelete = () => { if (window.confirm(`BURN ${selectedIds.length} INTEL ITEMS?`)) { onBulkDelete(selectedIds); setSelectedIds([]); setIsSelectionMode(false); playSfx('impact'); } };
    const startFusion = () => { setShowCurtain(true); setTimeout(() => { setIsFusing(true); setShowCurtain(false); }, 600); playSfx('confirm'); };

    // JUICY INTERACTION VARIANTS
    const cardVariants = {
        hidden: { opacity: 0, x: -50, rotateX: 90 },
        visible: (i: number) => ({ 
            opacity: 1, 
            x: 0, 
            rotateX: 0,
            transition: { delay: i * 0.05, type: "spring" }
        }),
        hover: { 
            scale: 1.05, 
            x: 20, 
            skewX: -10,
            backgroundColor: "#E60012",
            color: "#FFF",
            boxShadow: "10px 10px 0px rgba(0,0,0,1)",
            zIndex: 10
        },
        tap: { scale: 0.95, x: 10, skewX: 0 },
        selected: { 
            x: 30, 
            backgroundColor: "#000", 
            color: "#E60012",
            borderLeftWidth: "16px",
            borderColor: "#E60012",
            skewX: -5
        }
    };

    return (<div className={`h-full flex-1 flex flex-col relative overflow-hidden transition-colors duration-500 ${isVelvet ? 'bg-[#000022]' : 'bg-[#161616]'}`}><div className={`h-24 flex items-center justify-between px-8 relative z-10 border-b-4 shrink-0 transition-colors duration-500 ${isVelvet ? 'bg-[#000033] border-[#D4AF37]' : 'bg-phantom-black border-white'}`}><div className="absolute inset-0 bg-halftone opacity-30" /><div className="z-10 flex items-center"><h2 className={`text-4xl font-p5 tracking-wide transform -skew-x-12 uppercase truncate max-w-xs ${isVelvet ? 'text-[#D4AF37]' : 'text-white'}`}>{activeMenu === 'add' ? 'INFILTRATION' : activeMenu === 'velvet' ? 'VELVET ROOM' : 'MEMENTOS'}</h2>{isSelectionMode && !isVelvet && <span className="ml-4 bg-phantom-red text-black font-bold px-2 transform -skew-x-12">SELECT MODE</span>}</div>{!isVelvet && activeMenu !== 'add' && <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); playSfx('click'); }} className={`z-10 p-2 rounded border-2 transition-all ${isSelectionMode ? 'bg-white text-black border-phantom-red' : 'text-zinc-500 border-zinc-700 hover:text-white'}`}><Trash2 size={20} /></button>}</div><div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 custom-scrollbar bg-halftone relative">
    {activeMenu !== 'add' ? (
        <AnimatePresence>
        {filteredPapers.map((paper: any, i: number) => { 
            const isSelected = isVelvet ? fusionTargetIds.includes(paper.id) : (isSelectionMode ? selectedIds.includes(paper.id) : selectedId === paper.id); 
            return (
                <motion.div 
                    key={paper.id} 
                    layoutId={`paper-${paper.id}`}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate={isSelected ? "selected" : "visible"}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => isVelvet ? toggleFusionSelection(paper.id) : (isSelectionMode ? toggleSelection(paper.id) : onSelect(paper))} 
                    className={`relative p-5 cursor-pointer group transition-colors duration-100 transform border-2 border-transparent ${
                        isSelected ? '' : 'bg-zinc-900 border-zinc-700 text-gray-300'
                    }`}
                    style={{ clipPath: "polygon(0 0, 100% 0, 98% 100%, 2% 98%)" }}
                >
                    {/* DECORATIVE SPIKE ON HOVER */}
                    <div className="absolute -left-10 top-0 bottom-0 w-8 bg-black transform skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h3 className="font-p5 text-2xl tracking-wide line-clamp-1">{paper.title}</h3>
                            <div className="flex items-center space-x-2 mt-2 opacity-80 font-mono text-xs">
                                <span className="bg-white/20 px-1">{paper.year}</span>
                                <span>// {paper.author}</span>
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Star className="fill-current" size={24} />
                        </div>
                    </div>
                    {/* SELECTION INDICATOR */}
                    {isSelected && <div className="absolute right-2 top-2 text-phantom-red"><Gem size={24} /></div>}
                </motion.div>
            );
        })}
        </AnimatePresence>
    ) : (
        <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-500">
            <Upload size={80} className="text-phantom-red mb-6 animate-bounce" />
            <h2 className="text-4xl font-p5 mb-4">DRAG & DROP INTEL</h2>
            <p className="text-gray-400 max-w-md font-mono mb-8">
                Target PDFs, Images, or Text Logs.<br/>
                The system will automatically analyze and index the data.
            </p>
            <button 
                onClick={() => document.querySelector('input[type="file"]')?.click()}
                className="bg-phantom-red text-white px-8 py-3 text-2xl font-p5 border-4 border-black shadow-[8px_8px_0px_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
                SELECT FILES
            </button>
        </div>
    )}
    </div>{isSelectionMode && selectedIds.length > 0 && (<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50"><button onClick={executeBulkDelete} className="bg-phantom-red text-white text-2xl font-p5 px-8 py-4 border-4 border-black shadow-[8px_8px_0px_#000] hover:bg-black hover:text-phantom-red transition-all flex items-center space-x-3"><Trash2 /><span>BURN ({selectedIds.length})</span></button></div>)}{isVelvet && fusionTargetIds.length === 2 && (<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50"><button onClick={startFusion} className="bg-[#D4AF37] text-black text-3xl font-p5 px-12 py-6 border-4 border-white shadow-[0px_0px_20px_#D4AF37] hover:scale-110 transition-transform flex items-center space-x-3"><Combine size={32} /><span>EXECUTE FUSION</span></button></div>)}</div>);
};

const RightPane = ({ paper, onClose, onAnalyze, onRead, playSfx }: any) => {
  const [analyzing, setAnalyzing] = useState(false);
  const handleAnalyze = async () => { setAnalyzing(true); await onAnalyze(); setAnalyzing(false); };
  return (<AnimatePresence>{paper && (<motion.div initial={{ x: "100%", skewX: -20 }} animate={{ x: 0, skewX: 0 }} exit={{ x: "100%", skewX: 20 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="w-[600px] bg-white h-full shadow-[-20px_0_40px_rgba(0,0,0,0.5)] relative z-50 flex flex-col border-l-[12px] border-phantom-black"><div className="h-64 bg-phantom-red relative overflow-hidden flex items-end p-8 shrink-0 clip-path-jagged"><button onClick={() => { onClose(); playSfx('cancel'); }} className="absolute top-4 right-4 text-black hover:text-white hover:rotate-90 transition-transform"><X size={40} strokeWidth={4} /></button><div className="absolute inset-0 bg-halftone opacity-20 mix-blend-overlay" /><motion.h1 key={paper.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl font-p5 text-black leading-[0.9] transform -rotate-1 origin-bottom-left">{paper.title}</motion.h1></div><div className="flex-1 p-10 bg-zinc-100 overflow-y-auto"><div className="space-y-8"><div className="border-b-2 border-black pb-6"><div className="flex items-center justify-between mb-4"><div className="flex space-x-4 font-mono text-sm"><div className="bg-black text-white px-3 py-1 transform -skew-x-12">AUTH: {paper.author}</div><div className="bg-black text-white px-3 py-1 transform -skew-x-12">TYPE: {paper.type}</div></div><motion.button onClick={() => { onRead(); playSfx('confirm'); }} whileHover={{ scale: 1.1, rotate: 3 }} whileTap={{ scale: 0.9 }} className="flex items-center space-x-2 bg-phantom-red text-white px-4 py-2 font-p5 text-xl tracking-widest border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-black hover:text-phantom-red transition-all"><Eye size={20} /> <span>READ</span></motion.button></div>{paper.tags.length > 0 && (<div className="flex flex-wrap gap-2 mt-2">{paper.tags.map((tag: string, i: number) => (<span key={i} className={`font-p5 text-lg px-3 py-1 transform -skew-x-12 border-2 border-black ${i % 2 === 0 ? 'bg-phantom-yellow text-black rotate-2' : 'bg-phantom-black text-white -rotate-1'}`}>#{tag.toUpperCase()}</span>))}</div>)}</div><p className="font-serif text-xl italic text-gray-800 leading-relaxed pl-6 border-l-4 border-phantom-red">"{paper.abstract}"</p>{!paper.shadow_problem ? (<motion.button onClick={handleAnalyze} disabled={analyzing} whileHover={{ scale: 1.02, x: 5 }} className="w-full py-8 bg-black text-phantom-red font-p5 text-3xl tracking-widest flex items-center justify-center space-x-4 group border-4 border-transparent hover:border-phantom-red transition-all">{analyzing ? <BrainCircuit className="w-10 h-10 animate-spin text-white" /> : <><BrainCircuit className="w-8 h-8 group-hover:animate-pulse" /> <span>ACTIVATE THIRD EYE</span></>}</motion.button>) : (<div className="space-y-6 pt-4"><h2 className="text-4xl font-p5 text-center bg-black text-white transform -skew-x-12 py-2">TRUTH REVEALED</h2><div className="grid gap-4"><motion.div initial={{x:-50, opacity:0}} animate={{x:0, opacity:1}} className="bg-[#222] p-5 text-white shadow-[6px_6px_0px_#E60012] transform -rotate-1"><h4 className="text-phantom-red font-bold uppercase tracking-widest text-xs">Shadow</h4><p className="font-p5 text-2xl">{paper.shadow_problem}</p></motion.div><motion.div initial={{x:50, opacity:0}} animate={{x:0, opacity:1}} transition={{delay:0.1}} className="bg-white border-4 border-black p-5 text-black shadow-[6px_6px_0px_#222] transform rotate-1"><h4 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Persona</h4><p className="font-p5 text-2xl">{paper.persona_solution}</p></motion.div><motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.2}} className="bg-phantom-yellow border-4 border-black p-4 text-black transform -skew-x-6"><h4 className="text-black font-bold uppercase tracking-widest text-xs">Weakness</h4><p className="font-mono font-bold text-lg text-red-600">{paper.weakness_flaw}</p></motion.div></div></div>)}</div></div></motion.div>)}</AnimatePresence>);
};

// --- Main App ---

function App() {
  const [papers, setPapers] = useState<Paper[]>([]); // Initialize empty, load from backend
  const [folders, setFolders] = useState<FolderType[]>(() => { const saved = localStorage.getItem('phantom_folders'); return saved ? JSON.parse(saved) : INITIAL_FOLDERS; });
  const [stats, setStats] = useState<PhantomStats>(() => { const saved = localStorage.getItem('phantom_stats'); return saved ? JSON.parse(saved) : INITIAL_STATS; });

  // Load Papers from Vault (Backend)
  useEffect(() => {
      const loadPapers = async () => {
          try {
              const res = await fetch('/api/papers');
              if (res.ok) {
                  const data = await res.json();
                  // Map backend model to frontend Paper type
                  const mappedPapers = data.map((p: any) => ({
                      ...p,
                      type: "PDF",
                      tags: ["Stored"],
                      content: p.abstract, // Use abstract as content preview
                      fileUrl: `/api/papers/${p.id}/pdf`
                  }));
                  setPapers(mappedPapers);
              }
          } catch (e) {
              console.error("Failed to connect to Vault:", e);
          }
      };
      loadPapers();
  }, []);

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
      playSfx('rankup');
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

  // NEW: Upload to Vault
  const handleBulkImport = async (files: FileList) => { 
      playSfx('confirm');
      const newPapers: Paper[] = [];
      
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type !== 'application/pdf') continue;

          // Optimistic UI update (optional, but let's wait for server for ID)
          try {
              const formData = new FormData();
              formData.append('file', file);
              
              const res = await fetch('/api/upload', { method: 'POST', body: formData });
              if (res.ok) {
                  const p = await res.json();
                  const mappedPaper = {
                      ...p,
                      type: "PDF",
                      tags: ["New"],
                      content: p.abstract,
                      fileUrl: `/api/papers/${p.id}/pdf`
                  };
                  setPapers(prev => [mappedPaper, ...prev]);
                  handleLevelUp('proficiency');
              }
          } catch (e) {
              console.error("Upload failed:", e);
          }
      }
      setActiveMenu('all');
  };

  const handleAddPaper = (url: string) => { 
      // Keep mock web add for now
      const newPaper: Paper = { id: Date.now(), title: "Target: " + url.substring(0, 15) + "...", author: "Unknown Entity", year: "2025", type: "WEB", tags: ["Infiltrated"], abstract: "Data successfully extracted.", content: "", ocrStatus: 'complete' }; 
      setPapers(prev => [newPaper, ...prev]); 
      playSfx('confirm'); 
  };

  const handleDeletePaper = async (id: number, e: React.MouseEvent) => { 
      e.stopPropagation(); 
      if (window.confirm("BURN THIS INTEL?")) { 
          try {
              await fetch(`/api/papers/${id}`, { method: 'DELETE' });
              setPapers(prev => prev.filter(p => p.id !== id)); 
              if (selectedPaper?.id === id) setSelectedPaper(null); 
              playSfx('impact'); 
          } catch (err) {
              console.error("Delete failed:", err);
          }
      } 
  };

  const handleBulkDelete = (ids: number[]) => { 
      // Bulk delete API not implemented yet, do one by one or mock
      ids.forEach(id => handleDeletePaper(id, { stopPropagation: () => {} } as any));
  };

  const handleThirdEye = async () => { if (!selectedPaper) return; playSfx('confirm'); const content = (selectedPaper.title + " " + selectedPaper.abstract).toLowerCase(); const aiTags = []; if (content.match(/vision|image/)) aiTags.push("CV"); if (content.match(/language|text/)) aiTags.push("NLP"); aiTags.push("DeepSeek-V3"); const updated = { ...selectedPaper, shadow_problem: "Obfuscated Truth", persona_solution: "Clarified Cognition", weakness_flaw: "Requires MP", tags: Array.from(new Set([...selectedPaper.tags, ...aiTags])) }; setPapers(prev => prev.map(p => p.id === updated.id ? updated : p)); setSelectedPaper(updated); handleLevelUp('proficiency'); };
  const handleAddFolder = () => { const name = window.prompt("ENTER MISSION NAME:"); if (name) { setFolders(prev => [...prev, { id: Date.now().toString(), name }]); handleLevelUp('kindness'); playSfx('confirm'); } };
  const handleDeleteFolder = (id: string, e: React.MouseEvent) => { e.stopPropagation(); if (window.confirm("BURN EVIDENCE?")) { setFolders(prev => prev.filter(f => f.id !== id)); if (activeMenu === `folder_${id}`) setActiveMenu('all'); playSfx('impact'); } };
  const handleRead = (paper?: Paper) => { const target = paper || selectedPaper; if (target) { setReadingPaper(target); setIsReading(true); playSfx('click'); } };
  const toggleFusionSelection = (id: number) => { if (fusionTargetIds.includes(id)) { setFusionTargetIds(prev => prev.filter(i => i !== id)); } else { if (fusionTargetIds.length < 2) { setFusionTargetIds(prev => [...prev, id]); } } playSfx('click'); };

  return (
    <div className="flex h-screen w-screen bg-phantom-black overflow-hidden font-sans text-white relative">
      <SystemMonitor /> {/* Add Monitor */}
      <TransitionCurtain isActive={showCurtain} />
      <RankUpNotification stat={showRankUp} />
      {showStats && <StatsOverlay stats={stats} onClose={() => setShowStats(false)} playSfx={playSfx} />}
      <LeftPane activeMenu={activeMenu} setActiveMenu={setActiveMenu} folders={folders} onAddFolder={handleAddFolder} onDeleteFolder={handleDeleteFolder} onBulkImport={handleBulkImport} onShowStats={() => { setShowStats(true); playSfx('confirm'); }} playSfx={playSfx} />
      <div className="flex-1 flex relative">
        <MiddlePane 
            activeMenu={activeMenu} 
            papers={papers} 
            selectedId={selectedPaper?.id || null} 
            onSelect={(p: any) => { setSelectedPaper(p); playSfx('click'); }} 
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
