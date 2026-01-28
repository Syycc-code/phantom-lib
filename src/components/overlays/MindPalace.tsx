import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Zap, Brain } from 'lucide-react';
import type { Paper } from '../../types';

interface MindPalaceProps {
    papers: Paper[];
    onClose: () => void;
    onRead: (paper: Paper) => void;
    playSfx: (type: 'click' | 'hover' | 'cancel' | 'impact') => void;
}

// --- CONSTANTS: MAJOR ARCANA ---
const MAJOR_ARCANA = [
    { number: "0", name: "The Fool", meaning: "Beginnings, Innocence" }, // Center Node
    { number: "I", name: "The Magician", meaning: "Willpower, Creation" },
    { number: "II", name: "High Priestess", meaning: "Intuition, Unconscious" },
    { number: "III", name: "The Empress", meaning: "Fertility, Nature" },
    { number: "IV", name: "The Emperor", meaning: "Authority, Structure" },
    { number: "V", name: "The Hierophant", meaning: "Tradition, Beliefs" },
    { number: "VI", name: "The Lovers", meaning: "Partnership, Union" },
    { number: "VII", name: "The Chariot", meaning: "Control, Willpower" },
    { number: "VIII", name: "Strength", meaning: "Courage, Influence" },
    { number: "IX", name: "The Hermit", meaning: "Introspection, Guidance" },
    { number: "X", name: "Wheel of Fortune", meaning: "Destiny, Change" },
    { number: "XI", name: "Justice", meaning: "Fairness, Truth" },
    { number: "XII", name: "The Hanged Man", meaning: "Surrender, Perspective" },
    { number: "XIII", name: "Death", meaning: "Endings, Transition" },
    { number: "XIV", name: "Temperance", meaning: "Balance, Moderation" },
    { number: "XV", name: "The Devil", meaning: "Addiction, Materialism" },
    { number: "XVI", name: "The Tower", meaning: "Upheaval, Awakening" },
    { number: "XVII", name: "The Star", meaning: "Hope, Inspiration" },
    { number: "XVIII", name: "The Moon", meaning: "Illusion, Fear" },
    { number: "XIX", name: "The Sun", meaning: "Positivity, Success" },
    { number: "XX", name: "Judgement", meaning: "Rebirth, Inner Calling" },
    { number: "XXI", name: "The World", meaning: "Completion, Travel" }
];

// --- TYPES ---
interface Node {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    type: 'fool' | 'paper';
    data?: Paper;
    arcana?: typeof MAJOR_ARCANA[0];
}

interface Link {
    source: string;
    target: string;
    strength: number; // 0-1
}

