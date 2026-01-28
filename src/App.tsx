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
import { 
  SubwayOverlay, 
  ReaderOverlay, 
  VelvetOverlay, 
  FusionWorkspace,
  RankUpNotification,
  StatsOverlay,
  TransitionCurtain,
  CallingCard
} from './components';
import { HackProgress } from './components/shared/HackProgress';
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

// --- PDF WORKER SETUP ---
// try {
//     pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
// } catch (e) {
//     console.error("PDF Worker Init Failed", e);
// }

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

// --- Main App ---
function App() {
  const [papers, setPapers] = useState<Paper[]>([]); // Initialize empty, load from backend
  const [folders, setFolders] = useState<FolderType[]>(() => { const saved = localStorage.getItem('phantom_folders'); return saved ? JSON.parse(saved) : INITIAL_FOLDERS; });
  const [stats, setStats] = useState<PhantomStats>(() => { const saved = localStorage.getItem('phantom_stats'); return saved ? JSON.parse(saved) : INITIAL_STATS; });
  
  // Shop State
  const [inventory, setInventory] = useState<string[]>(() => { const saved = localStorage.getItem('phantom_inventory'); return saved ? JSON.parse(saved) : ['theme_default']; });
  const [equipped, setEquipped] = useState<{theme: string, effect_monitor: string, effect_im: string, effect_marker: string}>(() => { 
      const saved = localStorage.getItem('phantom_equipped'); 
      const parsed = saved ? JSON.parse(saved) : {};
      return { 
          theme: parsed.theme || 'theme_default',
          effect_monitor: parsed.effect_monitor || 'default',
          effect_im: parsed.effect_im || 'default',
          effect_marker: parsed.effect_marker || 'default'
      }; 
  });
  const [showShop, setShowShop] = useState(false);

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
  useEffect(() => { localStorage.setItem('phantom_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('phantom_equipped', JSON.stringify(equipped)); }, [equipped]);

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
  const [showCallingCard, setShowCallingCard] = useState<'success' | 'fail' | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ active: false, current: 0, total: 0 });
  const [hackProgress, setHackProgress] = useState<{ show: boolean, stage: "download" | "ocr" | "analyze" | "complete", message?: string }>({ show: false, stage: "download" });
  
  // Safe Mode (Reading Mode) Logic
  const [uiMode, setUiMode] = useState<'heist' | 'safe'>('heist');
  useEffect(() => {
      setUiMode(isReading ? 'safe' : 'heist');
  }, [isReading]);

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
      setUploadStatus({ active: true, current: 0, total: files.length });
      
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
          setUploadStatus(prev => ({ ...prev, current: i + 1 }));
      }
      setTimeout(() => {
          setUploadStatus({ active: false, current: 0, total: 0 });
          setActiveMenu('all'); // Correctly switch view after delay
      }, 2000);
  };

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
      if (!selectedPaper) return;
      try {
          const res = await fetch(`/api/papers/${selectedPaper.id}/notes`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content })
          });
          
          if (res.ok) {
              // Optimistic Update
              setPapers(prev => prev.map(p => 
                  p.id === selectedPaper.id ? { ...p, user_notes: content } : p
              ));
              // Update selectedPaper too to sync state
              setSelectedPaper(prev => prev ? { ...prev, user_notes: content } : null);
          } else {
              throw new Error("Save failed");
          }
      } catch (e) {
          console.error("Note Save Error", e);
          throw e; // Let NoteEditor handle UI error state
      }
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
              const updated = { 
                  ...selectedPaper, 
                  shadow_problem: analysis.shadow_problem, 
                  persona_solution: analysis.persona_solution, 
                  weakness_flaw: analysis.weakness_flaw, 
                  tags: analysis.tags || selectedPaper.tags 
              }; 
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
  const handleSyncConfig = async () => {
      const path = window.prompt("ENTER OBSIDIAN VAULT PATH (e.g. C:/Users/Name/Documents/Obsidian/Phantom):");
      if (!path) return;
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
  };

  // SYNC: Export Paper
  const handleSyncPaper = async (paperId: number) => {
      if (!window.confirm("SYNC INTEL TO OBSIDIAN?")) return;
      try {
          const res = await fetch(`/api/sync/export/${paperId}`, { method: 'POST' });
          if (!res.ok) throw new Error("Sync Failed");
          playSfx('rankup'); // Success sound
          alert("INTEL TRANSFERRED.");
      } catch (e) {
          playSfx('cancel');
          alert("SYNC ERROR: Is path configured?");
      }
  };

  const handleAddFolder = () => { const name = window.prompt("ENTER MISSION NAME:"); if (name) { setFolders(prev => [...prev, { id: Date.now().toString(), name }]); handleLevelUp('kindness'); playSfx('confirm'); } };
  const handleDeleteFolder = (id: string, e: React.MouseEvent) => { e.stopPropagation(); if (window.confirm("BURN EVIDENCE?")) { setFolders(prev => prev.filter(f => f.id !== id)); if (activeMenu === `folder_${id}`) setActiveMenu('all'); playSfx('impact'); } };
  const handleRead = (paper?: Paper) => { const target = paper || selectedPaper; if (target) { setReadingPaper(target); setIsReading(true); playSfx('click'); } };
  const toggleFusionSelection = (id: number) => { if (fusionTargetIds.includes(id)) { setFusionTargetIds(prev => prev.filter(i => i !== id)); } else { if (fusionTargetIds.length < 2) { setFusionTargetIds(prev => [...prev, id]); } } playSfx('click'); };

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
          if (item.type === 'THEME') return { ...prev, theme: item.id };
          // Determine slot based on item ID prefix or type
          if (item.id.startsWith('visualizer_') || item.id.startsWith('radar_')) return { ...prev, effect_monitor: item.value || 'default' };
          if (item.id.startsWith('skin_')) return { ...prev, effect_im: item.value || 'default' };
          if (item.id.startsWith('marker_')) return { ...prev, effect_marker: item.value || 'default' };
          return prev;
      });
  };

  const currentThemeColor = equipped.theme === 'theme_royal' ? '#D4AF37' : 
                            equipped.theme === 'theme_velvet' ? '#1a45a0' : 
                            equipped.theme === 'theme_tv' ? '#FFE600' :
                            equipped.theme === 'theme_hacker' ? '#00FF41' :
                            '#E60012';

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
              playSfx={playSfx} 
          />
      )}

      <LeftPane 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu} 
          folders={folders} 
          onAddFolder={handleAddFolder} 
          onDeleteFolder={handleDeleteFolder} 
          onBulkImport={handleBulkImport} 
          onShowStats={() => { setShowStats(true); playSfx('confirm'); }} 
          onShowShop={() => { setShowShop(true); playSfx('confirm'); }}
          onSyncConfig={handleSyncConfig} 
          playSfx={playSfx} 
      />
      <div className="flex-1 flex relative">
        <MiddlePane 
            activeMenu={activeMenu} 
            papers={papers} 
            selectedId={selectedPaper?.id || null} 
            onSelect={(p: any) => { setSelectedPaper(p); playSfx('click'); }} 
            onAddPaper={handleAddPaper} 
            onDeletePaper={handleDeletePaper} 
            onBulkImport={handleBulkImport}
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
         <RightPane 
            paper={selectedPaper} 
            onClose={() => setSelectedPaper(null)} 
            onAnalyze={handleThirdEye} 
            onRead={() => handleRead()} 
            playSfx={playSfx}
            onSaveNote={handleSaveNote}
         />
      </div>
      <AnimatePresence>
        {isReading && readingPaper && <ReaderOverlay paper={readingPaper} onClose={() => setIsReading(false)} onLevelUp={handleLevelUp} playSfx={playSfx} onSaveNote={handleSaveNote} markerStyle={equipped.effect_marker} />}
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
      <PhantomIM variant={equipped.effect_im} />
    </div>
  );
}

export default App;