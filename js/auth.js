const supabase = supabase.createClient(
  'https://efemxvfuepbbqnmqzazt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW14dmZ1ZXBiYnFubXF6YXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODE4MjEsImV4cCI6MjA1Nzg1NzgyMX0.gBZfJXvQKSgWqkJ_N4Mccs9DXwMmqAKWXjOSOx4m9-c'
);

// Eliminar la inicialización al inicio del archivo y usar directamente las funciones

// Eliminar esta inicialización duplicada
// const supabase = supabase.createClient(...);

window.login = async function(event) {
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
};

window.register = async function(event) {
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

window.signOut = function() {
  window.supabase.auth.signOut().then(() => {
    localStorage.removeItem('currentUser');
    
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('password-recovery-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    
    document.getElementById('user-name').innerText = '';
    document.getElementById('user-email').innerText = '';
    
    showNotification('Sesión cerrada correctamente', 'success');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }).catch(error => {
    console.error('Error signing out:', error);
    showNotification('Error al cerrar sesión', 'error');
  });
}; // Corregir el cierre de la función

// Hacer globales las funciones de manejo
window.handleSuccessfulLogin = function(userData) {
  document.getElementById('user-name').innerText = userData.name;
  document.getElementById('user-email').innerText = userData.email;
  document.getElementById('user-info').style.display = 'block';
  document.getElementById('login-form').style.display = 'none';
  localStorage.setItem('currentUser', JSON.stringify(userData));
  showNotification('Inicio de sesión exitoso', 'success');
}

window.handleLoginError = function(error) {
  console.error('Login error:', error);
  showNotification(error.message || 'Error al iniciar sesión', 'error');
}

window.handleSuccessfulRegistration = function() {
  showNotification('Registro exitoso. Por favor, inicia sesión.', 'success');
  showLoginForm();
}

window.handleRegistrationError = function(error) {
  console.error('Registration error:', error);
  showNotification(error.message || 'Error al registrarse', 'error');
}


window.checkLoggedInUser = function() {
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


async function deleteAccount() {
  try {
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    if (userError) throw userError;

    // Primero eliminar los datos del usuario
    const { error: deleteDataError } = await window.supabase
      .from('users')
      .delete()
      .eq('id', user.id);
    if (deleteDataError) throw deleteDataError;

    // Luego eliminar la cuenta de autenticación
    const { error: deleteAuthError } = await window.supabase.rpc('delete_user');
    if (deleteAuthError) throw deleteAuthError;

    // Limpiar datos locales y UI
    localStorage.removeItem('currentUser');
    
    // Ocultar todos los formularios primero
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('password-recovery-form').style.display = 'none';
    
    // Mostrar el formulario de login
    document.getElementById('login-form').style.display = 'block';
    
    // Limpiar los campos de usuario
    document.getElementById('user-name').innerText = '';
    document.getElementById('user-email').innerText = '';
    
    showNotification('Cuenta eliminada correctamente', 'success');
    
    // Recargar la página después de un breve retraso
    setTimeout(() => {
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('Error deleting account:', error);
    showNotification('Error al eliminar la cuenta: ' + error.message, 'error');
  }
}

// Make it globally available
window.deleteAccount = deleteAccount;