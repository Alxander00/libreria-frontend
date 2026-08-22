if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

let datosPreview = null;

document.addEventListener("DOMContentLoaded", cargarPreview);
document.getElementById("inputEfectivoFisico").addEventListener("input", calcularDiferencia);

function cargarPreview() {
    const container = document.getElementById("previewContainer");
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

    fetch(`${API_URL}/admin/corte/preview`, { headers: authHeaders() })
        .then(res => res.json())
        .then(data => {
            datosPreview = data;
            container.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-3">
                        <div class="bg-light p-3 rounded-4 text-center border">
                            <span class="text-muted small">Efectivo</span>
                            <h4 class="fw-bold text-success">$${data.totalEfectivo.toFixed(2)}</h4>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="bg-light p-3 rounded-4 text-center border">
                            <span class="text-muted small">Tarjeta</span>
                            <h4 class="fw-bold text-primary">$${data.totalTarjeta.toFixed(2)}</h4>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="bg-light p-3 rounded-4 text-center border">
                            <span class="text-muted small">Transferencia</span>
                            <h4 class="fw-bold text-info">$${data.totalTransferencia.toFixed(2)}</h4>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="bg-primary text-white p-3 rounded-4 text-center shadow-sm">
                            <span class="text-white-50 small">TOTAL</span>
                            <h4 class="fw-bold text-white">$${data.totalGeneral.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div class="mt-3 text-muted small">
                    <i class="bi bi-clock me-1"></i> Desde: ${new Date(data.fechaInicio).toLocaleString()} hasta ${new Date(data.fechaFin).toLocaleString()}
                </div>
            `;
        })
        .catch(() => Swal.fire("Error", "No se pudo cargar el preview.", "error"));
}

function calcularDiferencia() {
    const fisico = parseFloat(document.getElementById("inputEfectivoFisico").value) || 0;
    const sistema = datosPreview?.totalEfectivo || 0;
    const diff = fisico - sistema;
    const span = document.getElementById("diferenciaValor");
    span.textContent = `$${diff.toFixed(2)}`;
    span.className = diff >= 0 ? 'text-success' : 'text-danger';
}

function cerrarCaja() {
    const fisico = parseFloat(document.getElementById("inputEfectivoFisico").value);
    if (isNaN(fisico) || fisico < 0) {
        return Swal.fire("Error", "Ingresa el monto de efectivo contado.", "warning");
    }

    Swal.fire({
        title: '¿Cerrar caja?',
        text: `Se registrará un corte con total de $${datosPreview.totalGeneral.toFixed(2)}.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        confirmButtonText: 'Sí, cerrar'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`${API_URL}/admin/corte/cerrar`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ efectivoEnCaja: fisico })
            })
            .then(res => res.json())
            .then(data => {
                Swal.fire({
                    title: "¡Corte cerrado!",
                    html: `
                        ID Corte: #${data.idCorte}<br>
                        Total: $${data.totalGeneral.toFixed(2)}<br>
                        Efectivo en caja: $${data.efectivoEnCaja.toFixed(2)}<br>
                        Diferencia: $${data.diferencia.toFixed(2)}
                    `,
                    icon: "success"
                });
                cargarPreview();
                document.getElementById("inputEfectivoFisico").value = "";
            })
            .catch(err => Swal.fire("Error", "No se pudo cerrar la caja.", "error"));
        }
    });
}