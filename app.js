// ===== Facturador 4.0 · Carrito (versión mejorada + futurista) =====

// 1. DATOS
const IVA = 0.15;

// `emoji` se muestra siempre como imagen de respaldo.
// Si agregas `imagen: "img/mouse.jpg"` (o una URL), se muestra la foto encima.
const catalogo = [
  { id: 1, nombre: "Mouse inalámbrico", precio: 12.5, categoria: "Periféricos", emoji: "🖱️" },
  { id: 2, nombre: "Teclado mecánico", precio: 25, categoria: "Periféricos", emoji: "⌨️" },
  { id: 3, nombre: "Audífonos con micrófono", precio: 35, categoria: "Audio", emoji: "🎧" },
  { id: 4, nombre: "Cámara web HD", precio: 42, categoria: "Periféricos", emoji: "📷" },
  { id: 5, nombre: "Cable USB-C 1 m", precio: 2, categoria: "Accesorios", emoji: "🔌" },
  { id: 6, nombre: "Memoria USB 64 GB", precio: 9.9, categoria: "Almacenamiento", emoji: "💾" },
  { id: 7, nombre: "Hub USB-C 4 puertos", precio: 28, categoria: "Accesorios", emoji: "🔗" },
  { id: 8, nombre: "Monitor 24 pulgadas", precio: 189, categoria: "Pantallas", emoji: "🖥️" },
  { id: 9, nombre: "Parlante Bluetooth", precio: 29.9, categoria: "Audio", emoji: "🔊" },
  { id: 10, nombre: "Micrófono USB", precio: 39, categoria: "Audio", emoji: "🎙️" },
  { id: 11, nombre: "Disco SSD 500 GB", precio: 58, categoria: "Almacenamiento", emoji: "💽" },
  { id: 12, nombre: "Disco externo 1 TB", precio: 64, categoria: "Almacenamiento", emoji: "🗄️" },
  { id: 13, nombre: "Mousepad XL", precio: 8.5, categoria: "Accesorios", emoji: "🟦" },
  { id: 14, nombre: "Soporte para laptop", precio: 22, categoria: "Accesorios", emoji: "💻" },
  { id: 15, nombre: "Monitor curvo 27 pulgadas", precio: 279, categoria: "Pantallas", emoji: "📺" },
  { id: 16, nombre: "Tablet 10 pulgadas", precio: 149, categoria: "Pantallas", emoji: "📱" },
];

const coloresCategoria = {
  "Periféricos": ["#c7d2fe", "#a5b4fc"],
  "Audio": ["#fbcfe8", "#f9a8d4"],
  "Accesorios": ["#bbf7d0", "#86efac"],
  "Almacenamiento": ["#fde68a", "#fcd34d"],
  "Pantallas": ["#bae6fd", "#7dd3fc"],
};
const fondo = (categoria) => {
  const [a, b] = coloresCategoria[categoria] || ["#e5e7eb", "#d1d5db"];
  return `linear-gradient(135deg, ${a}, ${b})`;
};

// 2. ESTADO (el carrito y el envío se recuperan de localStorage)
const CLAVE = "facturador-carrito";
function cargarGuardado() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { return {}; }
}
const guardado = cargarGuardado();

const estado = {
  carrito: Array.isArray(guardado.carrito)
    ? guardado.carrito.filter((i) => catalogo.some((p) => p.id === i.id) && i.cantidad > 0)
    : [],
  busqueda: "",
  categoria: "todas",
  orden: "defecto",
  precioMax: 300,
  envio: guardado.envio || "retiro",
  pedidos: guardado.pedidos || 0,
};

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      carrito: estado.carrito, envio: estado.envio, pedidos: estado.pedidos,
    }));
  } catch { /* sin almacenamiento disponible: se ignora */ }
}

// 3. ELEMENTOS DEL DOM
const $ = (sel) => document.querySelector(sel);
const contCatalogo = $("#catalogo"), sinResultados = $("#sinResultados");
const inputBuscar = $("#buscar"), selectCategoria = $("#categoria"), selectOrden = $("#orden");
const listaCarrito = $("#listaCarrito"), carritoVacio = $("#carritoVacio");
const selectEnvio = $("#envio"), resumen = $("#resumen");
const btnConfirmar = $("#btnConfirmar"), btnVaciar = $("#btnVaciar");
const mensaje = $("#mensaje"), badge = $("#badge");

// 4. CÁLCULOS
const formatoDinero = (v) => `$${v.toFixed(2)}`;
const buscarProducto = (id) => catalogo.find((p) => p.id === id);

