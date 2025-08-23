// ==================== Firebase Auth ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYQPw0eoEtCZQ5NHYKHgXfcHpaW_ySzKU",
  authDomain: "sesionmientreno.firebaseapp.com",
  projectId: "sesionmientreno",
  storageBucket: "sesionmientreno.firebasestorage.app",
  messagingSenderId: "525949014274",
  appId: "1:525949014274:web:1612707e63c01cb0109972"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 tu código original sigue aquí sin cambios
// funciones: login(), register(), salir(), listeners de botones, onAuthStateChanged, etc.


// Helpers
const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

function getErrorMessage(error) {
  const map = {
    'auth/email-already-in-use': 'Ese email ya está registrado.',
    'auth/invalid-email': 'El email no es válido.',
    'auth/weak-password': 'Contraseña demasiado débil.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/user-not-found': 'No existe un usuario con ese email.',
    'auth/too-many-requests': 'Demasiados intentos, espera un momento.'
  };
  return map[error.code] || error.message;
}

// Registro
window.register = async function () {
  const email = $('reg-email').value.trim();
  const pass  = $('reg-pass').value;
  const pass2 = $('reg-pass2').value;
  const msg   = $('reg-msg');
  msg.textContent = ''; msg.className = 'hint';

  if (pass !== pass2) {
    msg.textContent = 'Las contraseñas no coinciden.'; 
    msg.classList.add('err');
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(cred.user);
    msg.textContent = 'Cuenta creada. Revisa tu correo para verificar tu email.';
    msg.classList.add('ok');
    $('reg-email').value = $('reg-pass').value = $('reg-pass2').value = '';
  } catch (err) {
    msg.textContent = getErrorMessage(err);
    msg.classList.add('err');
  }
};

// Login
window.login = async function () {
  const email = $('log-email').value.trim();
  const pass  = $('log-pass').value;
  const msg   = $('log-msg');
  msg.textContent = ''; msg.className = 'hint';

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    $('log-email').value = $('log-pass').value = '';
  } catch (err) {
    msg.textContent = getErrorMessage(err);
    msg.classList.add('err');
  }
};

// Logout
window.salir = async function () {
  await signOut(auth);
};

// Cambio de sesión
onAuthStateChanged(auth, (user) => {
  const authSec = $('auth');
  const appSec  = $('app');
  const welcome = $('welcome');
  const verify  = $('verify-hint');
  const contenido = $('contenido');
  const timer = $('timerContainer');

  if (user) {
    hide(authSec);
    show(appSec);
    show(contenido);
    show(timer);
    welcome.textContent = `Hola, ${user.email}`;
    verify.textContent = user.emailVerified ? '' : '⚠️ Verifica tu email';
  } else {
    show(authSec);
    hide(appSec);
    hide(contenido);
    hide(timer);
    welcome.textContent = '';
    verify.textContent = '';
  }
});

// ==================== UI cambio login <-> registro ====================
$('showRegisterBtn').addEventListener('click', () => {
  hide($('form-login'));
  hide($('showRegisterBtn'));
  show($('form-register'));
});

$('showLoginBtn').addEventListener('click', () => {
  show($('form-login'));
  show($('showRegisterBtn'));
  hide($('form-register'));
});
// ==================== Fin Firebase Auth ====================


