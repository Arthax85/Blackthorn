const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// File to store users (in a real app, use a database)
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Get users from file
function getUsers() {
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

// Save users to file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));
}

// API Routes
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const users = getUsers();
  
  // Check if user already exists
  if (users.some(user => user.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  // Add new user
  users.push({ name, email, password });
  saveUsers(users);
  
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const users = getUsers();
  
  // Find user
  const user = users.find(user => user.email === email && user.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Return user info (excluding password)
  const { password: _, ...userInfo } = user;
  res.json(userInfo);
});

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// Update your CORS configuration
app.use(cors({
  origin: true, // Allow requests from any origin
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));