document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('loginError');

  // Obtener profesores registrados dinámicamente desde el panel admin
  const profesoresGuardados = JSON.parse(localStorage.getItem('cae_profesores') || '[]');
  const esProfesorRegistrado = profesoresGuardados.some(p => p.correo.toLowerCase() === email);

  if (email === 'admin@cae.com' && password === 'admin123') {
    localStorage.setItem('cae_session', JSON.stringify({ role: 'admin', user: email }));
    window.location.href = 'admin-matriculas.html';
  } else if ((email === 'profe@cae.com' || esProfesorRegistrado) && password.length >= 4) {
    localStorage.setItem('cae_session', JSON.stringify({ role: 'profesor', user: email }));
    alert(`Acceso autorizado como Profesor (${email}). La vista del profesor se conectará a continuación.`);
  } else if (email === 'acudiente@cae.com' && password === 'acudiente123') {
    localStorage.setItem('cae_session', JSON.stringify({ role: 'acudiente', user: email }));
    alert('Acceso autorizado como Acudiente.');
  } else {
    errorMsg.classList.remove('hidden');
  }
});
