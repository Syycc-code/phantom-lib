import { motion } from 'framer-motion';
import { Book, Tag, Hash, Settings } from 'lucide-react';

export default function LeftPane() {
  const menuItems = [
    { icon: Book, label: 'All References' },
    { icon: Tag, label: 'Recently Added' },
    { icon: Hash, label: 'Tags' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-full bg-phantom-black border-r-2 border-phantom-red/50 p-4 flex flex-col text-white w-64 shrink-0 relative overflow-hidden">
      {/* P5 Stylized Background Element */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-phantom-red/20 to-transparent pointer-events-none" />

      <h1 className="text-3xl font-black italic tracking-tighter mb-8 text-phantom-red transform -rotate-2">
        ARCHIVE
      </h1>

      <nav className="space-y-2 z-10">
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            whileHover={{ x: 10, skewX: -10, backgroundColor: '#E60012', color: '#000' }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-full flex items-center space-x-3 p-3 rounded-sm hover:font-bold transition-colors cursor-pointer group"
          >
            <item.icon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="uppercase tracking-widest text-sm">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Aesthetic decorative text */}
      <div className="mt-auto opacity-20 text-[10px] font-mono transform rotate-90 origin-bottom-left absolute bottom-4 left-8">
        COGNITIVE_PSIENCE_LAB // V.0.1
      </div>
    </div>
  );
}
