let todosLosProductosPromo = [];

document.addEventListener("DOMContentLoaded", async () => {
    if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";
    
    // 👇 Esperamos a que los datos carguen antes de intentar listar
    await cargarCategoriasYProductos();
    listarDescuentosActivos();
});

async function cargarCategoriasYProductos() {
    try {
        // 1. Cargar Categorías
        const resCat = await fetch(`${API_URL}/categoria`);
        if (resCat.ok) {
            const categorias = await resCat.json();
            const selectCat = document.getElementById("selectCat");
            selectCat.innerHTML = `<option value="" disabled selected>Seleccione una categoría...</option>`;
            categorias.forEach(c => {
                selectCat.innerHTML += `<option value="${c.idCategoria}">${c.nombre}</option>`;
            });
        }

        // 2. Cargar Productos y guardarlos en la variable global
        const resProd = await fetch(`${API_URL}/producto?size=2000`, { headers: authHeaders() });
        if (resProd.ok) {
            const dataProd = await resProd.json();
            todosLosProductosPromo = dataProd.content || dataProd;
            renderizarSelectProductos(todosLosProductosPromo);
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

// BUSCADOR EN TIEMPO REAL
function filtrarProductosPromo() {
    const texto = document.getElementById("buscadorProductoPromo").value.toLowerCase().trim();
    const filtrados = todosLosProductosPromo.filter(p => 
        p.nombre.toLowerCase().includes(texto) || 
        (p.categoria && p.categoria.nombre.toLowerCase().includes(texto))
    );
    renderizarSelectProductos(filtrados);
}

function renderizarSelectProductos(productos) {
    const selectProd = document.getElementById("selectProd");
    if (!selectProd) return;
    selectProd.innerHTML = productos.length === 0 ? `<option disabled>No se encontraron productos...</option>` : "";
    productos.forEach(p => {
        selectProd.innerHTML += `<option value="${p.idProducto}" class="py-2 border-bottom">
            ${p.nombre} — Precio: $${p.precio.toFixed(2)} [${p.categoria ? p.categoria.nombre : 'General'}]
        </option>`;
    });
}

// APLICAR PROMOCIÓN
async function aplicarDescuento(tipo) {
    let payload = { tipo: tipo };
    if(tipo === 'GLOBAL') payload.valor = document.getElementById("descGlobal").value;
    if(tipo === 'CATEGORIA') {
        payload.id = document.getElementById("selectCat").value;
        payload.valor = document.getElementById("descCat").value;
    }
    if(tipo === 'PRODUCTO') {
        payload.id = document.getElementById("selectProd").value;
        payload.valor = document.getElementById("descProd").value;
    }

    if(!payload.valor || payload.valor <= 0 || payload.valor > 100) {
        return Swal.fire("Atención", "Ingresa un porcentaje válido (1 - 100)", "warning");
    }

    try {
        Swal.fire({ title: 'Aplicando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await fetch(`${API_URL}/api/admin/descuentos/aplicar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            Swal.fire("Éxito", "Promoción aplicada", "success");
            await cargarCategoriasYProductos();
            listarDescuentosActivos();
        }
    } catch (e) { console.error(e); }
}

// TABLA DE ACTIVOS
function listarDescuentosActivos() {
    const tbody = document.getElementById("tablaDescuentos");
    if (!tbody) return;
    const filtrados = todosLosProductosPromo.filter(p => p.descuento > 0);
    
    if(filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted border-0"><i class="bi bi-tag display-4 d-block mb-3 opacity-25"></i>No hay promociones activas.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    filtrados.forEach(p => {
        const precioFinal = p.precio - (p.precio * (p.descuento / 100));
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(0, 0, 0, 0.04); transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
                <td class="ps-4 py-3 border-0">
                    <img src="${p.imagenesUrls[0] || 'https://placehold.co/50x50/eeeeee/999999?text=Sin+Foto'}" class="rounded-3 shadow-sm bg-white" style="width: 55px; height: 55px; object-fit: cover; padding: 2px; border: 1px solid rgba(0,0,0,0.08);">
                </td>
                <td class="py-3 border-0">
                    <h6 class="fw-bolder mb-1 text-dark">${p.nombre}</h6>
                    <span class="badge bg-light text-secondary border px-2 py-1"><i class="bi bi-folder-fill me-1"></i>${p.categoria?.nombre || 'General'}</span>
                </td>
                <td class="py-3 border-0 text-center">
                    <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-50 px-3 py-2 rounded-pill fs-6 shadow-sm">
                        -${p.descuento}%
                    </span>
                </td>
                <td class="py-3 border-0">
                    <div class="text-muted text-decoration-line-through small fw-bold">$${p.precio.toFixed(2)}</div>
                    <div class="fw-bolder text-success fs-5">$${precioFinal.toFixed(2)}</div>
                </td>
                <td class="pe-4 py-3 border-0 text-end">
                    <button class="btn btn-light text-danger border rounded-pill shadow-sm px-3 fw-bold" onclick="quitarDescuento(${p.idProducto})" title="Remover descuento">
                        <i class="bi bi-x-circle-fill me-1"></i> Quitar
                    </button>
                </td>
            </tr>`;
    });
}

async function quitarDescuento(idProducto) {
    const res = await fetch(`${API_URL}/api/admin/descuentos/aplicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ tipo: 'PRODUCTO', id: idProducto, valor: 0 })
    });
    if(res.ok) {
        await cargarCategoriasYProductos();
        listarDescuentosActivos();
    }
}

// 👇 LIMPIEZA MASIVA (Mover aquí desde dashboard.js)
async function quitarTodosLosDescuentos() {
    const conf = await Swal.fire({ title: '¿Limpiar tienda?', text: "Se quitarán TODOS los descuentos.", icon: 'warning', showCancelButton: true });
    if (!conf.isConfirmed) return;

    try {
        Swal.fire({ title: 'Limpiando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await fetch(`${API_URL}/api/admin/descuentos/aplicar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ tipo: 'GLOBAL', valor: 0 })
        });
        if (res.ok) {
            Swal.fire("Tienda Limpia", "Se han removido todos los descuentos.", "success");
            await cargarCategoriasYProductos();
            listarDescuentosActivos();
        }
    } catch (e) { console.error(e); }
}