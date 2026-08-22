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
    tbody.innerHTML = filtrados.length === 0 ? `<tr><td colspan="5" class="text-center py-5">No hay promociones activas.</td></tr>` : "";

    filtrados.forEach(p => {
        const precioFinal = p.precio - (p.precio * (p.descuento / 100));
        tbody.innerHTML += `
            <tr>
                <td class="px-4"><img src="${p.imagenesUrls[0] || 'https://via.placeholder.com/50'}" class="rounded shadow-sm" style="width: 50px; height: 50px; object-fit: cover;"></td>
                <td><h6 class="fw-bold mb-0">${p.nombre}</h6><small class="text-muted">${p.categoria?.nombre || 'General'}</small></td>
                <td class="text-center"><span class="badge bg-danger">-${p.descuento}%</span></td>
                <td><span class="text-muted text-decoration-line-through small">$${p.precio.toFixed(2)}</span><br><span class="fw-bold text-success">$${precioFinal.toFixed(2)}</span></td>
                <td class="px-4 text-end"><button class="btn btn-outline-danger btn-sm rounded-pill" onclick="quitarDescuento(${p.idProducto})">Quitar</button></td>
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