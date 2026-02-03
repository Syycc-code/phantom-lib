import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import type { Paper } from '../../types';
import * as THREE from 'three';

interface MindPalace3DProps {
    papers: Paper[];
    onClose: () => void;
    onRead: (paper: Paper) => void;
    playSfx: (type: 'click' | 'hover' | 'cancel' | 'impact') => void;
}

interface Node3D {
    id: string;
    position: [number, number, number];
    color: string;
    data?: Paper;
    type: 'center' | 'paper';
}

// 3D节点组件
function PaperNode({ node, onClick, isSelected }: { 
    node: Node3D; 
    onClick: () => void;
    isSelected: boolean;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // 浮动动画
            const time = state.clock.getElapsedTime();
            meshRef.current.position.y = node.position[1] + Math.sin(time + node.position[0]) * 0.2;
            
            // 选中时旋转
            if (isSelected) {
                meshRef.current.rotation.y += 0.01;
            }
        }
    });

    const scale = isSelected ? 1.5 : hovered ? 1.2 : 1;

    return (
        <group position={node.position}>
            <Sphere
                ref={meshRef}
                args={[node.type === 'center' ? 1 : 0.5, 32, 32]}
                scale={scale}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <meshStandardMaterial
                    color={node.color}
                    emissive={node.color}
                    emissiveIntensity={isSelected ? 0.8 : hovered ? 0.5 : 0.2}
                    metalness={0.8}
                    roughness={0.2}
                />
            </Sphere>

            {/* 粒子环效果 */}
            {(isSelected || hovered) && (
                <mesh>
                    <torusGeometry args={[node.type === 'center' ? 1.5 : 0.8, 0.05, 16, 100]} />
                    <meshBasicMaterial color={node.color} transparent opacity={0.6} />
                </mesh>
            )}

            {/* 标签 */}
            {(hovered || isSelected) && node.data && (
                <Text
                    position={[0, node.type === 'center' ? 1.8 : 1, 0]}
                    fontSize={0.3}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000"
                    maxWidth={5}
                >
                    {node.data.title}
                </Text>
            )}
        </group>
    );
}

// 连接线组件
function ConnectionLine({ start, end, color }: { 
    start: [number, number, number]; 
    end: [number, number, number];
    color: string;
}) {
    const points = useMemo(() => [
        new THREE.Vector3(...start),
        new THREE.Vector3(...end)
    ], [start, end]);

    return (
        <Line
            points={points}
            color={color}
            lineWidth={1}
            transparent
            opacity={0.3}
        />
    );
}

// 3D场景组件
function Scene3D({ 
    papers, 
    onNodeClick 
}: { 
    papers: Paper[]; 
    onNodeClick: (paper: Paper | null) => void;
}) {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // 球形布局算法
    const nodes = useMemo(() => {
        const nodeList: Node3D[] = [];
        const radius = 10;

        // 中心节点
        nodeList.push({
            id: 'center',
            position: [0, 0, 0],
            color: '#00f',
            type: 'center'
        });

        // 球形分布论文节点
        papers.forEach((paper, idx) => {
            const phi = Math.acos(-1 + (2 * idx) / papers.length);
            const theta = Math.sqrt(papers.length * Math.PI) * phi;

            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(phi);

            // 根据年份分配颜色
            const yearHash = paper.year ? parseInt(paper.year) : 0;
            const colors = ['#E60012', '#00A8E8', '#00B159', '#FFB612', '#9B59B6'];
            const color = colors[yearHash % colors.length];

            nodeList.push({
                id: `paper-${paper.id}`,
                position: [x, y, z],
                color,
                data: paper,
                type: 'paper'
            });
        });

        return nodeList;
    }, [papers]);

    // 生成连接线
    const connections = useMemo(() => {
        const lines: Array<{ start: [number, number, number]; end: [number, number, number]; color: string }> = [];
        
        // 所有论文连接到中心
        nodes.forEach(node => {
            if (node.type === 'paper') {
                lines.push({
                    start: [0, 0, 0],
                    end: node.position,
                    color: '#666'
                });
            }
        });

        // 基于标签连接论文
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const n1 = nodes[i];
                const n2 = nodes[j];
                
                if (n1.data && n2.data) {
                    const sharedTags = n1.data.tags.filter(t => n2.data!.tags.includes(t));
                    if (sharedTags.length > 0) {
                        lines.push({
                            start: n1.position,
                            end: n2.position,
                            color: '#E60012'
                        });
                    }
                }
            }
        }

        return lines;
    }, [nodes]);

    const handleNodeClick = (node: Node3D) => {
        setSelectedNodeId(node.id);
        onNodeClick(node.data || null);
    };

    return (
        <>
            {/* 环境光 */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#E60012" />

            {/* 粒子背景 */}
            <Stars />

            {/* 连接线 */}
            {connections.map((conn, idx) => (
                <ConnectionLine
                    key={idx}
                    start={conn.start}
                    end={conn.end}
                    color={conn.color}
                />
            ))}

            {/* 节点 */}
            {nodes.map(node => (
                <PaperNode
                    key={node.id}
                    node={node}
                    onClick={() => handleNodeClick(node)}
                    isSelected={selectedNodeId === node.id}
                />
            ))}

            {/* 轨道控制器 */}
            <OrbitControls
                enableDamping
                dampingFactor={0.05}
                rotateSpeed={0.5}
                zoomSpeed={0.8}
                minDistance={5}
                maxDistance={50}
            />
        </>
    );
}

