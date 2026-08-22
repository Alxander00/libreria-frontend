// ==========================================
// js/admin-productos.js
// ==========================================
if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

let todosLosProductosAdmin = [];

document.addEventListener("DOMContentLoaded", async () => {
    await cargarCategoriasAdmin();
    await cargarProductos();

    document.getElementById("searchInputAdmin").addEventListener("input", filtrarProductos);
    document.getElementById("categoriaFiltroAdmin").addEventListener("change", filtrarProductos);
});

async function cargarCategoriasAdmin() {
    try {
        const res = await fetch(`${API_URL}/categoria`);
        if (res.ok) {
            const categorias = await res.json();
            const select = document.getElementById("categoriaFiltroAdmin");
            categorias.forEach(c => select.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`);
        }
    } catch (e) {
        console.error("Error cargando categorías:", e);
    }
}

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/producto?size=1000`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Error al cargar productos");
        
        const data = await res.json();
        todosLosProductosAdmin = data.content || data; 
        
        renderTabla(todosLosProductosAdmin);
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudo cargar el inventario", "error");
    }
}

function filtrarProductos() {
    const texto = document.getElementById("searchInputAdmin").value.toLowerCase().trim();
    const categoriaSel = document.getElementById("categoriaFiltroAdmin").value;
    
    const filtrados = todosLosProductosAdmin.filter(p => {
        const coincideNombre = p.nombre.toLowerCase().includes(texto) || (p.descripcion && p.descripcion.toLowerCase().includes(texto));
        const coincideCategoria = categoriaSel === "" || (p.categoria && p.categoria.nombre === categoriaSel);
        
        return coincideNombre && coincideCategoria;
    });

    renderTabla(filtrados);
}

function renderTabla(productos) {
    const tbody = document.getElementById("tablaProductosBody");
    tbody.innerHTML = "";

    if (!productos || productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-search display-6 d-block mb-2 text-secondary opacity-50"></i>
                    No se encontraron productos con esos filtros.
                </td>
            </tr>`;
        return;
    }

    productos.forEach(p => {
        const img = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : 'https://via.placeholder.com/50?text=Sin+Foto';
        
        let stockDisplay = '0';
        let badgeColor = 'bg-danger';

        if (p.variaciones && p.variaciones.length > 0) {
            if (p.variaciones.length === 1 && p.variaciones[0].color === "Único" && p.variaciones[0].talla === "Única") {
                const stockUnico = p.variaciones[0].stock;
                stockDisplay = `${stockUnico} un.`;
                badgeColor = stockUnico > 5 ? 'bg-success' : (stockUnico > 0 ? 'bg-warning text-dark' : 'bg-danger');
            } 
            else {
                const stockTotalVariaciones = p.variaciones.reduce((suma, v) => suma + v.stock, 0);
                stockDisplay = `${stockTotalVariaciones} un. (Variado)`;
                badgeColor = stockTotalVariaciones > 5 ? 'bg-info text-dark' : (stockTotalVariaciones > 0 ? 'bg-warning text-dark' : 'bg-danger');
            }
        }

        tbody.innerHTML += `
            <tr>
                <td class="px-4">
                    <img src="${img}" class="rounded-3 shadow-sm border" style="width: 55px; height: 55px; object-fit: cover;">
                </td>
                <td>
                    <h6 class="fw-bold mb-0 text-dark">${p.nombre}</h6>
                    <small class="text-muted text-truncate d-inline-block" style="max-width: 250px;" title="${p.descripcion || ''}">${p.descripcion || 'Sin descripción'}</small>
                </td>
                <td>
                    <span class="badge bg-light text-secondary border border-secondary-subtle px-2 py-1">${p.categoria ? p.categoria.nombre : 'General'}</span>
                </td>
                <td class="text-success fw-bold">
                    $${p.precio.toFixed(2)}
                </td>
                <td>
                    <span class="badge ${badgeColor} px-2 py-1">${stockDisplay}</span>
                </td>
                <td class="px-4 text-end">
                    <div class="btn-group shadow-sm">
                        <a href="crear-producto.html?id=${p.idProducto}" class="btn btn-light border text-primary btn-sm" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </a>
                        <button class="btn btn-light border text-danger btn-sm" onclick="eliminarProducto(${p.idProducto})" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function eliminarProducto(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "El producto se ocultará de la tienda.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}/producto/${id}`, {
                    method: 'DELETE',
                    headers: authHeaders()
                });
                if (res.ok) {
                    Swal.fire('Eliminado', 'El producto ha sido retirado.', 'success');
                    cargarProductos(); 
                } else {
                    Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
            }
        }
    });
}