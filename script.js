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
const API_URL = 'https://blackthorn-auth.onrender.com/api';

// Function to handle login
async function login(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    // Show loading indicator
    const loginButton = event.target.querySelector('button');
    const originalText = loginButton.textContent;
    loginButton.textContent = 'Iniciando sesión...';
    loginButton.disabled = true;
    
    console.log('Attempting to connect to:', `${API_URL}/login`);
    
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    // Reset button
    loginButton.textContent = originalText;
    loginButton.disabled = false;
    
    if (!response.ok) {
      // Check if it's an authentication error (401)
      if (response.status === 401) {
        throw new Error('Usuario y/o contraseña incorrecta');
      } else {
        throw new Error(data.error || 'Error al iniciar sesión');
      }
    }
    
    // Login successful
    document.getElementById('user-name').innerText = data.name;
    document.getElementById('user-email').innerText = data.email;
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    
    // Reset the form using the form element itself, not the container div
    const loginForm = document.querySelector('#login-form form');
    if (loginForm) {
      loginForm.reset();
    }
    
    // Save login state
    localStorage.setItem('currentUser', JSON.stringify(data));
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Check if it's a connection error
    if (error.message.includes('connection') || error.message === 'Failed to fetch') {
      showNotification('No se pudo conectar con el servidor. Por favor, intente de nuevo más tarde.', 'error');
    } else {
      showNotification(error.message || 'Error al iniciar sesión', 'error');
    }
    
    // Reset button if it wasn't reset
    const loginButton = event.target.querySelector('button');
    if (loginButton) {
      loginButton.textContent = 'Iniciar Sesión';
      loginButton.disabled = false;
    }
  }
}

// Function to handle registration
async function register(event) {
  event.preventDefault();
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  
  try {
    // Show loading indicator
    const registerButton = event.target.querySelector('button');
    const originalText = registerButton.textContent;
    registerButton.textContent = 'Registrando...';
    registerButton.disabled = true;
    
    console.log('Attempting to connect to:', `${API_URL}/register`);
    
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, password })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    // Reset button
    registerButton.textContent = originalText;
    registerButton.disabled = false;
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al registrarse');
    }
    
    // Registration successful
    showNotification('Usuario registrado correctamente', 'success');
    document.querySelector('#register-form form').reset();
    showLoginForm();
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Reset button if it wasn't reset
    const registerButton = event.target.querySelector('button');
    registerButton.textContent = 'Registrarse';
    registerButton.disabled = false;
    
    // Show error notification
    if (error.message.includes('connection') || error.message === 'Failed to fetch') {
      showNotification('No se pudo conectar con el servidor. Por favor, intente de nuevo más tarde.', 'error');
    } else {
      showNotification(error.message || 'Error al registrarse', 'error');
    }
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

// Add these functions after the showRegisterForm function

function showPasswordRecoveryForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('password-recovery-form').style.display = 'block';
}

// Update the showLoginForm function to also hide the password recovery form
function showLoginForm() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('password-recovery-form').style.display = 'none';
}

