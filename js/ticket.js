document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pedidoId = urlParams.get('id');

    if (!pedidoId) {
        alert("ID de pedido no encontrado en la URL");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
            method: 'GET',
            headers: authHeaders()
        });

        if (!res.ok) {
            const errorTexto = await res.text();
            throw new Error(errorTexto || "Error al obtener el detalle");
        }

        const data = await res.json();

        // Rellenar datos
        document.getElementById('lbl-id').innerText = `#${data.idPedido}`;
        document.getElementById('lbl-fecha').innerText = data.fecha;
        document.getElementById('lbl-cliente').innerText = data.nombreCliente || "Cliente General";
        document.getElementById('lbl-control').innerText = data.numeroControl || "SIMULADO";
        document.getElementById('lbl-total').innerText = data.total.toFixed(2);

        if (data.codigoQr) {
            document.getElementById('img-qr').src = data.codigoQr;
        }

        const tbody = document.getElementById('tabla-items');
        tbody.innerHTML = data.items.map(i => `
            <tr>
                <td>${i.cantidad}</td>
                <td>${i.producto}</td>
                <td>$${i.subtotal.toFixed(2)}</td>
            </tr>
        `).join('');

    } catch (e) {
        console.error("Detalle del error:", e);
        alert("No se pudo cargar la información del recibo electrónico.");
    }
});