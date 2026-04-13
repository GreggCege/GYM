document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const authForm = document.getElementById('authForm');
    const btnSubmit = document.getElementById('btn-submit');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const usernameGroup = document.getElementById('username-group');
    const usernameInput = document.getElementById('username');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const errorMsg = document.getElementById('error-message');

    let isLoginMode = true;

    // Cambiar entre Pestañas de Login / Registro
    tabLogin.addEventListener('click', () => {
        isLoginMode = true;
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        usernameGroup.style.display = 'none';
        usernameInput.removeAttribute('required');
        btnSubmit.textContent = 'Entrar';
        errorMsg.textContent = '';
    });

    tabRegister.addEventListener('click', () => {
        isLoginMode = false;
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        usernameGroup.style.display = 'block';
        usernameInput.setAttribute('required', 'true');
        btnSubmit.textContent = 'Crear Cuenta';
        errorMsg.textContent = '';
    });

    // Revelar / Ocultar Contraseña
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        // Cambiar icono basado en el estado
        togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // Enviar el formulario
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;
        btnSubmit.disabled = true; // Prevenir múltiples clicks

        if (isLoginMode) {
            // Lógica para Iniciar Sesión con Firebase
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // El auth-onAuthStateChanged en auth-guard.js se encargará de redirigir
                    console.log('Inicio de sesión exitoso');
                })
                .catch((error) => {
                    btnSubmit.disabled = false;
                    mostrarError(error.code);
                });
        } else {
            // Lógica para Crear Nueva Cuenta con Firebase
            const username = usernameInput.value;
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Actualizar el perfil del usuario con su nombre
                    return userCredential.user.updateProfile({
                        displayName: username
                    });
                })
                .then(() => {
                    console.log('Cuenta y perfil creados exitosamente');
                    // Forzar redirección aquí en caso de que onAuthStateChanged haya saltado antes de tener displayName
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    btnSubmit.disabled = false;
                    mostrarError(error.code);
                });
        }
    });

    function mostrarError(errorCode) {
        let mensaje = "Ocurrió un error. Intenta de nuevo.";
        switch (errorCode) {
            case 'auth/invalid-email':
                mensaje = "El correo electrónico no es válido.";
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                mensaje = "Correo o contraseña incorrectos.";
                break;
            case 'auth/email-already-in-use':
                mensaje = "Ya existe una cuenta con este correo.";
                break;
            case 'auth/weak-password':
                mensaje = "La contraseña debe tener al menos 6 caracteres.";
                break;
        }
        errorMsg.textContent = mensaje;
    }
});
