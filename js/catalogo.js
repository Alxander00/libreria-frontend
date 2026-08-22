const container = document.getElementById("catalogoContainer");
let todosLosProductos = [];
let modalDetalle;
let paginaActual = 0;
const tamañoPagina = 12; 
let timeoutBusqueda = null;

document.addEventListener("DOMContentLoaded", async () => {
    modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalleProducto'));
    
    if (getToken()) {
        if(typeof actualizarBadge === 'function') actualizarBadge();
        configurarMenuUsuario();
    }

    await cargarCategorias();
    
    const parametrosURL = new URLSearchParams(window.location.search);
    const busquedaPrevia = parametrosURL.get("buscar");
    
    if (busquedaPrevia) {
        document.getElementById("searchInput").value = busquedaPrevia;
    }
    
    cargarCatalogoServerSide(0);

    document.getElementById("btnAplicarFiltros").addEventListener("click", () => cargarCatalogoServerSide(0));
    
    document.getElementById("searchInput").addEventListener("input", () => {
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => {
            cargarCatalogoServerSide(0);
        }, 500); 
    });
    
    document.getElementById("btnLimpiarFiltros").addEventListener("click", () => {
        document.getElementById("searchInput").value = "";
        document.getElementById("categoriaFiltro").value = "";
        document.getElementById("precioMinFiltro").value = "";
        document.getElementById("precioMaxFiltro").value = "";
        document.getElementById("ordenFiltro").value = "";
        window.history.replaceState({}, document.title, window.location.pathname);
        cargarCatalogoServerSide(0);
    });
});

