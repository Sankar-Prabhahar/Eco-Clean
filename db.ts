
import { User, Submission, LeaderboardEntry, ActionLog } from '../types';

// Storage Keys
const KEYS = {
  USERS: 'ecoclean_db_users',
  SUBMISSIONS: 'ecoclean_db_submissions',
  SESSION: 'ecoclean_db_session_user_id'
};

// Mock Initial Data (Seeding the DB)
const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: "Aarav Patel",
    email: "aarav@example.com",
    role: 'user',
    totalExp: 280,
    level: 2,
    streak: 4,
    rank: 124,
    avatar: "https://picsum.photos/id/1005/200",
    recentActions: []
  },
  {
    id: 'admin',
    name: "snaaaaake babu",
    email: "snake@gmail.com",
    role: 'admin',
    totalExp: 9999,
    level: 50,
    streak: 100,
    rank: 1,
    avatar: "snake.png", 
    password: "snake",
    recentActions: []
  }
];

const SEED_SUBMISSIONS: Submission[] = [
  { id: 'b1', userId: 'u2', userName: 'Priya S.', imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=300', timestamp: Date.now() - 86400000, status: 'pending', location: 'Sector 4 Market (Lat: 28.5355, Lng: 77.3910)', aiConfidence: 0.92, type: 'bin_suggestion', coordinates: { lat: 28.5355, lng: 77.3910 } },
  { id: 'b2', userId: 'u3', userName: 'Rohan G.', imageUrl: 'https://images.unsplash.com/photo-1503596476-1c12a8ab9a86?auto=format&fit=crop&w=300', timestamp: Date.now() - 43200000, status: 'pending', location: 'Central Park Gate 2 (Lat: 28.6139, Lng: 77.2090)', aiConfidence: 0.88, type: 'bin_suggestion', coordinates: { lat: 28.6139, lng: 77.2090 } },
  { id: 'b3', userId: 'u1', userName: 'Aarav Patel', imageUrl: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=300', timestamp: Date.now() - 100000000, status: 'approved', location: 'Metro Station Exit 1', aiConfidence: 0.95, type: 'bin_suggestion', coordinates: { lat: 28.6139, lng: 77.2090 } },
  { id: 'l1', userId: 'u4', userName: 'Ananya Singh', imageUrl: 'https://images.unsplash.com/photo-1530587191325-3fdbfd2d6284?auto=format&fit=crop&w=300', timestamp: Date.now() - 1200000, status: 'pending', location: 'Main Road Junction, Koramangala', aiConfidence: 0.94, type: 'litter_report' },
];

// --- Database Operations ---

const getFromStorage = <T>(key: string, fallback: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored);
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  // --- Initialization ---
  init: () => {
    const storedUsers = localStorage.getItem(KEYS.USERS);
    let users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    // 1. Ensure default seeds exist if empty
    if (users.length === 0) {
      users = [...SEED_USERS];
    } else {
      // 2. Update/Enforce Snake Babu configuration
      // Instead of deleting, we find and update to preserve any history if needed, 
      // but ensure the AVATAR and NAME are forced to the latest config.
      const adminEmail = 'snake@gmail.com';
      const seedAdmin = SEED_USERS.find(u => u.email === adminEmail);
      
      if (seedAdmin) {
        const existingAdminIndex = users.findIndex(u => u.email === adminEmail);
        
        if (existingAdminIndex !== -1) {
          // Update existing admin with latest assets
          users[existingAdminIndex] = {
            ...users[existingAdminIndex],
            name: seedAdmin.name,
            avatar: seedAdmin.avatar,
            password: seedAdmin.password, // Enforce password update
            role: 'admin' // Ensure role stays admin
          };
        } else {
          // Create if missing
          users.push(seedAdmin);
        }
      }
    }
    
    saveToStorage(KEYS.USERS, users);

    if (!localStorage.getItem(KEYS.SUBMISSIONS)) {
      saveToStorage(KEYS.SUBMISSIONS, SEED_SUBMISSIONS);
    }
  },

  // --- User Operations ---
  getUsers: (): User[] => {
    return getFromStorage(KEYS.USERS, SEED_USERS);
  },

  getUserByEmail: (email: string): User | undefined => {
    const users = db.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  getAdmin: (): User | undefined => {
    const users = db.getUsers();
    return users.find(u => u.role === 'admin');
  },

  // Strict Create: Throws if email exists
  createUser: (email: string, name: string, password?: string): User => {
    const users = db.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("User already exists");
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: name,
      email,
      role: 'user',
      totalExp: 0,
      level: 0,
      streak: 0,
      rank: users.length + 1,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
      password: password,
      recentActions: []
    };
    users.push(newUser);
    saveToStorage(KEYS.USERS, users);
    return newUser;
  },

  updateUser: (updatedUser: User) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      saveToStorage(KEYS.USERS, users);
    }
  },

  // --- Session Management ---
  // Strict Login: Returns null if not found or password mismatch
  login: (email: string, password?: string): User | null => {
    const user = db.getUserByEmail(email);
    if (user) {
      // Check password if the user has one (like Snake Babu)
      if (user.password && user.password !== password) {
        return null;
      }
      localStorage.setItem(KEYS.SESSION, user.id);
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(KEYS.SESSION);
  },

  getCurrentSession: (): User | null => {
    const id = localStorage.getItem(KEYS.SESSION);
    if (!id) return null;
    const users = db.getUsers();
    return users.find(u => u.id === id) || null;
  },

  // --- Submission & Bin Database Operations ---
  
  // Core Getter for all submissions (Pending, Approved, Rejected)
  getSubmissions: (): Submission[] => {
    return getFromStorage(KEYS.SUBMISSIONS, SEED_SUBMISSIONS);
  },

  // TRASH BIN DATABASE: Retrieves only active, approved bins
  getVerifiedBins: (): Submission[] => {
    const all = getFromStorage<Submission[]>(KEYS.SUBMISSIONS, SEED_SUBMISSIONS);
    return all.filter(s => s.type === 'bin_suggestion' && s.status === 'approved');
  },

  getBinById: (id: string): Submission | undefined => {
    const bins = db.getVerifiedBins();
    return bins.find(b => b.id === id);
  },

  addSubmission: (submission: Submission) => {
    const subs = db.getSubmissions();
    subs.unshift(submission);
    saveToStorage(KEYS.SUBMISSIONS, subs);
  },

  updateSubmissionStatus: (id: string, status: 'approved' | 'rejected') => {
    const subs = db.getSubmissions();
    const index = subs.findIndex(s => s.id === id);
    if (index !== -1) {
      subs[index].status = status;
      saveToStorage(KEYS.SUBMISSIONS, subs);
    }
  },

  updateBinCoordinates: (id: string, coords: { lat: number, lng: number }) => {
    const subs = db.getSubmissions();
    const index = subs.findIndex(s => s.id === id);
    if (index !== -1) {
      subs[index].coordinates = coords;
      saveToStorage(KEYS.SUBMISSIONS, subs);
    }
  },

  // --- Leaderboard ---
  getLeaderboard: (): LeaderboardEntry[] => {
    const users = db.getUsers().filter(u => u.role === 'user');
    // Sort by EXP desc
    const sorted = users.sort((a, b) => b.totalExp - a.totalExp);
    
    return sorted.map((u, index) => ({
      rank: index + 1,
      name: u.name,
      exp: u.totalExp,
      avatar: u.avatar,
      trend: 'same',
      id: u.id
    }));
  }
};
