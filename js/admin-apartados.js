// ==========================================
// js/admin-apartados.js - Gestión de Apartados Mágico
// ==========================================
if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

let apartadosGlobales = []; // Para el buscador en tiempo real

document.addEventListener("DOMContentLoaded", cargarApartados);

function cargarApartados() {
    const tbody = document.getElementById("tablaApartadosBody");
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary"></div><p class="text-muted mt-2 mb-0">Sincronizando registros...</p></td></tr>';

    fetch(`${API_URL}/apartados/admin/todos`, { headers: authHeaders() })
        .then(res => res.json())
        .then(lista => {
            apartadosGlobales = lista;
            // Ordenar los más recientes primero
            apartadosGlobales.sort((a, b) => b.idApartado - a.idApartado);
            renderizarApartados();
        })
        .catch(() => Swal.fire("Error", "No se pudieron cargar los apartados.", "error"));
}

function renderizarApartados() {
    const tbody = document.getElementById("tablaApartadosBody");
    const filtro = document.getElementById("busquedaApartado") ? document.getElementById("busquedaApartado").value.toLowerCase() : "";
    
    tbody.innerHTML = "";

    const filtrados = apartadosGlobales.filter(a => 
        a.nombreCliente.toLowerCase().includes(filtro) || 
        a.idApartado.toString().includes(filtro)
    );

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-safe fs-1 d-block mb-3"></i> No se encontraron apartados.</td></tr>`;
        return;
    }

    filtrados.forEach(a => {
        // Estilos de estado
        let badgeClass = 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-50';
        if (a.estado === 'ACTIVO') badgeClass = 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50';
        if (a.estado === 'LIQUIDADO') badgeClass = 'bg-success bg-opacity-10 text-success border border-success border-opacity-50';

        // Porcentaje pagado para la barra de progreso visual
        let porcentaje = (a.montoPagado / a.totalAcordado) * 100;

        let acciones = '';
        if (a.estado === 'ACTIVO') {
            acciones = `
                <button class="btn btn-outline-primary btn-sm rounded-pill fw-bold me-1 shadow-sm px-3" onclick="abonarApartado(${a.idApartado})" title="Ingresar un abono">
                    <i class="bi bi-currency-dollar"></i> Abonar
                </button>
                <button class="btn btn-success btn-sm rounded-pill fw-bold me-1 shadow-sm px-3" onclick="liquidarApartado(${a.idApartado})" title="Marcar pagado por completo">
                    <i class="bi bi-check2-circle"></i> Liquidar
                </button>
                <button class="btn btn-light text-danger btn-sm rounded-pill fw-bold border shadow-sm px-3" onclick="cancelarApartado(${a.idApartado})">
                    <i class="bi bi-trash3"></i>
                </button>
            `;
        } else {
            acciones = `<span class="badge bg-light text-muted border px-3 py-2 rounded-pill"><i class="bi bi-check-all fs-6"></i> Finalizado</span>`;
        }

        tbody.innerHTML += `
            <tr style="transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
                <td class="ps-4 fw-bolder text-dark">#${a.idApartado}</td>
                <td>
                    <div class="fw-bold text-dark">${a.nombreCliente}</div>
                    <small class="text-muted"><i class="bi bi-envelope me-1"></i>${a.emailCliente}</small>
                </td>
                <td>
                    <div class="fw-bold text-secondary text-truncate" style="max-width: 200px;" title="${a.nombreProducto}">${a.nombreProducto}</div>
                    <span class="badge bg-light text-dark border px-2 py-1 mt-1">${a.variacionNombre || 'Único'} <span class="text-primary">x${a.cantidad}</span></span>
                </td>
                <td class="text-center">
                    <div class="d-flex justify-content-between small fw-bold mb-1">
                        <span class="text-success">$${a.montoPagado.toFixed(2)} pagado</span>
                        <span class="text-danger">-$${a.saldoPendiente.toFixed(2)} restante</span>
                    </div>
                    <div class="progress" style="height: 6px; border-radius: 10px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${porcentaje}%"></div>
                    </div>
                    <div class="small fw-bolder mt-1 text-dark">Total: $${a.totalAcordado.toFixed(2)}</div>
                </td>
                <td class="text-center">
                    <span class="badge ${badgeClass} rounded-pill px-3 py-2 shadow-sm">${a.estado}</span>
                </td>
                <td class="pe-4 text-end">
                    ${acciones}
                </td>
            </tr>`;
    });
}