// ==================== TU CÓDIGO ORIGINAL (entrenos, navegación, temporizador, etc.) ====================

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
const timerContainer = document.getElementById('timerContainer');

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
            const div = crearIndice(item, index, nivel);
            if (index < 3) { // los tres apartados principales
    div.style.height = '60px'; // ajusta este valor al alto de los índices normales
}

            div.addEventListener('click', () => { rutaActual.push(index); renderizar(); });
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
        ['#','Reps','Peso','RIR','Descanso','',''].forEach(txt=>{
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
            serieDiv.className="serie-row";

            // Numeración o letra especial
            const numBtn=document.createElement('button');
            numBtn.className="serie-num";
            numBtn.textContent=serie.marca|| (idx+1);
            numBtn.addEventListener('click',e=>{
                e.stopPropagation();
                mostrarSelectorMarca(serie,()=>renderizar());
            });

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
            temporizador.className="btn-timer";
            temporizador.textContent='⏱';
            temporizador.addEventListener('click',()=>iniciarTimer(serie.descanso));

            const borrar=document.createElement('button');
            borrar.className="btn-delete";
            borrar.textContent='🗑';
            borrar.addEventListener('click',()=> {
                mostrarConfirmacion("¿Desea borrar esta serie?",()=> {
                    nivel.series.splice(idx,1); guardarDatos(); renderizar();
                });
            });

            serieDiv.appendChild(numBtn);
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

    // Otros niveles
    addButton.style.display = '';
    backButton.style.display = '';
    const nombres = ['Mesociclos','Microciclos','Sesiones','Ejercicios'];
    tituloNivel.textContent = nombres[rutaActual.length-1] || nivel.nombre;

    if (nivel.hijos && nivel.hijos.length) {
        nivel.hijos.forEach((item, index) => {
            const div=crearIndice(item,index,nivel);
            div.addEventListener('click',()=>{ rutaActual.push(index); renderizar(); });
            contenido.appendChild(div);
        });
    }

    addButton.onclick = () => {
        const nombresDefault = ['Nuevo Mesociclo','Nuevo Microciclo','Nueva Sesión','Nuevo Ejercicio'];
        const nombreDefault = nombresDefault[rutaActual.length-1] || 'Nuevo Índice';
        nivel.hijos.push({ nombre:nombreDefault, hijos:[], editando:true });
        guardarDatos(); renderizar();
    };
}

// Crear un índice (bloque de lista)

function crearIndice(item, index, nivel){
    const div = document.createElement('div');
    div.className = 'list-item';

    if (!item.editando) item.editando = false;

    if (item.editando) {
        const input = document.createElement('input');
        input.value = item.nombre;
        setTimeout(() => { input.select(); }, 50);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                item.nombre = input.value || 'Sin nombre';
                item.editando = false; guardarDatos(); renderizar();
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

        if (!(rutaActual.length === 0 && ['Entrenamiento','Seguimiento','Calendario'].includes(item.nombre))) {
            input.addEventListener('click', () => { rutaActual.push(index); renderizar(); });
        }

        div.appendChild(input);

        if (!(rutaActual.length === 0 && ['Entrenamiento','Seguimiento','Calendario'].includes(item.nombre))) {
            const editar = document.createElement('button');
            editar.className = "btn-edit";
            editar.textContent = '✏️';
            editar.addEventListener('click', e => {
                e.stopPropagation(); 
                item.editando = true; 
                renderizar();
            });
            div.appendChild(editar);
        }
    }

    if (!(rutaActual.length === 0 && ['Entrenamiento','Seguimiento','Calendario'].includes(item.nombre))) {
        const borrar = document.createElement('button');
        borrar.className = "btn-delete";
        borrar.textContent = '🗑';
        borrar.addEventListener('click', e => {
            e.stopPropagation();
            mostrarConfirmacion(`¿Desea borrar "${item.nombre}"?`, () => {
                nivel.hijos.splice(index, 1); guardarDatos(); renderizar();
            });
        });
        div.appendChild(borrar);
    }

    return div;
}


// --- Timer con pausa y persistencia ---
let timerInterval;
function iniciarTimer(segundos) {
    clearInterval(timerInterval);
    let tiempo=parseInt(segundos,10)||0;
    if(tiempo<=0) return;

    // Guardar hora de fin en localStorage
    const fin=Date.now()+tiempo*1000;
    localStorage.setItem("timerFin",fin);

    mostrarTimer();
}
function mostrarTimer(){
    clearInterval(timerInterval);
    const fin=parseInt(localStorage.getItem("timerFin"));
    if(!fin) return;

    let pausado=false;
    let tiempoRestante=Math.floor((fin-Date.now())/1000);

    timerContainer.innerHTML='';
    timerContainer.className='timer-active';

    const tiempoLabel=document.createElement('div');
    tiempoLabel.className='timer-label';

    const btnPause=document.createElement('button');
    btnPause.textContent='⏸';
    btnPause.onclick=()=>{
        if(!pausado){
            pausado=true;
            tiempoRestante=Math.floor((fin-Date.now())/1000);
            localStorage.setItem("timerPause",tiempoRestante);
            localStorage.removeItem("timerFin");
            btnPause.textContent='▶️';
        } else {
            pausado=false;
            const nuevoFin=Date.now()+tiempoRestante*1000;
            localStorage.setItem("timerFin",nuevoFin);
            localStorage.removeItem("timerPause");
            btnPause.textContent='⏸';
            mostrarTimer();
        }
    };

    const btnSkip=document.createElement('button');
    btnSkip.textContent='⏹';
    btnSkip.onclick=()=>{
        clearInterval(timerInterval);
        timerContainer.innerHTML='';
        localStorage.removeItem("timerFin");
        localStorage.removeItem("timerPause");
    };

    timerContainer.appendChild(tiempoLabel);
    timerContainer.appendChild(btnPause);
    timerContainer.appendChild(btnSkip);

    function actualizar(){
        let fin=parseInt(localStorage.getItem("timerFin"));
        if(!fin) return;
        let t=Math.floor((fin-Date.now())/1000);
        if(t<=0){
            clearInterval(timerInterval);
            timerContainer.innerHTML='';
            localStorage.removeItem("timerFin");
            return;
        }
        const mm=Math.floor(t/60), ss=t%60;
        tiempoLabel.textContent=mm+":"+(ss<10?"0"+ss:ss);
    }
    actualizar();
    timerInterval=setInterval(actualizar,1000);
}
mostrarTimer(); // restaurar al recargar

// --- Selector de marcas para series ---
function mostrarSelectorMarca(serie,onSelect){
    let anterior=document.getElementById('modalSelector'); if(anterior) anterior.remove();
    const modal=document.createElement('div'); modal.id='modalSelector';
    modal.style.position='fixed'; modal.style.top='0'; modal.style.left='0'; modal.style.width='100%'; modal.style.height='100%';
    modal.style.background='rgba(0,0,0,0.4)'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
    const caja=document.createElement('div'); caja.style.background='#fff'; caja.style.padding='1em'; caja.style.borderRadius='10px';

    ['W','F','D','R'].forEach(op=>{
        const b=document.createElement('button');
        b.textContent=op;
        b.style.margin='0.5em';
        b.onclick=()=>{ serie.marca=op; guardarDatos(); modal.remove(); if(onSelect) onSelect(); };
        caja.appendChild(b);
    });
    modal.appendChild(caja); document.body.appendChild(modal);
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


