import React, { useState, useEffect, useRef } from 'react';
import { TerminalMessage, LanguageConfig } from '../types';
import { Play, Eraser, AlertCircle, Mic, Square, Loader2, BrainCircuit, Zap, BookOpen } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { soundService } from '../services/soundService';

interface TerminalProps {
  config: LanguageConfig; // Dynamic config
  messages: TerminalMessage[];
  onSendMessage: (msg: string) => void;
  onClear: () => void;
  isProcessing: boolean;
  fontSize: 'normal' | 'large' | 'xl';
  fontFamily: 'mono' | 'dyslexic';
  teachingMode: boolean;
  onToggleTeachingMode: (mode: boolean) => void;
  minimal?: boolean; // For grid view
  cwd?: string; // Current working directory to display
}

export const Terminal: React.FC<TerminalProps> = ({
  config,
  messages,
  onSendMessage,
  onClear,
  isProcessing,
  fontSize,
  fontFamily,
  teachingMode,

  onToggleTeachingMode,
  minimal = false,
  cwd
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  // Extract command history for navigation
  const commandHistory = messages
    .filter(m => m.type === 'input')
    .map(m => m.content);

  const { isRecording, isTranscribing, toggleRecording } = useVoiceInput(
    config.name,
    (text) => setInput(text)
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecording, isTranscribing]);

  // Sound Effects on Message Arrival
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.type === 'error') {
      soundService.playError();
    } else if (lastMsg.type === 'output') {
      soundService.playSuccess();
    }
  }, [messages]);

  // Reset history index when new message is added
  useEffect(() => {
    setHistoryIndex(null);
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || isRecording || isTranscribing) return;
    soundService.playSend();
    onSendMessage(input);
    setInput('');
    setHistoryIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      const newIndex = historyIndex === null
        ? commandHistory.length - 1
        : Math.max(0, historyIndex - 1);

      setHistoryIndex(newIndex);
      if (commandHistory[newIndex]) {
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;

      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        if (commandHistory[newIndex]) {
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const fontClass = fontFamily === 'dyslexic' ? 'font-sans tracking-wide leading-relaxed' : 'font-mono';
  const sizeClass = fontSize === 'xl' ? 'text-xl' : fontSize === 'large' ? 'text-lg' : 'text-base';

  return (
    <div className={`flex flex-col h-full bg-term-bg border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl ${fontClass} ${sizeClass} transition-colors duration-300`}>
      {/* Terminal Header */}
      <div className={`flex items-center justify-between bg-slate-800/80 border-b border-slate-700/50 backdrop-blur-sm ${minimal ? 'px-2 py-1' : 'px-4 py-2'}`}>
        <div className="flex items-center gap-3">
          {!minimal && (
            <div className="flex gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded shadow-sm ${config.color} ${config.text}`}>
              {config.name}
            </span>

            {/* Teaching Slider UI - Hide in grid mode if minimal space */}
            {!minimal && (
              <div className="flex items-center bg-slate-900 rounded-full p-1 border border-slate-700 ml-2">
                <button
                  onClick={() => onToggleTeachingMode(false)}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${!teachingMode ? 'bg-accent-blue text-slate-900 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Zap size={14} /> Fast
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button
                  onClick={() => onToggleTeachingMode(true)}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${teachingMode ? 'bg-accent-mauve text-slate-900 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <BrainCircuit size={14} /> Teach
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClear}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          title="Clear Terminal"
        >
          <Eraser size={minimal ? 14 : 18} />
        </button>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => inputRef.current?.focus()}>
        {messages.length === 0 && (
          <div className="text-slate-500 italic text-center mt-10 opacity-60">
            <p className={minimal ? 'text-xs' : ''}>Ready for {config.name}.</p>
            {teachingMode && !minimal && <p className="text-accent-mauve mt-2 text-sm">Teaching Mode On</p>}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in group relative">
            {/* User Input */}
            {msg.type === 'input' && (
              <div className="flex gap-2 text-accent-blue font-bold">
                <span className="select-none">❯</span>
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </div>
            )}

            {/* System Output */}
            {msg.type === 'output' && (
              <div className={`flex flex-col gap-2 ml-4 mt-1 ${minimal ? '' : 'md:flex-row md:items-start'}`}>
                <div className="text-term-fg whitespace-pre-wrap border-l-2 border-slate-600 pl-2 flex-1">
                  {msg.content}
                </div>

                {/* Educational Note (Sticky Note Style) */}
                {msg.educationalNote && !minimal && (
                  <div className="md:w-1/3 bg-[#fdf6e3] text-slate-800 p-3 rounded-lg shadow-lg border-l-4 border-accent-yellow transform rotate-1 text-sm font-sans relative">
                    <div className="flex items-center gap-1 font-bold text-slate-900 mb-1">
                      <BookOpen size={14} />
                      <span>Learn</span>
                    </div>
                    <p className="leading-snug">{msg.educationalNote}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {msg.type === 'error' && (
              <div className="flex gap-2 text-accent-red ml-4 bg-accent-red/10 p-2 rounded border-l-2 border-accent-red mt-1">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="ml-4 flex gap-2 items-center text-slate-400">
            {teachingMode ? <BrainCircuit size={16} className="animate-pulse text-accent-mauve" /> : <Zap size={16} className="animate-bounce text-accent-green" />}
            <span className="text-sm">{teachingMode ? "Thinking..." : "Executing..."}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Popular Color Blocks - Hide in minimal mode to save space */}
      {!minimal && (
        <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient">
          {config.blocks && config.blocks.map((block, i) => (
            <button
              key={i}
              onClick={() => setInput(block)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-bold transition-transform hover:scale-105 active:scale-95 ${config.color} ${config.text} opacity-90 hover:opacity-100 shadow-sm`}
            >
              {block}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-2 bg-slate-800/30 border-t border-slate-700/50 flex gap-2 items-center backdrop-blur-md">
        {cwd && !minimal && <span className="text-slate-500 text-xs font-mono shrink-0 max-w-[120px] truncate" title={cwd}>{cwd}</span>}
        <span className="text-accent-green font-bold py-1">➜</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-term-fg placeholder-slate-500 min-w-0"
          placeholder={minimal ? config.name : `Enter ${config.name} command...`}
          autoComplete="off"
          spellCheck="false"
          disabled={isRecording || isTranscribing}
        />

        <button
          type="button"
          onClick={toggleRecording}
          disabled={isProcessing || isTranscribing}
          className={`p-1.5 rounded-full transition-all duration-200 ${isRecording
            ? 'bg-accent-red text-white shadow-[0_0_15px_rgba(243,139,168,0.5)] animate-pulse'
            : 'text-slate-400 hover:text-white'
            } ${isTranscribing ? 'opacity-50 cursor-wait' : ''}`}
        >
          {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={16} />}
        </button>

        {!minimal && (
          <button
            type="submit"
            disabled={!input.trim() || isProcessing || isRecording || isTranscribing}
            className={`text-slate-900 p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${teachingMode ? 'bg-accent-mauve hover:bg-purple-300' : 'bg-accent-blue hover:bg-blue-400'}`}
          >
            <Play size={18} fill="currentColor" />
          </button>
        )}
      </form>
    </div>
  );
};
