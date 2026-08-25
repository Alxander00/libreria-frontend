// ==========================================
// js/admin-reportes.js - Historial y Excel Mágico
// ==========================================
if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

document.addEventListener("DOMContentLoaded", cargarHistorial);

function cargarHistorial() {
    const tbody = document.getElementById("tablaHistorialBody");
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5"><div class="spinner-border text-primary"></div><p class="text-muted mt-2 mb-0">Buscando registros...</p></td></tr>';

    const inicio = document.getElementById("filtroInicio").value;
    const fin = document.getElementById("filtroFin").value;

    let url = `${API_URL}/admin/corte/historial`;
    const params = new URLSearchParams();
    if (inicio) params.append("inicio", inicio);
    if (fin) params.append("fin", fin);
    if (params.toString()) url += "?" + params.toString();

    fetch(url, { headers: authHeaders() })
        .then(res => {
            if (!res.ok) throw new Error('Error al cargar historial');
            return res.json();
        })
        .then(data => {
            tbody.innerHTML = "";
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1 d-block mb-3"></i> No se encontraron cortes en este período.</td></tr>';
                return;
            }
            
            // Ordenar por ID descendente
            data.sort((a, b) => b.idCorte - a.idCorte);

            data.forEach(c => {
                // Configurar cuadre de caja y diferencia
                const diffClase = c.diferencia >= 0 ? 'text-success bg-success' : 'text-danger bg-danger';
                const diffSigno = c.diferencia > 0 ? '+' : '';
                
                // Formatear las fechas de forma súper limpia (Ej: 24 Ago 2026 | 08:00 - 16:30)
                const dApertura = new Date(c.fechaApertura);
                const dCierre = new Date(c.fechaCierre);
                
                const fechaDia = dApertura.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                const horaApe = dApertura.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const horaCie = dCierre.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                tbody.innerHTML += `
                    <tr style="transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
                        <td class="ps-4 fw-bolder text-dark">#${c.idCorte}</td>
                        
                        <!-- Columna de Turno Súper Limpia -->
                        <td>
                            <div class="fw-bold text-dark mb-1">${fechaDia}</div>
                            <span class="badge bg-light text-muted border"><i class="bi bi-clock me-1"></i> ${horaApe} a ${horaCie}</span>
                        </td>
                        
                        <!-- Desglose Separado -->
                        <td class="fw-bold text-success">$${c.totalEfectivo.toFixed(2)}</td>
                        <td class="fw-bold text-primary">$${c.totalTarjeta.toFixed(2)}</td>
                        <td class="fw-bold text-info">$${c.totalTransferencia.toFixed(2)}</td>
                        
                        <td class="fw-bolder text-dark fs-6">$${c.totalGeneral.toFixed(2)}</td>
                        
                        <!-- Columna de Cuadre Consolidada -->
                        <td class="text-center">
                            <div class="small text-muted fw-bold mb-1" title="Efectivo físico contado">Físico: $${c.efectivoEnCaja.toFixed(2)}</div>
                            <span class="badge ${diffClase} bg-opacity-10 border border-opacity-25 px-2 py-1 rounded-pill w-100 shadow-sm">
                                ${diffSigno}$${c.diferencia.toFixed(2)}
                            </span>
                        </td>
                        
                        <td class="pe-4 text-end text-muted small fw-bold">
                            <i class="bi bi-person-circle text-primary me-1"></i>${c.usuarioCierre}
                        </td>
                    </tr>`;
            });
        })
        .catch(err => {
            Swal.fire("Error", "No se pudo cargar el historial.", "error");
        });
}

function exportarExcel() {
    const desde = document.getElementById("filtroInicio").value;
    const hasta = document.getElementById("filtroFin").value;
    
    let url = `${API_URL}/admin/reportes/ventas/excel`;
    const params = new URLSearchParams();
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);
    if (params.toString()) url += "?" + params.toString();
    
    window.open(url, "_blank");
}