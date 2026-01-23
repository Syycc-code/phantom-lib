import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Maximize2
} from 'lucide-react';

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
  // Content handling
  content?: string; // For text/mock
  fileUrl?: string; // For PDFs (Blob URL)
  // AI Analysis
  shadow_problem?: string;
  persona_solution?: string;
  weakness_flaw?: string;
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
    tags: ["Cognition", "Reality"],
    abstract: "This paper explores the theoretical framework of cognitive psience, proposing that individual realities can be rewritten through the manipulation of the collective unconscious.",
    content: "CHAPTER 1: THE COGNITIVE WORLD\n\nHuman cognition is not merely a passive reception of reality, but an active construction. The 'Metaverse' acts as a shared cognitive substrate...",
    shadow_problem: "Escapism from Reality",
    persona_solution: "Actualization of Will",
    weakness_flaw: "Subjective Tyranny"
  },
  { 
    id: 2, 
    title: "The Art of Theft: A Psychological Study", 
    author: "A. Lupin", 
    year: "1905",
    type: "Book",
    folderId: 'f1',
    tags: ["Psychology", "Crime"],
    abstract: "An analysis of the gentleman thief archetype and its impact on modern security systems.",
    content: "To steal is not merely to take. It is to challenge the ownership of the very concept of property...",
  },
  { 
    id: 3, 
    title: "Mamba: Linear-Time Sequence Modeling", 
    author: "Gu, A. & Dao, T.", 
    year: "2023",
    type: "Arxiv",
    folderId: 'f2',
    tags: ["AI", "LLM"],
    abstract: "Foundation models, now powering most of the exciting applications in deep learning, are almost universally based on the Transformer architecture.",
    content: "ABSTRACT\n\nTransformers have become the de facto standard... However, their quadratic complexity limits context length...",
  },
  {
    id: 4,
    title: "Shadow Operations: Stealth Networking",
    author: "Oracle",
    year: "2024",
    type: "Encrypted",
    folderId: 'f2',
    tags: ["Hacking", "NetSec"],
    abstract: "Protocols for bypassing firewall daemons using high-frequency cognitive noise.",
    content: "ENCRYPTED DATA STREAM // DECRYPTING...\n\nProtocol 77: Use randomized packet headers to mimic background noise...",
  },
];

// --- Components ---

