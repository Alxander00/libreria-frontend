if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

document.addEventListener("DOMContentLoaded", cargarHistorial);

function cargarHistorial() {
    const tbody = document.getElementById("tablaHistorialBody");
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';

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
                tbody.innerHTML = '<tr><td colspan="10" class="text-center py-5 text-muted">No hay cortes registrados.</td></tr>';
                return;
            }
            data.forEach(c => {
                const diffColor = c.diferencia >= 0 ? 'text-success' : 'text-danger';
                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">#${c.idCorte}</td>
                        <td>${new Date(c.fechaApertura).toLocaleString()}</td>
                        <td>${new Date(c.fechaCierre).toLocaleString()}</td>
                        <td>$${c.totalEfectivo.toFixed(2)}</td>
                        <td>$${c.totalTarjeta.toFixed(2)}</td>
                        <td>$${c.totalTransferencia.toFixed(2)}</td>
                        <td class="fw-bold">$${c.totalGeneral.toFixed(2)}</td>
                        <td>$${c.efectivoEnCaja.toFixed(2)}</td>
                        <td class="${diffColor} fw-bold">$${c.diferencia.toFixed(2)}</td>
                        <td>${c.usuarioCierre}</td>
                    </tr>`;
            });
        })
        .catch(err => {
            console.error(err);
            Swal.fire("Error", "No se pudo cargar el historial.", "error");
        });
}