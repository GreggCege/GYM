// Escuchar cambios en el estado de autenticación
auth.onAuthStateChanged((user) => {
    // Si la página NO es el login y el usuario NO está logueado, expulsarlo al login
    if (!user && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
    // Si la página ES el login y el usuario SÍ está logueado, mandarlo al inicio
    else if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }

    // Opcional: Mostrar nombre o correo del logueado en la UI (si existe el elemento)
    if (user) {
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) {
            let nombreMostrado = user.displayName;

            // Si es una cuenta vieja que no tiene nombre, le preguntamos para actualizarla
            if (!nombreMostrado) {
                nombreMostrado = prompt("No tienes un nombre de usuario configurado. ¿Cómo te llamas?") || user.email.split('@')[0];
                user.updateProfile({ displayName: nombreMostrado }).then(() => {
                    // Recargar para mostrar el nuevo nombre
                    window.location.reload();
                });
            }

            userInfoElement.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px; font-size: 0.9rem; color: var(--text-muted);">
                    Hola, <b>${nombreMostrado}</b> 
                    <a href="#" id="btnLogout" style="color: #ef4444; margin-left: 10px; text-decoration: none;">Cerrar sesión</a>
                </div>
            `;

            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut().then(() => {
                    window.location.href = 'login.html';
                });
            });
        }

        // Disparar un evento personalizado para indicar que el usuario está listo y Firebase Auth ha terminado de cargar
        // Esto sirve para que los otros scripts sepan cuándo pueden empezar a cargar datos de la BD
        const event = new CustomEvent('authReady', { detail: { uid: user.uid } });
        window.dispatchEvent(event);
    }
});