// Function to handle password recovery
async function recoverPassword(event) {
  event.preventDefault();
  
  // Get email and normalize it exactly as we do during registration
  const email = document.getElementById('recovery-email').value.trim().toLowerCase();
  
  try {
    // Validate email format
    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new Error('Por favor, introduce un correo electrónico válido');
    }
    
    // Show loading indicator
    const recoveryButton = event.target.querySelector('button');
    const originalText = recoveryButton.textContent;
    recoveryButton.textContent = 'Enviando...';
    recoveryButton.disabled = true;
    
    console.log('Attempting password recovery for email:', email);
    
    // Try with a different endpoint format
    const endpoint = `${API_URL}/recover-password`;
    console.log('Connecting to:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ 
        email: email,
        // Add additional debugging info that might help identify the user
        debug: true
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    // Reset button
    recoveryButton.textContent = originalText;
    recoveryButton.disabled = false;
    
    // Handle different response statuses
    if (!response.ok) {
      let errorMessage = 'Error al solicitar recuperación de contraseña';
      
      try {
        const errorData = await response.json();
        console.log('Error response data:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.log('Failed to parse error response as JSON:', e);
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      if (response.status === 404) {
        // Provide more specific error message with the email for debugging
        errorMessage = `El correo "${email}" no está registrado en el sistema`;
        console.log('Email not found in database:', email);
      } else if (response.status === 429) {
        errorMessage = 'Demasiados intentos. Por favor, inténtalo más tarde';
      }
      
      throw new Error(errorMessage);
    }
    
    // Success - try to parse response
    let successMessage = 'Se ha enviado un enlace de recuperación a tu correo electrónico';
    
    try {
      const data = await response.json();
      console.log('Success response data:', data);
      if (data.message) {
        successMessage = data.message;
      }
    } catch (e) {
      console.log('Failed to parse success response as JSON, but request was successful:', e);
    }
    
    // Show success notification
    showNotification(successMessage, 'success');
    document.querySelector('#password-recovery-form form').reset();
    showLoginForm();
    
  } catch (error) {
    console.error('Password recovery error:', error);
    
    // Reset button if it wasn't reset
    const recoveryButton = event.target.querySelector('button');
    if (recoveryButton.disabled) {
      recoveryButton.textContent = 'Enviar Enlace de Recuperación';
      recoveryButton.disabled = false;
    }
    
    // Show error notification
    if (error.message.includes('connection') || error.message === 'Failed to fetch') {
      showNotification('No se pudo conectar con el servidor. Por favor, intente de nuevo más tarde.', 'error');
    } else {
      showNotification(error.message, 'error');
    }
  }
}

// Check for logged in user after animations
setTimeout(checkLoggedInUser, 3500);

// Function to confirm account deletion - replacing the old implementation
function confirmDeleteAccount() {
  const dialog = document.getElementById('confirmation-dialog');
  const confirmBtn = document.getElementById('confirm-yes');
  const cancelBtn = document.getElementById('confirm-no');
  
  // Show the dialog
  dialog.style.display = 'flex';
  
  // Set up event listeners
  const handleConfirm = () => {
    dialog.style.display = 'none';
    deleteAccount();
    // Clean up event listeners
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleCancel = () => {
    dialog.style.display = 'none';
    // Clean up event listeners
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  // Add event listeners
  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
}

// Function to delete account - updating to handle incorrect password properly
async function deleteAccount() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (!currentUser || !currentUser.email) {
    showNotification('No hay una sesión activa', 'error');
    return;
  }
  
  // Create password dialog
  const passwordDialog = document.createElement('div');
  passwordDialog.className = 'confirmation-dialog';
  passwordDialog.innerHTML = `
    <div class="confirmation-content">
      <h3>Confirmar eliminación</h3>
      <p>Por favor, ingresa tu contraseña para confirmar la eliminación de la cuenta:</p>
      <input type="password" id="delete-password" class="delete-password-input">
      <p id="password-error" style="color: #ff0044; display: none; margin-top: 5px; font-size: 0.9em;">Contraseña incorrecta</p>
      <div class="confirmation-buttons">
        <button id="password-confirm" class="confirm-btn">Confirmar</button>
        <button id="password-cancel" class="cancel-btn">Cancelar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(passwordDialog);
  
  // Focus on password input
  setTimeout(() => {
    document.getElementById('delete-password').focus();
  }, 100);
  
  return new Promise((resolve) => {
    const confirmBtn = document.getElementById('password-confirm');
    const cancelBtn = document.getElementById('password-cancel');
    const passwordInput = document.getElementById('delete-password');
    const passwordError = document.getElementById('password-error');
    
    const handleConfirm = async () => {
      const password = passwordInput.value;
      
      if (!password) {
        passwordError.textContent = 'Debes ingresar tu contraseña';
        passwordError.style.display = 'block';
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/delete-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ 
            email: currentUser.email, 
            password: password 
          })
        });
        
        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            // Check if it's an invalid credentials error
            if (response.status === 401) {
              passwordError.textContent = 'Contraseña incorrecta';
              passwordError.style.display = 'block';
              passwordInput.value = '';
              passwordInput.focus();
              return;
            }
            
            throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
          } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        
        // Remove dialog
        document.body.removeChild(passwordDialog);
        
        // Account deleted successfully
        showNotification('Tu cuenta ha sido eliminada correctamente', 'success');
        
        // Sign out and redirect to login
        localStorage.removeItem('currentUser');
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        
      } catch (error) {
        console.error('Delete account error:', error);
        
        // If it's not an authentication error (which is handled above)
        if (!passwordError.style.display || passwordError.style.display === 'none') {
          document.body.removeChild(passwordDialog);
          showNotification(`Error al eliminar la cuenta: ${error.message}`, 'error');
        }
      }
      
      resolve();
    };
    
    const handleCancel = () => {
      document.body.removeChild(passwordDialog);
      resolve();
    };
    
    // Add event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    // Allow Enter key to submit
    passwordInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        handleConfirm();
      }
    });
    
    // Hide error when typing
    passwordInput.addEventListener('input', () => {
      passwordError.style.display = 'none';
    });
  });
}

// Add this function to show notifications instead of alerts
function showNotification(message, type = 'info', duration = 5000) {
  // Check if container exists, create it if it doesn't
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to container
  container.appendChild(notification);
  
  // Remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 300);
  }, duration);
  
  return notification;
}