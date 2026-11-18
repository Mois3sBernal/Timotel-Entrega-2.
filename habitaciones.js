/* habitaciones.js - Listado con búsqueda, filtro y orden en tiempo real */
const estado = document.getElementById("estado");
const lista = document.getElementById("listaHabitaciones");
const buscar = document.getElementById("buscar");
const filtroCamas = document.getElementById("filtroCamas");
const orden = document.getElementById("orden");
const resultado = document.getElementById("resultado");
let habitaciones = [];   // aquí guardamos los datos que llegan del JSON

function aplicarFiltros() {
  const texto = buscar.value.trim().toLowerCase();
  let filtradas = habitaciones.filter(h => h.nombre.toLowerCase().includes(texto));
  if (filtroCamas.value !== "todas") {
    filtradas = filtradas.filter(h => h.camas === Number(filtroCamas.value));
  }
  if (orden.value === "menor") filtradas.sort((a, b) => a.precio - b.precio);
  if (orden.value === "mayor") filtradas.sort((a, b) => b.precio - a.precio);
  pintar(filtradas);
}

function pintar(filtradas) {
  lista.innerHTML = "";   // borramos lo anterior y volvemos a crear
  resultado.textContent = filtradas.length + " de " + habitaciones.length + " habitaciones";
  if (filtradas.length === 0) {
    const vacio = document.createElement("div");
    vacio.className = "vacio";
    vacio.innerHTML = "<p>No encontramos habitaciones con esos filtros.</p>";
    const limpiar = document.createElement("button");
    limpiar.type = "button";
    limpiar.className = "boton";
    limpiar.textContent = "Limpiar filtros";
    limpiar.addEventListener("click", () => {
      buscar.value = "";
      filtroCamas.value = "todas";
      orden.value = "ninguno";
      aplicarFiltros();
    });
    vacio.appendChild(limpiar);
    lista.appendChild(vacio);
    return;
  }
  filtradas.forEach(h => lista.appendChild(crearTarjeta(h)));
}

async function iniciar() {
  mostrarCargando(estado, "Cargando habitaciones...");
  try {
    habitaciones = await cargarJSON("data/habitaciones.json");
    estado.innerHTML = "";
    aplicarFiltros();
  } catch (error) {
    resultado.textContent = "";
    mostrarError(estado, error.message, iniciar);
  }
}

// Eventos: la lista se actualiza mientras el usuario escribe o cambia un filtro
buscar.addEventListener("input", aplicarFiltros);
filtroCamas.addEventListener("change", aplicarFiltros);
orden.addEventListener("change", aplicarFiltros);
document.getElementById("formFiltros").addEventListener("submit", e => e.preventDefault());

iniciar();
