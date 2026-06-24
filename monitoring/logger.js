// A simple custom logger to standardize our backend logs
const log = (level, message, data = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
  };
  
  module.exports = {
    info: (msg, data) => log('info', msg, data),
    error: (msg, data) => log('error', msg, data),
    warn: (msg, data) => log('warn', msg, data)
  };
