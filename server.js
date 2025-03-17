const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Set your SendGrid API key
// You'll need to set this as an environment variable in your hosting environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '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';
sgMail.setApiKey(SENDGRID_API_KEY);

// Comment out the transporter configuration for now
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'your-gmail@gmail.com',
//     pass: 'your-app-password'
//   }
// });

// Comment out the transporter verification
// transporter.verify(function(error, success) {
//   if (error) {
//     console.error('Email transporter error:', error);
//   } else {
//     console.log('Email server is ready to send messages');
//   }
// });

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
        
        // Create password reset tokens table after users table is ready
        pool.query(`
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(100) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err, res) => {
          if (err) {
            console.error('Error creating password_reset_tokens table:', err);
          } else {
            console.log('Password reset tokens table ready');
          }
        });
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
    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    
    if (result.rows.length === 0) {
      console.log('User not found for password recovery:', email);
      return res.status(404).json({ error: 'El correo electrónico no está registrado en el sistema' });
    }
    
    const user = result.rows[0];
    console.log('User found for password recovery:', user.email);
    
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    
    // Store the token in the database
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );
    
    // Create reset URL - use your actual frontend URL
    const resetUrl = `https://blackthorn-auth.onrender.com/reset-password?token=${token}`;
    
    // Log the token for debugging
    console.log('Password reset token generated:', token);
    console.log('Reset URL:', resetUrl);
    
    // For development/testing, return the token directly
    res.status(200).json({ 
      message: `Se ha generado un enlace de recuperación para ${user.email}.`,
      resetUrl: resetUrl
    });
    
  } catch (error) {
    console.error('Password recovery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a specific route for the reset-password page
app.get('/reset-password', (req, res) => {
  const token = req.query.token;
  
  console.log('Reset password page requested with token:', token);
  
  if (!token) {
    console.log('No token provided, redirecting to home');
    return res.redirect('/');
  }
  
  // Set proper content type
  res.setHeader('Content-Type', 'text/html');
  
  // Serve a special HTML page for password reset
  const resetHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restablecer Contraseña</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 350px;
          max-width: 100%;
        }
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        button {
          width: 100%;
          padding: 10px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          background-color: #45a049;
        }
        .message {
          margin-top: 15px;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
        }
        .success {
          background-color: #d4edda;
          color: #155724;
        }
        .error {
          background-color: #f8d7da;
          color: #721c24;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Restablecer Contraseña</h1>
        <div id="message" class="message" style="display: none;"></div>
        <form id="resetForm">
          <input type="hidden" id="token" value="${token}">
          <div class="form-group">
            <label for="password">Nueva Contraseña</label>
            <input type="password" id="password" required>
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <input type="password" id="confirmPassword" required>
          </div>
          <button type="submit">Restablecer Contraseña</button>
        </form>
      </div>
      
      <script>
        document.getElementById('resetForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const token = document.getElementById('token').value;
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const messageDiv = document.getElementById('message');
          
          // Clear previous messages
          messageDiv.textContent = '';
          messageDiv.className = 'message';
          messageDiv.style.display = 'none';
          
          // Validate passwords
          if (password !== confirmPassword) {
            messageDiv.textContent = 'Las contraseñas no coinciden';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
          }
          
          try {
            const response = await fetch('/api/reset-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                token: token,
                newPassword: password
              })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              messageDiv.textContent = data.message;
              messageDiv.className = 'message success';
              messageDiv.style.display = 'block';
              
              // Redirect to login page after 3 seconds
              setTimeout(() => {
                window.location.href = '/';
              }, 3000);
            } else {
              messageDiv.textContent = data.error || 'Error al restablecer la contraseña';
              messageDiv.className = 'message error';
              messageDiv.style.display = 'block';
            }
          } catch (error) {
            console.error('Error:', error);
            messageDiv.textContent = 'Error de conexión';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `;
  
  console.log('Sending reset password HTML page');
  res.send(resetHtml);
});

// Add a new endpoint to handle password reset
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  
  try {
    // Find the token in the database
    const tokenResult = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }
    
    const tokenData = tokenResult.rows[0];
    
    // Update the user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [newPassword, tokenData.user_id]
    );
    
    // Delete the used token
    await pool.query('DELETE FROM password_reset_tokens WHERE id = $1', [tokenData.id]);
    
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Password reset error:', error);
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
});