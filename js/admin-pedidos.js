if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

let pedidosGlobales = [];
let tabAdminActiva = 'NUEVOS';
let seleccionAdmin = new Set(); 

document.addEventListener("DOMContentLoaded", () => {
    cargarPedidos();
});

async function cargarPedidos() {
    try {
        const res = await fetch(`${API_URL}/pedidos/todos`, { headers: authHeaders() });
        const data = await res.json();
        pedidosGlobales = data.content || data;
        pedidosGlobales.sort((a, b) => b.idPedido - a.idPedido);
        
        actualizarContadoresTabs(); 
        renderizarAdminActual(); 
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudieron cargar los pedidos.", "error");
    }
}

function cambiarTabAdmin(nuevaTab, btnElement) {
    tabAdminActiva = nuevaTab;
    // Reiniciamos todos los botones a gris (text-muted) y les quitamos la clase 'active'
    document.querySelectorAll('.tab-admin').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-muted');
    });
    // Al botón clicado le damos la clase activa
    btnElement.classList.remove('text-muted');
    btnElement.classList.add('active');
    
    renderizarAdminActual();
}

function renderizarAdminActual() {
    const container = document.getElementById("adminPedidosContainer");
    const buscador = document.getElementById("busquedaCliente").value.toLowerCase();
    container.innerHTML = "";
    seleccionAdmin.clear();

    const filtrados = pedidosGlobales.filter(p => {
        let coincideTab = false;
        if (tabAdminActiva === 'NUEVOS') coincideTab = (p.estado === "PENDIENTE" && p.metodoEntrega === "ENVIO");
        if (tabAdminActiva === 'TRANSITO') coincideTab = p.estado === "ENVIADO";
        if (tabAdminActiva === 'ARCHIVO') coincideTab = (p.estado !== "PENDIENTE" && p.estado !== "ENVIADO");
        const nombre = p.nombreCliente ? p.nombreCliente.toLowerCase() : "";
        return coincideTab && nombre.includes(buscador);
    });

    if (filtrados.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5"><span class="text-muted"><i class="bi bi-inbox fs-1 d-block mb-3"></i> No hay órdenes.</span></div>`;
        return;
    }

    if (tabAdminActiva === 'ARCHIVO') {
        container.innerHTML = `
            <div class="col-12 mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm border border-secondary border-opacity-25">
                <div class="form-check m-0">
                    <input class="form-check-input border-secondary" type="checkbox" id="selectAllAdmin" onclick="masterCheckAdmin(this)">
                    <label class="form-check-label fw-bold text-secondary" for="selectAllAdmin">Seleccionar varios para archivar</label>
                </div>
                <button class="btn btn-secondary btn-sm rounded-pill px-4 fw-bold shadow-sm" id="btnDeleteBatch" style="display:none;" onclick="limpiarBaseDeDatosTest(true)">
                    <i class="bi bi-archive-fill me-1"></i> Archivar seleccionados (<span id="countAdmin">0</span>)
                </button>
            </div>
        `;
    }

    filtrados.forEach(p => { container.innerHTML += generarTarjetaAdmin(p); });
}

// ==========================================
// FUNCIONES DE SELECCIÓN MÚLTIPLE
// ==========================================
function toggleCheckAdmin(id) {
    if (seleccionAdmin.has(id)) seleccionAdmin.delete(id);
    else seleccionAdmin.add(id);
    
    const btn = document.getElementById("btnDeleteBatch");
    const count = document.getElementById("countAdmin");
    if (btn && count) {
        btn.style.display = seleccionAdmin.size > 0 ? 'block' : 'none';
        count.innerText = seleccionAdmin.size;
    }
}

