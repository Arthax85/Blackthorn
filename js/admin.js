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
// Function to check if user is admin
function isAdmin() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        console.log('Current user data:', currentUser);
        return currentUser && (
            currentUser.role === 'admin' || 
            currentUser.email === 'zerocult_new@hotmail.com'
        );
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

async function loadUsers() {
    try {
        const usersTable = document.getElementById('users-table-body');
        usersTable.innerHTML = '<tr><td colspan="6" class="loading-cell">Cargando usuarios...</td></tr>';
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        console.log('Current user data:', currentUser);

        const SUPABASE_URL = 'https://efemxvfuepbbqnmqzazt.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW14dmZ1ZXBiYnFubXF6YXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODE4MjEsImV4cCI6MjA1Nzg1NzgyMX0.gBZfJXvQKSgWqkJ_N4Mccs9DXwMmqAKWXjOSOx4m9-c';

        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Log response for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html?error=session_expired';
                throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        console.log('Users data from API:', data);
        
        let users = [];
        if (Array.isArray(data)) {
            users = data;
        } else if (data.users && Array.isArray(data.users)) {
            users = data.users;
        } else if (data.data && Array.isArray(data.data)) {
            users = data.data;
        } else {
            throw new Error('Formato de respuesta inesperado');
        }
        
        displayUsers(users);
        
    } catch (error) {
        console.error('Load users error:', error);
        const usersTable = document.getElementById('users-table-body');
        usersTable.innerHTML = `<tr><td colspan="6" class="error-cell">Error: ${error.message}</td></tr>`;
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
    
    try {
        const SUPABASE_URL = 'https://efemxvfuepbbqnmqzazt.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW14dmZ1ZXBiYnFubXF6YXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODE4MjEsImV4cCI6MjA1Nzg1NzgyMX0.gBZfJXvQKSgWqkJ_N4Mccs9DXwMmqAKWXjOSOx4m9-c';
        
        let response;
        if (mode === 'add') {
            // First create auth user
            const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userData.email,
                    password: document.getElementById('user-password').value
                })
            });

            if (!authResponse.ok) {
                throw new Error(`Error al crear usuario: ${authResponse.status}`);
            }

            const authData = await authResponse.json();
            
            // Then create profile
            response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    id: authData.user.id,
                    ...userData
                })
            });
        } else {
            response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(userData)
            });
        }

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        document.getElementById('user-modal').style.display = 'none';
        loadUsers();
        showNotification(
            mode === 'add' ? 'Usuario agregado correctamente' : 'Usuario actualizado correctamente',
            'success'
        );

    } catch (error) {
        console.error('Form submission error:', error);
        showNotification(error.message, 'error');
    }
}

// Confirm delete user
async function confirmDeleteUser(userId) {
    const confirmDialog = document.getElementById('confirmation-dialog');
    const confirmMessage = document.getElementById('confirmation-message');
    
    confirmMessage.textContent = '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.';
    confirmDialog.style.display = 'flex';
    
    document.getElementById('confirm-yes').onclick = async () => {
        try {
            const SUPABASE_URL = 'https://efemxvfuepbbqnmqzazt.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW14dmZ1ZXBiYnFubXF6YXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODE4MjEsImV4cCI6MjA1Nzg1NzgyMX0.gBZfJXvQKSgWqkJ_N4Mccs9DXwMmqAKWXjOSOx4m9-c';

            // Delete profile first
            const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!profileResponse.ok) {
                throw new Error(`Error al eliminar perfil: ${profileResponse.status}`);
            }

            // Then delete auth user
            const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

            if (!authResponse.ok) {
                throw new Error(`Error al eliminar usuario: ${authResponse.status}`);
            }

            confirmDialog.style.display = 'none';
            showNotification('Usuario eliminado correctamente', 'success');
            loadUsers();

        } catch (error) {
            console.error('Delete user error:', error);
            showNotification(error.message, 'error');
            confirmDialog.style.display = 'none';
        }
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
        row.setAttribute('data-user', JSON.stringify(user));
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role || 'user'}</td>
            <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
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

// Add this at the bottom of the file, before the DOMContentLoaded event
function initAdminPanel() {
    console.log('Initializing admin panel...');
    
    // Check admin status
    if (!isAdmin()) {
        window.location.href = 'login.html';
        return;
    }

    // Add event listener for the "Add User" button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserForm);
    }

    // Load initial user data
    loadUsers();
}

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for admin panel...');
    if (document.getElementById('admin-panel')) {
        console.log('Admin panel found, initializing...');
        initAdminPanel();
    }
});