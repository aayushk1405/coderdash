require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const cache = new NodeCache({ stdTTL: 600 }); // cache for 10 min

app.use(cors());
app.use(express.json());

// ==========================================
// MONGODB SETUP FOR STARRED PROFILES
// ==========================================
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('✅ Connected to MongoDB for Starred Profiles'))
        .catch(err => console.error('❌ MongoDB connection error:', err));
}

// Defining the schema directly in server.js so we don't need a database folder!
const StarSchema = new mongoose.Schema({
    handle: { type: String, required: true, unique: true },
    addedAt: { type: Date, default: Date.now }
});
const Star = mongoose.model('Star', StarSchema);

// ==========================================
// ROUTES
// ==========================================
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// --- Star Routes ---
app.get('/api/stars', async (req, res) => {
    try {
        const stars = await Star.find().sort({ addedAt: -1 });
        res.json(stars);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch starred profiles' });
    }
});

app.post('/api/stars', async (req, res) => {
    try {
        const newStar = new Star({ handle: req.body.handle });
        await newStar.save();
        res.json({ message: 'Starred successfully' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'User already starred' });
        res.status(500).json({ error: 'Failed to star user' });
    }
});

app.delete('/api/stars/:handle', async (req, res) => {
    try {
        await Star.deleteOne({ handle: req.params.handle });
        res.json({ message: 'Unstarred successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unstar user' });
    }
});

// --- Codeforces Fetcher ---
const fetchCodeforcesProfile = async (handle) => {
    const [profileRes, statusRes, ratingRes] = await Promise.all([
        axios.get(`https://codeforces.com/api/user.info?handles=${handle}`),
        axios.get(`https://codeforces.com/api/user.status?handle=${handle}`).catch(() => ({ data: { result: [] } })),
        axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`).catch(() => ({ data: { result: [] } }))
    ]);

    if (profileRes.data.status === 'FAILED') throw new Error('User not found');
    const user = profileRes.data.result[0];

    // Unique solved problems (dedupe by contestId-index, since one problem can be solved multiple times)
    const solvedMap = new Map();
    if (statusRes.data.result) {
        statusRes.data.result.forEach(sub => {
            if (sub.verdict === 'OK') {
                const key = `${sub.problem.contestId}-${sub.problem.index}`;
                if (!solvedMap.has(key)) solvedMap.set(key, sub.problem);
            }
        });
    }

    const solvedProblems = Array.from(solvedMap.values());
    const totalSolved = solvedProblems.length;

    // Tag frequency
    const tagCounts = {};
    solvedProblems.forEach(problem => {
        (problem.tags || []).forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const tagPercentages = Object.entries(tagCounts)
        .map(([tag, count]) => ({
            tag,
            percentage: Math.round((count / totalSolved) * 1000) / 10 // 1 decimal place
        }))
        .filter(t => t.percentage > 0)
        .sort((a, b) => b.percentage - a.percentage);

    // Contest history
    const contestHistory = (ratingRes.data.result || []).map(c => ({
        contestId: c.contestId,
        contestName: c.contestName,
        rank: c.rank,
        oldRating: c.oldRating,
        newRating: c.newRating,
        change: c.newRating - c.oldRating,
        date: c.ratingUpdateTimeSeconds
    })).reverse(); // most recent first

    return {
        handle: user.handle,
        currentRating: user.rating || 0,
        maxRating: user.maxRating || 0,
        rank: user.rank || 'unrated',
        maxRank: user.maxRank || 'unrated',
        avatar: user.titlePhoto || user.avatar,
        problemsSolved: totalSolved,
        tagBreakdown: tagPercentages,
        contestHistory
    };
};

app.get('/api/user/:handle', async (req, res) => {
    const { handle } = req.params;

    if (cache.has(handle)) {
        return res.json(cache.get(handle));
    }

    try {
        const data = await fetchCodeforcesProfile(handle);
        cache.set(handle, data);
        res.json(data);
    } catch (error) {
        res.status(404).json({ error: `Account '${handle}' not found on Codeforces` });
    }
});

app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
