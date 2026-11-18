/* reservar.js - Reserva: carga de habitaciones, validaciones, localStorage (crear, leer, editar, eliminar) */
const CLAVE_RESERVAS = "timotel_reservas";
const form = document.getElementById("formReserva");
const selectHab = form.elements.habitacion;
const panel = document.getElementById("infoHabitacion");
const listaReservas = document.getElementById("listaReservas");
const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("cancelarEdicion");
const avisoEdicion = document.getElementById("avisoEdicion");

let habitaciones = [];
let editandoId = null;   // si tiene un número, estamos editando esa reserva

// ----- Fechas de referencia -----
const hoyISO = new Date().toLocaleDateString("en-CA");   // formato AAAA-MM-DD
const limite = new Date(); limite.setFullYear(limite.getFullYear() + 1);
const maxISO = limite.toLocaleDateString("en-CA");
form.elements.llegada.min = hoyISO; form.elements.llegada.max = maxISO;
form.elements.salida.min = hoyISO;  form.elements.salida.max = maxISO;

// ----- Reglas de validación -----
const validacion = activarValidacion(form, {
  nombre: reglasComunes.nombre,
  telefono: reglasComunes.telefono,
  correo: reglasComunes.correoOpcional,
  llegada: v => v === "" ? "Selecciona la fecha de llegada."
    : v < hoyISO ? "La fecha de llegada no puede ser anterior a hoy."
    : v > maxISO ? "Solo se puede reservar hasta dentro de un año." : "",
  hora: (v, f) => v === "" ? "Selecciona la hora de llegada."
    : f.elements.llegada.value === hoyISO && v < new Date().toTimeString().slice(0, 5) ? "Esa hora ya pasó." : "",
  salida: (v, f) => v === "" ? "Selecciona la fecha de salida."
    : f.elements.llegada.value && v < f.elements.llegada.value ? "La salida no puede ser antes de la llegada."
    : v > maxISO ? "Solo se puede reservar hasta dentro de un año." : "",
  habitacion: v => v === "" ? "Elige una habitación." : ""
});

// Cuando cambia la llegada, revisamos otra vez la hora y la salida
form.elements.llegada.addEventListener("change", () => {
  form.elements.salida.min = form.elements.llegada.value || hoyISO;
  ["hora", "salida"].forEach(n => { if (form.elements[n].value) validacion.validarCampo(form.elements[n]); });
});

// ----- Información de la habitación elegida -----
function mostrarInfo() {
  const h = habitaciones.find(x => x.id === Number(selectHab.value));
  if (!h) {
    panel.innerHTML = `<div class="info-vacio"><i class="fa-solid fa-bed icono-ok"></i>
      <h2>Elige tu habitación</h2>
      <p class="peq">Selecciona una habitación y aquí verás su foto, precio y características.</p></div>`;
    return;
  }
  panel.innerHTML = `
    <img src="${h.fotos[0].src}" alt="${h.fotos[0].alt}" width="400" height="260">
    <h2>${h.nombre}</h2>
    <p class="peq">12 horas de uso</p>
    <p class="precio grande">${dinero(h.precio)}</p>
    <p class="desc">${h.descripcion}</p>
    <ul class="lista-check">${h.caracteristicas.map(c => `<li>${c}</li>`).join("")}</ul>`;
}
selectHab.addEventListener("change", mostrarInfo);

// ----- Cargar habitaciones (fetch + async/await + try/catch) -----
async function cargarHabitaciones() {
  panel.innerHTML = "";
  mostrarCargando(panel, "Cargando habitaciones...");
  try {
    habitaciones = await cargarJSON("data/habitaciones.json");
    selectHab.innerHTML = '<option value="">Selecciona el tipo de habitación</option>';
    habitaciones.forEach(h => {
      const opcion = document.createElement("option");   // creamos cada opción con JS
      opcion.value = h.id;
      opcion.textContent = h.nombre + " - " + dinero(h.precio);
      selectHab.appendChild(opcion);
    });
    const pre = new URLSearchParams(location.search).get("hab");   // viene del detalle
    if (pre && habitaciones.some(h => h.id === Number(pre))) selectHab.value = pre;
    mostrarInfo();
    pintarReservas();
  } catch (error) {
    mostrarError(panel, error.message, cargarHabitaciones);
  }
}

