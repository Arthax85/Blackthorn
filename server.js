const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
    
    // Create users table if it doesn't exist
    pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err, res) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table ready');
      }
    });
  }
});

// Middleware - Updated CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// API Routes
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  console.log('Register request received:', { name, email });
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Add new user
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, password]
    );
    
    console.log('User registered successfully:', { name, email });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt for:', email);
  
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    
    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Usuario y/o contraseña incorrecta.' });
    }
    
    const user = result.rows[0];
    
    if (user.password !== password) {
      console.log('Contraseña incorrecta para:', email);
      return res.status(401).json({ error: 'Usuario y/o contraseña incorrecta.' });
    }
    
    console.log('Successful login for:', email);
    
    // Return user info (excluding password)
    const { password: _, ...userInfo } = user;
    res.json(userInfo);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add password recovery endpoint
app.post('/api/recover-password', async (req, res) => {
  const { email } = req.body;
  
  console.log('Password recovery request for:', email);
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Log all emails in the database for debugging
    const allUsers = await pool.query('SELECT email FROM users');
    console.log('All emails in database:', allUsers.rows.map(u => u.email.toLowerCase()));
    console.log('Looking for email:', email.toLowerCase());
    
    // Check if user exists with improved query
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    
    if (result.rows.length === 0) {
      console.log('User not found for password recovery:', email);
      
      // Try a more flexible search as a fallback
      const fuzzyResult = await pool.query("SELECT * FROM users WHERE email ILIKE $1", [`%${email.trim()}%`]);
      
      if (fuzzyResult.rows.length > 0) {
        console.log('Found similar emails:', fuzzyResult.rows.map(u => u.email));
        return res.status(404).json({ 
          error: 'El correo electrónico no está registrado exactamente como se ingresó. ¿Quizás usaste otro correo?' 
        });
      }
      
      return res.status(404).json({ error: 'El correo electrónico no está registrado en el sistema' });
    }
    
    // In a real application, you would:
    // 1. Generate a unique token
    // 2. Store the token in the database with an expiration time
    // 3. Send an email with a link containing the token
    
    const user = result.rows[0];
    console.log('User found for password recovery:', user.email);
    
    res.status(200).json({ 
      message: `Se ha enviado un enlace de recuperación a ${user.email}. Por favor, revisa tu bandeja de entrada.` 
    });
  } catch (error) {
    console.error('Password recovery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/delete-account', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Delete account request for:', email);
    
    if (!email || !password) {
      console.log('Missing email or password for account deletion');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Verify user credentials
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log('User not found for deletion:', email);
      return res.status(401).json({ error: 'Usuario y/o contraseña incorrecta.' });
    }
    
    const user = userResult.rows[0];
    
    if (user.password !== password) {
      console.log('Contraseña incorrecta para eliminar esta cuenta:', email);
      return res.status(401).json({ error: 'Usuario y/o contraseña incorrecta.' });
    }
    
    // Delete the user
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    
    console.log('Account deleted successfully for:', email);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a test endpoint to check if the API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Add an endpoint to check registered users (for debugging only - remove in production)
app.get('/api/debug/users', async (req, res) => {
  try {
    console.log('Attempting to fetch users from database');
    // Modified query to only select columns we know exist
    const result = await pool.query('SELECT id, name, email FROM users');
    console.log(`Successfully retrieved ${result.rows.length} users`);
    res.json({ count: result.rows.length, users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Add a database test endpoint
app.get('/api/debug/db-test', async (req, res) => {
  try {
    console.log('Testing database connection');
    const result = await pool.query('SELECT NOW() as time');
    console.log('Database connection successful');
    res.json({ 
      status: 'success', 
      message: 'Database connection successful',
      time: result.rows[0].time
    });
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Add an endpoint to check table schema
app.get('/api/debug/schema', async (req, res) => {
  try {
    console.log('Checking users table schema');
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log(`Table has ${result.rows.length} columns`);
    res.json({ 
      count: result.rows.length, 
      columns: result.rows 
    });
  } catch (error) {
    console.error('Error checking schema:', error.message);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message
    });
  }
});

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); // This closing bracket was missing