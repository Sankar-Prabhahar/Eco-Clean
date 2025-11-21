import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUserEntry }) => {
  const [period, setPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-500 font-bold w-5 text-center">{rank}</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 bg-emerald-600 text-white">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5" /> Leaderboard
        </h2>
        <p className="text-emerald-100 text-sm mt-1">Compete with your community</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['Daily', 'Weekly', 'Monthly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              period === p 
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {entries.map((entry) => (
          <div 
            key={entry.id} 
            className={`flex items-center p-4 ${entry.id === currentUserEntry?.id ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
          >
            <div className="flex-shrink-0 mr-4 w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>
            <img 
              src={entry.avatar} 
              alt={entry.name} 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm mr-3 object-cover"
            />
            <div className="flex-grow">
              <h3 className="font-semibold text-gray-800 text-sm">{entry.name}</h3>
              <p className="text-xs text-gray-500">{entry.exp} EXP</p>
            </div>
            <div className="flex items-center gap-1">
               {getTrendIcon(entry.trend)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
