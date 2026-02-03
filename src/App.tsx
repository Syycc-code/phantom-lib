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
  BrainCircuit,
  ShoppingBag
} from 'lucide-react';

import PhantomIM from './components/PhantomIM';
import P5LoadingScreen from './components/P5LoadingScreen';
import { 
  SubwayOverlay, 
  ReaderOverlay, 
  MindPalace,
  VelvetOverlay, 
  FusionWorkspace,
  RankUpNotification,
  StatsOverlay,
  TransitionCurtain,
  CallingCard,
  ManualOverlay,
  ConfidantOverlay
} from './components';
import { HackProgress } from './components/shared/HackProgress';
import { InputOverlay } from './components/overlays/InputOverlay';
import { ConfirmOverlay } from './components/overlays/ConfirmOverlay';
import { ShopOverlay, type ShopItem } from './components/overlays/ShopOverlay';
import SystemMonitor from './components/SystemMonitor';
import { UploadProgress } from './components/shared/UploadProgress';
import LeftPane from './components/panes/LeftPane';
import MiddlePane from './components/panes/MiddlePane';
import RightPane from './components/panes/RightPane';
import type { Paper, Folder, PhantomStats } from './types';
import { INITIAL_FOLDERS, INITIAL_PAPERS } from './constants';

// Backward compatibility alias
type FolderType = Folder;

// --- PDF WORKER SETUP (LOCAL) ---
// Use Vite's explicit URL import to bundle the worker locally
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

try {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
} catch (e) {
    console.error("PDF Worker Init Failed", e);
}

// --- AUDIO ENGINE (SYNTHESIZER) ---
// Extracted to hook for better performance isolation
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

    // Memoize the play function
    return useCallback((type: 'click' | 'hover' | 'confirm' | 'cancel' | 'impact' | 'rankup') => {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        // Sound definitions kept inline for now to avoid external dependency complexity in this refactor step
        switch (type) {
            case 'click':
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'hover':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.02, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
                break;
            case 'confirm':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'cancel':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'impact':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
            case 'rankup':
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
                playNote(523.25, now);
                playNote(659.25, now + 0.1);
                playNote(783.99, now + 0.2);
                playNote(1046.50, now + 0.3);
                break;
        }
    }, [initAudio]);
};

const INITIAL_STATS: PhantomStats = {
    knowledge: 1,
    guts: 1,
    proficiency: 1,
    kindness: 1,
    charm: 1
};

// --- Components ---

