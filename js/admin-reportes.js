if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

function exportarExcel() {
    const desde = document.getElementById("desde").value;
    const hasta = document.getElementById("hasta").value;
    
    let url = `${API_URL}/admin/reportes/ventas/excel`;
    const params = new URLSearchParams();
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);
    if (params.toString()) url += "?" + params.toString();
    
    // Abrir en nueva pestaña o descarga directa
    window.open(url, "_blank");
}