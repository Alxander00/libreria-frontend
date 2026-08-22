if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

document.addEventListener("DOMContentLoaded", cargarApartados);

function cargarApartados() {
    const tbody = document.getElementById("tablaApartadosBody");
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';

    fetch(`${API_URL}/apartados/admin/todos`, { headers: authHeaders() })
        .then(res => res.json())
        .then(lista => {
            tbody.innerHTML = "";
            if (lista.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted">No hay apartados.</td></tr>';
                return;
            }
            lista.forEach(a => {
                const badgeColor = a.estado === 'ACTIVO' ? 'bg-warning' : (a.estado === 'LIQUIDADO' ? 'bg-success' : 'bg-secondary');
                let acciones = '';
                if (a.estado === 'ACTIVO') {
                    acciones = `
                        <button class="btn btn-success btn-sm rounded-pill fw-bold me-1" onclick="liquidarApartado(${a.idApartado})"><i class="bi bi-check2-circle me-1"></i> Liquidar</button>
                        <button class="btn btn-danger btn-sm rounded-pill fw-bold" onclick="cancelarApartado(${a.idApartado})"><i class="bi bi-x-circle me-1"></i> Cancelar</button>
                    `;
                } else {
                    acciones = `<span class="text-muted">Completado</span>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">#${a.idApartado}</td>
                        <td>${a.nombreCliente}<br><small class="text-muted">${a.emailCliente}</small></td>
                        <td>${a.nombreProducto}<br><small>${a.variacionNombre} x${a.cantidad}</small></td>
                        <td>$${a.totalAcordado.toFixed(2)}</td>
                        <td class="text-success">$${a.montoPagado.toFixed(2)}</td>
                        <td class="fw-bold text-primary">$${a.saldoPendiente.toFixed(2)}</td>
                        <td><span class="badge ${badgeColor} rounded-pill px-3">${a.estado}</span></td>
                        <td>${acciones}</td>
                    </tr>`;
            });
        })
        .catch(() => Swal.fire("Error", "No se pudieron cargar los apartados.", "error"));
}

function liquidarApartado(id) {
    Swal.fire({
        title: '¿Liquidar apartado?',
        text: 'Se marcará como completamente pagado.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        confirmButtonText: 'Sí, liquidar'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`${API_URL}/apartados/admin/${id}/liquidar`, { method: 'PUT', headers: authHeaders() })
                .then(res => {
                    if (res.ok) { Swal.fire("Liquidado", "El apartado ha sido liquidado.", "success"); cargarApartados(); }
                    else { return res.text().then(t => { throw new Error(t); }); }
                })
                .catch(err => Swal.fire("Error", err.message, "error"));
        }
    });
}

function cancelarApartado(id) {
    Swal.fire({
        title: '¿Cancelar apartado?',
        text: 'Se devolverá el stock al inventario.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, cancelar'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`${API_URL}/apartados/admin/${id}/cancelar`, { method: 'PUT', headers: authHeaders() })
                .then(res => {
                    if (res.ok) { Swal.fire("Cancelado", "El apartado ha sido cancelado y el stock devuelto.", "success"); cargarApartados(); }
                    else { return res.text().then(t => { throw new Error(t); }); }
                })
                .catch(err => Swal.fire("Error", err.message, "error"));
        }
    });
}