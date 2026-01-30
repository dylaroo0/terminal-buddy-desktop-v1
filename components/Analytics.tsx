import React from 'react';
import { AnalyticsData, SessionData } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Brush } from 'recharts';
import { Target, Zap, Clock, Terminal } from 'lucide-react';

interface AnalyticsProps {
  data: AnalyticsData[];
  sessions: Record<string, SessionData>;
}

// Mock timeline data 
const TIMELINE_DATA = [
    { time: '09:00', javascript: 5, python: 2, sql: 1, bash: 0 },
    { time: '09:15', javascript: 8, python: 4, sql: 2, bash: 0 },
    { time: '09:30', javascript: 12, python: 5, sql: 3, bash: 1 },
    { time: '09:45', javascript: 15, python: 8, sql: 4, bash: 2 },
    { time: '10:00', javascript: 10, python: 12, sql: 6, bash: 3 },
    { time: '10:15', javascript: 18, python: 15, sql: 8, bash: 5 },
    { time: '10:30', javascript: 22, python: 10, sql: 5, bash: 4 },
    { time: '10:45', javascript: 25, python: 8, sql: 4, bash: 6 },
    { time: '11:00', javascript: 20, python: 14, sql: 7, bash: 8 },
    { time: '11:15', javascript: 15, python: 18, sql: 10, bash: 5 },
];

export const Analytics: React.FC<AnalyticsProps> = ({ data, sessions }) => {
  const totalCommands = data.reduce((acc, curr) => acc + curr.commandsRun, 0);
  const totalSuccess = data.reduce((acc, curr) => acc + curr.successful, 0);
  const successRate = totalCommands > 0 ? Math.round((totalSuccess / totalCommands) * 100) : 0;
  
  // Find highest streak
  const maxStreak = Math.max(...data.map(d => d.streakDays), 0);

  // Generate Logbook from Sessions
  const logs = Object.entries(sessions)
    .flatMap(([langId, session]) => 
        session.messages
            .filter(m => m.type === 'input')
            .map(m => ({
                id: m.id,
                language: langId,
                content: m.content,
                timestamp: m.timestamp,
                status: session.messages.find(next => next.timestamp > m.timestamp && next.type === 'error') ? 'error' : 'success'
            }))
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50); // Last 50 commands

  return (
    <div className="h-full flex flex-col p-4 space-y-6 overflow-y-auto text-white custom-scrollbar">
      
      {/* Stats Cards - Vertical Stack for Side Panel */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase">Total Commands</div>
            <div className="text-2xl font-black text-accent-blue">{totalCommands}</div>
          </div>
          <Terminal className="text-slate-600 opacity-50" />
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase">Success Rate</div>
            <div className="text-2xl font-black text-accent-green">{successRate}%</div>
          </div>
           <Target className="text-slate-600 opacity-50" />
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase">Best Streak</div>
            <div className="text-2xl font-black text-accent-yellow">{maxStreak}</div>
          </div>
           <Zap className="text-slate-600 opacity-50" />
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col">
        <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase">Activity Timeline</h3>
        <div className="w-full h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TIMELINE_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorJs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #334155', borderRadius: '4px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="javascript" stackId="1" stroke="#facc15" fill="url(#colorJs)" />
                <Area type="monotone" dataKey="python" stackId="1" stroke="#3b82f6" fill="url(#colorPy)" />
            </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Logbook (Command History) */}
      <div className="flex-1 flex flex-col">
         <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2 uppercase">
            <Clock size={12} className="text-accent-mauve" />
            Recent Log
        </h3>
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden flex-1">
            <div className="overflow-y-auto max-h-[300px] custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No activity yet.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <tbody className="text-xs font-mono">
                            {logs.map(log => (
                                <tr key={log.id} className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                                    <td className="py-2 pl-2 text-slate-500 w-12 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="py-2 w-10 text-center">
                                        <div className={`w-2 h-2 rounded-full mx-auto ${
                                            log.language === 'javascript' ? 'bg-yellow-400' :
                                            log.language === 'python' ? 'bg-blue-400' :
                                            'bg-gray-400'
                                        }`} />
                                    </td>
                                    <td className="py-2 pr-2 text-slate-300 truncate max-w-[120px]" title={log.content}>
                                        {log.content}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};