function masterCheckAdmin(master) {
    const checks = document.querySelectorAll('.check-admin');
    seleccionAdmin.clear();
    checks.forEach(c => {
        c.checked = master.checked;
        if (master.checked) seleccionAdmin.add(parseInt(c.value));
    });
    
    const btn = document.getElementById("btnDeleteBatch");
    if (btn) {
        btn.style.display = seleccionAdmin.size > 0 ? 'block' : 'none';
        document.getElementById("countAdmin").innerText = seleccionAdmin.size;
    }
}

function actualizarContadoresTabs() {
    const nuevos = pedidosGlobales.filter(p => p.estado === "PENDIENTE" && p.metodoEntrega === "ENVIO").length;
    const transito = pedidosGlobales.filter(p => p.estado === "ENVIADO").length;
    
    const countNuevos = document.getElementById("countNuevos");
    const countTransito = document.getElementById("countTransito");

    countNuevos.innerText = nuevos;
    countTransito.innerText = transito;
    
    countNuevos.style.display = nuevos > 0 ? 'inline-block' : 'none';
    countTransito.style.display = transito > 0 ? 'inline-block' : 'none';
}
function generarTarjetaAdmin(p) {
    const idReal = p.idPedido || p.idPedidos; 
    const totalSeguro = p.total || 0; 
    const esEnvio = p.metodoEntrega === "ENVIO";

    const productosHTML = (p.productos || []).map(prod => `
        <div class="d-flex align-items-center mb-2 bg-white p-2 rounded-3 border shadow-sm">
            <img src="${prod.imagenUrl || 'https://placehold.co/50x50/eeeeee/999999?text=No+Foto'}" class="rounded border me-2" style="width: 45px; height: 45px; object-fit: cover;">
            <div class="overflow-hidden flex-grow-1">
                <div class="fw-bold text-dark text-truncate small">${prod.nombre}</div>
                <div class="text-muted small">Cantidad: ${prod.cantidad}</div>
            </div>
        </div>
    `).join('');

    const checkboxAdmin = (tabAdminActiva === 'ARCHIVO') 
        ? `<div class="form-check position-absolute top-0 end-0 m-3" style="z-index: 10;">
             <input class="form-check-input border-secondary check-admin shadow-sm" type="checkbox" value="${idReal}" onclick="toggleCheckAdmin(${idReal})">
           </div>` : '';

    const btnOcultarAdmin = (p.estado === "ENTREGADO" || p.estado === "CANCELADO") 
        ? `<button class="btn btn-sm btn-outline-secondary border-0 ms-2" onclick="ocultarPedidoAdmin(${idReal})" title="Archivar registro"><i class="bi bi-archive-fill"></i></button>` : '';

    // Agregamos card-neo para el efecto flotante mágico
    return `
        <div class="col-md-6 col-lg-4 position-relative">
            ${checkboxAdmin}
            <div class="card card-neo border-0 shadow-sm rounded-4 h-100 border-top border-4 ${esEnvio ? 'border-primary' : 'border-success'}">
                <div class="card-body p-4 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="d-flex align-items-center"><h5 class="fw-bolder m-0 text-dark">#${idReal}</h5>${btnOcultarAdmin}</div>
                        <span class="badge rounded-pill shadow-sm px-3 py-2 ${colorEstado(p.estado)}">${p.estado}</span>
                    </div>
                    <div class="mb-3">
                        <h6 class="fw-bold text-dark mb-0">${p.nombreCliente || 'Cliente'}</h6>
                        <small class="text-muted">${p.usuarioEmail}</small><br>
                        <a href="https://wa.me/503${p.telefonoCliente}" target="_blank" class="text-success small fw-bold text-decoration-none mt-1 d-inline-block"><i class="bi bi-whatsapp"></i> WhatsApp: ${p.telefonoCliente || 'N/A'}</a>
                    </div>
                    <div class="mb-3 p-2 bg-light rounded-3" style="max-height: 150px; overflow-y: auto;">
                        ${productosHTML}
                    </div>
                    <div class="p-2 bg-light rounded-3 mb-4 border-start border-3 ${esEnvio ? 'border-primary' : 'border-success'}">
                        <p class="small mb-0 text-dark"><i class="bi bi-geo-alt-fill text-danger me-1"></i><strong>${esEnvio ? 'ENVÍO:' : 'RETIRO:'}</strong> ${p.direccion || 'Retiro en tienda'}</p>
                    </div>
                    <hr class="text-muted opacity-25 mb-3 mt-auto">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="text-muted small fw-bold text-uppercase">Total:</span><h4 class="fw-bolder text-primary m-0">$${totalSeguro.toFixed(2)}</h4>
                    </div>
                    <div class="d-grid gap-2">
                        ${accionesAdminSmart(p, idReal)}
                        <button class="btn btn-light border text-dark fw-bold shadow-sm rounded-pill" onclick="abrirModalDetallePro(${idReal})"><i class="bi bi-eye text-primary me-1"></i> Ver Orden</button>
                    </div>
                </div>
            </div>
        </div>`;
}

