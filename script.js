// --- Datos iniciales con carga desde localStorage ---
let datos = JSON.parse(localStorage.getItem("misDatos")) || [
    { nombre: 'Entrenamiento', hijos: [] },
    { nombre: 'Seguimiento', hijos: [] },
    { nombre: 'Calendario', hijos: [] }
];

let rutaActual = []; // Array de índices actuales para navegar

const contenido = document.getElementById('contenido');
const tituloNivel = document.getElementById('tituloNivel');
const addButton = document.getElementById('addButton');
const backButton = document.getElementById('backButton');

// Guardar datos en localStorage
function guardarDatos() {
    localStorage.setItem("misDatos", JSON.stringify(datos));
}

// Función para obtener el nivel actual
function nivelActual() {
    let nivel = { hijos: datos };
    for (let i of rutaActual) {
        nivel = nivel.hijos[i];
    }
    return nivel;
}

// Renderizar la pantalla
function renderizar() {
    contenido.innerHTML = '';
    let nivel = nivelActual();

    // Pantalla principal
    if (rutaActual.length === 0) {
        tituloNivel.textContent = 'Mi Entreno';
        addButton.style.display = 'none';
        backButton.style.display = 'none';

        datos.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';

            div.addEventListener('click', () => {
                rutaActual.push(index);
                renderizar();
            });

            const input = document.createElement('input');
            input.value = item.nombre;
            input.disabled = true;
            input.style.flex = '1';
            input.style.pointerEvents = 'none';

            div.appendChild(input);
            contenido.appendChild(div);
        });
        return;
    }

    // Nivel de ejercicio (columnas y series)
    if (rutaActual.length === 5) {
        addButton.style.display = 'none';
        backButton.style.display = '';

        tituloNivel.textContent = nivel.nombre; // Nombre del ejercicio

        // Encabezados de las columnas
        const encabezados = document.createElement('div');
        encabezados.className = 'series-header';
        encabezados.style.display = 'flex';
        encabezados.style.gap = '5px';
        encabezados.style.fontWeight = 'bold';
        encabezados.style.marginBottom = '8px';

        ['Reps', 'Peso', 'RIR', 'Descanso', '', ''].forEach(txt => {
            const col = document.createElement('div');
            col.textContent = txt;
            col.style.flex = txt ? '1' : '0';
            col.style.textAlign = txt ? 'center' : 'right';
            encabezados.appendChild(col);
        });
        contenido.appendChild(encabezados);

        // Contenedor de series
        const seriesContainer = document.createElement('div');
        seriesContainer.className = 'series-container';
        nivel.series = nivel.series || [];
        nivel.series.forEach((serie, idx) => {
            const serieDiv = document.createElement('div');
            serieDiv.style.display = 'flex';
            serieDiv.style.flexWrap = 'wrap';
            serieDiv.style.gap = '5px';
            serieDiv.style.alignItems = 'center';
            serieDiv.style.marginBottom = '4px';

            const reps = document.createElement('input');
            reps.placeholder = 'Reps';
            reps.value = serie.reps || '';
            reps.style.flex = '1';
            reps.addEventListener('input', e => { serie.reps = e.target.value; guardarDatos(); });

            const peso = document.createElement('input');
            peso.placeholder = 'Peso';
            peso.value = serie.peso || '';
            peso.style.flex = '1';
            peso.addEventListener('input', e => { serie.peso = e.target.value; guardarDatos(); });

            const rir = document.createElement('input');
            rir.placeholder = 'RIR';
            rir.value = serie.rir || '';
            rir.style.flex = '1';
            rir.addEventListener('input', e => { serie.rir = e.target.value; guardarDatos(); });

            const descanso = document.createElement('input');
            descanso.placeholder = 'Descanso';
            descanso.value = serie.descanso || '';
            descanso.style.flex = '1';
            descanso.addEventListener('input', e => { serie.descanso = e.target.value; guardarDatos(); });

            // Botón temporizador
            const temporizador = document.createElement('button');
            temporizador.textContent = '⏱';
            temporizador.title = 'Iniciar temporizador';
            temporizador.style.marginLeft = '4px';
            temporizador.addEventListener('click', () => iniciarTimer(serie.descanso));

            // Botón borrar serie
            const borrar = document.createElement('button');
            borrar.textContent = '🗑';
            borrar.title = 'Eliminar serie';
            borrar.style.marginLeft = '4px';
            borrar.addEventListener('click', () => {
                mostrarConfirmacion(
                    `¿Desea borrar esta serie?`,
                    () => {
                        nivel.series.splice(idx, 1);
                        guardarDatos();
                        renderizar();
                    },
                    () => {}
                );
            });

            serieDiv.appendChild(reps);
            serieDiv.appendChild(peso);
            serieDiv.appendChild(rir);
            serieDiv.appendChild(descanso);
            serieDiv.appendChild(temporizador);
            serieDiv.appendChild(borrar);

            seriesContainer.appendChild(serieDiv);
        });

        contenido.appendChild(seriesContainer);

        // Botón para añadir nueva serie
        const addSerie = document.createElement('button');
        addSerie.textContent = '+ Añadir Serie';
        addSerie.style.margin = '8px 0';
        addSerie.addEventListener('click', () => {
            nivel.series.push({ reps: '', peso: '', rir: '', descanso: '' });
            guardarDatos();
            renderizar();
        });
        contenido.appendChild(addSerie);

        // Recuadro para notas del ejercicio
        const notas = document.createElement('textarea');
        notas.placeholder = 'Notas del ejercicio...';
        notas.value = nivel.notas || '';
        notas.className = 'notes';
        notas.style.width = '100%';
        notas.style.marginTop = '10px';
        notas.addEventListener('input', e => { nivel.notas = e.target.value; guardarDatos(); });
        contenido.appendChild(notas);

        return;
    }

    // Nivel de listado de ejercicios (un nivel antes del ejercicio)
    if (rutaActual.length === 4) {
        addButton.style.display = '';
        backButton.style.display = '';

        let sesionPadre = { hijos: datos };
        for (let i = 0; i < rutaActual.length; i++) {
            sesionPadre = sesionPadre.hijos[rutaActual[i]];
        }
        tituloNivel.textContent = sesionPadre.nombre || 'Sesión';

        if (nivel.hijos && nivel.hijos.length) {
            nivel.hijos.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'list-item';

                if (!item.editando) item.editando = false;

                if (item.editando) {
                    const input = document.createElement('input');
                    input.value = item.nombre;
                    input.style.flex = '1';
                    input.autofocus = true;

                    input.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            item.nombre = input.value || 'Sin nombre';
                            item.editando = false;
                            guardarDatos();
                            renderizar();
                            rutaActual.push(index);
                            renderizar();
                        }
                    });

                    input.addEventListener('blur', () => {
                        item.nombre = input.value || 'Sin nombre';
                        item.editando = false;
                        guardarDatos();
                        renderizar();
                    });

                    div.appendChild(input);
                    setTimeout(() => { input.focus(); input.select(); }, 0);
                } else {
                    const input = document.createElement('input');
                    input.value = item.nombre;
                    input.disabled = true;
                    input.style.flex = '1';
                    input.style.pointerEvents = 'none';

                    div.addEventListener('click', () => {
                        rutaActual.push(index);
                        renderizar();
                    });

                    const editar = document.createElement('button');
                    editar.textContent = '✏️';
                    editar.title = 'Editar nombre';
                    editar.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.editando = true;
                        renderizar();
                    });

                    div.appendChild(input);
                    div.appendChild(editar);
                }

                if (rutaActual.length > 0) {
                    const borrar = document.createElement('button');
                    borrar.textContent = '🗑';
                    borrar.title = 'Borrar';
                    borrar.addEventListener('click', (e) => {
                        e.stopPropagation();
                        mostrarConfirmacion(
                            `¿Desea borrar "${item.nombre}"?`,
                            () => {
                                nivel.hijos.splice(index, 1);
                                guardarDatos();
                                renderizar();
                            },
                            () => {}
                        );
                    });
                    div.appendChild(borrar);
                }

                contenido.appendChild(div);
            });
        }

        addButton.onclick = () => {
            const nombresDefault = ['Nuevo Mesociclo', 'Nuevo Microciclo', 'Nueva Sesión', 'Nuevo Ejercicio'];
            const nombreDefault = nombresDefault[rutaActual.length - 1] || 'Nuevo Índice';
            nivel.hijos.push({ nombre: nombreDefault, hijos: [] });
            nivel.hijos[nivel.hijos.length - 1].editando = true;
            guardarDatos();
            renderizar();
            setTimeout(() => {
                const inputs = contenido.querySelectorAll('input');
                if (inputs.length) {
                    inputs[inputs.length - 1].focus();
                    inputs[inputs.length - 1].select();
                }
            }, 0);
        };

        return;
    }

    // Otros niveles intermedios
    addButton.style.display = '';
    backButton.style.display = '';

    const nombres = ['Mesociclos', 'Microciclos', 'Sesiones', 'Ejercicios'];
    tituloNivel.textContent = nombres[rutaActual.length - 1] || nivel.nombre;

    if (nivel.hijos && nivel.hijos.length) {
        nivel.hijos.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';

            if (!item.editando) item.editando = false;

            if (item.editando) {
                const input = document.createElement('input');
                input.value = item.nombre;
                input.style.flex = '1';
                input.autofocus = true;

                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter') {
                        item.nombre = input.value || 'Sin nombre';
                        item.editando = false;
                        guardarDatos();
                        renderizar();
                        rutaActual.push(index);
                        renderizar();
                    }
                });

                input.addEventListener('blur', () => {
                    item.nombre = input.value || 'Sin nombre';
                    item.editando = false;
                    guardarDatos();
                    renderizar();
                });

                div.appendChild(input);
                setTimeout(() => { input.focus(); input.select(); }, 0);
            } else {
                const input = document.createElement('input');
                input.value = item.nombre;
                input.disabled = true;
                input.style.flex = '1';
                input.style.pointerEvents = 'none';

                div.addEventListener('click', () => {
                    rutaActual.push(index);
                    renderizar();
                });

                const editar = document.createElement('button');
                editar.textContent = '✏️';
                editar.title = 'Editar nombre';
                editar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.editando = true;
                    renderizar();
                });

                div.appendChild(input);
                div.appendChild(editar);
            }

            if (rutaActual.length > 0) {
                const borrar = document.createElement('button');
                borrar.textContent = '🗑';
                borrar.title = 'Borrar';
                borrar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mostrarConfirmacion(
                        `¿Desea borrar "${item.nombre}"?`,
                        () => {
                            nivel.hijos.splice(index, 1);
                            guardarDatos();
                            renderizar();
                        },
                        () => {}
                    );
                });
                div.appendChild(borrar);
            }

            contenido.appendChild(div);
        });
    }
}

