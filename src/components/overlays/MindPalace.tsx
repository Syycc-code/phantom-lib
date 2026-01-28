import { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Line, Billboard, Float } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Maximize2 } from 'lucide-react';
import type { Paper, PlaySoundFunction } from '../../types';

interface MindPalaceProps {
    papers: Paper[];
    onClose: () => void;
    onRead: (paper: Paper) => void;
    playSfx: PlaySoundFunction;
}

// Helper: Calculate positions based on tags (Force Directed layout simulation)
const calculatePositions = (papers: Paper[]) => {
    // If no papers, generate some dummy nodes for visualization
    if (!papers || papers.length === 0) {
        return Array.from({ length: 5 }, (_, i) => ({
            id: -i,
            title: "Empty Node",
            abstract: "The mind palace is empty.",
            tags: ["Void"],
            x: (Math.random() - 0.5) * 5, // Reduced range
            y: (Math.random() - 0.5) * 5,
            z: (Math.random() - 0.5) * 5,
            cluster: "Void"
        }));
    }

    const nodes = papers.map(p => ({
        ...p,
        x: (Math.random() - 0.5) * 10, // Compact range
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10,
        cluster: p.tags?.[0] || 'Unknown'
    }));

    return nodes;
};

// Component: Single Document Node (Optimized)
const Node = ({ data, onSelect, selectedId }: { data: any, onSelect: (p: any) => void, selectedId: number | null }) => {
    const mesh = useRef<THREE.Mesh>(null);
    const isSelected = selectedId === data.id;
    
    // Simple rotation without heavy Float calculations if lagging
    useFrame((state) => {
        if (!mesh.current) return;
        mesh.current.rotation.y += 0.01;
    });

    return (
        <group position={[data.x, data.y, data.z]}>
            {/* Document Mesh */}
            <mesh 
                ref={mesh} 
                onClick={(e) => { e.stopPropagation(); onSelect(data); }}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                <boxGeometry args={[1.5, 2, 0.2]} />
                <meshStandardMaterial 
                    color={isSelected ? "#E60012" : "#222"} 
                    emissive={isSelected ? "#E60012" : "#444"}
                    emissiveIntensity={isSelected ? 0.8 : 0.5} // Higher visibility
                    roughness={0.4}
                    metalness={0.6}
                />
            </mesh>
            
            {/* Wireframe for visibility - Always visible */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.6, 2.1, 0.25]} />
                <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.3} />
            </mesh>

            {/* Floating Title - Simplified Billboard */}
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                <Text 
                    position={[0, 1.5, 0]} 
                    fontSize={0.5} // Larger text
                    color="white"
                    anchorX="center" 
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000"
                >
                    {data.title ? (data.title.length > 10 ? data.title.substring(0, 10) + '...' : data.title) : "Untitled"}
                </Text>
            </Billboard>
        </group>
    );
};

// Component: Connections (Synapses)
const Connections = ({ nodes }: { nodes: any[] }) => {
    // Generate lines between nodes sharing tags
    const lines = useMemo(() => {
        const connections: any[] = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                // If share at least one tag
                const n1 = nodes[i];
                const n2 = nodes[j];
                const sharedTags = n1.tags?.filter((t: string) => n2.tags?.includes(t));
                
                if (sharedTags && sharedTags.length > 0) {
                    connections.push({
                        start: [n1.x, n1.y, n1.z],
                        end: [n2.x, n2.y, n2.z],
                        strength: sharedTags.length
                    });
                }
            }
        }
        return connections;
    }, [nodes]);

    return (
        <group>
            {lines.map((line, i) => (
                <Line 
                    key={i} 
                    points={[line.start, line.end]} 
                    color="#444" 
                    lineWidth={1} 
                    transparent 
                    opacity={0.2} 
                />
            ))}
        </group>
    );
};

