document.addEventListener('DOMContentLoaded', () => {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

    // Función para guardar toda la rutina en LocalStorage
    function saveRoutine() {
        const routineData = {};
        days.forEach(day => {
            const listElement = document.getElementById(`list-${day}`);
            if (listElement) {
                // Obtenemos el texto de cada span dentro de esta lista de día
                const items = listElement.querySelectorAll('.routine-item span');
                routineData[day] = Array.from(items).map(span => span.textContent);
            }
        });
        localStorage.setItem('gymRoutine', JSON.stringify(routineData));
    }

    // Función para cargar la rutina desde LocalStorage
    function loadRoutine() {
        const savedData = localStorage.getItem('gymRoutine');
        if (savedData) {
            const routineData = JSON.parse(savedData);
            days.forEach(day => {
                if (routineData[day]) {
                    routineData[day].forEach(exerciseName => {
                        addExerciseToRoutine(exerciseName, day, false); // false para no re-guardar durante la carga inicial
                    });
                }
            });
        }
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

    // 3. Cargar la rutina inicial al renderizar la página
    loadRoutine();
});
