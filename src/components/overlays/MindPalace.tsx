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

const TAROT_IMAGES: Record<string, string> = {
    "0": "https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg",
    "I": "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
    "II": "https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg",
    "III": "https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg",
    "IV": "https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg",
    "V": "https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg",
    "VI": "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg",
    "VII": "https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg",
    "VIII": "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
    "IX": "https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg",
    "X": "https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg",
    "XI": "https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg",
    "XII": "https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg",
    "XIII": "https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg",
    "XIV": "https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg",
    "XV": "https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg",
    "XVI": "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
    "XVII": "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg",
    "XVIII": "https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg",
    "XIX": "https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg",
    "XX": "https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg",
    "XXI": "https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg"
};

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
            
            // --- PHYSICS CONSTANTS ---
            const REPULSION = 15000;
            const CENTER_GRAVITY = 0.0005;
            const DAMPING = 0.92;
            const MAX_SPEED = 12;
            const BASE_SPRING_K = 0.005;
            
            const currentNodes = simulationNodes.current;
            const now = Date.now() / 1000;

            // Reset Forces (using temp variables or just applying to velocity directly?)
            // We'll use a `forces` map to accumulate first.
            const forces = new Map<string, {x: number, y: number}>();
            currentNodes.forEach(n => forces.set(n.id, {x: 0, y: 0}));

            const addForce = (id: string, x: number, y: number) => {
                const f = forces.get(id);
                if (f) { f.x += x; f.y += y; }
            };

            // 1. REPULSION (N^2)
            for (let i = 0; i < currentNodes.length; i++) {
                for (let j = i + 1; j < currentNodes.length; j++) {
                    const n1 = currentNodes[i];
                    const n2 = currentNodes[j];
                    const dx = n1.x - n2.x;
                    const dy = n1.y - n2.y;
                    const distSq = dx*dx + dy*dy;
                    const dist = Math.sqrt(distSq) || 1;
                    
                    if (dist < 800) { // Interaction radius
                        const force = REPULSION / (distSq + 100);
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        addForce(n1.id, fx, fy);
                        addForce(n2.id, -fx, -fy);
                    }
                }
            }

            // 2. SPRINGS (Links)
            links.forEach(link => {
                const source = currentNodes.find(n => n.id === link.source);
                const target = currentNodes.find(n => n.id === link.target);
                if (source && target) {
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    
                    // Hooke's Law: F = k * (current_dist - rest_length)
                    // Stronger link = Closer (shorter rest length) + Stiffer
                    const restLength = 100 + (1 - link.strength) * 200; 
                    const k = BASE_SPRING_K * (1 + link.strength * 2);
                    
                    const displacement = dist - restLength;
                    const force = k * displacement;
                    
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    
                    addForce(source.id, fx, fy);
                    addForce(target.id, -fx, -fy);
                }
            });

            // 3. INTEGRATION & CONSTRAINTS
            currentNodes.forEach(node => {
                if (node.type === 'fool') {
                    node.x = width / 2;
                    node.y = height / 2;
                    return;
                }

                const f = forces.get(node.id) || {x: 0, y: 0};
                
                // Center Gravity
                f.x += (width/2 - node.x) * CENTER_GRAVITY;
                f.y += (height/2 - node.y) * CENTER_GRAVITY;

                // Levitation (Sine Wave)
                // Use consistent random seed based on ID length + char code
                const seed = node.id.length + (node.id.charCodeAt(node.id.length-1) || 0);
                f.y += Math.sin(now * 2 + seed) * 0.08;

                // Apply Force to Velocity
                node.vx = (node.vx + f.x) * DAMPING;
                node.vy = (node.vy + f.y) * DAMPING;

                // Speed Limit
                const speedSq = node.vx*node.vx + node.vy*node.vy;
                if (speedSq > MAX_SPEED*MAX_SPEED) {
                    const speed = Math.sqrt(speedSq);
                    node.vx = (node.vx / speed) * MAX_SPEED;
                    node.vy = (node.vy / speed) * MAX_SPEED;
                }

                // Update Position
                node.x += node.vx;
                node.y += node.vy;

                // Screen Boundaries (Soft Bounce)
                const margin = 50;
                if (node.x < margin) node.vx += 0.5;
                if (node.x > width - margin) node.vx -= 0.5;
                if (node.y < margin) node.vy += 0.5;
                if (node.y > height - margin) node.vy -= 0.5;
            });

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
                className="fixed inset-0 z-50 overflow-hidden" // Removed bg-black/95
                ref={containerRef}
                onClick={() => setSelectedNode(null)}
            >
            {/* --- BACKGROUND PATTERN --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black">
                {/* Deep Red Glow at Center - Atmosphere (Darker but breathing) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-phantom-red blur-[150px] opacity-10 rounded-full animate-pulse" />
                
                {/* Rotating Burst - Dynamic & Brighter */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg,#E60012_0deg,transparent_5deg,transparent_25deg,#E60012_30deg,transparent_45deg)] opacity-15 animate-[spin_60s_linear_infinite]" />
                
                {/* Dots - Texture */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#333_1px,transparent_1px)] bg-[length:24px_24px] opacity-20 mix-blend-screen" />
            </div>
            
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
                            stroke={isStrong ? "#E60012" : "#666"}
                            strokeWidth={isStrong ? 2.5 : 1}
                            strokeOpacity={isStrong ? 0.8 : 0.3}
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
                        whileHover={{ scale: 1.2, zIndex: 50, rotate: [0, -2, 2, 0] }}
                    >
                        {/* TOOLTIP ON HOVER */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                            <div className="bg-black text-white px-3 py-1 font-p5 text-lg border-2 border-phantom-red shadow-[4px_4px_0px_#E60012] transform -skew-x-12">
                                {node.type === 'fool' ? 'COGNITIVE CORE' : node.data?.title}
                            </div>
                            {node.data?.tags && (
                                <div className="flex gap-1 justify-center mt-1">
                                    {node.data.tags.map((t, i) => (
                                        <span key={i} className="bg-white text-black text-[10px] px-1 font-bold transform -skew-x-12">{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* TAROT CARD VISUAL */}
                        <div className={`relative w-32 h-52 bg-black border-2 rounded-lg overflow-hidden transition-all duration-300 ${
                            node.type === 'fool' 
                                ? 'border-phantom-blue shadow-[0_0_20px_#00f]' 
                                : selectedNode?.id === node.id 
                                    ? 'border-phantom-red shadow-[0_0_30px_#f00] scale-110' 
                                    : 'border-white/50 group-hover:border-phantom-red group-hover:shadow-[0_0_15px_#E60012]'
                        }`}>
                            {/* Card Image */}
                            {node.arcana && TAROT_IMAGES[node.arcana.number] ? (
                                <img 
                                    src={TAROT_IMAGES[node.arcana.number]} 
                                    alt={node.arcana.name} 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white/20">
                                    <Brain size={40} />
                                </div>
                            )}

                            {/* Overlay info (Always visible but subtle, pops on hover) */}
                            <div className="absolute inset-0 flex flex-col justify-between p-2 bg-gradient-to-b from-black/60 via-transparent to-black/80">
                                <div className="text-center font-serif text-white/90 text-xs tracking-widest border-b border-white/20 pb-1">
                                    {node.arcana?.number}
                                </div>
                                <div className="text-center font-p5 text-white text-sm tracking-wide uppercase pt-1 border-t border-white/20">
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