// --- Main App ---
function App() {
  // INIT AUDIO (MUST BE FIRST)
  const playSfx = useAudioSystem();

  // --- BACKEND HEALTH CHECK ---
  const [isBackendReady, setIsBackendReady] = useState(false);
  
  useEffect(() => {
      let intervalId: NodeJS.Timeout;
      
      const checkHealth = async () => {
          try {
              const res = await fetch('/api/monitor');
              if (res.ok) {
                  setIsBackendReady(true);
                  if (intervalId) clearInterval(intervalId);
              }
          } catch (e) {
              // Still waiting...
          }
      };

      // Check immediately, then poll
      checkHealth();
      intervalId = setInterval(checkHealth, 1000);

      return () => {
          if (intervalId) clearInterval(intervalId);
      };
  }, []);

  const [papers, setPapers] = useState<Paper[]>([]); // Initialize empty, load from backend
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [stats, setStats] = useState<PhantomStats>(() => { const saved = localStorage.getItem('phantom_stats'); return saved ? JSON.parse(saved) : INITIAL_STATS; });
  
  // Shop State
  const [inventory, setInventory] = useState<string[]>(() => { const saved = localStorage.getItem('phantom_inventory'); return saved ? JSON.parse(saved) : ['theme_default']; });
  const [equipped, setEquipped] = useState<{theme: string, effect_monitor: string, effect_im: string, effect_marker: string, font_style: string}>(() => { 
      const saved = localStorage.getItem('phantom_equipped'); 
      const parsed = saved ? JSON.parse(saved) : {};
      return { 
          theme: parsed.theme || 'theme_default',
          effect_monitor: parsed.effect_monitor || 'default',
          effect_im: parsed.effect_im || 'default',
          effect_marker: parsed.effect_marker || 'default',
          font_style: parsed.font_style || 'default'
      }; 
  });
  const [showShop, setShowShop] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Load Papers and Folders from Vault (Backend)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Papers
        const resPapers = await fetch('/api/papers');
        if (resPapers.ok) {
          const data = await resPapers.json();
          const mappedPapers = data.map((p: any) => ({
            ...p,
            type: p.url && p.url.toLowerCase().includes('arxiv') ? 'Arxiv' : 'PDF',
            // Parse comma-separated tags from backend, or fallback to status
            tags: p.tags ? p.tags.split(',') : (p.shadow_problem ? ['Analyzed'] : ['New']),
            fileUrl: `/api/papers/${p.id}/pdf`,
            content: p.abstract || '',
            ocrStatus: 'complete'
          }));
          setPapers(mappedPapers);
        }
        
        // Fetch Folders
        const resFolders = await fetch('/api/folders/');
        if (resFolders.ok) {
            const data = await resFolders.json();
            setFolders(data.map((f: any) => ({ ...f, id: f.id.toString() }))); // Ensure ID is string for frontend
        }
      } catch (e) {
        console.error("Failed to fetch data:", e);
      }
    };
    
    fetchData();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
              e.preventDefault();
              setShowMindPalace(prev => !prev);
              playSfx('confirm');
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSfx]); // Added dependency

  useEffect(() => { localStorage.setItem('phantom_stats', JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem('phantom_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('phantom_equipped', JSON.stringify(equipped)); }, [equipped]);

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [activeMenu, setActiveMenu] = useState('all');
  const [isReading, setIsReading] = useState(false);
  const [readingPaper, setReadingPaper] = useState<Paper | null>(null);
  const [showMindPalace, setShowMindPalace] = useState(false);
  
  // Confidant Overlay State (Full Screen Chat)
  const [confidantData, setConfidantData] = useState<{ show: boolean, messages: any[], scope?: any }>({ show: false, messages: [] });

  const [fusionTargetIds, setFusionTargetIds] = useState<number[]>([]);
  const [isFusing, setIsFusing] = useState(false);
  const [fusionResult, setFusionResult] = useState<string | null>(null);
  const [showCurtain, setShowCurtain] = useState(false);
  const [showRankUp, setShowRankUp] = useState<string | null>(null);
  const [showCallingCard, setShowCallingCard] = useState<'success' | 'fail' | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ active: false, current: 0, total: 0 });
  const [hackProgress, setHackProgress] = useState<{ show: boolean, stage: "download" | "ocr" | "analyze" | "complete", message?: string }>({ show: false, stage: "download" });
  
  // Input Overlay State
  const [inputOverlay, setInputOverlay] = useState<{ show: boolean, title: string, placeholder?: string, onSubmit: (val: string) => void }>({ show: false, title: '', onSubmit: () => {} });
  // Confirm Overlay State
  const [confirmOverlay, setConfirmOverlay] = useState<{ show: boolean, title?: string, message: string, onConfirm: () => void }>({ show: false, message: '', onConfirm: () => {} });

  const requestConfirm = useCallback((message: string, action: () => void, title: string = "CONFIRMATION") => {
      playSfx('click');
      setConfirmOverlay({ show: true, message, onConfirm: action, title });
  }, [playSfx]);

  // Safe Mode (Reading Mode) Logic
  const [uiMode, setUiMode] = useState<'heist' | 'safe'>('heist');
  useEffect(() => {
      setUiMode(isReading ? 'safe' : 'heist');
  }, [isReading]);

  // --- HANDLERS (MEMOIZED) ---
  const handlePaperSelect = useCallback((p: Paper) => { // Renamed from handleSelectPaper to match prop usage
      setSelectedPaper(p);
      playSfx('click');
  }, [playSfx]);

  const handleLevelUp = useCallback((statName: keyof PhantomStats) => {
      setStats(prev => ({ ...prev, [statName]: Math.min(10, prev[statName] + 1) }));
      setShowRankUp(statName);
      playSfx('rankup');
      setTimeout(() => setShowRankUp(null), 3000);
  }, [playSfx]);

  const handleRead = useCallback((paper?: Paper) => { 
      const target = paper || selectedPaper; 
      if (target) { 
          setReadingPaper(target); 
          setIsReading(true); 
          playSfx('click'); 
      } 
  }, [selectedPaper, playSfx]);

  const handleAddFolder = useCallback(() => { 
      playSfx('click');
      setInputOverlay({
          show: true,
          title: "ESTABLISH NEW MISSION",
          placeholder: "CODENAME...",
          onSubmit: async (name: string) => {
              try {
              const res = await fetch('/api/folders/', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name })
              });
                  if (res.ok) {
                      const newFolder = await res.json();
                      setFolders(prev => [...prev, { ...newFolder, id: newFolder.id.toString() }]); 
                      handleLevelUp('kindness'); 
                  }
              } catch (e) {
                  console.error("Add folder failed", e);
              }
              setInputOverlay(prev => ({ ...prev, show: false }));
          }
      });
  }, [handleLevelUp, playSfx]);

  const handleDeleteFolder = useCallback((id: string, e: React.MouseEvent) => { 
      e.stopPropagation(); 
      requestConfirm("BURN EVIDENCE?", async () => { 
          try {
              await fetch(`/api/folders/${id}`, { method: 'DELETE' });
              setFolders(prev => prev.filter(f => f.id !== id)); 
              
              // Move papers in frontend state back to root (folder_id = null)
              setPapers(prev => prev.map(p => p.folder_id === parseInt(id) ? { ...p, folder_id: null } : p));

              if (activeMenu === `folder_${id}`) setActiveMenu('all'); 
              playSfx('impact'); 
          } catch (e) {
              console.error("Delete folder failed", e);
          }
      }, "DELETE MISSION");
  }, [activeMenu, playSfx, requestConfirm]);

  const handleMovePaper = useCallback(async (paperId: number, folderId: string | null) => {
      try {
          const res = await fetch(`/api/papers/${paperId}/move?folder_id=${folderId || ''}`, {
              method: 'PATCH'
          });
          if (res.ok) {
              setPapers(prev => prev.map(p => p.id === paperId ? { ...p, folder_id: folderId ? parseInt(folderId) : null } : p));
              playSfx('click');
          }
      } catch (e) {
          console.error("Move failed", e);
      }
  }, [playSfx]);

  const toggleFusionSelection = useCallback((id: number) => { 
      setFusionTargetIds(prev => {
          if (prev.includes(id)) return prev.filter(i => i !== id);
          if (prev.length < 2) return [...prev, id];
          return prev;
      }); 
      playSfx('click'); 
  }, [playSfx]);

  // ... (Other handlers remain same but we must update their usage)

  // NEW: Upload to Vault (Optimized)
  const handleBulkImport = useCallback(async (files: FileList) => { 
      playSfx('confirm');
      console.log(`[BULK IMPORT] Starting: ${files.length} files`);
      setUploadStatus({ active: true, current: 0, total: files.length });
      
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log(`[BULK IMPORT] Processing ${i+1}/${files.length}: ${file.name}`);
          
          if (file.type !== 'application/pdf') {
              console.warn(`[BULK IMPORT] Skipping non-PDF: ${file.name}`);
              continue;
          }

          try {
              const formData = new FormData();
              formData.append('file', file);
              console.log(`[BULK IMPORT] Uploading ${file.name}...`);
              const res = await fetch('/api/upload', { method: 'POST', body: formData });
              if (res.ok) {
                  const p = await res.json();
                  console.log(`[BULK IMPORT] ✓ ${file.name} uploaded (ID: ${p.id})`);
                  const mappedPaper = {
                      ...p,
                      type: "PDF",
                      tags: ["New"],
                      content: p.abstract,
                      fileUrl: `/api/papers/${p.id}/pdf`
                  };
                  setPapers(prev => [mappedPaper, ...prev]);
                  // handleLevelUp cannot be called here if it's not a dependency, 
                  // but we can just update stats directly or add dependency
                  setStats(prev => ({ ...prev, proficiency: Math.min(10, prev.proficiency + 1) }));
              } else {
                  const error = await res.text();
                  console.error(`[BULK IMPORT] ✗ ${file.name} failed: ${error}`);
              }
          } catch (e) {
              console.error(`[BULK IMPORT] ✗ ${file.name} exception:`, e);
          }
          setUploadStatus(prev => ({ ...prev, current: i + 1 }));
      }
      console.log(`[BULK IMPORT] Complete`);
      setTimeout(() => {
          setUploadStatus({ active: false, current: 0, total: 0 });
          setActiveMenu('all'); 
      }, 2000);
  }, [playSfx]); // Removed handleLevelUp to avoid circular dependency chain

  // ... (Update MiddlePane usage)

  const handleAddPaper = async (url: string) => { 
      playSfx('confirm');
      try {
          // Show download stage
          setHackProgress({ show: true, stage: 'download', message: 'Connecting to target...' });
          
          // 增加超时时间到3分钟
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 180000); // 3分钟
          
          const res = await fetch('/api/upload/url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url }),
              signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (res.ok) {
              // Show OCR stage
              setHackProgress({ show: true, stage: 'ocr', message: 'Scanning document...' });
              
              const p = await res.json();
              
              // Show analyze stage
              setHackProgress({ show: true, stage: 'analyze', message: 'Extracting treasure...' });
              
              const mappedPaper = {
                  ...p,
                  type: "WEB",
                  tags: ["Infiltrated"],
                  content: p.abstract,
                  fileUrl: `/api/papers/${p.id}/pdf`
              };
              setPapers(prev => [mappedPaper, ...prev]);
              handleLevelUp('proficiency');
              
              // Show complete stage
              setHackProgress({ show: true, stage: 'complete', message: 'Treasure secured!' });
              
              // Hide progress after 2 seconds
              setTimeout(() => {
                  setHackProgress({ show: false, stage: 'download' });
              }, 2000);
              
              // Show Calling Card
              setShowCallingCard('success');
              
              // Trigger Download
              const link = document.createElement('a');
              link.href = mappedPaper.fileUrl;
              link.download = p.title + ".pdf";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          } else {
              throw new Error("Hack Failed");
          }
      } catch (e) {
          console.error("URL Upload Failed:", e);
          playSfx('cancel');
          
          // Hide progress on error
          setHackProgress({ show: false, stage: 'download' });
          
          // 区分超时和其他错误
          if (e instanceof Error && e.name === 'AbortError') {
              alert("HACK TIMEOUT: Target too large or network too slow. Try again or use smaller file.");
          } else {
              alert("TARGET LINK SEVERED. (Check URL or Network)");
          }
      }
  };

  const handleSaveNote = async (content: string) => {
      if (!readingPaper) return;
      try {
          const res = await fetch(`/api/papers/${readingPaper.id}/notes`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content })
          });
          if (res.ok) {
              setPapers(prev => prev.map(p => p.id === readingPaper.id ? { ...p, user_notes: content } : p));
          }
      } catch (e) {
          console.error("Failed to save note", e);
      }
  };

  const handleEditPaper = async (id: number, data: { title?: string, author?: string }) => {
      try {
          const res = await fetch(`/api/papers/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
          });
          if (res.ok) {
              const updatedPaper = await res.json();
              setPapers(prev => prev.map(p => p.id === id ? updatedPaper : p));
              playSfx('confirm');
          } else {
              playSfx('cancel');
          }
      } catch (e) {
          console.error("Failed to update paper", e);
          playSfx('cancel');
      }
  };

  const performDeletePaper = async (id: number) => {
      try {
          await fetch(`/api/papers/${id}`, { method: 'DELETE' });
          setPapers(prev => prev.filter(p => p.id !== id)); 
          if (selectedPaper?.id === id) setSelectedPaper(null); 
      } catch (err) {
          console.error("Delete failed:", err);
      }
  };

  const handleDeletePaper = useCallback((id: number, e: React.MouseEvent) => { 
      e.stopPropagation(); 
      requestConfirm("BURN THIS INTEL?", async () => {
          await performDeletePaper(id);
          playSfx('impact'); 
      }, "DESTROY INTEL");
  }, [selectedPaper, playSfx, requestConfirm]);

  const handleBulkDelete = (ids: number[]) => { 
      // Confirmed by MiddlePane
      ids.forEach(id => performDeletePaper(id));
      playSfx('impact'); 
  };

  const handleThirdEye = async () => { 
      if (!selectedPaper) return; 
      playSfx('confirm'); 
      try {
          const res = await fetch('/api/mind_hack', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  text: selectedPaper.abstract, // Use abstract for analysis
                  mode: 'analyze_paper' 
              })
          });
          const data = await res.json();
          
          if (data.raw) {
              const analysis = data.raw;
              const newTags = analysis.tags || selectedPaper.tags;
              const updated = { 
                  ...selectedPaper, 
                  shadow_problem: analysis.shadow_problem, 
                  persona_solution: analysis.persona_solution, 
                  weakness_flaw: analysis.weakness_flaw, 
                  tags: newTags
              }; 
              
              // Persist Analysis & Tags to Backend
              fetch(`/api/papers/${selectedPaper.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      shadow_problem: analysis.shadow_problem,
                      persona_solution: analysis.persona_solution,
                      weakness_flaw: analysis.weakness_flaw,
                      tags: Array.isArray(newTags) ? newTags.join(',') : newTags
                  })
              }).catch(err => console.error("Failed to save analysis", err));

              // Update state
              setPapers(prev => prev.map(p => p.id === updated.id ? updated : p)); 
              setSelectedPaper(updated); 
              handleLevelUp('proficiency');
          } else {
              // Fallback if raw JSON missing
              console.warn("Analysis returned non-JSON format", data);
          }
      } catch (e) {
          console.error("Third Eye Failed:", e);
      }
  };
  
  // SYNC: Configure Obsidian Path
  const handleSyncConfig = useCallback(() => {
      playSfx('click');
      setInputOverlay({
          show: true,
          title: "SECURE CHANNEL",
          placeholder: "OBSIDIAN PATH...",
          onSubmit: async (path: string) => {
              try {
                  const res = await fetch('/api/sync/config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ path })
                  });
                  if (!res.ok) throw new Error("Invalid Path");
                  playSfx('confirm');
                  alert("SYNC PATH ESTABLISHED.");
              } catch (e) {
                  playSfx('cancel');
                  alert("LINK FAILED: Check path.");
              }
              setInputOverlay(prev => ({ ...prev, show: false }));
          }
      });
  }, [playSfx]);

  // SYNC: Export Paper
  const handleSyncPaper = async (paperId: number) => {
      requestConfirm("SYNC INTEL TO OBSIDIAN?", async () => {
          try {
              const res = await fetch(`/api/sync/export/${paperId}`, { method: 'POST' });
              if (!res.ok) throw new Error("Sync Failed");
              playSfx('rankup'); // Success sound
              alert("INTEL TRANSFERRED.");
          } catch (e) {
              playSfx('cancel');
              alert("SYNC ERROR: Is path configured?");
          }
      }, "SECURE TRANSFER");
  };

  // --- SHOP LOGIC ---
  const handlePurchase = (item: ShopItem) => {
      const cost = item.cost;
      const currency = item.currency;
      
      // Safety Check
      if (stats[currency] < cost) return;
      
      // Deduct Stats
      setStats(prev => ({ ...prev, [currency]: prev[currency] - cost }));
      
      // Add to Inventory
      setInventory(prev => [...prev, item.id]);
  };

  const handleEquip = (item: ShopItem) => {
      setEquipped(prev => {
          const next = { ...prev };
          if (item.type === 'THEME') next.theme = item.id;
          // Determine slot based on item ID prefix or type
          if (item.id.startsWith('visualizer_') || item.id.startsWith('radar_')) next.effect_monitor = item.value || 'default';
          if (item.id.startsWith('skin_')) next.effect_im = item.value || 'default';
          if (item.id.startsWith('marker_')) next.effect_marker = item.value || 'default';
          if (item.type === 'FONT') next.font_style = item.value || 'default';
          return next;
      });
  };

  const handleUnequip = (item: ShopItem) => {
      setEquipped(prev => {
          const next = { ...prev };
          // Themes cannot be unequipped, only switched
          if (item.type === 'THEME') return prev;
          
          if (item.id.startsWith('visualizer_') || item.id.startsWith('radar_')) next.effect_monitor = 'default';
          if (item.id.startsWith('skin_')) next.effect_im = 'default';
          if (item.id.startsWith('marker_')) next.effect_marker = 'default';
          if (item.type === 'FONT') next.font_style = 'default';
          return next;
      });
  };

  const currentThemeColor = equipped.theme === 'theme_royal' ? '#D4AF37' : 
                            equipped.theme === 'theme_velvet' ? '#1a45a0' : 
                            equipped.theme === 'theme_tv' ? '#FFE600' :
                            equipped.theme === 'theme_hacker' ? '#00FF41' :
                            '#E60012';

  // --- LOADING SCREEN ---
  if (!isBackendReady) {
      return <P5LoadingScreen />;
  }

  return (
    <div 
        className={`flex h-screen w-screen bg-phantom-black overflow-hidden font-sans relative bg-halftone bg-noise transition-colors duration-1000 ${uiMode === 'safe' ? 'mode-safe' : ''} text-[var(--color-text)]`}
    >
      <style>{`
        :root {
          --phantom-red: ${currentThemeColor} !important;
        }
      `}</style>
      <SystemMonitor variant={equipped.effect_monitor} /> {/* Add Monitor */}
      <UploadProgress active={uploadStatus.active} current={uploadStatus.current} total={uploadStatus.total} />
      <HackProgress show={hackProgress.show} stage={hackProgress.stage} message={hackProgress.message} />
      <TransitionCurtain isActive={showCurtain} />
      <CallingCard show={showCallingCard === 'success'} onComplete={() => { setShowCallingCard(null); setActiveMenu('all'); }} />
      <RankUpNotification stat={showRankUp} />
      
      {showStats && <StatsOverlay stats={stats} onClose={() => setShowStats(false)} playSfx={playSfx} />}
      
      {showShop && (
          <ShopOverlay 
              stats={stats} 
              inventory={inventory} 
              equipped={equipped}
              onClose={() => setShowShop(false)} 
              onPurchase={handlePurchase}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              playSfx={playSfx} 
          />
      )}

      <AnimatePresence>
        {showManual && <ManualOverlay onClose={() => setShowManual(false)} playSfx={playSfx} />}
      </AnimatePresence>

      <LeftPane 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu} 
          folders={folders} 
          onAddFolder={handleAddFolder} 
          onDeleteFolder={handleDeleteFolder} 
          onBulkImport={handleBulkImport} 
          onShowStats={() => { setShowStats(true); playSfx('confirm'); }} 
          onShowShop={() => { setShowShop(true); playSfx('confirm'); }}
          onShowMindPalace={() => { setShowMindPalace(true); playSfx('impact'); }}
          onShowManual={() => { setShowManual(true); playSfx('confirm'); }}
          onSyncConfig={handleSyncConfig}
          onMovePaper={handleMovePaper} // PASS PROP
          playSfx={playSfx} 
      />
      <div className="flex-1 flex relative">
          <MiddlePane 
              activeMenu={activeMenu}
              papers={papers}
              selectedId={readingPaper?.id || null}
              onSelect={handlePaperSelect}
              onAddPaper={handleAddPaper}
              onDeletePaper={handleDeletePaper}
              onEditPaper={handleEditPaper} // NEW PROP
              onBulkImport={handleBulkImport}
              onBulkDelete={handleBulkDelete}
              onMovePaper={handleMovePaper}
              toggleFusionSelection={toggleFusionSelection}
              fusionTargetIds={fusionTargetIds}
              isFusing={isFusing}
              setIsFusing={setIsFusing}
              setFusionResult={setFusionResult}
              fusionResult={fusionResult}
              showCurtain={showCurtain}
              setShowCurtain={setShowCurtain}
              onLevelUp={handleLevelUp}
              playSfx={playSfx}
              requestConfirm={requestConfirm}
          />
      </div>
      <div className="relative">
         <RightPane 
            paper={selectedPaper} 
            onClose={() => setSelectedPaper(null)} 
            onAnalyze={handleThirdEye} 
            onRead={() => handleRead()} 
            playSfx={playSfx}
            onSaveNote={handleSaveNote}
            onEditPaper={handleEditPaper} // Pass handleEditPaper
         />
      </div>
        {inputOverlay.show && (
            <AnimatePresence>
                <InputOverlay 
                    title={inputOverlay.title}
                    placeholder={inputOverlay.placeholder}
                    onSubmit={inputOverlay.onSubmit}
                    onClose={() => setInputOverlay(prev => ({ ...prev, show: false }))}
                    playSfx={playSfx}
                />
            </AnimatePresence>
        )}
        {confirmOverlay.show && (
            <AnimatePresence>
                <ConfirmOverlay
                    title={confirmOverlay.title}
                    message={confirmOverlay.message}
                    onConfirm={() => {
                        confirmOverlay.onConfirm();
                        setConfirmOverlay(prev => ({ ...prev, show: false }));
                    }}
                    onCancel={() => setConfirmOverlay(prev => ({ ...prev, show: false }))}
                    playSfx={playSfx}
                />
            </AnimatePresence>
        )}
      <AnimatePresence>
        {isReading && readingPaper && <ReaderOverlay paper={readingPaper} onClose={() => setIsReading(false)} onLevelUp={handleLevelUp} playSfx={playSfx} onSaveNote={handleSaveNote} markerStyle={equipped.effect_marker} fontStyle={equipped.font_style} />}
        {showMindPalace && <MindPalace papers={papers} onClose={() => setShowMindPalace(false)} onRead={handleRead} playSfx={playSfx} />}
        {confidantData.show && (
            <ConfidantOverlay 
                initialMessages={confidantData.messages} 
                scope={confidantData.scope}
                onClose={(updatedMsgs) => setConfidantData({ show: false, messages: updatedMsgs })} // Ideally pass back to IM, but for now just close
                playSfx={playSfx} 
            />
        )}
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
      {/* Show IM only if inside a folder or reading (global context if reading) */}
      {(activeMenu.startsWith('folder_') || isReading) && (
          <PhantomIM 
            variant={equipped.effect_im} 
            scope={
                activeMenu.startsWith('folder_') 
                ? { folder_id: parseInt(activeMenu.split('_')[1]), name: folders.find(f => f.id === activeMenu.split('_')[1])?.name } 
                : undefined
            }
            onExpand={(msgs) => setConfidantData({ 
                show: true, 
                messages: msgs,
                scope: activeMenu.startsWith('folder_') 
                ? { folder_id: parseInt(activeMenu.split('_')[1]), name: folders.find(f => f.id === activeMenu.split('_')[1])?.name } 
                : undefined
            })} 
          />
      )}
    </div>
  );
}

export default App;