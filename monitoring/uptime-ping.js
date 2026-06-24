const http = require('http');

console.log('🚀 Starting Uptime Monitor... Pinging every 10 seconds.');

// This script simulates a monitoring service (like Datadog)
setInterval(() => {
  http.get('http://localhost:5000/api/health', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ [MONITOR] Backend is Healthy (200 OK)');
    } else {
      console.log(`⚠️ [MONITOR] Backend returned status: ${res.statusCode}`);
    }
  }).on('error', (err) => {
    console.error('❌ [MONITOR] ALERT: Backend is DOWN! Error:', err.message);
  });
}, 10000);