// 🟢 NUEVA FUNCIÓN: Ingresar un Abono Parcial
async function abonarApartado(id) {
    const apartado = apartadosGlobales.find(a => a.idApartado === id);
    if (!apartado) return;

    const { value: monto } = await Swal.fire({
        title: 'Registrar Abono',
        html: `
            <div class="mb-3 text-start">
                <span class="d-block small text-muted text-uppercase fw-bold">Cliente</span>
                <strong class="text-dark">${apartado.nombreCliente}</strong>
            </div>
            <div class="alert alert-warning border-0 shadow-sm rounded-3">
                <span class="d-block small text-dark mb-1">Saldo pendiente por pagar:</span>
                <h3 class="m-0 text-danger fw-bolder">$${apartado.saldoPendiente.toFixed(2)}</h3>
            </div>
            <p class="small text-muted mb-2">Ingresa la cantidad que el cliente va a abonar hoy:</p>
        `,
        input: 'number',
        inputAttributes: {
            min: 0.01,
            max: apartado.saldoPendiente,
            step: 0.01,
            placeholder: 'Ej. 10.00'
        },
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-cash me-1"></i> Registrar Pago',
        cancelButtonText: 'Cancelar'
    });

    if (monto) {
        // Aseguramos que no se abone más de la cuenta ni valores negativos
        const abonoParseado = parseFloat(monto);
        if (abonoParseado <= 0 || abonoParseado > apartado.saldoPendiente) {
            return Swal.fire("Monto Inválido", "El abono debe ser mayor a 0 y no puede superar el saldo pendiente.", "warning");
        }

        Swal.fire({ title: 'Procesando pago...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
            const res = await fetch(`${API_URL}/apartados/${id}/abonar`, { 
                method: 'POST', // Cambiamos a POST según tu controlador
                headers: authHeaders(),
                // Enviamos el objeto JSON tal como lo espera tu AbonoRequest
                body: JSON.stringify({ 
                    monto: abonoParseado 
                }) 
            });
            
            if (res.ok) {
                Swal.fire("¡Abono Registrado!", `Se han abonado $${abonoParseado.toFixed(2)} correctamente.`, "success");
                cargarApartados();
            } else {
                // Si el backend lanza alguna validación (ej. "Monto excede la deuda")
                const errorTexto = await res.text();
                Swal.fire("Error", errorTexto || "No se pudo registrar el abono.", "error");
            }
        } catch (err) {
            Swal.fire("Error", "Problema de conexión con el servidor.", "error");
        }
    }
}

function liquidarApartado(id) {
    Swal.fire({
        title: '¿Liquidar apartado?',
        text: 'Se marcará como completamente pagado y entregado.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        confirmButtonText: 'Sí, liquidar'
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            fetch(`${API_URL}/apartados/admin/${id}/liquidar`, { method: 'PUT', headers: authHeaders() })
                .then(res => {
                    if (res.ok) { Swal.fire("Liquidado", "El apartado ha sido liquidado exitosamente.", "success"); cargarApartados(); }
                    else { return res.text().then(t => { throw new Error(t); }); }
                })
                .catch(err => Swal.fire("Error", err.message, "error"));
        }
    });
}

function cancelarApartado(id) {
    Swal.fire({
        title: '¿Cancelar apartado?',
        text: 'Se devolverá el stock al inventario y se anulará la reserva.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, cancelar apartado'
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            fetch(`${API_URL}/apartados/admin/${id}/cancelar`, { method: 'PUT', headers: authHeaders() })
                .then(res => {
                    if (res.ok) { Swal.fire("Cancelado", "El apartado ha sido cancelado y el stock devuelto.", "success"); cargarApartados(); }
                    else { return res.text().then(t => { throw new Error(t); }); }
                })
                .catch(err => Swal.fire("Error", err.message, "error"));
        }
    });
}