// ==========================================
// js/productos.js - Inicio Optimizado
// ==========================================
const container = document.getElementById("productosContainer");
let todosLosProductos = []; // Guardaremos la muestra para el Modal
let modalDetalle;

document.addEventListener("DOMContentLoaded", async () => {
    modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalleProducto'));
    
    // 👇 Cargamos la muestra óptima de 20 productos
    await cargarProductosDestacados();

    if (getToken()) {
        if(typeof actualizarBadge === 'function') actualizarBadge();
        configurarMenuUsuario();
    }
});

function redirigirAlCatalogo() {
    const texto = document.getElementById("searchInputInicio").value.trim();
    if (texto !== "") {
        window.location.href = `catalogo.html?buscar=${encodeURIComponent(texto)}`;
    } else {
        window.location.href = "catalogo.html";
    }
}

async function cargarProductosDestacados() {
    try {
        const res = await fetch(`${API_URL}/producto?page=0&size=20`);
        if (!res.ok) throw new Error();
        
        const data = await res.json();
        const listaBruta = data.content || data; 
        
        // 🔀 Mezclamos los 20 y nos quedamos con 8 para mostrar
        todosLosProductos = listaBruta.sort(() => 0.5 - Math.random()).slice(0, 8);
        
        mostrarProductos(todosLosProductos);
    } catch {
        console.error("Error cargando destacados");
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted">No se pudieron cargar los productos en este momento.</div>`;
    }
}