function accionesAdminSmart(p, idReal) {
    if (p.estado === "PENDIENTE") {
        if (p.metodoEntrega === "RETIRO") {
            return `
                <button class="btn btn-success fw-bold shadow-sm" onclick="entregaInmediata(${idReal})"><i class="bi bi-shop me-1"></i> Entregar Tienda</button>
                <button class="btn btn-outline-danger btn-sm mt-1" onclick="cambiarEstadoPedido(${idReal}, 'cancelar', 'Cancelar')">Cancelar</button>
            `;
        } else {
            // PARA ENVÍOS A DOMICILIO: El admin primero confirma el pago (emite DTE y factura) y luego despacha
            return `
                <button class="btn btn-warning fw-bold shadow-sm text-dark mb-1" onclick="confirmarPagoEnvio(${idReal})">
                    <i class="bi bi-cash-coin me-1"></i> Confirmar Pago y Facturar
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="cambiarEstadoPedido(${idReal}, 'cancelar', 'Cancelar')">Cancelar</button>
            `;
        }
    }
    
    if (p.estado === "PAGADO") {
        // Si ya está pagado y facturado, el admin procede a despachar el envío
        return `
            <button class="btn btn-primary fw-bold shadow-sm" onclick="cambiarEstadoPedido(${idReal}, 'enviar', 'Despachar')">
                <i class="bi bi-truck me-1"></i> Despachar Envío
            </button>
        `;
    }

    if (p.estado === "ENVIADO") {
        return `
            <button class="btn btn-success fw-bold shadow-sm" onclick="cambiarEstadoPedido(${idReal}, 'entregar', 'Marcar Entregado')">
                <i class="bi bi-box-seam me-1"></i> Confirmar Entrega
            </button>
        `;
    }
    return ``; 
}

// Función auxiliar para confirmar el pago del envío y disparar la factura electrónica
async function confirmarPagoEnvio(id) {
    const conf = await Swal.fire({
        title: '¿Confirmar pago y emitir DTE?',
        text: "Se generará la Factura Electrónica ante Hacienda y se le enviará el comprobante por correo al cliente.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        confirmButtonText: 'Sí, confirmar y facturar'
    });

    if (!conf.isConfirmed) return;

    try {
        Swal.fire({ title: 'Procesando factura electrónica...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const res = await fetch(`${API_URL}/pedidos/${id}/confirmar-pago`, {
            method: 'PUT',
            headers: authHeaders()
        });

        if (res.ok) {
            Swal.fire("¡Facturado con éxito!", "El pago ha sido confirmado, la factura electrónica se generó y el correo fue enviado al cliente.", "success");
            cargarPedidos(); // Recarga la tabla de pedidos
        } else {
            const err = await res.text();
            Swal.fire("Error", err || "No se pudo procesar el pago", "error");
        }
    } catch (e) {
        Swal.fire("Error", "Problemas de conexión con el servidor.", "error");
    }
}

