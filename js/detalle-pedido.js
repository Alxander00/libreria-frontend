if (!getToken()) window.location.href = "index.html";

const params = new URLSearchParams(window.location.search);
const pedidoId = params.get("id");

document.addEventListener("DOMContentLoaded", () => {
    cargarDetalle();
});

async function cargarDetalle() {
    try {
        const res = await fetch(`${API_URL}/pedidos/${pedidoId}`, { headers: authHeaders() });
        const pedido = await res.json();
        renderPedido(pedido);
    } catch (e) {
        window.location.href = "mis-pedidos.html";
    }
}

function renderPedido(pedido) {
    document.getElementById("pedidoId").textContent = `#${pedido.idPedido}`;
    document.getElementById("pedidoFecha").textContent = new Date(pedido.fecha).toLocaleString();

    const estadoSpan = document.getElementById("pedidoEstado");
    estadoSpan.textContent = pedido.estado;
    estadoSpan.className = `badge rounded-pill px-3 border ${badgeEstado(pedido.estado)}`;

    const detalleBody = document.getElementById("detalleBody");
    detalleBody.innerHTML = "";

    let subtotalItemsCalculado = 0;
    
    pedido.items.forEach(item => {
        subtotalItemsCalculado += item.subtotal; 
        
        const tieneDescuentoIndividual = item.descuento && item.descuento > 0;
        const badgeRed = tieneDescuentoIndividual ? `<span class="badge bg-danger rounded-pill ms-1">-${item.descuento}%</span>` : '';

        // 👇 LA MAGIA DE LAS TALLAS Y COLORES PARA EL CLIENTE 👇
        // Como item.producto viene como string desde tu DTO (Ej: "Camisa (Azul)"), 
        // usaremos directamente el nombre que armaste en el backend.
        let nombreProductoCompleto = item.producto;

        detalleBody.innerHTML += `
            <tr>
                <td class="ps-4 py-3">
                    <div class="fw-bold text-dark mb-1"><i class="bi bi-check-circle-fill text-success me-2"></i>${nombreProductoCompleto} ${badgeRed}</div>
                </td>
                <td class="text-secondary">$${item.precio.toFixed(2)}</td>
                <td class="text-center fw-bold">${item.cantidad}</td>
                <td class="pe-4 text-end fw-bold text-primary">$${item.subtotal.toFixed(2)}</td>
            </tr>`;
    });

    const costoEnvio = pedido.costoEnvio || 0;
    const totalPagado = pedido.total;

    const ahorroCalculado = (subtotalItemsCalculado + costoEnvio) - totalPagado;

    document.getElementById("pedidoSubtotal").textContent = `$${subtotalItemsCalculado.toFixed(2)}`;
    document.getElementById("pedidoEnvio").textContent = costoEnvio > 0 ? `+$${costoEnvio.toFixed(2)}` : "Gratis";
    document.getElementById("pedidoTotal").textContent = `$${totalPagado.toFixed(2)}`;

    if (ahorroCalculado > 0.01) {
        document.getElementById("filaAhorro").classList.remove("d-none");
        document.getElementById("pedidoAhorro").textContent = `-$${ahorroCalculado.toFixed(2)}`;
    }

    document.getElementById("pedidoMetodo").innerHTML = pedido.metodoEntrega === "ENVIO" ? '<i class="bi bi-truck me-2"></i>Envío a Domicilio' : '<i class="bi bi-shop me-2"></i>Retiro en Tienda';
    document.getElementById("pedidoDireccion").textContent = pedido.direccion;
}

function badgeEstado(estado) {
    switch (estado) {
        case "PENDIENTE": return "bg-warning bg-opacity-10 text-warning border-warning";
        case "ENTREGADO": return "bg-success bg-opacity-10 text-success border-success";
        case "CANCELADO": return "bg-danger bg-opacity-10 text-danger border-danger";
        default: return "bg-primary bg-opacity-10 text-primary border-primary";
    }
}