function mostrarProductos(productos) {
    container.innerHTML = "";
    const rol = typeof getUserRole === 'function' ? getUserRole() : null; 

    productos.forEach(p => {
        const img = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : 'https://via.placeholder.com/300x250?text=Sin+Imagen';
        
        const tieneDescuento = p.descuento && p.descuento > 0;
        let precioFinal = p.precio;
        let precioOriginalHTML = '';
        let badgeDescuentoHTML = '';

        if (tieneDescuento) {
            precioFinal = p.precio - (p.precio * (p.descuento / 100));
            precioOriginalHTML = `<span class="text-muted text-decoration-line-through small me-2">$${p.precio.toFixed(2)}</span>`;
            badgeDescuentoHTML = `<span class="badge bg-danger ms-1">-${p.descuento}%</span>`;
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

        container.innerHTML += `
            <div class="col-md-4 col-lg-3 mb-4 product-card-container">
                ${ribbonHTML}
                <div class="product-card card h-100 border-0 shadow-sm ${sinStock ? 'opacity-75' : ''}" style="cursor: pointer;" onclick="abrirDetalle(${p.idProducto})">
                    <div class="card-img-container bg-light position-relative">
                        <img src="${img}" class="card-img-top object-fit-contain p-3" style="height: 220px;">
                        <span class="position-absolute top-0 start-0 badge bg-white text-dark shadow-sm m-2 border z-1">${p.categoria ? p.categoria.nombre : 'General'}</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title fw-bold text-dark mb-1 text-truncate">${p.nombre}</h6>
                        <div class="mb-3">
                            ${precioOriginalHTML}
                            <span class="text-primary fw-bold fs-5">$${precioFinal.toFixed(2)}</span>
                            ${badgeDescuentoHTML}
                        </div>
                        <div class="mt-auto">
                            ${generarBotonAccion(p, sinStock, rol)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function generarBotonAccion(p, sinStock, rol) {
    if (rol === "ROLE_ADMIN") {
        return `<button class="btn btn-secondary btn-sm rounded-pill fw-semibold w-100" disabled><i class="bi bi-shield-lock me-1"></i> Admin</button>`;
    }
    
    const texto = sinStock ? '<i class="bi bi-x-circle me-1"></i> Sin Stock' : '<i class="bi bi-cart-plus me-1"></i> Añadir al carrito';
    const clase = sinStock ? 'btn-secondary' : 'btn-primary';
    
    return `<button class="btn ${clase} btn-sm rounded-pill fw-semibold w-100" ${sinStock ? 'disabled' : ''} onclick="event.stopPropagation(); agregarAlCarritoRapido(${p.idProducto})">
                ${texto}
            </button>`;
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

    if (p.variaciones.length === 1 && p.variaciones[0].color === "Único" && p.variaciones[0].talla === "Única") {
        if (p.variaciones[0].stock > 0) {
            agregarAlCarrito(p.idProducto, 1, p.variaciones[0].idVariacion);
        } else {
            Swal.fire("Agotado", "Este producto ya no tiene stock disponible.", "warning");
        }
    } 
    else {
        Swal.fire({ 
            toast: true, position: 'top-end', icon: 'info', 
            title: 'Por favor, selecciona una opción', 
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
    document.getElementById("modalDescripcion").textContent = p.descripcion || 'Sin descripción adicional disponible.';

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

    if (p.variaciones && p.variaciones.length > 0) {
        if (p.variaciones.length === 1 && p.variaciones[0].color === "Único" && p.variaciones[0].talla === "Única") {
            const stockUnico = p.variaciones[0].stock;
            if (stockUnico > 0) {
                colorContainer.innerHTML = `<input type="hidden" id="selectVariacion" value="${p.variaciones[0].idVariacion}">
                                            <div class="small text-success fw-bold mb-2"><i class="bi bi-check-circle-fill"></i> Stock disponible: ${stockUnico} unidades</div>`;
                inputCantidad.disabled = false;
                btnComprar.disabled = false;
                btnComprar.innerHTML = `<i class="bi bi-cart-plus me-2"></i> AGREGAR AL CARRITO`;
                
                btnRestar.onclick = () => { let a = parseInt(inputCantidad.value)||1; if(a > 1){ inputCantidad.value = a-1; }};
                btnSumar.onclick = () => { let a = parseInt(inputCantidad.value)||1; if(a < stockUnico){ inputCantidad.value = a+1; }};
                
                btnComprar.onclick = () => {
                    if(getToken()) {
                        const rol = typeof getUserRole === 'function' ? getUserRole() : null;
                        if (rol === "ROLE_ADMIN") return Swal.fire("Atención", "Los admins no pueden comprar.", "warning");
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
        else {
            const coloresUnicos = [...new Set(p.variaciones.map(v => v.color))].filter(c => c !== "Único");
            const tallasUnicas = [...new Set(p.variaciones.map(v => v.talla))].filter(t => t !== "Única");

            const colorColClass = tallasUnicas.length > 0 ? "col-6" : "col-12";
            const tallaColClass = coloresUnicos.length > 0 ? "col-6" : "col-12";

            let htmlSelects = `<div class="row g-2">`;
            
            if(coloresUnicos.length > 0) {
                htmlSelects += `
                    <div class="${colorColClass}">
                        <label class="form-label fw-bold text-dark small mb-1"><i class="bi bi-palette me-1"></i> Color:</label>
                        <select id="selectColor" class="form-select border-primary shadow-sm mb-2">
                            <option value="">Elegir color...</option>
                            ${coloresUnicos.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>`;
            } else {
                htmlSelects += `<input type="hidden" id="selectColor" value="Único">`;
            }

            if(tallasUnicas.length > 0) {
                const disabled = coloresUnicos.length > 0 ? "disabled" : "";
                const textoOpcion = coloresUnicos.length > 0 ? "Primero elige color" : "Elegir talla...";
                
                htmlSelects += `
                    <div class="${tallaColClass}">
                        <label class="form-label fw-bold text-dark small mb-1"><i class="bi bi-rulers me-1"></i> Talla:</label>
                        <select id="selectTalla" class="form-select border-primary shadow-sm mb-2" ${disabled}>
                            <option value="">${textoOpcion}</option>
                            ${coloresUnicos.length === 0 ? tallasUnicas.map(t => `<option value="${t}">${t}</option>`).join('') : ''}
                        </select>
                    </div>`;
            } else {
                htmlSelects += `<input type="hidden" id="selectTalla" value="Única">`;
            }

            htmlSelects += `</div><div id="stockSeleccionado" class="small text-muted fw-bold mt-1"></div>`;
            colorContainer.innerHTML = htmlSelects;

            inputCantidad.disabled = true;
            btnComprar.disabled = true;
            btnComprar.innerHTML = "SELECCIONA OPCIONES";
            btnRestar.disabled = true;
            btnSumar.disabled = true;

            const verificarCombinacion = () => {
                const colorSel = document.getElementById("selectColor").value;
                const tallaSel = document.getElementById("selectTalla").value;
                const infoStock = document.getElementById("stockSeleccionado");

                if (!colorSel || !tallaSel) {
                    inputCantidad.disabled = true;
                    btnComprar.disabled = true;
                    btnComprar.innerHTML = "SELECCIONA OPCIONES";
                    infoStock.innerText = "";
                    return;
                }

                const varianteEncontrada = p.variaciones.find(v => v.color === colorSel && v.talla === tallaSel);

                if (varianteEncontrada && varianteEncontrada.stock > 0) {
                    const stockDisponible = varianteEncontrada.stock;
                    infoStock.innerHTML = `<span class="text-success"><i class="bi bi-check-circle-fill"></i> Stock disponible: ${stockDisponible} unidades</span>`;
                    
                    inputCantidad.disabled = false;
                    btnComprar.disabled = false;
                    inputCantidad.value = 1;

                    btnRestar.onclick = () => { let a = parseInt(inputCantidad.value)||1; if(a > 1){ inputCantidad.value = a-1; }};
                    btnSumar.onclick = () => { let a = parseInt(inputCantidad.value)||1; if(a < stockDisponible){ inputCantidad.value = a+1; }};

                    btnComprar.innerHTML = `<i class="bi bi-cart-plus me-2"></i> AGREGAR AL CARRITO`;
                    btnComprar.onclick = () => {
                        if(getToken()) {
                            const rol = typeof getUserRole === 'function' ? getUserRole() : null;
                            if (rol === "ROLE_ADMIN") return Swal.fire("Atención", "Los admins no pueden comprar.", "warning");
                            agregarAlCarrito(p.idProducto, parseInt(inputCantidad.value) || 1, varianteEncontrada.idVariacion); 
                            modalDetalle.hide();
                        } else { redirigirLogin(); }
                    };
                } else {
                    infoStock.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle-fill"></i> Esta combinación está agotada</span>`;
                    inputCantidad.disabled = true;
                    btnComprar.disabled = true;
                    btnComprar.innerHTML = "SIN STOCK";
                }
            };

            const selectColorObj = document.getElementById("selectColor");
            const selectTallaObj = document.getElementById("selectTalla");

            if (selectColorObj && selectColorObj.type !== "hidden" && selectTallaObj && selectTallaObj.type !== "hidden") {
                selectColorObj.addEventListener("change", (e) => {
                    const colorElegido = e.target.value;
                    selectTallaObj.innerHTML = '<option value="">Elegir talla...</option>';
                    
                    if (colorElegido) {
                        const tallasParaEsteColor = p.variaciones
                            .filter(v => v.color === colorElegido)
                            .map(v => v.talla);
                            
                        const tallasDisponibles = [...new Set(tallasParaEsteColor)].filter(t => t !== "Única");
                        
                        if(tallasDisponibles.length > 0) {
                            tallasDisponibles.forEach(t => {
                                selectTallaObj.innerHTML += `<option value="${t}">${t}</option>`;
                            });
                            selectTallaObj.disabled = false;
                        } else {
                            // MAGIA APLICADA: Si no hay tallas para este color, asignamos "Única" por defecto
                            selectTallaObj.innerHTML = '<option value="Única">Talla Única</option>';
                            selectTallaObj.disabled = true;
                        }
                    } else {
                        selectTallaObj.innerHTML = '<option value="">Primero elige color</option>';
                        selectTallaObj.disabled = true;
                    }
                    verificarCombinacion();
                });
                
                selectTallaObj.addEventListener("change", verificarCombinacion);
            } 
            else {
                if(selectColorObj) selectColorObj.addEventListener("change", verificarCombinacion);
                if(selectTallaObj) selectTallaObj.addEventListener("change", verificarCombinacion);
            }
        }
    } else {
        colorContainer.innerHTML = `<div class="alert alert-warning py-2 mb-0 small"><i class="bi bi-exclamation-triangle me-1"></i> Producto sin stock configurado.</div>`;
        inputCantidad.disabled = true;
        btnComprar.disabled = true;
        btnComprar.innerHTML = "SIN STOCK";
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