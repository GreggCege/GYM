const macroForm = document.getElementById('macroForm');
const resultContainer = document.getElementById('resultContainer');
const btnEditar = document.getElementById('btnEditar');

const inputs = {
    peso: document.getElementById('peso'),
    estatura: document.getElementById('estatura'),
    edad: document.getElementById('edad'),
    genero: document.getElementById('genero'),
    actividad: document.getElementById('actividad'),
    objetivo: document.getElementById('objetivo')
};

const spans = {
    calorias: document.getElementById('caloriasTotal'),
    proteinas: document.getElementById('proteinasVal'),
    grasas: document.getElementById('grasasVal'),
    carbos: document.getElementById('carboVal')
};

// Firebase variables (assigned when auth is ready)
let currentUserUid = null;

// Escuchar evento personalizado de auth-guard.js
window.addEventListener('authReady', (e) => {
    currentUserUid = e.detail.uid;
    
    // Intentar cargar perfil guardado en la nube al abrir la página
    db.collection('users').doc(currentUserUid).collection('macros').doc('profile').get()
        .then((doc) => {
            if (doc.exists) {
                let savedProfile = doc.data();
                
                // Rellenar formulario con los datos guardados
                inputs.peso.value = savedProfile.peso;
                inputs.estatura.value = savedProfile.estatura;
                inputs.edad.value = savedProfile.edad;
                inputs.genero.value = savedProfile.genero;
                inputs.actividad.value = savedProfile.actividad;
                inputs.objetivo.value = savedProfile.objetivo;

                // Mostrar directamente el contenedor con los resultados guardados ocultando el formulario
                renderResults(savedProfile.resultados);
                macroForm.style.display = 'none';
            }
        });

    loadWeeklyData();
});

// Evento de hacer click en "Editar" vuelve a mostrar el formulario y oculta los resultados
btnEditar.addEventListener('click', function () {
    macroForm.style.display = 'block';
    resultContainer.style.display = 'none';

    setTimeout(() => {
        macroForm.scrollIntoView({ behavior: 'smooth' });
    }, 100);
});

macroForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const currentProfile = {
        peso: parseFloat(inputs.peso.value),
        estatura: parseFloat(inputs.estatura.value),
        edad: parseInt(inputs.edad.value),
        genero: inputs.genero.value,
        actividad: parseFloat(inputs.actividad.value),
        objetivo: inputs.objetivo.value
    };

    // Ecuación de Mifflin-St Jeor
    let bmr = (10 * currentProfile.peso) + (6.25 * currentProfile.estatura) - (5 * currentProfile.edad);

    if (currentProfile.genero === 'hombre') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    let tdee = Math.round(bmr * currentProfile.actividad);

    if (currentProfile.objetivo === 'definicion') {
        tdee -= 500;
    } else if (currentProfile.objetivo === 'volumen') {
        tdee += 300;
    }

    // Rangos de Proteínas
    const protMinGramos = Math.round(currentProfile.peso * 1.8);
    const protMaxGramos = Math.round(currentProfile.peso * 2.2);
    const protMinCalorias = protMinGramos * 4;
    const protMaxCalorias = protMaxGramos * 4;

    // Rangos de Grasas
    const grasasMinCalorias = Math.round(tdee * 0.20);
    const grasasMaxCalorias = Math.round(tdee * 0.30);
    const grasasMinGramos = Math.round(grasasMinCalorias / 9);
    const grasasMaxGramos = Math.round(grasasMaxCalorias / 9);

    // Rangos de Carbohidratos
    const carbMinCalorias = Math.max(0, tdee - (protMaxCalorias + grasasMaxCalorias));
    const carbMaxCalorias = Math.max(0, tdee - (protMinCalorias + grasasMinCalorias));
    const carbMinGramos = Math.round(carbMinCalorias / 4);
    const carbMaxGramos = Math.round(carbMaxCalorias / 4);

    // Guardar para la persistencia
    const resultados = {
        tdee: tdee,
        proteinas: `${protMinGramos}-${protMaxGramos}g`,
        grasas: `${grasasMinGramos}-${grasasMaxGramos}g`,
        carbos: `${carbMinGramos}-${carbMaxGramos}g`,
        // Promedios exactos para uso en la sección de seguimiento:
        pAvg: Math.round((protMinGramos + protMaxGramos) / 2),
        fAvg: Math.round((grasasMinGramos + grasasMaxGramos) / 2),
        cAvg: Math.round((carbMinGramos + carbMaxGramos) / 2)
    };

    currentProfile.resultados = resultados;
    
    if (currentUserUid) {
        db.collection('users').doc(currentUserUid).collection('macros').doc('profile').set(currentProfile);
    }

    // Mostrar UI ocultando el formulario
    renderResults(resultados);
    macroForm.style.display = 'none';

    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }, 100);
});

