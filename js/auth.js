document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('loginError');

  // Simulación de roles para la Versión 1
  if (email === 'admin@cae.com' && password === 'admin123') {
    localStorage.setItem('cae_session', JSON.stringify({ role: 'admin', user: email }));
    window.location.href = 'admin-matriculas.html';
  } else if (email === 'profe@cae.com' && password === 'profe123') {
    localStorage.setItem('cae_session', JSON.stringify({ role: 'profesor', user: email }));
    alert('Acceso autorizado como Profesor. (Capa en desarrollo)');
  } else if (email === 'acudiente@cae.com' && password === 'acudiente123') {
    localStorage.setItem('cae_session', JSON.stringify({ role: 'acudiente', user: email }));
    alert('Acceso autorizado como Acudiente. (Capa en desarrollo)');
  } else {
    errorMsg.classList.remove('hidden');
  }
});
