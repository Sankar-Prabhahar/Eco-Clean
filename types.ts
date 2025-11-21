
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  totalExp: number;
  level: number;
  streak: number;
  rank: number;
  avatar: string;
  recentActions: ActionLog[];
  password?: string; // Added for specific admin requirement
}

export interface ActionLog {
  id: string;
  type: 'DISPOSAL' | 'REPORT' | 'STREAK_BONUS' | 'SUGGESTION';
  points: number;
  timestamp: number;
  description: string;
}

export interface LevelConfig {
  level: number;
  expRequired: number; // Total accumulated needed
  badgeName: string;
  color: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  exp: number;
  avatar: string;
  trend: 'up' | 'down' | 'same';
  id: string;
}

export interface WasteVerificationResult {
  isWasteAction: boolean;
  confidence: number;
  type: 'bin_disposal' | 'litter_report' | 'not_waste' | 'potential_bin';
  description: string;
  points: number;
}

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  location: string;
  aiConfidence: number;
  type: 'bin_suggestion' | 'litter_report';
  coordinates?: { lat: number; lng: number };
}