function porcentajeDescuento(unidades) {
  if (unidades >= 10) return 0.10;
  if (unidades >= 5) return 0.05;
  return 0;
}
function costoEnvio(tipo) {
  switch (tipo) {
    case "cuenca": return 2.5;
    case "nacional": return 6;
    default: return 0;
  }
}
function totalUnidades() {
  return estado.carrito.reduce((suma, i) => suma + i.cantidad, 0);
}
function calcularTotales() {
  const subtotal = estado.carrito.reduce((s, i) => s + buscarProducto(i.id).precio * i.cantidad, 0);
  const descuento = subtotal * porcentajeDescuento(totalUnidades());
  const envio = estado.carrito.length > 0 ? costoEnvio(estado.envio) : 0;
  const base = subtotal - descuento + envio;
  const iva = base * IVA;
  return { subtotal, descuento, envio, iva, total: base + iva };
}

// 5. CAMBIOS DE ESTADO
function agregar(id) {
  const item = estado.carrito.find((i) => i.id === id);
  if (item) item.cantidad++;
  else estado.carrito.push({ id, cantidad: 1 });
}
function quitar(id) {
  estado.carrito = estado.carrito.filter((i) => i.id !== id);
}
function cambiarCantidad(id, cambio) {
  const item = estado.carrito.find((i) => i.id === id);
  item.cantidad += cambio;
  if (item.cantidad <= 0) quitar(id);
}

// 6. RENDER
function crearImagen(producto) {
  const caja = document.createElement("div");
  caja.classList.add("imagen");
  caja.style.background = fondo(producto.categoria);
  const emoji = document.createElement("span");
  emoji.classList.add("emoji");
  emoji.textContent = producto.emoji;
  caja.append(emoji);
  if (producto.imagen) {
    const img = document.createElement("img");
    img.src = producto.imagen;
    img.alt = producto.nombre;
    img.loading = "lazy";
    img.addEventListener("error", () => img.remove()); // si falla, queda el emoji
    caja.append(img);
  }
  return caja;
}

function crearTarjetaProducto(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.classList.add("producto");
  tarjeta.dataset.id = producto.id;
  const enCarrito = estado.carrito.some((i) => i.id === producto.id);
  tarjeta.classList.toggle("en-carrito", enCarrito);

  const categoria = document.createElement("span");
  categoria.classList.add("categoria");
  categoria.textContent = producto.categoria;
  const nombre = document.createElement("span");
  nombre.classList.add("nombre");
  nombre.textContent = producto.nombre;
  const precio = document.createElement("span");
  precio.classList.add("precio");
  precio.textContent = formatoDinero(producto.precio);
  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = enCarrito ? "✓ Agregar otro" : "Agregar";

  tarjeta.append(crearImagen(producto), categoria, nombre, precio, boton);
  return tarjeta;
}

function productosVisibles() {
  const texto = estado.busqueda.toLowerCase();
  const lista = catalogo.filter((p) =>
    p.nombre.toLowerCase().includes(texto) &&
    p.precio <= estado.precioMax &&
    (estado.categoria === "todas" || p.categoria === estado.categoria)
  );
  if (estado.orden === "menor") lista.sort((a, b) => a.precio - b.precio);
  if (estado.orden === "mayor") lista.sort((a, b) => b.precio - a.precio);
  if (estado.orden === "nombre") lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return lista;
}

function renderCatalogo() {
  const visibles = productosVisibles();
  contCatalogo.replaceChildren(...visibles.map(crearTarjetaProducto));
  sinResultados.hidden = visibles.length > 0;
}

function crearItemCarrito(item) {
  const producto = buscarProducto(item.id);
  const li = document.createElement("li");
  li.classList.add("item");
  li.dataset.id = item.id;

  const mini = document.createElement("div");
  mini.classList.add("mini");
  mini.style.background = fondo(producto.categoria);
  mini.textContent = producto.emoji;

  const detalle = document.createElement("div");
  detalle.classList.add("detalle");
  const nombre = document.createElement("strong");
  nombre.textContent = producto.nombre;
  const linea = document.createElement("small");
  linea.textContent = `${formatoDinero(producto.precio)} × ${item.cantidad} = ${formatoDinero(producto.precio * item.cantidad)}`;
  detalle.append(nombre, linea);

  const crearBtn = (accion, texto, clase) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.accion = accion;
    b.textContent = texto;
    if (clase) b.classList.add(clase);
    return b;
  };
  const cantidad = document.createElement("div");
  cantidad.classList.add("cantidad");
  const numero = document.createElement("span");
  numero.textContent = item.cantidad;
  cantidad.append(crearBtn("menos", "−"), numero, crearBtn("mas", "+"));

  const quitarBtn = crearBtn("quitar", "✕", "quitar");
  quitarBtn.title = "Quitar del carrito";

  li.append(mini, detalle, cantidad, quitarBtn);
  return li;
}

