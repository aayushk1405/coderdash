import React, { useState, useEffect } from 'react';
import { Search, Trophy, Code2, AlertCircle, Activity, ListChecks, History, Star, Users } from 'lucide-react';

export default function App() {
    const [view, setView] = useState('search'); // 'search' or 'starred'
    const [handle, setHandle] = useState('');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Star Tracking State
    const [starredList, setStarredList] = useState([]);

    useEffect(() => {
        fetchStarredList();
    }, []);

    const fetchStarredList = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/stars');
            const data = await res.json();
            if (res.ok) setStarredList(data.map(s => s.handle));
        } catch (err) {
            console.error("Failed to fetch starred list", err);
        }
    };

    const searchProfile = async (searchHandle) => {
        const targetHandle = typeof searchHandle === 'string' ? searchHandle : handle;
        if (!targetHandle) return;
        
        setLoading(true); setError(null); setUserData(null); setView('search');

        try {
            const res = await fetch(`http://localhost:5000/api/user/${targetHandle}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUserData(data);
            setHandle(targetHandle); // Sync input field
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleStar = async () => {
        if (!userData) return;
        const isStarred = starredList.includes(userData.handle);
        
        try {
            if (isStarred) {
                await fetch(`http://localhost:5000/api/stars/${userData.handle}`, { method: 'DELETE' });
                setStarredList(starredList.filter(h => h !== userData.handle));
            } else {
                await fetch('http://localhost:5000/api/stars', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ handle: userData.handle })
                });
                setStarredList([...starredList, userData.handle]);
            }
        } catch (err) {
            console.error("Failed to update star status", err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                <header className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('search')}>
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <Code2 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">CoderDash</h1>
                            <p className="text-sm text-slate-400">Codeforces profile insights</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setView('starred')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium border ${view === 'starred' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'}`}
                    >
                        <Star className={`w-4 h-4 ${view === 'starred' ? 'fill-yellow-400' : ''}`} /> Tracked Profiles ({starredList.length})
                    </button>
                </header>

                {view === 'search' && (
                    <>
                        <form onSubmit={(e) => { e.preventDefault(); searchProfile(); }} className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value)}
                                    placeholder="Enter Codeforces handle..."
                                    className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 pl-11 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            </div>
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </form>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                                <AlertCircle className="w-6 h-6" /> <p>{error}</p>
                            </div>
                        )}

                        {userData && (
                            <div className="space-y-6">
                                {/* Profile header */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative">
                                    <button 
                                        onClick={toggleStar}
                                        className="absolute top-6 right-6 p-2 rounded-lg hover:bg-slate-800 transition-colors group"
                                        title="Toggle Star"
                                    >
                                        <Star className={`w-8 h-8 transition-colors ${starredList.includes(userData.handle) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500 group-hover:text-yellow-400/50'}`} />
                                    </button>

                                    <img src={userData.avatar} alt="avatar" className="w-28 h-28 rounded-full border-4 border-slate-800 object-cover" />
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left pr-12 md:pr-0">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{userData.handle}</h2>
                                            <p className="text-indigo-400 font-medium capitalize">{userData.rank}</p>
                                        </div>
                                        <StatCard icon={<Activity className="text-blue-400" />} title="Current Rating" value={userData.currentRating} />
                                        <StatCard icon={<Trophy className="text-yellow-400" />} title="Max Rating" value={userData.maxRating} />
                                        <StatCard icon={<ListChecks className="text-emerald-400" />} title="Problems Solved" value={userData.problemsSolved} />
                                    </div>
                                </div>

                                {/* Tag breakdown */}
                                {userData.tagBreakdown.length > 0 && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                                        <h3 className="text-lg font-bold text-white mb-4">Problem Tag Breakdown</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                            {userData.tagBreakdown.map((t) => (
                                                <div key={t.tag}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="capitalize text-slate-300 truncate pr-4">{t.tag}</span>
                                                        <span className="text-indigo-400 font-medium whitespace-nowrap">{t.percentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                                        <div
                                                            className="bg-indigo-500 h-2 rounded-full"
                                                            style={{ width: `${t.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Contest history */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <History className="text-purple-400 w-5 h-5" /> Contest History
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-800/50">
                                                <tr className="text-slate-400 text-sm">
                                                    <th className="p-3 font-medium rounded-tl-lg">Contest</th>
                                                    <th className="p-3 font-medium">Rank</th>
                                                    <th className="p-3 font-medium">Rating Change</th>
                                                    <th className="p-3 font-medium rounded-tr-lg">New Rating</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userData.contestHistory.map((c) => (
                                                    <tr key={c.contestId} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                                                        <td className="p-3 text-white truncate max-w-[200px] md:max-w-md">{c.contestName}</td>
                                                        <td className="p-3 text-slate-300">#{c.rank}</td>
                                                        <td className={`p-3 font-bold ${c.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {c.change >= 0 ? '+' : ''}{c.change}
                                                        </td>
                                                        <td className="p-3 text-indigo-400 font-bold">{c.newRating}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Starred View Directory */}
                {view === 'starred' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Star className="text-yellow-400 fill-yellow-400" /> Your Tracked Profiles
                        </h2>
                        {starredList.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-300">No tracked profiles yet</h3>
                                <p className="text-slate-500">Search for a Codeforces handle and click the star icon to track them.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {starredList.map(starHandle => (
                                    <div 
                                        key={starHandle} 
                                        onClick={() => searchProfile(starHandle)}
                                        className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
                                    >
                                        <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{starHandle}</span>
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, title, value }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 text-sm">
                {icon} {title}
            </div>
            <h4 className="text-xl font-bold text-white">{value}</h4>
        </div>
    );
}
