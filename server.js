const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// Configuración de PostgreSQL
const client = new Client({
  user: 'blackthorn_user', // Usuario de la base de datos
  host: 'dpg-cvbuqbqn91rc73cf5i5g-a', // Host de Render
  database: 'blackthorn', // Nombre de la base de datos
  password: '9elOecG64rmN44ckbQfP6EM7ohFMwOEy', // Contraseña generada por Render
  port: 5432, // Puerto de PostgreSQL
  ssl: {
    rejectUnauthorized: false, // Necesario para conexiones seguras en Render
  },
});

// Conectar a la base de datos
client.connect()
  .then(() => {
    console.log('Conectado a PostgreSQL');
    // Crear la tabla 'users' si no existe
    return client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL
      );
    `);
  })
  .then(() => console.log('Tabla "users" verificada/creada'))
  .catch(err => console.error('Error al conectar o crear la tabla:', err));

// Obtener todos los usuarios
async function getUsers() {
  const res = await client.query('SELECT * FROM users');
  return res.rows;
}

// Guardar un nuevo usuario
async function saveUser(user) {
  const { name, email, password } = user;
  const query = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *';
  const values = [name, email, password];
  const res = await client.query(query, values);
  return res.rows[0];
}

// API Routes
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  console.log('Register request received:', { name, email });

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Verificar si el usuario ya existe
    const users = await getUsers();
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'El usuario ya existe.' });
    }

    // Guardar el nuevo usuario
    const newUser = await saveUser({ name, email, password });
    console.log('Usuario registrado correctamente:', newUser);

    // Devolver la respuesta sin la contraseña
    const { password: _, ...userInfo } = newUser;
    res.status(201).json(userInfo);
  } catch (error) {
    console.error('Error durante el registro:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for:', email);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Buscar el usuario en la base de datos
    const query = 'SELECT * FROM users WHERE email = $1 AND password = $2';
    const values = [email, password];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario y/o contraseña incorrecta.' });
    }

    // Devolver la información del usuario sin la contraseña
    const { password: _, ...userInfo } = result.rows[0];
    res.json(userInfo);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Endpoint para depuración (solo para desarrollo)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await getUsers();
    // Devolver usuarios sin contraseñas
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json({ count: users.length, users: safeUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Servir el archivo HTML principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});