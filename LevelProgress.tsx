import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { LevelConfig } from '../types';

interface LevelProgressProps {
  currentExp: number;
  currentLevel: LevelConfig;
  nextLevel: LevelConfig | null;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ currentExp, currentLevel, nextLevel }) => {
  const prevLimit = currentLevel.expRequired;
  const nextLimit = nextLevel ? nextLevel.expRequired : currentExp * 1.2;
  
  const levelProgressExp = currentExp - prevLimit;
  const levelRange = nextLimit - prevLimit;
  
  // Sanity check for div by zero
  const percent = levelRange > 0 ? (levelProgressExp / levelRange) * 100 : 100;
  
  const data = [
    { name: 'Progress', value: percent },
    { name: 'Remaining', value: 100 - percent },
  ];

  const COLORS = ['#22c55e', '#e2e8f0']; // Green-500, Slate-200

  return (
    <div className="relative w-40 h-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={75}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold text-slate-800">{currentLevel.level}</span>
        <span className={`text-xs font-medium uppercase tracking-wide ${currentLevel.color}`}>
          {currentLevel.badgeName}
        </span>
      </div>
    </div>
  );
};
