/* inicio.js - Muestra 3 habitaciones destacadas en la página de inicio */
const destacadas = document.getElementById("destacadas");

async function cargarDestacadas() {
  mostrarCargando(destacadas, "Cargando habitaciones...");
  try {
    const habitaciones = await cargarJSON("data/habitaciones.json");
    destacadas.innerHTML = "";
    habitaciones.slice(0, 3).forEach(h => destacadas.appendChild(crearTarjeta(h)));
  } catch (error) {
    mostrarError(destacadas, error.message, cargarDestacadas);
  }
}
cargarDestacadas();
