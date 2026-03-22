class Producto {
    constructor(id, nombre, precio, categoria, imagen, descripcion) {
        this.id = id;
        this.nombre = nombre;
        this.precio = precio;
        this.categoria = categoria;
        this.imagen = imagen;
        this.descripcion = descripcion;
    }

    precioFormateado() {
        return `$${this.precio.toLocaleString("es-AR")}`;
    }

    esDeLaCategoria(cat) {
        return cat === "todos" || this.categoria === cat;
    }
}

class ItemCarrito {
    constructor(producto, cantidad) {
        this.producto = producto;
        this.cantidad = cantidad;
    }

    calcularSubtotal() {
        return this.producto.precio * this.cantidad;
    }

    subtotalFormateado() {
        return `$${this.calcularSubtotal().toLocaleString("es-AR")}`;
    }
}

let carrito = [];
let productosEnPantalla = [];
let categoriaActiva = "todos";

const cargarProductos = (lista) => lista.map(p => new Producto(p.id, p.nombre, p.precio, p.categoria, p.imagen, p.descripcion));

const buscarProductoPorId = (id) => productosEnPantalla.find(p => p.id === id) || null;
const buscarItemEnCarrito = (idProducto) => carrito.find(item => item.producto.id === idProducto) || null;


const agregarAlCarrito = (idProducto) => {
    const producto = buscarProductoPorId(idProducto);
    if (!producto) {
        mostrarMensaje("Producto no encontrado.", "error");
        return;
    }

    const itemExistente = buscarItemEnCarrito(idProducto);
    if (itemExistente) {
        itemExistente.cantidad++;
        mostrarMensaje(`${producto.nombre} actualizado en el carrito.`, "exito");
    } else {
        carrito.push(new ItemCarrito(producto, 1));
        mostrarMensaje(`${producto.nombre} agregado al carrito.`, "exito");
    }

    guardarCarritoEnStorage();
};

const eliminarDelCarrito = (idProducto) => {
    carrito = carrito.filter(item => item.producto.id !== idProducto);
    guardarCarritoEnStorage();
    mostrarMensaje("Producto eliminado del carrito.", "info");
};

const vaciarCarrito = () => {
    carrito = [];
    localStorage.removeItem("carritoTienda");
    mostrarMensaje("El carrito fue vaciado.", "info");
};

const calcularTotal = () => carrito.reduce((acc, item) => acc + item.calcularSubtotal(), 0);
const totalFormateado = () => `$${calcularTotal().toLocaleString("es-AR")}`;
const cantidadItemsEnCarrito = () => carrito.reduce((acc, item) => acc + item.cantidad, 0);

// --------------------------------------------------
// STORAGE
// --------------------------------------------------
const guardarCarritoEnStorage = () => {
    const datos = carrito.map(item => ({ idProducto: item.producto.id, cantidad: item.cantidad }));
    localStorage.setItem("carritoTienda", JSON.stringify(datos));
};

const recuperarCarritoDeStorage = (listaProductos) => {
    const guardado = localStorage.getItem("carritoTienda");
    if (!guardado) return;

    const datos = JSON.parse(guardado);
    datos.forEach(item => {
        const p = listaProductos.find(p => p.id === item.idProducto);
        if (p) carrito.push(new ItemCarrito(p, item.cantidad));
    });
};

const guardarCategoriaEnStorage = (categoria) => localStorage.setItem("categoriaActiva", categoria);
const recuperarCategoriaDeStorage = () => localStorage.getItem("categoriaActiva") || "todos";

