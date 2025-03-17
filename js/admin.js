// Admin panel functionality
console.log('Admin.js loaded successfully');

// Function to check if user is admin (if not defined in auth.js)
function isAdmin() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  // Check both role and email for admin status
  const adminEmails = ['zerocult_new@hotmail.com']; // Your admin email
  return currentUser && (
    currentUser.role === 'admin' || 
    (currentUser.email && adminEmails.includes(currentUser.email.toLowerCase()))
  );
}

// Initialize admin panel
function initAdminPanel() {
  console.log('Initializing admin panel');
  console.log('Admin check:', isAdmin());
  
  // Check if user is admin
  if (!isAdmin()) {
    console.log('Not an admin, redirecting to index');
    showNotification('Acceso denegado: No tienes permisos de administrador', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return;
  }
  
  console.log('Admin access granted, loading users');
  
  // Load real users from database
  loadUsers();
  
  // Set up event listeners
  document.getElementById('add-user-btn').addEventListener('click', showAddUserForm);
  document.getElementById('back-to-dashboard').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// Load all users from the database
async function loadUsers() {
  try {
    const usersTable = document.getElementById('users-table-body');
    usersTable.innerHTML = '<tr><td colspan="6" class="loading-cell">Cargando usuarios...</td></tr>';
    
    // Get current user from localStorage - with better error handling
    let currentUser;
    try {
      const userData = localStorage.getItem('currentUser');
      console.log('Raw user data from localStorage:', userData);
      
      if (!userData) {
        throw new Error('No user data found in localStorage');
      }
      
      currentUser = JSON.parse(userData);
      console.log('Parsed current user:', currentUser);
      
      if (!currentUser || !currentUser.email) {
        throw new Error('Invalid user data in localStorage');
      }
    } catch (userError) {
      console.error('Error getting user data:', userError);
      throw new Error('No hay una sesión activa válida. Por favor, inicia sesión nuevamente.');
    }
    
    // Check if we have a token
    if (!currentUser.token) {
      console.warn('No token found in user data');
      // Add a mock token for testing
      currentUser.token = 'mock-token-' + btoa(currentUser.email + ':' + Date.now());
      // Update localStorage with the token
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      console.log('Added mock token to user data');
    }
    
    // Check if token is a mock token (starts with 'mock-token-')
    const isMockToken = currentUser.token.startsWith('mock-token-');
    
    // If using a mock token, just show mock data
    if (isMockToken) {
      console.warn('Using mock token, showing mock data');
      const mockUsers = [
        { id: 1, name: 'Usuario de Prueba (DATOS LOCALES)', email: 'test@example.com', role: 'user', createdAt: new Date() },
        { id: 2, name: 'Admin (DATOS LOCALES)', email: 'zerocult_new@hotmail.com', role: 'admin', createdAt: new Date() },
        { id: 3, name: 'Usuario Real (SIMULADO)', email: 'usuario@example.com', role: 'user', createdAt: new Date(Date.now() - 86400000) }
      ];
      displayUsers(mockUsers);
      return;
    }
    
    // Continue with real API call if we have a real token
    // Get the API URL from the global variable or define it here
    const API_URL = window.API_URL || 'https://blackthorn-auth.onrender.com/api';
    
    // Try different endpoints to get users
    let response;
    let endpoint = '/users';
    
    // First try the /users endpoint
    console.log('Trying to fetch from:', `${API_URL}${endpoint}`);
    response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    
    // If that fails, try the /admin/users endpoint
    if (!response.ok) {
      endpoint = '/admin/users';
      console.log('Trying alternate endpoint:', `${API_URL}${endpoint}`);
      response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': currentUser.token ? `Bearer ${currentUser.token}` : ''
        },
        credentials: 'include'
      });
      console.log('Alternate endpoint response status:', response.status);
    }
    
    if (!response.ok) {
      throw new Error(`Error al obtener usuarios (${response.status}): ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log('Users data received:', data);
    
    // Handle different response formats
    let users = [];
    if (Array.isArray(data)) {
      users = data;
    } else if (data.users && Array.isArray(data.users)) {
      users = data.users;
    } else if (data.data && Array.isArray(data.data)) {
      users = data.data;
    } else {
      console.error('Unexpected data structure:', data);
      throw new Error('Formato de datos inesperado');
    }
    
    if (users.length === 0) {
      usersTable.innerHTML = '<tr><td colspan="6" class="empty-cell">No hay usuarios registrados</td></tr>';
      return;
    }
    
    // Display the real users
    displayUsers(users);
    
  } catch (error) {
    console.error('Load users error:', error);
    const usersTable = document.getElementById('users-table-body');
    usersTable.innerHTML = `<tr><td colspan="6" class="error-cell">Error: ${error.message}</td></tr>`;
    
    // Show notification with more details
    showNotification(`Error al cargar usuarios: ${error.message}`, 'error');
    
    // If API fails, show mock data as fallback but with clear indication
    const mockUsers = [
      { id: 1, name: 'Usuario de Prueba (DATOS LOCALES)', email: 'test@example.com', role: 'user', createdAt: new Date() },
      { id: 2, name: 'Admin (DATOS LOCALES)', email: 'zerocult_new@hotmail.com', role: 'admin', createdAt: new Date() }
    ];
    displayUsers(mockUsers);
  }
}

// Show add user form
function showAddUserForm() {
  const modal = document.getElementById('user-modal');
  const form = document.getElementById('user-form');
  const title = document.getElementById('modal-title');
  
  title.textContent = 'Agregar Usuario';
  form.reset();
  form.setAttribute('data-mode', 'add');
  
  // Show password field for new users
  document.getElementById('password-group').style.display = 'block';
  
  modal.style.display = 'flex';
  
  // Set up form submission
  form.onsubmit = handleUserFormSubmit;
}

// Show edit user form
function showEditUserForm(userId) {
  const modal = document.getElementById('user-modal');
  const form = document.getElementById('user-form');
  const title = document.getElementById('modal-title');
  
  title.textContent = 'Editar Usuario';
  form.reset();
  form.setAttribute('data-mode', 'edit');
  form.setAttribute('data-id', userId);
  
  // Hide password field for editing
  document.getElementById('password-group').style.display = 'none';
  
  // Get user data from the table
  const userRow = document.querySelector(`.delete-btn[data-id="${userId}"]`).closest('tr');
  const userName = userRow.cells[1].textContent;
  const userEmail = userRow.cells[2].textContent;
  const userRole = userRow.cells[3].textContent;
  
  // Fill form with user data
  document.getElementById('user-name').value = userName;
  document.getElementById('user-email').value = userEmail;
  document.getElementById('user-role').value = userRole;
  
  modal.style.display = 'flex';
  
  // Set up form submission
  form.onsubmit = handleUserFormSubmit;
}

// Handle user form submission
async function handleUserFormSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const mode = form.getAttribute('data-mode');
  const userId = form.getAttribute('data-id');
  
  const userData = {
    name: document.getElementById('user-name').value,
    email: document.getElementById('user-email').value,
    role: document.getElementById('user-role').value
  };
  
  // Add password for new users
  if (mode === 'add') {
    userData.password = document.getElementById('user-password').value;
  }
  
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.token) {
      throw new Error('No hay una sesión activa');
    }
    
    // API URL from auth.js
    const API_URL = 'https://blackthorn-auth.onrender.com/api';
    
    let response;
    
    if (mode === 'add') {
      // Create new user
      response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(userData)
      });
    } else {
      // Update existing user
      response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(userData)
      });
    }
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('No tienes permisos para esta acción');
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en la operación');
    }
    
    // Close modal
    document.getElementById('user-modal').style.display = 'none';
    
    // Reload users to get fresh data
    loadUsers();
    
    // Show success notification
    if (mode === 'add') {
      showNotification('Usuario agregado correctamente', 'success');
    } else {
      showNotification('Usuario actualizado correctamente', 'success');
    }
    
  } catch (error) {
    console.error('Form submission error:', error);
    showNotification(error.message, 'error');
  }
}

// Confirm delete user
// Confirm delete user
function confirmDeleteUser(userId) {
  const confirmDialog = document.getElementById('confirmation-dialog');
  const confirmMessage = document.getElementById('confirmation-message');
  
  confirmMessage.textContent = '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.';
  confirmDialog.style.display = 'flex';
  
  // Set up confirmation buttons
  document.getElementById('confirm-yes').onclick = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser || !currentUser.token) {
        throw new Error('No hay una sesión activa');
      }
      
      // API URL from auth.js
      const API_URL = 'https://blackthorn-auth.onrender.com/api';
      
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
      
      // Remove the user from the table
      const userRow = document.querySelector(`.delete-btn[data-id="${userId}"]`).closest('tr');
      userRow.remove();
      
      confirmDialog.style.display = 'none';
      showNotification('Usuario eliminado correctamente', 'success');
      
    } catch (error) {
      console.error('Delete user error:', error);
      showNotification(error.message, 'error');
      confirmDialog.style.display = 'none';
    }
  };
  
  document.getElementById('confirm-no').onclick = () => {
    confirmDialog.style.display = 'none';
  };
}

// Display users in the table
function displayUsers(users, append = false) {
  const usersTable = document.getElementById('users-table-body');
  
  if (!append) {
    if (users.length === 0) {
      usersTable.innerHTML = '<tr><td colspan="6" class="empty-cell">No hay usuarios registrados</td></tr>';
      return;
    }
    
    usersTable.innerHTML = '';
  }
  
  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role || 'user'}</td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="edit-btn" data-id="${user.id}">Editar</button>
        <button class="delete-btn" data-id="${user.id}">Eliminar</button>
      </td>
    `;
    usersTable.appendChild(row);
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => showEditUserForm(btn.getAttribute('data-id')));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDeleteUser(btn.getAttribute('data-id')));
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the admin page
  if (document.getElementById('admin-panel')) {
    initAdminPanel();
  }
});