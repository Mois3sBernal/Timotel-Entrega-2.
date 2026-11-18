/* habitacion.js - Detalle de una habitación (el id llega en la URL: habitacion.html?id=3) */
const detalle = document.getElementById("detalle");

async function cargarDetalle() {
  mostrarCargando(detalle, "Cargando habitación...");
  try {
    const id = Number(new URLSearchParams(location.search).get("id"));
    const habitaciones = await cargarJSON("data/habitaciones.json");
    const h = habitaciones.find(x => x.id === id);
    if (!h) throw new Error("No encontramos esa habitación (error 404).");
    pintarDetalle(h);
  } catch (error) {
    mostrarError(detalle, error.message, cargarDetalle);
  }
}

function pintarDetalle(h) {
  document.title = h.nombre + " | El Timotel";
  detalle.innerHTML = `
    <div class="galeria">
      <span class="disp"><i class="fa-solid fa-circle"></i> Disponible: Sí</span>
      <img id="fotoPrincipal" src="${h.fotos[0].src}" alt="${h.fotos[0].alt}" width="600" height="400">
      <div class="mini"></div>
    </div>
    <div class="info">
      <h1>${h.nombre}</h1>
      <p>12 horas de uso</p>
      <p class="precio grande">${dinero(h.precio)}</p>
      <p>${h.descripcion}</p>
      <h2 class="peq-titulo">Incluye:</h2>
      <ul class="lista-check">${h.caracteristicas.map(c => `<li>${c}</li>`).join("")}</ul>
      <a class="boton" href="reservar.html?hab=${h.id}">Reservar esta habitación</a>
    </div>`;

  // Miniaturas: al hacer clic cambian la foto grande
  const foto = document.getElementById("fotoPrincipal");
  const miniaturas = detalle.querySelector(".mini");
  h.fotos.forEach((f, posicion) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.setAttribute("aria-label", "Ver foto " + (posicion + 1));
    boton.innerHTML = `<img src="${f.src}" alt="" width="120" height="78">`;
    if (posicion === 0) boton.classList.add("activa");
    boton.addEventListener("click", () => {
      foto.src = f.src;
      foto.alt = f.alt;
      miniaturas.querySelectorAll("button").forEach(b => b.classList.remove("activa"));
      boton.classList.add("activa");
    });
    miniaturas.appendChild(boton);
  });
}

cargarDetalle();
