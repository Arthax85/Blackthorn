const supabase = supabase.createClient(
  'https://efemxvfuepbbqnmqzazt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW14dmZ1ZXBiYnFubXF6YXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODE4MjEsImV4cCI6MjA1Nzg1NzgyMX0.gBZfJXvQKSgWqkJ_N4Mccs9DXwMmqAKWXjOSOx4m9-c'
);

// Eliminar la inicialización del cliente y usar el global
async function login(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      role: data.user.role || 'user'
    };

    handleSuccessfulLogin(userData);
  } catch (error) {
    handleLoginError(error);
  }
}

async function register(event) {
  event.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const { data, error } = await window.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;
    handleSuccessfulRegistration();
  } catch (error) {
    handleRegistrationError(error);
  }
}

function signOut() {
  window.supabase.auth.signOut();
  localStorage.removeItem('currentUser');
  showLoginForm();
}

function handleSuccessfulLogin(userData) {
  document.getElementById('user-name').innerText = userData.name;
  document.getElementById('user-email').innerText = userData.email;
  document.getElementById('user-info').style.display = 'block';
  document.getElementById('login-form').style.display = 'none';
  localStorage.setItem('currentUser', JSON.stringify(userData));
  showNotification('Inicio de sesión exitoso', 'success');
}

function handleLoginError(error) {
  console.error('Login error:', error);
  showNotification(error.message || 'Error al iniciar sesión', 'error');
}

function handleSuccessfulRegistration() {
  showNotification('Registro exitoso. Por favor, inicia sesión.', 'success');
  showLoginForm();
}

function handleRegistrationError(error) {
  console.error('Registration error:', error);
  showNotification(error.message || 'Error al registrarse', 'error');
}


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

// Export for use in animation.js
window.checkLoggedInUser = checkLoggedInUser;