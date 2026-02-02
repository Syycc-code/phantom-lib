import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain } from 'lucide-react';
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

// Local Tarot Card Images (User's custom deck in public/tarot/)
const TAROT_IMAGES: Record<string, string> = {
    "0": "/tarot/arcana_0.avif",
    "I": "/tarot/arcana_I.avif",
    "II": "/tarot/arcana_II.avif",
    "III": "/tarot/arcana_III.avif",
    "IV": "/tarot/arcana_IV.avif",
    "V": "/tarot/arcana_V.avif",
    "VI": "/tarot/arcana_VI.avif",
    "VII": "/tarot/arcana_VII.avif",
    "VIII": "/tarot/arcana_VIII.avif",
    "IX": "/tarot/arcana_IX.avif",
    "X": "/tarot/arcana_X.avif",
    "XI": "/tarot/arcana_XI.avif",
    "XII": "/tarot/arcana_XII.avif",
    "XIII": "/tarot/arcana_XIII.webp",
    "XIV": "/tarot/arcana_XIV.avif",
    "XV": "/tarot/arcana_XV.webp",
    "XVI": "/tarot/arcana_XVI.avif",
    "XVII": "/tarot/arcana_XVII.avif",
    "XVIII": "/tarot/arcana_XVIII.avif",
    "XIX": "/tarot/arcana_XIX.avif",
    "XX": "/tarot/arcana_XX.webp",
    "XXI": "/tarot/arcana_XXI.avif"
};

// Enhanced P5-style SVG Tarot Cards with detailed designs (fallback)
const generateTarotCard = (arcana: typeof MAJOR_ARCANA[0]) => {
    // P5 color palette for each arcana
    const arcanaStyles: Record<string, { primary: string; secondary: string; symbol: string }> = {
        "0": { primary: "#E60012", secondary: "#FFD700", symbol: "★" },
        "I": { primary: "#9B59B6", secondary: "#E74C3C", symbol: "◆" },
        "II": { primary: "#3498DB", secondary: "#ECF0F1", symbol: "◐" },
        "III": { primary: "#2ECC71", secondary: "#F39C12", symbol: "♣" },
        "IV": { primary: "#E74C3C", secondary: "#34495E", symbol: "♦" },
        "V": { primary: "#95A5A6", secondary: "#BDC3C7", symbol: "⊕" },
        "VI": { primary: "#E91E63", secondary: "#FF6B9D", symbol: "♥" },
        "VII": { primary: "#FF5722", secondary: "#FFAB00", symbol: "▲" },
        "VIII": { primary: "#8BC34A", secondary: "#CDDC39", symbol: "♠" },
        "IX": { primary: "#795548", secondary: "#A1887F", symbol: "◉" },
        "X": { primary: "#FFC107", secondary: "#FF9800", symbol: "◎" },
        "XI": { primary: "#00BCD4", secondary: "#0097A7", symbol: "⚖" },
        "XII": { primary: "#673AB7", secondary: "#9575CD", symbol: "⌘" },
        "XIII": { primary: "#212121", secondary: "#616161", symbol: "☠" },
        "XIV": { primary: "#009688", secondary: "#4DB6AC", symbol: "⚗" },
        "XV": { primary: "#D32F2F", secondary: "#C62828", symbol: "⛧" },
        "XVI": { primary: "#FF6F00", secondary: "#F57C00", symbol: "⚡" },
        "XVII": { primary: "#1976D2", secondary: "#64B5F6", symbol: "✦" },
        "XVIII": { primary: "#5E35B1", secondary: "#9575CD", symbol: "☾" },
        "XIX": { primary: "#FFB300", secondary: "#FDD835", symbol: "☀" },
        "XX": { primary: "#D81B60", secondary: "#EC407A", symbol: "⚔" },
        "XXI": { primary: "#00897B", secondary: "#26A69A", symbol: "🌍" }
    };
    
    const style = arcanaStyles[arcana.number] || arcanaStyles["0"];
    
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 320" style="background:#0a0a0a">
            <defs>
                <linearGradient id="bg${arcana.number}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${style.primary};stop-opacity:0.2" />
                    <stop offset="50%" style="stop-color:#000;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${style.secondary};stop-opacity:0.2" />
                </linearGradient>
                <radialGradient id="glow${arcana.number}">
                    <stop offset="0%" style="stop-color:${style.primary};stop-opacity:0.4" />
                    <stop offset="100%" style="stop-color:${style.primary};stop-opacity:0" />
                </radialGradient>
                <filter id="shadow">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${style.primary}" flood-opacity="0.6"/>
                </filter>
            </defs>
            
            <!-- Background -->
            <rect width="200" height="320" fill="url(#bg${arcana.number})"/>
            
            <!-- Border Frame (P5 style angular) -->
            <path d="M 10,10 L 190,10 L 190,310 L 10,310 Z" fill="none" stroke="${style.primary}" stroke-width="2" opacity="0.6"/>
            <path d="M 15,15 L 185,15 L 185,305 L 15,305 Z" fill="none" stroke="${style.secondary}" stroke-width="1" opacity="0.4"/>
            
            <!-- Top decorative element -->
            <path d="M 100,30 L 80,50 L 120,50 Z" fill="${style.primary}" opacity="0.8"/>
            <circle cx="100" cy="30" r="15" fill="url(#glow${arcana.number})"/>
            
            <!-- Central Arcana Number (Large & Bold) -->
            <text x="100" y="180" text-anchor="middle" font-family="Georgia, serif" font-size="90" font-weight="bold" 
                  fill="${style.primary}" opacity="0.9" filter="url(#shadow)">${arcana.number}</text>
            
            <!-- Symbol overlay -->
            <text x="100" y="140" text-anchor="middle" font-size="40" fill="${style.secondary}" opacity="0.5">${style.symbol}</text>
            
            <!-- Bottom Name Label -->
            <rect x="20" y="270" width="160" height="30" fill="#000" opacity="0.7"/>
            <text x="100" y="292" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
                  fill="#fff" letter-spacing="2">${arcana.name.toUpperCase()}</text>
            
            <!-- Corner accents (P5 style angular cuts) -->
            <path d="M 10,10 L 30,10 L 10,30 Z" fill="${style.primary}" opacity="0.5"/>
            <path d="M 190,10 L 170,10 L 190,30 Z" fill="${style.primary}" opacity="0.5"/>
            <path d="M 10,310 L 30,310 L 10,290 Z" fill="${style.secondary}" opacity="0.5"/>
            <path d="M 190,310 L 170,310 L 190,290 Z" fill="${style.secondary}" opacity="0.5"/>
            
            <!-- Radial glow effect in center -->
            <circle cx="100" cy="160" r="80" fill="url(#glow${arcana.number})"/>
        </svg>
    `)}`;
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
    const [, setRenderTrigger] = useState(0);

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
                            {/* Rider-Waite Tarot Image (with P5 SVG fallback) */}
                            {node.arcana ? (
                                TAROT_IMAGES[node.arcana.number] ? (
                                    <img 
                                        src={TAROT_IMAGES[node.arcana.number]} 
                                        alt={node.arcana.name} 
                                        className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity"
                                        onError={(e) => {
                                            // Fallback to enhanced SVG if real image fails
                                            e.currentTarget.src = generateTarotCard(node.arcana!);
                                        }}
                                    />
                                ) : (
                                    <img 
                                        src={generateTarotCard(node.arcana)} 
                                        alt={node.arcana.name} 
                                        className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity"
                                    />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white/20">
                                    <Brain size={40} />
                                </div>
                            )}
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