// ----- Guardar reserva (crear o actualizar) -----
form.addEventListener("submit", evento => {
  evento.preventDefault();
  if (!validacion.validarTodo()) return;

  const h = habitaciones.find(x => x.id === Number(selectHab.value));
  const reservas = leerLista(CLAVE_RESERVAS);

  // Regla de negocio: la misma habitación no se puede reservar dos veces el mismo día
  const repetida = reservas.some(r => r.habitacionId === h.id && r.llegada === form.elements.llegada.value && r.id !== editandoId);
  if (repetida) {
    marcarCampo(selectHab, "Esa habitación ya tiene una reserva para esa fecha. Elige otra habitación u otro día.");
    selectHab.focus();
    return;
  }

  const datos = {
    nombre: form.elements.nombre.value.trim(),
    telefono: form.elements.telefono.value,
    correo: form.elements.correo.value.trim(),
    llegada: form.elements.llegada.value,
    hora: form.elements.hora.value,
    salida: form.elements.salida.value,
    habitacionId: h.id,
    habitacionNombre: h.nombre,
    precio: h.precio,
    especial: form.elements.especial.value.trim()
  };

  if (editandoId === null) {
    datos.id = Date.now();
    datos.codigo = "TM-" + Math.floor(1000 + Math.random() * 9000);
    reservas.push(datos);
    mostrarModal({ titulo: "Reserva registrada", texto: "¡Tu reserva ha sido registrada exitosamente! Recibirás en breve una confirmación en el número " + datos.telefono + ". Gracias por elegir El Timotel.", codigo: "Código: " + datos.codigo });
  } else {
    const posicion = reservas.findIndex(r => r.id === editandoId);
    datos.id = editandoId;
    datos.codigo = reservas[posicion].codigo;
    reservas[posicion] = datos;   // actualizamos la reserva existente
    mostrarModal({ titulo: "Reserva actualizada", texto: "Los cambios de tu reserva se guardaron correctamente.", codigo: "Código: " + datos.codigo });
  }
  guardarLista(CLAVE_RESERVAS, reservas);
  terminarEdicion();
  pintarReservas();
});

// ----- Mostrar la lista de reservas guardadas -----
function pintarReservas() {
  const reservas = leerLista(CLAVE_RESERVAS);
  listaReservas.innerHTML = "";
  if (reservas.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "vacio";
    vacio.textContent = "Aún no tienes reservas guardadas.";
    listaReservas.appendChild(vacio);
    return;
  }
  reservas.forEach(r => {
    const item = document.createElement("article");
    item.className = "reserva-item";
    // textContent: así lo que escribe el usuario nunca se interpreta como código
    const titulo = document.createElement("h3");
    titulo.textContent = r.habitacionNombre + " (" + r.codigo + ")";
    const fechas = document.createElement("p");
    fechas.textContent = "Llegada: " + r.llegada + " a las " + r.hora + " - Salida: " + r.salida;
    const cliente = document.createElement("p");
    cliente.textContent = r.nombre + " - Tel. " + r.telefono;
    const precio = document.createElement("p");
    precio.className = "precio";
    precio.textContent = dinero(r.precio) + " por 12 horas";
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    [["editar", "Editar", "btn-sec"], ["eliminar", "Eliminar", "btn-peligro"]].forEach(([accion, texto, clase]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "boton " + clase;
      b.dataset.accion = accion;
      b.dataset.id = r.id;
      b.textContent = texto;
      acciones.appendChild(b);
    });
    item.append(titulo, fechas, cliente, precio, acciones);
    listaReservas.appendChild(item);
  });
}

// Un solo "escuchador" para todos los botones Editar/Eliminar
listaReservas.addEventListener("click", evento => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const reservas = leerLista(CLAVE_RESERVAS);

  if (boton.dataset.accion === "eliminar") {
    if (!confirm("¿Seguro que quieres eliminar esta reserva?")) return;
    guardarLista(CLAVE_RESERVAS, reservas.filter(r => r.id !== id));
    if (editandoId === id) terminarEdicion();
    pintarReservas();
  }
  if (boton.dataset.accion === "editar") {
    const r = reservas.find(x => x.id === id);
    ["nombre", "telefono", "correo", "llegada", "hora", "salida", "especial"].forEach(n => (form.elements[n].value = r[n]));
    selectHab.value = r.habitacionId;
    mostrarInfo();
    editandoId = id;
    botonGuardar.textContent = "Guardar cambios";
    botonCancelar.hidden = false;
    avisoEdicion.hidden = false;
    avisoEdicion.textContent = "Estás editando la reserva " + r.codigo + ".";
    limpiarValidacion(form);
    form.scrollIntoView({ behavior: "smooth" });
  }
});

function terminarEdicion() {
  editandoId = null;
  form.reset();
  limpiarValidacion(form);
  mostrarInfo();
  botonGuardar.textContent = "Realizar reserva";
  botonCancelar.hidden = true;
  avisoEdicion.hidden = true;
}
botonCancelar.addEventListener("click", terminarEdicion);

cargarHabitaciones();
