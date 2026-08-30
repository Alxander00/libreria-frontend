// ==========================================
// js/pos.js - Punto de Venta
// ==========================================
if (!getToken()) window.location.href = "index.html";
if (getUserRole() !== "ROLE_ADMIN") window.location.href = "productos.html";

let todosLosProductosPos = [];
let carritoPos = []; // Array local { idProducto, idVariacion, nombre, precio, cantidad, stock, imagen, variacionNombre }
let listaPedidosWebCache = [];
let idPedidoWebActual = null; // Almacena el ID si se cargó un pedido de la web

// Cargar datos iniciales
document.addEventListener("DOMContentLoaded", () => {
    // Mostrar nombre del cajero
    const nombre = localStorage.getItem("nombre") || "Admin";
    document.getElementById("cajeroNombre").innerHTML = `<i class="bi bi-person-circle me-1"></i> ${nombre}`;
    
    cargarProductosPos();
    actualizarBadgePedidosWeb();
    
    // Actualizar el contador del globo automáticamente cada 30 segundos
    setInterval(actualizarBadgePedidosWeb, 30000);
});

async function cargarProductosPos() {
    const texto = document.getElementById("searchInputPos").value.trim();
    const grid = document.getElementById("productosGrid");
    grid.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    try {
        let url = `${API_URL}/producto?size=1000&activo=true`;
        if (texto) url += `&search=${encodeURIComponent(texto)}`;
        
        const res = await fetch(url, { headers: authHeaders() });
        const data = await res.json();
        todosLosProductosPos = data.content || data;
        renderizarProductos(todosLosProductosPos);
    } catch (error) {
        grid.innerHTML = `<div class="text-center py-5 text-danger">Error al cargar productos</div>`;
    }
}

function renderizarProductos(productos) {
    const grid = document.getElementById("productosGrid");
    grid.innerHTML = "";

    if (productos.length === 0) {
        grid.innerHTML = `<div class="text-center py-5 text-muted">No se encontraron productos</div>`;
        return;
    }

    productos.forEach(p => {
        const img = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : '';
        
        let stockTotal = 0;
        let tieneVariaciones = false;
        if (p.variaciones && p.variaciones.length > 0) {
            stockTotal = p.variaciones.reduce((acc, v) => acc + v.stock, 0);
            tieneVariaciones = p.variaciones.length > 1 || 
                (p.variaciones.length === 1 && p.variaciones[0].color !== "Único");
        }

        let badgeDesc = '';
        let precioMostrar = p.precio;
        if (p.descuento > 0) {
            precioMostrar = p.precio - (p.precio * (p.descuento / 100));
            badgeDesc = `<span class="badge bg-danger position-absolute top-0 start-0 m-2">-${p.descuento}%</span>`;
        }

        const sinStock = stockTotal === 0;

        grid.innerHTML += `
            <div class="product-card-pos position-relative ${sinStock ? 'opacity-50' : ''}" 
                 onclick="${sinStock ? '' : `agregarAlCarritoPos(${p.idProducto})`}"
                 title="${sinStock ? 'Sin stock' : 'Click para agregar'}">
                ${badgeDesc}
                <img src="${img}" class="rounded-3 bg-light p-2 mb-2" loading="lazy" onerror="this.style.display='none'">
                <h6 class="fw-bold mb-0 text-truncate small">${p.nombre}</h6>
                <span class="fw-bold text-primary">$${precioMostrar.toFixed(2)}</span>
                ${tieneVariaciones ? '<i class="bi bi-palette text-secondary ms-1" title="Tiene colores/tallas"></i>' : ''}
                ${sinStock ? '<div class="badge bg-secondary mt-1 d-block">Agotado</div>' : ''}
            </div>
        `;
    });
}

// ==========================================
// LÓGICA DEL CARRITO LOCAL
// ==========================================

