import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain, Calendar, Filter, Grid3x3, Box } from 'lucide-react';
import type { Paper } from '../../types';
import { MindPalace3D } from './MindPalace3D';

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

// 四叉树节点类型
interface QuadTreeNode {
    x: number;
    y: number;
    width: number;
    height: number;
    nodes: Node[];
    children?: QuadTreeNode[];
}

// 视图模式类型
type ViewMode = 'force' | 'timeline' | 'cluster';

// 聚类类型
type ClusterMode = 'none' | 'folder' | 'tag' | 'year';

// 从文件名提取年月信息 (格式: YYMM开头，如 2512.15745v1)
const extractDateFromFilename = (filename: string): { year: string; month: string; yearMonth: string } | null => {
    // 去掉扩展名，只保留文件名部分
    const nameOnly = filename.replace(/\.(pdf|txt|docx?|png|jpe?g)$/i, '');
    
    // 匹配开头的4位数字 (YYMM)
    const match = nameOnly.match(/^(\d{4})/);
    if (match) {
        const yymm = match[1];
        const yy = yymm.substring(0, 2);
        const mm = yymm.substring(2, 4);
        
        // 转换为完整年份 (假设 20YY)
        const fullYear = `20${yy}`;
        const monthNum = parseInt(mm, 10);
        
        // 验证月份有效性
        if (monthNum >= 1 && monthNum <= 12) {
            return {
                year: fullYear,
                month: mm,
                yearMonth: `${fullYear}-${mm}`
            };
        }
    }
    return null;
};

// 格式化月份显示
const formatMonth = (yyyymm: string): string => {
    const [year, month] = yyyymm.split('-');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthIdx = parseInt(month, 10) - 1;
    return `${monthNames[monthIdx]} ${year}`;
};

