// UI related functions

// Hacer las funciones disponibles globalmente
window.showLoginForm = function() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('password-recovery-form').style.display = 'none';
};

window.showRegisterForm = function() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('password-recovery-form').style.display = 'none';
};

// Function to show password recovery form
function showPasswordRecoveryForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('password-recovery-form').style.display = 'block';
  document.getElementById('user-info').style.display = 'none';
}

// Function to confirm account deletion
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

// Function to handle theme toggle
function toggleTheme() {
  const body = document.body;
  if (body.classList.contains('light-theme')) {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
  }
}

// Function to apply saved theme
function applyTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(`${savedTheme}-theme`);
}

// Apply theme when DOM is loaded
document.addEventListener('DOMContentLoaded', applyTheme);