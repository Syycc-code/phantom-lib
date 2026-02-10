import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Download, ZoomIn, ZoomOut, Maximize2, Minimize2, Move, Search, X, Focus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MermaidDiagramProps {
    chart: string;
    onExport?: (svgData: string) => void;
}

interface NodeInfo {
    id: string;
    text: string;
    level: number;
}

export default function MermaidDiagram({ chart, onExport }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const svgWrapperRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [svgContent, setSvgContent] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [nodes, setNodes] = useState<NodeInfo[]>([]);
    const [showSearch, setShowSearch] = useState(false);


    // Extract nodes from mermaid chart for search functionality
    const extractNodes = useCallback((input: string): NodeInfo[] => {
        const lines = input.split('\n');
        const extractedNodes: NodeInfo[] = [];
        let nodeId = 0;
        
        // Check if it's a flowchart/graph (tree structure) or mindmap
        const isTreeStructure = input.includes('flowchart') || input.includes('graph');
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('flowchart') || trimmed.startsWith('graph') || trimmed.startsWith('mindmap')) return;
            if (trimmed.startsWith('classDef') || trimmed.startsWith('class ')) return;
            
            if (isTreeStructure) {
                // Parse flowchart format: A["Text"] --> B["Text"]
                // Extract node definitions and connections
                const nodeDefMatch = trimmed.match(/^(\w+)\s*\[\s*"([^"]+)"\s*\]/);
                const nodeRoundMatch = trimmed.match(/^(\w+)\s*\(\s*"?([^"\)]+)"?\s*\)/);
                const nodeStadiumMatch = trimmed.match(/^(\w+)\s*\(\[\s*"?([^\]]+)"?\s*\]\)/);
                const nodeSubroutineMatch = trimmed.match(/^(\w+)\s*\[\[\s*"?([^\]]+)"?\s*\]\]/);
                const nodeCircleMatch = trimmed.match(/^(\w+)\s*\(\(\s*"?([^\)]+)"?\s*\)\)/);
                const nodeCylinderMatch = trimmed.match(/^(\w+)\s*\[\(\s*"?([^\)]+)"?\s*\)\]/);
                
                let nodeId = '';
                let nodeText = '';
                let level = 0;
                
                if (nodeDefMatch) {
                    nodeId = nodeDefMatch[1];
                    nodeText = nodeDefMatch[2];
                } else if (nodeRoundMatch) {
                    nodeId = nodeRoundMatch[1];
                    nodeText = nodeRoundMatch[2];
                } else if (nodeStadiumMatch) {
                    nodeId = nodeStadiumMatch[1];
                    nodeText = nodeStadiumMatch[2];
                } else if (nodeSubroutineMatch) {
                    nodeId = nodeSubroutineMatch[1];
                    nodeText = nodeSubroutineMatch[2];
                } else if (nodeCircleMatch) {
                    nodeId = nodeCircleMatch[1];
                    nodeText = nodeCircleMatch[2];
                } else if (nodeCylinderMatch) {
                    nodeId = nodeCylinderMatch[1];
                    nodeText = nodeCylinderMatch[2];
                }
                
                if (nodeText && !extractedNodes.find(n => n.id === nodeId)) {
                    // Determine level based on node ID (A=0, B/C/D=1, A1/A2=2, etc.)
                    if (nodeId === 'A' || nodeId === 'Root' || nodeId === 'ROOT') {
                        level = 0;
                    } else if (nodeId.length === 1 && /[A-Z]/.test(nodeId)) {
                        level = 1;
                    } else {
                        level = 2;
                    }
                    
                    extractedNodes.push({
                        id: nodeId,
                        text: nodeText,
                        level
                    });
                }
            } else {
                // Original mindmap parsing logic
                const indentMatch = line.match(/^(\s*)/);
                const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0;
                
                const nodeText = trimmed
                    .replace(/^[\(\[\{]+|[\)\]\}]+$/g, '')
                    .replace(/^["']|["']$/g, '')
                    .trim();
                
                if (nodeText) {
                    extractedNodes.push({
                        id: `node-${nodeId++}`,
                        text: nodeText,
                        level: indentLevel
                    });
                }
            }
        });
        
        return extractedNodes;
    }, []);

    // Clean and fix Mermaid syntax issues
    const cleanMermaidChart = (input: string): string => {
        // Check if it's already a flowchart/tree structure
        const isFlowchart = input.trim().startsWith('flowchart') || input.trim().startsWith('graph');
        
        if (isFlowchart) {
            // For flowchart/tree structures, clean up but preserve structure
            return input
                .split('\n')
                .map((line, index) => {
                    const trimmed = line.trim();
                    if (!trimmed) return '';
                    
                    // First line - ensure proper declaration
                    if (index === 0) {
                        if (trimmed.startsWith('flowchart')) {
                            return trimmed.replace(/flowchart\s+/, 'flowchart ').trim();
                        }
                        if (trimmed.startsWith('graph')) {
                            return trimmed.replace(/graph\s+/, 'graph ').trim();
                        }
                        return trimmed;
                    }
                    
                    // Skip class definitions and styling (preserve as-is)
                    if (trimmed.startsWith('classDef') || trimmed.startsWith('class ') || 
                        trimmed.startsWith('linkStyle') || trimmed.startsWith('style ')) {
                        return trimmed;
                    }
                    
                    // Clean node definitions
                    if (trimmed.includes('-->') || trimmed.includes('---') || trimmed.includes('-.->')) {
                        // Connection line - clean extra spaces but preserve structure
                        return trimmed.replace(/\s+/g, ' ').trim();
                    }
                    
                    // Node definition - clean extra spaces inside quotes
                    if (trimmed.includes('[') || trimmed.includes('(') || trimmed.includes('{')) {
                        return trimmed.replace(/\s+/g, ' ').trim();
                    }
                    
                    return trimmed;
                })
                .filter(line => line.length > 0)
                .join('\n');
        }
        
        // Original mindmap cleaning logic
        return input
            .split('\n')
            .map((line, index) => {
                // Skip empty lines
                if (!line.trim()) return '';
                
                // First line should be "mindmap" or other diagram type
                if (index === 0) {
                    const trimmed = line.trim();
                    if (trimmed === 'mindmap' || trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) {
                        return trimmed;
                    }
                    // If first line doesn't contain diagram type, add it
                    if (!input.includes('mindmap') && !input.includes('graph')) {
                        return 'mindmap\n' + line;
                    }
                    return line;
                }
                
                // Calculate proper indentation (only whitespace at beginning)
                const match = line.match(/^(\s*)(.*)$/);
                if (!match) return line;
                
                const [, whitespace, content] = match;
                
                // Content should not have trailing spaces or internal tab/space lists
                // Remove any "SPACELIST" patterns - multiple spaces that look like lists
                const cleanContent = content
                    .replace(/\s{2,}/g, ' ')           // Replace multiple spaces with single space
                    .replace(/\t+/g, ' ')            // Replace tabs with space
                    .trim();
                
                // Convert indentation to proper format (2 spaces per level for mindmap)
                // Count original indentation level
                const indentLevel = Math.floor(whitespace.length / 2);
                const properIndent = '  '.repeat(Math.max(0, indentLevel));
                
                return properIndent + cleanContent;
            })
            .filter(line => line.length > 0)
            .join('\n');
    };

    useEffect(() => {
        // Initialize Mermaid with P5 dark theme optimized for tree structures
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#E60012',
                primaryTextColor: '#fff',
                primaryBorderColor: '#E60012',
                lineColor: '#FCEC0C',
                secondaryColor: '#1a1a1a',
                tertiaryColor: '#0f0f0f',
                background: '#0a0a0a',
                mainBkg: '#E60012',
                secondBkg: '#1a1a1a',
                textColor: '#ffffff',
                fontSize: isFullscreen ? '16px' : '13px',
                fontFamily: 'Inter, sans-serif',
                // Flowchart specific colors
                nodeBorder: '#E60012',
                clusterBkg: '#1a1a1a',
                clusterBorder: '#E60012',
                titleColor: '#FCEC0C',
                edgeLabelBackground: '#0a0a0a',
                nodeTextColor: '#ffffff'
            },
            flowchart: {
                useMaxWidth: false,
                htmlLabels: true,
                curve: 'basis',
                padding: 25,
                nodeSpacing: 60,
                rankSpacing: 100,
                diagramPadding: 30,
                wrappingWidth: 200
            },
            mindmap: {
                useMaxWidth: false,
                padding: 20
            }
        });

        renderDiagram();
    }, [chart, isFullscreen]);

    const renderDiagram = async () => {
        if (!containerRef.current) return;

        try {
            // Clean the chart syntax before rendering
            const cleanedChart = cleanMermaidChart(chart);
            console.log('[MermaidDiagram] Cleaned chart:', cleanedChart);
            
            // Extract nodes for search
            const extractedNodes = extractNodes(cleanedChart);
            setNodes(extractedNodes);
            
            // Generate unique ID for this diagram
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            
            // Render the diagram
            const { svg } = await mermaid.render(id, cleanedChart);
            
            // Add interactivity to SVG
            const enhancedSvg = enhanceSvgWithInteractivity(svg);
            
            // Set the SVG content
            containerRef.current.innerHTML = enhancedSvg;
            setSvgContent(enhancedSvg);
            
            // Apply zoom and position
            const svgElement = containerRef.current.querySelector('svg');
            if (svgElement) {
                svgElement.style.transform = `translate(${position.x}px, ${position.y}px) scale(${zoom})`;
                svgElement.style.transformOrigin = 'center center';
                svgElement.style.transition = isDragging ? 'none' : 'transform 0.2s ease';
                
                // Add cursor styles
                svgElement.style.cursor = isDragging ? 'grabbing' : 'grab';
            }
        } catch (error) {
            console.error('Mermaid rendering failed:', error);
            const cleanedChart = cleanMermaidChart(chart);
            containerRef.current.innerHTML = `<div class="text-red-400 p-4 border border-red-400/30 bg-red-900/20">
                <p class="font-bold mb-2">Failed to render diagram</p>
                <p class="text-sm text-gray-300 mb-2">Error: ${error}</p>
                <details>
                    <summary class="cursor-pointer text-yellow-400 text-sm mb-2">View cleaned code (for debugging)</summary>
                    <pre class="mt-2 text-xs bg-black/50 p-2 overflow-x-auto text-green-400">${cleanedChart}</pre>
                </details>
                <details>
                    <summary class="cursor-pointer text-gray-400 text-sm">View original code</summary>
                    <pre class="mt-2 text-xs bg-black/50 p-2 overflow-x-auto">${chart}</pre>
                </details>
            </div>`;
        }
    };

    // Enhance SVG with P5-style interactivity
    const enhanceSvgWithInteractivity = (svg: string): string => {
        // Check if it's a flowchart tree structure
        const isFlowchart = svg.includes('flowchart') || svg.includes('graph TD');
        
        // Add custom styles for node interactions
        const styleInject = `
            <style>
                .node {
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-box: fill-box;
                    transform-origin: center;
                }
                .node:hover {
                    filter: drop-shadow(0 0 15px rgba(230, 0, 18, 0.9)) brightness(1.15);
                }
                .node:hover rect,
                .node:hover circle,
                .node:hover ellipse,
                .node:hover polygon,
                .node:hover path {
                    stroke: #FCEC0C !important;
                    stroke-width: 3px !important;
                }
                .node.selected {
                    filter: drop-shadow(0 0 20px rgba(252, 236, 12, 1)) brightness(1.2);
                    animation: node-pulse 1.5s ease-in-out infinite;
                }
                .node.selected rect,
                .node.selected circle,
                .node.selected ellipse,
                .node.selected polygon,
                .node.selected path {
                    stroke: #FCEC0C !important;
                    stroke-width: 4px !important;
                }
                /* Flowchart specific styling */
                .edgePath .path {
                    stroke: #FCEC0C !important;
                    stroke-width: 2.5px !important;
                    filter: drop-shadow(0 0 3px rgba(252, 236, 12, 0.6));
                    transition: all 0.3s ease;
                }
                .edgePath:hover .path {
                    stroke-width: 4px !important;
                    filter: drop-shadow(0 0 8px rgba(252, 236, 12, 1));
                }
                .edgeLabel {
                    background-color: #0a0a0a !important;
                    color: #FCEC0C !important;
                    font-size: 12px;
                    font-weight: 600;
                }
                /* Root node specific styling */
                .node[id*="flowchart-A-"] rect,
                .node:first-child rect {
                    fill: #E60012 !important;
                    stroke: #FCEC0C !important;
                    stroke-width: 3px !important;
                    filter: drop-shadow(0 0 10px rgba(230, 0, 18, 0.6));
                }
                /* Level 1 nodes */
                .node[id*="flowchart-B-"] rect,
                .node[id*="flowchart-C-"] rect,
                .node[id*="flowchart-D-"] rect,
                .node[id*="flowchart-E-"] rect {
                    fill: #1a1a1a !important;
                    stroke: #E60012 !important;
                    stroke-width: 2px !important;
                }
                /* Level 2 nodes */
                .node[id*="flowchart-A"] rect,
                .node[id*="flowchart-B"] rect,
                .node[id*="flowchart-C"] rect,
                .node[id*="flowchart-D"] rect {
                    fill: #252525 !important;
                    stroke: #FCEC0C !important;
                    stroke-width: 1.5px !important;
                }
                text {
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    pointer-events: none;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                }
                @keyframes pulse-glow {
                    0%, 100% { filter: drop-shadow(0 0 5px rgba(230, 0, 18, 0.4)); }
                    50% { filter: drop-shadow(0 0 15px rgba(230, 0, 18, 0.8)); }
                }
                @keyframes node-pulse {
                    0%, 100% { 
                        filter: drop-shadow(0 0 10px rgba(252, 236, 12, 0.6));
                    }
                    50% { 
                        filter: drop-shadow(0 0 20px rgba(252, 236, 12, 1));
                    }
                }
                .pulse-animation {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
            </style>
        `;
        
        // Inject styles before closing </svg> tag
        return svg.replace('</svg>', `${styleInject}</svg>`);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.2, 5));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.2, 0.3));
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.3, Math.min(5, prev + delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { // Left click only
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleFullscreenToggle = () => {
        setIsFullscreen(!isFullscreen);
        // Reset position and zoom when toggling fullscreen
        setPosition({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setSelectedNode(null);
            // Clear all highlights
            const svgElement = containerRef.current?.querySelector('svg');
            if (svgElement) {
                const allNodes = svgElement.querySelectorAll('.node');
                allNodes.forEach(node => {
                    node.classList.remove('selected');
                    node.classList.remove('pulse-animation');
                });
            }
            return;
        }
        
        const matchedNode = nodes.find(node => 
            node.text.toLowerCase().includes(query.toLowerCase())
        );
        
        if (matchedNode) {
            setSelectedNode(matchedNode.id);
            // Highlight the node in SVG - match by node text content
            const svgElement = containerRef.current?.querySelector('svg');
            if (svgElement) {
                const allNodes = svgElement.querySelectorAll('.node');
                allNodes.forEach((node) => {
                    const nodeText = node.textContent?.toLowerCase() || '';
                    if (nodeText.includes(matchedNode.text.toLowerCase())) {
                        node.classList.add('selected');
                        node.classList.add('pulse-animation');
                        // Scroll node into view if needed
                        node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    } else {
                        node.classList.remove('selected');
                        node.classList.remove('pulse-animation');
                    }
                });
            }
        }
    };

    const handleExportSVG = () => {
        if (svgContent && onExport) {
            onExport(svgContent);
        } else {
            // Fallback: download directly
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `diagram_${Date.now()}.svg`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleExportPNG = () => {
        const svgElement = containerRef.current?.querySelector('svg');
        if (!svgElement) return;

        // Create canvas and convert SVG to PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width * 2; // 2x for better quality
            canvas.height = img.height * 2;
            ctx?.scale(2, 2);
            ctx?.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `diagram_${Date.now()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            });
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    useEffect(() => {
        const svgElement = containerRef.current?.querySelector('svg');
        if (svgElement) {
            svgElement.style.transform = `translate(${position.x}px, ${position.y}px) scale(${zoom})`;
            svgElement.style.transition = isDragging ? 'none' : 'transform 0.2s ease';
            svgElement.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
    }, [zoom, position, isDragging]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isFullscreen) return;
            
            switch(e.key) {
                case 'Escape':
                    setIsFullscreen(false);
                    break;
                case '+':
                case '=':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomIn();
                    }
                    break;
                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomOut();
                    }
                    break;
                case '0':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleReset();
                    }
                    break;
                case 'f':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        setShowSearch(true);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    return (
        <div 
            ref={wrapperRef}
            className={`relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}
            style={{
                background: isFullscreen 
                    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0f0f 100%)'
                    : '#0a0a0a'
            }}
        >
            {/* P5 Style Animated Background (Fullscreen only) */}
            {isFullscreen && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Grid pattern */}
                    <div 
                        className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(230, 0, 18, 0.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(230, 0, 18, 0.3) 1px, transparent 1px)
                            `,
                            backgroundSize: '50px 50px'
                        }}
                    />
                    {/* Animated corner decorations */}
                    <motion.div 
                        className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-phantom-red/40"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div 
                        className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-phantom-red/40"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.div 
                        className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-phantom-red/40"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    />
                    <motion.div 
                        className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-phantom-red/40"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                    />
                </div>
            )}

            {/* Search Bar (Fullscreen only) */}
            <AnimatePresence>
                {isFullscreen && showSearch && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"
                    >
                        <div className="flex items-center gap-2 bg-gray-900/95 border-2 border-phantom-red/60 px-4 py-2 shadow-[0_0_20px_rgba(230,0,18,0.3)]">
                            <Search size={18} className="text-phantom-red" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search nodes... (Ctrl+F)"
                                className="bg-transparent border-none outline-none text-white w-64 font-mono"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery('');
                                    setSelectedNode(null);
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        {searchQuery && (
                            <div className="mt-2 text-xs text-center text-gray-400">
                                {nodes.filter(n => n.text.toLowerCase().includes(searchQuery.toLowerCase())).length} matches found
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls Toolbar */}
            <motion.div 
                className={`absolute z-20 flex gap-1 ${isFullscreen ? 'top-4 right-4' : 'top-2 right-2'}`}
                initial={false}
                animate={{ scale: isFullscreen ? 1.1 : 1 }}
            >
                {/* Search button (fullscreen only) */}
                {isFullscreen && (
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`p-2 border transition-all ${showSearch ? 'bg-phantom-red border-phantom-red' : 'bg-gray-800 hover:bg-gray-700 border-gray-700'}`}
                        title="Search (Ctrl+F)"
                    >
                        <Search size={isFullscreen ? 18 : 16} className={showSearch ? 'text-white' : 'text-gray-300'} />
                    </button>
                )}

                <button
                    onClick={handleZoomOut}
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all hover:border-phantom-red/50"
                    title="Zoom Out (-)"
                >
                    <ZoomOut size={isFullscreen ? 18 : 16} className="text-gray-300" />
                </button>
                
                <button
                    onClick={handleZoomIn}
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all hover:border-phantom-red/50"
                    title="Zoom In (+)"
                >
                    <ZoomIn size={isFullscreen ? 18 : 16} className="text-gray-300" />
                </button>

                <button
                    onClick={handleReset}
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all hover:border-phantom-red/50"
                    title="Reset View (Ctrl+0)"
                >
                    <Focus size={isFullscreen ? 18 : 16} className="text-gray-300" />
                </button>
                
                <button
                    onClick={handleFullscreenToggle}
                    className={`p-2 border transition-all ${isFullscreen ? 'bg-phantom-red border-phantom-red' : 'bg-gray-800 hover:bg-gray-700 border-gray-700'}`}
                    title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen"}
                >
                    {isFullscreen ? (
                        <Minimize2 size={isFullscreen ? 18 : 16} className="text-white" />
                    ) : (
                        <Maximize2 size={isFullscreen ? 18 : 16} className="text-gray-300" />
                    )}
                </button>
                
                <div className="w-px bg-gray-700 mx-1" />
                
                <button
                    onClick={handleExportSVG}
                    className="p-2 bg-phantom-red/80 hover:bg-phantom-red border border-gray-700 transition-all"
                    title="Export SVG"
                >
                    <Download size={isFullscreen ? 18 : 16} className="text-white" />
                </button>
                
                <button
                    onClick={handleExportPNG}
                    className="px-3 py-2 bg-phantom-red/80 hover:bg-phantom-red border border-gray-700 transition-all text-white text-xs font-bold"
                    title="Export PNG"
                >
                    PNG
                </button>
            </motion.div>

            {/* Drag Hint (Fullscreen only) */}
            {isFullscreen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDragging ? 0 : 0.6 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                >
                    <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-900/80 px-4 py-2 border border-gray-700">
                        <Move size={16} />
                        <span>Click and drag to pan • Scroll to zoom</span>
                    </div>
                </motion.div>
            )}

            {/* Diagram Container */}
            <div
                ref={svgWrapperRef}
                className={`overflow-hidden bg-transparent flex items-center justify-center select-none ${isFullscreen ? 'h-screen w-screen' : ''}`}
                style={{ 
                    height: isFullscreen ? '100vh' : '600px',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    ref={containerRef}
                    className="flex items-center justify-center"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                />
            </div>

            {/* Bottom Info Panel (Fullscreen only) */}
            {isFullscreen && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6"
                >
                    <div className="flex items-center justify-between">
                        {/* Zoom indicator */}
                        <div className="flex items-center gap-4">
                            <div className="bg-gray-800/90 px-4 py-2 border border-gray-700">
                                <span className="text-phantom-red font-bold">{Math.round(zoom * 100)}%</span>
                                <span className="text-gray-400 text-sm ml-2">Zoom</span>
                            </div>
                            <div className="bg-gray-800/90 px-4 py-2 border border-gray-700">
                                <span className="text-phantom-yellow font-bold">{nodes.length}</span>
                                <span className="text-gray-400 text-sm ml-2">Nodes</span>
                            </div>
                        </div>

                        {/* Keyboard shortcuts hint */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <kbd className="bg-gray-800 px-2 py-1 border border-gray-700">Ctrl</kbd>
                                <span>+</span>
                                <kbd className="bg-gray-800 px-2 py-1 border border-gray-700">+/-</kbd>
                                <span className="ml-1">Zoom</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="bg-gray-800 px-2 py-1 border border-gray-700">Ctrl</kbd>
                                <span>+</span>
                                <kbd className="bg-gray-800 px-2 py-1 border border-gray-700">0</kbd>
                                <span className="ml-1">Reset</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="bg-gray-800 px-2 py-1 border border-gray-700">Esc</kbd>
                                <span className="ml-1">Exit</span>
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Non-fullscreen zoom indicator */}
            {!isFullscreen && (
                <div className="absolute bottom-2 left-2 bg-gray-800/90 px-3 py-1 text-xs text-gray-300 border border-gray-700">
                    Zoom: {Math.round(zoom * 100)}%
                </div>
            )}

            {/* P5 Style Corner Accents (Fullscreen only) */}
            {isFullscreen && (
                <>
                    <div className="absolute top-0 left-0 w-2 h-16 bg-phantom-red" />
                    <div className="absolute top-0 left-0 w-16 h-2 bg-phantom-red" />
                    <div className="absolute top-0 right-0 w-2 h-16 bg-phantom-red" />
                    <div className="absolute top-0 right-0 w-16 h-2 bg-phantom-red" />
                    <div className="absolute bottom-0 left-0 w-2 h-16 bg-phantom-red" />
                    <div className="absolute bottom-0 left-0 w-16 h-2 bg-phantom-red" />
                    <div className="absolute bottom-0 right-0 w-2 h-16 bg-phantom-red" />
                    <div className="absolute bottom-0 right-0 w-16 h-2 bg-phantom-red" />
                </>
            )}
        </div>
    );
}
