/* servicios.js - Lee data/servicios.json y crea las tarjetas de servicios */
const listaServicios = document.getElementById("listaServicios");

async function cargarServicios() {
  mostrarCargando(listaServicios, "Cargando servicios...");
  try {
    const servicios = await cargarJSON("data/servicios.json");
    listaServicios.innerHTML = "";
    servicios.forEach(s => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "servicio";
      tarjeta.innerHTML = `<i class="fa-solid fa-${s.icono}"></i><h3>${s.titulo}</h3><p>${s.texto}</p>`;
      listaServicios.appendChild(tarjeta);
    });
  } catch (error) {
    mostrarError(listaServicios, error.message, cargarServicios);
  }
}
cargarServicios();