function renderResults(res) {
    spans.calorias.textContent = res.tdee;
    spans.proteinas.textContent = res.proteinas;
    spans.grasas.textContent = res.grasas;
    spans.carbos.textContent = res.carbos;

    resultContainer.style.display = 'block';
}

// ------ LÓGICA DE SEGUIMIENTO ALIMENTICIO SEMANAL ------

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

document.addEventListener('DOMContentLoaded', () => {
    const daysContainer = document.getElementById('days-container');
    const tabsContainer = document.getElementById('day-tabs');
    if (!daysContainer) return;

    // Obtener el día de la semana para preseleccionar la pestaña (0 es domingo, 1 lunes...)
    const currentDayIndex = new Date().getDay();
    const initialDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

    // Generar la estructura de la semana
    daysOfWeek.forEach((day, index) => {
        const dayId = day.toLowerCase().replace('é', 'e').replace('á', 'a');

        // --- Generar Pestaña ---
        if (tabsContainer) {
            const tabBtn = document.createElement('button');
            tabBtn.className = 'day-tab-btn ' + (index === initialDayIndex ? 'active' : '');
            tabBtn.textContent = day; // Se muestra el día completo
            tabBtn.setAttribute('data-target', dayId);
            tabsContainer.appendChild(tabBtn);

            tabBtn.addEventListener('click', () => {
                // Remover active de todos los botones y contenedores
                document.querySelectorAll('.day-tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.day-tracker-card').forEach(card => card.classList.remove('active'));

                // Activar pestaña elegida
                tabBtn.classList.add('active');
                document.getElementById(`card-${dayId}`).classList.add('active');
            });
        }

        // --- Generar Tarjeta ---
        const dayCard = document.createElement('div');
        dayCard.className = 'day-tracker-card ' + (index === initialDayIndex ? 'active' : '');
        dayCard.id = `card-${dayId}`;

        dayCard.innerHTML = `
            <div class="day-header">
                <h3>${day}</h3>
                <button class="btn-add-meal" data-day="${dayId}" title="Añadir comida">+</button>
            </div>
            <div class="meals-list" id="meals-${dayId}"></div>
            <div class="day-totals">
                <h4>Total del día:</h4>
                <div class="macro-totals">
                    <div><span id="total-cal-${dayId}" class="val">0</span> <small>kcal</small></div>
                    <div><span id="total-pro-${dayId}" class="val">0</span> <small>Pro</small></div>
                    <div><span id="total-car-${dayId}" class="val">0</span> <small>Carb</small></div>
                    <div><span id="total-fat-${dayId}" class="val">0</span> <small>Gra</small></div>
                </div>
            </div>
        `;
        daysContainer.appendChild(dayCard);
    });

    // Eventos para botones de añadir
    document.querySelectorAll('.btn-add-meal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dayId = e.target.getAttribute('data-day');
            addMealRow(dayId);
        });
    });

    // loadWeeklyData se llama ahora dentro del evento 'authReady'
});