export const MindPalace = ({ papers, onClose, onRead, playSfx }: MindPalaceProps) => {
    const nodes = useMemo(() => calculatePositions(papers), [papers]);
    const [selectedPaper, setSelectedPaper] = useState<any | null>(null);

    const handleSelect = (paper: any) => {
        playSfx('click');
        setSelectedPaper(paper);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 1.1 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[500] bg-black"
        >
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between pointer-events-none">
                <div className="pointer-events-auto">
                    <h1 className="text-4xl font-p5 text-white tracking-widest text-shadow-red">
                        MIND PALACE
                    </h1>
                    <p className="text-gray-400 font-mono text-sm">
                        COGNITIVE METAVERSE // {papers.length} NODES DETECTED
                    </p>
                </div>
                <button 
                    onClick={() => { onClose(); playSfx('cancel'); }}
                    className="pointer-events-auto bg-black border-2 border-white rounded-full p-2 text-white hover:bg-white hover:text-black transition-colors"
                >
                    <X size={32} />
                </button>
            </div>

            {/* Selected Paper Detail Overlay */}
            <AnimatePresence>
                {selectedPaper && (
                    <motion.div 
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        className="absolute top-0 right-0 w-96 h-full bg-black/80 backdrop-blur-md border-l-4 border-phantom-red z-20 p-8 flex flex-col pointer-events-auto"
                    >
                        <h2 className="text-2xl font-p5 text-white mb-4">{selectedPaper.title}</h2>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            {selectedPaper.tags?.map((tag: string) => (
                                <span key={tag} className="px-2 py-1 bg-zinc-800 text-xs font-mono text-gray-300 border border-gray-600">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar mb-6">
                            <p className="text-gray-300 font-serif text-sm leading-relaxed">
                                {selectedPaper.abstract || "No cognitive data available for this node."}
                            </p>
                        </div>

                        <button 
                            onClick={() => { onRead(selectedPaper); playSfx('confirm'); }}
                            className="w-full py-4 bg-phantom-red text-white font-p5 text-xl tracking-widest hover:bg-white hover:text-phantom-red transition-colors flex items-center justify-center gap-2"
                        >
                            <Maximize2 size={20} /> ENTER NODE
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3D Scene */}
            <div className="w-full h-full cursor-move bg-black">
                <Canvas 
                    camera={{ position: [0, 0, 30], fov: 50 }}
                    dpr={[1, 2]} // Limit DPR for performance
                    gl={{ antialias: false, powerPreference: "high-performance" }} // Optimize WebGL context
                >
                    <color attach="background" args={['#050505']} />
                    <fog attach="fog" args={['#050505', 20, 60]} />
                    
                    <ambientLight intensity={1.5} /> {/* Stronger ambient */}
                    <pointLight position={[10, 10, 10]} intensity={2} color="#E60012" distance={50} />
                    <pointLight position={[-10, -10, -10]} intensity={1} color="#444" distance={50} />
                    
                    <Stars radius={50} depth={20} count={2000} factor={3} saturation={0} fade speed={0.5} />
                    
                    <group>
                        {/* Central Core Marker */}
                        <mesh position={[0,0,0]}>
                            <sphereGeometry args={[0.5, 16, 16]} />
                            <meshStandardMaterial color="#E60012" emissive="#E60012" emissiveIntensity={2} />
                        </mesh>
                        <gridHelper args={[100, 20, "#333", "#111"]} position={[0, -10, 0]} /> {/* Floor Grid */}

                        {nodes.map(node => (
                            <Node 
                                key={node.id} 
                                data={node} 
                                onSelect={handleSelect} 
                                selectedId={selectedPaper?.id} 
                            />
                        ))}
                        <Connections nodes={nodes} />
                    </group>

                    <OrbitControls 
                        enablePan={true} 
                        enableZoom={true} 
                        enableRotate={true}
                        autoRotate={!selectedPaper}
                        autoRotateSpeed={0.3}
                        maxDistance={60}
                        minDistance={5}
                    />
                </Canvas>
            </div>
        </motion.div>
    );
};
