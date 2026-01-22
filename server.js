// server.js - Backend server for SSH web terminal
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store active SSH connections
const connections = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('start-ssh', (data) => {
    const { host, username, password, privateKey } = data;
    
    const conn = new Client();
    connections.set(socket.id, conn);
    
    conn.on('ready', () => {
      console.log('SSH connection ready');
      socket.emit('ssh-status', { status: 'connected' });
      
      conn.shell((err, stream) => {
        if (err) {
          socket.emit('ssh-error', { error: err.message });
          return;
        }
        
        stream.on('data', (data) => {
          socket.emit('ssh-output', data.toString('utf-8'));
        });
        
        stream.on('close', () => {
          socket.emit('ssh-status', { status: 'disconnected' });
          conn.end();
        });
        
        socket.on('ssh-input', (data) => {
          stream.write(data);
        });
        
        socket.on('resize', (data) => {
          stream.setWindow(data.rows, data.cols);
        });
      });
    });
    
    conn.on('error', (err) => {
      console.error('SSH connection error:', err);
      socket.emit('ssh-error', { error: err.message });
    });
    
    conn.on('close', () => {
      socket.emit('ssh-status', { status: 'disconnected' });
      connections.delete(socket.id);
    });
    
    // Connect with either password or private key
    const config = {
      host: host,
      port: 22,
      username: username,
    };
    
    if (privateKey) {
      config.privateKey = privateKey;
    } else if (password) {
      config.password = password;
    }
    
    conn.connect(config);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const conn = connections.get(socket.id);
    if (conn) {
      conn.end();
      connections.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});