import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Brain, Zap, Clock } from 'lucide-react';

interface Metrics {
    status: string;
    ai_latency_ms: number;
    ocr_speed_ms: number;
    ai_state: string;
}

export default function SystemMonitor() {
    const [metrics, setMetrics] = useState<Metrics>({
        status: "OFFLINE",
        ai_latency_ms: 0,
        ocr_speed_ms: 0,
        ai_state: "IDLE"
    });
    const [ping, setPing] = useState(0);

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

        const interval = setInterval(fetchMetrics, 1000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        if (metrics.status === "OFFLINE") return "text-gray-500";
        if (metrics.ai_state === "THINKING") return "text-yellow-400";
        if (metrics.ai_state === "ERROR") return "text-red-600";
        return "text-green-500";
    };

    return (
        <motion.div 
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.2} // 稍微有点弹性，不用完全限制死
            whileDrag={{ scale: 1.1, cursor: "grabbing" }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed top-4 right-4 z-[1000] font-mono text-[10px] cursor-grab"
        >
            <div className="bg-black/80 backdrop-blur-sm border border-phantom-red/50 p-2 rounded-sm shadow-[2px_2px_0px_#E60012] w-48 pointer-events-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
                    <span className="text-phantom-red font-bold flex items-center gap-1">
                        <Activity size={10} /> SYS_MON
                    </span>
                    <span className={`font-bold ${getStatusColor()} animate-pulse`}>
                        {metrics.status === "OFFLINE" ? "DISCONNECTED" : "ONLINE"}
                    </span>
                </div>

                {/* Grid */}
                <div className="space-y-1">
                    {/* Ping */}
                    <div className="flex justify-between text-gray-400">
                        <span className="flex items-center gap-1"><Wifi size={10} /> PING</span>
                        <span className="text-white">{ping}ms</span>
                    </div>

                    {/* AI Latency */}
                    <div className="flex justify-between text-gray-400">
                        <span className="flex items-center gap-1"><Brain size={10} /> AI_LAT</span>
                        <span className={metrics.ai_latency_ms > 5000 ? "text-red-400" : "text-white"}>
                            {metrics.ai_latency_ms}ms
                        </span>
                    </div>

                    {/* OCR Speed */}
                    <div className="flex justify-between text-gray-400">
                        <span className="flex items-center gap-1"><Zap size={10} /> OCR_SPD</span>
                        <span className="text-white">{metrics.ocr_speed_ms}ms</span>
                    </div>
                    
                    {/* AI State */}
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
                </div>
            </div>
        </motion.div>
    );
}
