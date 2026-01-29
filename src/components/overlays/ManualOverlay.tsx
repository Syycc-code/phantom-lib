import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Book, Eye, BrainCircuit, ShoppingBag, Terminal, Command } from 'lucide-react';

interface ManualOverlayProps {
    onClose: () => void;
    playSfx: (type: 'click' | 'hover' | 'cancel' | 'confirm') => void;
}

const SECTIONS = [
    {
        id: 'basics',
        title: 'INFILTRATION',
        icon: Book,
        color: '#E60012',
        content: (
            <div className="space-y-6">
                <h3 className="text-3xl font-p5 text-phantom-red mb-4">BASIC OPERATIONS</h3>
                <div className="bg-black/50 p-6 border-l-4 border-phantom-red transform -skew-x-2">
                    <h4 className="text-xl font-bold text-white mb-2">STEAL INTEL (UPLOAD)</h4>
                    <p className="text-gray-300 font-mono">
                        Drag & Drop PDFs directly into the Palace (Middle Pane), or click the "+" button to infiltrate new documents.
                        <br/>
                        <span className="text-phantom-red">Supported:</span> PDF Files, Arxiv URLs.
                    </p>
                </div>
                
                <div className="bg-black/50 p-6 border-l-4 border-white transform -skew-x-2">
                    <h4 className="text-xl font-bold text-white mb-2">DECODE (READING)</h4>
                    <p className="text-gray-300 font-mono">
                        Click any paper to open the <span className="text-white font-bold">COGNITIVE READER</span>.
                        <br/>
                        Highlight text to translate or take notes instantly.
                    </p>
                </div>

                <div className="bg-black/50 p-6 border-l-4 border-phantom-red transform -skew-x-2">
                    <h4 className="text-xl font-bold text-white mb-2">MISSIONS (FOLDERS)</h4>
                    <p className="text-gray-300 font-mono">
                        Organize your heist targets into Missions using the Sidebar.
                        <br/>
                        Drag papers between folders to reorganize your evidence.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'ai',
        title: 'THIRD EYE',
        icon: Eye,
        color: '#00FF41',
        content: (
            <div className="space-y-6">
                <h3 className="text-3xl font-p5 text-[#00FF41] mb-4">COGNITIVE ANALYSIS</h3>
                <div className="bg-black/50 p-6 border-l-4 border-[#00FF41] transform -skew-x-2">
                    <h4 className="text-xl font-bold text-white mb-2">ACTIVATE THIRD EYE</h4>
                    <p className="text-gray-300 font-mono">
                        When reading a paper, click the <span className="text-[#00FF41]">EYE ICON</span> to trigger DeepSeek AI analysis.
                        <br/>
                        The system will reveal:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm text-gray-400 font-mono">
                        <li><span className="text-red-400">SHADOW (Problem)</span>: What the paper tries to solve.</li>
                        <li><span className="text-blue-400">PERSONA (Solution)</span>: The proposed method.</li>
                        <li><span className="text-yellow-400">WEAKNESS (Flaws)</span>: Limitations and future work.</li>
                    </ul>
                </div>

                <div className="bg-black/50 p-6 border-l-4 border-white transform -skew-x-2">
                    <h4 className="text-xl font-bold text-white mb-2">PHANTOM IM (CHAT)</h4>
                    <p className="text-gray-300 font-mono">
                        Click the <span className="text-white">PHONE ICON</span> (bottom right) to chat with "Navi".
                        <br/>
                        Ask questions about your entire library. The system uses RAG to find answers across all your papers.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'mind',
        title: 'MIND PALACE',
        icon: BrainCircuit,
        color: '#FFE600',
        content: (
            <div className="space-y-6">
                <h3 className="text-3xl font-p5 text-phantom-yellow mb-4">KNOWLEDGE NETWORK</h3>
                <div className="bg-black/50 p-6 border-l-4 border-phantom-yellow transform -skew-x-2">
                    <h4 className="text-xl font-bold text-white mb-2">THE TAROT WEB</h4>
                    <p className="text-gray-300 font-mono">
                        Press <span className="text-phantom-yellow font-bold">[TAB]</span> to enter the Mind Palace.
                        <br/>
                        Visualize your papers as Tarot Cards connected by invisible threads of similarity.
                    </p>
                </div>
                
                <div className="bg-black/50 p-6 border-l-4 border-white transform -skew-x-2">
                    <h4 className="text-xl font-bold text-white mb-2">AUTO-LINKING</h4>
                    <p className="text-gray-300 font-mono">
                        Papers with similar tags or content will form <span className="text-red-500 font-bold">STRONG BONDS</span> (Red Lines).
                        <br/>
                        Use this to discover hidden connections between research topics.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'system',
        title: 'SYSTEM',
        icon: ShoppingBag,
        color: '#D4AF37',
        content: (
            <div className="space-y-6">
                <h3 className="text-3xl font-p5 text-[#D4AF37] mb-4">PROGRESSION</h3>
                <div className="bg-black/50 p-6 border-l-4 border-[#D4AF37] transform -skew-x-2">
                    <h4 className="text-xl font-bold text-white mb-2">PHANTOM STATS</h4>
                    <p className="text-gray-300 font-mono">
                        Your actions increase your stats:
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-sm">
                        <div className="text-phantom-yellow">★ KNOWLEDGE: Reading</div>
                        <div className="text-phantom-red">★ GUTS: Deleting/Risky Acts</div>
                        <div className="text-blue-400">★ PROFICIENCY: Uploading</div>
                        <div className="text-pink-400">★ CHARM: Customization</div>
                    </div>
                </div>

                <div className="bg-black/50 p-6 border-l-4 border-white transform -skew-x-2">
                    <h4 className="text-xl font-bold text-white mb-2">BLACK MARKET</h4>
                    <p className="text-gray-300 font-mono">
                        Spend your stats to buy new UI Themes, Visualizers, and Skins in the Shop.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'shortcuts',
        title: 'CONTROLS',
        icon: Command,
        color: '#FFFFFF',
        content: (
            <div className="space-y-6">
                <h3 className="text-3xl font-p5 text-white mb-4">SHORTCUTS</h3>
                <div className="grid grid-cols-1 gap-4">
                    {[
                        { key: 'TAB', action: 'Toggle Mind Palace' },
                        { key: 'ESC', action: 'Close Overlays / Clear Selection' },
                        { key: 'DEL', action: 'Delete Selected Paper' },
                        { key: 'CTRL + Click', action: 'Multi-Select Papers' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-900 p-4 border border-zinc-700">
                            <span className="font-bold font-mono text-phantom-red">{item.key}</span>
                            <span className="font-p5 text-white">{item.action}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
];

export const ManualOverlay = ({ onClose, playSfx }: ManualOverlayProps) => {
    const [activeTab, setActiveTab] = useState(SECTIONS[0].id);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-8"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-6xl h-[80vh] flex bg-black border-4 border-white shadow-[0_0_50px_rgba(255,0,0,0.3)] relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-phantom-red rounded-full blur-[100px] opacity-20 pointer-events-none" />

                {/* Left Sidebar (Tabs) */}
                <div className="w-64 bg-zinc-900 border-r-4 border-white flex flex-col relative z-10">
                    <div className="p-6 border-b-4 border-zinc-700 bg-phantom-red">
                        <h2 className="text-4xl font-p5 text-white italic transform -skew-x-12">GUIDE</h2>
                        <div className="text-xs font-mono text-black font-bold mt-1">PHANTOM THIEVES MANUAL</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-4 space-y-1">
                        {SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => { setActiveTab(section.id); playSfx('click'); }}
                                onMouseEnter={() => playSfx('hover')}
                                className={`w-full text-left px-6 py-4 flex items-center space-x-3 transition-all duration-200 relative overflow-hidden group ${
                                    activeTab === section.id 
                                        ? 'bg-white text-black translate-x-2' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <section.icon size={20} className={activeTab === section.id ? 'text-phantom-red' : ''} />
                                <span className={`font-p5 text-xl uppercase relative z-10`}>{section.title}</span>
                                {activeTab === section.id && (
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-phantom-red" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t-4 border-zinc-700">
                        <button 
                            onClick={() => { playSfx('cancel'); onClose(); }}
                            className="w-full py-3 border-2 border-white text-white font-p5 hover:bg-white hover:text-black transition-colors"
                        >
                            CLOSE GUIDE
                        </button>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    {/* Header Strip */}
                    <div className="h-2 bg-phantom-red w-full" />
                    
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        <AnimatePresence mode='wait'>
                            {SECTIONS.map((section) => (
                                section.id === activeTab && (
                                    <motion.div
                                        key={section.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="max-w-3xl mx-auto"
                                    >
                                        <div className="flex items-center space-x-4 mb-8 pb-4 border-b-2 border-zinc-800">
                                            <section.icon size={48} color={section.color} />
                                            <h2 className="text-6xl font-p5 uppercase tracking-tighter" style={{ color: section.color }}>
                                                {section.title}
                                            </h2>
                                        </div>
                                        
                                        {section.content}
                                    </motion.div>
                                )
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Footer Decor */}
                    <div className="h-12 border-t-2 border-zinc-800 flex items-center justify-between px-6 bg-zinc-950 text-zinc-500 font-mono text-xs">
                        <span>CONFIDENTIAL // PHANTOM THIEVES ONLY</span>
                        <span>V.2.8.0</span>
                    </div>
                </div>

                {/* Close Button (Floating) */}
                <button 
                    onClick={() => { playSfx('cancel'); onClose(); }}
                    className="absolute top-6 right-6 p-2 bg-black border-2 border-white text-white hover:rotate-90 transition-transform z-50 rounded-full"
                >
                    <X size={24} />
                </button>
            </div>
        </motion.div>
    );
};
