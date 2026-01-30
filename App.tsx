import React, { useState, useEffect } from 'react';
import { Terminal } from './components/Terminal';
import { ColorMemory } from './components/ColorMemory';
import { Analytics } from './components/Analytics';
import { TerminalMessage, MemoryCard, AnalyticsData, DEFAULT_LANGUAGE_CONFIGS, LanguageConfig, SessionData, Theme } from './types';

import { runTerminalCommand, generateLanguageConfig, generateEducationalNote } from './services/geminiService';
import { executeCommand } from './services/terminalService';
import { saveSessionLog } from './services/logService';
import { soundService } from './services/soundService';
import { BookOpen, BarChart2, Cpu, Eye, Type, Menu, Plus, Loader2, Grid, Square, Volume2, VolumeX, Palette, Layout, Shapes, PenTool, X } from 'lucide-react';

const THEMES: Theme[] = [
    {
        id: 'midnight',
        name: 'Midnight',
        colors: {
            '--term-bg': '#1e1e2e',
            '--term-fg': '#cdd6f4',
            '--accent-blue': '#89b4fa',
            '--accent-green': '#a6e3a1',
            '--accent-red': '#f38ba8',
            '--accent-yellow': '#f9e2af',
            '--accent-mauve': '#cba6f7',
            '--sidebar-bg': '#181825',
            '--sidebar-fg': '#9399b2',
        }
    },
    {
        id: 'paper',
        name: 'Paper',
        colors: {
            '--term-bg': '#fdf6e3',
            '--term-fg': '#3b4252',
            '--accent-blue': '#5e81ac',
            '--accent-green': '#a3be8c',
            '--accent-red': '#bf616a',
            '--accent-yellow': '#d08770',
            '--accent-mauve': '#b48ead',
            '--sidebar-bg': '#e5e9f0',
            '--sidebar-fg': '#4c566a',
        }
    },
    {
        id: 'hacker',
        name: 'Hacker',
        colors: {
            '--term-bg': '#000000',
            '--term-fg': '#20C20E',
            '--accent-blue': '#20C20E',
            '--accent-green': '#20C20E',
            '--accent-red': '#ff0000',
            '--accent-yellow': '#ffff00',
            '--accent-mauve': '#20C20E',
            '--sidebar-bg': '#111111',
            '--sidebar-fg': '#20C20E',
        }
    },
    {
        id: 'ocean',
        name: 'Ocean',
        colors: {
            '--term-bg': '#0f172a',
            '--term-fg': '#e2e8f0',
            '--accent-blue': '#38bdf8',
            '--accent-green': '#4ade80',
            '--accent-red': '#f87171',
            '--accent-yellow': '#facc15',
            '--accent-mauve': '#818cf8',
            '--sidebar-bg': '#1e293b',
            '--sidebar-fg': '#94a3b8',
        }
    }
];

