/* contacto.js - Formulario de contacto: validación, localStorage y mensaje de gracias */
const formContacto = document.getElementById("formContacto");
const CLAVE_MENSAJES = "timotel_mensajes";
const LIMITE = 300;

const validacion = activarValidacion(formContacto, {
  nombre: reglasComunes.nombre,
  telefono: reglasComunes.telefono,
  correo: v => v === "" ? "Escribe tu correo electrónico." : reglasComunes.correoOpcional(v),
  asunto: v => v.trim().length < 3 ? "Escribe un asunto (mínimo 3 letras)." : "",
  mensaje: v => v.trim().length < 10 ? "El mensaje debe tener al menos 10 caracteres."
    : v.length > LIMITE ? "El mensaje no puede pasar de " + LIMITE + " caracteres." : ""
});

// Contador de caracteres en tiempo real
const campoMensaje = formContacto.elements.mensaje;
const contador = document.createElement("small");
contador.className = "contador";
campoMensaje.closest("label").appendChild(contador);
function actualizarContador() {
  contador.textContent = campoMensaje.value.length + " / " + LIMITE;
}
campoMensaje.addEventListener("input", actualizarContador);
actualizarContador();

formContacto.addEventListener("submit", evento => {
  evento.preventDefault();                 // evita que la página se recargue
  if (!validacion.validarTodo()) return;   // si hay errores, no seguimos

  const mensajes = leerLista(CLAVE_MENSAJES);
  mensajes.push({
    id: Date.now(),
    fecha: new Date().toLocaleString("es-CO"),
    nombre: formContacto.elements.nombre.value.trim(),
    telefono: formContacto.elements.telefono.value,
    correo: formContacto.elements.correo.value.trim(),
    asunto: formContacto.elements.asunto.value.trim(),
    mensaje: formContacto.elements.mensaje.value.trim()
  });
  guardarLista(CLAVE_MENSAJES, mensajes);

  mostrarModal({ titulo: "¡Gracias por comunicarte con nosotros!", texto: "En breve un asesor se pondrá en contacto contigo." });
  formContacto.reset();
  limpiarValidacion(formContacto);
  actualizarContador();
});
