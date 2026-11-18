/* ==========================================================
   utils.js - Funciones compartidas por todas las páginas
   ========================================================== */

// ----- Formato de dinero: 60000 -> "$60.000" -----
function dinero(numero) {
  return "$" + Number(numero).toLocaleString("es-CO");
}

// ----- Mensajes visuales de carga y error -----
function mostrarCargando(contenedor, texto = "Cargando información...") {
  contenedor.innerHTML = `
    <div class="cargando" role="status">
      <span class="spinner"></span>
      <p>${texto}</p>
    </div>`;
}

function mostrarError(contenedor, mensaje, funcionReintentar) {
  contenedor.innerHTML = "";
  const caja = document.createElement("div");   // creamos elementos con JS
  caja.className = "error-caja";
  caja.setAttribute("role", "alert");

  const texto = document.createElement("p");
  texto.textContent = mensaje;
  caja.appendChild(texto);

  if (funcionReintentar) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton";
    boton.textContent = "Reintentar";
    boton.addEventListener("click", funcionReintentar);
    caja.appendChild(boton);
  }
  contenedor.appendChild(caja);
}

// ----- Pedir datos a un archivo JSON (o a una API) con fetch -----
// Devuelve los datos o lanza un error con un mensaje claro según el código HTTP.
async function cargarJSON(ruta) {
  let respuesta;
  try {
    respuesta = await fetch(ruta);
  } catch (error) {
    // Si se abrió con doble clic (file://), usamos la copia de js/respaldo.js
    if (location.protocol === "file:" && window.DATOS_RESPALDO && window.DATOS_RESPALDO[ruta]) {
      console.info("Abierto con doble clic: se usan los datos de js/respaldo.js. Con Live Server o GitHub Pages se usa fetch.");
      return window.DATOS_RESPALDO[ruta];
    }
    throw new Error("No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.");
  }
  if (respuesta.status === 404) {
    throw new Error("No se encontró el archivo " + ruta + " (error 404). Revisa que exista y que se llame exactamente así.");
  }
  if (respuesta.status >= 500) {
    throw new Error("El servidor tiene problemas en este momento (error " + respuesta.status + "). Intenta más tarde.");
  }
  if (!respuesta.ok) {
    throw new Error("Ocurrió un error inesperado (código " + respuesta.status + ").");
  }
  return await respuesta.json();
}

// ----- localStorage: guardar y leer listas en formato JSON -----
function leerLista(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || [];
  } catch (error) {
    return [];   // si el dato estaba dañado, empezamos con una lista vacía
  }
}
function guardarLista(clave, lista) {
  localStorage.setItem(clave, JSON.stringify(lista));
}

// ----- Ventana de mensaje (se crea y se elimina del DOM) -----
function mostrarModal({ icono = "fa-circle-check", titulo, texto, codigo }) {
  const ventana = document.createElement("dialog");
  ventana.className = "modal";
  ventana.innerHTML = `
    <i class="fa-solid ${icono} icono-ok"></i>
    <h2></h2>
    <p></p>
    ${codigo ? '<p class="codigo"></p>' : ""}
    <button type="button" class="boton">Aceptar</button>`;
  ventana.querySelector("h2").textContent = titulo;
  ventana.querySelector("p").textContent = texto;
  if (codigo) ventana.querySelector(".codigo").textContent = codigo;
  ventana.querySelector("button").addEventListener("click", () => ventana.close());
  ventana.addEventListener("close", () => ventana.remove());   // eliminar del DOM
  document.body.appendChild(ventana);
  ventana.showModal();
}

// ----- Tarjeta de habitación (la usan el inicio y el listado) -----
function crearTarjeta(h) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";
  const iconos = [["bed", h.camasTexto], ["bath", "Baño privado"], ["tv", "TV por cable"], ["wifi", "Wi-Fi gratis"], ["droplet", "Agua caliente"]];
  tarjeta.innerHTML = `
    <span class="num">${h.id}</span>
    <img src="${h.fotos[0].src}" alt="${h.nombre}" width="400" height="260" loading="lazy">
    <div class="tarjeta-cuerpo">
      <div class="fila"><h3>${h.nombre}</h3><span class="desde">Desde<strong>${dinero(h.precio)}</strong></span></div>
      <p class="peq">12 horas de uso</p>
      <ul class="iconos">${iconos.map(i => `<li><i class="fa-solid fa-${i[0]}"></i>${i[1]}</li>`).join("")}</ul>
      <a class="boton" href="habitacion.html?id=${h.id}">Ver detalle</a>
    </div>`;
  return tarjeta;
}

// ----- Validación en tiempo real -----
// Muestra u oculta el mensaje de error de un campo y le pone borde rojo o verde.
function marcarCampo(campo, mensaje) {
  const caja = campo.closest("label");
  let aviso = caja.querySelector(".msg-error");
  if (!aviso) {
    aviso = document.createElement("span");
    aviso.className = "msg-error";
    aviso.setAttribute("role", "alert");
    caja.appendChild(aviso);
  }
  aviso.textContent = mensaje;
  campo.classList.toggle("invalido", mensaje !== "");
  campo.classList.toggle("valido", mensaje === "" && campo.value.trim() !== "");
  return mensaje === "";   // true si el campo está bien
}

// Conecta las reglas de un formulario con los eventos input, blur y change.
function activarValidacion(formulario, reglas) {
  const nombres = Object.keys(reglas);
  function validarCampo(campo) {
    return marcarCampo(campo, reglas[campo.name](campo.value, formulario));
  }
  nombres.forEach(nombre => {
    const campo = formulario.elements[nombre];
    ["input", "blur", "change"].forEach(evento => campo.addEventListener(evento, () => validarCampo(campo)));
  });
  function validarTodo() {
    let primerError = null;
    nombres.forEach(nombre => {
      const campo = formulario.elements[nombre];
      if (!validarCampo(campo) && !primerError) primerError = campo;
    });
    if (primerError) primerError.focus();
    return primerError === null;
  }
  return { validarCampo, validarTodo };
}

// Quita los bordes y mensajes de validación (después de enviar o limpiar)
function limpiarValidacion(formulario) {
  formulario.querySelectorAll(".msg-error").forEach(a => (a.textContent = ""));
  formulario.querySelectorAll(".invalido, .valido").forEach(c => c.classList.remove("invalido", "valido"));
}

// Reglas que se repiten en varios formularios
const reglasComunes = {
  nombre: v => v.trim().length < 3 ? "Escribe tu nombre completo (mínimo 3 letras)."
    : !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(v) ? "El nombre solo puede tener letras y espacios." : "",
  telefono: v => !/^3[0-9]{9}$/.test(v) ? "Escribe un celular de 10 dígitos que empiece por 3 (ejemplo: 3104563427)." : "",
  correoOpcional: v => v !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "El correo no es válido (ejemplo: nombre@correo.com)." : ""
};