// ==========================================
// MODAL DE DETALLE CON RESPALDO MATEMÁTICO
// ==========================================
function abrirModalDetallePro(idBusqueda) {
    const pedido = pedidosGlobales.find(p => (p.idPedido || p.idPedidos) === idBusqueda);
    if (!pedido) return;

    document.getElementById("modalPedidoId").innerText = idBusqueda;
    
    const contenedor = document.getElementById("listaProductosDetalle");
    contenedor.innerHTML = ""; 
    
    let subtotalItemsCalculado = 0;

    pedido.productos.forEach(d => {
        subtotalItemsCalculado += (d.precioUnitario * d.cantidad);

        let badgesVariacion = '';
        if (d.color && d.color !== "Único") {
            badgesVariacion += `<span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 mb-1 me-1"><i class="bi bi-palette text-primary me-1"></i> ${d.color}</span>`;
        }
        if (d.talla && d.talla !== "Única") {
            badgesVariacion += `<span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 mb-1 me-1"><i class="bi bi-rulers text-primary me-1"></i> ${d.talla}</span>`;
        }
        
        const tieneDesc = d.descuento && d.descuento > 0;
        const badgeRed = tieneDesc ? `<span class="badge bg-danger rounded-pill ms-2" style="font-size: 0.7rem;">-${d.descuento}%</span>` : '';

        contenedor.innerHTML += `
            <div class="card border-0 shadow-sm rounded-4 mb-3 border-start border-primary border-4 bg-light">
                <div class="card-body p-3 d-flex align-items-center">
                    <img src="${d.imagenUrl || 'https://placehold.co/80x80/eeeeee/999999?text=No+Foto'}" class="rounded-3 shadow-sm border me-3 bg-white" style="width: 70px; height: 70px; object-fit: cover;">
                    <div class="flex-grow-1">
                        <h6 class="fw-bold text-dark mb-1">${d.nombre} ${badgeRed}</h6>
                        <div class="d-flex flex-wrap mb-1">
                            ${badgesVariacion}
                            <span class="badge bg-white text-dark border px-2 py-1 mb-1 fw-bold">$${d.precioUnitario.toFixed(2)} c/u</span>
                        </div>
                    </div>
                    <div class="text-end ms-3">
                        <span class="badge bg-primary fs-5 rounded-pill px-3 py-2 shadow-sm">x ${d.cantidad}</span>
                    </div>
                </div>
            </div>`;
    });
    
    const costoEnvio = pedido.costoEnvio || 0;
    const totalPagado = pedido.total || 0;

    const ahorroDiferencia = (subtotalItemsCalculado + costoEnvio) - totalPagado;

    let desgloseHTML = `
        <div class="bg-white p-3 rounded-4 shadow-sm border mt-2">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted fw-bold small">Subtotal Productos:</span>
                <span class="fw-bold text-dark">$${subtotalItemsCalculado.toFixed(2)}</span>
            </div>`;

    if (ahorroDiferencia > 0.01) {
        desgloseHTML += `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-success fw-bold small"><i class="bi bi-patch-check-fill me-1"></i> Descuento Aplicado:</span>
                <span class="fw-bold text-success">-$${ahorroDiferencia.toFixed(2)}</span>
            </div>`;
    }

    if (costoEnvio > 0) {
        desgloseHTML += `
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted fw-bold small"><i class="bi bi-truck text-primary me-1"></i> Envío:</span>
                <span class="fw-bold text-primary">+$${costoEnvio.toFixed(2)}</span>
            </div>`;
    } else {
        desgloseHTML += `
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted fw-bold small"><i class="bi bi-shop text-success me-1"></i> Retiro:</span>
                <span class="fw-bold text-success">Gratis</span>
            </div>`;
    }

    desgloseHTML += `</div>`;
    
    document.getElementById("modalTotal").innerText = "$" + totalPagado.toFixed(2);
    contenedor.innerHTML += desgloseHTML;

    new bootstrap.Modal(document.getElementById('modalDetalles')).show();
}

