window.onload = function () {
  const logoContainer = document.getElementById('logo-container');
  const logo = document.getElementById('logo');
  const container = document.getElementById('container');
  const title = document.getElementById('title');
  const logoText = document.querySelector('.logo-text');
  
  // Hide the text initially
  logoText.style.display = 'none';

  // Animación mejorada para la rosa
  logo.classList.add('animate-rose');
  
  // Espera a que la animación del logo termine
  setTimeout(() => {
      // Añade efecto de pulso continuo al logo
      logo.classList.remove('animate-rose');
      logo.classList.add('pulse-effect');
      
      // Mueve el logo a la parte superior con transición suave
      logoContainer.classList.add('logo-minimized');
      
      // Muestra el texto "Blackthorn" después de que el logo se posicione
      setTimeout(() => {
          logoText.style.display = 'block';
          logoText.classList.add('show-text');
      }, 500);
      
      // Muestra el título junto al logo
      title.style.display = 'block';
      title.classList.add('fade-in');

      // Muestra el contenedor del formulario
      container.style.display = 'block';
      setTimeout(() => {
          container.classList.add('visible');
      }, 100);
  }, 3000); // Duración aumentada para la animación inicial
};

// API URL - Change this to your Render deployed backend URL
const API_URL = 'https://your-render-app-name.onrender.com/api';

// Function to handle login
async function login(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }
    
    // Login successful
    document.getElementById('user-name').innerText = data.name;
    document.getElementById('user-email').innerText = data.email;
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').reset();
    
    // Save login state
    localStorage.setItem('currentUser', JSON.stringify(data));
    
  } catch (error) {
    alert(error.message);
  }
}

// Function to handle registration
async function register(event) {
  event.preventDefault();
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al registrarse');
    }
    
    // Registration successful
    alert('Usuario registrado correctamente');
    document.getElementById('register-form').reset();
    showLoginForm();
    
  } catch (error) {
    alert(error.message);
  }
}

// Function to sign out
function signOut() {
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  localStorage.removeItem('currentUser');
}

// Check if user is already logged in
function checkLoggedInUser() {
  const currentUser = localStorage.getItem('currentUser');
  
  if (currentUser) {
    const user = JSON.parse(currentUser);
    document.getElementById('user-name').innerText = user.name;
    document.getElementById('user-email').innerText = user.email;
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
  }
}

function showLoginForm() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}

function showRegisterForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

// Check for logged in user after animations
setTimeout(checkLoggedInUser, 3500);