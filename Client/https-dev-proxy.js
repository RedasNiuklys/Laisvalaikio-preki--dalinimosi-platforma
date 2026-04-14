const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load certificate
const certPath = path.join(__dirname, '..', 'Server', 'certs', 'devcert.pfx');
const certPassword = 'devcert';

let options = {};

try {
  const pfxData = fs.readFileSync(certPath);
  options = {
    pfx: pfxData,
    passphrase: certPassword
  };
  console.log('✓ Loaded self-signed certificate from Server/certs/devcert.pfx');
} catch (err) {
  console.error('❌ Could not load certificate:', err.message);
  console.error('Please ensure the certificate exists at:', certPath);
  process.exit(1);
}

// Expo dev server (usually runs on localhost:8081 for web)
const EXPO_DEV_HOST = 'localhost';
const EXPO_DEV_PORT = 8081;
// Proxy listens on different port to avoid conflict
const PROXY_PORT = 8443;

const proxy = https.createServer(options, (req, res) => {
  console.log(`→ ${req.method} ${req.url}`);

  // Forward the request to Expo dev server
  const proxyReq = http.request(
    {
      hostname: EXPO_DEV_HOST,
      port: EXPO_DEV_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        'host': EXPO_DEV_HOST
      }
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('❌ Proxy error:', err.message);
    if (err.code === 'ECONNREFUSED') {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end(`Service Unavailable - Expo dev server not running on ${EXPO_DEV_HOST}:${EXPO_DEV_PORT}\n\nRun: npm start`);
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  req.pipe(proxyReq);
});

// Handle WebSocket upgrades for hot reload
proxy.on('upgrade', (req, socket, head) => {
  console.log(`⤴ WS ${req.url}`);

  const proxyReq = http.request(
    {
      hostname: EXPO_DEV_HOST,
      port: EXPO_DEV_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        'host': EXPO_DEV_HOST
      }
    }
  );

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      Object.keys(proxyRes.headers)
        .map(k => `${k}: ${proxyRes.headers[k]}`)
        .join('\r\n') +
      '\r\n\r\n'
    );
    proxySocket.pipe(socket).pipe(proxySocket);
  });

  proxyReq.on('error', (err) => {
    console.error('❌ WebSocket proxy error:', err.message);
    socket.destroy();
  });

  proxyReq.end();
});

proxy.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`\n✓ HTTPS dev proxy running on https://10.233.192.135:${PROXY_PORT}`);
  console.log(`  → Forwarding to Expo dev server at http://${EXPO_DEV_HOST}:${EXPO_DEV_PORT}`);
  console.log('\n📱 Usage:');
  console.log('  Terminal 1: npm start                 (Expo dev server on port 8081)');
  console.log('  Terminal 2: npm run web:dev:https     (This HTTPS proxy)');
  console.log('\n🌐 Then visit:');
  console.log(`  Web:      https://10.233.192.135:${PROXY_PORT}     (browser with OAuth)`);
  console.log('  Expo Go:  exp://10.233.192.135:8081     (connects directly to Metro)\n');
});

proxy.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`❌ Port ${PROXY_PORT} requires admin privileges`);
  } else if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PROXY_PORT} is already in use. Is another proxy running?`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n✓ Proxy stopped');
  process.exit(0);
});
