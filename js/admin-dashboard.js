if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

document.addEventListener("DOMContentLoaded", () => {
    // 👇 Solo cargamos estadísticas si estamos en el Dashboard real (evita errores de null)
    if (document.getElementById("statIngresosHoy")) {
        cargarEstadisticas();
    }
    
    // Las notificaciones del menú siempre se cargan en todas las páginas de administración
    actualizarBadgePedidosNav();
    setInterval(actualizarBadgePedidosNav, 30000);
});

async function actualizarBadgePedidosNav() {
    try {
        const res = await fetch(`${API_URL}/pedidos/admin/pendientes/count`, {
            headers: authHeaders() 
        });
        if (res.ok) {
            const cantidad = await res.json(); 
            document.querySelectorAll(".badge-pedidos-nav").forEach(badge => {
                if (cantidad > 0) {
                    badge.textContent = cantidad;
                    badge.classList.remove("d-none"); 
                } else {
                    badge.classList.add("d-none"); 
                }
            });
        }
    } catch (error) { console.error("Error en notificaciones:", error); }
}

async function cargarEstadisticas() {
    try {
        const res = await fetch(`${API_URL}/admin/estadisticas`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Servidor no responde");
        const data = await res.json();

        document.getElementById("statIngresosHoy").innerText = `$${data.ingresosHoy.toFixed(2)}`;
        document.getElementById("statIngresosSemana").innerText = `$${data.ingresosSemana.toFixed(2)}`;
        document.getElementById("statIngresosMes").innerText = `$${data.ingresosMes.toFixed(2)}`;

        renderVentas(data.ventasSemanales);
        renderCategorias(data.categorias);
    } catch (e) {
        console.error(e);
        Swal.fire("Error", "No se pudo conectar con el servidor. Verifica que tu API esté corriendo.", "error");
    }
}

function renderVentas(ventas) {
    const ctx = document.getElementById('graficaVentas').getContext('2d');
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(13, 110, 253, 0.2)');
    gradient.addColorStop(1, 'rgba(13, 110, 253, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ventas.map(v => v.fecha),
            datasets: [{
                label: 'Ventas ($)',
                data: ventas.map(v => v.monto),
                borderColor: '#0d6efd',
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#0d6efd',
                fill: true,
                backgroundColor: gradient,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#6c757d' } },
                y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#6c757d' } }
            }
        }
    });
}

function renderCategorias(categorias) {
    const ctx = document.getElementById('graficaCategorias').getContext('2d');
    const bootstrapPalette = ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#dc3545', '#6c757d'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categorias.map(c => c.nombre),
            datasets: [{
                data: categorias.map(c => c.cantidad),
                backgroundColor: bootstrapPalette,
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } }
            }
        }
    });
}