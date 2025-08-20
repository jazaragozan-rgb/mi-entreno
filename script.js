// --- Datos iniciales con carga desde localStorage ---
let datos = JSON.parse(localStorage.getItem("misDatos")) || [
    { nombre: 'Entrenamiento', hijos: [] },
    { nombre: 'Seguimiento', hijos: [] },
    { nombre: 'Calendario', hijos: [] }
];

let rutaActual = [];
const contenido = document.getElementById('contenido');
const tituloNivel = document.getElementById('tituloNivel');
const addButton = document.getElementById('addButton');
const backButton = document.getElementById('backButton');

function guardarDatos() {
    localStorage.setItem("misDatos", JSON.stringify(datos));
}
function nivelActual() {
    let nivel = { hijos: datos };
    for (let i of rutaActual) nivel = nivel.hijos[i];
    return nivel;
}

// Renderizado principal
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
            div.addEventListener('click', () => { rutaActual.push(index); renderizar(); });
            const input = document.createElement('input');
            input.value = item.nombre;
            input.disabled = true;
            div.appendChild(input);
            contenido.appendChild(div);
        });
        return;
    }

    // SERIES (nivel ejercicio)
    if (rutaActual.length === 5) {
        addButton.style.display = 'none';
        backButton.style.display = '';
        tituloNivel.textContent = nivel.nombre;

        // encabezado
        const encabezados = document.createElement('div');
        encabezados.className = 'series-header';
        ['Reps','Peso','RIR','Descanso','',''].forEach(txt=>{
            const col=document.createElement('div');
            col.textContent=txt;
            encabezados.appendChild(col);
        });
        contenido.appendChild(encabezados);

        // series
        const seriesContainer = document.createElement('div');
        seriesContainer.className = 'series-container';
        nivel.series = nivel.series || [];
        nivel.series.forEach((serie, idx) => {
            const serieDiv = document.createElement('div');

            const reps=document.createElement('input');
            reps.placeholder='Reps'; reps.value=serie.reps||'';
            reps.addEventListener('input',e=>{serie.reps=e.target.value;guardarDatos();});

            const peso=document.createElement('input');
            peso.placeholder='Peso'; peso.value=serie.peso||'';
            peso.addEventListener('input',e=>{serie.peso=e.target.value;guardarDatos();});

            const rir=document.createElement('input');
            rir.placeholder='RIR'; rir.value=serie.rir||'';
            rir.addEventListener('input',e=>{serie.rir=e.target.value;guardarDatos();});

            const descanso=document.createElement('input');
            descanso.placeholder='Descanso'; descanso.value=serie.descanso||'';
            descanso.addEventListener('input',e=>{serie.descanso=e.target.value;guardarDatos();});

            const temporizador=document.createElement('button');
            temporizador.textContent='⏱';
            temporizador.addEventListener('click',()=>iniciarTimer(serie.descanso));

            const borrar=document.createElement('button');
            borrar.textContent='🗑';
            borrar.addEventListener('click',()=>{
                mostrarConfirmacion("¿Desea borrar esta serie?",()=>{
                    nivel.series.splice(idx,1); guardarDatos(); renderizar();
                });
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

        // Botón añadir serie
        const addSerie=document.createElement('button');
        addSerie.textContent='+ Añadir Serie';
        addSerie.className='add-serie';
        addSerie.addEventListener('click',()=>{
            nivel.series.push({ reps:'', peso:'', rir:'', descanso:'' });
            guardarDatos(); renderizar();
        });
        contenido.appendChild(addSerie);

        // Notas
        const notas=document.createElement('textarea');
        notas.placeholder='Notas del ejercicio...';
        notas.value=nivel.notas||'';
        notas.className='notes';
        notas.addEventListener('input',e=>{nivel.notas=e.target.value;guardarDatos();});
        contenido.appendChild(notas);
        return;
    }

    // Nivel de listado de ejercicios
    if (rutaActual.length === 4) {
        addButton.style.display = '';
        backButton.style.display = '';
        tituloNivel.textContent = nivel.nombre || 'Sesión';

        if (nivel.hijos && nivel.hijos.length) {
            nivel.hijos.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'list-item';

                if (!item.editando) item.editando = false;

                if (item.editando) {
                    const input = document.createElement('input');
                    input.value = item.nombre;
                    input.autofocus = true;
                    input.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            item.nombre = input.value || 'Sin nombre';
                            item.editando = false; guardarDatos();
                            renderizar(); rutaActual.push(index); renderizar();
                        }
                    });
                    input.addEventListener('blur', () => {
                        item.nombre = input.value || 'Sin nombre';
                        item.editando = false; guardarDatos(); renderizar();
                    });
                    div.appendChild(input);
                } else {
                    const input = document.createElement('input');
                    input.value = item.nombre;
                    input.disabled = true;
                    div.addEventListener('click', () => { rutaActual.push(index); renderizar(); });
                    const editar = document.createElement('button');
                    editar.textContent = '✏️';
                    editar.addEventListener('click', e => { e.stopPropagation(); item.editando=true; renderizar(); });
                    div.appendChild(input); div.appendChild(editar);
                }

                const borrar = document.createElement('button');
                borrar.textContent = '🗑';
                borrar.addEventListener('click', e => {
                    e.stopPropagation();
                    mostrarConfirmacion(`¿Desea borrar "${item.nombre}"?`,()=>{
                        nivel.hijos.splice(index,1); guardarDatos(); renderizar();
                    });
                });
                div.appendChild(borrar);
                contenido.appendChild(div);
            });
        }

        addButton.onclick = () => {
            const nombresDefault = ['Nuevo Mesociclo','Nuevo Microciclo','Nueva Sesión','Nuevo Ejercicio'];
            const nombreDefault = nombresDefault[rutaActual.length-1] || 'Nuevo Índice';
            nivel.hijos.push({ nombre:nombreDefault, hijos:[] });
            nivel.hijos[nivel.hijos.length-1].editando=true; guardarDatos(); renderizar();
        };
        return;
    }

    // Otros niveles intermedios
    addButton.style.display = '';
    backButton.style.display = '';
    const nombres = ['Mesociclos','Microciclos','Sesiones','Ejercicios'];
    tituloNivel.textContent = nombres[rutaActual.length-1] || nivel.nombre;

    if (nivel.hijos && nivel.hijos.length) {
        nivel.hijos.forEach((item, index) => {
            const div=document.createElement('div');
            div.className='list-item';

            if (!item.editando) item.editando=false;
            if (item.editando) {
                const input=document.createElement('input');
                input.value=item.nombre;
                input.addEventListener('keydown',e=>{
                    if(e.key==='Enter'){ item.nombre=input.value||'Sin nombre'; item.editando=false; guardarDatos(); renderizar(); rutaActual.push(index); renderizar();}
                });
                input.addEventListener('blur',()=>{ item.nombre=input.value||'Sin nombre'; item.editando=false; guardarDatos(); renderizar(); });
                div.appendChild(input);
            } else {
                const input=document.createElement('input');
                input.value=item.nombre; input.disabled=true;
                div.addEventListener('click',()=>{ rutaActual.push(index); renderizar(); });
                const editar=document.createElement('button');
                editar.textContent='✏️';
                editar.addEventListener('click',e=>{ e.stopPropagation(); item.editando=true; renderizar(); });
                div.appendChild(input); div.appendChild(editar);
            }

            const borrar=document.createElement('button');
            borrar.textContent='🗑';
            borrar.addEventListener('click',e=>{
                e.stopPropagation();
                mostrarConfirmacion(`¿Desea borrar "${item.nombre}"?`,()=>{
                    nivel.hijos.splice(index,1); guardarDatos(); renderizar();
                });
            });
            div.appendChild(borrar);
            contenido.appendChild(div);
        });
    }
}