const guardarUltimaVisita = () => {
    const ahora = new Date();
    const fechaStr = `${ahora.toLocaleDateString("es-AR")} a las ${ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
    localStorage.setItem("ultimaVisita", fechaStr);
};



const mostrarMensaje = (texto, tipo) => {
    const contenedor = document.getElementById("mensaje-alerta");
    if (!contenedor) return;

    contenedor.textContent = texto;
    contenedor.className = `mensaje-alerta activo ${tipo}`;

    setTimeout(() => {
        contenedor.className = "mensaje-alerta";
        contenedor.textContent = "";
    }, 3000);
};

const mostrarUltimaVisita = () => {
    const visita = localStorage.getItem("ultimaVisita");
    const footer = document.getElementById("ultima-visita");
    if (!footer) return;
    
    footer.textContent = visita ? `Última visita: ${visita}` : "Primera visita";
};


const renderizarProductos = (lista) => {
    const grilla = document.getElementById("grilla-productos");
    
    if (lista.length === 0) {
        grilla.innerHTML = `<p class="sin-resultados">No hay productos en esta categoría.</p>`;
        return;
    }

    let htmlContenido = "";
    lista.forEach(producto => {
        const precioTxt = producto.precioFormateado();
        
        htmlContenido += `
            <div class="card-producto">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="card-imagen">
                <div class="card-cuerpo">
                    <h3 class="card-nombre">${producto.nombre}</h3>
                    <span class="card-categoria">${producto.categoria}</span>
                    <p class="card-descripcion">${producto.descripcion}</p>
                    <p class="card-precio">${precioTxt}</p>
                    <button class="btn-agregar" data-id="${producto.id}">Agregar al carrito</button>
                </div>
            </div>
        `;
    });
    
    grilla.innerHTML = htmlContenido;
};


const renderizarCarrito = () => {
    const lista = document.getElementById("lista-carrito");
    const totalSpan = document.getElementById("total-carrito");
    const contador = document.getElementById("contador-carrito");

    if (carrito.length === 0) {
        lista.innerHTML = `<p class="carrito-vacio">Tu carrito está vacío.</p>`;
        totalSpan.textContent = "$0";
        contador.textContent = "0";
        return;
    }

    let htmlCarrito = "";
    carrito.forEach(item => {
        const subtotalTxt = item.subtotalFormateado();
        
        htmlCarrito += `
            <div class="carrito-item">
                <span class="item-nombre">${item.producto.nombre}</span>
                <span class="item-cantidad">x${item.cantidad}</span>
                <span class="item-subtotal">${subtotalTxt}</span>
                <button class="btn-eliminar-item" data-id="${item.producto.id}">✕</button>
            </div>
        `;
    });
    
    lista.innerHTML = htmlCarrito;
    totalSpan.textContent = totalFormateado();
    contador.textContent = cantidadItemsEnCarrito();
};

const configurarFiltros = () => {
    const botonesFiltro = document.querySelectorAll(".btn-filtro");

    botonesFiltro.forEach(btn => {
        btn.addEventListener("click", (evento) => {
            botonesFiltro.forEach(b => b.classList.remove("activo"));
            evento.target.classList.add("activo");

            const categoria = evento.target.getAttribute("data-categoria");
            categoriaActiva = categoria;
            const filtrados = productosEnPantalla.filter(p => p.esDeLaCategoria(categoria));
            
            renderizarProductos(filtrados);
            guardarCategoriaEnStorage(categoria);
        });
    });
};

const configurarGrillaYCarrito = () => {

     document.getElementById("grilla-productos").addEventListener("click", (evento) => {
        if (evento.target.classList.contains("btn-agregar")) {
            const id = parseInt(evento.target.getAttribute("data-id"));
            agregarAlCarrito(id);
            renderizarCarrito();
        }
    });

 
    document.getElementById("lista-carrito").addEventListener("click", (evento) => {
        if (evento.target.classList.contains("btn-eliminar-item")) {
            const id = parseInt(evento.target.getAttribute("data-id"));
            eliminarDelCarrito(id);
            renderizarCarrito();
        }
    });

    const panel = document.getElementById("panel-carrito");
    const overlay = document.getElementById("overlay-carrito");

    const cerrarPanel = () => {
        panel.classList.add("cerrado");
        overlay.classList.add("oculto");
    };

    document.getElementById("btn-abrir-carrito").addEventListener("click", () => {
        panel.classList.remove("cerrado");
        overlay.classList.remove("oculto");
    });
    document.getElementById("btn-cerrar-carrito").addEventListener("click", cerrarPanel);
    overlay.addEventListener("click", cerrarPanel);

    document.getElementById("btn-vaciar-carrito").addEventListener("click", () => {
        if (carrito.length > 0) {
            vaciarCarrito();
            renderizarCarrito();
        }
    });

    document.getElementById("btn-finalizar-compra").addEventListener("click", () => {
        if (carrito.length === 0) {
            mostrarMensaje("Agregá productos al carrito antes de comprar.", "error");
            return;
        }
        mostrarMensaje(`¡Compra realizada con éxito! Total: ${totalFormateado()}`, "exito");
        vaciarCarrito();
        renderizarCarrito();
        cerrarPanel();
    });
};

const iniciarApp = () => {
    // 1. Carga de datos local síncrono
    productosEnPantalla = cargarProductos(productos);
    
    // 2. Recuperar storage y estado local
    recuperarCarritoDeStorage(productosEnPantalla);

    const ultimaCategoria = recuperarCategoriaDeStorage();
    categoriaActiva = ultimaCategoria;

    const productosFiltrados = productosEnPantalla.filter(p => p.esDeLaCategoria(ultimaCategoria));
    renderizarProductos(productosFiltrados);
    renderizarCarrito();

    // 3. Modificar UI en base al estado
    document.querySelectorAll(".btn-filtro").forEach(btn => {
        if (btn.getAttribute("data-categoria") === ultimaCategoria) {
            btn.classList.add("activo");
        } else {
            btn.classList.remove("activo");
        }
    });

    mostrarUltimaVisita();
    guardarUltimaVisita();

    // 4. Configurar interactividad
    configurarFiltros();
    configurarGrillaYCarrito();
};

document.addEventListener("DOMContentLoaded", iniciarApp);
