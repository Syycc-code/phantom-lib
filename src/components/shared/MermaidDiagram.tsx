import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface MermaidDiagramProps {
    chart: string;
    onExport?: (svgData: string) => void;
}

export default function MermaidDiagram({ chart, onExport }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [svgContent, setSvgContent] = useState('');

    useEffect(() => {
        // Initialize Mermaid with dark theme
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#E60012',
                primaryTextColor: '#fff',
                primaryBorderColor: '#E60012',
                lineColor: '#FCEC0C',
                secondaryColor: '#333',
                tertiaryColor: '#222',
                background: '#0a0a0a',
                mainBkg: '#1a1a1a',
                secondBkg: '#2a2a2a',
                textColor: '#ffffff',
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif'
            },
            flowchart: {
                useMaxWidth: false,
                htmlLabels: true,
                curve: 'basis'
            },
            mindmap: {
                useMaxWidth: false
            }
        });

        renderDiagram();
    }, [chart]);

    const renderDiagram = async () => {
        if (!containerRef.current) return;

        try {
            // Generate unique ID for this diagram
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            
            // Render the diagram
            const { svg } = await mermaid.render(id, chart);
            
            // Set the SVG content
            containerRef.current.innerHTML = svg;
            setSvgContent(svg);
            
            // Apply zoom
            const svgElement = containerRef.current.querySelector('svg');
            if (svgElement) {
                svgElement.style.transform = `scale(${zoom})`;
                svgElement.style.transformOrigin = 'top left';
                svgElement.style.transition = 'transform 0.2s ease';
            }
        } catch (error) {
            console.error('Mermaid rendering failed:', error);
            containerRef.current.innerHTML = `<div class="text-red-400 p-4 border border-red-400/30 bg-red-900/20">
                <p class="font-bold mb-2">Failed to render diagram</p>
                <p class="text-sm text-gray-300">Error: ${error}</p>
                <pre class="mt-2 text-xs bg-black/50 p-2 overflow-x-auto">${chart}</pre>
            </div>`;
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.2, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.2, 0.5));
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
            svgElement.style.transform = `scale(${zoom})`;
        }
    }, [zoom]);

    return (
        <div className={`relative ${isFullscreen ? 'fixed inset-0 z-[9999] bg-[#0a0a0a]' : ''}`}>
            {/* Controls */}
            <div className="absolute top-2 right-2 z-10 flex gap-2">
                <button
                    onClick={handleZoomOut}
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut size={16} className="text-gray-300" />
                </button>
                <button
                    onClick={handleZoomIn}
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn size={16} className="text-gray-300" />
                </button>
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                    title="Toggle Fullscreen"
                >
                    <Maximize2 size={16} className="text-gray-300" />
                </button>
                <button
                    onClick={handleExportSVG}
                    className="p-2 bg-phantom-red/80 hover:bg-phantom-red border border-gray-700 transition-colors"
                    title="Export SVG"
                >
                    <Download size={16} className="text-white" />
                </button>
                <button
                    onClick={handleExportPNG}
                    className="p-2 bg-phantom-red/80 hover:bg-phantom-red border border-gray-700 transition-colors"
                    title="Export PNG"
                >
                    PNG
                </button>
            </div>

            {/* Diagram Container */}
            <div
                ref={containerRef}
                className="overflow-auto p-8 bg-[#0a0a0a] min-h-[400px] flex items-center justify-center"
                style={{ maxHeight: isFullscreen ? '100vh' : '600px' }}
            />

            {/* Zoom indicator */}
            <div className="absolute bottom-2 left-2 bg-gray-800/90 px-3 py-1 text-xs text-gray-300 border border-gray-700">
                Zoom: {Math.round(zoom * 100)}%
            </div>
        </div>
    );
}
