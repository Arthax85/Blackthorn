// Animation related code
window.onload = function () {
  console.log("Page loaded successfully");
  
  // Hide the container initially
  const container = document.getElementById('container');
  if (container) {
    container.style.display = 'none';
  }
  
  // Animation elements
  const logoContainer = document.getElementById('logo-container');
  const logo = document.getElementById('logo');
  const logoText = document.querySelector('.logo-text');
  
  // Make sure these elements exist before trying to animate them
  if (logo && logoContainer && logoText) {
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
        
        // Muestra el contenedor del formulario
        if (container) {
            container.style.display = 'block';
            setTimeout(() => {
                container.classList.add('visible');
            }, 100);
        }
        
        // Check for logged in user after animations
        setTimeout(checkLoggedInUser, 500);
    }, 3000); // Duración de la animación inicial
  }
};