function addMealRow(dayId, data = { name: '', cal: '', pro: '', car: '', fat: '' }, save = true) {
    const mealsList = document.getElementById(`meals-${dayId}`);
    if (!mealsList) return;

    const row = document.createElement('div');
    row.className = 'meal-row';

    row.innerHTML = `
        <input type="text" class="meal-name" placeholder="Ej: Pechuga con arroz" value="${data.name}">
        <div class="meal-macros-inputs">
            <input type="number" class="meal-cal" placeholder="kcal" value="${data.cal}" min="0">
            <input type="number" class="meal-pro" placeholder="pro" value="${data.pro}" min="0">
            <input type="number" class="meal-car" placeholder="car" value="${data.car}" min="0">
            <input type="number" class="meal-fat" placeholder="gra" value="${data.fat}" min="0">
            <button class="btn-del-meal" title="Eliminar comida">×</button>
        </div>
    `;

    mealsList.appendChild(row);

    // Actualizar totales y grabar cuando se escriba
    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => {
        // Función para cambiar tamaño dinámicamente
        const resize = () => {
            if (input.classList.contains('meal-name')) return;
            const len = Math.max(input.value.length, input.placeholder.length);
            input.style.width = (len + 1.5) + 'ch';
        };

        // Resize inicial
        resize();

        input.addEventListener('input', () => {
            resize(); // Llama a la función que ajusta el width
            updateTotals(dayId);
            saveWeeklyData();
        });
    });

    // Eliminar fila
    row.querySelector('.btn-del-meal').addEventListener('click', () => {
        row.style.opacity = '0';
        setTimeout(() => {
            row.remove();
            updateTotals(dayId);
            saveWeeklyData();
        }, 200);
    });

    if (save) saveWeeklyData();
}

function updateTotals(dayId) {
    const mealsList = document.getElementById(`meals-${dayId}`);
    let totalCal = 0, totalPro = 0, totalCar = 0, totalFat = 0;

    mealsList.querySelectorAll('.meal-row').forEach(row => {
        totalCal += parseFloat(row.querySelector('.meal-cal').value) || 0;
        totalPro += parseFloat(row.querySelector('.meal-pro').value) || 0;
        totalCar += parseFloat(row.querySelector('.meal-car').value) || 0;
        totalFat += parseFloat(row.querySelector('.meal-fat').value) || 0;
    });

    document.getElementById(`total-cal-${dayId}`).textContent = totalCal;
    document.getElementById(`total-pro-${dayId}`).textContent = totalPro;
    document.getElementById(`total-car-${dayId}`).textContent = totalCar;
    document.getElementById(`total-fat-${dayId}`).textContent = totalFat;
}

function saveWeeklyData() {
    if (!currentUserUid) return;
    
    const weeklyData = {};
    daysOfWeek.forEach(day => {
        const dayId = day.toLowerCase().replace('é', 'e').replace('á', 'a');
        const mealsList = document.getElementById(`meals-${dayId}`);
        if (!mealsList) return;

        const meals = [];
        mealsList.querySelectorAll('.meal-row').forEach(row => {
            meals.push({
                name: row.querySelector('.meal-name').value,
                cal: row.querySelector('.meal-cal').value,
                pro: row.querySelector('.meal-pro').value,
                car: row.querySelector('.meal-car').value,
                fat: row.querySelector('.meal-fat').value
            });
        });
        weeklyData[dayId] = meals;
    });
    
    db.collection('users').doc(currentUserUid).collection('macros').doc('weekly').set(weeklyData);
}

function loadWeeklyData() {
    if (!currentUserUid) return;

    db.collection('users').doc(currentUserUid).collection('macros').doc('weekly').get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                daysOfWeek.forEach(day => {
                    const dayId = day.toLowerCase().replace('é', 'e').replace('á', 'a');
                    if (data[dayId] && data[dayId].length > 0) {
                        data[dayId].forEach(meal => {
                            addMealRow(dayId, meal, false);
                        });
                        updateTotals(dayId);
                    }
                });
            }
        });
}
