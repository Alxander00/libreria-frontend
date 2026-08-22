// ==========================================
// js/admin-listas.js - Gestión de Listas (Admin)
// ==========================================
if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

document.addEventListener("DOMContentLoaded", cargarListasAdmin);

function cargarListasAdmin() {
    const tbody = document.getElementById("tablaListasBody");
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';

    fetch(`${API_URL}/lista/admin/todas`, { headers: authHeaders() })
        .then(res => {
            if (!res.ok) throw new Error('Error al cargar listas');
            return res.json();
        })
        .then(listas => {
            tbody.innerHTML = "";
            if (listas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted">No hay listas creadas.</td></tr>';
                return;
            }
            listas.forEach(l => {
                const badgeClass = l.estado === 'PENDIENTE' ? 'bg-warning' : (l.estado === 'ARMADO' ? 'bg-success' : 'bg-secondary');
                const productosStr = l.detalles.map(d => `${d.productoNombre} x${d.cantidadSolicitada}`).join(', ');

                let acciones = '';
                if (l.estado === 'PENDIENTE') {
                    acciones = `<button class="btn btn-success btn-sm rounded-pill fw-bold" onclick="armarLista(${l.idLista})"><i class="bi bi-box-seam me-1"></i> Armar</button>`;
                } else if (l.estado === 'ARMADO') {
                    acciones = `<button class="btn btn-primary btn-sm rounded-pill fw-bold" onclick="retirarLista(${l.idLista})"><i class="bi bi-check2-circle me-1"></i> Retirar</button>`;
                } else {
                    acciones = `<span class="text-muted">Completado</span>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">#${l.idLista}</td>
                        <td>${l.nombreCliente}<br><small class="text-muted">${l.emailCliente}</small></td>
                        <td>${l.grado} (${l.anio})</td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${productosStr}">${productosStr}</td>
                        <td><span class="badge ${badgeClass} rounded-pill px-3">${l.estado}</span></td>
                        <td>${acciones}</td>
                    </tr>`;
            });
        })
        .catch(err => {
            console.error(err);
            Swal.fire("Error", "No se pudieron cargar las listas.", "error");
        });
}

function armarLista(id) {
    Swal.fire({
        title: '¿Armar esta lista?',
        text: 'Se descontará el stock de los productos.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        confirmButtonText: 'Sí, armar'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`${API_URL}/lista/admin/${id}/armar`, { method: 'PUT', headers: authHeaders() })
                .then(res => {
                    if (res.ok) {
                        Swal.fire("¡Listo!", "La lista ha sido armada. El cliente recibirá un correo.", "success");
                        cargarListasAdmin();
                    } else {
                        return res.text().then(t => { throw new Error(t); });
                    }
                })
                .catch(err => {
                    console.error(err);
                    Swal.fire("Error", err.message || "Stock insuficiente.", "error");
                });
        }
    });
}

function retirarLista(id) {
    Swal.fire({
        title: '¿Marcar como retirado?',
        text: 'Confirma que el cliente ya recogió su lista.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        confirmButtonText: 'Sí, retirar'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`${API_URL}/lista/admin/${id}/retirar`, { method: 'PUT', headers: authHeaders() })
                .then(res => {
                    if (res.ok) {
                        Swal.fire("¡Completado!", "Lista marcada como retirada.", "success");
                        cargarListasAdmin();
                    } else {
                        Swal.fire("Error", "No se pudo actualizar.", "error");
                    }
                })
                .catch(err => {
                    console.error(err);
                    Swal.fire("Error", "Problema de conexión.", "error");
                });
        }
    });
}