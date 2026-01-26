import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Search } from 'lucide-react';
import type { Paper, FolderType, PlaySoundFunction } from '../../types';

interface SubwayOverlayProps {
    papers: Paper[];
    folders: FolderType[];
    onClose: () => void;
    onRead: (p: Paper) => void;
    playSfx: PlaySoundFunction;
}

export const SubwayOverlay = ({ papers, folders, onClose, onRead, playSfx }: SubwayOverlayProps) => {
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
