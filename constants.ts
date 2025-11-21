import { LevelConfig, LeaderboardEntry } from './types';

export const LEVEL_TABLE: LevelConfig[] = [
  { level: 0, expRequired: 0, badgeName: "Newcomer", color: "text-gray-400" },
  { level: 1, expRequired: 100, badgeName: "Awareness", color: "text-amber-700" },
  { level: 2, expRequired: 300, badgeName: "Active", color: "text-amber-600" },
  { level: 3, expRequired: 600, badgeName: "Committed", color: "text-slate-400" },
  { level: 4, expRequired: 1000, badgeName: "Champion", color: "text-slate-500" },
  { level: 5, expRequired: 1500, badgeName: "Leader", color: "text-yellow-500" },
  { level: 6, expRequired: 2100, badgeName: "Ambassador", color: "text-yellow-600" },
  { level: 7, expRequired: 2800, badgeName: "Hero", color: "text-cyan-400" },
  { level: 8, expRequired: 3600, badgeName: "Legend", color: "text-cyan-500" },
  { level: 9, expRequired: 4500, badgeName: "Elite", color: "text-blue-500" },
  { level: 10, expRequired: 5500, badgeName: "Immortal", color: "text-purple-600" },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Aarav Patel", exp: 5600, avatar: "https://picsum.photos/id/1005/50/50", trend: 'same', id: 'u1' },
  { rank: 2, name: "Priya Sharma", exp: 5450, avatar: "https://picsum.photos/id/1011/50/50", trend: 'up', id: 'u2' },
  { rank: 3, name: "Rohan Gupta", exp: 4200, avatar: "https://picsum.photos/id/1025/50/50", trend: 'down', id: 'u3' },
  { rank: 4, name: "Ananya Singh", exp: 3800, avatar: "https://picsum.photos/id/1027/50/50", trend: 'up', id: 'u4' },
  { rank: 5, name: "Vikram Malhotra", exp: 3100, avatar: "https://picsum.photos/id/1006/50/50", trend: 'same', id: 'u5' },
];

export const APP_NAME = "EcoClean";
