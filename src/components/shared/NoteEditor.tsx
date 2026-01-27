import { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface NoteEditorProps {
    initialContent: string;
    paperId: number;
    onSave: (content: string) => Promise<void>;
}

export const NoteEditor = ({ initialContent, paperId, onSave }: NoteEditorProps) => {
    const [content, setContent] = useState(initialContent);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const timeoutRef = useRef<number | null>(null);

    // Auto-save debounce
    useEffect(() => {
        if (content === initialContent) return;
        
        setStatus('saving');
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        
        timeoutRef.current = window.setTimeout(async () => {
            try {
                await onSave(content);
                setStatus('saved');
                setTimeout(() => setStatus('idle'), 2000);
            } catch (e) {
                setStatus('error');
            }
        }, 1000);

        return () => {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        };
    }, [content, paperId]);

    // Reset content when switching papers
    useEffect(() => {
        setContent(initialContent || "");
    }, [paperId, initialContent]);

    return (
        <div className="flex flex-col h-full bg-[#EAE8DC] text-black font-mono relative border-l-2 border-[#4A4A4A]">
            <div className="flex justify-between items-center p-2 bg-[#4A4A4A] text-[#EAE8DC] text-xs uppercase tracking-widest shrink-0">
                <span>CONFIDANT NOTE</span>
                <span className={`flex items-center gap-1 ${status === 'error' ? 'text-red-400' : 'text-[#EAE8DC]'}`}>
                    {status === 'saving' && 'SAVING...'}
                    {status === 'saved' && 'SAVED'}
                    {status === 'error' && <><AlertCircle size={12}/> ERROR</>}
                    {status === 'idle' && <Save size={12} className="opacity-50" />}
                </span>
            </div>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Record your observations here..."
                className="flex-1 w-full p-4 bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-gray-400"
                spellCheck={false}
            />
            <div className="absolute bottom-2 right-2 text-[10px] opacity-30 pointer-events-none">
                MARKDOWN SUPPORTED
            </div>
        </div>
    );
};