// Timer
let timerInterval;
function iniciarTimer(segundos) {
    clearInterval(timerInterval);
    let tiempo = parseInt(segundos, 10) || 0;
    const display = document.getElementById('timerContainer');
    const warningThreshold = 5;

    display.classList.add('timer-active');
    display.classList.remove('timer-warning');

    function formatear(t) {
        const mm = Math.floor(t / 60);
        const ss = t % 60;
        return `<span class="minutes">${mm}</span>:<span class="seconds">${ss < 10 ? '0' + ss : ss}</span>`;
    }

    function actualizar() {
        if (tiempo <= 0) {
            clearInterval(timerInterval);
            display.classList.remove('timer-warning');
            display.classList.remove('timer-active');
            display.innerHTML = '';
            return;
        }

        display.innerHTML = formatear(tiempo);

        if (tiempo <= warningThreshold) {
            display.classList.add('timer-warning');
        } else {
            display.classList.remove('timer-warning');
        }

        tiempo--;
    }

    actualizar();
    timerInterval = setInterval(actualizar, 1000);
}

// Botón + (genérico)
addButton.onclick = () => {
    let nivel = nivelActual();
    if (rutaActual.length === 4) return;
    if (nivel.hijos) {
        const nombresDefault = ['Nuevo Mesociclo', 'Nuevo Microciclo', 'Nueva Sesión', 'Nuevo Ejercicio'];
        const nombreDefault = nombresDefault[rutaActual.length - 1] || 'Nuevo Índice';
        nivel.hijos.push({ nombre: nombreDefault, hijos: [] });
        nivel.hijos[nivel.hijos.length - 1].editando = true;
        guardarDatos();
        renderizar();
        setTimeout(() => {
            const inputs = contenido.querySelectorAll('input');
            if (inputs.length) {
                inputs[inputs.length - 1].focus();
                inputs[inputs.length - 1].select();
            }
        }, 0);
    }
};