const App: React.FC = () => {
    // --- Persistence Helper ---
    const loadState = <T,>(key: string, fallback: T): T => {
        if (typeof window === 'undefined') return fallback;
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (e) {
            console.error(`Failed to load ${key}`, e);
            return fallback;
        }
    };

    // --- State ---
    // Reverted to activePanel logic for side-by-side view
    const [activePanel, setActivePanel] = useState<'memory' | 'analytics' | 'custom_shop' | null>('memory');
    const [activeLangId, setActiveLangId] = useState<string>('linux');
    const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

    // Theme & Sound & Symbol Mode
    const [currentThemeId, setCurrentThemeId] = useState<string>(() => loadState('spectrum_theme', 'midnight'));
    const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadState('spectrum_sound', false));
    const [symbolMode, setSymbolMode] = useState<boolean>(() => loadState('spectrum_symbol_mode', false));

    // Dynamic Configuration State
    const [languageConfigs, setLanguageConfigs] = useState<Record<string, LanguageConfig>>(() =>
        loadState('spectrum_languageConfigs', DEFAULT_LANGUAGE_CONFIGS)
    );

    // Multi-Session State
    const [sessions, setSessions] = useState<Record<string, SessionData>>(() => {
        const saved = loadState<Record<string, SessionData> | null>('spectrum_sessions', null);
        if (saved) {
            const clean: Record<string, SessionData> = {};
            Object.keys(saved).forEach(key => {
                clean[key] = { ...saved[key], isProcessing: false };
            });
            return clean;
        }
        const initial: Record<string, SessionData> = {};
        Object.keys(DEFAULT_LANGUAGE_CONFIGS).forEach(key => {
            initial[key] = { messages: [], isProcessing: false };
        });
        return initial;
    });

    const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(() =>
        loadState('spectrum_memoryCards', [])
    );

    const [teachingMode, setTeachingMode] = useState(false);
    const [isAddingLang, setIsAddingLang] = useState(false);

    const [analytics, setAnalytics] = useState<AnalyticsData[]>(() =>
        loadState('spectrum_analytics', [
            { language: 'javascript', commandsRun: 0, errors: 0, successful: 0, streakDays: 3 },
            { language: 'python', commandsRun: 0, errors: 0, successful: 0, streakDays: 1 },
            { language: 'sql', commandsRun: 0, errors: 0, successful: 0, streakDays: 0 },
            { language: 'bash', commandsRun: 0, errors: 0, successful: 0, streakDays: 0 },
        ])
    );

    const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
    const [fontFamily, setFontFamily] = useState<'mono' | 'dyslexic'>('mono');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [newBlock, setNewBlock] = useState(''); // Custom block input

    // --- Effects ---

    // Apply Theme
    useEffect(() => {
        const theme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        localStorage.setItem('spectrum_theme', JSON.stringify(currentThemeId));
    }, [currentThemeId]);

    // Apply Sound
    useEffect(() => {
        soundService.setEnabled(soundEnabled);
        localStorage.setItem('spectrum_sound', JSON.stringify(soundEnabled));
    }, [soundEnabled]);

    // Apply Symbol Mode
    useEffect(() => {
        localStorage.setItem('spectrum_symbol_mode', JSON.stringify(symbolMode));
    }, [symbolMode]);

    // Persistence Effects
    useEffect(() => { try { localStorage.setItem('spectrum_languageConfigs', JSON.stringify(languageConfigs)); } catch (e) { } }, [languageConfigs]);
    useEffect(() => { try { localStorage.setItem('spectrum_sessions', JSON.stringify(sessions)); } catch (e) { } }, [sessions]);
    useEffect(() => { try { localStorage.setItem('spectrum_memoryCards', JSON.stringify(memoryCards)); } catch (e) { } }, [memoryCards]);
    useEffect(() => { try { localStorage.setItem('spectrum_analytics', JSON.stringify(analytics)); } catch (e) { } }, [analytics]);

    // --- Helpers ---
    const currentSession = sessions[activeLangId] || { messages: [], isProcessing: false };
    const currentConfig = languageConfigs[activeLangId] || languageConfigs['javascript'];

    // --- Handlers ---
    const handleSendMessage = async (input: string, langId: string) => {
        const config = languageConfigs[langId];
        if (!config) return;

        const userMsg: TerminalMessage = {
            id: Date.now().toString(),
            type: 'input',
            content: input,
            timestamp: Date.now(),
        };

        setSessions(prev => {
            const session = prev[langId] || { messages: [], isProcessing: false };
            return {
                ...prev,
                [langId]: {
                    ...session,
                    messages: [...session.messages, userMsg],
                    isProcessing: true
                }
            };
        });

        // History from THAT specific session
        const sessionHistory = sessions[langId]?.messages || [];
        const historyText = sessionHistory.slice(-5).map(m => `${m.type.toUpperCase()}: ${m.content}`);

        // 1. Execute Command (Real or Sim)
        const execResult = await executeCommand(config.id, input, historyText);

        const output = execResult.output;
        let note: string | undefined = undefined;

        // 2. Generate Educational Note (if Teaching Mode)
        if (teachingMode) {
            note = await generateEducationalNote(input, output, config.name);
        }

        const isError = execResult.isError || output.toLowerCase().includes('error') || output.toLowerCase().includes('exception');

        setAnalytics(prev => {
            const existing = prev.find(a => a.language === langId);
            if (existing) {
                return prev.map(a => {
                    if (a.language === langId) {
                        return {
                            ...a,
                            commandsRun: a.commandsRun + 1,
                            errors: a.errors + (isError ? 1 : 0),
                            successful: a.successful + (isError ? 0 : 1)
                        };
                    }
                    return a;
                });
            } else {
                return [...prev, {
                    language: langId,
                    commandsRun: 1,
                    errors: isError ? 1 : 0,
                    successful: isError ? 0 : 1,
                    streakDays: 1
                }];
            }
        });

        const sysMsg: TerminalMessage = {
            id: (Date.now() + 1).toString(),
            type: isError ? 'error' : 'output',
            content: output,
            educationalNote: note,
            timestamp: Date.now(),
        };

        setSessions(prev => {
            const session = prev[langId] || { messages: [], isProcessing: false };
            return {
                ...prev,
                [langId]: {
                    ...session,
                    messages: [...session.messages, sysMsg],
                    isProcessing: false,
                    cwd: execResult.cwd || session.cwd
                }
            };
        });

        // Save log safely outside of state updater
        // We use the current closure's sessions + new msg
        const logMessages = [...(sessions[langId]?.messages || []), sysMsg];
        saveSessionLog(langId, logMessages);
    };

    const handleClear = (langId: string) => {
        setSessions(prev => ({
            ...prev,
            [langId]: { ...prev[langId], messages: [] }
        }));
    };

    const handleAddBlock = () => {
        if (!newBlock.trim()) return;
        setLanguageConfigs(prev => {
            const current = prev[activeLangId];
            if (!current) return prev;
            return {
                ...prev,
                [activeLangId]: {
                    ...current,
                    blocks: [newBlock, ...current.blocks]
                }
            };
        });
        setNewBlock('');
    };

    const handleAddLanguage = async () => {
        const name = window.prompt("Enter the name of the programming language you want to add:");
        if (!name) return;

        setIsAddingLang(true);
        const newConfig = await generateLanguageConfig(name);

        if (newConfig) {
            setLanguageConfigs(prev => ({ ...prev, [newConfig.id]: newConfig }));
            setSessions(prev => ({ ...prev, [newConfig.id]: { messages: [], isProcessing: false } }));
            setActiveLangId(newConfig.id);
            // Don't close panel automatically, user might want to check configs
        } else {
            alert("Could not generate configuration for that language.");
        }
        setIsAddingLang(false);
    };

    const togglePanel = (panel: 'memory' | 'analytics' | 'custom_shop') => {
        setActivePanel(prev => prev === panel ? null : panel);
    };

    return (
        <div className={`flex h-screen bg-sidebar-bg text-sidebar-fg overflow-hidden ${fontFamily === 'dyslexic' ? 'font-sans' : 'font-sans'}`}>

            {/* Sidebar Navigation */}
            <aside className={`${sidebarOpen ? 'w-20 md:w-64' : 'w-20'} flex-shrink-0 bg-sidebar-bg border-r border-slate-700/50 flex flex-col transition-all duration-300 z-20`}>
                <div className="p-4 flex items-center justify-between">
                    <div className={`font-bold text-accent-mauve text-lg flex items-center gap-2 ${(!sidebarOpen || symbolMode) && 'justify-center w-full'}`}>
                        <Cpu size={28} />
                        {sidebarOpen && !symbolMode && <span className="hidden md:block">Terminal Buddy</span>}
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block text-sidebar-fg hover:text-white">
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-2 space-y-2 mt-4 overflow-y-auto no-scrollbar">
                    <button
                        onClick={() => togglePanel('memory')}
                        title="Memory Bank"
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activePanel === 'memory' ? 'bg-slate-800 text-accent-blue shadow-lg' : 'text-sidebar-fg hover:bg-slate-800/50'}`}
                    >
                        <BookOpen size={24} />
                        {sidebarOpen && !symbolMode && <span className="hidden md:block font-medium">Memory Bank</span>}
                    </button>
                    <button
                        onClick={() => togglePanel('analytics')}
                        title="Analytics"
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activePanel === 'analytics' ? 'bg-slate-800 text-accent-green shadow-lg' : 'text-sidebar-fg hover:bg-slate-800/50'}`}
                    >
                        <BarChart2 size={24} />
                        {sidebarOpen && !symbolMode && <span className="hidden md:block font-medium">Analytics</span>}
                    </button>
                    <button
                        onClick={() => togglePanel('custom_shop')}
                        title="Custom Shop"
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activePanel === 'custom_shop' ? 'bg-slate-800 text-accent-red shadow-lg' : 'text-sidebar-fg hover:bg-slate-800/50'}`}
                    >
                        <PenTool size={24} />
                        {sidebarOpen && !symbolMode && <span className="hidden md:block font-medium">Custom Shop</span>}
                    </button>

                    <div className="border-t border-slate-700/50 my-4" />

                    {/* View Mode Toggle */}
                    <div className="px-2 mb-4">
                        <div className="bg-slate-900 rounded-lg p-1 flex">
                            <button
                                onClick={() => setViewMode('single')}
                                className={`flex-1 flex justify-center py-1.5 rounded transition-colors ${viewMode === 'single' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Single View"
                            >
                                <Square size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex-1 flex justify-center py-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Grid View"
                            >
                                <Grid size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:flex justify-between items-center">
                        {sidebarOpen && !symbolMode && (
                            <>
                                <span>Terminals</span>
                                <button onClick={handleAddLanguage} disabled={isAddingLang} className="hover:text-white transition-colors">
                                    {isAddingLang ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                                </button>
                            </>
                        )}
                        {symbolMode && (
                            <div className="w-full flex justify-center">
                                <button onClick={handleAddLanguage} disabled={isAddingLang} className="hover:text-white transition-colors">
                                    {isAddingLang ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Language List */}
                    {Object.values(languageConfigs).map((config: LanguageConfig) => (
                        <button
                            key={config.id}
                            title={config.name}
                            onClick={() => setActiveLangId(config.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeLangId === config.id ? 'bg-slate-700/50 text-white border border-slate-600' : 'text-sidebar-fg hover:bg-slate-800/50'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${config.color}`} />
                            {sidebarOpen && !symbolMode && (
                                <div className="flex-1 text-left flex justify-between items-center">
                                    <span className="capitalize">{config.name}</span>
                                    {sessions[config.id]?.isProcessing && (
                                        <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
                                    )}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Accessibility Quick Settings */}
                <div className="p-4 bg-slate-900/50 border-t border-slate-700/50">
                    <div className={`flex flex-col gap-3 ${!sidebarOpen && 'items-center'}`}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button
                                onClick={() => setFontFamily(prev => prev === 'mono' ? 'dyslexic' : 'mono')}
                                className={`p-2 rounded-lg transition-colors flex justify-center ${fontFamily === 'dyslexic' ? 'bg-accent-mauve text-slate-900' : 'bg-slate-800 text-slate-400'}`}
                                title="Toggle Dyslexic Font"
                            >
                                <Type size={20} />
                            </button>
                            <button
                                onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xl' : 'normal')}
                                className={`p-2 rounded-lg transition-colors flex justify-center ${fontSize !== 'normal' ? 'bg-accent-mauve text-slate-900' : 'bg-slate-800 text-slate-400'}`}
                                title="Toggle Text Size"
                            >
                                <Eye size={20} />
                            </button>
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`p-2 rounded-lg transition-colors flex justify-center ${soundEnabled ? 'bg-accent-green text-slate-900' : 'bg-slate-800 text-slate-400'}`}
                                title="Toggle Sound"
                            >
                                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                            <button
                                onClick={() => setSymbolMode(!symbolMode)}
                                className={`p-2 rounded-lg transition-colors flex justify-center ${symbolMode ? 'bg-accent-blue text-slate-900' : 'bg-slate-800 text-slate-400'}`}
                                title="Toggle Symbol Mode (Less Words)"
                            >
                                <Shapes size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden relative bg-term-bg">

                {/* Terminals Area - Always Visible */}
                <div className="flex-1 p-2 md:p-4 flex flex-col z-10 overflow-hidden min-w-0">
                    {viewMode === 'single' ? (
                        // Single View
                        <div className="h-full">
                            <Terminal
                                config={currentConfig}
                                messages={currentSession.messages}
                                cwd={currentSession.cwd}
                                onSendMessage={(msg) => handleSendMessage(msg, activeLangId)}
                                onClear={() => handleClear(activeLangId)}
                                isProcessing={currentSession.isProcessing}
                                fontSize={fontSize}
                                fontFamily={fontFamily}
                                teachingMode={teachingMode}
                                onToggleTeachingMode={setTeachingMode}
                            />
                        </div>
                    ) : (
                        // Grid View
                        <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-20">
                            {Object.values(languageConfigs).map((config: LanguageConfig) => {
                                const sess = sessions[config.id] || { messages: [], isProcessing: false };
                                return (
                                    <div key={config.id} className="min-h-[300px] overflow-hidden">
                                        <Terminal
                                            config={config}
                                            messages={sess.messages}
                                            cwd={sess.cwd}
                                            onSendMessage={(msg) => handleSendMessage(msg, config.id)}
                                            onClear={() => handleClear(config.id)}
                                            isProcessing={sess.isProcessing}
                                            fontSize={fontSize}
                                            fontFamily={fontFamily}
                                            teachingMode={teachingMode}
                                            onToggleTeachingMode={setTeachingMode}
                                            minimal={true}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Side Panel (Tools) */}
                {activePanel && (
                    <div className="w-full md:w-96 bg-sidebar-bg border-l border-slate-700/50 flex flex-col transition-all duration-300 shadow-2xl relative z-20">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                            {activePanel === 'memory' && <h2 className="font-bold text-lg flex items-center gap-2"><BookOpen className="text-accent-blue" /> Memory Bank</h2>}
                            {activePanel === 'analytics' && <h2 className="font-bold text-lg flex items-center gap-2"><BarChart2 className="text-accent-green" /> Analytics</h2>}
                            {activePanel === 'custom_shop' && <h2 className="font-bold text-lg flex items-center gap-2"><PenTool className="text-accent-red" /> Custom Shop</h2>}

                            <button onClick={() => setActivePanel(null)} className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            {/* Memory Bank Panel */}
                            {activePanel === 'memory' && (
                                <ColorMemory
                                    cards={memoryCards}
                                    onAddCard={(card) => setMemoryCards([card, ...memoryCards])}
                                />
                            )}

                            {/* Analytics Panel */}
                            {activePanel === 'analytics' && (
                                <Analytics data={analytics} sessions={sessions} />
                            )}

                            {/* Custom Shop Panel */}
                            {activePanel === 'custom_shop' && (
                                <div className="p-4 space-y-6 text-term-fg">
                                    <p className="text-slate-400 text-sm">Personalize your environment.</p>

                                    <div className="space-y-6">
                                        {/* Add Custom Block Section */}
                                        <div className="pb-4 border-b border-slate-700">
                                            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-300">
                                                <Plus size={16} className="text-accent-green" />
                                                Add Command Block
                                            </h3>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newBlock}
                                                    onChange={(e) => setNewBlock(e.target.value)}
                                                    placeholder={`Add block for ${currentConfig.name}...`}
                                                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-accent-green placeholder-slate-500"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddBlock()}
                                                />
                                                <button
                                                    onClick={handleAddBlock}
                                                    className="bg-accent-green text-slate-900 p-2 rounded hover:brightness-110 transition-all font-bold"
                                                    title="Add Block"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pb-4 border-b border-slate-700">
                                            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-300">
                                                <Palette size={16} className="text-accent-blue" />
                                                Themes
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {THEMES.map(theme => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => setCurrentThemeId(theme.id)}
                                                        className={`p-3 rounded-lg border transition-all flex items-center justify-between ${currentThemeId === theme.id ? 'border-accent-mauve bg-slate-800' : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800'}`}
                                                    >
                                                        <span className="text-sm font-bold">{theme.name}</span>
                                                        <div className="flex gap-1">
                                                            <div className="w-2 h-2 rounded-full" style={{ background: theme.colors['--term-bg'] }}></div>
                                                            <div className="w-2 h-2 rounded-full" style={{ background: theme.colors['--accent-blue'] }}></div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pb-4 border-b border-slate-700">
                                            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-300">
                                                <Layout size={16} className="text-accent-green" />
                                                Layout
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setViewMode('single')}
                                                    className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${viewMode === 'single' ? 'bg-slate-800 border-accent-green' : 'bg-slate-800/30 border-slate-700'}`}
                                                >
                                                    <Square size={20} className={viewMode === 'single' ? "text-accent-green" : "text-slate-500"} />
                                                    <span className="text-xs font-bold">Single</span>
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('grid')}
                                                    className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${viewMode === 'grid' ? 'bg-slate-800 border-accent-green' : 'bg-slate-800/30 border-slate-700'}`}
                                                >
                                                    <Grid size={20} className={viewMode === 'grid' ? "text-accent-green" : "text-slate-500"} />
                                                    <span className="text-xs font-bold">Grid</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-300">
                                                <Volume2 size={16} className="text-accent-yellow" />
                                                Sound
                                            </h3>
                                            <button
                                                onClick={() => setSoundEnabled(!soundEnabled)}
                                                className={`w-full p-3 rounded-lg border transition-all flex items-center justify-between ${soundEnabled ? 'bg-slate-800 border-accent-yellow' : 'bg-slate-800/30 border-slate-700'}`}
                                            >
                                                <span className="text-sm font-bold">{soundEnabled ? "Effects On" : "Effects Off"}</span>
                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${soundEnabled ? 'bg-accent-yellow' : 'bg-slate-600'}`}>
                                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${soundEnabled ? 'left-4.5' : 'left-0.5'}`}></div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

        </div>
    );
};

export default App;