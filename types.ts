export interface TerminalMessage {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
  educationalNote?: string; // Highligted note for learning
}

export interface MemoryCard {
  id: string;
  concept: string;
  description: string;
  color: string; // Hex code or Tailwind class
  tag: string;
}

export interface AnalyticsData {
  language: string;
  commandsRun: number;
  errors: number;
  successful: number;
  streakDays: number;
}

export interface LanguageConfig {
  id: string;
  name: string;
  color: string; // Tailwind bg class for identifier
  text: string; // Tailwind text class
  blocks: string[]; // Popular command blocks
}

export interface SessionData {
  messages: TerminalMessage[];
  isProcessing: boolean;
  cwd?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    '--term-bg': string;
    '--term-fg': string;
    '--accent-blue': string;
    '--accent-green': string;
    '--accent-red': string;
    '--accent-yellow': string;
    '--accent-mauve': string;
    '--sidebar-bg': string;
    '--sidebar-fg': string;
  }
}

// Default configurations - Shell languages first for immediate terminal use
export const DEFAULT_LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  // === SHELL LANGUAGES (Primary) ===
  linux: {
    id: 'linux',
    color: 'bg-emerald-600',
    text: 'text-white',
    name: 'Linux Shell',
    blocks: ['ls -la', 'cd ~', 'sudo apt update', 'grep -r "text"', 'chmod +x', 'cat file.txt', 'htop']
  },
  powershell: {
    id: 'powershell',
    color: 'bg-blue-700',
    text: 'text-white',
    name: 'PowerShell',
    blocks: ['Get-ChildItem', 'Set-Location', 'Get-Process', 'Install-Module', 'New-Item']
  },
  bash: {
    id: 'bash',
    color: 'bg-slate-600',
    text: 'text-white',
    name: 'Bash Script',
    blocks: ['#!/bin/bash', 'echo $VAR', 'if [ -f file ]', 'for i in *', 'function name()']
  },
  // === PROGRAMMING LANGUAGES ===
  python: {
    id: 'python',
    color: 'bg-blue-500',
    text: 'text-white',
    name: 'Python',
    blocks: ['print()', 'def func():', 'import', 'for i in:', 'if x:']
  },
  javascript: {
    id: 'javascript',
    color: 'bg-yellow-400',
    text: 'text-yellow-900',
    name: 'JavaScript',
    blocks: ['console.log()', 'const x =', 'function() {}', 'array.map()', 'if () {}']
  },
  sql: {
    id: 'sql',
    color: 'bg-orange-500',
    text: 'text-white',
    name: 'SQL',
    blocks: ['SELECT * FROM', 'WHERE id =', 'INSERT INTO', 'GROUP BY', 'JOIN']
  },
};
