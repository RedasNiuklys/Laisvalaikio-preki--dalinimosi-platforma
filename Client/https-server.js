const https = require('https');
const fs = require('fs');
const path = require('path');

// For local development: use self-signed cert from server
const certPath = path.join(__dirname, '..', 'Server', 'certs', 'devcert.pfx');
const certPassword = 'devcert';

// Since pfx requires a password, we'll use a simpler approach with separate cert/key
// For now, use the cert and create a key file
const cerPath = path.join(__dirname, '..', 'Server', 'certs', 'devcert.cer');

// For Windows with self-signed cert, generate a simple key
const { spawn } = require('child_process');

const generateKey = () => {
  return new Promise((resolve, reject) => {
    // Use OpenSSL via PowerShell to extract key from pfx
    const cmd = `powershell -Command "& {$pfx = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new('${certPath}', 'devcert'); $key = [System.Security.Cryptography.RSA]::Create(); $key = $pfx.PrivateKey; $keyBytes = $key.ExportPkcs8PrivateKey(); [System.IO.File]::WriteAllBytes('${path.join(__dirname, '..', 'Server', 'certs', 'devcert.key')}', $keyBytes); Write-Host 'Key extracted' }"`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Error extracting key:', error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Try to load cert and key
let options = {};

try {
  // Try to use pfx directly with Node.js
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

// Simple static file server for Expo web
const serveFile = (res, filePath, contentType = 'text/html') => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 - File not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

const server = https.createServer(options, (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const distPath = path.join(__dirname, 'dist');
  
  // Route requests
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(distPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 - Forbidden');
    return;
  }

  // Check if it's a directory, serve index.html
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // Determine content type
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    serveFile(res, filePath, contentType);
  });
});

const PORT = 8081;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✓ Expo web HTTPS dev server running on https://10.51.21.135:${PORT}`);
  console.log('  Using certificate: Server/certs/devcert.pfx');
  console.log('\n⚠️  First time? Add this redirect to Google Cloud & Facebook:');
  console.log('  https://10.51.21.135:8081/google-callback');
  console.log('  https://10.51.21.135:8081/facebook-callback\n');
});

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`❌ Port ${PORT} requires admin privileges. Try a higher port (8443, 9443, etc.)`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
