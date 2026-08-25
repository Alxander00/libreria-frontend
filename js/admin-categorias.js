let idCategoriaGlobal = null; 
let todasLasCategorias = []; 

document.addEventListener("DOMContentLoaded", () => {
    if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";
    cargarCategorias();
});

async function cargarCategorias() {
    try {
        const res = await fetch(`${API_URL}/categoria`);
        if (res.ok) {
            todasLasCategorias = await res.json();
            renderizarTablaCategorias();
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

function renderizarTablaCategorias() {
    const tbody = document.getElementById("tablaCategoriasBody");
    tbody.innerHTML = "";

    if (todasLasCategorias.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-5 text-muted border-0"><i class="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>No hay categorías creadas.</td></tr>`;
        return;
    }

    todasLasCategorias.forEach((c, index) => {
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(0, 0, 0, 0.04); transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
                <td class="ps-4 py-3 border-0 text-muted fw-bold">#${index + 1}</td>
                <td class="py-3 border-0">
                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill shadow-sm fs-6">
                        ${c.nombre}
                    </span>
                </td>
                <td class="pe-4 py-3 border-0 text-end text-nowrap">
                    <button class="btn btn-light text-warning border rounded-circle shadow-sm me-1" style="width: 38px; height: 38px; padding: 0;" onclick="editarCategoria(${c.idCategoria})" title="Editar">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn btn-light text-danger border rounded-circle shadow-sm" style="width: 38px; height: 38px; padding: 0;" onclick="eliminarCategoria(${c.idCategoria})" title="Eliminar">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

async function guardarCategoria() {
    const nombre = document.getElementById("nombreCategoria").value.trim();
    if (!nombre) return Swal.fire("Atención", "El nombre es obligatorio.", "warning");

    let url = `${API_URL}/categoria`;
    let method = 'POST';
    if (idCategoriaGlobal) {
        url = `${API_URL}/categoria/${idCategoriaGlobal}`;
        method = 'PUT';
    }

    try {
        Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ nombre: nombre })
        });

        if (res.ok) {
            Swal.fire("¡Éxito!", idCategoriaGlobal ? "Categoría actualizada" : "Categoría creada", "success");
            cancelarEdicion();
            cargarCategorias();
        }
    } catch (error) { console.error(error); }
}

function editarCategoria(id) {
    const categoria = todasLasCategorias.find(c => c.idCategoria === id);
    if (!categoria) return;

    idCategoriaGlobal = id; 
    document.getElementById("nombreCategoria").value = categoria.nombre;
    document.getElementById("txtTituloForm").innerText = "Editando Categoría";
    document.getElementById("btnGuardar").innerHTML = `<i class="bi bi-check-circle me-1"></i> Guardar Cambios`;
    document.getElementById("btnGuardar").className = "btn btn-warning w-100 fw-bold shadow-sm rounded-pill py-2";
    document.getElementById("btnCancelar").classList.remove("d-none");
}

function cancelarEdicion() {
    idCategoriaGlobal = null;
    document.getElementById("nombreCategoria").value = "";
    document.getElementById("txtTituloForm").innerText = "Crear Nueva Categoría";
    document.getElementById("btnGuardar").innerHTML = `<i class="bi bi-plus-lg me-1"></i> Crear Categoría`;
    document.getElementById("btnGuardar").className = "btn btn-primary w-100 fw-bold shadow-sm rounded-pill py-2";
    document.getElementById("btnCancelar").classList.add("d-none");
}

async function eliminarCategoria(id) {
    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Se eliminará la categoría permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar'
    });

    if (confirmacion.isConfirmed) {
        try {
            const res = await fetch(`${API_URL}/categoria/${id}`, {
                method: 'DELETE',
                headers: authHeaders()
            });
            if (res.ok) {
                Swal.fire("Eliminada", "La categoría ha sido removida.", "success");
                cargarCategorias();
            }
        } catch (error) { console.error(error); }
    }
}