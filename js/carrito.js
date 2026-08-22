// ==========================================
// PROTECCIÓN DE RUTA
// ==========================================
if (!getToken()) window.location.href = "index.html";
if (getUserRole() === "ROLE_ADMIN") window.location.href = "admin-dashboard.html";

// VARIABLES GLOBALES
const carritoContainer = document.getElementById("carrito-items") || document.getElementById("carritoBody");
let subtotalGlobal = 0;

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    if (getToken()) {
        if(typeof actualizarBadge === 'function') actualizarBadge();
        document.getElementById("navMisPedidos")?.classList.remove("d-none");
        
        document.getElementById("btnSalir")?.addEventListener("click", () => { 
            localStorage.clear(); 
            window.location.href = "index.html"; 
        });
    }
    cargarCarrito();
});

// ==========================================
// LÓGICA DE CARGA Y RENDERIZADO
// ==========================================
async function cargarCarrito() {
    try {
        const res = await fetch(`${API_URL}/carrito`, { headers: authHeaders() });
        const carrito = await res.json();
        mostrarCarrito(carrito.items || []);
    } catch {
        Swal.fire("Error", "No se pudo cargar el carrito", "error");
    }
}

function mostrarCarrito(items) {
    carritoContainer.innerHTML = "";
    subtotalGlobal = 0;

    if (!items || items.length === 0) {
        carritoContainer.innerHTML = `
            <div class="p-5 text-center">
                <i class="bi bi-cart-x display-1 text-muted mb-3 d-block"></i>
                <h4 class="text-muted">Tu carrito está vacío</h4>
                <p class="text-secondary mb-4">¡Agrega algunos productos para empezar!</p>
                <a href="catalogo.html" class="btn btn-primary px-4 rounded-pill">Ir al catálogo</a>
            </div>`;
            
        document.getElementById("resumen-subtotal").textContent = "$0.00";
        document.getElementById("resumen-total").textContent = "$0.00";
        document.querySelector("button[onclick='procesarPedido()']").disabled = true;
        return;
    }

    document.querySelector("button[onclick='procesarPedido()']").disabled = false;

    items.forEach((item, index) => {
        const descuentoPct = item.producto.descuento || 0;
        const precioOriginal = item.producto.precio;
        const precioFinal = precioOriginal - (precioOriginal * (descuentoPct / 100));
        
        const subtotal = precioFinal * item.cantidad;
        subtotalGlobal += subtotal;
        
        const img = (item.producto.imagenesUrls && item.producto.imagenesUrls.length > 0) 
            ? item.producto.imagenesUrls[0] 
            : 'https://via.placeholder.com/100?text=Sin+Foto';
            
        const borderBottom = index !== items.length - 1 ? 'border-bottom' : '';
        
        let badgesVariacion = '';
        if (item.variacion) {
            if (item.variacion.color && item.variacion.color !== "Único") {
                badgesVariacion += `<span class="badge bg-dark ms-2"><i class="bi bi-palette me-1"></i>${item.variacion.color}</span>`;
            }
            if (item.variacion.talla && item.variacion.talla !== "Única") {
                badgesVariacion += `<span class="badge bg-secondary ms-2"><i class="bi bi-rulers me-1"></i>${item.variacion.talla}</span>`;
            }
        }

        const badgeDescuento = descuentoPct > 0 ? `<span class="badge bg-danger rounded-pill ms-2">-${descuentoPct}%</span>` : '';
        const precioTachado = descuentoPct > 0 ? `<span class="text-muted text-decoration-line-through small me-2">$${precioOriginal.toFixed(2)}</span>` : '';

        carritoContainer.innerHTML += `
            <div class="d-flex flex-column flex-md-row align-items-center py-4 ${borderBottom}">
                <img src="${img}" class="rounded-3 object-fit-contain bg-light me-md-4 mb-3 mb-md-0 border shadow-sm" style="width: 100px; height: 100px; padding: 5px;">
                
                <div class="flex-grow-1 text-center text-md-start mb-3 mb-md-0">
                    <h6 class="fw-bold mb-1 fs-5">${item.producto.nombre}</h6>
                    <div>
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle">${item.producto.categoria ? item.producto.categoria.nombre : 'General'}</span>
                        ${badgesVariacion}
                        ${badgeDescuento}
                    </div>
                    <div class="mt-2">
                        ${precioTachado}
                        <span class="text-primary fw-bold">$${precioFinal.toFixed(2)} c/u</span>
                    </div>
                </div>
                
                <div class="d-flex align-items-center me-md-4 mb-3 mb-md-0">
                    <div class="input-group input-group-sm border rounded-pill overflow-hidden shadow-sm" style="width: 120px;">
                        <button class="btn btn-light border-0 text-primary fw-bold px-3" onclick="disminuir(${item.producto.idProducto})"><i class="bi bi-dash"></i></button>
                        <input type="text" class="form-control border-0 text-center bg-white fw-bold" value="${item.cantidad}" readonly>
                        <button class="btn btn-light border-0 text-primary fw-bold px-3" onclick="aumentar(${item.producto.idProducto})"><i class="bi bi-plus"></i></button>
                    </div>
                </div>
                
                <div class="text-center text-md-end" style="min-width: 100px;">
                    <div class="fw-bold fs-5 mb-2 text-dark">$${subtotal.toFixed(2)}</div>
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-3 shadow-sm" onclick="eliminarDelCarrito(${item.producto.idProducto})">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            </div>
        `;
    });

    document.getElementById("resumen-subtotal").textContent = `$${subtotalGlobal.toFixed(2)}`;
    actualizarInterfazEntrega(); 
}