// 星空背景
function Stars() {
    const starsRef = useRef<THREE.Points>(null);

    const starPositions = useMemo(() => {
        const positions = new Float32Array(5000 * 3);
        for (let i = 0; i < 5000; i++) {
            const radius = 50 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
        }
        return positions;
    }, []);

    useFrame(() => {
        if (starsRef.current) {
            starsRef.current.rotation.y += 0.0001;
        }
    });

    return (
        <points ref={starsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[starPositions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial size={0.1} color="#ffffff" transparent opacity={0.6} />
        </points>
    );
}

// 主组件
export function MindPalace3D({ papers, onClose, onRead }: MindPalace3DProps) {
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
        >
            {/* Canvas */}
            <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
                <Scene3D papers={papers} onNodeClick={setSelectedPaper} />
            </Canvas>

            {/* 标题 */}
            <div className="absolute top-6 left-12 z-50 pointer-events-none">
                <h1 className="text-6xl font-p5 text-white transform -skew-x-12 tracking-wider">
                    <span className="text-phantom-red">3D</span> MIND PALACE
                </h1>
                <p className="text-white/60 font-mono mt-2 ml-4">
                    // SPHERICAL KNOWLEDGE NETWORK
                </p>
            </div>

            {/* 关闭按钮 */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 z-50 p-2 bg-phantom-red text-white hover:bg-white hover:text-black transition-colors transform hover:rotate-90 duration-300"
            >
                <X size={32} />
            </button>

            {/* 详情面板 */}
            <AnimatePresence>
                {selectedPaper && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute right-0 top-0 bottom-0 w-80 bg-phantom-black border-l-4 border-phantom-red p-6 flex flex-col z-50 shadow-2xl"
                    >
                        <div className="flex-1">
                            <h2 className="text-2xl text-white font-bold leading-tight mb-4">
                                {selectedPaper.title}
                            </h2>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {selectedPaper.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-white text-black text-xs font-bold transform -skew-x-12">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            <div className="text-white/60 text-sm mb-4">
                                <div><strong>Author:</strong> {selectedPaper.author}</div>
                                <div><strong>Year:</strong> {selectedPaper.year}</div>
                            </div>

                            <p className="text-white/60 text-sm italic line-clamp-6">
                                "{selectedPaper.abstract}"
                            </p>
                        </div>

                        <button
                            onClick={() => onRead(selectedPaper)}
                            className="w-full py-4 bg-phantom-red text-white font-p5 text-xl hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 group"
                        >
                            <Zap className="group-hover:rotate-12 transition-transform" />
                            <span>TAKE YOUR HEART</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 操作提示 */}
            <div className="absolute bottom-6 left-6 text-white/40 font-mono text-sm space-y-1">
                <div>• 左键拖动: 旋转视角</div>
                <div>• 滚轮: 缩放</div>
                <div>• 点击节点: 查看详情</div>
            </div>
        </motion.div>
    );
}