async function entregaInmediata(id) {
    const res = await Swal.fire({ title: '¿Entregar en Tienda?', icon: 'success', showCancelButton: true, confirmButtonText: 'Sí, entregar', confirmButtonColor: '#198754' });
    if (res.isConfirmed) {
        try { await fetch(`${API_URL}/pedidos/${id}/entregar`, { method: "PUT", headers: authHeaders() }); cargarPedidos(); } 
        catch (e) { Swal.fire('Error', 'Fallo de red', 'error'); }
    }
}

async function cambiarEstadoPedido(id, accion, textoAccion) {
    const conf = await Swal.fire({ title: `¿${textoAccion}?`, icon: accion === 'cancelar' ? 'warning' : 'question', showCancelButton: true, confirmButtonColor: accion === 'cancelar' ? '#dc3545' : '#0d6efd', confirmButtonText: `Sí, proceder` });
    if (!conf.isConfirmed) return;
    try { await fetch(`${API_URL}/pedidos/${id}/${accion}`, { method: 'PUT', headers: authHeaders() }); cargarPedidos(); } 
    catch (error) { Swal.fire("Error", "Error de conexión", "error"); }
}

// ==========================================
// ACCIONES DE ARCHIVADO SEGURO
// ==========================================
async function ocultarPedidoAdmin(id) {
    const res = await Swal.fire({ 
        title: '¿Archivar pedido?', 
        text: "Se quitará de tu vista pero mantendrá intactas las estadísticas financieras.", 
        icon: 'info', 
        showCancelButton: true, 
        confirmButtonColor: '#6c757d',
        confirmButtonText: 'Sí, archivar' 
    });
    
    if (res.isConfirmed) {
        try {
            await fetch(`${API_URL}/pedidos/${id}/ocultar-admin`, { method: 'PUT', headers: authHeaders() });
            cargarPedidos(); 
        } catch (e) { Swal.fire("Error", "No se pudo archivar", "error"); }
    }
}

async function limpiarBaseDeDatosTest(soloSeleccionados = false) {
    let idsParaOcultar = [];
    
    if (soloSeleccionados) {
        idsParaOcultar = Array.from(seleccionAdmin);
    } else {
        idsParaOcultar = pedidosGlobales
            .filter(p => p.estado === "ENTREGADO" || p.estado === "CANCELADO")
            .map(p => p.idPedido || p.idPedidos);
    }
    
    if (idsParaOcultar.length === 0) return;

    const conf = await Swal.fire({
        title: '¿Archivar selección?',
        text: `Vas a ocultar ${idsParaOcultar.length} pedidos. Tus finanzas seguirán seguras.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6c757d',
        confirmButtonText: 'Sí, archivar'
    });

    if (conf.isConfirmed) {
        Swal.fire({ title: 'Archivando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const promesas = idsParaOcultar.map(id => fetch(`${API_URL}/pedidos/${id}/ocultar-admin`, { method: "PUT", headers: authHeaders() }));
            await Promise.all(promesas);
            cargarPedidos();
            Swal.close();
        } catch { Swal.fire("Error", "Fallo al archivar", "error"); }
    }
}

function colorEstado(estado) {
    switch (estado) {
        case "PENDIENTE": return "bg-warning bg-opacity-10 text-warning border-warning";
        case "PAGADO": return "bg-primary bg-opacity-10 text-primary border-primary";
        case "ENVIADO": return "bg-info bg-opacity-10 text-info border-info";
        case "ENTREGADO": return "bg-success bg-opacity-10 text-success border-success";
        case "CANCELADO": return "bg-danger bg-opacity-10 text-danger border-danger";
        default: return "bg-secondary bg-opacity-10 text-secondary border-secondary";
    }
}