import { useRef } from 'react';
import { BookOpen, Plus, Gem, Tag, User, Upload, PlusCircle, BrainCircuit, X } from 'lucide-react';
import type { Folder } from '../../types';

interface LeftPaneProps {
    activeMenu: string;
    setActiveMenu: (id: string) => void;
    folders: Folder[];
    onAddFolder: () => void;
    onDeleteFolder: (id: string, e: React.MouseEvent) => void;
    onBulkImport: (files: FileList) => void;
    onShowStats: () => void;
    onSyncConfig: () => void;
    playSfx: (type: any) => void;
}

const LeftPane = ({ activeMenu, setActiveMenu, folders, onAddFolder, onDeleteFolder, onBulkImport, onShowStats, onSyncConfig, playSfx }: LeftPaneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVelvet = activeMenu === 'velvet';
  const systemItems = [{ icon: BookOpen, label: 'All References', id: 'all' }, { icon: Plus, label: 'Infiltrate (Add)', id: 'add' }, { icon: Gem, label: 'Velvet Room', id: 'velvet' }, { icon: Tag, label: 'Recent', id: 'recent' }];
  
  return (
    <div className={`h-full border-r-4 p-6 flex flex-col w-72 shrink-0 relative overflow-hidden z-20 transition-colors duration-500 ${isVelvet ? 'bg-[#000033] border-[#D4AF37]' : 'bg-phantom-black border-phantom-red'}`}>
        <div className="absolute top-0 left-0 w-full h-full bg-halftone opacity-50 pointer-events-none" />
        <div className="mb-10 relative transform -rotate-6 origin-top-left cursor-default">
            <h1 className={`font-p5 tracking-tighter leading-none ${isVelvet ? 'text-[#D4AF37]' : 'text-white'}`} style={{ textShadow: isVelvet ? "2px 2px 0px #000" : "4px 4px 0px #E60012" }}>
                <span className="text-8xl font-black">P</span>
                <span className="text-5xl">HANTOM</span>
                <br/>
                <span className="text-3xl opacity-60 tracking-widest">ARCHIVE</span>
            </h1>
            <div className="bg-phantom-yellow text-black text-xs font-bold px-2 inline-block transform skew-x-[-12deg] mt-2 ml-2 shadow-[2px_2px_0px_#000]">LIB V.2.7</div>
        </div>
        
        <div className="space-y-2 mb-6">
            <button onClick={() => { onShowStats(); playSfx('click'); }} className="flex items-center space-x-2 bg-black border-2 border-white text-white p-2 hover:bg-white hover:text-black transition-colors w-full group"><User className="group-hover:rotate-12 transition-transform" /><span className="font-p5 text-lg">PHANTOM STATS</span></button>
            <button onClick={() => { onSyncConfig(); playSfx('click'); }} className="flex items-center space-x-2 bg-black border-2 border-zinc-500 text-zinc-400 p-2 hover:bg-phantom-red hover:text-white hover:border-black transition-colors w-full group"><BrainCircuit className="group-hover:animate-pulse" /><span className="font-p5 text-sm">SYNC LINK</span></button>
        </div>

        <nav className="space-y-4 z-10 mb-8">
            {systemItems.map((item) => (
                <button key={item.id} onClick={() => { setActiveMenu(item.id); playSfx('click'); }} className="relative w-full group cursor-pointer block text-left" onMouseEnter={() => playSfx('hover')}>
                    {activeMenu === item.id && <div className={`absolute inset-0 bg-white shadow-[4px_4px_0px_#000] clip-path-slash ${isVelvet ? 'shadow-[#D4AF37]' : 'shadow-[#E60012]'}`} />}
                    <div className={`relative flex items-center space-x-4 p-3 transform -skew-x-12 transition-colors duration-200 ${activeMenu === item.id ? 'text-black pl-8' : 'text-gray-400 hover:text-white'}`}>
                        <item.icon className={`w-6 h-6 ${activeMenu === item.id ? 'stroke-[3px]' : ''}`} />
                        <span className="font-p5 text-xl tracking-wider uppercase">{item.label}</span>
                    </div>
                </button>
            ))}
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onBulkImport(e.target.files)} multiple className="hidden" />
        </nav>
        
        <div className={`flex items-center justify-between border-b-2 pb-2 mb-4 z-10 ${isVelvet ? 'border-[#D4AF37]' : 'border-zinc-700'}`}>
            <h3 className={`text-sm font-bold tracking-[0.2em] ${isVelvet ? 'text-[#D4AF37]' : 'text-phantom-red'}`}>MISSIONS</h3>
            <button onClick={() => { onAddFolder(); playSfx('confirm'); }} className={`text-white hover:rotate-90 transition-all ${isVelvet ? 'hover:text-[#D4AF37]' : 'hover:text-phantom-red'}`}><PlusCircle size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto z-10 space-y-2 pr-2 custom-scrollbar">
            {folders.map((folder: Folder) => (
                <button key={folder.id} onClick={() => { setActiveMenu(`folder_${folder.id}`); playSfx('click'); }} className={`w-full text-left p-2 flex items-center justify-between group ${activeMenu === `folder_${folder.id}` ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white'}`}>
                    <span className="font-mono truncate flex-1">{folder.name}</span>
                    <span onClick={(e) => onDeleteFolder(folder.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-red-500"><X size={14} /></span>
                </button>
            ))}
        </div>
    </div>
  );
};

export default LeftPane;
