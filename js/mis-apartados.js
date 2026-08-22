if (!getToken()) window.location.href = "index.html";

let apartadoIdAbonar = null;
const modalAbonar = new bootstrap.Modal(document.getElementById('modalAbonar'));

document.addEventListener('DOMContentLoaded', () => {
    cargarMisApartados();
    document.getElementById("btnSalir").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
});

function cargarMisApartados() {
    const container = document.getElementById("apartadosContainer");
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';

    fetch(`${API_URL}/apartados/mis-apartados`, { headers: authHeaders() })
        .then(res => res.json())
        .then(lista => {
            container.innerHTML = "";
            if (lista.length === 0) {
                container.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="bi bi-lock display-1 d-block mb-3"></i>No tienes apartados activos.</div>`;
                return;
            }
            lista.forEach(a => {
                const badgeColor = a.estado === 'ACTIVO' ? 'bg-warning' : (a.estado === 'LIQUIDADO' ? 'bg-success' : 'bg-danger');
                const btnAbonar = a.estado === 'ACTIVO' ? `<button class="btn btn-success btn-sm rounded-pill fw-bold" onclick="abrirModalAbono(${a.idApartado}, '${a.nombreProducto}', ${a.saldoPendiente})"><i class="bi bi-plus-circle me-1"></i> Abonar</button>` : '';
                container.innerHTML += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card border-0 shadow-sm rounded-4 h-100">
                            <div class="card-body p-4">
                                <div class="d-flex justify-content-between">
                                    <h5 class="fw-bold">${a.nombreProducto}</h5>
                                    <span class="badge ${badgeColor} rounded-pill px-3">${a.estado}</span>
                                </div>
                                <p class="text-muted small">${a.variacionNombre} x ${a.cantidad}</p>
                                <hr>
                                <div class="d-flex justify-content-between">
                                    <span>Total</span>
                                    <span class="fw-bold">$${a.totalAcordado.toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Pagado</span>
                                    <span class="text-success">$${a.montoPagado.toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-3">
                                    <span class="fw-bold">Saldo</span>
                                    <span class="fw-bold text-primary">$${a.saldoPendiente.toFixed(2)}</span>
                                </div>
                                <div class="d-grid gap-2">
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