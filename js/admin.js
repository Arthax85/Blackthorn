// Admin panel functionality
console.log('Admin.js loaded successfully');

// Initialize admin panel
function initAdminPanel() {
  if (!isAdmin()) {
    window.location.href = 'index.html';
    return;
  }
  
  loadUsers();
  
  // Set up event listeners
  document.getElementById('add-user-btn').addEventListener('click', showAddUserForm);
  document.getElementById('back-to-dashboard').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// Load all users
async function loadUsers() {
  try {
    const usersTable = document.getElementById('users-table-body');
    usersTable.innerHTML = '<tr><td colspan="6" class="loading-cell">Cargando usuarios...</td></tr>';
    
    const users = await getAllUsers();
    
    if (users.length === 0) {
      usersTable.innerHTML = '<tr><td colspan="6" class="empty-cell">No hay usuarios registrados</td></tr>';
      return;
    }
    
    usersTable.innerHTML = '';
    
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
    
  } catch (error) {
    console.error('Load users error:', error);
    const usersTable = document.getElementById('users-table-body');
    usersTable.innerHTML = `<tr><td colspan="6" class="error-cell">Error: ${error.message}</td></tr>`;
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
async function showEditUserForm(userId) {
  try {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const title = document.getElementById('modal-title');
    
    title.textContent = 'Editar Usuario';
    form.reset();
    form.setAttribute('data-mode', 'edit');
    form.setAttribute('data-id', userId);
    
    // Hide password field for editing
    document.getElementById('password-group').style.display = 'none';
    
    // Get user data
    const users = await getAllUsers();
    const user = users.find(u => u.id.toString() === userId.toString());
    
    if (!user) {
      showNotification('Usuario no encontrado', 'error');
      modal.style.display = 'none';
      return;
    }
    
    // Fill form with user data
    document.getElementById('user-name').value = user.name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role || 'user';
    
    modal.style.display = 'flex';
    
    // Set up form submission
    form.onsubmit = handleUserFormSubmit;
    
  } catch (error) {
    console.error('Show edit user form error:', error);
    showNotification(error.message, 'error');
  }
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
    if (mode === 'add') {
      // Register new user
      await register(null, userData);
    } else {
      // Update existing user
      await updateUser(userId, userData);
    }
    
    // Close modal and reload users
    document.getElementById('user-modal').style.display = 'none';
    loadUsers();
    
  } catch (error) {
    console.error('Handle user form error:', error);
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
      await deleteUserAdmin(userId);
      confirmDialog.style.display = 'none';
      loadUsers(); // Reload the user list after deletion
    } catch (error) {
      console.error('Delete user error:', error);
      showNotification(error.message, 'error');
    }
  };
  
  document.getElementById('confirm-no').onclick = () => {
    confirmDialog.style.display = 'none';
  };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the admin page
  if (document.getElementById('admin-panel')) {
    initAdminPanel();
  }
});