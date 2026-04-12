const sleepForm = document.getElementById('sleepForm');
const sleepRecords = document.getElementById('sleepRecords');

// Poner la fecha de hoy por defecto apenas cargue la página
document.getElementById('sleepDate').valueAsDate = new Date();

// Extraer los registros guardados del "localStorage" del navegador, para persistencia
let records = JSON.parse(localStorage.getItem('sleepRecords')) || [];

// Función matemática que cálcula la diferencia entre 2 horas (considerando cambios de día)
function calculateSleepHours(sleepTime, wakeTime) {
    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
    const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);

    let sleepDate = new Date();
    sleepDate.setHours(sleepHours, sleepMinutes, 0);

    let wakeDate = new Date();
    wakeDate.setHours(wakeHours, wakeMinutes, 0);

    // Lógica: Si la hora de despertar es cronológicamente anterior a la de dormir, significa que se despertó al día siguiente. 
    // Ej: Durmió 23:00, Despertó 07:00
    if (wakeDate < sleepDate) {
        wakeDate.setDate(wakeDate.getDate() + 1);
    }

    const diffMs = wakeDate - sleepDate;
    const totalHours = diffMs / (1000 * 60 * 60);

    return totalHours.toFixed(1); // Redondear a 1 decimal
}

// Renderiza los registros HTML en pantalla basándose en el arreglo dinámico
function renderRecords() {
    sleepRecords.innerHTML = '';

    if (records.length === 0) {
        sleepRecords.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No has registrado tus horas de sueño. ¡Empieza hoy!</p>';
        return;
    }

    // Ordenamos los registros por fecha, desde el más nuevo al más viejo
    const sortedRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedRecords.forEach((record, index) => {
        const item = document.createElement('div');
        item.className = 'log-item';

        // Dar formato de fecha amigable (DD/MM/YYYY)
        const recordDate = new Date(record.date);
        recordDate.setMinutes(recordDate.getMinutes() + recordDate.getTimezoneOffset()); // Arreglo de zona horaria del input date
        const dateString = recordDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        item.innerHTML = `
            <div style="flex: 1;">
                <div style="font-size: 0.9rem; color: var(--text-muted); text-transform: capitalize; margin-bottom: 5px;">${dateString}</div>
                <div style="font-size: 1rem;">Se durmió: <b>${sleepTime}</b> - Se despertó: <b>${wakeTime}</b></div>
            </div>
            <div style="text-align: right; margin-left: 1rem;">
                <strong>${record.hours}h</strong>
                <br>
                <button class="delete-btn" onclick="deleteRecord('${record.date}')" style="margin-top: 8px;">Eliminar</button>
            </div>
        `;
        // Fix string literals missing from original rendering code:
        item.innerHTML = `
            <div style="flex: 1;">
                <div style="font-size: 0.9rem; color: var(--text-muted); text-transform: capitalize; margin-bottom: 5px;">${dateString}</div>
                <div style="font-size: 1rem;">Se durmió: <b>${record.sleepTime}</b> - Se despertó: <b>${record.wakeTime}</b></div>
            </div>
            <div style="text-align: right; margin-left: 1rem;">
                <strong>${record.hours}h</strong>
                <br>
                <button class="delete-btn" onclick="deleteRecord('${record.date}')" style="margin-top: 8px;">Eliminar</button>
            </div>
        `;
        sleepRecords.appendChild(item);
    });
}

// Borra un registro usando su fecha (Identificador provicional) y recalcula la lista
window.deleteRecord = function (dateToMatch) {
    records = records.filter(record => record.date !== dateToMatch);
    localStorage.setItem('sleepRecords', JSON.stringify(records));
    renderRecords();
}

// Evento que capta cuando el usuario envía el botón del formulario
sleepForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Evita recargar la página

    const date = document.getElementById('sleepDate').value;
    const sleepTime = document.getElementById('sleepTime').value;
    const wakeTime = document.getElementById('wakeTime').value;

    // Revisar si ya existe un registro en esa misma fecha
    const existingIndex = records.findIndex(r => r.date === date);
    if (existingIndex !== -1) {
        alert("Ya tienes un registro en esta fecha. Bórralo si deseas reemplazarlo.");
        return;
    }

    const hours = calculateSleepHours(sleepTime, wakeTime);

    records.push({ date, sleepTime, wakeTime, hours });
    localStorage.setItem('sleepRecords', JSON.stringify(records)); // Se guarda instantaneamente en el navegador

    renderRecords();
});

// Al iniciar por primera vez, pintar todo.
renderRecords();