// ==========================================
// js/mis-pedidos.js - Versión Segura y Multiselect
// ==========================================
if (!getToken()) window.location.href = "index.html";
if (getUserRole() === "ROLE_ADMIN") window.location.href = "admin-dashboard.html";

const MI_WHATSAPP = "50371584643"; 
let misPedidosMemoria = []; 
let tabActiva = 'PENDIENTE'; 
let pedidosSeleccionados = new Set(); 

document.addEventListener("DOMContentLoaded", () => {
    if (typeof actualizarBadge === 'function') actualizarBadge();
    configurarMenuUsuario();
    cargarPedidos();
});

async function cargarPedidos() {
    try {
        const res = await fetch(`${API_URL}/pedidos/mis-pedidos`, { headers: authHeaders() });
        if (!res.ok) throw new Error();
        misPedidosMemoria = await res.json();
        misPedidosMemoria.sort((a, b) => b.idPedido - a.idPedido);
        renderizarVistaActual(); 
    } catch (e) {
        Swal.fire("Error", "No pudimos cargar tus compras.", "error");
    }
}

// Control de estilos minimalistas en las pestañas
function cambiarTabCliente(nuevaTab, btnElement) {
    tabActiva = nuevaTab;
    
    document.querySelectorAll('#pills-tab .nav-link').forEach(btn => {
        btn.classList.remove('active', 'text-primary', 'fw-bold', 'border-bottom', 'border-primary', 'border-3');
        btn.classList.add('text-muted');
    });

    btnElement.classList.remove('text-muted');
    btnElement.classList.add('active', 'text-primary', 'fw-bold', 'border-bottom', 'border-primary', 'border-3');

    // Ocultamos el botón viejo de limpieza general
    const zonaLimpieza = document.getElementById("zonaLimpiezaHistorial");
    if(zonaLimpieza) zonaLimpieza.style.display = 'none';
    
    renderizarVistaActual();
}

function renderizarVistaActual() {
    const container = document.getElementById("misPedidosContainer");
    if (!container) return;
    container.innerHTML = "";
    pedidosSeleccionados.clear(); // Limpiamos selección al cambiar de tab

    const filtrados = misPedidosMemoria.filter(p => {
        if (tabActiva === 'PENDIENTE') return p.estado === "PENDIENTE";
        if (tabActiva === 'PROCESO') return p.estado === "ENVIADO" || p.estado === "PAGADO";
        if (tabActiva === 'HISTORIAL') return p.estado === "ENTREGADO" || p.estado === "CANCELADO";
        return false;
    });

    if (filtrados.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5"><span class="text-muted"><i class="bi bi-inbox fs-1 d-block mb-3"></i> No hay pedidos en esta sección.</span></div>`;
        return;
    }

    if (tabActiva === 'HISTORIAL') {
        container.innerHTML = `
            <div class="col-12 mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm border border-secondary border-opacity-25">
                <div class="form-check m-0">
                    <input class="form-check-input border-secondary" type="checkbox" id="selectAll" onclick="seleccionarTodosPedidos(this)">
                    <label class="form-check-label fw-bold text-secondary" for="selectAll">Seleccionar varios pedidos para ocultar</label>
                </div>
                <button class="btn btn-secondary btn-sm rounded-pill px-4 fw-bold shadow-sm" id="btnOcultarVarios" style="display:none;" onclick="limpiarHistorialMasivo(true)">
                    <i class="bi bi-eye-slash-fill me-1"></i> Ocultar seleccionados (<span id="countSelected">0</span>)
                </button>
            </div>
        `;
    }

    filtrados.forEach(p => { container.innerHTML += generarTarjetaHTML(p); });
}

// ==========================================
// FUNCIONES DE SELECCIÓN MÚLTIPLE
// ==========================================
function toggleSeleccionPedido(id) {
    if (pedidosSeleccionados.has(id)) pedidosSeleccionados.delete(id);
    else pedidosSeleccionados.add(id);
    actualizarBarraAcciones();
}

function seleccionarTodosPedidos(master) {
    const checks = document.querySelectorAll('.check-pedido');
    pedidosSeleccionados.clear();
    checks.forEach(c => {
        c.checked = master.checked;
        if (master.checked) pedidosSeleccionados.add(parseInt(c.value));
    });
    actualizarBarraAcciones();
}

function actualizarBarraAcciones() {
    const btn = document.getElementById("btnOcultarVarios");
    const count = document.getElementById("countSelected");
    if (btn && count) {
        btn.style.display = pedidosSeleccionados.size > 0 ? 'block' : 'none';
        count.innerText = pedidosSeleccionados.size;
    }
}

