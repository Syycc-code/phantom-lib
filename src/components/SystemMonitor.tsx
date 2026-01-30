import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Brain, Zap, Clock, Disc, ShieldAlert, Power } from 'lucide-react';

interface Metrics {
    status: string;
    ai_latency_ms: number;
    ocr_speed_ms: number;
    ai_state: string;
}

interface SystemMonitorProps {
    variant?: string; // 'default', 'visualizer', 'radar'
}

export default function SystemMonitor({ variant = 'default' }: SystemMonitorProps) {
    const [metrics, setMetrics] = useState<Metrics>({
        status: "OFFLINE",
        ai_latency_ms: 0,
        ocr_speed_ms: 0,
        ai_state: "IDLE"
    });
    const [ping, setPing] = useState(0);
    
    const handleShutdown = async () => {
        if (!confirm("SHUT DOWN SYSTEM? (This will stop the backend)")) return;
        try {
            await fetch('/api/monitor/shutdown', { method: 'POST' });
            alert("SYSTEM OFFLINE. You can close this window.");
            window.close(); // Only works if opened by script
        } catch (e) {
            console.error("Shutdown failed", e);
        }
    };
    
    // Visualizer State
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    
    useEffect(() => {
        const fetchMetrics = async () => {
            const start = performance.now();
            try {
                const res = await fetch('/api/monitor');
                const end = performance.now();
                setPing(Math.round(end - start));
                
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                } else {
                    setMetrics(prev => ({ ...prev, status: "ERROR" }));
                }
            } catch (e) {
                setMetrics(prev => ({ ...prev, status: "OFFLINE" }));
            }
        };

        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
    }, []);

    // AUDIO VISUALIZER LOGIC
    useEffect(() => {
        if (variant !== 'visualizer' || !canvasRef.current) return;

        // Mock visualizer since we don't have BGM playing yet
        // In a real app, connect this to the audio element
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId: number;

        const draw = () => {
            if (!ctx) return;
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            
            const bars = 20;
            const barW = w / bars;
            
            ctx.fillStyle = '#E60012'; // Phantom Red
            
            for(let i=0; i<bars; i++) {
                // Generate pseudo-random heights based on time to simulate audio
                const height = Math.random() * h * 0.8;
                ctx.fillRect(i * barW, h - height, barW - 2, height);
            }
            
            animationId = requestAnimationFrame(draw);
        };
        
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [variant]);

    const getStatusColor = () => {
        if (metrics.status === "OFFLINE") return "text-gray-500";
        if (metrics.ai_state === "THINKING") return "text-yellow-400";
        if (metrics.ai_state === "ERROR") return "text-red-600";
        return "text-green-500";
    };

    return (
        <motion.div 
            drag
            dragMomentum={false}
            dragConstraints={{ top: -16, left: -150, right: 0, bottom: typeof window !== 'undefined' ? window.innerHeight - 100 : 500 }}
            dragElastic={0.1}
            whileDrag={{ scale: 1.1, cursor: "grabbing" }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed top-4 right-4 z-[1000] font-mono text-[10px] cursor-grab"
        >
            <div className="bg-phantom-black/80 backdrop-blur-sm border border-phantom-red/50 p-2 rounded-sm shadow-[2px_2px_0px_#E60012] w-48 pointer-events-auto text-[var(--color-text)]">
                {/* Header */}
                <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
                    <span className="text-phantom-red font-bold flex items-center gap-1">
                        {variant === 'radar' ? <ShieldAlert size={10} /> : <Activity size={10} />} 
                        {variant === 'radar' ? 'THREAT_LVL' : 'SYS_MON'}
                    </span>
                    <span className={`font-bold ${getStatusColor()} animate-pulse`}>
                        {metrics.status === "OFFLINE" ? "DISCONNECTED" : "ONLINE"}
                    </span>
                </div>

                {/* VISUALIZER VARIANT */}
                {variant === 'visualizer' && (
                    <div className="mb-2 border-b border-gray-700 pb-2 relative h-12 w-full bg-black/50">
                        <canvas ref={canvasRef} width={180} height={48} className="w-full h-full opacity-80" />
                        <div className="absolute bottom-0 left-0 text-[8px] text-phantom-yellow flex items-center gap-1">
                            <Disc size={8} className="animate-spin-slow" /> AUDIO SYNC
                        </div>
                    </div>
                )}

                {/* RADAR VARIANT */}
                {variant === 'radar' && (
                    <div className="mb-2 border-b border-gray-700 pb-2 flex justify-center relative h-16 bg-black/50 overflow-hidden">
                        <div className="absolute inset-0 border border-green-900/50 rounded-full scale-[2]" />
                        <div className="absolute inset-0 border border-green-900/50 rounded-full scale-[1.5]" />
                        {/* Scanning Line */}
                        <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,255,0,0.2)_360deg)] animate-spin rounded-full absolute inset-0" style={{ animationDuration: '2s' }} />
                        {/* Blip */}
                        {ping > 100 && (
                            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        )}
                        <div className="absolute bottom-1 right-1 text-[8px] text-green-500">SECURE</div>
                    </div>
                )}

                {/* Default Grid */}
                <div className="space-y-1">
                    <div className="flex justify-between text-gray-400">
                        <span className="flex items-center gap-1"><Wifi size={10} /> PING</span>
                        <span className="text-current font-bold">{ping}ms</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span className="flex items-center gap-1"><Brain size={10} /> AI_LAT</span>
                        <span className={metrics.ai_latency_ms > 5000 ? "text-red-400" : "text-current font-bold"}>
                            {metrics.ai_latency_ms}ms
                        </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span className="flex items-center gap-1"><Zap size={10} /> OCR_SPD</span>
                        <span className="text-current font-bold">{metrics.ocr_speed_ms}ms</span>
                    </div>
                    
                    <div className="mt-2 pt-1 border-t border-gray-700">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1"><Clock size={10} /> STATE</span>
                            <span className={`font-bold bg-white text-black px-1 transform -skew-x-12 ${
                                metrics.ai_state === 'THINKING' ? 'bg-yellow-400' : 
                                metrics.ai_state === 'ERROR' ? 'bg-red-500 text-white' : 'bg-white'
                            }`}>
                                {metrics.ai_state}
                            </span>
                        </div>
                    </div>
                    
                    {/* Shutdown Button */}
                    <button 
                        onClick={handleShutdown}
                        className="w-full mt-2 bg-red-900/50 hover:bg-red-600 text-white text-[10px] font-bold py-1 border border-red-500 flex items-center justify-center gap-1 transition-colors"
                    >
                        <Power size={10} /> DISCONNECT
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