function renderCarrito() {
  listaCarrito.replaceChildren(...estado.carrito.map(crearItemCarrito));
  const vacio = estado.carrito.length === 0;
  carritoVacio.hidden = !vacio;
  btnConfirmar.disabled = vacio;
  btnVaciar.disabled = vacio;
}

function lineaResumen(etiqueta, valor, clase) {
  const div = document.createElement("div");
  div.classList.add("linea");
  if (clase) div.classList.add(clase);
  const a = document.createElement("span");
  a.textContent = etiqueta;
  const b = document.createElement("span");
  b.textContent = valor;
  div.append(a, b);
  return div;
}

function renderResumen() {
  const t = calcularTotales();
  resumen.replaceChildren(
    lineaResumen(`Subtotal (${totalUnidades()} u.)`, formatoDinero(t.subtotal)),
    lineaResumen("Descuento", t.descuento > 0 ? `- ${formatoDinero(t.descuento)}` : "No aplica", "descuento"),
    lineaResumen("Envío", formatoDinero(t.envio)),
    lineaResumen(`IVA (${IVA * 100} %)`, formatoDinero(t.iva)),
    lineaResumen("Total", formatoDinero(t.total), "total")
  );
}

function renderBadge() {
  const anterior = badge.textContent;
  badge.textContent = totalUnidades();
  if (badge.textContent !== anterior) {
    badge.classList.remove("pulso");
    void badge.offsetWidth;
    badge.classList.add("pulso");
  }
}

function render() {
  renderCatalogo();
  renderCarrito();
  renderResumen();
  renderBadge();
  guardar();
}

// 7. EVENTOS
inputBuscar.addEventListener("input", () => {
  estado.busqueda = inputBuscar.value.trim();
  renderCatalogo();
});
selectCategoria.addEventListener("change", () => {
  estado.categoria = selectCategoria.value;
  renderCatalogo();
});
selectOrden.addEventListener("change", () => {
  estado.orden = selectOrden.value;
  renderCatalogo();
});

contCatalogo.addEventListener("click", (e) => {
  const boton = e.target.closest("button");
  if (!boton) return;
  agregar(Number(boton.closest(".producto").dataset.id));
  mensaje.hidden = true;
  render();
});

listaCarrito.addEventListener("click", (e) => {
  const boton = e.target.closest("button");
  if (!boton) return;
  const id = Number(boton.closest(".item").dataset.id);
  const accion = boton.dataset.accion;
  if (accion === "mas") cambiarCantidad(id, 1);
  if (accion === "menos") cambiarCantidad(id, -1);
  if (accion === "quitar") quitar(id);
  render();
});

selectEnvio.addEventListener("change", () => {
  estado.envio = selectEnvio.value;
  renderResumen();
  guardar();
});

btnVaciar.addEventListener("click", () => {
  estado.carrito = [];
  render();
});

btnConfirmar.addEventListener("click", () => {
  const total = calcularTotales().total;
  estado.pedidos++;
  const numero = String(estado.pedidos).padStart(3, "0");
  mensaje.textContent = `✅ Pedido #${numero} confirmado por ${formatoDinero(total)}. ¡Gracias por tu compra!`;
  mensaje.hidden = false;
  estado.carrito = [];
  render();
});

// 8. INICIO: las categorías se generan solas a partir del catálogo
const categorias = [...new Set(catalogo.map((p) => p.categoria))];
for (const nombre of categorias) {
  const opcion = document.createElement("option");
  opcion.value = nombre;
  opcion.textContent = nombre;
  selectCategoria.append(opcion);
}
selectEnvio.value = estado.envio;
render();

// ===== 9. EXTRAS: slider, modal y filtro de precio =====
// ===== Extras futuristas: slider, modal y filtro de precio =====
// Se carga después de app.js y reutiliza sus funciones globales.


const descripciones = {
  "Periféricos": "Control total con precisión y respuesta inmediata para trabajo y juego.",
  "Audio": "Sonido nítido y envolvente, con tecnología pensada para el futuro.",
  "Accesorios": "El complemento ideal para mantener tu equipo conectado y ordenado.",
  "Almacenamiento": "Velocidad y capacidad para llevar tus datos a cualquier lugar.",
  "Pantallas": "Imágenes brillantes y de alta definición en cada detalle.",
};

const foto = (p) => p.imagen ? `<img class="foto" src="${p.imagen}" alt="${p.nombre}" onerror="this.remove()">` : "";
const rango = $("#precioMax"), salida = $("#precioSalida");
rango.addEventListener("input", () => {
  estado.precioMax = Number(rango.value);
  salida.textContent = formatoDinero(estado.precioMax);
  renderCatalogo();
});

