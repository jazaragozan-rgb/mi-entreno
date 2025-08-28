// ==================== Firebase Auth + Firestore ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⚡ Configuración de tu Firebase (tus datos existentes)
const firebaseConfig = {
  apiKey: "AIzaSyBYQPw0eoEtCZQ5NHYKHgXfcHpaW_ySzKU",
  authDomain: "sesionmientreno.firebaseapp.com",
  projectId: "sesionmientreno",
  storageBucket: "sesionmientreno.firebasestorage.app",
  messagingSenderId: "730288236333",
  appId: "1:730288236333:web:e4418ca39ffcd48f47d5a4",
  measurementId: "G-T8QZ7WZT5Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helpers
const $ = (id) => document.getElementById(id);
const show = (el) => el && el.classList.remove('hidden');
const hide = (el) => el && el.classList.add('hidden');

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

// ==================== Registro / Login / Logout ====================
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

window.salir = async function () {
  await signOut(auth);
};

// ==================== Datos por defecto + estado ====================
const DATOS_POR_DEFECTO = [
  { nombre: 'Entrenamiento', hijos: [] },
  { nombre: 'Seguimiento', hijos: [] },
  { nombre: 'Calendario', hijos: [] }
];

// ⚠️ Mantengo localStorage como fallback cuando no hay sesión
let datos = JSON.parse(localStorage.getItem("misDatos")) || structuredClone(DATOS_POR_DEFECTO);

// Referencias UI
let rutaActual = [];
const contenido = document.getElementById('contenido');
const tituloNivel = document.getElementById('tituloNivel');
const headerButtons = document.getElementById('headerButtons');
const addButton = document.getElementById('addButton');
const backButton = document.getElementById('backButton');
const timerContainer = document.getElementById('timerContainer');
const homeButton = document.getElementById('homeButton');
const logoutButton = document.getElementById('logoutButton');

// ==================== Firestore: cargar/guardar por usuario ====================
async function cargarDatosUsuario(uid) {
  if (!uid) return null;
  try {
    const ref = doc(db, "usuarios", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      if (d && Array.isArray(d.datos)) return structuredClone(d.datos);
    }
    return null;
  } catch (e) {
    console.error("Error al cargar datos de Firestore:", e);
    return null;
  }
}

let saveTimer = null;
async function guardarDatosUsuario(uid, datosActuales) {
  if (!uid || !Array.isArray(datosActuales)) return;
  try {
    const ref = doc(db, "usuarios", uid);
    // Usamos merge: false para sobrescribir completamente los datos
    await setDoc(ref, { datos: structuredClone(datosActuales) });
  } catch (e) {
    console.error("Error al guardar datos en Firestore:", e);
  }
}

// Sobrescribir guardarDatos para que guarde en Firestore si hay sesión
function guardarDatos() {
  localStorage.setItem("misDatos", JSON.stringify(datos));

  const user = auth.currentUser;
  if (!user) return;

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    guardarDatosUsuario(user.uid, datos);
  }, 300); // debounce 300ms
}

function nivelActual() {
  let nivel = { hijos: datos };
  for (let i of rutaActual) nivel = nivel.hijos[i];
  return nivel;
}

// ==================== Cambio de sesión: UI + datos por usuario ====================
onAuthStateChanged(auth, async (user) => {
  const authSec = $('auth');
  const appSec  = $('app');
  const welcome = $('welcome');
  const verify  = $('verify-hint');

  // No mostrar textos informativos
  hide(welcome);
  hide(verify);
  if (welcome) welcome.textContent = '';
  if (verify) verify.textContent = '';

  if (user) {
      hide(authSec);
      show(appSec);
      show(contenido);
      show(timerContainer);

      show(headerButtons);
      show(homeButton);
      show(logoutButton);

    // Cargar datos desde Firestore para este usuario
    const datosRemotos = await cargarDatosUsuario(user.uid);
    if (datosRemotos && Array.isArray(datosRemotos)) {
      datos = datosRemotos;
    } else {
      // Inicializar en Firestore si no existía
      datos = structuredClone(DATOS_POR_DEFECTO);
      await guardarDatosUsuario(user.uid, datos);
      }
    } else {
  console.log("Usuario no logueado → ocultando encabezado");
  show(authSec);
  hide(appSec);
  hide(contenido);
  hide(timerContainer);

  // Ocultar todos los botones del header
  hide(headerButtons);
  hide(homeButton);
  hide(logoutButton);
    // Fallback a localStorage
    datos = JSON.parse(localStorage.getItem("misDatos")) || structuredClone(DATOS_POR_DEFECTO);
  }
    rutaActual = [];
    renderizar();
});
    // Bind botones si no estaban
    if (homeButton && !homeButton._bound) {
      homeButton.addEventListener('click', () => {
        rutaActual = [];
        renderizar();
      });
      homeButton._bound = true;
    }
    if (logoutButton && !logoutButton._bound) {
      logoutButton.addEventListener('click', () => salir());
      logoutButton._bound = true;
    }

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