function MindPalace({ papers, onClose, onRead, playSfx }: MindPalaceProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // 1. Initialize Nodes & Links
    const { nodes, links } = useMemo(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // A. Create Nodes
        const initialNodes: Node[] = [];
        
        // Center Node: The Fool (You)
        initialNodes.push({
            id: 'root-fool',
            x: width / 2,
            y: height / 2,
            vx: 0,
            vy: 0,
            type: 'fool',
            arcana: MAJOR_ARCANA[0]
        });

        // Paper Nodes
        papers.forEach((p, idx) => {
            // Assign Arcana based on index (skipping 0-Fool)
            const arcanaIdx = (idx % (MAJOR_ARCANA.length - 1)) + 1;
            initialNodes.push({
                id: `paper-${p.id}`,
                x: width / 2 + (Math.random() - 0.5) * 400,
                y: height / 2 + (Math.random() - 0.5) * 400,
                vx: 0,
                vy: 0,
                type: 'paper',
                data: p,
                arcana: MAJOR_ARCANA[arcanaIdx]
            });
        });

        // B. Create Links
        const initialLinks: Link[] = [];
        
        // Link all to Fool (Weak connection)
        papers.forEach(p => {
            initialLinks.push({ source: 'root-fool', target: `paper-${p.id}`, strength: 0.05 });
        });

        // Link Papers based on Shared Tags (Strong connection)
        for (let i = 0; i < papers.length; i++) {
            for (let j = i + 1; j < papers.length; j++) {
                const p1 = papers[i];
                const p2 = papers[j];
                const sharedTags = p1.tags.filter(t => p2.tags.includes(t));
                
                if (sharedTags.length > 0) {
                    initialLinks.push({ 
                        source: `paper-${p1.id}`, 
                        target: `paper-${p2.id}`, 
                        strength: 0.1 + (sharedTags.length * 0.05) // More tags = closer
                    });
                }
            }
        }

        return { nodes: initialNodes, links: initialLinks };
    }, [papers]);

    // Mutable state for physics simulation
    const simulationNodes = useRef(nodes);
    const [renderTrigger, setRenderTrigger] = useState(0);

    // 2. Physics Engine (Custom RAF Loop)
    useEffect(() => {
        simulationNodes.current = nodes; // Update ref if props change
        let animationFrameId: number;

        const tick = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const k = 0.05; // Spring constant
            const repulsion = 5000;
            const centerRepulsion = 100;

            const currentNodes = simulationNodes.current;

            // Apply Forces
            for (let i = 0; i < currentNodes.length; i++) {
                const node = currentNodes[i];
                if (node.type === 'fool') {
                    // Lock Fool to center
                    node.x = width / 2;
                    node.y = height / 2;
                    continue;
                }

                let fx = 0, fy = 0;

                // 1. Repulsion (Nodes push away from each other)
                for (let j = 0; j < currentNodes.length; j++) {
                    if (i === j) continue;
                    const other = currentNodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distSq = dx * dx + dy * dy || 1;
                    const force = repulsion / distSq;
                    fx += (dx / Math.sqrt(distSq)) * force;
                    fy += (dy / Math.sqrt(distSq)) * force;
                }

                // 2. Attraction (Links pull together)
                links.forEach(link => {
                    const isSource = link.source === node.id;
                    const isTarget = link.target === node.id;
                    if (isSource || isTarget) {
                        const targetId = isSource ? link.target : link.source;
                        const targetNode = currentNodes.find(n => n.id === targetId);
                        if (targetNode) {
                            const dx = targetNode.x - node.x;
                            const dy = targetNode.y - node.y;
                            fx += dx * k * link.strength;
                            fy += dy * k * link.strength;
                        }
                    }
                });

                // 3. Center Gravity (Keep them on screen)
                const dx = (width / 2) - node.x;
                const dy = (height / 2) - node.y;
                fx += dx * 0.002;
                fy += dy * 0.002;

                // Apply Velocity
                node.vx = (node.vx + fx) * 0.9; // Damping
                node.vy = (node.vy + fy) * 0.9;
                node.x += node.vx;
                node.y += node.vy;
            }

            setRenderTrigger(prev => prev + 1); // Force re-render
            animationFrameId = requestAnimationFrame(tick);
        };

        tick();
        return () => cancelAnimationFrame(animationFrameId);
    }, [nodes, links]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md overflow-hidden"
            ref={containerRef}
            onClick={() => setSelectedNode(null)}
        >
            {/* --- BACKGROUND PATTERN --- */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
            
            {/* --- HEADER --- */}
            <div className="absolute top-6 left-12 z-50 pointer-events-none">
                <h1 className="text-6xl font-p5 text-white transform -skew-x-12 tracking-wider">
                    <span className="text-phantom-red">MIND</span> PALACE
                </h1>
                <p className="text-white/60 font-mono mt-2 ml-4">
                    // COGNITIVE NETWORK VISUALIZATION
                </p>
            </div>

            <button 
                onClick={onClose}
                className="absolute top-8 right-8 z-50 p-2 bg-phantom-red text-white hover:bg-white hover:text-black transition-colors transform hover:rotate-90 duration-300"
            >
                <X size={32} />
            </button>

            {/* --- VISUALIZATION LAYER --- */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {links.map((link, i) => {
                    const source = simulationNodes.current.find(n => n.id === link.source);
                    const target = simulationNodes.current.find(n => n.id === link.target);
                    if (!source || !target) return null;

                    const isStrong = link.strength > 0.09;

                    return (
                        <motion.line
                            key={i}
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke={isStrong ? "#FF0000" : "#444"}
                            strokeWidth={isStrong ? 2 : 1}
                            strokeOpacity={isStrong ? 0.6 : 0.2}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: i * 0.05 }}
                        />
                    );
                })}
            </svg>

            {/* --- NODES LAYER --- */}
            <div className="absolute inset-0 pointer-events-none">
                {simulationNodes.current.map((node) => (
                    <motion.div
                        key={node.id}
                        className={`absolute flex flex-col items-center justify-center cursor-pointer pointer-events-auto group ${
                            selectedNode?.id === node.id ? 'z-40' : 'z-10'
                        }`}
                        style={{
                            left: node.x,
                            top: node.y,
                            x: '-50%',
                            y: '-50%'
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(node);
                            playSfx('click');
                        }}
                        whileHover={{ scale: 1.1, zIndex: 50 }}
                    >
                        {/* TAROT CARD VISUAL */}
                        <div className={`relative w-24 h-36 bg-black border-2 transition-all duration-300 ${
                            node.type === 'fool' 
                                ? 'border-phantom-blue shadow-[0_0_20px_#00f]' 
                                : selectedNode?.id === node.id 
                                    ? 'border-phantom-red shadow-[0_0_30px_#f00] scale-125' 
                                    : 'border-white/50 hover:border-phantom-red'
                        }`}>
                            {/* Card Pattern/Image Placeholder */}
                            <div className="absolute inset-1 border border-white/20 flex flex-col items-center p-1 bg-zinc-900">
                                {/* Arcana Number Top */}
                                <div className="text-[10px] font-serif text-white/50 w-full text-center border-b border-white/10 pb-1">
                                    {node.arcana?.number}
                                </div>
                                
                                {/* Icon / Content */}
                                <div className="flex-1 flex items-center justify-center">
                                    {node.type === 'fool' ? (
                                        <Brain size={32} className="text-phantom-blue animate-pulse" />
                                    ) : (
                                        <div className="text-center">
                                            <ExternalLink size={20} className="text-white/30 mx-auto mb-1" />
                                            {/* Mini Tag Indicators */}
                                            <div className="flex gap-1 justify-center flex-wrap">
                                                {node.data?.tags.slice(0, 2).map((t, i) => (
                                                    <span key={i} className="w-1 h-1 rounded-full bg-phantom-red" />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Arcana Name Bottom */}
                                <div className="text-[9px] font-serif text-white/80 uppercase tracking-tighter text-center pt-1 border-t border-white/10 w-full truncate">
                                    {node.arcana?.name}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- DETAILS OVERLAY (Right Side) --- */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div 
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute right-0 top-0 bottom-0 w-80 bg-phantom-black border-l-4 border-phantom-red p-6 flex flex-col z-50 shadow-2xl"
                    >
                        <div className="flex-1">
                            <div className="text-phantom-red font-serif italic text-sm mb-2">
                                {selectedNode.arcana?.number}. {selectedNode.arcana?.name}
                            </div>
                            
                            {selectedNode.type === 'fool' ? (
                                <>
                                    <h2 className="text-3xl text-white font-p5 mb-4">THE FOOL</h2>
                                    <p className="text-white/70 text-sm leading-relaxed">
                                        The beginning of the journey. Infinite possibilities. This node represents your cognitive core, connecting all knowledge fragments.
                                    </p>
                                    <div className="mt-8 border-t border-dashed border-white/30 pt-4">
                                        <div className="text-xs text-phantom-blue uppercase tracking-widest mb-2">System Stats</div>
                                        <div className="text-2xl text-white font-bold">{papers.length} <span className="text-sm font-normal text-gray-400">Fragments</span></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl text-white font-bold leading-tight mb-4 font-sans">
                                        {selectedNode.data?.title}
                                    </h2>
                                    
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {selectedNode.data?.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-1 bg-white text-black text-xs font-bold transform -skew-x-12">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {selectedNode.data?.shadow_problem && (
                                        <div className="mb-4 bg-red-900/20 p-3 border-l-2 border-red-500">
                                            <div className="text-xs text-red-400 font-bold mb-1">SHADOW</div>
                                            <p className="text-white/80 text-xs">{selectedNode.data.shadow_problem}</p>
                                        </div>
                                    )}

                                    <p className="text-white/60 text-sm italic line-clamp-6">
                                        "{selectedNode.data?.abstract}"
                                    </p>
                                </>
                            )}
                        </div>

                        {selectedNode.type === 'paper' && (
                            <button
                                onClick={() => {
                                    if(selectedNode.data) onRead(selectedNode.data);
                                }}
                                className="w-full py-4 bg-phantom-red text-white font-p5 text-xl hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 group"
                            >
                                <Zap className="group-hover:rotate-12 transition-transform" />
                                <span>TAKE YOUR HEART</span>
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export { MindPalace };