// ==========================================
// LÓGICA DE ENTREGA Y TOTALES
// ==========================================
function actualizarInterfazEntrega() {
    const radioSeleccionado = document.querySelector('input[name="metodoEntrega"]:checked');
    if (!radioSeleccionado) return;
    
    const metodo = radioSeleccionado.value;
    const seccionDireccion = document.getElementById("seccionDireccion");
    const seccionRetiro = document.getElementById("seccionRetiro");
    const labelEnvio = document.getElementById("resumen-envio");

    if (metodo === "ENVIO") {
        seccionDireccion?.classList.remove("d-none");
        seccionRetiro?.classList.add("d-none");
        if(labelEnvio) {
            labelEnvio.textContent = "+$5.00";
            labelEnvio.classList.add("text-primary");
        }
    } else {
        seccionDireccion?.classList.add("d-none");
        seccionRetiro?.classList.remove("d-none");
        if(labelEnvio) {
            labelEnvio.textContent = "$0.00";
            labelEnvio.classList.remove("text-primary");
        }
    }
    
    recalcularTotales();
}

function recalcularTotales() {
    const metodo = document.querySelector('input[name="metodoEntrega"]:checked')?.value;
    const costoEnvio = (metodo === "ENVIO") ? 5.00 : 0.00;
    
    const totalFinal = subtotalGlobal + costoEnvio;
    const totalSpan = document.getElementById("resumen-total");
    
    if(totalSpan) {
        totalSpan.textContent = `$${totalFinal.toFixed(2)}`;
    }
}

// ==========================================
// LÓGICA DE PROCESAR PEDIDO FINAL
// ==========================================
async function procesarPedido() {
    const metodo = document.querySelector('input[name="metodoEntrega"]:checked').value;
    const direccion = document.getElementById("direccionEnvio")?.value.trim();

    if (metodo === "ENVIO" && direccion === "") {
        return Swal.fire("Falta información", "Por favor, ingresa tu dirección completa para el envío.", "warning");
    }

    const confirmacion = await Swal.fire({
        title: '¿Confirmar pedido?',
        text: "Generaremos tu orden y el pago se hará contra entrega.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, crear pedido',
        cancelButtonText: 'Revisar carrito'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const costoEnvio = (metodo === "ENVIO") ? 5.00 : 0.00;

        const headers = authHeaders();
        headers["Content-Type"] = "application/json";

        const res = await fetch(`${API_URL}/pedidos/crear`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                metodoEntrega: metodo,
                direccion: direccion || "Retiro en tienda",
                costoEnvio: costoEnvio
            })
        });

        if (!res.ok) throw new Error();
        const pedido = await res.json();
        
        const totalRealAPagar = pedido.total;
        if(typeof actualizarBadge === 'function') actualizarBadge();

        Swal.fire({
            title: `¡Pedido Realizado!`,
            text: `Tu orden ha sido procesada con éxito por un total de $${totalRealAPagar.toFixed(2)}.`,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-whatsapp"></i> Coordinar por WhatsApp',
            cancelButtonText: 'Ver mis compras',
            confirmButtonColor: '#25D366', 
            cancelButtonColor: '#0dcaf0'
        }).then((result) => {
            if (result.isConfirmed) {
                const miNumero = "50371584643"; 
                
                let mensaje = "";
                const totalFormateado = totalRealAPagar.toFixed(2);

                if (metodo === "ENVIO") {
                    mensaje = `¡Hola! Acabo de realizar una compra por un total de $${totalFormateado}. ¿Me podrían brindar la información para realizar el pago y coordinar el envío?`;
                } else {
                    mensaje = `¡Hola! Acabo de realizar una compra por un total de $${totalFormateado}.\n\nPasaré a retirarlo personalmente a la tienda en El Tunco.\n\n¿Me confirman de recibido?`;
                }
                
                window.open(`https://wa.me/${miNumero}?text=${encodeURIComponent(mensaje)}`, '_blank');
                window.location.href = "mis-pedidos.html";
            } else {
                window.location.href = "mis-pedidos.html";
            }
        });

    } catch (error) {
        Swal.fire("Error", "No se pudo crear el pedido. Intenta nuevamente.", "error");
    }
}

// ==========================================
// CONTROLADORES DE CANTIDADES
// ==========================================
async function eliminarDelCarrito(idProducto) {
    Swal.fire({
        title: '¿Quitar producto?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, quitar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}/carrito/eliminar/${idProducto}`, { method: "DELETE", headers: authHeaders() });
                if (res.ok) { cargarCarrito(); if(typeof actualizarBadge === 'function') actualizarBadge(); }
            } catch { Swal.fire("Error", "Fallo al quitar el producto", "error"); }
        }
    });
}

async function aumentar(idProducto) {
    try {
        const res = await fetch(`${API_URL}/carrito/aumentar/${idProducto}`, { method: "PUT", headers: authHeaders() });
        if (res.ok) { cargarCarrito(); if(typeof actualizarBadge === 'function') actualizarBadge(); }
    } catch { console.error("Error al aumentar"); }
}

async function disminuir(idProducto) {
    try {
        const res = await fetch(`${API_URL}/carrito/disminuir/${idProducto}`, { method: "PUT", headers: authHeaders() });
        if (res.ok) { cargarCarrito(); if(typeof actualizarBadge === 'function') actualizarBadge(); }
    } catch { console.error("Error al disminuir"); }
}