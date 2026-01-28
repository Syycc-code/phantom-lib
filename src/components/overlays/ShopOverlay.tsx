import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Lock, Check, AlertTriangle, Palette, Music, Sparkles, Trash2 } from 'lucide-react';
import type { PhantomStats, PlaySoundFunction } from '../../types';

interface ShopOverlayProps {
    stats: PhantomStats;
    inventory: string[];
    equipped: { theme: string, effect_monitor: string, effect_im: string, effect_marker: string };
    onClose: () => void;
    onPurchase: (item: ShopItem) => void;
    onEquip: (item: ShopItem) => void;
    onUnequip: (item: ShopItem) => void;
    playSfx: PlaySoundFunction;
}

export type ShopItem = {
    id: string;
    name: string;
    type: 'THEME' | 'SFX' | 'EFFECT';
    desc: string;
    cost: number;
    currency: keyof PhantomStats;
    value?: string; // Hex code for color, or file path
};

export const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'theme_default',
        name: 'PHANTOM RED',
        type: 'THEME',
        desc: 'The original color of rebellion.',
        cost: 0,
        currency: 'guts',
        value: '#E60012'
    },
    {
        id: 'theme_royal',
        name: 'ROYAL GOLD',
        type: 'THEME',
        desc: 'A luxurious hue for the elite thief.',
        cost: 2,
        currency: 'charm',
        value: '#D4AF37'
    },
    {
        id: 'theme_velvet',
        name: 'VELVET BLUE',
        type: 'THEME',
        desc: 'The color of fate and contracts.',
        cost: 3,
        currency: 'knowledge',
        value: '#1a45a0'
    },
    {
        id: 'theme_tv',
        name: 'MIDNIGHT YELLOW',
        type: 'THEME',
        desc: 'Seek the truth within the fog.',
        cost: 2,
        currency: 'guts',
        value: '#FFE600'
    },
    {
        id: 'theme_hacker',
        name: 'MATRIX GREEN',
        type: 'THEME',
        desc: 'Decrypt the code of reality.',
        cost: 2,
        currency: 'proficiency',
        value: '#00FF41'
    },
    // --- MONITOR LENSES ---
    {
        id: 'visualizer_audio',
        name: 'AUDIO VISUALIZER',
        type: 'EFFECT',
        desc: 'Visualize the rhythm of the cognitive world.',
        cost: 3,
        currency: 'charm',
        value: 'visualizer'
    },
    {
        id: 'radar_threat',
        name: 'THREAT RADAR',
        type: 'EFFECT',
        desc: 'Detects network anomalies and cognitive distortion.',
        cost: 2,
        currency: 'guts',
        value: 'radar'
    },
    // --- IM SKINS ---
    {
        id: 'skin_sns',
        name: 'SNS STYLE',
        type: 'EFFECT',
        desc: 'Anonymous chat network for the Phantom Thieves.',
        cost: 4,
        currency: 'charm',
        value: 'sns'
    },
    {
        id: 'skin_terminal',
        name: 'RETRO TERMINAL',
        type: 'EFFECT',
        desc: 'Direct link to the Metaverse database.',
        cost: 4,
        currency: 'knowledge',
        value: 'terminal'
    },
    // --- COGNITIVE MARKERS ---
    {
        id: 'marker_neon',
        name: 'NEON HIGHLIGHTER',
        type: 'EFFECT',
        desc: 'Highlights truth in the darkness.',
        cost: 2,
        currency: 'proficiency',
        value: 'neon'
    },
    {
        id: 'marker_redact',
        name: 'REDACTION TAPE',
        type: 'EFFECT',
        desc: 'For eyes only. Hides sensitive intel.',
        cost: 3,
        currency: 'knowledge',
        value: 'redact'
    }
];