// Botón volver
backButton.addEventListener('click', () => {
    if (rutaActual.length > 0) {
        rutaActual.pop();
        renderizar();
    }
});

// Confirmación
function mostrarConfirmacion(mensaje, onConfirm, onCancel) {
    let anterior = document.getElementById('modalConfirmacion');
    if (anterior) anterior.remove();

    const modal = document.createElement('div');
    modal.id = 'modalConfirmacion';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.4)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';

    const caja = document.createElement('div');
    caja.style.background = '#fff';
    caja.style.padding = '2em';
    caja.style.borderRadius = '10px';
    caja.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    caja.style.display = 'flex';
    caja.style.flexDirection = 'column';
    caja.style.alignItems = 'center';
    caja.style.gap = '1em';
    caja.style.minWidth = '250px';

    const texto = document.createElement('div');
    texto.textContent = mensaje;
    texto.style.marginBottom = '1em';
    texto.style.textAlign = 'center';

    const botones = document.createElement('div');
    botones.style.display = 'flex';
    botones.style.gap = '1em';

    const btnSi = document.createElement('button');
    btnSi.textContent = 'Sí';
    btnSi.style.padding = '0.5em 1.5em';
    btnSi.style.background = '#d32f2f';
    btnSi.style.color = '#fff';
    btnSi.style.border = 'none';
    btnSi.style.borderRadius = '5px';
    btnSi.style.cursor = 'pointer';
    btnSi.addEventListener('click', () => {
        modal.remove();
        if (onConfirm) onConfirm();
    });

    const btnNo = document.createElement('button');
    btnNo.textContent = 'No';
    btnNo.style.padding = '0.5em 1.5em';
    btnNo.style.background = '#aaa';
    btnNo.style.color = '#fff';
    btnNo.style.border = 'none';
    btnNo.style.borderRadius = '5px';
    btnNo.style.cursor = 'pointer';
    btnNo.addEventListener('click', () => {
        modal.remove();
        if (onCancel) onCancel();
    });

    botones.appendChild(btnSi);
    botones.appendChild(btnNo);

    caja.appendChild(texto);
    caja.appendChild(botones);
    modal.appendChild(caja);
    document.body.appendChild(modal);
}

// Ripple effect
(function(){
    const root = document.documentElement;
    function crearRipple(el, x, y) {
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.2;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const bg = window.getComputedStyle(el).backgroundColor || '';
        if (/rgba?\(255,\s*255,\s*255/.test(bg) || /transparent|linear-gradient/.test(bg)) {
            ripple.classList.add('dark');
        }
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x - rect.left - size/2}px`;
        ripple.style.top = `${y - rect.top - size/2}px`;
        el.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
        setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 800);
    }
    root.addEventListener('pointerdown', (e) => {
        const target = e.target.closest('button, .list-item, .series-container > div');
        if (!target) return;
        crearRipple(target, e.clientX, e.clientY);
    }, { passive: true });
})();

// Inicializar
renderizar();
