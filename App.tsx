
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Home, ScanLine, MapPin, User as UserIcon, Award, Trash2, AlertTriangle, Check, Shield, LogOut, PlusCircle, Loader2, XCircle, CheckCircle, QrCode, Printer, Search, X, Info, History, Calendar, Activity, Megaphone, ExternalLink, Crosshair, Edit3, Camera } from 'lucide-react';
import { User, LevelConfig, ActionLog, Submission } from './types';
import { LEVEL_TABLE } from './constants';
import { LevelProgress } from './components/LevelProgress';
import { Leaderboard } from './components/Leaderboard';
import { CameraCapture } from './components/CameraCapture';
import { QRScanner } from './components/QRScanner';
import { verifyWasteImage } from './services/geminiService';
import { db } from './services/db';
import gsap from 'gsap';

// Initialize DB on load
db.init();

// --- Helper Functions ---

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}

// GSAP Page Transition Helper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.fromTo(el.current, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, []);
  return <div ref={el} className="h-full">{children}</div>;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [verifiedBins, setVerifiedBins] = useState<Submission[]>([]);

  // Load Session and Data
  useEffect(() => {
    const sessionUser = db.getCurrentSession();
    if (sessionUser) {
      setUser(sessionUser);
      setIsAuthenticated(true);
    }
    setSubmissions(db.getSubmissions());
    setVerifiedBins(db.getVerifiedBins());
  }, []);

  // --- Auth Logic ---
  const handleLogin = (email: string, password?: string) => {
    const loggedUser = db.login(email, password);
    if (loggedUser) {
      setUser(loggedUser);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleRegister = (email: string, name: string, password?: string) => {
    try {
      const newUser = db.createUser(email, name, password);
      db.login(email, password); // Auto login after create
      setUser(newUser);
      setIsAuthenticated(true);
      return true;
    } catch (e) {
      // If user exists, try to login with the provided password immediately
      // This satisfies "if acc is existing, then direct sign in"
      const loggedUser = db.login(email, password);
      if (loggedUser) {
        setUser(loggedUser);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    db.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserProfile = (name: string, avatar: string) => {
    if (user) {
      const updated = { ...user, name, avatar };
      db.updateUser(updated);
      setUser(updated);
    }
  };

  const getCurrentLevelConfig = (exp: number): LevelConfig => {
    const level = LEVEL_TABLE.slice().reverse().find(l => l.expRequired <= exp);
    return level || LEVEL_TABLE[0];
  };
  
  const getNextLevelConfig = (currentLvl: number): LevelConfig | null => {
    return LEVEL_TABLE.find(l => l.level === currentLvl + 1) || null;
  };

  const addExp = (amount: number, type: ActionLog['type'], description: string) => {
    if (!user) return;
    
    const newExp = user.totalExp + amount;
    const newLevelConfig = getCurrentLevelConfig(newExp);
    const didLevelUp = newLevelConfig.level > user.level;

    const updatedUser: User = {
      ...user,
      totalExp: newExp,
      level: newLevelConfig.level,
      recentActions: [
        { id: Date.now().toString(), type, points: amount, timestamp: Date.now(), description },
        ...user.recentActions
      ]
    };

    db.updateUser(updatedUser);
    setUser(updatedUser);

    if (didLevelUp) {
      gsap.to(".level-up-toast", { y: 0, opacity: 1, duration: 0.5 });
      setTimeout(() => gsap.to(".level-up-toast", { y: -100, opacity: 0 }), 3000);
    }
  };

  const handleSubmission = (submission: Submission) => {
    db.addSubmission(submission);
    setSubmissions(db.getSubmissions());
  };

  const handleAdminAction = (id: string, action: 'approved' | 'rejected') => {
    db.updateSubmissionStatus(id, action);
    setSubmissions(db.getSubmissions());
    setVerifiedBins(db.getVerifiedBins());
  };

  const handleCreateBin = (location: string, coords?: { lat: number, lng: number }): Submission => {
    const newBin: Submission = {
      id: `b-${Date.now()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Admin',
      imageUrl: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=300&q=80', 
      timestamp: Date.now(),
      status: 'approved',
      location: location,
      aiConfidence: 1.0,
      type: 'bin_suggestion',
      coordinates: coords || { lat: 28.6139, lng: 77.2090 }
    };
    db.addSubmission(newBin);
    setSubmissions(db.getSubmissions());
    setVerifiedBins(db.getVerifiedBins());
    return newBin;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <Router>
      <div className={`min-h-screen pb-24 max-w-md mx-auto shadow-2xl border-x border-gray-800 overflow-hidden relative transition-colors duration-500 ${isAdmin ? 'bg-slate-950' : 'bg-slate-50'}`}>
        
        <div className="level-up-toast fixed top-4 left-0 right-0 mx-auto w-64 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-full shadow-xl flex items-center justify-center gap-2 opacity-0 -translate-y-24 z-[60]">
          <Award className="text-yellow-300 animate-pulse" />
          <span className="font-bold">Level Up!</span>
        </div>

        {isAuthenticated && user ? (
          <>
            <header className={`${isAdmin ? 'bg-slate-900 border-b border-slate-800' : 'bg-emerald-600'} text-white p-6 pb-12 rounded-b-3xl shadow-lg relative z-0 transition-all duration-500`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    EcoClean {user.role === 'admin' && <span className="bg-slate-700 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">Admin</span>}
                  </h1>
                  <p className={`${isAdmin ? 'text-slate-400' : 'text-emerald-100'} text-sm`}>Clean locally, compete globally.</p>
                </div>
                <button onClick={logout} className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-red-500/80 transition-colors">
                   <LogOut className="text-white w-5 h-5" />
                </button>
              </div>
            </header>

            <main className="px-4 -mt-8 relative z-10">
              <PageTransition>
                <Routes>
                  <Route path="/" element={user.role === 'admin' ? <Navigate to="/admin" /> : <Dashboard user={user} getNextLevel={getNextLevelConfig} getCurrentLevel={getCurrentLevelConfig} />} />
                  <Route path="/scan" element={<Scanner addExp={addExp} bins={verifiedBins} />} />
                  <Route path="/report" element={<Report user={user} addExp={addExp} submitReport={handleSubmission} />} />
                  <Route path="/suggest-bin" element={<SuggestBin user={user} addExp={addExp} submitBin={handleSubmission} />} />
                  <Route path="/leaderboard" element={<LeaderboardPage user={user} />} />
                  <Route path="/profile" element={<Profile user={user} onUpdateProfile={updateUserProfile} />} />
                  <Route path="/admin" element={user.role === 'admin' ? <AdminDashboard submissions={submissions} onAction={handleAdminAction} onCreateBin={handleCreateBin} /> : <Navigate to="/" />} />
                </Routes>
              </PageTransition>
            </main>

            <nav className={`fixed bottom-0 left-0 right-0 ${isAdmin ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-gray-100'} backdrop-blur border-t flex justify-around py-3 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] max-w-md mx-auto z-50 transition-colors`}>
              {user.role === 'admin' ? (
                <>
                   <NavLink to="/admin" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Shield size={22} />
                    <span className="text-[10px] font-medium">Admin</span>
                  </NavLink>
                   <NavLink to="/profile" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <UserIcon size={22} />
                    <span className="text-[10px] font-medium">Profile</span>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <Home size={22} />
                    <span className="text-[10px] font-medium">Home</span>
                  </NavLink>
                  <NavLink to="/scan" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <div className="bg-emerald-600 text-white p-3 rounded-full -mt-8 shadow-lg border-4 border-slate-50 transform transition hover:scale-110">
                      <ScanLine size={24} />
                    </div>
                    <span className="text-[10px] font-medium">Dispose</span>
                  </NavLink>
                  <NavLink to="/leaderboard" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <Award size={22} />
                    <span className="text-[10px] font-medium">Rank</span>
                  </NavLink>
                  <NavLink to="/profile" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <UserIcon size={22} />
                    <span className="text-[10px] font-medium">Profile</span>
                  </NavLink>
                </>
              )}
            </nav>
          </>
        ) : (
          <AuthPage onLogin={handleLogin} onRegister={handleRegister} />
        )}
      </div>
    </Router>
  );
}

// --- Auth Component ---

const AuthPage = ({ onLogin, onRegister }: { onLogin: (e: string, p?: string) => boolean, onRegister: (e: string, n: string, p?: string) => boolean }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.from(formRef.current, { opacity: 0, y: 30, duration: 0.8, ease: "power3.out" });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      const success = onLogin(email, password);
      if (!success) {
        setError("Account not found or incorrect credentials. Please check your details.");
      }
    } else {
      const success = onRegister(email, name, password);
      if (!success) {
        // This message will now only appear if login ALSO fails (e.g. wrong password for existing account)
        setError("Email already registered with a different password. Please login.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center p-6">
      <div ref={formRef} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
        <h2 className="text-3xl font-bold text-gray-800 mb-1">{isLogin ? 'Welcome Back' : 'Join the Movement'}</h2>
        <p className="text-gray-500 text-sm mb-8">EcoClean India</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
            <XCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
             <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" 
                placeholder="John Doe" 
                required 
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Email Address</label>
            <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" 
                placeholder="you@example.com" 
                required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Password</label>
            <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" 
                placeholder="••••••••" 
                required 
            />
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-transform active:scale-95 mt-4 flex items-center justify-center gap-2">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-sm text-emerald-600 hover:underline font-medium">
            {isLogin ? "New here? Create account" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Dashboard Component ---

const Dashboard = ({ user, getCurrentLevel, getNextLevel }: { user: User, getCurrentLevel: (e: number) => LevelConfig, getNextLevel: (l: number) => LevelConfig | null }) => {
  const currentLevelConfig = getCurrentLevel(user.totalExp);
  const nextLevelConfig = getNextLevel(user.level);
  const [adminUser, setAdminUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    setAdminUser(db.getAdmin());
  }, []);

  useEffect(() => {
    gsap.from(".dashboard-item", {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.4,
      ease: "power2.out",
      delay: 0.2
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="dashboard-item bg-white rounded-2xl p-6 shadow-sm text-center">
        <LevelProgress currentExp={user.totalExp} currentLevel={currentLevelConfig} nextLevel={nextLevelConfig} />
        
        <div className="grid grid-cols-3 gap-4 mt-6 border-t border-gray-100 pt-4">
          <div>
            <p className="text-2xl font-bold text-emerald-600">{user.streak}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Day Streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{user.totalExp}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total EXP</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">#{user.rank}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">City Rank</p>
          </div>
        </div>
      </div>

      {/* District Representative Card */}
      {adminUser && (
        <div className="dashboard-item bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-4 text-white shadow-md flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
                <Shield size={100} />
            </div>
            <img 
                src={adminUser.avatar} 
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${adminUser.name}&background=random`; }}
                alt="MLA" 
                className="w-16 h-16 rounded-full border-2 border-indigo-300 object-cover shrink-0 z-10"
            />
            <div className="relative z-10">
                <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider mb-1">Your District Representative</p>
                <h3 className="text-lg font-bold leading-tight">{adminUser.name}</h3>
                <p className="text-xs text-indigo-200 mt-1">Municipal Administrator</p>
                <div className="flex items-center gap-1 mt-2 text-[10px] bg-indigo-700/50 w-fit px-2 py-0.5 rounded-full border border-indigo-600">
                    <CheckCircle size={10} /> Verified Official
                </div>
            </div>
        </div>
      )}

      <div className="dashboard-item grid grid-cols-2 gap-4">
        <NavLink to="/scan" className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-md active:scale-95 transition-transform group relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <Trash2 size={80} />
          </div>
          <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform relative z-10">
            <Trash2 size={20} />
          </div>
          <h3 className="font-bold relative z-10">Dispose Trash</h3>
          <p className="text-xs text-emerald-100 mt-1 relative z-10">Scan QR & Earn 10 PTS</p>
        </NavLink>
        <NavLink to="/report" className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-md active:scale-95 transition-transform group relative overflow-hidden">
           <div className="absolute -right-2 -bottom-2 opacity-10">
            <AlertTriangle size={80} />
          </div>
          <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform relative z-10">
            <AlertTriangle size={20} />
          </div>
          <h3 className="font-bold relative z-10">Report Litter</h3>
          <p className="text-xs text-orange-100 mt-1 relative z-10">Public areas & Earn 15 PTS</p>
        </NavLink>
      </div>

      <NavLink to="/suggest-bin" className="dashboard-item block bg-indigo-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-500">
          <MapPin size={100} />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <PlusCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold">Suggest New Bin</h3>
            <p className="text-indigo-100 text-xs">Found a public bin? Map it for rewards!</p>
          </div>
        </div>
      </NavLink>

      <div className="dashboard-item bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
        {user.recentActions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No activity yet. Start cleaning!</p>
        ) : (
          <div className="space-y-4">
            {user.recentActions.slice(0, 3).map(action => (
              <div key={action.id} className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${action.type === 'DISPOSAL' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {action.type === 'DISPOSAL' ? <Trash2 size={14} /> : <AlertTriangle size={14} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{action.description}</p>
                    <p className="text-[10px] text-gray-400">{new Date(action.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold text-sm">+{action.points} EXP</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Feature Components below are the same as previously defined...
// We re-render the App container above, feature components don't need changes for this request
// except Scanner was updated in previous turn.
// I will keep the existing implementation of Scanner, Report, SuggestBin, AdminDashboard, LeaderboardPage
// but will fully output Profile to show customization changes.

const Scanner = ({ addExp, bins }: { addExp: (amount: number, type: 'DISPOSAL' | 'REPORT', desc: string) => void, bins: Submission[] }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedBin, setScannedBin] = useState<Submission | null>(null);
  
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const navigate = useNavigate();

  const handleQRSuccess = (code: string) => {
    if (code.startsWith("ecoclean:bin:")) {
      const binId = code.split(":")[2];
      const bin = bins.find(b => b.id === binId);
      
      if (bin) {
        setScannedBin(bin);
        setShowQRScanner(false);
        verifyLocation(bin);
      } else {
        alert("Error: This QR code belongs to an invalid or unapproved bin.");
        setShowQRScanner(false);
      }
    } else {
      alert("Invalid QR Code Format. Please scan an official EcoClean bin.");
      setShowQRScanner(false);
    }
  };

  const verifyLocation = (bin: Submission) => {
    setVerifyingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setVerifyingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });
        
        if (!bin.coordinates) {
            setVerifyingLocation(false);
            setStep(2);
            return;
        }

        const dist = getDistanceFromLatLonInKm(userLat, userLng, bin.coordinates.lat, bin.coordinates.lng);
        
        if (dist < 5) {
           setVerifyingLocation(false);
           setStep(2); 
        } else {
           setVerifyingLocation(false);
           setLocationError(`You are too far from the bin (${dist.toFixed(2)} km away). Please be physically present.`);
        }
      },
      (error) => {
        console.error("Geo Error:", error);
        setVerifyingLocation(false);
        setLocationError("Unable to retrieve your location. Please enable GPS.");
      }
    );
  };

  const forceLocationMatch = () => {
      setVerifyingLocation(false);
      setStep(2);
  };

  const syncBinLocation = () => {
    if(scannedBin && userLocation) {
        if(window.confirm("ADMIN: Are you sure you want to move this bin to your current location?")) {
            db.updateBinCoordinates(scannedBin.id, userLocation);
            alert("Bin location updated. Verifying again...");
            setStep(2);
        }
    }
  };

  const handleCapture = async (base64: string) => {
    setIsAnalyzing(true);
    setResult(null);
    
    const verification = await verifyWasteImage(base64, 'disposal');
    
    setIsAnalyzing(false);

    if (verification.isWasteAction) {
      setResult('success');
      setTimeout(() => {
        addExp(verification.points, 'DISPOSAL', `Bin Disposal @ ${scannedBin?.location || 'Unknown'}`);
        setStep(3); 
      }, 1500);
    } else {
      setResult('error');
      alert(verification.description || "Image does not match requirement. Please try again.");
    }
  };

  if (step === 3) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm flex flex-col items-center min-h-[60vh] justify-center animate-pop-in">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Award className="w-12 h-12 text-emerald-600 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Great Job!</h2>
        <p className="text-gray-600 mb-6">You've helped keep India clean.</p>
        <div className="text-4xl font-black text-emerald-600 mb-8">+10 EXP</div>
        <button onClick={() => navigate('/')} className="bg-emerald-600 text-white w-full py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition-transform">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showQRScanner && <QRScanner onScanSuccess={handleQRSuccess} onClose={() => setShowQRScanner(false)} bins={bins} />}
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${step >= 1 ? 'bg-emerald-600' : 'bg-gray-300'}`}>1</div>
          <h2 className="font-bold text-lg">Scan Bin QR</h2>
        </div>

        {step === 1 && !verifyingLocation && !locationError && (
          <>
            <button onClick={() => setShowQRScanner(true)} className="w-full py-12 border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-emerald-100 transition-colors group">
              <div className="bg-emerald-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                <ScanLine size={32} className="text-emerald-600" />
              </div>
              <span className="font-semibold text-emerald-700">Tap to Scan QR Code</span>
            </button>
            <p className="text-xs text-gray-400 text-center mt-4 px-6 leading-relaxed">
              Locate an official EcoClean bin and scan the QR code on the front panel to start the disposal process.
            </p>
          </>
        )}

        {verifyingLocation && (
            <div className="w-full py-8 bg-blue-50 rounded-xl flex flex-col items-center justify-center gap-3 border border-blue-100">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="font-semibold text-blue-700">Verifying GPS Location...</span>
            </div>
        )}

        {locationError && (
            <div className="w-full p-6 bg-red-50 rounded-xl border border-red-100 text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="font-bold text-red-800 mb-1">Location Mismatch</h3>
                <p className="text-xs text-red-600 mb-4">{locationError}</p>
                
                {scannedBin?.coordinates && userLocation && (
                    <div className="text-[10px] text-gray-500 mb-4 bg-gray-100 p-2 rounded text-left font-mono">
                        <p>Bin: {scannedBin.coordinates.lat.toFixed(4)}, {scannedBin.coordinates.lng.toFixed(4)}</p>
                        <p>You: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button onClick={() => setShowQRScanner(true)} className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600">Retry</button>
                        <button onClick={forceLocationMatch} className="flex-1 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold">Debug: Teleport</button>
                    </div>
                    <button onClick={syncBinLocation} className="w-full py-2 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-200">
                        <Crosshair size={12} /> ADMIN: Sync Bin to My Location
                    </button>
                </div>
            </div>
        )}

        {step > 1 && (
           <div className="flex flex-col gap-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
             <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle size={20} /> QR Code Verified
             </div>
             {scannedBin && (
               <div className="flex items-center gap-2 text-sm text-emerald-600 pl-7">
                 <MapPin size={14} /> {scannedBin.location}
               </div>
             )}
           </div>
        )}
      </div>

      {step === 2 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-emerald-600">2</div>
            <h2 className="font-bold text-lg">Proof of Disposal</h2>
          </div>
          <CameraCapture 
            onCapture={handleCapture} 
            isAnalyzing={isAnalyzing} 
            analysisResult={result} 
            label="Capture Trash in Bin"
          />
          <p className="text-xs text-gray-400 mt-3 text-center">
            AI checks for: Trash entering bin, Clean environment
          </p>
        </div>
      )}
    </div>
  );
};

const Report = ({ user, addExp, submitReport }: { user: User, addExp: (amount: number, type: 'DISPOSAL' | 'REPORT', desc: string) => void, submitReport: Function }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Detecting location...");
  const navigate = useNavigate();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGpsCoords({ lat: latitude, lng: longitude });
          setLocationStatus(`Detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (error) => {
          console.error("Location error", error);
          setLocationStatus("GPS unavailable. Using estimate.");
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleCapture = async (base64: string) => {
    setIsAnalyzing(true);
    const verification = await verifyWasteImage(base64, 'report');
    setIsAnalyzing(false);

    if (verification.isWasteAction) {
      setResult('success');
      
      const reportSubmission: Submission = {
        id: `r-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        imageUrl: base64,
        timestamp: Date.now(),
        status: 'pending',
        location: locationStatus.includes("Detected") ? `Litter Report (${locationStatus})` : "Public Spot (No GPS)",
        aiConfidence: verification.confidence,
        type: 'litter_report',
        coordinates: gpsCoords || undefined
      };

      submitReport(reportSubmission);

      setTimeout(() => {
        addExp(verification.points, 'REPORT', "Litter Reported");
        alert(`Report Submitted! +${verification.points} EXP. Sent to Admin for Cleanup.`);
        navigate('/');
      }, 1500);
    } else {
      setResult('error');
      alert("Could not identify litter in this image. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
        <h2 className="font-bold text-amber-800 flex items-center gap-2">
          <AlertTriangle size={20} /> Report Public Litter
        </h2>
        <p className="text-amber-700 text-sm mt-1 mb-3">
          Help authorities identify hotspots. Upload a photo of scattered trash in public spaces.
        </p>
        <div className="flex items-center gap-2 text-xs font-mono bg-amber-100/50 p-2 rounded text-amber-800">
            <MapPin size={14} /> {locationStatus}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        <CameraCapture 
          onCapture={handleCapture} 
          isAnalyzing={isAnalyzing} 
          analysisResult={result} 
          label="Photograph Litter"
        />
      </div>
    </div>
  );
};

const SuggestBin = ({ user, addExp, submitBin }: { user: User, addExp: Function, submitBin: Function }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Detecting location...");
  const navigate = useNavigate();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGpsCoords({ lat: latitude, lng: longitude });
          setLocationStatus(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (error) => {
          console.error("Location error", error);
          setLocationStatus("GPS unavailable");
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleCapture = async (base64: string) => {
    setIsAnalyzing(true);
    const verification = await verifyWasteImage(base64, 'bin_check');
    setIsAnalyzing(false);

    if (verification.isWasteAction) {
      setResult('success');
      
      const newSubmission: Submission = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        imageUrl: base64,
        timestamp: Date.now(),
        status: 'pending',
        location: gpsCoords ? `Bin Loc: ${locationStatus}` : "Suggested Bin (No GPS)",
        aiConfidence: verification.confidence,
        type: 'bin_suggestion',
        coordinates: gpsCoords || undefined
      };

      submitBin(newSubmission);

      setTimeout(() => {
        addExp(verification.points, 'SUGGESTION', "New Bin Suggested");
        alert(`Bin Suggestion Submitted! +${verification.points} EXP. Waiting for Admin Approval.`);
        navigate('/');
      }, 1500);
    } else {
      setResult('error');
      alert("AI could not confirm this is a permanent trash bin.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
        <h2 className="font-bold text-indigo-800 flex items-center gap-2">
          <MapPin size={20} /> Map New Infrastructure
        </h2>
        <p className="text-indigo-700 text-sm mt-1 mb-3">
          Spot a public bin without a QR code? Submit it here. We captured your location to generate the QR code later.
        </p>
        <div className="flex items-center gap-2 text-xs font-mono bg-indigo-100/50 p-2 rounded text-indigo-800">
            <MapPin size={14} /> {gpsCoords ? `GPS Locked: ${locationStatus}` : locationStatus}
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <CameraCapture 
          onCapture={handleCapture} 
          isAnalyzing={isAnalyzing} 
          analysisResult={result} 
          label="Capture Public Bin"
        />
      </div>
    </div>
  );
};

const AdminDashboard = ({ submissions, onAction, onCreateBin }: { 
  submissions: Submission[], 
  onAction: (id: string, action: 'approved' | 'rejected') => void,
  onCreateBin: (location: string, coords?: { lat: number, lng: number }) => Submission
}) => {
  const [activeTab, setActiveTab] = useState<'verify' | 'qr'>('verify');
  const [filterType, setFilterType] = useState<'all' | 'bin' | 'litter'>('all');
  const [qrBin, setQrBin] = useState<Submission | null>(null);
  const [viewBin, setViewBin] = useState<Submission | null>(null);
  const [newBinLocation, setNewBinLocation] = useState("");
  const [adminLocation, setAdminLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const pendingSubmissions = submissions.filter(s => {
    if (s.status !== 'pending') return false;
    if (filterType === 'bin') return s.type === 'bin_suggestion';
    if (filterType === 'litter') return s.type === 'litter_report';
    return true;
  });
  
  const approvedSubmissions = submissions.filter(s => s.status === 'approved' && s.type === 'bin_suggestion');

  useEffect(() => {
    if (activeTab === 'qr' && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setAdminLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => console.error("Admin geo error", error),
            { enableHighAccuracy: true }
        );
    }
  }, [activeTab]);

  useEffect(() => {
    gsap.fromTo(".admin-card", 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, ease: "power2.out" }
    );
  }, [activeTab, submissions, filterType]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-700">
        <h2 className="text-xl font-bold text-gray-100 mb-2 flex items-center gap-2">
          <Shield className="text-emerald-400" /> Admin Portal
        </h2>
        <p className="text-gray-400 text-sm">Manage infrastructure and verifications.</p>
      </div>

      <div className="flex p-1 bg-slate-800 border border-slate-700 rounded-xl">
        <button 
          onClick={() => setActiveTab('verify')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'verify' ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Verifications
        </button>
        <button 
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'qr' ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
        >
          QR Management
        </button>
      </div>
      
      <div className="space-y-4 min-h-[300px]">
        {activeTab === 'verify' && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${filterType === 'all' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-800 text-gray-400 border-slate-700'}`}>All Pending</button>
              <button onClick={() => setFilterType('bin')} className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${filterType === 'bin' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800 text-gray-400 border-slate-700'}`}>Bin Suggestions</button>
              <button onClick={() => setFilterType('litter')} className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${filterType === 'litter' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-800 text-gray-400 border-slate-700'}`}>Litter Reports</button>
            </div>

            {pendingSubmissions.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center opacity-50 text-gray-500">
                 <CheckCircle size={48} className="mb-2" />
                 <p>All caught up! No pending items.</p>
              </div>
            )}
            {pendingSubmissions.map(sub => (
              <div key={sub.id} className="admin-card bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-700">
                <div className="relative h-48 bg-slate-900">
                  <img src={sub.imageUrl} alt="Submission" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                    Confidence: {(sub.aiConfidence * 100).toFixed(0)}%
                  </div>
                  <div className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded-md font-bold shadow-sm ${sub.type === 'bin_suggestion' ? 'bg-indigo-600' : 'bg-amber-600'}`}>
                    {sub.type === 'bin_suggestion' ? 'Bin Suggestion' : 'Litter Report'}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-200">{sub.location}</h4>
                      <p className="text-xs text-gray-400">Submitted by {sub.userName}</p>
                      {sub.coordinates && (
                          <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${sub.coordinates.lat},${sub.coordinates.lng}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 mt-1"
                          >
                              <MapPin size={10} /> View on Map
                          </a>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{new Date(sub.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => onAction(sub.id, 'rejected')}
                      className="flex-1 py-2 border border-red-900/50 bg-red-900/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/40"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => onAction(sub.id, 'approved')}
                      className={`flex-1 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-md ${sub.type === 'bin_suggestion' ? 'bg-emerald-600' : 'bg-amber-600'}`}
                    >
                      {sub.type === 'bin_suggestion' ? 'Approve Bin' : 'Dispatch Cleanup'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'qr' && (
          <>
            <div className="bg-slate-800 p-5 rounded-2xl border border-emerald-900/30 mb-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <PlusCircle size={16} className="text-emerald-500" /> Generate New Bin QR
                  </h3>
                  {adminLocation ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded-full border border-emerald-800">
                          <Crosshair size={12} /> GPS Locked
                      </div>
                  ) : (
                       <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-800">
                          <Loader2 size={12} className="animate-spin" /> Locating...
                      </div>
                  )}
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newBinLocation}
                  onChange={(e) => setNewBinLocation(e.target.value)}
                  placeholder="Enter location (e.g. Sector 4 Park)..." 
                  className="flex-grow px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-900 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500"
                />
                <button 
                  onClick={() => {
                    if(newBinLocation.trim()) {
                      const bin = onCreateBin(newBinLocation, adminLocation || undefined);
                      setQrBin(bin);
                      setNewBinLocation("");
                    }
                  }}
                  disabled={!newBinLocation.trim()}
                  className="bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 active:scale-95 transition-all whitespace-nowrap flex items-center gap-2"
                >
                  <QrCode size={16} /> Generate
                </button>
              </div>
              {!adminLocation && (
                  <p className="text-[10px] text-amber-500 mt-2">
                      * Please allow location access to tag this bin with accurate GPS coordinates.
                  </p>
              )}
            </div>

            {approvedSubmissions.length === 0 && (
               <div className="text-center py-12 flex flex-col items-center opacity-50 text-gray-500">
                 <Search size={48} className="mb-2" />
                 <p>No active bins found.</p>
              </div>
            )}
            {approvedSubmissions.map(sub => (
               <div key={sub.id} className="admin-card bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-700 flex items-center gap-4">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-700">
                    <QrCode size={48} className="text-emerald-500" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-gray-200 text-sm">{sub.location}</h4>
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle size={10} /> Active & Verified
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">ID: {sub.id.toUpperCase()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-full transition-colors" 
                      title="View Details"
                      onClick={() => setViewBin(sub)}
                    >
                      <Info size={20} />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/30 rounded-full transition-colors" 
                      title="Generate & Print QR"
                      onClick={() => setQrBin(sub)}
                    >
                      <Printer size={20} />
                    </button>
                  </div>
               </div>
            ))}
          </>
        )}
      </div>

      {viewBin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewBin(null)}>
            <div 
                className="bg-slate-800 rounded-3xl p-0 w-full max-w-md shadow-2xl border border-slate-700 relative overflow-hidden max-h-[80vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <div className="h-48 relative shrink-0">
                    <img src={viewBin.imageUrl} className="w-full h-full object-cover" alt="Bin Location" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <button onClick={() => setViewBin(null)} className="absolute top-4 right-4 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 backdrop-blur-sm transition-colors">
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-6 text-white">
                        <h3 className="text-xl font-bold">{viewBin.location}</h3>
                        <p className="text-xs opacity-90 text-emerald-200">ID: {viewBin.id.toUpperCase()}</p>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto text-gray-300">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-emerald-900/20 p-3 rounded-xl border border-emerald-900/50">
                            <p className="text-xs text-emerald-400 uppercase font-bold mb-1">Status</p>
                            <div className="flex items-center gap-2 text-emerald-200 font-semibold">
                                <CheckCircle size={18} /> Active
                            </div>
                        </div>
                        <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-900/50">
                            <p className="text-xs text-blue-400 uppercase font-bold mb-1">Confidence</p>
                            <div className="flex items-center gap-2 text-blue-200 font-semibold">
                                <Activity size={18} /> {(viewBin.aiConfidence * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <UserIcon size={18} className="text-slate-500" />
                            <span>Added by <span className="font-semibold text-gray-200">{viewBin.userName}</span></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <Calendar size={18} className="text-slate-500" />
                            <span>Registered on {new Date(viewBin.timestamp).toLocaleDateString()}</span>
                        </div>
                        {viewBin.coordinates && (
                          <div className="flex items-center gap-3 text-sm text-gray-400 bg-slate-900 p-2 rounded-lg border border-slate-700">
                              <MapPin size={18} className="text-slate-500" />
                              <div className="flex flex-col">
                                <span className="font-mono text-xs text-gray-500">
                                  LAT: {viewBin.coordinates.lat.toFixed(6)}<br/>
                                  LNG: {viewBin.coordinates.lng.toFixed(6)}
                                </span>
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${viewBin.coordinates.lat},${viewBin.coordinates.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-400 hover:underline text-xs font-bold mt-1 flex items-center gap-1"
                                >
                                  Open in Maps <ExternalLink size={10} />
                                </a>
                              </div>
                          </div>
                        )}
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-200 mb-3 flex items-center gap-2">
                            <History size={18} /> Maintenance Log
                        </h4>
                        <div className="border-l-2 border-slate-700 pl-4 space-y-6">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
                                <p className="text-sm font-semibold text-gray-200">Bin Emptied</p>
                                <p className="text-xs text-gray-500">Today, 9:00 AM • Municipal Crew</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-700 bg-slate-900 flex gap-3 shrink-0">
                    <button onClick={() => { setViewBin(null); setQrBin(viewBin); }} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-md text-sm hover:bg-emerald-700 transition-colors">
                        Print QR Code
                    </button>
                </div>
            </div>
        </div>
      )}

      {qrBin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setQrBin(null)}>
          <div 
            className="bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-700 relative overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
             
             <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-100">Generate QR Code</h3>
                  <p className="text-xs text-gray-400">Official EcoClean Bin Identifier</p>
                </div>
                <button onClick={() => setQrBin(null)} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                  <X size={24} className="text-gray-400" />
                </button>
             </div>

             <div className="flex flex-col items-center mb-6">
                <div className="bg-white p-3 rounded-xl border-4 border-slate-700 shadow-black/50 shadow-lg mb-4">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ecoclean:bin:${qrBin.id}`} 
                    alt="QR Code" 
                    className="w-48 h-48 object-contain mix-blend-multiply"
                  />
                </div>
                <div className="bg-emerald-900/50 text-emerald-400 px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider border border-emerald-900">
                  ID: {qrBin.id.toUpperCase()}
                </div>
             </div>

             <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-300 bg-slate-900 p-3 rounded-lg border border-slate-700">
                  <MapPin size={16} className="text-emerald-500 shrink-0" />
                  <span className="truncate font-medium">{qrBin.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300 bg-slate-900 p-3 rounded-lg border border-slate-700">
                   <UserIcon size={16} className="text-emerald-500 shrink-0" />
                   <span>Status: Active</span>
                </div>
             </div>

             <button 
               onClick={() => {
                 alert(`Printing QR Code for Bin #${qrBin.id}`);
                 setQrBin(null);
               }} 
               className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/50 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <Printer size={20} />
               Print Label
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const LeaderboardPage = ({ user }: { user: User }) => {
  const entries = db.getLeaderboard();
  
  const userEntry = {
    rank: user.rank,
    name: user.name,
    exp: user.totalExp,
    avatar: user.avatar,
    trend: 'same' as const,
    id: user.id
  };

  return (
    <div className="space-y-6 pb-10">
      <Leaderboard entries={entries} currentUserEntry={userEntry} />
      
      <div className="bg-emerald-900 text-white p-4 rounded-xl flex items-center shadow-lg">
        <div className="font-bold w-8 text-center">#{user.rank}</div>
        <img src={user.avatar} alt="You" className="w-10 h-10 rounded-full border-2 border-emerald-500 mx-3" />
        <div className="flex-grow">
          <div className="font-bold">You</div>
          <div className="text-xs text-emerald-300">{user.totalExp} EXP</div>
        </div>
        <div className="text-xs bg-emerald-800 px-2 py-1 rounded">Top 15%</div>
      </div>
    </div>
  );
};

const Profile = ({ user, onUpdateProfile }: { user: User, onUpdateProfile: (n: string, a: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar);

  const handleSave = () => {
    onUpdateProfile(editName, editAvatar);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm text-center relative">
      {isEditing && (
         <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
           <X size={20} />
         </button>
      )}
      
      <div className="relative inline-block group">
        <img src={isEditing ? editAvatar : user.avatar} alt={user.name} className="w-24 h-24 rounded-full border-4 border-white shadow-md mx-auto object-cover" />
        {isEditing ? (
            <div className="mt-2">
                <label className="text-xs font-bold text-gray-500 block mb-1">Avatar URL</label>
                <input 
                    type="text" 
                    value={editAvatar} 
                    onChange={e => setEditAvatar(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 w-full mb-2"
                />
            </div>
        ) : (
            <div className="absolute bottom-0 right-0 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
                Lvl {user.level}
            </div>
        )}
      </div>

      {isEditing ? (
          <div className="mt-4">
             <label className="text-xs font-bold text-gray-500 block mb-1">Display Name</label>
             <input 
                type="text" 
                value={editName} 
                onChange={e => setEditName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-bold text-center text-gray-800"
             />
             <button onClick={handleSave} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-md active:scale-95 transition-transform">
                Save Changes
             </button>
          </div>
      ) : (
          <>
             <h2 className="text-xl font-bold mt-4 flex items-center justify-center gap-2">
                {user.name}
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                    <Edit3 size={16} />
                </button>
             </h2>
             <p className={`text-sm font-medium ${user.role === 'admin' ? 'text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block mt-1' : 'text-emerald-600'}`}>
                {user.role === 'admin' ? 'Municipal Administrator' : 'Eco-Warrior'}
             </p>
             <p className="text-gray-500 text-xs mt-1">Joined Nov 2025</p>
          </>
      )}
      
      <div className="mt-6 text-left">
        <h3 className="font-bold text-gray-800 mb-3">Badges</h3>
        <div className="flex gap-3 flex-wrap">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600" title="Early Adopter">
            <Award size={20} />
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600" title="Recycler">
             <Trash2 size={20} />
          </div>
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600" title="Scout">
             <MapPin size={20} />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-50">
        <NavLink to="/suggest-bin" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
           <span className="text-sm font-medium text-gray-700">Suggest Bin Location</span>
           <PlusCircle size={16} className="text-gray-400" />
        </NavLink>
      </div>
    </div>
  );
}

export default App;
