if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

let paginaActual = 0;
const tamañoPagina = 10;
let timeoutBusqueda = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarClientes();
});

// Lógica de búsqueda con retraso para no saturar el backend
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
        // En tu controlador tienes /usuario/clientes o /usuario/todos, usa el que corresponda.
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
    tbody.innerHTML = lista.length === 0 ? `<tr><td colspan="4" class="text-center py-5 text-muted">No se encontraron clientes.</td></tr>` : "";

    lista.forEach(c => {
        // 👇 LA LÓGICA INTELIGENTE PARA EL AVATAR 👇
        // Usamos la misma ruta que configuraste en WebConfig (/uploads/)
        const avatarUrl = c.fotoUrl 
            ? `${API_URL}/uploads/avatars/${c.fotoUrl}` 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre)}&background=0d6efd&color=fff`;

        // Agregué la clase 'object-fit-cover' a la imagen para que las fotos subidas no se deformen
        tbody.innerHTML += `
            <tr>
                <td class="px-4 py-3">
                    <div class="d-flex align-items-center">
                        <img src="${avatarUrl}" class="rounded-circle me-3 border shadow-sm object-fit-cover" width="40" height="40">
                        <h6 class="fw-bold mb-0 text-dark">${c.nombre}</h6>
                    </div>
                </td>
                <td>
                    <div class="small fw-semibold text-dark"><i class="bi bi-envelope me-1"></i> ${c.email}</div>
                    <div class="small text-muted"><i class="bi bi-phone me-1"></i> ${c.telefono || 'Sin teléfono'}</div>
                </td>
                <td><span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill px-3">Activo</span></td>
                <td class="text-center">
                    <span class="badge bg-light text-primary border border-primary-subtle px-3 rounded-pill shadow-sm">
                        ${c.totalPedidos || 0} compras
                    </span>
                </td>
            </tr>`;
    });
}

function renderizarPaginacion(data) {
    const container = document.getElementById("paginationContainer");
    container.innerHTML = "";

    const ul = document.createElement("ul");
    ul.className = "pagination justify-content-center mb-0 gap-2";

    ul.innerHTML += `
        <li class="page-item ${data.first ? 'disabled' : ''}">
            <button class="page-link border shadow-sm rounded-pill px-3" onclick="cargarClientes(${paginaActual - 1})">
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
        <li class="page-item disabled">
            <span class="page-link border-0 bg-transparent text-dark fw-bold">
                Página ${data.number + 1} de ${data.totalPages || 1}
            </span>
        </li>
        <li class="page-item ${data.last ? 'disabled' : ''}">
            <button class="page-link border shadow-sm rounded-pill px-3" onclick="cargarClientes(${paginaActual + 1})">
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>`;

    container.appendChild(ul);
}