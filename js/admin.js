// Admin panel functionality
console.log('Admin.js loaded successfully');

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
  
  // Mock data for testing if API is not available
  const mockUsers = [
    { id: 1, name: 'Usuario de Prueba', email: 'test@example.com', role: 'user', createdAt: new Date() },
    { id: 2, name: 'Admin', email: 'zerocult_new@hotmail.com', role: 'admin', createdAt: new Date() }
  ];
  
  // Display mock data if API call fails
  displayUsers(mockUsers);
  
  // Set up event listeners
  document.getElementById('add-user-btn').addEventListener('click', showAddUserForm);
  document.getElementById('back-to-dashboard').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// Display users in the table
function displayUsers(users) {
  const usersTable = document.getElementById('users-table-body');
  
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the admin page
  if (document.getElementById('admin-panel')) {
    initAdminPanel();
  }
});