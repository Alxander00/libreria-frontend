if (!getToken()) window.location.href = "index.html";

let apartadoIdAbonar = null;
let modalAbonar = null; // Declaramos la variable vacía primero

document.addEventListener('DOMContentLoaded', () => {
    // Inicializamos el modal aquí adentro, cuando Bootstrap ya está cargado
    modalAbonar = new bootstrap.Modal(document.getElementById('modalAbonar'));
    
    cargarMisApartados();
});

function cargarMisApartados() {
    const container = document.getElementById("apartadosContainer");
    if (!container) return;
    
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';

    fetch(`${API_URL}/apartados/mis-apartados`, { headers: authHeaders() })
        .then(res => res.json())
        .then(lista => {
            container.innerHTML = "";
            if (lista.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-lock display-1 text-muted d-block mb-3"></i>
                        <h5 class="text-muted">No tienes apartados activos</h5>
                        <p class="text-secondary">Aparta un producto para ir pagándolo poco a poco.</p>
                    </div>`;
                return;
            }
            lista.forEach(a => {
                const badgeColor = a.estado === 'ACTIVO' ? 'bg-warning text-dark' : (a.estado === 'LIQUIDADO' ? 'bg-success' : 'bg-danger');
                const btnAbonar = a.estado === 'ACTIVO' ? `<button class="btn btn-success btn-sm rounded-pill fw-bold shadow-sm py-2" onclick="abrirModalAbono(${a.idApartado}, '${a.nombreProducto}', ${a.saldoPendiente})"><i class="bi bi-plus-circle me-1"></i> Abonar</button>` : '';
                container.innerHTML += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card border-0 shadow-sm rounded-4 h-100">
                            <div class="card-body p-4 d-flex flex-column">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h5 class="fw-bold text-dark m-0 text-truncate" style="max-width: 65%;" title="${a.nombreProducto}">${a.nombreProducto}</h5>
                                    <span class="badge ${badgeColor} rounded-pill px-3">${a.estado}</span>
                                </div>
                                <p class="text-muted small mb-3"><i class="bi bi-tag me-1"></i>${a.variacionNombre} <span class="ms-1">x ${a.cantidad}</span></p>
                                <hr class="text-muted opacity-25 my-2">
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-secondary">Total acordado</span>
                                    <span class="fw-bold text-dark">$${a.totalAcordado.toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-secondary">Pagado</span>
                                    <span class="fw-bold text-success">$${a.montoPagado.toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between small mb-3">
                                    <span class="fw-bold text-dark">Saldo pendiente</span>
                                    <span class="fw-bold text-primary fs-6">$${a.saldoPendiente.toFixed(2)}</span>
                                </div>
                                <div class="mt-auto d-grid gap-2">
                                    ${btnAbonar}
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        })
        .catch(() => Swal.fire("Error", "No se pudieron cargar los apartados.", "error"));
}

function abrirModalAbono(id, nombre, saldo) {
    apartadoIdAbonar = id;
    document.getElementById("modalAbonarProducto").textContent = nombre;
    document.getElementById("modalAbonarSaldo").textContent = `$${saldo.toFixed(2)}`;
    document.getElementById("inputMontoAbono").value = "";
    modalAbonar.show();
}

function procesarAbono() {
    const monto = parseFloat(document.getElementById("inputMontoAbono").value);
    if (!monto || monto <= 0) return Swal.fire("Error", "Ingresa un monto válido.", "warning");
    const metodo = document.getElementById("metodoAbono").value;

    Swal.fire({ title: 'Registrando abono...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    fetch(`${API_URL}/apartados/${apartadoIdAbonar}/abonar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ monto, metodoPago: metodo })
    })
    .then(res => {
        if (res.ok) {
            Swal.fire("¡Abono registrado!", "El pago se ha aplicado correctamente.", "success");
            modalAbonar.hide();
            cargarMisApartados();
        } else {
            return res.text().then(t => { throw new Error(t); });
        }
    })
    .catch(err => Swal.fire("Error", err.message, "error"));
}