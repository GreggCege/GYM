document.addEventListener('DOMContentLoaded', () => {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    let currentUserUid = null;

    // Escuchar cuando la sesión esté lista
    window.addEventListener('authReady', (e) => {
        currentUserUid = e.detail.uid;
        loadRoutine();
    });

    // Función para guardar toda la rutina en la BD
    function saveRoutine() {
        if (!currentUserUid) return;
        const routineData = {};
        days.forEach(day => {
            const listElement = document.getElementById(`list-${day}`);
            if (listElement) {
                const items = listElement.querySelectorAll('.routine-item span');
                routineData[day] = Array.from(items).map(span => span.textContent);
            }
        });
        db.collection('users').doc(currentUserUid).collection('routines').doc('data').set(routineData);
    }

    // Función para cargar la rutina desde la BD
    function loadRoutine() {
        if (!currentUserUid) return;
        
        // Limpiar rutinas visuales primero para no duplicar en caso de recargas raras
        days.forEach(day => {
            const listElement = document.getElementById(`list-${day}`);
            if(listElement) listElement.innerHTML = '';
        });

        db.collection('users').doc(currentUserUid).collection('routines').doc('data').get()
            .then((doc) => {
                if (doc.exists) {
                    const routineData = doc.data();
                    days.forEach(day => {
                        if (routineData[day]) {
                            routineData[day].forEach(exerciseName => {
                                addExerciseToRoutine(exerciseName, day, false); 
                            });
                        }
                    });
                }
            });
    }

    // 1. Inicializar SortableJS en cada lista de días para poder arrastrar y soltar
    days.forEach(day => {
        const listElement = document.getElementById(`list-${day}`);
        if (listElement) {
            new Sortable(listElement, {
                group: 'shared', // permite arrastrar entre todas las listas del grupo 'shared'
                animation: 150,
                ghostClass: 'sortable-ghost',
                onSort: () => {
                    saveRoutine(); // Guardar cada vez que el usuario reacomoda o mueve un ejercicio
                }
            });
        }
    });

    // 2. Lógica para añadir ejercicios a la rutina usando los botones
    const addButtons = document.querySelectorAll('.btn-add');

    addButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const exerciseName = e.target.getAttribute('data-name');
            // Encontrar el select correspondiente en la misma tarjeta
            const selectElement = e.target.parentElement.querySelector('.day-select');
            const selectedDay = selectElement.value;

            addExerciseToRoutine(exerciseName, selectedDay, true); // true para guardar cuando el usuario lo añade manualmente
        });
    });

    // Función que crea el elemento en el DOM
    function addExerciseToRoutine(name, day, save = true) {
        const listElement = document.getElementById(`list-${day}`);
        if (!listElement) return;

        // Crear elemento de la lista (routine-item)
        const item = document.createElement('div');
        item.className = 'routine-item';

        // Texto del ejercicio
        const textSpan = document.createElement('span');
        textSpan.textContent = name;

        // Botón de eliminar
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Eliminar';
        deleteBtn.onclick = () => {
            item.remove();
            saveRoutine(); // Guardar cada vez que se elimina un ejercicio
        };

        item.appendChild(textSpan);
        item.appendChild(deleteBtn);

        listElement.appendChild(item);

        if (save) {
            saveRoutine();
        }
    }

    // Initial load happens in authReady now
});
