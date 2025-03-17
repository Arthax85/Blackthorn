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
      
      // Muestra el texto "Red Rose" después de que el logo se posicione
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

// Resto del código existente (login, register, etc.)
let users = [];

function loadUsers() {
  const storedUsers = localStorage.getItem('users');
  if (storedUsers) {
      users = JSON.parse(storedUsers);
  }
}

function saveUsers() {
  localStorage.setItem('users', JSON.stringify(users));
}

function login(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
      document.getElementById('user-name').innerText = user.name;
      document.getElementById('user-email').innerText = user.email;
      document.getElementById('user-info').style.display = 'block';
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('register-form').style.display = 'none';
      document.getElementById('login-form').reset();
  } else {
      alert('Email o contraseña incorrectos');
  }
}

function register(event) {
  event.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  if (users.some(u => u.email === email)) {
      alert('Ya existe un usuario con ese email');
      return;
  }
  users.push({ name, email, password });
  saveUsers();
  alert('Usuario registrado correctamente');
  document.getElementById('register-form').reset();
  showLoginForm();
}

function signOut() {
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

function showLoginForm() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}

function showRegisterForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

// Cargar usuarios al inicio
loadUsers();