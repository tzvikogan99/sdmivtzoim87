import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  Database, Shield, User, LogOut, Key, Mail, Lock, Plus, Trash2, Eye,
  Activity, Server, Filter, Search, CheckCircle, AlertCircle, RefreshCw,
  Layers, FileText, Code, Tag, Clock, Globe, Copy, Check, Terminal, UserPlus,
  LogIn, Sparkles, AlertTriangle, X
} from 'lucide-react';

// Safe retrieval of global environment configs
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
      apiKey: "demo-api-key",
      authDomain: "demo-project.firebaseapp.com",
      projectId: "demo-project",
      storageBucket: "demo-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:demo"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fullstack-web-app';

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'database' | 'profile'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  
  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Firestore Data State
  const [records, setRecords] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Form State for creating new entry
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  // Database Filter & Inspection State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedRecordForInspection, setSelectedRecordForInspection] = useState(null);

  // Notification Banner State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // If no active auth session, fall back to anonymous auth for seamless preview
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser?.displayName) {
        setDisplayNameInput(currentUser.displayName);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLoadingRecords(false);
      return;
    }

    setLoadingRecords(true);

    // Rule 1 & 2: Use strict public path & simple query
    const publicRecordsRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_notes');
    
    const unsubscribeRecords = onSnapshot(
      publicRecordsRef,
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((doc) => {
          fetched.push({
            id: doc.id,
            ...doc.data()
          });
        });
        // Sort in memory (Rule 2: avoid orderBy in firestore queries)
        fetched.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setRecords(fetched);
        setLoadingRecords(false);
      },
      (error) => {
        console.error("Error listening to public records:", error);
        setLoadingRecords(false);
        showToast("Error fetching database records", "error");
      }
    );

    // Profile listener from private user path
    const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubscribeProfile = onSnapshot(
      profileDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      },
      (error) => {
        console.error("Error listening to profile:", error);
      }
    );

    return () => {
      unsubscribeRecords();
      unsubscribeProfile();
    };
  }, [user]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!email || !password) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayNameInput) {
        await updateProfile(userCredential.user, { displayName: displayNameInput });
      }
      setAuthSuccess('Account created successfully!');
      setEmail('');
      setPassword('');
      showToast('Welcome! Account created successfully.');
    } catch (err) {
      console.error("Sign up error:", err);
      setAuthError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthSuccess('Logged in successfully!');
      setEmail('');
      setPassword('');
      showToast('Logged in successfully.');
    } catch (err) {
      console.error("Sign in error:", err);
      setAuthError('Invalid email or password.');
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setAuthError('');
      await signInAnonymously(auth);
      showToast('Signed in as Guest/Demo user');
    } catch (err) {
      setAuthError('Failed to sign in anonymously');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Re-initialize as anonymous so the public UI stays previewable
      await signInAnonymously(auth);
      showToast('Signed out successfully.');
    } catch (err) {
      showToast('Failed to sign out', 'error');
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Title and Content are required.', 'error');
      return;
    }

    if (!user) {
      showToast('You must be signed in to create an entry.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const newRecord = {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        authorId: user.uid,
        authorEmail: user.email || 'Anonymous / Guest User',
        authorName: user.displayName || userProfile?.displayName || 'User',
        createdAt: serverTimestamp(),
        isoDate: new Date().toISOString()
      };

      const publicRecordsRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_notes');
      await addDoc(publicRecordsRef, newRecord);

      setTitle('');
      setContent('');
      setCategory('General');
      setPriority('Medium');
      showToast('Record saved to Firestore!');
    } catch (err) {
      console.error("Error creating record:", err);
      showToast('Failed to save record to database.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (recordId, authorId) => {
    if (!user) return;
    
    // Safety check - allow users to delete their own records or if admin
    if (authorId !== user.uid) {
      showToast('You can only delete records created by your account.', 'error');
      return;
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_notes', recordId);
      await deleteDoc(docRef);
      showToast('Record deleted from database.');
      if (selectedRecordForInspection?.id === recordId) {
        setSelectedRecordForInspection(null);
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      showToast('Failed to delete record.', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (displayNameInput.trim()) {
        await updateProfile(user, { displayName: displayNameInput });
      }

      const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(profileDocRef, {
        displayName: displayNameInput,
        updatedAt: new Date().toISOString(),
        email: user.email || 'Anonymous',
        role: 'Standard User'
      }, { merge: true });

      showToast('Profile updated successfully!');
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast('Failed to update profile.', 'error');
    }
  };

  const userRecords = useMemo(() => {
    if (!user) return [];
    return records.filter(r => r.authorId === user.uid);
  }, [records, user]);

  const filteredDatabaseRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = 
        (record.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.authorEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.authorId || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || record.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [records, searchTerm, categoryFilter]);

  const categoriesList = ['All', 'General', 'Work', 'Ideas', 'Personal', 'System'];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
          <p className="text-slate-400 font-medium">Initializing Security & Database Services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all transform animate-bounce ${
          toast.type === 'error' 
            ? 'bg-red-950/90 border-red-500/50 text-red-200' 
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Status Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Nexus Cloud</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Firestore Live
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Full-Stack Auth & Real-Time Database Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'workspace'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">My Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'database'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Admin DB View</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-indigo-300 font-mono">
                {records.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Account & Profile</span>
            </button>
          </nav>

          {/* User Account / Sign Out Section */}
          <div className="flex items-center gap-3">
            {user && !user.isAnonymous ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200">{user.email}</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Verified User</span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline-block text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-mono">
                  Guest Mode
                </span>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In / Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: WORKSPACE / PERSONAL DASHBOARD */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
              <div className="space-y-1 z-10">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-400" />
                  User Data Dashboard
                </h1>
                <p className="text-sm text-slate-400">
                  Logged in as <span className="text-indigo-300 font-semibold">{user?.email || 'Guest User'}</span>. Entries created here automatically synchronize with Firestore.
                </p>
              </div>

              {/* Account Quick Stats */}
              <div className="flex items-center gap-4 z-10">
                <div className="bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Your Saved Records</p>
                  <p className="text-xl font-bold text-indigo-400">{userRecords.length}</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Global System Docs</p>
                  <p className="text-xl font-bold text-emerald-400">{records.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-400" />
                    New Database Entry
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">Firestore Writer</span>
                </div>

                <form onSubmit={handleCreateRecord} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Title / Header <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Q3 Sales Analysis & Firestore Cache Notes"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="General">General</option>
                        <option value="Work">Work</option>
                        <option value="Ideas">Ideas</option>
                        <option value="Personal">Personal</option>
                        <option value="System">System</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Entry Content Payload <span className="text-indigo-400">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write notes, structured data, JSON strings, or documentation content to store in cloud database..."
                      rows={5}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Writing to Firestore...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        Save Document to Cloud DB
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl">
                  <h2 className="text-md font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    My Cloud Records ({userRecords.length})
                  </h2>
                  <span className="text-xs text-slate-400">Path: /public/data/user_notes</span>
                </div>

                {loadingRecords ? (
                  <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                    <p className="text-sm text-slate-400">Syncing live Firestore data...</p>
                  </div>
                ) : userRecords.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed space-y-3">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-slate-300 font-semibold">No records found for your account</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Use the form on the left to add your first document entry into the database.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {userRecords.map((record) => (
                      <div
                        key={record.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                record.priority === 'High' || record.priority === 'Critical'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}>
                                {record.priority || 'Medium'}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                                {record.category}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1.5">{record.title}</h3>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedRecordForInspection(record)}
                              title="Inspect JSON Payload"
                              className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Code className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id, record.authorId)}
                              title="Delete Record"
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-slate-300 whitespace-pre-wrap font-sans bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                          {record.content}
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {record.isoDate ? new Date(record.isoDate).toLocaleString() : 'Just now'}
                          </span>
                          <span className="truncate max-w-[180px]">ID: {record.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6">
            
            {/* Database Explorer Banner & Metrics */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Server className="w-6 h-6 text-emerald-400" />
                    <h1 className="text-2xl font-bold text-white">Live System Database Explorer</h1>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Real-time global Firestore monitor across all user accounts in <code className="text-xs text-emerald-300 font-mono">/public/data/user_notes</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Realtime Listener Active
                  </span>
                </div>
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">Total System Documents</p>
                  <p className="text-2xl font-bold text-white mt-1">{records.length}</p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">Unique Contributors</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">
                    {new Set(records.map(r => r.authorId)).size}
                  </p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">Current User Matches</p>
                  <p className="text-2xl font-bold text-violet-400 mt-1">{userRecords.length}</p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">Database Status</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5 text-base">
                    <CheckCircle className="w-5 h-5" /> Operational
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search titles, content, author email..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-400 font-medium shrink-0">Category:</span>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 uppercase tracking-wider text-[10px] text-slate-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Document ID</th>
                      <th className="py-3 px-4">Author / User</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Title & Excerpt</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredDatabaseRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No matching document entries found in cloud database.
                        </td>
                      </tr>
                    ) : (
                      filteredDatabaseRecords.map((docItem) => (
                        <tr key={docItem.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-indigo-400 font-medium">
                            <span className="bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded">
                              {docItem.id.substring(0, 10)}...
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-200">{docItem.authorEmail || 'Anonymous'}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                              UID: {docItem.authorId}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {docItem.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-slate-100 truncate">{docItem.title}</div>
                            <div className="text-slate-400 text-[11px] truncate">{docItem.content}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 text-[10px] whitespace-nowrap">
                            {docItem.isoDate ? new Date(docItem.isoDate).toLocaleString() : 'Recent'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedRecordForInspection(docItem)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                              >
                                <Code className="w-3.5 h-3.5" /> Inspect
                              </button>
                              {user && docItem.authorId === user.uid && (
                                <button
                                  onClick={() => handleDeleteRecord(docItem.id, docItem.authorId)}
                                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                  title="Delete your entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <User className="w-6 h-6 text-indigo-400" />
                  Account & Authentication Center
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Manage your Firebase user credentials, display name, and private database settings.
                </p>
              </div>

              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                Auth Status: {user && !user.isAnonymous ? 'Email Authenticated' : 'Guest Mode'}
              </div>
            </div>

            {/* If User is NOT Email Authenticated, show Login / Sign Up options */}
            {(!user || user.isAnonymous) && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
                
                {/* Auth Mode Toggle */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-sm mx-auto">
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      authMode === 'login'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      authMode === 'signup'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Create Account
                  </button>
                </div>

                {/* Status Messages */}
                {authError && (
                  <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2 max-w-md mx-auto">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 max-w-md mx-auto">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <form
                  onSubmit={authMode === 'login' ? handleSignIn : handleSignUp}
                  className="max-w-md mx-auto space-y-4"
                >
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={displayNameInput}
                          onChange={(e) => setDisplayNameInput(e.target.value)}
                          placeholder="e.g. Sarah Connor"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm mt-2"
                  >
                    {authMode === 'login' ? 'Sign In to Account' : 'Register New Account'}
                  </button>
                </form>

                <div className="border-t border-slate-800 pt-4 text-center max-w-md mx-auto">
                  <p className="text-xs text-slate-400 mb-2">Want to try the app without registering?</p>
                  <button
                    onClick={handleAnonymousLogin}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Continue as Quick Guest User
                  </button>
                </div>
              </div>
            )}

            {/* Authenticated User Dashboard / Details */}
            {user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Account Summary Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-md font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Firebase Security Profile
                  </h2>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">User Email</span>
                      <span className="text-slate-100 font-semibold font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 block truncate">
                        {user.email || 'Anonymous Guest'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Firebase UID (Unique Identifier)</span>
                      <span className="text-indigo-300 font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 block truncate select-all">
                        {user.uid}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Private User Firestore Storage Path</span>
                      <span className="text-slate-300 font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 block text-[11px] truncate">
                        /artifacts/{appId}/users/{user.uid}/settings/profile
                      </span>
                    </div>
                  </div>

                  {!user.isAnonymous && (
                    <button
                      onClick={handleSignOut}
                      className="w-full mt-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out of {user.email}
                    </button>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-md font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <User className="w-5 h-5 text-indigo-400" />
                    Edit Profile Details
                  </h2>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Stored Role</label>
                      <input
                        type="text"
                        value={userProfile?.role || 'Standard Cloud Developer'}
                        disabled
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Sync Profile to Firestore
                    </button>
                  </form>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {selectedRecordForInspection && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Firestore Document Payload Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedRecordForInspection(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Document ID:</span>
                <span className="text-indigo-300 font-bold">{selectedRecordForInspection.id}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Raw JSON Object</span>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 text-[11px] leading-relaxed overflow-x-auto selection:bg-indigo-900">
                  {JSON.stringify(selectedRecordForInspection, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedRecordForInspection(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 bg-slate-900/40 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1 font-mono">
          <p>Nexus Cloud Full-Stack Application • Firebase Auth & Firestore DB Engine</p>
          <p>Strict Path: <span className="text-slate-400">/artifacts/{appId}/public/data/user_notes</span></p>
        </div>
      </footer>

    </div>
  );
}