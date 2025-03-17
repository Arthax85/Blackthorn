const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

let users = [];

// Endpoint para el registro
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    if (users.some(u => u.email === email)) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }
    users.push({ name, email, password });
    res.status(201).json({ message: 'Usuario registrado correctamente' });
});

// Endpoint para el login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.status(200).json({ message: 'Inicio de sesión exitoso', user });
    } else {
        res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
