// ==========================================
// js/admin-corte.js - Lógica de Corte Mágico
// ==========================================
if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

let datosPreview = null;

document.addEventListener("DOMContentLoaded", cargarPreview);
document.getElementById("inputEfectivoFisico").addEventListener("input", calcularDiferencia);

function cargarPreview() {
    const container = document.getElementById("previewContainer");
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="text-muted mt-2">Calculando ingresos...</p></div>';

    fetch(`${API_URL}/admin/corte/preview`, { headers: authHeaders() })
        .then(res => res.json())
        .then(data => {
            datosPreview = data;
            
            // Formatear fechas para que se vean bonitas
            const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const fechaIn = new Date(data.fechaInicio).toLocaleDateString('es-ES', options);
            const fechaFi = new Date(data.fechaFin).toLocaleDateString('es-ES', options);

            container.innerHTML = `
                <div class="row g-3 mb-4">
                    <!-- Efectivo -->
                    <div class="col-md-6 col-lg-3">
                        <div class="bg-success bg-opacity-10 p-3 rounded-4 border-start border-success border-4 h-100 d-flex flex-column justify-content-center">
                            <span class="text-success fw-bold small text-uppercase mb-1"><i class="bi bi-cash me-1"></i> Efectivo</span>
                            <h3 class="fw-bolder text-success m-0">$${data.totalEfectivo.toFixed(2)}</h3>
                        </div>
                    </div>
                    <!-- Tarjeta -->
                    <div class="col-md-6 col-lg-3">
                        <div class="bg-primary bg-opacity-10 p-3 rounded-4 border-start border-primary border-4 h-100 d-flex flex-column justify-content-center">
                            <span class="text-primary fw-bold small text-uppercase mb-1"><i class="bi bi-credit-card me-1"></i> Tarjeta</span>
                            <h3 class="fw-bolder text-primary m-0">$${data.totalTarjeta.toFixed(2)}</h3>
                        </div>
                    </div>
                    <!-- Transferencia -->
                    <div class="col-md-6 col-lg-3">
                        <div class="bg-info bg-opacity-10 p-3 rounded-4 border-start border-info border-4 h-100 d-flex flex-column justify-content-center">
                            <span class="text-info fw-bold small text-uppercase mb-1"><i class="bi bi-bank me-1"></i> Transf.</span>
                            <h3 class="fw-bolder text-info m-0">$${data.totalTransferencia.toFixed(2)}</h3>
                        </div>
                    </div>
                    <!-- Total General -->
                    <div class="col-md-6 col-lg-3">
                        <div class="bg-dark p-3 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-center position-relative overflow-hidden">
                            <i class="bi bi-wallet2 position-absolute text-white opacity-25" style="font-size: 3rem; right: -10px; bottom: -10px;"></i>
                            <span class="text-white-50 fw-bold small text-uppercase mb-1 position-relative z-1">Total Ingresos</span>
                            <h3 class="fw-bolder text-white m-0 position-relative z-1">$${data.totalGeneral.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
                
                <!-- Rango de Fechas -->
                <div class="bg-light p-3 rounded-3 border d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                    <div class="text-muted small"><i class="bi bi-clock-history text-primary me-1"></i> <strong>Desde:</strong> ${fechaIn}</div>
                    <div class="text-muted small"><i class="bi bi-clock-history text-primary me-1"></i> <strong>Hasta:</strong> ${fechaFi}</div>
                </div>
            `;
            
            // Recalcular diferencia si ya había un monto escrito antes de refrescar
            calcularDiferencia();
        })
        .catch(() => Swal.fire("Error", "No se pudo cargar el resumen de ventas.", "error"));
}

function calcularDiferencia() {
    const inputFisico = document.getElementById("inputEfectivoFisico").value;
    const fisico = parseFloat(inputFisico);
    const span = document.getElementById("diferenciaValor");
    
    // Si el campo está vacío, lo reseteamos visualmente
    if (inputFisico.trim() === "" || isNaN(fisico)) {
        span.textContent = "$0.00";
        span.className = "m-0 fw-bolder text-secondary";
        return;
    }

    const sistema = datosPreview?.totalEfectivo || 0;
    const diff = fisico - sistema;
    
    // Mostramos el signo positivo si sobra plata, negativo si falta
    const signo = diff > 0 ? "+" : "";
    span.textContent = `${signo}$${diff.toFixed(2)}`;
    
    // Colores dinámicos: Verde si sobra o está exacto, Rojo si falta
    span.className = `m-0 fw-bolder ${diff >= 0 ? 'text-success' : 'text-danger'}`;
}

function cerrarCaja() {
    const fisico = parseFloat(document.getElementById("inputEfectivoFisico").value);
    
    if (isNaN(fisico) || fisico < 0) {
        return Swal.fire("Atención", "Por favor ingresa el monto válido de efectivo físico contado antes de cerrar.", "warning");
    }

    if (!datosPreview) return;

    const sistema = datosPreview.totalEfectivo;
    const diff = fisico - sistema;
    
    // Mensaje de advertencia dinámico si falta dinero
    let mensajeExtra = diff < 0 
        ? `<br><br><span class="text-danger fw-bold"><i class="bi bi-exclamation-triangle"></i> Faltan $${Math.abs(diff).toFixed(2)} en caja.</span>` 
        : '';

    Swal.fire({
        title: '¿Confirmar Cierre?',
        html: `Se registrará el corte de turno con un total en sistema de <strong>$${datosPreview.totalGeneral.toFixed(2)}</strong>.${mensajeExtra}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, Cerrar Caja',
        cancelButtonText: 'Revisar de nuevo'
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Procesando cierre...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            fetch(`${API_URL}/admin/corte/cerrar`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ efectivoEnCaja: fisico })
            })
            .then(res => res.json())
            .then(data => {
                Swal.fire({
                    title: "¡Turno Cerrado!",
                    html: `
                        <div class="text-start mt-3">
                            <p class="mb-1"><strong>Folio de Corte:</strong> #${data.idCorte}</p>
                            <p class="mb-1"><strong>Venta Total Sistema:</strong> $${data.totalGeneral.toFixed(2)}</p>
                            <p class="mb-1 text-success"><strong>Efectivo Reportado:</strong> $${data.efectivoEnCaja.toFixed(2)}</p>
                            <hr>
                            <h5 class="fw-bold ${data.diferencia >= 0 ? 'text-success' : 'text-danger'}">
                                ${data.diferencia >= 0 ? 'Sobrante / Cuadre:' : 'Faltante:'} $${data.diferencia.toFixed(2)}
                            </h5>
                        </div>
                    `,
                    icon: "success"
                });
                cargarPreview();
                document.getElementById("inputEfectivoFisico").value = "";
                document.getElementById("diferenciaValor").textContent = "$0.00";
                document.getElementById("diferenciaValor").className = "m-0 fw-bolder text-secondary";
            })
            .catch(err => Swal.fire("Error", "No se pudo cerrar la caja. Verifica tu conexión.", "error"));
        }
    });
}