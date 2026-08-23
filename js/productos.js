// ==========================================
// js/productos.js - Inicio Optimizado
// ==========================================
const container = document.getElementById("productosContainer");
let todosLosProductos = [];
let modalDetalle;
let productoActualParaApartar = null; // Para la función de apartar

document.addEventListener("DOMContentLoaded", async () => {
    modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalleProducto'));
    
    await cargarProductosDestacados();
    await cargarNovedades();

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
            <div class="col-9 col-md-4 col-lg-3 mb-4 product-card-container">
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

// 👇 Tarjeta final minimalista (Solo icono y texto) 👇
    container.innerHTML += `
        <div class="col-5 col-md-3 mb-4 d-flex justify-content-center align-items-center">
            <a href="catalogo.html" class="text-decoration-none text-center d-flex flex-column align-items-center justify-content-center w-100" style="opacity: 0.85; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.85'">
                <div class="bg-white rounded-circle shadow-sm mb-2 text-primary d-flex align-items-center justify-content-center border" style="width: 60px; height: 60px;">
                    <i class="bi bi-arrow-right fs-3"></i>
                </div>
                <span class="fw-bold text-primary small lh-sm">Ver todo el<br>Catálogo</span>
            </a>
        </div>
    `;
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

    // Guardar producto para la función de apartar
    productoActualParaApartar = p;

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
                        <label class="form-label fw-bold text-dark small mb-1"><i class="bi bi-journal-bookmark-fill me-1"></i> Formato:</label>
                        <select id="selectColor" class="form-select border-primary shadow-sm mb-2">
                            <option value="">Elegir formato (Ej. Tapa Dura)...</option>
                            ${coloresUnicos.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>`;
            } else {
                htmlSelects += `<input type="hidden" id="selectColor" value="Único">`;
            }

            if(tallasUnicas.length > 0) {
                const disabled = coloresUnicos.length > 0 ? "disabled" : "";
                const textoOpcion = coloresUnicos.length > 0 ? "Primero elige formato" : "Elegir edición...";
                
                htmlSelects += `
                    <div class="${tallaColClass}">
                        <label class="form-label fw-bold text-dark small mb-1"><i class="bi bi-globe me-1"></i> Edición/Idioma:</label>
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

    // Mostrar/ocultar botón "Apartar"
    const btnApartar = document.getElementById("modalBtnApartar");
    if (btnApartar) {
        const rol = getUserRole();
        if (rol !== "ROLE_ADMIN" && token) {
            let stockTotal = 0;
            if (p.variaciones && p.variaciones.length > 0) {
                stockTotal = p.variaciones.reduce((acc, v) => acc + v.stock, 0);
            }
            if (stockTotal > 0) {
                btnApartar.style.display = 'block';
            } else {
                btnApartar.style.display = 'none';
            }
        } else {
            btnApartar.style.display = 'none';
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

// ==========================================
// APARTAR PRODUCTO DESDE EL MODAL
// ==========================================
async function apartarProductoDesdeModal() {
    const p = productoActualParaApartar;
    if (!p) {
        Swal.fire("Error", "No se ha seleccionado ningún producto.", "error");
        return;
    }

    let idVariacion = null;
    const selectVariacion = document.getElementById("selectVariacion");
    const selectColor = document.getElementById("selectColor");
    const selectTalla = document.getElementById("selectTalla");

    if (selectVariacion) {
        idVariacion = parseInt(selectVariacion.value);
    } else if (selectColor && selectTalla) {
        const color = selectColor.value;
        const talla = selectTalla.value;
        if (!color || !talla) {
            return Swal.fire("Selecciona opciones", "Elige color y talla antes de apartar.", "warning");
        }
        const variante = p.variaciones.find(v => v.color === color && v.talla === talla);
        if (!variante || variante.stock <= 0) {
            return Swal.fire("Sin stock", "Esa combinación no está disponible.", "warning");
        }
        idVariacion = variante.idVariacion;
    } else {
        if (p.variaciones && p.variaciones.length > 0) {
            idVariacion = p.variaciones[0].idVariacion;
        } else {
            return Swal.fire("Error", "Este producto no tiene stock configurado.", "error");
        }
    }

    const cantidad = parseInt(document.getElementById("modalCantidad").value) || 1;

    const { value: montoInicial } = await Swal.fire({
        title: `Apartar ${p.nombre}`,
        text: `Precio total: $${(p.precio * cantidad).toFixed(2)}. Ingresa el abono inicial (mínimo $1.00).`,
        input: 'number',
        inputLabel: 'Abono inicial ($)',
        inputPlaceholder: '1.00',
        inputValue: (p.precio * cantidad * 0.3).toFixed(2),
        showCancelButton: true,
        confirmButtonText: 'Apartar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            const num = parseFloat(value);
            if (!value || isNaN(num) || num < 1) return 'El abono debe ser al menos $1.00';
            if (num > p.precio * cantidad) return 'El abono no puede ser mayor al precio total';
            return null;
        }
    });

    if (!montoInicial) return;

    const { value: metodoPago } = await Swal.fire({
        title: 'Método de pago para el abono',
        input: 'select',
        inputOptions: {
            'EFECTIVO': '💵 Efectivo',
            'TARJETA': '💳 Tarjeta',
            'TRANSFERENCIA': '🏦 Transferencia'
        },
        inputPlaceholder: 'Selecciona...',
        showCancelButton: true,
        confirmButtonText: 'Confirmar'
    });

    if (!metodoPago) return;

    const payload = {
        idProducto: p.idProducto,
        idVariacion: idVariacion,
        cantidad: cantidad,
        montoInicial: parseFloat(montoInicial),
        metodoPagoInicial: metodoPago
    };

    Swal.fire({ title: 'Procesando apartado...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const res = await fetch(`${API_URL}/apartados/crear`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            Swal.fire({
                title: '✅ ¡Producto Apartado!',
                html: `
                    <p><strong>${data.nombreProducto}</strong> x ${data.cantidad}</p>
                    <p>Abono inicial: $${data.montoPagado.toFixed(2)}</p>
                    <p>Saldo pendiente: $${data.saldoPendiente.toFixed(2)}</p>
                    <p>Estado: <span class="badge bg-warning">${data.estado}</span></p>
                    <p class="text-muted small">Puedes ver tus apartados en <a href="mis-apartados.html">Mis Apartados</a>.</p>
                `,
                icon: 'success',
                confirmButtonText: 'Ir a Mis Apartados',
                cancelButtonText: 'Seguir comprando',
                showCancelButton: true
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'mis-apartados.html';
                } else {
                    modalDetalle.hide();
                }
            });
        } else {
            const error = await res.text();
            Swal.fire('Error', error || 'No se pudo apartar el producto.', 'error');
        }
    } catch (e) {
        Swal.fire('Error', 'Problemas de conexión.', 'error');
    }
}

function redirigirLogin() { window.location.href = "index.html"; }

function configurarMenuUsuario() {
    const rol = getUserRole();
    const token = getToken();
    
    if (token && rol !== "ROLE_ADMIN") {
        document.getElementById("navMisPedidos")?.classList.remove("d-none");
        document.getElementById("navMisListas")?.classList.remove("d-none");
        document.getElementById("navMisApartados")?.classList.remove("d-none");
    }
    
    if (rol === "ROLE_ADMIN") {
        document.getElementById("itemAdmin")?.classList.remove("d-none");
        const iconoCarrito = document.querySelector('a[href="carrito.html"]');
        if(iconoCarrito) iconoCarrito.classList.add("d-none");
    }
    
    document.getElementById("btnSalir")?.addEventListener("click", () => { 
        localStorage.clear(); 
        window.location.href = "index.html"; 
    });
}

// ==========================================
// CARGAR RECIÉN LLEGADOS / NOVEDADES
// ==========================================
async function cargarNovedades() {
    const contenedorNovedades = document.getElementById('novedadesContainer');
    
    // Si no estamos en la página de inicio (donde está el contenedor), no hacemos nada
    if (!contenedorNovedades) return;

    try {
        // 1. Hacemos la petición real a tu API (traemos los productos)
        const res = await fetch(`${API_URL}/producto?page=0&size=50`);
        if (!res.ok) throw new Error("Error en red");
        
        const data = await res.json();
        const listaBruta = data.content || data; 
        
        // 2. Simulamos "Recién llegados" tomando los últimos 2 de la lista
        const ultimosProductos = listaBruta.slice(-2).reverse();

        // 3. Limpiamos el mensaje de "Cargando..."
        contenedorNovedades.innerHTML = '';

        // 4. Recorremos y creamos las tarjetas dinámicas con tus variables reales
        ultimosProductos.forEach(p => {
            
            // Reutilizamos tu lógica de validación de imágenes
            const img = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : 'https://via.placeholder.com/80?text=Sin+Imagen';
            
            // Usamos abrirDetalle(p.idProducto) que es tu función real para el modal
            const cardHTML = `
            <div class="col-12 col-md-6">
                <div class="card h-100 border-0 bg-light rounded-4 p-3 d-flex flex-row align-items-center shadow-sm hover-zoom cursor-pointer" onclick="abrirDetalle(${p.idProducto})">
                    
                    <div class="bg-white rounded-3 p-2 shadow-sm me-3 d-flex justify-content-center align-items-center" style="width: 80px; height: 80px; overflow: hidden;">
                        <img src="${img}" alt="${p.nombre}" class="img-fluid" style="max-height: 100%; object-fit: contain;">
                    </div>
                    
                    <div class="overflow-hidden">
                        <span class="badge bg-danger bg-opacity-10 text-danger mb-1 rounded-pill">Nuevo</span>
                        <h6 class="fw-bold mb-1 text-dark text-truncate">${p.nombre}</h6>
                        <p class="text-primary fw-bold m-0">$${p.precio.toFixed(2)}</p>
                    </div>
                    
                </div>
            </div>
            `;
            
            contenedorNovedades.innerHTML += cardHTML;
            
            // NOTA: Para que el modal funcione al 100%, necesitamos asegurarnos 
            // de que el producto exista en 'todosLosProductos'. Lo agregamos si no está:
            if (!todosLosProductos.find(prod => prod.idProducto === p.idProducto)) {
                todosLosProductos.push(p);
            }
        });

    } catch (error) {
        console.error("Error al cargar las novedades:", error);
        contenedorNovedades.innerHTML = `
            <div class="col-12 text-center text-muted py-3">
                <p class="mb-0">No se pudieron cargar las novedades en este momento.</p>
            </div>
        `;
    }
}

// ==========================================
// LÓGICA DEL CARRUSEL DE PRODUCTOS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const containerScroll = document.getElementById("productosContainer");
    const btnPrev = document.getElementById("btnPrevDestacados");
    const btnNext = document.getElementById("btnNextDestacados");

    if (btnPrev && btnNext && containerScroll) {
        // Al dar clic en Siguiente
        btnNext.addEventListener("click", () => {
            // Se desplaza el 80% del ancho visible para mostrar las siguientes tarjetas
            const scrollAmount = containerScroll.clientWidth * 0.8;
            containerScroll.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        // Al dar clic en Anterior
        btnPrev.addEventListener("click", () => {
            const scrollAmount = containerScroll.clientWidth * 0.8;
            containerScroll.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
    }
});