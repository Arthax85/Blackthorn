// Add this at the top of your auth.js file
console.log('Auth.js loaded successfully');

// API URL - Change this to your Render deployed backend URL
const API_URL = 'https://blackthorn-auth.onrender.com/api';

// Function to check if user is admin
function isAdmin() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  // Check both role and email for admin status
  const adminEmails = ['zerocult_new@hotmail.com'];
  return currentUser && (
    currentUser.role === 'admin' || 
    (currentUser.email && adminEmails.includes(currentUser.email.toLowerCase()))
  );
}

// Function to handle login
const SUPABASE_URL = 'https://efemxvfuepbbqnmqzazt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW14dmZ1ZXBiYnFubXF6YXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODE4MjEsImV4cCI6MjA1Nzg1NzgyMX0.gBZfJXvQKSgWqkJ_N4Mccs9DXwMmqAKWXjOSOx4m9-c';

// Update login function
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

        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                gotrue_meta_security: {}
            })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        // Reset button
        loginButton.textContent = originalText;
        loginButton.disabled = false;

        if (!response.ok) {
            if (response.status === 400 && data.error_description) {
                throw new Error(data.error_description);
            } else if (response.status === 401) {
                throw new Error('Usuario y/o contraseña incorrecta');
            } else {
                throw new Error(data.error || 'Error al iniciar sesión');
            }
        }

        // Format user data from Supabase response
        const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || email.split('@')[0],
            role: data.user.role || 'user',
            token: data.access_token
        };

        // Add admin role if email matches
        const adminEmails = ['zerocult_new@hotmail.com'];
        if (adminEmails.includes(email.toLowerCase())) {
            userData.role = 'admin';
        }

        // Update UI
        document.getElementById('user-name').innerText = userData.name;
        document.getElementById('user-email').innerText = userData.email;
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'none';
        
        // Show/hide admin panel link
        document.getElementById('admin-panel-link').style.display = 
            userData.role === 'admin' ? 'block' : 'none';
        
        // Reset form and save user data
        document.querySelector('#login-form form').reset();
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        showNotification('Inicio de sesión exitoso', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Error al iniciar sesión', 'error');
        
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

// Function to delete account
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
        
        // Show error notification
        if (error.message.includes('connection') || error.message === 'Failed to fetch') {
          showNotification('No se pudo conectar con el servidor. Por favor, intente de nuevo más tarde.', 'error');
        } else {
          showNotification(error.message || 'Error al eliminar la cuenta', 'error');
        }
      }
    };
    
    const handleCancel = () => {
      document.body.removeChild(passwordDialog);
      resolve(false);
    };
    
    // Add event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    // Allow pressing Enter to confirm
    passwordInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        handleConfirm();
      }
    });
  });
}

// Function to reset password with token
async function resetPassword(token, newPassword) {
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ token, newPassword })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al restablecer la contraseña');
    }
    
    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

// Function to validate token
async function validateToken(token) {
  try {
    const response = await fetch(`${API_URL}/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Token inválido o expirado');
    }
    
    return data;
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
}

// New function to get all users (admin only)
async function getAllUsers() {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.token) {
      throw new Error('No hay una sesión activa');
    }
    
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('No tienes permisos para acceder a esta información');
      }
      throw new Error('Error al obtener la lista de usuarios');
    }
    
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Get all users error:', error);
    showNotification(error.message, 'error');
    throw error;
  }
}

// Function to update user (admin only)
async function updateUser(userId, userData) {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.token) {
      throw new Error('No hay una sesión activa');
    }
    
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('No tienes permisos para modificar usuarios');
      }
      throw new Error('Error al actualizar el usuario');
    }
    
    const data = await response.json();
    showNotification('Usuario actualizado correctamente', 'success');
    return data.user;
  } catch (error) {
    console.error('Update user error:', error);
    showNotification(error.message, 'error');
    throw error;
  }
}

// Function to delete user (admin only)
async function deleteUserAdmin(userId) {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.token) {
      throw new Error('No hay una sesión activa');
    }
    
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('No tienes permisos para eliminar usuarios');
      }
      throw new Error('Error al eliminar el usuario');
    }
    
    showNotification('Usuario eliminado correctamente', 'success');
    return true;
  } catch (error) {
    console.error('Delete user error:', error);
    showNotification(error.message, 'error');
    throw error;
  }
}

// Export functions for use in other modules
// Note: In a browser environment without module bundling, these will be global functions
// If using a module bundler like webpack, you would use:
// export { login, register, recoverPassword, signOut, checkLoggedInUser, deleteAccount, resetPassword, validateToken };