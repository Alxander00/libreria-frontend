// ==========================================
// js/admin-productos.js - Inventario Mágico
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
        
        // Ordenar los más nuevos primero
        todosLosProductosAdmin.sort((a, b) => b.idProducto - a.idProducto);
        
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
                <td colspan="6" class="text-center py-5 text-muted border-0">
                    <i class="bi bi-box-seam display-1 d-block mb-3 text-secondary opacity-25"></i>
                    No se encontraron productos en el inventario.
                </td>
            </tr>`;
        return;
    }

    productos.forEach(p => {
        const img = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : 'https://placehold.co/80x80/eeeeee/999999?text=Sin+Foto';
        
        let stockDisplay = '0';
        let badgeColor = 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-50'; // Por defecto Agotado

        if (p.variaciones && p.variaciones.length > 0) {
            if (p.variaciones.length === 1 && p.variaciones[0].color === "Único" && p.variaciones[0].talla === "Única") {
                const stockUnico = p.variaciones[0].stock;
                stockDisplay = `${stockUnico} unidades`;
                if (stockUnico > 5) badgeColor = 'bg-success bg-opacity-10 text-success border border-success border-opacity-50';
                else if (stockUnico > 0) badgeColor = 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50';
            } 
            else {
                const stockTotalVariaciones = p.variaciones.reduce((suma, v) => suma + v.stock, 0);
                stockDisplay = `${stockTotalVariaciones} un. (Variado)`;
                if (stockTotalVariaciones > 5) badgeColor = 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-50';
                else if (stockTotalVariaciones > 0) badgeColor = 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50';
            }
        }

        // 🟢 AQUÍ EL CAMBIO: Agregamos border-bottom con opacidad súper baja y py-3 para dar respiro
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(0, 0, 0, 0.04); transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
                <td class="ps-4 py-3 border-0">
                    <img src="${img}" class="rounded-3 shadow-sm bg-white" style="width: 60px; height: 60px; object-fit: cover; padding: 2px; border: 1px solid rgba(0,0,0,0.08);">
                </td>
                <td class="py-3 border-0">
                    <h6 class="fw-bolder mb-1 text-dark">${p.nombre}</h6>
                    <div class="text-muted small text-truncate" style="max-width: 300px;" title="${p.descripcion || ''}">
                        ${p.descripcion || 'Sin descripción detallada'}
                    </div>
                </td>
                <td class="py-3 border-0">
                    <span class="badge bg-light text-secondary border px-3 py-2 rounded-pill"><i class="bi bi-tag-fill me-1"></i>${p.categoria ? p.categoria.nombre : 'General'}</span>
                </td>
                <td class="py-3 border-0">
                    <span class="fw-bolder text-dark fs-6">$${p.precio.toFixed(2)}</span>
                </td>
                <td class="py-3 border-0">
                    <span class="badge ${badgeColor} px-3 py-2 rounded-pill shadow-sm"><i class="bi bi-boxes me-1"></i>${stockDisplay}</span>
                </td>
                <td class="pe-4 py-3 border-0 text-end text-nowrap">
                    <a href="crear-producto.html?id=${p.idProducto}" class="btn btn-light text-primary border rounded-circle shadow-sm me-1" style="width: 38px; height: 38px; padding: 0; line-height: 38px;" title="Editar Producto">
                        <i class="bi bi-pencil-fill"></i>
                    </a>
                    <button class="btn btn-light text-danger border rounded-circle shadow-sm" style="width: 38px; height: 38px; padding: 0; line-height: 38px;" onclick="eliminarProducto(${p.idProducto})" title="Eliminar Producto">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function eliminarProducto(id) {
    Swal.fire({
        title: '¿Confirmar eliminación?',
        text: "El producto será retirado del catálogo y no estará disponible para ventas.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-trash3 me-1"></i> Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Eliminando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const res = await fetch(`${API_URL}/producto/${id}`, {
                    method: 'DELETE',
                    headers: authHeaders()
                });
                if (res.ok) {
                    Swal.fire('¡Eliminado!', 'El producto ha sido retirado correctamente.', 'success');
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