function agregarAlCarritoPos(idProducto) {
    const producto = todosLosProductosPos.find(p => p.idProducto === idProducto);
    if (!producto) return;

    if (producto.variaciones && producto.variaciones.length > 0) {
        const variacionesConStock = producto.variaciones.filter(v => v.stock > 0);
        if (variacionesConStock.length === 0) {
            return Swal.fire("Sin stock", "No hay unidades disponibles de este producto.", "warning");
        }

        if (variacionesConStock.length === 1) {
            agregarItemCarrito(producto, variacionesConStock[0]);
        } else {
            Swal.fire({
                title: `Selecciona variación para ${producto.nombre}`,
                input: 'select',
                inputOptions: variacionesConStock.reduce((acc, v, idx) => {
                    let label = v.color !== "Único" ? v.color : '';
                    if (v.talla !== "Única") label += (label ? ' - ' : '') + v.talla;
                    if (!label) label = 'Único';
                    acc[idx] = `${label} (Stock: ${v.stock})`;
                    return acc;
                }, {}),
                showCancelButton: true,
                confirmButtonText: 'Agregar',
                cancelButtonText: 'Cancelar'
            }).then(result => {
                if (result.isConfirmed && result.value !== undefined) {
                    const idx = parseInt(result.value);
                    agregarItemCarrito(producto, variacionesConStock[idx]);
                }
            });
        }
    } else {
        Swal.fire("Error", "Este producto no tiene stock configurado.", "error");
    }
}

function agregarItemCarrito(producto, variacion) {
    const existente = carritoPos.find(item => 
        item.idProducto === producto.idProducto && 
        item.idVariacion === variacion.idVariacion
    );

    if (existente) {
        if (existente.cantidad + 1 > variacion.stock) {
            return Swal.fire("Límite alcanzado", `Solo hay ${variacion.stock} unidades disponibles.`, "warning");
        }
        existente.cantidad += 1;
    } else {
        if (variacion.stock <= 0) {
            return Swal.fire("Sin stock", "No hay unidades disponibles.", "warning");
        }
        carritoPos.push({
            idProducto: producto.idProducto,
            idVariacion: variacion.idVariacion,
            nombre: producto.nombre,
            precio: producto.precio - (producto.precio * (producto.descuento / 100)),
            cantidad: 1,
            stock: variacion.stock,
            imagen: (producto.imagenesUrls && producto.imagenesUrls.length > 0) ? producto.imagenesUrls[0] : '',
            variacionNombre: variacion.color !== "Único" ? variacion.color : (variacion.talla !== "Única" ? variacion.talla : '')
        });
    }

    renderizarCarritoPos();
}

function renderizarCarritoPos() {
    const container = document.getElementById("carritoPosItems");
    const totalSpan = document.getElementById("totalPos");
    const contador = document.getElementById("contadorItems");

    if (carritoPos.length === 0) {
        container.innerHTML = `<div class="text-muted text-center py-4">Carrito vacío</div>`;
        totalSpan.textContent = "$0.00";
        contador.textContent = "0";
        return;
    }

    let html = "";
    let total = 0;

    carritoPos.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        const imgSrc = item.imagen || '';

        html += `
            <div class="cart-item">
                <img src="${imgSrc}" class="border" onerror="this.style.display='none'">
                <div class="flex-grow-1">
                    <div class="fw-bold small text-truncate">${item.nombre}</div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-light text-dark border">${item.variacionNombre || 'Único'}</span>
                        <span class="text-muted small">$${item.precio.toFixed(2)}</span>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-outline-secondary rounded-circle p-0" style="width: 24px; height: 24px;" onclick="cambiarCantidadPos(${index}, -1)">-</button>
                    <span class="fw-bold mx-1" style="min-width: 20px; text-align: center;">${item.cantidad}</span>
                    <button class="btn btn-sm btn-outline-secondary rounded-circle p-0" style="width: 24px; height: 24px;" onclick="cambiarCantidadPos(${index}, 1)">+</button>
                </div>
                <button class="btn btn-sm btn-link text-danger p-0 ms-1" onclick="eliminarItemPos(${index})"><i class="bi bi-x"></i></button>
            </div>
        `;
    });

    container.innerHTML = html;
    totalSpan.textContent = `$${total.toFixed(2)}`;
    contador.textContent = carritoPos.reduce((acc, i) => acc + i.cantidad, 0);
}