// ==========================================
// GENERADOR DE TARJETAS
// ==========================================
function generarTarjetaHTML(p) {
    const fecha = new Date(p.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // 👇 Inyección del Checkbox en la esquina superior (solo en Historial)
    const checkboxHTML = (tabActiva === 'HISTORIAL') 
        ? `<div class="form-check position-absolute top-0 end-0 m-3" style="z-index: 10;">
             <input class="form-check-input border-secondary check-pedido shadow-sm" type="checkbox" value="${p.idPedido}" onclick="toggleSeleccionPedido(${p.idPedido})">
           </div>` : '';

    return `
        <div class="col-md-6 col-lg-4 position-relative">
            ${checkboxHTML}
            <div class="card border-0 shadow-sm rounded-4 h-100 product-card">
                <div class="card-body p-4 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge rounded-pill ${badgeEstado(p.estado)} px-3 py-2 border">${p.estado}</span>
                        <i class="bi bi-bag-check fs-4 text-primary opacity-25"></i>
                    </div>
                    <div class="mb-4">
                        <div class="d-flex align-items-center mb-2"><i class="bi bi-calendar3 me-2 text-primary"></i><span class="text-secondary small">${fecha}</span></div>
                        <div class="d-flex align-items-center"><i class="bi bi-wallet2 me-2 text-primary"></i><span class="fw-bold fs-4 text-dark">$${p.total.toFixed(2)}</span></div>
                        <div class="small text-muted mt-2"><i class="bi bi-geo-alt me-1"></i> ${p.metodoEntrega === "ENVIO" ? 'Envío a domicilio' : 'Retiro en tienda'}</div>
                    </div>
                    <div class="d-grid gap-2 mt-auto">${accionesPedidoCard(p)}</div>
                </div>
            </div>
        </div>`;
}

function accionesPedidoCard(p) {
    let btnDetalle = `<a href="detalle-pedido.html?id=${p.idPedido}" class="btn btn-light text-primary border fw-bold w-100"><i class="bi bi-eye me-1"></i> Ver Detalles</a>`;
    if (p.estado === "PENDIENTE") {
        const textoBoton = p.metodoEntrega === "ENVIO" ? "Coordinar Pago" : "Avisar Retiro";
        const icono = p.metodoEntrega === "ENVIO" ? "bi-whatsapp" : "bi-shop";
        return `
            <div class="row g-2">
                <div class="col-12">
                    <button class="btn btn-success w-100 fw-bold shadow-sm" onclick="coordinarPagoWA(${p.idPedido}, ${p.total}, '${p.metodoEntrega}')">
                        <i class="bi ${icono} me-1"></i> ${textoBoton}
                    </button>
                </div>
                <div class="col-6"><button class="btn btn-outline-danger w-100 fw-bold" style="font-size: 0.8rem;" onclick="cancelarPedido(${p.idPedido})"><i class="bi bi-x-circle me-1"></i> Cancelar</button></div>
                <div class="col-6">${btnDetalle}</div>
            </div>`;
    }
    return btnDetalle;
}

// ==========================================
// ACCIONES DE CLIENTE
// ==========================================
async function limpiarHistorialMasivo(soloSeleccionados = false) {
    let idsParaBorrar = [];
    
    if (soloSeleccionados) {
        idsParaBorrar = Array.from(pedidosSeleccionados);
    } else {
        idsParaBorrar = misPedidosMemoria
            .filter(p => p.estado === "ENTREGADO" || p.estado === "CANCELADO")
            .map(p => p.idPedido);
    }
    
    if (idsParaBorrar.length === 0) return;

    const conf = await Swal.fire({ 
        title: '¿Ocultar selección?', 
        text: `Se ocultarán ${idsParaBorrar.length} pedidos de tu historial.`, 
        icon: 'question', 
        showCancelButton: true, 
        confirmButtonColor: '#6c757d', 
        confirmButtonText: 'Sí, ocultar' 
    });
    
    if (!conf.isConfirmed) return;

    Swal.fire({ title: 'Ocultando...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
        const promesas = idsParaBorrar.map(id => fetch(`${API_URL}/pedidos/${id}/ocultar`, { method: "PUT", headers: authHeaders() }));
        await Promise.all(promesas);
        cargarPedidos(); 
        Swal.close();
    } catch { Swal.fire("Error", "Problema al limpiar el historial", "error"); }
}

function coordinarPagoWA(id, total, metodoEntrega) {
    let mensaje = metodoEntrega === "ENVIO" ? `¡Hola! Acabo de realizar una compra por un total de $${total.toFixed(2)}. ¿Me brindan info para pago y envío?` : `¡Hola! Acabo de realizar una compra por un total de $${total.toFixed(2)}.\n\nPasaré a retirarlo a la tienda.`;
    window.open(`https://wa.me/${MI_WHATSAPP}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function badgeEstado(estado) {
    switch (estado) {
        case "PENDIENTE": return "bg-warning bg-opacity-10 text-warning border-warning";
        case "PAGADO": return "bg-primary bg-opacity-10 text-primary border-primary";
        case "ENVIADO": return "bg-info bg-opacity-10 text-info border-info";
        case "ENTREGADO": return "bg-success bg-opacity-10 text-success border-success";
        case "CANCELADO": return "bg-danger bg-opacity-10 text-danger border-danger";
        default: return "bg-secondary bg-opacity-10 text-secondary border-secondary";
    }
}

async function cancelarPedido(id) {
    const conf = await Swal.fire({ title: '¿Cancelar Pedido?', text: "Se liberará el stock reservado.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, cancelar' });
    if (!conf.isConfirmed) return;
    try {
        const res = await fetch(`${API_URL}/pedidos/${id}/cancelar`, { method: "PUT", headers: authHeaders() });
        if (res.ok) cargarPedidos();
    } catch { console.error("Error cancelando"); }
}

function configurarMenuUsuario() {
    if (getUserRole() === "ROLE_ADMIN") document.getElementById("itemAdmin")?.classList.remove("d-none");
    document.getElementById("btnSalir")?.addEventListener("click", () => { localStorage.clear(); window.location.href = "index.html"; });
}