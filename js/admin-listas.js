// ==========================================
// js/admin-listas.js - Gestión de Listas (Admin) Mágico
// ==========================================
if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

let listasGlobales = []; 

document.addEventListener("DOMContentLoaded", cargarListasAdmin);

function cargarListasAdmin() {
    const tbody = document.getElementById("tablaListasBody");
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary"></div><p class="text-muted mt-2 mb-0">Sincronizando magia...</p></td></tr>';

    fetch(`${API_URL}/lista/admin/todas`, { headers: authHeaders() })
        .then(res => {
            if (!res.ok) throw new Error('Error al cargar listas');
            return res.json();
        })
        .then(listas => {
            listasGlobales = listas;
            listasGlobales.sort((a, b) => b.idLista - a.idLista);
            renderizarListas();
        })
        .catch(err => {
            console.error(err);
            Swal.fire("Error", "No se pudieron cargar las listas.", "error");
        });
}

function renderizarListas() {
    const tbody = document.getElementById("tablaListasBody");
    const filtro = document.getElementById("busquedaLista") ? document.getElementById("busquedaLista").value.toLowerCase() : "";
    
    tbody.innerHTML = "";

    const filtradas = listasGlobales.filter(l => 
        l.nombreCliente.toLowerCase().includes(filtro) || 
        l.grado.toLowerCase().includes(filtro) ||
        l.idLista.toString().includes(filtro)
    );

    if (filtradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1 d-block mb-3"></i> No se encontraron listas escolares.</td></tr>`;
        return;
    }

    filtradas.forEach(l => {
        let badgeClass = '';
        let estadoLabel = '';
        
        if (l.estado === 'PENDIENTE') {
            badgeClass = 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50';
            estadoLabel = 'Por Armar';
        } else if (l.estado === 'ARMADO') {
            badgeClass = 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-50';
            estadoLabel = 'Listo p/Retirar';
        } else {
            badgeClass = 'bg-success bg-opacity-10 text-success border border-success border-opacity-50';
            estadoLabel = 'Entregado';
        }

        const productosStr = l.detalles.map(d => `${d.productoNombre} (x${d.cantidadSolicitada})`).join(' • ');

        // 🟢 NUEVO: Agregamos el botón de "Ver Lista" a todas las filas
        let botonVer = `<button class="btn btn-light border text-primary fw-bold shadow-sm px-3 rounded-pill me-2" onclick="abrirModalDetalleLista(${l.idLista})" title="Ver útiles a armar"><i class="bi bi-eye-fill me-1"></i> Ver Lista</button>`;
        let acciones = '';
        
        if (l.estado === 'PENDIENTE') {
            acciones = botonVer + `<button class="btn btn-warning text-dark btn-sm rounded-pill fw-bold shadow-sm px-3" onclick="armarLista(${l.idLista})"><i class="bi bi-box-seam me-1"></i> Armar</button>`;
        } else if (l.estado === 'ARMADO') {
            acciones = botonVer + `<button class="btn btn-primary btn-sm rounded-pill fw-bold shadow-sm px-3" onclick="retirarLista(${l.idLista})"><i class="bi bi-check2-circle me-1"></i> Entregar</button>`;
        } else {
            acciones = botonVer + `<span class="badge bg-light text-muted border px-3 py-2 rounded-pill"><i class="bi bi-check-all fs-6"></i> Finalizado</span>`;
        }

        tbody.innerHTML += `
            <tr style="transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
                <td class="ps-4 fw-bolder text-dark">#${l.idLista}</td>
                <td>
                    <div class="fw-bold text-dark">${l.nombreCliente}</div>
                    <small class="text-muted"><i class="bi bi-envelope me-1"></i>${l.emailCliente}</small>
                </td>
                <td>
                    <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-mortarboard text-primary me-1"></i> ${l.grado} (${l.anio})</span>
                </td>
                <td style="max-width: 200px;">
                    <div class="text-truncate small text-secondary" title="${productosStr}">${productosStr}</div>
                </td>
                <td class="text-center">
                    <span class="badge ${badgeClass} rounded-pill px-3 py-2 shadow-sm">${estadoLabel}</span>
                </td>
                <td class="pe-4 text-end text-nowrap">
                    ${acciones}
                </td>
            </tr>`;
    });
}