function cambiarCantidadPos(index, delta) {
    const item = carritoPos[index];
    if (!item) return;
    const nuevaCant = item.cantidad + delta;
    if (nuevaCant < 1) return;
    if (nuevaCant > item.stock) {
        return Swal.fire("Límite", `Solo hay ${item.stock} unidades.`, "warning");
    }
    item.cantidad = nuevaCant;
    renderizarCarritoPos();
}

function eliminarItemPos(index) {
    carritoPos.splice(index, 1);
    renderizarCarritoPos();
}

function vaciarCarritoPos() {
    if (carritoPos.length === 0) return;
    Swal.fire({
        title: '¿Vaciar carrito?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar'
    }).then(res => {
        if (res.isConfirmed) {
            carritoPos = [];
            idPedidoWebActual = null; // Limpiamos la referencia web si vacían
            renderizarCarritoPos();
        }
    });
}

// ==========================================
// PROCESAR VENTA (O PAGAR PEDIDO WEB EXISTENTE)
// ==========================================
async function procesarVentaPos() {
    if (carritoPos.length === 0) {
        return Swal.fire("Carrito vacío", "Agrega productos antes de cobrar.", "warning");
    }

    const metodoPago = document.getElementById("metodoPagoPos").value;
    const montoRecibido = parseFloat(document.getElementById("montoRecibido").value) || 0;
    const total = carritoPos.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);

    if (montoRecibido < 0) {
        return Swal.fire("Monto Inválido", "No puedes ingresar un valor negativo.", "error");
    }

    if (metodoPago === "EFECTIVO" && montoRecibido < total) {
        return Swal.fire("Monto insuficiente", `El total es $${total.toFixed(2)}. Recibido: $${montoRecibido.toFixed(2)}`, "error");
    }

    const confirmacion = await Swal.fire({
        title: `Confirmar venta por $${total.toFixed(2)}`,
        text: `Método: ${metodoPago}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '✅ Cobrar y Finalizar',
        cancelButtonText: 'Revisar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        Swal.fire({ title: 'Procesando venta y facturando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        let res;
        let endpointUsado = "";

        // CASO A: Si se cargó un pedido web pendiente, actualizamos ese mismo pedido a PAGADO (disparando el DTE)
        if (idPedidoWebActual !== null) {
            endpointUsado = `${API_URL}/pedidos/${idPedidoWebActual}/pagar`;
            res = await fetch(endpointUsado, {
                method: 'POST',
                headers: authHeaders()
            });
        } 
        // CASO B: Venta normal directa de mostrador en el POS
        else {
            endpointUsado = `${API_URL}/pedidos/pos/crear`;
            const items = carritoPos.map(item => ({
                idProducto: item.idProducto,
                idVariacion: item.idVariacion,
                cantidad: item.cantidad
            }));

            res = await fetch(endpointUsado, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    items: items,
                    metodoPago: metodoPago
                })
            });
        }

        if (res.ok) {
            const pedido = await res.json();
            let mensaje = `Transacción registrada por $${pedido.total.toFixed(2)}`;
            if (metodoPago === "EFECTIVO" && montoRecibido > total) {
                mensaje += `\nCambio: $${(montoRecibido - total).toFixed(2)}`;
            }

            Swal.fire({
                title: "🎉 ¡Venta y Factura Exitosa!",
                text: mensaje,
                icon: "success",
                showCancelButton: true,
                confirmButtonText: "🖨️ Ver / Imprimir Ticket con QR",
                cancelButtonText: "Nueva Venta"
            }).then((result) => {
                const idTicket = pedido.idPedido || pedido.idPedidos;
                if (result.isConfirmed && idTicket) {
                    window.open(`ticket.html?id=${idTicket}`, '_blank');
                }
                
                // Limpiar todo y actualizar contadores
                carritoPos = [];
                idPedidoWebActual = null;
                renderizarCarritoPos();
                document.getElementById("montoRecibido").value = "";
                cargarProductosPos();
                actualizarBadgePedidosWeb();
            });

        } else {
            const error = await res.text();
            Swal.fire("Error", error || "No se pudo procesar la venta", "error");
        }
    } catch (e) {
        console.error(e);
        Swal.fire("Error", "Problemas de conexión con el servidor.", "error");
    }
}

// Soporte para teclado (Enter para buscar)
document.getElementById("searchInputPos")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") cargarProductosPos();
});

// ==========================================
// GESTIÓN MODERNA DE PEDIDOS WEB EN EL POS
// ==========================================
async function actualizarBadgePedidosWeb() {
    const badge = document.getElementById("badgePedidosWeb");
    if (!badge) return;

    try {
        const res = await fetch(`${API_URL}/pedidos/todos`, { headers: authHeaders() });
        if (!res.ok) return;

        const pedidos = await res.json();
        const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE' && p.metodoEntrega === 'RETIRO');

        if (pendientes.length > 0) {
            badge.textContent = pendientes.length;
            badge.style.display = "inline-block";
        } else {
            badge.style.display = "none";
        }
    } catch (e) {
        console.error("Error al actualizar badge web", e);
    }
}

async function cargarPedidosWebModal() {
    const contenedor = document.getElementById("contenedorListaPedidosWeb");
    contenedor.innerHTML = `<div class="text-center py-5 text-muted"><div class="spinner-border text-primary spinner-border-sm"></div> Cargando pedidos...</div>`;

    try {
        const res = await fetch(`${API_URL}/pedidos/todos`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Error al obtener pedidos");

        const pedidos = await res.json();
        
        listaPedidosWebCache = pedidos.filter(p => p.estado === 'PENDIENTE' && p.metodoEntrega === 'RETIRO');

        renderizarPedidosWebUI(listaPedidosWebCache);
        actualizarBadgePedidosWeb();

    } catch (e) {
        console.error(e);
        contenedor.innerHTML = `<div class="text-center py-4 text-danger small">No se pudieron cargar los pedidos web.</div>`;
    }
}

function renderizarPedidosWebUI(pedidos) {
    const contenedor = document.getElementById("contenedorListaPedidosWeb");
    
    if (pedidos.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-inbox fs-1 opacity-25 d-block mb-2"></i>
                <p class="small mb-0">No hay pedidos web pendientes de retiro en este momento.</p>
            </div>
        `;
        return;
    }

    let html = '<div class="row g-3">';

    pedidos.forEach(p => {
        const fechaFormateada = p.fecha ? new Date(p.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const clienteNombre = p.nombreCliente || 'Cliente General';
        
        html += `
            <div class="col-md-6">
                <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-success border-4 d-flex flex-column justify-content-between">
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill" style="font-size: 0.8rem;">
                                <i class="bi bi-person-fill me-1"></i> ${clienteNombre}
                            </span>
                            <span class="text-muted small" style="font-size: 0.75rem;"><i class="bi bi-clock me-1"></i>${fechaFormateada}</span>
                        </div>
                        <div class="px-1 mb-3">
                            <span class="text-secondary small fw-bold d-block mb-1">Total a cobrar:</span>
                            <span class="fs-4 fw-extrabold text-dark">$${p.total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="d-flex gap-2 pt-2 border-top">
                        <button class="btn btn-outline-danger btn-sm rounded-pill w-50 fw-bold py-1" style="font-size: 0.8rem;" onclick="cancelarPedidoWebPos(${p.idPedido})">
                            <i class="bi bi-x-circle me-1"></i> Cancelar
                        </button>
                        <button class="btn btn-success btn-sm rounded-pill w-50 fw-bold py-1 shadow-sm" style="font-size: 0.8rem;" onclick="cargarPedidoEnPos(${p.idPedido})">
                            <i class="bi bi-download me-1"></i> Cargar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    contenedor.innerHTML = html;
}

function filtrarPedidosWebUI() {
    const texto = document.getElementById("filtroPedidosWeb").value.toLowerCase();
    const filtrados = listaPedidosWebCache.filter(p => {
        const nombre = (p.nombreCliente || '').toLowerCase();
        return nombre.includes(texto);
    });
    renderizarPedidosWebUI(filtrados);
}

async function cancelarPedidoWebPos(idPedido) {
    const confirm = await Swal.fire({
        title: `¿Cancelar pedido?`,
        text: "Esta acción devolverá los productos al stock y cancelará la orden web.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar pedido',
        cancelButtonText: 'Volver',
        confirmButtonColor: '#dc3545'
    });

    if (!confirm.isConfirmed) return;

    try {
        Swal.fire({ title: 'Cancelando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const res = await fetch(`${API_URL}/pedidos/${idPedido}/cancelar`, {
            method: 'PUT',
            headers: authHeaders()
        });

        if (res.ok) {
            Swal.fire("Cancelado", "El pedido ha sido anulado correctamente.", "success");
            cargarPedidosWebModal();
            actualizarBadgePedidosWeb();
            if (idPedidoWebActual === idPedido) {
                idPedidoWebActual = null;
                carritoPos = [];
                renderizarCarritoPos();
            }
        } else {
            const err = await res.text();
            Swal.fire("Error", err || "No se pudo cancelar el pedido", "error");
        }
    } catch (e) {
        Swal.fire("Error", "Problemas de conexión con el servidor.", "error");
    }
}

async function cargarPedidoEnPos(idPedido) {
    try {
        const modalEl = document.getElementById('modalPedidosWeb');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();

        Swal.fire({ title: 'Cargando productos al carrito...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        // Guardamos la referencia de que estamos atendiendo este pedido web
        idPedidoWebActual = idPedido;

        const res = await fetch(`${API_URL}/pedidos/${idPedido}`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Error al obtener detalle");
        
        const detalle = await res.json();
        carritoPos = [];

        if (detalle.items && detalle.items.length > 0) {
            detalle.items.forEach(i => {
                let prodId = i.idProducto || i.productoId || i.id || 0;
                let nombreProd = i.producto || i.nombreProducto || i.nombre || 'Producto Web';
                let imgProd = '';

                if (todosLosProductosPos.length > 0) {
                    const encontrado = todosLosProductosPos.find(p => p.idProducto === prodId || p.nombre.toLowerCase().includes(nombreProd.toLowerCase().split('(')[0].trim()));
                    if (encontrado) {
                        prodId = encontrado.idProducto;
                        if (encontrado.imagenesUrls && encontrado.imagenesUrls.length > 0) {
                            imgProd = encontrado.imagenesUrls[0];
                        }
                    }
                }

                carritoPos.push({
                    idProducto: prodId > 0 ? prodId : 1,
                    idVariacion: i.idVariacion || null,
                    nombre: nombreProd,
                    precio: i.precioUnitario || (i.subtotal / i.cantidad),
                    cantidad: i.cantidad,
                    stock: 999,
                    imagen: imgProd,
                    variacionNombre: i.variacion || 'Único'
                });
            });
        }

        renderizarCarritoPos();

        Swal.fire({
            icon: 'success',
            title: `Pedido cargado a caja`,
            text: 'Los productos ya están listos en la Venta Actual para cobrar.',
            timer: 2500,
            showConfirmButton: false
        });

    } catch (e) {
        console.error(e);
        Swal.fire("Error", "No se pudo cargar el contenido del pedido web.", "error");
    }
}