// READER OVERLAY (New Component)
const ReaderOverlay = ({ paper, onClose }: { paper: Paper, onClose: () => void }) => {
    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col"
        >
            {/* Reader Header */}
            <div className="h-20 bg-phantom-red flex items-center justify-between px-8 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-halftone opacity-20 mix-blend-overlay" />
                <div className="z-10 flex items-center space-x-4">
                    <Maximize2 className="text-black" />
                    <h2 className="font-p5 text-3xl text-black truncate max-w-4xl transform -skew-x-12">
                        READING // {paper.title}
                    </h2>
                </div>
                <button 
                    onClick={onClose}
                    className="z-10 bg-black text-white p-3 hover:rotate-90 transition-transform rounded-full shadow-lg border-2 border-white"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Reader Body */}
            <div className="flex-1 bg-zinc-900 relative overflow-hidden">
                {paper.fileUrl ? (
                    /* PDF / Local File Viewer */
                    <iframe 
                        src={paper.fileUrl} 
                        className="w-full h-full border-none" 
                        title="PDF Viewer"
                    />
                ) : (
                    /* Text / Mock Viewer */
                    <div className="h-full overflow-y-auto p-20 max-w-5xl mx-auto custom-scrollbar">
                        <div className="font-serif text-xl leading-loose text-zinc-300 whitespace-pre-wrap">
                            {paper.content || "NO CONTENT DATA AVAILABLE."}
                        </div>
                        
                        {/* Decorative Footer in Text Mode */}
                        <div className="mt-20 border-t-2 border-phantom-red pt-8 opacity-50 font-mono text-sm text-center">
                            END OF COGNITIVE STREAM
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

interface LeftPaneProps {
    activeMenu: string;
    setActiveMenu: (v: string) => void;
    folders: FolderType[];
    onAddFolder: () => void;
    onDeleteFolder: (id: string) => void;
    onBulkImport: (files: FileList) => void;
}

const LeftPane = ({ activeMenu, setActiveMenu, folders, onAddFolder, onDeleteFolder, onBulkImport }: LeftPaneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const systemItems = [
    { icon: BookOpen, label: 'All References', id: 'all' },
    { icon: Plus, label: 'Infiltrate (Add)', id: 'add' },
    { icon: Tag, label: 'Recent', id: 'recent' },
  ];

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onBulkImport(e.target.files);
    }
  };

  return (
    <div className="h-full bg-phantom-black border-r-4 border-phantom-red p-6 flex flex-col text-white w-72 shrink-0 relative overflow-hidden z-20">
      <div className="absolute top-0 left-0 w-full h-full bg-halftone opacity-50 pointer-events-none" />
      
      <div className="mb-10 relative transform -rotate-6 origin-top-left cursor-default">
          <h1 className="text-6xl font-p5 text-white tracking-tighter leading-none" style={{ textShadow: "4px 4px 0px #E60012" }}>
            ARCHIVE
          </h1>
          <div className="bg-white text-black text-xs font-bold px-2 inline-block transform skew-x-[-12deg] mt-1 ml-2">
            PHANTOM LIB V.1.3
          </div>
      </div>

      <nav className="space-y-4 z-10 mb-8">
        {systemItems.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                whileHover={{ scale: 1.05, x: 10 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-full group cursor-pointer block text-left"
              >
                {isActive && (
                    <motion.div 
                        layoutId="active-menu-bg"
                        className="absolute inset-0 bg-white shadow-[4px_4px_0px_#E60012] clip-path-slash"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
                
                <div className={`relative flex items-center space-x-4 p-3 transform -skew-x-12 transition-colors duration-200 ${isActive ? 'text-black pl-8' : 'text-gray-400 hover:text-white'}`}>
                    <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[3px]' : ''}`} />
                    <span className="font-p5 text-xl tracking-wider uppercase">{item.label}</span>
                </div>
              </motion.button>
            )
        })}

        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept=".pdf,.txt,.md"
            className="hidden" 
        />
        <motion.button
            onClick={handleUploadClick}
            whileHover={{ scale: 1.05, x: 10 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-full group cursor-pointer block text-left"
        >
             <div className="relative flex items-center space-x-4 p-3 transform -skew-x-12 text-phantom-yellow hover:text-white transition-colors">
                <Upload className="w-6 h-6" />
                <span className="font-p5 text-xl tracking-wider uppercase">BULK UPLOAD</span>
             </div>
        </motion.button>
      </nav>

      <div className="flex items-center justify-between border-b-2 border-zinc-700 pb-2 mb-4 z-10">
        <h3 className="text-sm font-bold text-phantom-red tracking-[0.2em]">MISSIONS</h3>
        <button onClick={onAddFolder} className="text-white hover:text-phantom-red hover:rotate-90 transition-all">
            <PlusCircle size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto z-10 space-y-2 pr-2 custom-scrollbar">
          {folders.map(folder => {
              const isActive = activeMenu === `folder_${folder.id}`;
              return (
                <motion.button
                    key={folder.id}
                    onClick={() => setActiveMenu(`folder_${folder.id}`)}
                    whileHover={{ x: 5 }}
                    className={`relative w-full group cursor-pointer block text-left p-2 rounded-sm transition-all ${isActive ? 'bg-zinc-800 border-l-4 border-phantom-red' : 'hover:bg-zinc-900'}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <Folder size={18} className={isActive ? 'text-white' : 'text-zinc-500'} />
                            <span className={`font-p5 text-lg truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>{folder.name}</span>
                        </div>
                        <div 
                            onClick={(e) => onDeleteFolder(folder.id, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 transition-opacity"
                        >
                            <Trash2 size={14} />
                        </div>
                    </div>
                </motion.button>
              );
          })}
      </div>
    </div>
  );
};

const MiddlePane = ({ 
    activeMenu, 
    papers, 
    selectedId, 
    onSelect,
    onAddPaper,
    onDeletePaper
}: { 
    activeMenu: string, 
    papers: Paper[], 
    selectedId: number | null, 
    onSelect: (p: Paper) => void,
    onAddPaper: (url: string) => void,
    onDeletePaper: (id: number, e: React.MouseEvent) => void
}) => {
    const [inputUrl, setInputUrl] = useState('');
    const [isStealing, setIsStealing] = useState(false);

    const filteredPapers = papers.filter(p => {
        if (activeMenu === 'all') return true;
        if (activeMenu === 'recent') return true;
        if (activeMenu.startsWith('folder_')) {
            const folderId = activeMenu.split('folder_')[1];
            return p.folderId === folderId;
        }
        return false;
    });

    const handleStealSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!inputUrl) return;
        setIsStealing(true);
        setTimeout(() => {
            onAddPaper(inputUrl);
            setInputUrl('');
            setIsStealing(false);
        }, 1000);
    };

    let headerTitle = "MEMENTOS";
    let subTitle = "// ALL_DATA";
    if (activeMenu === 'add') { headerTitle = "INFILTRATION"; subTitle = "// TARGET_ACQ"; }
    else if (activeMenu.startsWith('folder_')) { headerTitle = "MISSION"; subTitle = "// RESTRICTED"; }

    return (
        <div className="h-full bg-[#161616] flex-1 flex flex-col relative overflow-hidden">
            <div className="h-24 bg-phantom-black flex items-center px-8 relative z-10 border-b-4 border-white shrink-0">
                <div className="absolute inset-0 bg-halftone opacity-30" />
                <h2 className="text-4xl font-p5 text-white tracking-wide z-10 transform -skew-x-12 uppercase truncate max-w-md">
                    {headerTitle}
                </h2>
                <div className="ml-4 text-phantom-red font-mono text-sm mt-2 opacity-80">{subTitle}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 custom-scrollbar bg-halftone relative">
                {activeMenu !== 'add' ? (
                    filteredPapers.length > 0 ? (
                        filteredPapers.map((paper) => {
                            const isSelected = selectedId === paper.id;
                            return (
                                <motion.div
                                    key={paper.id}
                                    onClick={() => onSelect(paper)}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 10, scale: 1.01 }}
                                    className={`
                                        relative p-5 cursor-pointer group transition-all duration-200 transform -skew-x-6
                                        ${isSelected 
                                        ? 'bg-phantom-red text-white shadow-[8px_8px_0px_#000]' 
                                        : 'bg-[#222] text-zinc-400 hover:bg-[#333] hover:text-white border-l-4 border-zinc-600'}
                                    `}
                                >
                                    <div className="transform skew-x-6">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-p5 text-2xl leading-none mb-2 ${isSelected ? 'text-black' : ''}`}>
                                                {paper.title}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                {isSelected && <Star className="w-6 h-6 text-black fill-current animate-spin-slow" />}
                                                <button 
                                                    onClick={(e) => onDeletePaper(paper.id, e)}
                                                    className={`hover:text-white hover:bg-black rounded-full p-1 transition-colors ${isSelected ? 'text-black' : 'text-zinc-600'}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className={`flex items-center space-x-4 text-xs font-mono uppercase tracking-widest ${isSelected ? 'text-black font-bold' : 'opacity-60'}`}>
                                            <span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> {paper.type}</span>
                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {paper.year}</span>
                                            <span>:: {paper.author}</span>
                                        </div>
                                        {/* Tag Preview */}
                                        {paper.tags.length > 0 && (
                                            <div className="mt-3 flex space-x-2">
                                                {paper.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className={`text-[10px] px-1 font-bold transform -skew-x-12 ${isSelected ? 'bg-black text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center mt-20 opacity-30 font-p5 text-2xl">NO INTEL FOUND IN THIS SECTOR</div>
                    )
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-full p-10"
                    >
                        <div className="w-full max-w-xl bg-white p-8 border-4 border-phantom-black shadow-[16px_16px_0px_#E60012] transform -rotate-1">
                            <h3 className="text-4xl font-p5 text-black mb-6 flex items-center">
                                <Plus className="mr-2" strokeWidth={4} /> TARGET ACQUISITION
                            </h3>
                            <form onSubmit={handleStealSubmit} className="space-y-6">
                                <div>
                                    <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-1">Target URL / DOI</label>
                                    <input 
                                        type="text" 
                                        value={inputUrl}
                                        onChange={(e) => setInputUrl(e.target.value)}
                                        placeholder="https://arxiv.org/..."
                                        className="w-full bg-zinc-100 border-2 border-black p-4 font-mono text-lg focus:bg-black focus:text-phantom-red focus:outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!inputUrl || isStealing}
                                    className="w-full bg-phantom-red text-white font-p5 text-2xl py-4 hover:bg-black hover:text-phantom-red border-2 border-transparent hover:border-phantom-red transition-all flex justify-center items-center"
                                >
                                    {isStealing ? (
                                        <span className="animate-pulse">INFILTRATING...</span>
                                    ) : (
                                        <>SEND CALLING CARD <Send className="ml-2 w-5 h-5" /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

interface RightPaneProps { 
    paper: Paper | null; 
    onClose: () => void; 
    onAnalyze: () => void;
    onRead: () => void; // New Prop
}

const RightPane = ({ paper, onClose, onAnalyze, onRead }: RightPaneProps) => {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeClick = async () => {
    setAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    onAnalyze();
    setAnalyzing(false);
  };

  return (
    <AnimatePresence>
      {paper && (
        <motion.div
          initial={{ x: "100%", skewX: -20 }}
          animate={{ x: 0, skewX: 0 }}
          exit={{ x: "100%", skewX: 20 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="w-[600px] bg-white h-full shadow-[-20px_0_40px_rgba(0,0,0,0.5)] relative z-50 flex flex-col border-l-[12px] border-phantom-black"
        >
          <div className="h-64 bg-phantom-red relative overflow-hidden flex items-end p-8 shrink-0 clip-path-jagged">
            <button onClick={onClose} className="absolute top-4 right-4 text-black hover:text-white hover:rotate-90 transition-transform">
                 <X size={40} strokeWidth={4} />
            </button>
            <div className="absolute inset-0 bg-halftone opacity-20 mix-blend-overlay" />
            <motion.h1 
                key={paper.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl font-p5 text-black leading-[0.9] transform -rotate-1 origin-bottom-left"
            >
                {paper.title}
            </motion.h1>
          </div>

          <div className="flex-1 p-10 bg-zinc-100 overflow-y-auto">
             <div className="space-y-8">
                {/* Meta & Tags */}
                <div className="border-b-2 border-black pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex space-x-4 font-mono text-sm">
                            <div className="bg-black text-white px-3 py-1 transform -skew-x-12">AUTH: {paper.author}</div>
                            <div className="bg-black text-white px-3 py-1 transform -skew-x-12">TYPE: {paper.type}</div>
                        </div>
                        
                        {/* READ BUTTON */}
                        <motion.button 
                            onClick={onRead}
                            whileHover={{ scale: 1.1, rotate: 3 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center space-x-2 bg-phantom-red text-white px-4 py-2 font-p5 text-xl tracking-widest border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-black hover:text-phantom-red transition-all"
                        >
                            <Eye size={20} /> <span>READ</span>
                        </motion.button>
                    </div>

                    {paper.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {paper.tags.map((tag, i) => (
                                <span 
                                    key={i} 
                                    className={`
                                        font-p5 text-lg px-3 py-1 transform -skew-x-12 border-2 border-black
                                        ${i % 2 === 0 ? 'bg-phantom-yellow text-black rotate-2' : 'bg-phantom-black text-white -rotate-1'}
                                    `}
                                >
                                    #{tag.toUpperCase()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <p className="font-serif text-xl italic text-gray-800 leading-relaxed pl-6 border-l-4 border-phantom-red">
                    "{paper.abstract}"
                </p>

                {!paper.shadow_problem ? (
                    <motion.button
                      onClick={handleAnalyzeClick}
                      disabled={analyzing}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="w-full py-8 bg-black text-phantom-red font-p5 text-3xl tracking-widest flex items-center justify-center space-x-4 group border-4 border-transparent hover:border-phantom-red transition-all"
                    >
                      {analyzing ? (
                          <BrainCircuit className="w-10 h-10 animate-spin text-white" />
                      ) : (
                          <>
                            <BrainCircuit className="w-8 h-8 group-hover:animate-pulse" />
                            <span>ACTIVATE THIRD EYE</span>
                          </>
                      )}
                    </motion.button>
                ) : (
                    <div className="space-y-6 pt-4">
                        <h2 className="text-4xl font-p5 text-center bg-black text-white transform -skew-x-12 py-2">TRUTH REVEALED</h2>
                        <div className="grid gap-4">
                            <motion.div initial={{x:-50, opacity:0}} animate={{x:0, opacity:1}} className="bg-[#222] p-5 text-white shadow-[6px_6px_0px_#E60012] transform -rotate-1">
                                <h4 className="text-phantom-red font-bold uppercase tracking-widest text-xs">Shadow</h4>
                                <p className="font-p5 text-2xl">{paper.shadow_problem}</p>
                            </motion.div>
                            <motion.div initial={{x:50, opacity:0}} animate={{x:0, opacity:1}} transition={{delay:0.1}} className="bg-white border-4 border-black p-5 text-black shadow-[6px_6px_0px_#222] transform rotate-1">
                                <h4 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Persona</h4>
                                <p className="font-p5 text-2xl">{paper.persona_solution}</p>
                            </motion.div>
                            <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.2}} className="bg-phantom-yellow border-4 border-black p-4 text-black transform -skew-x-6">
                                <h4 className="text-black font-bold uppercase tracking-widest text-xs">Weakness</h4>
                                <p className="font-mono font-bold text-lg text-red-600">{paper.weakness_flaw}</p>
                            </motion.div>
                        </div>
                    </div>
                )}
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

function App() {
  // PERSISTENCE LOGIC (Lazy Init)
  const [papers, setPapers] = useState<Paper[]>(() => {
      const saved = localStorage.getItem('phantom_papers');
      return saved ? JSON.parse(saved) : INITIAL_PAPERS;
  });
  
  const [folders, setFolders] = useState<FolderType[]>(() => {
      const saved = localStorage.getItem('phantom_folders');
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
  });

  // PERSISTENCE EFFECT
  useEffect(() => {
      localStorage.setItem('phantom_papers', JSON.stringify(papers));
  }, [papers]);

  useEffect(() => {
      localStorage.setItem('phantom_folders', JSON.stringify(folders));
  }, [folders]);

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [activeMenu, setActiveMenu] = useState('all');
  
  // READER STATE
  const [isReading, setIsReading] = useState(false);
  const [readingPaper, setReadingPaper] = useState<Paper | null>(null);

  const handleAddPaper = (url: string) => {
    let targetFolder = undefined;
    if (activeMenu.startsWith('folder_')) {
        targetFolder = activeMenu.split('folder_')[1];
    }
    const newPaper: Paper = {
        id: Date.now(),
        title: "Target: " + url.substring(0, 15) + "...",
        author: "Unknown Entity",
        year: "2025",
        type: "WEB",
        folderId: targetFolder,
        tags: ["Infiltrated"],
        abstract: "Data successfully extracted from the target URL. Ready for cognitive analysis.",
        content: "EXTRACTED CONTENT STREAM...\n\n(Data link active but blocked by Cognitive Wall...)"
    };
    setPapers(prev => [newPaper, ...prev]);
    setActiveMenu(targetFolder ? `folder_${targetFolder}` : 'all');
    setSelectedPaper(newPaper);
  };

  const handleBulkImport = (files: FileList) => {
    let targetFolder = undefined;
    if (activeMenu.startsWith('folder_')) {
        targetFolder = activeMenu.split('folder_')[1];
    }
    
    const newPapers: Paper[] = Array.from(files).map((file, i) => ({
        id: Date.now() + i,
        title: file.name.replace('.pdf', ''),
        author: "Local Upload",
        year: "2024",
        type: "PDF",
        folderId: targetFolder,
        tags: ["Uploaded"],
        abstract: "This document was infiltrated from the local cognitive drive.",
        fileUrl: URL.createObjectURL(file) // CREATE BLOB URL
    }));

    setPapers(prev => [...newPapers, ...prev]);
    if (newPapers.length > 0) {
        setSelectedPaper(newPapers[0]);
    }
  };

  const handleDeletePaper = (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("DELETE THIS INTEL?")) {
          setPapers(prev => prev.filter(p => p.id !== id));
          if (selectedPaper?.id === id) {
              setSelectedPaper(null);
          }
      }
  };

  const handleThirdEye = () => {
    if (!selectedPaper) return;
    
    // INTELLIGENT TAGGING LOGIC
    const content = (selectedPaper.title + " " + selectedPaper.abstract).toLowerCase();
    const aiTags = [];
    if (content.match(/vision|image|object|detection|segmentation/)) aiTags.push("CV");
    if (content.match(/language|text|transformer|llm|token|gpt/)) aiTags.push("NLP");
    if (content.match(/agent|reward|policy|reinforcement|game/)) aiTags.push("RL");
    if (content.match(/generative|diffusion|latent|synthesis/)) aiTags.push("GenAI");
    if (content.match(/network|security|stealth|protocol|attack/)) aiTags.push("NetSec");
    if (content.match(/cognitive|psychology|mind|conscious/)) aiTags.push("CogSci");
    if (aiTags.length === 0) aiTags.push("General AI");
    aiTags.push("DeepSeek-V3");

    const mergedTags = Array.from(new Set([...selectedPaper.tags, ...aiTags]));
    const updated = {
        ...selectedPaper,
        shadow_problem: "Obfuscated Truth",
        persona_solution: "Clarified Cognition",
        weakness_flaw: "Requires MP",
        tags: mergedTags
    };
    setPapers(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPaper(updated);
  };

  const handleAddFolder = () => {
      const name = window.prompt("ENTER MISSION NAME (SAFE ROOM ID):");
      if (name) {
          setFolders(prev => [...prev, { id: Date.now().toString(), name }]);
      }
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("BURN EVIDENCE (DELETE MISSION)? THIS CANNOT BE UNDONE.")) {
          setFolders(prev => prev.filter(f => f.id !== id));
          if (activeMenu === `folder_${id}`) {
              setActiveMenu('all');
          }
      }
  };

  // READER TRIGGERS
  const handleRead = () => {
      if (selectedPaper) {
          setReadingPaper(selectedPaper);
          setIsReading(true);
      }
  };

  return (
    <div className="flex h-screen w-screen bg-phantom-black overflow-hidden font-sans text-white relative">
      <LeftPane 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        folders={folders}
        onAddFolder={handleAddFolder}
        onDeleteFolder={handleDeleteFolder}
        onBulkImport={handleBulkImport}
      />
      
      <div className="flex-1 flex relative">
        <MiddlePane 
          activeMenu={activeMenu}
          papers={papers} 
          selectedId={selectedPaper?.id || null} 
          onSelect={setSelectedPaper}
          onAddPaper={handleAddPaper}
          onDeletePaper={handleDeletePaper}
        />
      </div>
      
      <div className="relative">
         <RightPane 
            paper={selectedPaper} 
            onClose={() => setSelectedPaper(null)} 
            onAnalyze={handleThirdEye}
            onRead={handleRead}
         />
      </div>

      {/* READER OVERLAY (Global) */}
      <AnimatePresence>
        {isReading && readingPaper && (
            <ReaderOverlay 
                paper={readingPaper} 
                onClose={() => setIsReading(false)} 
            />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