// ----- Modal -----
const modal = $("#modal"), cuerpoModal = $("#modalCuerpo");
function abrirModal(html) {
  cuerpoModal.innerHTML = html;
  modal.hidden = false;
  document.body.classList.add("bloqueado");
}
function cerrarModal() {
  modal.hidden = true;
  document.body.classList.remove("bloqueado");
}
modal.addEventListener("click", (e) => {
  if (e.target === modal || e.target.closest("[data-cerrar]")) cerrarModal();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

function verProducto(id) {
  const p = buscarProducto(id);
  let cant = 1;
  abrirModal(`
    <div class="detalle-prod">
      <div class="gran" style="background:${fondo(p.categoria)}"><span class="emoji">${p.emoji}</span>${foto(p)}</div>
      <div class="info">
        <span class="cat">${p.categoria}</span>
        <h3>${p.nombre}</h3>
        <p>${descripciones[p.categoria] || ""}</p>
        <strong class="precio-grande">${formatoDinero(p.precio)}</strong>
        <div class="cantidad">
          <button type="button" data-m="-1">−</button><span id="mCant">1</span><button type="button" data-m="1">+</button>
        </div>
        <button type="button" class="principal" id="mAgregar">Agregar al carrito</button>
      </div>
    </div>`);
  cuerpoModal.querySelectorAll("[data-m]").forEach((b) => {
    b.onclick = () => {
      cant = Math.max(1, cant + Number(b.dataset.m));
      $("#mCant").textContent = cant;
    };
  });
  $("#mAgregar").onclick = () => {
    for (let i = 0; i < cant; i++) agregar(id);
    render();
    cerrarModal();
  };
}

// Clic en la tarjeta (fuera del botón) abre el detalle
contCatalogo.addEventListener("click", (e) => {
  if (e.target.closest("button")) return;
  const tarjeta = e.target.closest(".producto");
  if (tarjeta) verProducto(Number(tarjeta.dataset.id));
});

// Confirmación de pedido en modal (fase de captura: corre antes de vaciar el carrito)
btnConfirmar.addEventListener("click", () => {
  const t = calcularTotales();
  const n = String(estado.pedidos + 1).padStart(3, "0");
  const filas = estado.carrito.map((i) => {
    const p = buscarProducto(i.id);
    return `<tr><td>${p.emoji} ${p.nombre}</td><td>×${i.cantidad}</td><td>${formatoDinero(p.precio * i.cantidad)}</td></tr>`;
  }).join("");
  const l = (a, b, c = "") => `<div class="linea ${c}"><span>${a}</span><span>${b}</span></div>`;
  abrirModal(`
    <h3 class="ok">✅ Pedido #${n} confirmado</h3>
    <table class="tabla">${filas}</table>
    ${l("Subtotal", formatoDinero(t.subtotal))}
    ${l("Descuento", t.descuento > 0 ? "- " + formatoDinero(t.descuento) : "No aplica", "descuento")}
    ${l("Envío", formatoDinero(t.envio))}
    ${l(`IVA (${IVA * 100} %)`, formatoDinero(t.iva))}
    ${l("Total", formatoDinero(t.total), "total")}
    <button type="button" class="principal ancho" data-cerrar>Seguir comprando</button>`);
}, true);

// ----- Slider de destacados -----
const destacados = [8, 15, 16, 11, 3].map(buscarProducto);
const pista = $("#pista"), puntos = $("#puntos");
let pos = 0, temporizador;

pista.innerHTML = destacados.map((p) => `
  <article class="slide">
    <div class="slide-emoji"><span class="emoji">${p.emoji}</span>${foto(p)}</div>
    <div class="slide-info">
      <span class="cat">Destacado · ${p.categoria}</span>
      <h3>${p.nombre}</h3>
      <strong>${formatoDinero(p.precio)}</strong>
      <button type="button" class="principal" data-ver="${p.id}">Ver detalle</button>
    </div>
  </article>`).join("");
puntos.innerHTML = destacados.map((_, i) => `<button type="button" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join("");

function ir(i) {
  pos = (i + destacados.length) % destacados.length;
  pista.style.transform = `translateX(-${pos * 100}%)`;
  [...puntos.children].forEach((b, k) => b.classList.toggle("activo", k === pos));
}
function auto() {
  clearInterval(temporizador);
  temporizador = setInterval(() => ir(pos + 1), 5000);
}
$("#prev").onclick = () => { ir(pos - 1); auto(); };
$("#next").onclick = () => { ir(pos + 1); auto(); };
puntos.onclick = (e) => {
  const b = e.target.closest("button");
  if (b) { ir(Number(b.dataset.i)); auto(); }
};
pista.onclick = (e) => {
  const b = e.target.closest("[data-ver]");
  if (b) verProducto(Number(b.dataset.ver));
};
ir(0);
auto();