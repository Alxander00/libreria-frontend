if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

let paginaActual = 0;
const tamañoPagina = 10;
let timeoutBusqueda = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarClientes();
});

function buscarClientes() {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
        cargarClientes(0); 
    }, 400);
}

async function cargarClientes(pagina = 0) {
    paginaActual = pagina;
    const buscar = document.getElementById("buscadorClientes").value.trim();

    try {
        const res = await fetch(`${API_URL}/usuario/todos?page=${paginaActual}&size=${tamañoPagina}&buscar=${buscar}`, { 
            headers: authHeaders() 
        });
        
        if (res.ok) {
            const data = await res.json(); 
            renderizarTablaClientes(data.content);
            renderizarPaginacion(data);
            document.getElementById("totalClientes").innerText = data.totalElements;
        }
    } catch (error) { console.error("Error cargando clientes:", error); }
}

function renderizarTablaClientes(lista) {
    const tbody = document.getElementById("tablaClientesBody");
    tbody.innerHTML = lista.length === 0 ? `<tr><td colspan="4" class="text-center py-5 text-muted"><i class="bi bi-people display-4 d-block mb-3 opacity-25"></i>No se encontraron clientes.</td></tr>` : "";

    lista.forEach(c => {
        const avatarUrl = c.fotoUrl 
            ? `${API_URL}/uploads/avatars/${c.fotoUrl}` 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre)}&background=0d6efd&color=fff`;

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(0, 0, 0, 0.04); transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
                <td class="ps-4 py-3 border-0">
                    <div class="d-flex align-items-center">
                        <img src="${avatarUrl}" class="rounded-circle me-3 border shadow-sm object-fit-cover p-1 bg-white" width="45" height="45">
                        <h6 class="fw-bolder mb-0 text-dark">${c.nombre}</h6>
                    </div>
                </td>
                <td class="py-3 border-0">
                    <div class="small fw-semibold text-secondary"><i class="bi bi-envelope text-primary me-1"></i> ${c.email}</div>
                    <div class="small text-muted mt-1"><i class="bi bi-telephone text-primary me-1"></i> ${c.telefono || 'Sin teléfono'}</div>
                </td>
                <td class="py-3 border-0">
                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50 rounded-pill px-3 py-2 shadow-sm"><i class="bi bi-check-circle me-1"></i>Activo</span>
                </td>
                <td class="pe-4 py-3 border-0 text-center">
                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill shadow-sm">
                        <i class="bi bi-bag-check me-1"></i> ${c.totalPedidos || 0} compras
                    </span>
                </td>
            </tr>`;
    });
}

function renderizarPaginacion(data) {
    const container = document.getElementById("paginationContainer");
    container.innerHTML = "";

    // 🟢 LÓGICA INTELIGENTE: Ocultar si solo hay 1 página (o cero)
    if (data.totalPages <= 1) {
        container.classList.remove("p-3", "border-top");
        return; 
    }

    container.classList.add("p-3", "border-top");
    const ul = document.createElement("ul");
    ul.className = "pagination justify-content-center mb-0 gap-2";

    ul.innerHTML += `
        <li class="page-item ${data.first ? 'disabled' : ''}">
            <button class="page-link border-0 bg-light text-primary shadow-sm rounded-circle" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;" onclick="cargarClientes(${paginaActual - 1})">
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
        <li class="page-item disabled d-flex align-items-center px-3">
            <span class="text-muted fw-bold small text-uppercase" style="letter-spacing: 1px;">
                Página ${data.number + 1} de ${data.totalPages}
            </span>
        </li>
        <li class="page-item ${data.last ? 'disabled' : ''}">
            <button class="page-link border-0 bg-light text-primary shadow-sm rounded-circle" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;" onclick="cargarClientes(${paginaActual + 1})">
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>`;

    container.appendChild(ul);
}