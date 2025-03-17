const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Updated CORS configuration
app.use(cors({
  origin: true, // Allow requests from any origin
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// File to store users (in a real app, use a database)
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  // Create with a default admin user for testing
  fs.writeFileSync(USERS_FILE, JSON.stringify([
    {
      name: "Admin User",
      email: "admin@example.com",
      password: "password123"
    }
  ]));
  console.log('Created users.json with default admin user');
} else {
  console.log('Users file exists');
}

// Get users from file
function getUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE);
      const users = JSON.parse(data);
      console.log(`Retrieved ${users.length} users from file`);
      return users;
    } else {
      console.log('Users file not found, creating new one');
      const defaultUsers = [
        {
          name: "Admin User",
          email: "admin@example.com",
          password: "password123"
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Save users to file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));
}

// API Routes
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  
  console.log('Register request received:', { name, email });
  
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
  
  console.log('User registered successfully:', { name, email });
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt for:', email);
  
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const users = getUsers();
  console.log('Total users in database:', users.length);
  
  // For debugging - log emails of registered users (don't log passwords in production)
  console.log('Registered emails:', users.map(u => u.email));
  
  // Find user
  const user = users.find(user => user.email === email && user.password === password);
  
  if (!user) {
    console.log('Invalid credentials for:', email);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  console.log('Successful login for:', email);
  
  // Return user info (excluding password)
  const { password: _, ...userInfo } = user;
  res.json(userInfo);
});

// Add a test endpoint to check if the API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Add an endpoint to check registered users (for debugging only - remove in production)
app.get('/api/debug/users', (req, res) => {
  const users = getUsers();
  // Return users without passwords
  const safeUsers = users.map(({ password, ...user }) => user);
  res.json({ count: users.length, users: safeUsers });
});

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});