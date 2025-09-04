const express = require('express');
const path = require('path');
require('dotenv').config();

// Import your existing proxy logic
const canvasProxy = require('./canvas-proxy');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount your proxy endpoints (canvas-proxy.js should export a function that takes app)
if (typeof canvasProxy === 'function') {
  canvasProxy(app);
}

// Fallback: serve index.html for any unknown route (for SPA-like behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Homepage server running at http://localhost:${PORT}`);
});