function MindPalace({ papers, onClose, onRead, playSfx }: MindPalaceProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('force');
    const [clusterMode, setClusterMode] = useState<ClusterMode>('none');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [show3D, setShow3D] = useState(false);

    // 提取所有年份和标签
    const { years, allTags } = useMemo(() => {
        const yearSet = new Set<string>();
        const tagSet = new Set<string>();
        papers.forEach(p => {
            if (p.year) yearSet.add(p.year);
            p.tags.forEach(t => tagSet.add(t));
        });
        return {
            years: Array.from(yearSet).sort(),
            allTags: Array.from(tagSet).sort()
        };
    }, [papers]);

    // 四叉树构建函数（性能优化）
    const buildQuadTree = (nodes: Node[], x: number, y: number, width: number, height: number, depth = 0): QuadTreeNode => {
        const MAX_DEPTH = 6;
        const MAX_NODES = 4;
        
        const tree: QuadTreeNode = { x, y, width, height, nodes: [] };
        
        // 过滤在当前范围内的节点
        const nodesInBounds = nodes.filter(n => 
            n.x >= x && n.x < x + width && n.y >= y && n.y < y + height
        );
        
        if (nodesInBounds.length <= MAX_NODES || depth >= MAX_DEPTH) {
            tree.nodes = nodesInBounds;
            return tree;
        }
        
        // 递归分割为4个子树
        const halfW = width / 2;
        const halfH = height / 2;
        tree.children = [
            buildQuadTree(nodesInBounds, x, y, halfW, halfH, depth + 1),
            buildQuadTree(nodesInBounds, x + halfW, y, halfW, halfH, depth + 1),
            buildQuadTree(nodesInBounds, x, y + halfH, halfW, halfH, depth + 1),
            buildQuadTree(nodesInBounds, x + halfW, y + halfH, halfW, halfH, depth + 1),
        ];
        
        return tree;
    };

    // 四叉树范围查询（加速斥力计算）
    const queryQuadTree = (tree: QuadTreeNode, x: number, y: number, radius: number): Node[] => {
        const result: Node[] = [];
        
        // 检查范围是否相交
        const intersects = !(
            x + radius < tree.x ||
            x - radius > tree.x + tree.width ||
            y + radius < tree.y ||
            y - radius > tree.y + tree.height
        );
        
        if (!intersects) return result;
        
        if (tree.children) {
            tree.children.forEach(child => {
                result.push(...queryQuadTree(child, x, y, radius));
            });
        } else {
            result.push(...tree.nodes);
        }
        
        return result;
    };

    // 时间轴布局算法（按月份分组）
    const applyTimelineLayout = (nodes: Node[]) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 按年月分组
        const timeGroups = new Map<string, Node[]>();
        nodes.forEach(n => {
            if (n.type === 'paper' && n.data) {
                let yearMonth = '';
                
                // 优先从文件名提取
                if (n.data.fileUrl) {
                    const filename = n.data.fileUrl.split('/').pop() || '';
                    const dateInfo = extractDateFromFilename(filename);
                    if (dateInfo) {
                        yearMonth = dateInfo.yearMonth;
                    }
                }
                
                // 如果文件名没有，使用year字段
                if (!yearMonth && n.data.year) {
                    yearMonth = `${n.data.year}-00`; // 00表示未知月份
                }
                
                if (yearMonth) {
                    if (!timeGroups.has(yearMonth)) {
                        timeGroups.set(yearMonth, []);
                    }
                    timeGroups.get(yearMonth)!.push(n);
                }
            }
        });
        
        // 按时间排序
        const sortedTimes = Array.from(timeGroups.keys()).sort();
        const timeSpacing = Math.min(width / (sortedTimes.length + 1), 250);
        
        sortedTimes.forEach((yearMonth, idx) => {
            const timeNodes = timeGroups.get(yearMonth)!;
            const centerX = (idx + 1) * timeSpacing;
            const stackHeight = timeNodes.length * 70;
            const startY = (height - stackHeight) / 2;
            
            timeNodes.forEach((node, i) => {
                node.x = centerX + (Math.random() - 0.5) * 80;
                node.y = startY + i * 70;
                node.vx = 0;
                node.vy = 0;
            });
        });
        
        // 中心节点居中底部
        const foolNode = nodes.find(n => n.type === 'fool');
        if (foolNode) {
            foolNode.x = width / 2;
            foolNode.y = height - 100;
        }
    };

    // 聚类布局算法
    const applyClusterLayout = (nodes: Node[], mode: ClusterMode) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        if (mode === 'none') return;
        
        // 分组逻辑
        const groups = new Map<string, Node[]>();
        
        nodes.forEach(n => {
            if (n.type === 'paper' && n.data) {
                let groupKey = 'unknown';
                
                if (mode === 'year' && n.data.year) {
                    groupKey = n.data.year;
                } else if (mode === 'tag' && n.data.tags.length > 0) {
                    groupKey = n.data.tags[0]; // 使用第一个标签
                } else if (mode === 'folder' && n.data.folder_id) {
                    groupKey = `folder-${n.data.folder_id}`;
                }
                
                if (!groups.has(groupKey)) groups.set(groupKey, []);
                groups.get(groupKey)!.push(n);
            }
        });
        
        // 圆形布局各个聚类
        const groupKeys = Array.from(groups.keys());
        const angleStep = (2 * Math.PI) / groupKeys.length;
        const radius = Math.min(width, height) * 0.3;
        
        groupKeys.forEach((key, idx) => {
            const angle = idx * angleStep;
            const clusterCenterX = width / 2 + Math.cos(angle) * radius;
            const clusterCenterY = height / 2 + Math.sin(angle) * radius;
            
            const clusterNodes = groups.get(key)!;
            const clusterRadius = Math.sqrt(clusterNodes.length) * 30;
            
            clusterNodes.forEach((node, i) => {
                const localAngle = (i / clusterNodes.length) * 2 * Math.PI;
                node.x = clusterCenterX + Math.cos(localAngle) * clusterRadius;
                node.y = clusterCenterY + Math.sin(localAngle) * clusterRadius;
                node.vx = 0;
                node.vy = 0;
            });
        });
        
        // 中心节点
        const foolNode = nodes.find(n => n.type === 'fool');
        if (foolNode) {
            foolNode.x = width / 2;
            foolNode.y = height / 2;
        }
    };

    // 聚类模式下的颜色编码
    const getClusterColor = (node: Node): string => {
        if (clusterMode === 'none' || node.type === 'fool') return '#E60012';
        if (!node.data) return '#666';
        
        const colors = [
            '#E60012', // 红
            '#00A8E8', // 蓝
            '#00B159', // 绿
            '#FFB612', // 黄
            '#9B59B6', // 紫
            '#E67E22', // 橙
            '#1ABC9C', // 青
            '#E91E63', // 粉
        ];
        
        let key = '';
        if (clusterMode === 'year' && node.data.year) {
            key = node.data.year;
        } else if (clusterMode === 'tag' && node.data.tags.length > 0) {
            key = node.data.tags[0];
        } else if (clusterMode === 'folder' && node.data.folder_id) {
            key = `folder-${node.data.folder_id}`;
        }
        
        // 简单哈希函数
        const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    // 1. Initialize Nodes & Links (with filtering support)
    const { nodes, links } = useMemo(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 过滤论文
        let filteredPapers = papers;
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredPapers = filteredPapers.filter(p => 
                p.title.toLowerCase().includes(query) ||
                p.author.toLowerCase().includes(query) ||
                p.tags.some(t => t.toLowerCase().includes(query))
            );
        }
        
        if (selectedYear) {
            filteredPapers = filteredPapers.filter(p => p.year === selectedYear);
        }
        
        if (selectedTag) {
            filteredPapers = filteredPapers.filter(p => p.tags.includes(selectedTag));
        }
        
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
        filteredPapers.forEach((p, idx) => {
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
        filteredPapers.forEach(p => {
            initialLinks.push({ source: 'root-fool', target: `paper-${p.id}`, strength: 0.05 });
        });

        // Link Papers based on Shared Tags (Strong connection)
        for (let i = 0; i < filteredPapers.length; i++) {
            for (let j = i + 1; j < filteredPapers.length; j++) {
                const p1 = filteredPapers[i];
                const p2 = filteredPapers[j];
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
    }, [papers, searchQuery, selectedYear, selectedTag]);

    // Mutable state for physics simulation
    const simulationNodes = useRef(nodes);
    const [, setRenderTrigger] = useState(0);

    // 2. Physics Engine (Custom RAF Loop with QuadTree optimization)
    useEffect(() => {
        simulationNodes.current = nodes; // Update ref if props change
        
        // 应用初始布局
        if (viewMode === 'timeline') {
            applyTimelineLayout(simulationNodes.current);
        } else if (clusterMode !== 'none') {
            applyClusterLayout(simulationNodes.current, clusterMode);
        }
        
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
            const INTERACTION_RADIUS = 800;
            
            const currentNodes = simulationNodes.current;
            const now = Date.now() / 1000;

            // 跳过物理模拟如果是时间轴或聚类模式
            if (viewMode === 'timeline' || clusterMode !== 'none') {
                setRenderTrigger(prev => prev + 1);
                animationFrameId = requestAnimationFrame(tick);
                return;
            }

            // 构建四叉树（性能优化）
            const quadTree = buildQuadTree(currentNodes, 0, 0, width, height);

            // Reset Forces
            const forces = new Map<string, {x: number, y: number}>();
            currentNodes.forEach(n => forces.set(n.id, {x: 0, y: 0}));

            const addForce = (id: string, x: number, y: number) => {
                const f = forces.get(id);
                if (f) { f.x += x; f.y += y; }
            };

            // 1. REPULSION (使用四叉树加速)
            currentNodes.forEach(n1 => {
                // 使用四叉树查询附近节点
                const nearbyNodes = queryQuadTree(quadTree, n1.x, n1.y, INTERACTION_RADIUS);
                
                nearbyNodes.forEach(n2 => {
                    if (n1.id === n2.id) return;
                    
                    const dx = n1.x - n2.x;
                    const dy = n1.y - n2.y;
                    const distSq = dx*dx + dy*dy;
                    const dist = Math.sqrt(distSq) || 1;
                    
                    if (dist < INTERACTION_RADIUS) {
                        const force = REPULSION / (distSq + 100);
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        addForce(n1.id, fx, fy);
                    }
                });
            });

            // 2. SPRINGS (Links)
            links.forEach(link => {
                const source = currentNodes.find(n => n.id === link.source);
                const target = currentNodes.find(n => n.id === link.target);
                if (source && target) {
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    
                    // Hooke's Law: F = k * (current_dist - rest_length)
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
    }, [nodes, links, viewMode, clusterMode]);

    // 如果显示3D模式，渲染3D组件
    if (show3D) {
        return <MindPalace3D papers={papers} onClose={() => setShow3D(false)} onRead={onRead} playSfx={playSfx} />;
    }

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

            {/* --- CONTROL PANEL --- */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 pointer-events-auto">
                {/* 视图模式切换 */}
                <div className="bg-black/80 border-2 border-phantom-red p-2 flex gap-1">
                    <button
                        onClick={() => setViewMode('force')}
                        className={`px-4 py-2 font-p5 text-sm transition-colors ${
                            viewMode === 'force' 
                                ? 'bg-phantom-red text-white' 
                                : 'text-white/60 hover:text-white'
                        }`}
                        title="Force-Directed Layout"
                    >
                        <Grid3x3 size={18} className="inline mr-1" />
                        FORCE
                    </button>
                    <button
                        onClick={() => { setViewMode('timeline'); setClusterMode('none'); }}
                        className={`px-4 py-2 font-p5 text-sm transition-colors ${
                            viewMode === 'timeline' 
                                ? 'bg-phantom-red text-white' 
                                : 'text-white/60 hover:text-white'
                        }`}
                        title="Timeline View"
                    >
                        <Calendar size={18} className="inline mr-1" />
                        TIMELINE
                    </button>
                    <button
                        onClick={() => setShow3D(true)}
                        className="px-4 py-2 font-p5 text-sm text-white/60 hover:text-white transition-colors"
                        title="3D Sphere View"
                    >
                        <Box size={18} className="inline mr-1" />
                        3D VIEW
                    </button>
                </div>

                {/* 聚类模式 */}
                {viewMode === 'force' && (
                    <div className="bg-black/80 border-2 border-phantom-blue p-2 flex gap-1">
                        <button
                            onClick={() => setClusterMode('none')}
                            className={`px-3 py-2 font-p5 text-sm transition-colors ${
                                clusterMode === 'none' 
                                    ? 'bg-phantom-blue text-white' 
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            NONE
                        </button>
                        <button
                            onClick={() => setClusterMode('year')}
                            className={`px-3 py-2 font-p5 text-sm transition-colors ${
                                clusterMode === 'year' 
                                    ? 'bg-phantom-blue text-white' 
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            YEAR
                        </button>
                        <button
                            onClick={() => setClusterMode('tag')}
                            className={`px-3 py-2 font-p5 text-sm transition-colors ${
                                clusterMode === 'tag' 
                                    ? 'bg-phantom-blue text-white' 
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            TAG
                        </button>
                    </div>
                )}

                {/* 搜索框 */}
                <input
                    type="text"
                    placeholder="SEARCH..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/80 border-2 border-white/50 px-4 py-2 text-white font-mono text-sm focus:border-phantom-red outline-none w-64"
                />
            </div>

            {/* --- FILTER PANEL (Right Side) --- */}
            <div className="absolute top-24 right-8 z-50 pointer-events-auto max-h-[60vh] overflow-y-auto">
                {/* Year Filter */}
                {years.length > 0 && (
                    <div className="bg-black/80 border-2 border-phantom-red p-3 mb-2">
                        <div className="text-phantom-red font-p5 text-sm mb-2 flex items-center gap-2">
                            <Calendar size={16} />
                            YEAR FILTER
                        </div>
                        <div className="flex flex-wrap gap-1">
                            <button
                                onClick={() => setSelectedYear(null)}
                                className={`px-2 py-1 text-xs font-bold transition-colors ${
                                    selectedYear === null 
                                        ? 'bg-phantom-red text-white' 
                                        : 'bg-white/20 text-white hover:bg-white/40'
                                }`}
                            >
                                ALL
                            </button>
                            {years.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year === selectedYear ? null : year)}
                                    className={`px-2 py-1 text-xs font-bold transition-colors ${
                                        selectedYear === year 
                                            ? 'bg-phantom-red text-white' 
                                            : 'bg-white/20 text-white hover:bg-white/40'
                                    }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tag Filter */}
                {allTags.length > 0 && (
                    <div className="bg-black/80 border-2 border-phantom-blue p-3">
                        <div className="text-phantom-blue font-p5 text-sm mb-2 flex items-center gap-2">
                            <Filter size={16} />
                            TAG FILTER
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={`px-2 py-1 text-xs font-bold transition-colors ${
                                    selectedTag === null 
                                        ? 'bg-phantom-blue text-white' 
                                        : 'bg-white/20 text-white hover:bg-white/40'
                                }`}
                            >
                                ALL
                            </button>
                            {allTags.slice(0, 20).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                    className={`px-2 py-1 text-xs font-bold transition-colors ${
                                        selectedTag === tag 
                                            ? 'bg-phantom-blue text-white' 
                                            : 'bg-white/20 text-white hover:bg-white/40'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
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

                {/* Timeline Year Labels */}
                {viewMode === 'timeline' && (() => {
                    const timeGroups = new Map<string, Node[]>();
                    
                    // 收集时间分组
                    simulationNodes.current.forEach(n => {
                        if (n.type === 'paper' && n.data) {
                            let yearMonth = '';
                            
                            // 从文件名提取
                            if (n.data.fileUrl) {
                                const filename = n.data.fileUrl.split('/').pop() || '';
                                const dateInfo = extractDateFromFilename(filename);
                                if (dateInfo) {
                                    yearMonth = dateInfo.yearMonth;
                                }
                            }
                            
                            // 备用：使用year字段
                            if (!yearMonth && n.data.year) {
                                yearMonth = `${n.data.year}-00`;
                            }
                            
                            if (yearMonth) {
                                if (!timeGroups.has(yearMonth)) {
                                    timeGroups.set(yearMonth, []);
                                }
                                timeGroups.get(yearMonth)!.push(n);
                            }
                        }
                    });
                    
                    return Array.from(timeGroups.keys()).sort().map(yearMonth => {
                        const timeNodes = timeGroups.get(yearMonth)!;
                        const avgX = timeNodes.reduce((sum, n) => sum + n.x, 0) / timeNodes.length;
                        
                        // 格式化显示文本
                        const displayText = yearMonth.endsWith('-00') 
                            ? yearMonth.replace('-00', '') 
                            : formatMonth(yearMonth);
                        
                        return (
                            <g key={yearMonth}>
                                {/* 月份标签 */}
                                <text
                                    x={avgX}
                                    y={60}
                                    textAnchor="middle"
                                    fill="#E60012"
                                    fontSize="28"
                                    fontWeight="bold"
                                    fontFamily="'P5', sans-serif"
                                >
                                    {displayText}
                                </text>
                                
                                {/* 论文数量 */}
                                <text
                                    x={avgX}
                                    y={85}
                                    textAnchor="middle"
                                    fill="#fff"
                                    fontSize="12"
                                    opacity="0.6"
                                >
                                    {timeNodes.length} papers
                                </text>
                                
                                {/* 垂直分隔线 */}
                                <line
                                    x1={avgX}
                                    y1={100}
                                    x2={avgX}
                                    y2={window.innerHeight - 100}
                                    stroke="#E60012"
                                    strokeWidth="2"
                                    strokeOpacity="0.3"
                                    strokeDasharray="10,10"
                                />
                            </g>
                        );
                    });
                })()}
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
                        <div className={`relative w-32 h-52 bg-black border-2 rounded-lg overflow-hidden transition-all duration-300`}
                             style={{
                                 borderColor: node.type === 'fool' 
                                     ? '#00f' 
                                     : selectedNode?.id === node.id 
                                         ? getClusterColor(node)
                                         : clusterMode !== 'none'
                                             ? getClusterColor(node)
                                             : 'rgba(255,255,255,0.5)',
                                 boxShadow: node.type === 'fool'
                                     ? '0 0 20px #00f'
                                     : selectedNode?.id === node.id
                                         ? `0 0 30px ${getClusterColor(node)}`
                                         : clusterMode !== 'none'
                                             ? `0 0 10px ${getClusterColor(node)}`
                                             : 'none'
                             }}
                        >
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
