import React, { useState } from 'react';
import { MemoryCard } from '../types';
import { generateColorMemory } from '../services/geminiService';
import { Plus, Search, Loader2, Lightbulb, Mic, Square } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface ColorMemoryProps {
  cards: MemoryCard[];
  onAddCard: (card: MemoryCard) => void;
}

export const ColorMemory: React.FC<ColorMemoryProps> = ({ cards, onAddCard }) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const { isRecording, isTranscribing, toggleRecording } = useVoiceInput(
      'Natural Language',
      (text) => setSearch(text)
  );

  const handleCreate = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const card = await generateColorMemory(search);
    if (card) {
      onAddCard({ ...card, id: Date.now().toString() });
      setSearch('');
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Input Area */}
      <div className="flex flex-col gap-2">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder={isRecording ? "Listening..." : "Concept (e.g. 'Loop')"}
            disabled={loading || isTranscribing}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-9 text-white text-sm focus:ring-2 focus:ring-accent-mauve outline-none transition-all placeholder-slate-500"
            />
            <button
            type="button"
            onClick={toggleRecording}
            disabled={loading || isTranscribing}
            className={`absolute right-1 top-1 p-1.5 rounded transition-colors ${
                isRecording 
                ? 'text-accent-red animate-pulse' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Voice Input"
            >
            {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={14} />}
            </button>
        </div>
        <button
            onClick={handleCreate}
            disabled={loading || !search || isRecording || isTranscribing}
            className="bg-accent-mauve text-slate-900 py-2 rounded-lg font-bold text-sm hover:bg-purple-300 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Generate Card
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1 custom-scrollbar">
        {cards.length === 0 && (
            <div className="flex flex-col items-center justify-center text-slate-500 py-10 opacity-60">
                <Lightbulb size={48} className="mb-2 stroke-1" />
                <p className="text-sm font-medium">No memory cards yet.</p>
            </div>
        )}
        {cards.map((card) => (
          <div
            key={card.id}
            className="group rounded-xl p-4 text-slate-900 shadow-md transform hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
            style={{ backgroundColor: card.color }}
          >
            <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity">
               <div className="text-6xl font-black">#</div>
            </div>
            
            <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 bg-black/10 px-1.5 py-0.5 rounded inline-block mb-2">
                    {card.tag}
                </span>
                <h3 className="text-lg font-black mb-1 leading-tight">{card.concept}</h3>
                <p className="text-xs font-semibold opacity-90 leading-normal font-sans">
                    {card.description}
                </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};