// Timer
let timerInterval;
function iniciarTimer(segundos) {
    clearInterval(timerInterval);
    let tiempo=parseInt(segundos,10)||0;
    const display=document.getElementById('timerContainer');
    display.classList.add('timer-active');
    display.classList.remove('timer-warning');
    function formatear(t){const mm=Math.floor(t/60);const ss=t%60;return mm+":"+(ss<10?"0"+ss:ss);}
    function actualizar(){
        if(tiempo<=0){clearInterval(timerInterval);display.classList.remove('timer-active');display.innerHTML='';return;}
        display.innerHTML=formatear(tiempo);
        if(tiempo<=5) display.classList.add('timer-warning'); else display.classList.remove('timer-warning');
        tiempo--;
    }
    actualizar(); timerInterval=setInterval(actualizar,1000);
}

// Botón volver
backButton.addEventListener('click',()=>{ if(rutaActual.length>0){ rutaActual.pop(); renderizar(); } });

// Confirmación básica
function mostrarConfirmacion(mensaje,onConfirm){
    let anterior=document.getElementById('modalConfirmacion'); if(anterior) anterior.remove();
    const modal=document.createElement('div'); modal.id='modalConfirmacion';
    modal.style.position='fixed'; modal.style.top='0'; modal.style.left='0'; modal.style.width='100%'; modal.style.height='100%';
    modal.style.background='rgba(0,0,0,0.4)'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
    const caja=document.createElement('div'); caja.style.background='#fff'; caja.style.padding='2em'; caja.style.borderRadius='10px';
    caja.textContent=mensaje;
    const btn=document.createElement('button'); btn.textContent='Sí'; btn.onclick=()=>{modal.remove(); if(onConfirm) onConfirm();};
    caja.appendChild(btn); modal.appendChild(caja); document.body.appendChild(modal);
}

// Inicializar
renderizar();