// 🟢 FUNCIÓN ACTUALIZADA: Con imágenes, precios y cálculo del total
function abrirModalDetalleLista(id) {
    const lista = listasGlobales.find(l => l.idLista === id);
    if (!lista) return;

    document.getElementById("modalListaId").innerText = id;
    document.getElementById("modalListaCliente").innerText = `Cliente: ${lista.nombreCliente}`;
    document.getElementById("modalListaGrado").innerText = `${lista.grado} (${lista.anio})`;
    
    const contenedor = document.getElementById("contenedorProductosLista");
    contenedor.innerHTML = "";

    let totalAcumulado = 0; // Variable para calcular el total

    lista.detalles.forEach(d => {
        // Aseguramos que existan el precio y la imagen (dependiendo de cómo lo mande tu backend)
        const precioUnitario = d.precioUnitario || d.precio || 0;
        const subtotal = precioUnitario * d.cantidadSolicitada;
        const imagenUrl = d.imagenUrl || d.imagen || 'https://placehold.co/80x80/eeeeee/999999?text=Sin+Foto';
        
        totalAcumulado += subtotal;

        contenedor.innerHTML += `
            <div class="card border-0 shadow-sm rounded-4 border-start border-primary border-4 bg-white">
                <div class="card-body p-3 d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <img src="${imagenUrl}" class="rounded-3 shadow-sm border me-3 bg-light" style="width: 70px; height: 70px; object-fit: cover;">
                        <div>
                            <h6 class="fw-bold text-dark mb-1">${d.productoNombre}</h6>
                            <span class="badge bg-light text-dark border px-2 py-1 fw-bold">$${precioUnitario.toFixed(2)} c/u</span>
                        </div>
                    </div>
                    <div class="text-end ms-3">
                        <span class="badge bg-primary fs-5 rounded-pill px-3 py-2 shadow-sm">x ${d.cantidadSolicitada}</span>
                        <div class="text-muted small fw-bold mt-2">Sub: $${subtotal.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    });

    // Actualizamos el monto total en el modal
    const totalElement = document.getElementById("modalListaTotal");
    if (totalElement) {
        totalElement.innerText = "$" + totalAcumulado.toFixed(2);
    }

    // Construir botones del footer del modal según el estado
    const footer = document.getElementById("modalFooterAcciones");
    let botonesAccion = `<button type="button" class="btn btn-secondary rounded-pill px-4 py-2 fw-bold shadow-sm" data-bs-dismiss="modal">Cerrar Visor</button>`;
    
    if (lista.estado === 'PENDIENTE') {
        botonesAccion += `<button class="btn btn-warning text-dark rounded-pill px-4 py-2 fw-bold shadow-sm" onclick="armarLista(${lista.idLista}); bootstrap.Modal.getInstance(document.getElementById('modalDetallesLista')).hide();"><i class="bi bi-box-seam me-1"></i> Marcar como Armado</button>`;
    } else if (lista.estado === 'ARMADO') {
        botonesAccion += `<button class="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm" onclick="retirarLista(${lista.idLista}); bootstrap.Modal.getInstance(document.getElementById('modalDetallesLista')).hide();"><i class="bi bi-check2-circle me-1"></i> Confirmar Entrega</button>`;
    }
    
    footer.innerHTML = botonesAccion;

    // Colorear el estado en el modal
    const badgeEstado = document.getElementById("modalListaEstado");
    badgeEstado.innerText = (lista.estado === 'PENDIENTE') ? 'Por Armar' : (lista.estado === 'ARMADO' ? 'Listo p/Retirar' : 'Entregado');
    badgeEstado.className = "badge rounded-pill px-3 py-2 shadow-sm " + (lista.estado === 'PENDIENTE' ? 'bg-warning text-dark' : (lista.estado === 'ARMADO' ? 'bg-primary' : 'bg-success'));

    new bootstrap.Modal(document.getElementById('modalDetallesLista')).show();
}

function armarLista(id) {
    Swal.fire({
        title: '¿Armar esta lista?',
        text: 'Se descontará el stock de los productos para reservarlos.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        confirmButtonText: 'Sí, armar paquete',
        cancelButtonText: 'Cancelar'
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            fetch(`${API_URL}/lista/admin/${id}/armar`, { method: 'PUT', headers: authHeaders() })
                .then(res => {
                    if (res.ok) {
                        Swal.fire("¡Listo!", "La lista ha sido armada. El cliente recibirá una notificación.", "success");
                        cargarListasAdmin();
                    } else { return res.text().then(t => { throw new Error(t); }); }
                })
                .catch(err => { Swal.fire("Error", err.message || "Stock insuficiente.", "error"); });
        }
    });
}

function retirarLista(id) {
    Swal.fire({
        title: '¿Confirmar entrega?',
        text: 'Confirma que el cliente ya recogió su paquete escolar.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        confirmButtonText: 'Sí, entregar',
        cancelButtonText: 'Cancelar'
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            fetch(`${API_URL}/lista/admin/${id}/retirar`, { method: 'PUT', headers: authHeaders() })
                .then(res => {
                    if (res.ok) {
                        Swal.fire("¡Completado!", "Paquete marcado como entregado con éxito.", "success");
                        cargarListasAdmin();
                    } else { Swal.fire("Error", "No se pudo actualizar el estado.", "error"); }
                })
                .catch(err => { Swal.fire("Error", "Problema de conexión con el servidor.", "error"); });
        }
    });
}