async function cargarCategorias() {
    try {
        const res = await fetch(`${API_URL}/categoria`);
        if (res.ok) {
            const categorias = await res.json();
            const select = document.getElementById("categoriaFiltro");
            categorias.forEach(c => select.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`);
        }
    } catch (e) { console.error(e); }
}

async function cargarCatalogoServerSide(pagina = 0) {
    paginaActual = pagina;
    
    const texto = document.getElementById("searchInput").value.trim();
    const cat = document.getElementById("categoriaFiltro").value;
    const min = document.getElementById("precioMinFiltro").value || 0;
    const max = document.getElementById("precioMaxFiltro").value;
    const orden = document.getElementById("ordenFiltro").value;

    let url = `${API_URL}/producto/catalogo?page=${paginaActual}&size=${tamañoPagina}`;
    if (texto) url += `&buscar=${encodeURIComponent(texto)}`;
    if (cat) url += `&categoria=${encodeURIComponent(cat)}`;
    if (min) url += `&minPrecio=${min}`;
    if (max) url += `&maxPrecio=${max}`;
    if (orden) url += `&orden=${orden}`;

    try {
        container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json(); 
        
        todosLosProductos = data.content; 
        
        mostrarProductos(data.content, data.totalElements);
        renderizarPaginacion(data);
        
    } catch { 
        Swal.fire("Error", "No se pudo conectar con el catálogo.", "error"); 
    }
}

function mostrarProductos(productos, totalResultados) {
    container.innerHTML = "";
    
    const contador = document.getElementById("contadorResultados");
    if (contador) {
        contador.textContent = `Mostrando ${productos.length} de ${totalResultados} resultados`;
    }

    if (productos.length === 0) {
        container.innerHTML = `
        <div class="col-12 text-center py-5 bg-white rounded-4 shadow-sm border border-light">
            <i class="bi bi-search display-1 text-muted mb-3 d-block opacity-50"></i>
            <h4 class="text-muted fw-bold">No se encontraron productos</h4>
            <p class="text-secondary">Intenta usar otros filtros o buscar algo diferente.</p>
        </div>`;
        return;
    }

    const rol = typeof getUserRole === 'function' ? getUserRole() : null; 

    productos.forEach(p => {
        const img = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : 'https://via.placeholder.com/300x250?text=Sin+Imagen';
        
        const descuentoPct = parseInt(p.descuento) || 0;
        const tieneDescuento = descuentoPct > 0;
        let precioFinal = p.precio;
        let htmlPrecios = "";

        if (tieneDescuento) {
            precioFinal = p.precio - (p.precio * (descuentoPct / 100));
            htmlPrecios = `
                <div class="d-flex align-items-center justify-content-center gap-2 mb-3">
                    <span class="text-muted text-decoration-line-through small" style="font-size: 0.85rem;">$${p.precio.toFixed(2)}</span>
                    <span class="text-primary fw-bold fs-5">$${precioFinal.toFixed(2)}</span>
                    <span class="badge bg-danger rounded-pill shadow-sm" style="font-size: 0.7rem;">-${descuentoPct}%</span>
                </div>`;
        } else {
            htmlPrecios = `<div class="mb-3"><span class="text-primary fw-bold fs-5">$${p.precio.toFixed(2)}</span></div>`;
        }

        let stockTotal = 0;
        if (p.variaciones && p.variaciones.length > 0) {
            stockTotal = p.variaciones.reduce((acc, v) => acc + v.stock, 0);
        }
        const sinStock = stockTotal === 0;

        const ribbonHTML = sinStock ? `
            <div class="ribbon-wrapper">
                <div class="ribbon-sold-out">Agotado</div>
            </div>` : '';

        const opacidadTarjeta = sinStock ? 'opacity-75' : '';
        const estadoBoton = sinStock ? 'disabled' : '';

        let botonHTML = '';
        if (rol === "ROLE_ADMIN") {
            botonHTML = `<button class="btn btn-secondary btn-sm rounded-pill fw-semibold w-100" disabled onclick="event.stopPropagation();">
                            <i class="bi bi-shield-lock me-1"></i> Admin
                         </button>`;
        } else {
            const textoBoton = sinStock ? '<i class="bi bi-x-circle me-1"></i> Sin Stock' : '<i class="bi bi-cart-plus me-1"></i> Añadir al carrito';
            const claseBoton = sinStock ? 'btn-secondary' : 'btn-primary';
            
            botonHTML = `<button class="btn ${claseBoton} btn-sm rounded-pill fw-semibold w-100" ${estadoBoton} onclick="event.stopPropagation(); agregarAlCarritoRapido(${p.idProducto})">
                            ${textoBoton}
                         </button>`;
        }

        container.innerHTML += `
            <div class="col-md-6 col-lg-4 mb-4 product-card-container">
                ${ribbonHTML}
                <div class="product-card card h-100 border-0 shadow-sm ${opacidadTarjeta}" style="cursor: pointer;" onclick="abrirDetalle(${p.idProducto})">
                    <div class="card-img-container bg-light position-relative">
                        <img src="${img}" class="card-img-top object-fit-contain p-3" style="height: 220px;">
                        <span class="position-absolute top-0 start-0 badge bg-white text-dark shadow-sm m-2 border z-1">${p.categoria ? p.categoria.nombre : 'General'}</span>
                    </div>
                    <div class="card-body d-flex flex-column text-center">
                        <h6 class="card-title fw-bold text-dark mb-1 text-truncate" title="${p.nombre}">${p.nombre}</h6>
                        ${htmlPrecios}
                        <div class="mt-auto">
                            ${botonHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// 👇 DISEÑO DE PAGINACIÓN PREMIUM (Minimalista y Separado) 👇
function renderizarPaginacion(data) {
    const nav = document.getElementById("paginationContainer");
    if(!nav) return; 
    
    nav.innerHTML = "";

    // Si hay 1 sola página o ninguna, no mostramos nada
    if (data.totalPages <= 1) return;

    // Usamos gap-2 para separar los botones y quitamos el bloque continuo
    let html = `<ul class="pagination justify-content-center mb-0 gap-2 border-0">`;

    // Clases base para que todos los botones tengan exactamente el mismo tamaño (38x38px) y estilo
    const baseBtnClass = "page-link border-0 shadow-sm rounded-3 fw-semibold d-flex align-items-center justify-content-center transition-all";
    const styleSize = 'style="width: 38px; height: 38px; font-size: 0.9rem;"';

    // Botón Anterior
    html += `
        <li class="page-item ${data.first ? 'disabled' : ''}">
            <button class="${baseBtnClass} ${data.first ? 'bg-transparent text-muted shadow-none' : 'bg-white text-dark'}" 
                    onclick="cargarCatalogoServerSide(${paginaActual - 1})" ${styleSize}>
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>`;

    // Lógica inteligente de números
    for (let i = 0; i < data.totalPages; i++) {
        if (i === 0 || i === data.totalPages - 1 || Math.abs(i - data.number) <= 1) {
            if (i === data.number) {
                // Página Actual (Cuadro azul)
                html += `
                    <li class="page-item active" aria-current="page">
                        <button class="${baseBtnClass} bg-primary text-white shadow" ${styleSize}>${i + 1}</button>
                    </li>`;
            } else {
                // Páginas Inactivas (Cuadros blancos)
                html += `
                    <li class="page-item">
                        <button class="${baseBtnClass} bg-white text-secondary" onclick="cargarCatalogoServerSide(${i})" ${styleSize}>${i + 1}</button>
                    </li>`;
            }
        } else if (Math.abs(i - data.number) === 2) {
            // Separador sutil (...)
            html += `
                <li class="page-item disabled">
                    <span class="${baseBtnClass} bg-transparent shadow-none text-muted" ${styleSize}>...</span>
                </li>`;
        }
    }

    // Botón Siguiente
    html += `
        <li class="page-item ${data.last ? 'disabled' : ''}">
            <button class="${baseBtnClass} ${data.last ? 'bg-transparent text-muted shadow-none' : 'bg-white text-dark'}" 
                    onclick="cargarCatalogoServerSide(${paginaActual + 1})" ${styleSize}>
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>`;

    html += `</ul>`;
    nav.innerHTML = html;
}

function agregarAlCarritoRapido(id) {
    const token = getToken();
    if (!token) return redirigirLogin();
    
    const rol = typeof getUserRole === 'function' ? getUserRole() : null;
    if (rol === "ROLE_ADMIN") return Swal.fire("Atención", "Los admins no pueden comprar.", "warning");

    const p = todosLosProductos.find(prod => prod.idProducto === id);
    if (!p) return;

    if (!p.variaciones || p.variaciones.length === 0) {
        return Swal.fire("Agotado", "Este producto no tiene stock configurado.", "warning");
    }

    if (p.variaciones.length === 1 && p.variaciones[0].color === "Único") {
        if (p.variaciones[0].stock > 0) {
            agregarAlCarrito(p.idProducto, 1, p.variaciones[0].idVariacion);
        } else {
            Swal.fire("Agotado", "Este producto ya no tiene stock disponible.", "warning");
        }
    } 
    else {
        Swal.fire({ 
            toast: true, position: 'top-end', icon: 'info', 
            title: 'Por favor, selecciona un color', 
            showConfirmButton: false, timer: 2000 
        });
        abrirDetalle(id);
    }
}

function abrirDetalle(id) {
    const p = todosLosProductos.find(prod => prod.idProducto === id);
    if (!p) return;
    const token = getToken();

    document.getElementById("modalCategoria").textContent = p.categoria ? p.categoria.nombre : 'General';
    document.getElementById("modalNombre").textContent = p.nombre;
    document.getElementById("modalPrecio").textContent = `$${p.precio.toFixed(2)}`;
    document.getElementById("modalDescripcion").textContent = p.descripcion || 'Sin descripción adicional.';

    const imagenes = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls : ['https://via.placeholder.com/500?text=Sin+Imagen'];
    const carouselContent = document.getElementById("carouselContent");
    const carouselIndicators = document.getElementById("carouselIndicators");
    
    carouselContent.innerHTML = "";
    carouselIndicators.innerHTML = "";

    imagenes.forEach((url, index) => {
        const activeClass = index === 0 ? 'active' : '';
        carouselContent.innerHTML += `
            <div class="carousel-item ${activeClass} h-100">
                <div class="d-flex align-items-center justify-content-center h-100 p-4">
                    <img src="${url}" class="img-fluid object-fit-contain" style="max-height: 400px;">
                </div>
            </div>`;
        carouselIndicators.innerHTML += `
            <button type="button" data-bs-target="#carouselProducto" data-bs-slide-to="${index}" class="${activeClass} bg-primary"></button>`;
    });

    const colorContainer = document.getElementById("modalColoresContainer");
    const inputCantidad = document.getElementById("modalCantidad");
    const btnRestar = document.getElementById("btnRestarModal");
    const btnSumar = document.getElementById("btnSumarModal");
    const btnComprar = document.getElementById("modalBtnComprar");
    
    inputCantidad.value = 1;

// Buscá el "if (p.variaciones && p.variaciones.length > 0)" dentro de abrirDetalle(id) 
// y reemplazá todo ese bloque de variaciones por este:

if (p.variaciones && p.variaciones.length > 0) {
    // CASO 1: Producto Simple sin atributos reales
    if (p.variaciones.length === 1 && p.variaciones[0].color === "Único" && p.variaciones[0].talla === "Única") {
        const stockUnico = p.variaciones[0].stock;
        if (stockUnico > 0) {
            colorContainer.innerHTML = `<input type="hidden" id="selectVariacion" value="${p.variaciones[0].idVariacion}">
                                        <div class="small text-success fw-bold mb-2"><i class="bi bi-check-circle-fill"></i> Stock disponible: ${stockUnico} unidades</div>`;
            inputCantidad.disabled = false;
            btnComprar.disabled = false;
            btnComprar.innerHTML = `<i class="bi bi-cart-plus me-2"></i> AGREGAR AL CARRITO`;
            
            // Lógica de botones de cantidad simples
            btnRestar.onclick = () => { let a = parseInt(inputCantidad.value)||1; if(a > 1){ inputCantidad.value = a-1; }};
            btnSumar.onclick = () => { let a = parseInt(inputCantidad.value)||1; if(a < stockUnico){ inputCantidad.value = a+1; }};
            
            btnComprar.onclick = () => {
                if(getToken()) {
                    agregarAlCarrito(p.idProducto, parseInt(inputCantidad.value) || 1, p.variaciones[0].idVariacion);
                    modalDetalle.hide();
                } else { redirigirLogin(); }
            };
        } else {
            colorContainer.innerHTML = `<div class="small text-danger fw-bold mb-2"><i class="bi bi-x-circle-fill"></i> Agotado</div>`;
            inputCantidad.disabled = true;
            btnComprar.disabled = true;
            btnComprar.innerHTML = "SIN STOCK";
        }
    } 
    // CASO 2: Producto con múltiples Colores y/o Tallas (Ropa)
    else {
        // Obtenemos listas únicas de colores y tallas disponibles que tengan stock
        const coloresUnicos = [...new Set(p.variaciones.map(v => v.color))].filter(c => c !== "Único");
        const tallasUnicas = [...new Set(p.variaciones.map(v => v.talla))].filter(t => t !== "Única");

        let htmlSelects = `<div class="row g-2">`;
        
        // Selector de Color (Si aplica)
        if(coloresUnicos.length > 0) {
            htmlSelects += `
                <div class="col-6">
                    <label class="form-label fw-bold text-dark small mb-1"><i class="bi bi-palette me-1"></i> Color:</label>
                    <select id="selectColor" class="form-select border-primary shadow-sm mb-2">
                        <option value="">Elegir...</option>
                        ${coloresUnicos.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>`;
        } else {
            htmlSelects += `<input type="hidden" id="selectColor" value="Único">`;
        }

        // Selector de Talla (Si aplica)
        if(tallasUnicas.length > 0) {
            htmlSelects += `
                <div class="col-6">
                    <label class="form-label fw-bold text-dark small mb-1"><i class="bi bi-rulers me-1"></i> Talla:</label>
                    <select id="selectTalla" class="form-select border-primary shadow-sm mb-2">
                        <option value="">Elegir...</option>
                        ${tallasUnicas.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>`;
        } else {
            htmlSelects += `<input type="hidden" id="selectTalla" value="Única">`;
        }

        htmlSelects += `</div><div id="stockSeleccionado" class="small text-muted fw-bold mt-1"></div>`;
        colorContainer.innerHTML = htmlSelects;

        // Configuraciones iniciales del botón de compra
        inputCantidad.disabled = true;
        btnComprar.disabled = true;
        btnComprar.innerHTML = "SELECCIONA TALLA Y COLOR";
        btnRestar.disabled = true;
        btnSumar.disabled = true;

        // Función que busca la combinación exacta seleccionada por el cliente
        const verificarCombinacion = () => {
            const colorSel = document.getElementById("selectColor").value;
            const tallaSel = document.getElementById("selectTalla").value;
            const infoStock = document.getElementById("stockSeleccionado");

            if (!colorSel || !tallaSel) {
                inputCantidad.disabled = true;
                btnComprar.disabled = true;
                btnComprar.innerHTML = "SELECCIONA TALLA Y COLOR";
                infoStock.innerText = "";
                return;
            }

            // Buscamos la variante que coincida con ambos atributos
            const varianteEncontrada = p.variaciones.find(v => v.color === colorSel && v.talla === tallaSel);

            if (varianteEncontrada && varianteEncontrada.stock > 0) {
                const stockDisponible = varianteEncontrada.stock;
                infoStock.innerHTML = `<span class="text-success"><i class="bi bi-check-circle-fill"></i> Stock disponible: ${stockDisponible} unidades</span>`;
                
                inputCantidad.disabled = false;
                btnComprar.disabled = false;
                inputCantidad.value = 1;

                // Controladores de cantidad para esta variante específica
                btnRestar.onclick = () => { let a = parseInt(inputCantidad.value)||1; if(a > 1){ inputCantidad.value = a-1; }};
                btnSumar.onclick = () => { let a = parseInt(inputCantidad.value)||1; if(a < stockDisponible){ inputCantidad.value = a+1; }};

                btnComprar.innerHTML = `<i class="bi bi-cart-plus me-2"></i> AGREGAR AL CARRITO`;
                btnComprar.onclick = () => {
                    if(getToken()) {
                        agregarAlCarrito(p.idProducto, parseInt(inputCantidad.value) || 1, varianteEncontrada.idVariacion); 
                        modalDetalle.hide();
                    } else { redirigirLogin(); }
                };
            } else {
                infoStock.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle-fill"></i> Esta combinación no tiene stock disponible</span>`;
                inputCantidad.disabled = true;
                btnComprar.disabled = true;
                btnComprar.innerHTML = "SIN STOCK";
            }
        };

        // Escuchadores de cambio en los selectores
        if(document.getElementById("selectColor")) document.getElementById("selectColor").addEventListener("change", verificarCombinacion);
        if(document.getElementById("selectTalla")) document.getElementById("selectTalla").addEventListener("change", verificarCombinacion);
    }
}

    modalDetalle.show();
}

async function agregarAlCarrito(idProducto, cantidad = 1, idVariacion = null) {
    try {
        let url = `${API_URL}/carrito/agregar?idProducto=${idProducto}&cantidad=${cantidad}`;
        if (idVariacion) url += `&idVariacion=${idVariacion}`;

        const res = await fetch(url, { 
            method: "POST", 
            headers: authHeaders() 
        });
        
        if (res.ok) {
            if(typeof actualizarBadge === 'function') actualizarBadge();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Agregado al carrito', showConfirmButton: false, timer: 2000 });
        } else { Swal.fire("Error", await res.text(), "error"); }
    } catch { Swal.fire("Error", "Error de conexión", "error"); }
}

function redirigirLogin() { window.location.href = "index.html"; }

function configurarMenuUsuario() {
    const rol = getUserRole();
    if (getToken() && rol !== "ROLE_ADMIN") document.getElementById("navMisPedidos")?.classList.remove("d-none");
    if (rol === "ROLE_ADMIN") {
        document.getElementById("itemAdmin")?.classList.remove("d-none");
        const iconoCarrito = document.querySelector('a[href="carrito.html"]');
        if(iconoCarrito) iconoCarrito.classList.add("d-none");
    }
    document.getElementById("btnSalir")?.addEventListener("click", () => { localStorage.clear(); window.location.href = "index.html"; });
}