// ==================== App: entrenos, navegación, temporizador, etc. ====================

// Listeners de home/power por si no estaban listos
if (homeButton && !homeButton._bound) {
  homeButton.addEventListener('click', () => { rutaActual = []; renderizar(); });
  homeButton._bound = true;
}
if (logoutButton && !logoutButton._bound) {
  logoutButton.addEventListener('click', () => salir());
  logoutButton._bound = true;
}

// Renderizado principal
function renderizar() {
  if (!contenido) return;
  contenido.innerHTML = '';
  let nivel = nivelActual();

  // Mantener visible la caja contenedora bajo el header al navegar (si existe)
  if (headerButtons) headerButtons.classList.remove('hidden');

  // Pantalla principal
  if (rutaActual.length === 0) {
    tituloNivel.textContent = 'Dashboard';

    // Ocultar SOLO los botones, no la caja
    if (backButton) backButton.style.visibility = 'hidden';
    if (addButton)  addButton.style.visibility  = 'hidden';
        // Crear contenedor principal del dashboard
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard-container';
    
    // Ejemplo de tarjetas
    const tarjetas = [
        { titulo: 'Entrenamientos realizados', valor: 0 },
        { titulo: 'Ejercicios completados', valor: 0 },
        { titulo: 'Objetivos alcanzados', valor: 0 }
    ];
    
    tarjetas.forEach(t => {
        const card = document.createElement('div');
        card.className = 'dashboard-card';
        card.innerHTML = `<h3>${t.titulo}</h3><p>${t.valor}</p>`;
        dashboard.appendChild(card);
    });
    
    contenido.appendChild(dashboard);
    
    // Filtramos los apartados que ya están en el menú lateral
    datos.filter(item => !['Entrenamiento', 'Seguimiento', 'Calendario'].includes(item.nombre))
       .forEach((item, index) => {
          const div = crearIndice(item, index, { hijos: datos });
          div.style.height = (index < 3) ? '60px' : '';
          div.addEventListener('click', () => { rutaActual.push(index); renderizar(); });
          contenido.appendChild(div);
       });
  return;
  }

  // SERIES (nivel ejercicio)
  if (rutaActual.length === 5) {
    // caja visible
    if (headerButtons) headerButtons.classList.remove('hidden');

    // En series: back visible, + oculto
    if (backButton) backButton.style.visibility = 'visible';
    if (addButton)  addButton.style.visibility  = 'hidden';

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

  // Otros niveles (Mesociclos, Microciclos, Sesiones, Ejercicios)
  if (headerButtons) headerButtons.classList.remove('hidden');

  // En el resto de niveles: ambos visibles
  if (backButton) backButton.style.visibility = 'visible';
  if (addButton)  addButton.style.visibility  = 'visible';

  const nombres = ['Mesociclos','Microciclos','Sesiones','Ejercicios'];
  tituloNivel.textContent = nombres[rutaActual.length-1] || nivel.nombre;

  if (nivel.hijos && nivel.hijos.length) {
    nivel.hijos.forEach((item, index) => {
      const div=crearIndice(item,index,nivel);
      div.addEventListener('click',()=>{ rutaActual.push(index); renderizar(); });
      contenido.appendChild(div);
    });
  }

  addButton && (addButton.onclick = () => {
    const nombresDefault = ['Nuevo Mesociclo','Nuevo Microciclo','Nueva Sesión','Nuevo Ejercicio'];
    const nombreDefault = nombresDefault[rutaActual.length-1] || 'Nuevo Índice';
    nivel.hijos.push({ nombre:nombreDefault, hijos:[], editando:true });
    guardarDatos(); renderizar();
  });
}

  // 🔹 Accesos directos desde el menú lateral
function abrirEntrenamiento() {
  rutaActual = [0]; // índice 0 = Entrenamiento
  renderizar();
}

function abrirSeguimiento() {
  rutaActual = [1]; // índice 1 = Seguimiento
  renderizar();
}

function abrirCalendario() {
  rutaActual = [2]; // índice 2 = Calendario
  renderizar();
}

// Crear un índice (bloque de lista)
function crearIndice(item, index, nivel){
  const div = document.createElement('div');
  div.className = 'list-item';

  // Estilos para que toda la fila quede en una línea
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.gap = '4px';
  div.style.flexWrap = 'nowrap'; // fuerza todo en una sola fila
  div.style.overflow = 'hidden'; // evita que se desborde

  if (!item.editando) item.editando = false;

  if (item.editando) {
    const input = document.createElement('input');
    input.value = item.nombre;
    input.style.flex = '1 1 auto'; // ocupa el espacio disponible
    input.style.minWidth = '40px'; // ancho mínimo para móviles
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
    input.style.flex = '1 1 auto';
    input.style.minWidth = '40px';

    if (!(rutaActual.length === 0 && ['Entrenamiento','Seguimiento','Calendario'].includes(item.nombre))) {
      input.addEventListener('click', () => { rutaActual.push(index); renderizar(); });
    }

    div.appendChild(input);

    if (!(rutaActual.length === 0 && ['Entrenamiento','Seguimiento','Calendario'].includes(item.nombre))) {
      const editar = document.createElement('button');
      editar.className = "btn-edit";
      editar.textContent = '✏️';
      editar.style.flex = '0 0 auto';
      editar.style.fontSize = '0.8em'; // más pequeño
      editar.style.padding = '2px 4px';
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
    borrar.style.flex = '0 0 auto';
    borrar.style.fontSize = '0.8em';
    borrar.style.padding = '2px 4px';
    borrar.addEventListener('click', e => {
      e.stopPropagation();
      mostrarConfirmacion(`¿Desea borrar "${item.nombre}"?`, () => {
        nivel.hijos.splice(index, 1);
        guardarDatos(); // Firestore
        renderizar();
      });
    });
    div.appendChild(borrar);
  }

  return div;
}

// --- Timer con pausa y persistencia (se mantiene en localStorage) ---
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
backButton && backButton.addEventListener('click',()=>{ 
  if(rutaActual.length>0){ rutaActual.pop(); renderizar(); } 
});

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
// ----------------------
// Event listeners para footer
// ----------------------
const navHome = document.getElementById("navHome");
const navSettings = document.getElementById("navSettings");

if (navHome) {
  navHome.addEventListener("click", () => {
    rutaActual = [];
    renderizar();
  });
}

// Por ahora el botón de ajustes no hace nada
if (navSettings) {
  navSettings.addEventListener("click", () => {
    console.log("Botón de ajustes pulsado (sin acción)");
  });
}

const menuButton = document.getElementById('menuButton');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');

// Abrir menú lateral
menuButton.addEventListener('click', () => {
  sideMenu.style.left = '0';
  menuOverlay.classList.remove('hidden');
});

// Cerrar menú al pulsar overlay
menuOverlay.addEventListener('click', () => {
  sideMenu.style.left = '-50%';
  menuOverlay.classList.add('hidden');
});

// Vincular botones del menú lateral a funciones
const seccionesFunciones = {
  entrenamiento: abrirEntrenamiento,
  seguimiento: abrirSeguimiento,
  calendario: abrirCalendario,
};

document.querySelectorAll('.sideMenu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const seccion = btn.dataset.seccion;

    // Cerrar menú lateral
    sideMenu.style.left = '-50%';
    menuOverlay.classList.add('hidden');

    // Ejecutar la función correspondiente
    if (seccionesFunciones[seccion]) {
      seccionesFunciones[seccion]();
    }
  });
});
document.getElementById('btnEntrenamiento').onclick = abrirEntrenamiento;
document.getElementById('btnSeguimiento').onclick = abrirSeguimiento;
document.getElementById('btnCalendario').onclick = abrirCalendario;
