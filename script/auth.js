// script/auth.js

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Auth !== 'undefined') {
    Auth.redirectIfAuthenticated();
  }

  const form = document.getElementById('auth-form');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const errorMsg = document.getElementById('error-message');
  const btnSubmit = document.getElementById('btn-submit');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Solo se limpia el mensaje al pulsar nuevamente el botón
    if (errorMsg) {
      errorMsg.textContent = '';
      errorMsg.style.display = 'none';
    }

    const user = userInput ? userInput.value.trim() : '';
    const pas = passInput ? passInput.value : '';

    if (!user || !pas) {
      mostrarError('Por favor completa todos los campos');
      return;
    }

    const textoOriginal = btnSubmit ? btnSubmit.textContent : 'Ingresar';
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Verificando...';
    }

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ user, pas }),
      });

      Auth.setSession(data.access_token, data.usuario);
      window.location.href = 'dashboard.html';
    } catch (err) {
      mostrarError('Contraseña incorrecta');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal;
      }
    }
  });

  function mostrarError(mensaje) {
    if (errorMsg) {
      errorMsg.textContent = mensaje;
      errorMsg.style.display = 'block';
    }
  }
});