export const ShopOverlay = ({ stats, inventory, equipped, onClose, onPurchase, onEquip, onUnequip, playSfx }: ShopOverlayProps) => {
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [hoveredItem, setHoveredItem] = useState<ShopItem | null>(null);
    const [confirming, setConfirming] = useState(false);

    // Prioritize hover item, then selected item
    const activeDisplayItem = hoveredItem || selectedItem;

    const handleItemClick = (item: ShopItem) => {
        setSelectedItem(item);
        setConfirming(false);
        playSfx('click');
    };

    const handleAction = () => {
        if (!selectedItem) return;

        const isOwned = inventory.includes(selectedItem.id);
        
        let isEquipped = false;
        if (selectedItem.type === 'THEME') isEquipped = equipped.theme === selectedItem.id;
        else if (selectedItem.id.startsWith('visualizer_') || selectedItem.id.startsWith('radar_')) isEquipped = equipped.effect_monitor === selectedItem.value;
        else if (selectedItem.id.startsWith('skin_')) isEquipped = equipped.effect_im === selectedItem.value;
        else if (selectedItem.id.startsWith('marker_')) isEquipped = equipped.effect_marker === selectedItem.value;

        if (isOwned) {
            if (isEquipped) {
                // Unequip Logic (Only for non-themes)
                if (selectedItem.type !== 'THEME') {
                    onUnequip(selectedItem);
                    playSfx('cancel'); // Sound for unequip
                }
            } else {
                // Equip Logic
                onEquip(selectedItem);
                playSfx('confirm');
            }
        } else {
            // Purchase Logic
            if (confirming) {
                onPurchase(selectedItem);
                playSfx('impact'); // Purchase Sound
                setConfirming(false);
            } else {
                setConfirming(true);
                playSfx('hover'); // Warning Sound
            }
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-8 backdrop-blur-md"
            onClick={() => { onClose(); playSfx('cancel'); }}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]" />

            <motion.div 
                initial={{ y: 50, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 50, scale: 0.95 }}
                className="relative w-full max-w-6xl h-[700px] flex bg-zinc-900 border-4 border-gray-700 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* --- LEFT SIDE: THE BROKER --- */}
                <div className="w-1/3 bg-black border-r-4 border-gray-700 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 to-black opacity-50" />
                    
                    {/* Header */}
                    <div className="relative z-10 p-8 border-b-2 border-gray-800">
                        <h2 className="text-4xl font-p5 text-white tracking-widest transform -skew-x-12 mb-2">
                            SHADOW MARKET
                        </h2>
                        <div className="text-gray-500 font-mono text-xs flex items-center gap-2">
                            <Lock size={12} />
                            <span>ENCRYPTED CONNECTION ESTABLISHED</span>
                        </div>
                    </div>

                    {/* Stats Wallet */}
                    <div className="relative z-10 p-8 flex-1">
                        <h3 className="text-xl font-p5 text-white mb-6 border-b border-gray-700 pb-2">YOUR SACRIFICE</h3>
                        <div className="space-y-4 font-mono text-sm">
                            {Object.entries(stats).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center group">
                                    <span className={`uppercase transition-colors ${activeDisplayItem?.currency === key ? 'text-phantom-red font-bold' : 'text-gray-400'}`}>
                                        {key}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {activeDisplayItem && activeDisplayItem.currency === key && !inventory.includes(activeDisplayItem.id) && (
                                            <span className="text-red-500 animate-pulse">
                                                -{activeDisplayItem.cost}
                                            </span>
                                        )}
                                        <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                className={`h-full ${activeDisplayItem?.currency === key ? 'bg-phantom-red' : 'bg-white'}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(val / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-white w-6 text-right">{val}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Image */}
                    <div className="absolute bottom-0 left-0 right-0 h-64 opacity-20 pointer-events-none">
                        <ShoppingBag size={200} className="absolute bottom-[-40px] left-[-40px] text-white transform rotate-12" />
                    </div>
                </div>

                {/* --- RIGHT SIDE: THE GOODS --- */}
                <div className="w-2/3 bg-zinc-900 flex flex-col">
                    {/* Item List */}
                    <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 gap-4 content-start custom-scrollbar">
                        {SHOP_ITEMS.map((item) => {
                            const isOwned = inventory.includes(item.id);
                            let isEquipped = false;
                            if (item.type === 'THEME') isEquipped = equipped.theme === item.id;
                            else if (item.id.startsWith('visualizer_') || item.id.startsWith('radar_')) isEquipped = equipped.effect_monitor === item.value;
                            else if (item.id.startsWith('skin_')) isEquipped = equipped.effect_im === item.value;
                            else if (item.id.startsWith('marker_')) isEquipped = equipped.effect_marker === item.value;

                            const isSelected = selectedItem?.id === item.id;
                            const isHovered = hoveredItem?.id === item.id;
                            const canAfford = stats[item.currency] >= item.cost;

                            return (
                                <motion.div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    onMouseEnter={() => { setHoveredItem(item); playSfx('hover'); }}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    className={`relative p-4 border-2 cursor-pointer transition-all group overflow-hidden ${
                                        isSelected 
                                            ? 'border-white bg-white text-black' 
                                            : isHovered 
                                                ? 'border-phantom-red bg-black/80 text-white' 
                                                : 'border-gray-700 bg-black/50 text-gray-400 hover:border-gray-500'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {item.type === 'THEME' && <Palette size={16} />}
                                            {item.type === 'EFFECT' && <Sparkles size={16} />}
                                            <h3 className={`font-p5 text-xl ${isSelected ? 'text-black' : 'text-white'}`}>
                                                {item.name}
                                            </h3>
                                        </div>
                                        {isEquipped && <div className="bg-phantom-red text-white text-[10px] px-2 py-0.5 font-bold uppercase">EQUIPPED</div>}
                                        {isOwned && !isEquipped && <Check size={16} className="text-green-500" />}
                                    </div>
                                    
                                    <p className={`font-serif text-sm mb-4 leading-tight ${isSelected ? 'text-gray-800' : 'text-gray-500'} ${isHovered ? 'text-gray-300' : ''}`}>
                                        {item.desc}
                                    </p>

                                    {!isOwned && (
                                        <div className="flex justify-end">
                                            <div className={`flex items-center gap-2 px-3 py-1 font-mono text-xs border ${
                                                canAfford 
                                                    ? (isSelected || isHovered ? 'border-black text-black bg-white' : 'border-gray-500 text-gray-300')
                                                    : 'border-red-900 text-red-700 bg-red-900/10'
                                            }`}>
                                                {item.cost > 0 ? (
                                                    <>
                                                        <span>COST:</span>
                                                        <span className="font-bold">{item.cost} {item.currency.toUpperCase()}</span>
                                                    </>
                                                ) : (
                                                    <span>FREE</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Color Preview Strip */}
                                    {item.type === 'THEME' && item.value && (
                                        <div 
                                            className="absolute bottom-0 left-0 w-1.5 h-full opacity-50 group-hover:opacity-100 transition-opacity"
                                            style={{ backgroundColor: item.value }}
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Action Bar */}
                    <div className="h-24 bg-black border-t-4 border-gray-700 p-4 flex items-center justify-between">
                        {activeDisplayItem ? (
                            <div className="flex items-center justify-between w-full">
                                <div className="text-gray-400 font-mono text-xs">
                                    <p className="text-white text-lg font-p5 mb-1">{activeDisplayItem.name}</p>
                                    <p>{activeDisplayItem.desc}</p>
                                    {!inventory.includes(activeDisplayItem.id) && (
                                        <p className="text-phantom-red mt-1">COST: {activeDisplayItem.cost} {activeDisplayItem.currency.toUpperCase()}</p>
                                    )}
                                </div>

                                {selectedItem && selectedItem.id === activeDisplayItem.id && ( // Only show button for selected item
                                    inventory.includes(selectedItem.id) ? (
                                        <button 
                                            onClick={handleAction}
                                            disabled={selectedItem.type === 'THEME' && equipped.theme === selectedItem.id}
                                            className={`px-8 py-3 font-p5 text-xl uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                (selectedItem.type === 'THEME' && equipped.theme === selectedItem.id)
                                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                    : 'bg-white text-black hover:bg-phantom-red hover:text-white'
                                            }`}
                                        >
                                            {(selectedItem.type === 'THEME' && equipped.theme === selectedItem.id) ||
                                             (selectedItem.id.startsWith('visualizer_') && equipped.effect_monitor === selectedItem.value) ||
                                             (selectedItem.id.startsWith('radar_') && equipped.effect_monitor === selectedItem.value) ||
                                             (selectedItem.id.startsWith('skin_') && equipped.effect_im === selectedItem.value) ||
                                             (selectedItem.id.startsWith('marker_') && equipped.effect_marker === selectedItem.value)
                                                ? (selectedItem.type === 'THEME' ? "EQUIPPED" : <>UNEQUIP <Trash2 size={16} /></>) 
                                                : "EQUIP NOW"}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleAction}
                                            disabled={stats[selectedItem.currency] < selectedItem.cost}
                                            className={`group relative px-8 py-3 font-p5 text-xl uppercase tracking-widest transition-all flex items-center gap-4 ${
                                                stats[selectedItem.currency] < selectedItem.cost
                                                    ? 'bg-red-900/30 text-red-700 border-2 border-red-900 cursor-not-allowed'
                                                    : (confirming 
                                                        ? 'bg-red-600 text-white animate-pulse border-2 border-red-500' 
                                                        : 'bg-transparent text-white border-2 border-white hover:bg-white hover:text-black')
                                            }`}
                                        >
                                            {confirming && <AlertTriangle size={20} />}
                                            <span>
                                                {stats[selectedItem.currency] < selectedItem.cost
                                                    ? "INSUFFICIENT STATS"
                                                    : (confirming ? "CONFIRM SACRIFICE?" : "TAKE DEAL")}
                                            </span>
                                        </button>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="w-full text-center text-gray-600 font-p5 tracking-widest">
                                HOVER TO INSPECT // CLICK TO SELECT
                            </div>
                        )}
                    </div>
                </div>

                {/* Close Button */}
                <button 
                    onClick={() => { onClose(); playSfx('cancel'); }} 
                    className="absolute top-4 right-4 z-50 text-white hover:text-phantom-red"
                >
                    <X size={32}/>
                </button>
            </motion.div>
        </motion.div>
    );
};
