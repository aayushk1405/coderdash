# CoderDash

A web app that lets you look up any Codeforces user profile and see their stats — current rating, max rating, problems solved, problem tag breakdown, and full contest history. You can also star/track profiles so you can quickly pull them up later.

---

## What it does

- Search any Codeforces handle and get their profile stats
- View a breakdown of which problem tags they've solved (as percentages)
- See their full contest history with rating changes
- Star profiles to save them in a "Tracked Profiles" list
- API responses are cached for 10 minutes to avoid hammering Codeforces

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB (via Mongoose) |
| Codeforces data | Codeforces public API |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
coderdash/
├── frontend/               # React app (Vite)
│   ├── src/
│   │   ├── App.jsx         # Main UI component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles (Tailwind imports)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                # Express API
│   ├── server.js           # All routes and Codeforces fetching logic
│   └── package.json
│
├── deployment/
│   ├── Dockerfile          # Builds the backend container
│   └── docker-compose.yml  # Runs backend + MongoDB together
│
├── monitoring/
│   ├── logger.js           # Simple timestamped logger utility
│   └── uptime-ping.js      # Pings /api/health every 10s
│
└── .env                    # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- MongoDB (local install, or use Docker — see below)

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd coderdash
```

### 2. Set up environment variables

Create a `.env` file in the root of the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/coderdash
```

> If `MONGO_URI` is not set, the starred profiles feature won't work, but the rest of the app will still function.

### 3. Run the backend

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:5000`.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (Vite default).

---

## Running with Docker

If you'd rather not install MongoDB locally, Docker Compose will spin up both the backend and a MongoDB instance together.

```bash
cd deployment
docker-compose up --build
```

This starts:
- **backend** on port `5000`
- **MongoDB** on port `27017` with a persistent volume (`mongo-data`)

To stop and remove containers:

```bash
docker-compose down
```

---

## API Reference

All endpoints are served from `http://localhost:5000`.

### `GET /api/health`
Health check. Returns `{ "status": "ok" }`.

---

### `GET /api/user/:handle`
Fetches a Codeforces user's profile data. Results are cached for 10 minutes.

**Response:**
```json
{
  "handle": "tourist",
  "currentRating": 3822,
  "maxRating": 3979,
  "rank": "legendary grandmaster",
  "maxRank": "legendary grandmaster",
  "avatar": "https://...",
  "problemsSolved": 1342,
  "tagBreakdown": [
    { "tag": "dp", "percentage": 24.3 },
    { "tag": "graphs", "percentage": 18.1 }
  ],
  "contestHistory": [
    {
      "contestId": 1893,
      "contestName": "Codeforces Round 904",
      "rank": 1,
      "oldRating": 3800,
      "newRating": 3822,
      "change": 22,
      "date": 1699000000
    }
  ]
}
```

**Error (404):**
```json
{ "error": "Account 'unknownhandle' not found on Codeforces" }
```

---

### `GET /api/stars`
Returns all starred/tracked profile handles.

**Response:**
```json
[
  { "handle": "tourist", "addedAt": "2024-01-01T00:00:00.000Z" },
  { "handle": "jiangly", "addedAt": "2024-01-02T00:00:00.000Z" }
]
```

---

### `POST /api/stars`
Stars a profile.

**Body:**
```json
{ "handle": "tourist" }
```

---

### `DELETE /api/stars/:handle`
Removes a handle from the starred list.

---

## Monitoring

The `monitoring/` folder has two small scripts you can run separately for local dev:

**Logger** (`logger.js`) — a simple utility that adds timestamps and log levels to console output. Import it in `server.js` if you want structured logs.

**Uptime monitor** (`uptime-ping.js`) — pings `GET /api/health` every 10 seconds and logs whether the backend is up or down. Run it in a separate terminal while developing:

```bash
node monitoring/uptime-ping.js
```

---

## Notes & Known Limitations

- **Codeforces rate limits:** The app fetches 3 API calls per user lookup (profile, submissions, rating history). If you look up a lot of handles in quick succession, you may hit Codeforces rate limits. The 10-minute in-memory cache helps reduce this.
- **No auth:** The starred profiles list is shared — there's no per-user login system. Anyone with access to the backend can see and modify the list.
- **Cache is in-memory:** The `node-cache` TTL resets every time the server restarts. For a production setup, consider replacing it with Redis.
- **Frontend API URL is hardcoded** to `http://localhost:5000`. For a real deployment, move this to an environment variable.
