// Admin panel functionality
console.log('Admin.js loaded successfully');

// Fallback notification function in case notifications.js fails to load
if (typeof showNotification !== 'function') {
  console.warn('Notifications script not loaded, using fallback notification function');
  
  // Add fallback CSS for notifications
  const notificationStyles = document.createElement('style');
  notificationStyles.textContent = `
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      transition: all 0.3s ease;
    }
    .notification.info { background-color: #e7f3fe; border-left: 5px solid #2196F3; }
    .notification.success { background-color: #e8f5e9; border-left: 5px solid #4CAF50; }
    .notification.warning { background-color: #fffde7; border-left: 5px solid #FFC107; }
    .notification.error { background-color: #ffebee; border-left: 5px solid #F44336; }
    .notification-content { display: flex; justify-content: space-between; align-items: center; }
    .notification-close { background: none; border: none; font-size: 20px; cursor: pointer; }
  `;
  document.head.appendChild(notificationStyles);
  
  function showNotification(message, type = 'info') {
    console.log(`Notification (${type}): ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add event listener to close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

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
    
    // Try to fetch users from the real API
    try {
      console.log('Attempting to fetch users from real database');
      
      // API URL - using the real API endpoint
      const API_URL = 'https://blackthorn-auth.onrender.com';
      
      // Log the request details for debugging
      console.log('Making request to:', `${API_URL}/api/users`);
      console.log('With token:', currentUser.token ? `${currentUser.token.substring(0, 10)}...` : 'No token');
      
      // Make the API request
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
          'Accept': 'application/json'
        }
      });
      
      // Log response details for debugging
      console.log('API Response status:', response.status);
      console.log('API Response headers:', [...response.headers.entries()]);
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
      }
      
      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const bodyText = await response.text();
        console.error('Non-JSON response body:', bodyText.substring(0, 500) + '...');
        throw new Error(`Respuesta no válida: esperaba JSON pero recibió ${contentType || 'unknown'}`);
      }
      
      // Parse the response
      const data = await response.json();
      console.log('Users data from API:', data);
      
      // Handle different response formats
      let users = [];
      if (Array.isArray(data)) {
        users = data;
      } else if (data.users && Array.isArray(data.users)) {
        users = data.users;
      } else if (data.data && Array.isArray(data.data)) {
        users = data.data;
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('Formato de respuesta inesperado');
      }
      
      // Display the users
      displayUsers(users);
      
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // Add more detailed error message
      let errorMessage = apiError.message;
      if (errorMessage.includes('text/html')) {
        errorMessage = 'El servidor devolvió una página HTML en lugar de datos JSON. Es posible que la API no esté configurada correctamente.';
      }
      
      // Fall back to mock data if API fails
      console.warn('Falling back to mock data due to API error');
      
      // Check if we have stored mock users in localStorage
      let mockUsers = [];
      try {
        const storedMockUsers = localStorage.getItem('mockUsers');
        if (storedMockUsers) {
          mockUsers = JSON.parse(storedMockUsers);
          console.log('Loaded stored mock users:', mockUsers.length);
        }
      } catch (e) {
        console.warn('Could not load stored mock users:', e);
      }
      
      // If no stored mock users, create initial set
      if (!mockUsers || mockUsers.length === 0) {
        console.log('Creating initial mock users');
        mockUsers = [
          { 
            id: 1, 
            name: 'Usuario Regular', 
            email: 'usuario@example.com', 
            role: 'user', 
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          { 
            id: 2, 
            name: currentUser.name || 'Admin', 
            email: currentUser.email, 
            role: 'admin', 
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          { 
            id: 3, 
            name: 'María López', 
            email: 'maria@example.com', 
            role: 'user', 
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          { 
            id: 4, 
            name: 'Carlos Rodríguez', 
            email: 'carlos@example.com', 
            role: 'user', 
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        // Store in localStorage for persistence
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
      }
      
      // Display the mock users
      displayUsers(mockUsers);
      
      // Show a notification explaining the situation
      showNotification(`Error al conectar con la base de datos: ${apiError.message}. Usando datos locales.`, 'warning');
    }
    
  } catch (error) {
    console.error('Load users error:', error);
    const usersTable = document.getElementById('users-table-body');
    usersTable.innerHTML = `<tr><td colspan="6" class="error-cell">Error: ${error.message}</td></tr>`;
    
    // Show notification with more details
    showNotification(`Error al cargar usuarios: ${error.message}`, 'error');
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
    if (!currentUser || !currentUser.email) {
      throw new Error('No hay una sesión activa');
    }
    
    // API URL
    const API_URL = 'https://blackthorn-auth.onrender.com';
    
    let response;
    
    // Try to use the real API
    try {
      if (mode === 'add') {
        // Create new user
        response = await fetch(`${API_URL}/api/debug/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
            // Removed Authorization header for debug endpoint
          },
          body: JSON.stringify(userData)
        });
      } else {
        // Update existing user
        response = await fetch(`${API_URL}/api/debug/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
            // Removed Authorization header for debug endpoint
          },
          body: JSON.stringify(userData)
        });
      }
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Respuesta no válida: esperaba JSON pero recibió ${contentType || 'unknown'}`);
      }
      
      // Parse the response
      const data = await response.json();
      console.log('API response:', data);
      
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
      
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // Fall back to mock data if API fails
      console.warn('Falling back to mock data due to API error');
      
      // Since we're using mock data, update the mock users in localStorage
      let mockUsers = [];
      try {
        const storedMockUsers = localStorage.getItem('mockUsers');
        if (storedMockUsers) {
          mockUsers = JSON.parse(storedMockUsers);
        }
      } catch (e) {
        console.warn('Could not load stored mock users:', e);
        mockUsers = [];
      }
      
      if (mode === 'add') {
        // Create new user with a new ID
        const newId = mockUsers.length > 0 ? Math.max(...mockUsers.map(u => u.id)) + 1 : 1;
        const newUser = {
          id: newId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          createdAt: new Date().toISOString()
        };
        mockUsers.push(newUser);
        console.log('Added new mock user:', newUser);
      } else {
        // Update existing user
        const userIndex = mockUsers.findIndex(u => u.id == userId);
        if (userIndex === -1) {
          throw new Error('Usuario no encontrado');
        }
        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          name: userData.name,
          email: userData.email,
          role: userData.role
        };
        console.log('Updated mock user:', mockUsers[userIndex]);
      }
      
      // Save updated mock users
      localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
      
      // Close modal
      document.getElementById('user-modal').style.display = 'none';
      
      // Reload users to get fresh data
      loadUsers();
      
      // Show success notification
      if (mode === 'add') {
        showNotification('Usuario agregado correctamente (datos locales)', 'success');
      } else {
        showNotification('Usuario actualizado correctamente (datos locales)', 'success');
      }
    }
    
  } catch (error) {
    console.error('Form submission error:', error);
    showNotification(error.message, 'error');
  }
}

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
      if (!currentUser || !currentUser.email) {
        throw new Error('No hay una sesión activa');
      }
      
      // Get the user row to access the full user data
      const userRow = document.querySelector(`.delete-btn[data-id="${userId}"]`).closest('tr');
      const userData = JSON.parse(userRow.getAttribute('data-user'));
      
      // API URL - use the real API endpoint instead of debug
      const API_URL = 'https://blackthorn-auth.onrender.com';
      
      // Try to use the real API
      try {
        console.log(`Attempting to delete user with ID: ${userId}`);
        
        // Delete user - try the real API endpoint with authentication
        const response = await fetch(`${API_URL}/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`
          }
        });
        
        // Check if the request was successful
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Delete error response:', errorText);
          throw new Error(`Error del servidor: ${response.status}`);
        }
        
        // For DELETE requests, we may not always get a response body
        // Only try to parse JSON if we have a content-type header indicating JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('API response:', data);
        }
        
        // Close the confirmation dialog
        confirmDialog.style.display = 'none';
        
        // Show success notification
        showNotification('Usuario eliminado correctamente', 'success');
        
        // Reload users to refresh the table
        loadUsers();
        
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // Fall back to mock data if API fails
        console.warn('Falling back to mock data due to API error');
        
        // Since we're using mock data, update the mock users in localStorage
        let mockUsers = [];
        try {
          const storedMockUsers = localStorage.getItem('mockUsers');
          if (storedMockUsers) {
            mockUsers = JSON.parse(storedMockUsers);
          }
        } catch (e) {
          console.warn('Could not load stored mock users:', e);
          mockUsers = [];
        }
        
        // Find the user by email instead of ID (more reliable)
        const userEmail = userData.email;
        const userToDelete = mockUsers.find(u => u.email === userEmail);
        
        if (!userToDelete) {
          console.error('User not found in mock data:', userData);
          throw new Error('Usuario no encontrado en datos locales');
        }
        
        if (userToDelete.email === currentUser.email) {
          throw new Error('No puedes eliminar tu propio usuario');
        }
        
        // Remove the user from the array
        const newMockUsers = mockUsers.filter(u => u.email !== userEmail);
        
        // Save updated mock users
        localStorage.setItem('mockUsers', JSON.stringify(newMockUsers));
        
        // Close the confirmation dialog
        confirmDialog.style.display = 'none';
        
        // Show success notification
        showNotification('Usuario eliminado correctamente (datos locales)', 'success');
        
        // Reload users to refresh the table
        loadUsers();
      }
      
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
    // Store the original user object as a data attribute for later use
    const row = document.createElement('tr');
    row.setAttribute('data-user', JSON.stringify(user));
    
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