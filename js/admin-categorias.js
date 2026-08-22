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
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>No hay categorías creadas.</td></tr>`;
        return;
    }

    // 👇 Usamos (c, index) para obtener la posición de cada categoría
    todasLasCategorias.forEach((c, index) => {
        tbody.innerHTML += `
            <tr>
                <td class="px-4 text-secondary fw-bold">${index + 1}</td>
                <td class="fw-bold text-dark">${c.nombre}</td>
                <td class="px-4 text-end">
                    <button class="btn btn-outline-warning btn-sm rounded-pill px-3 fw-bold shadow-sm me-1" onclick="editarCategoria(${c.idCategoria})">
                        <i class="bi bi-pencil me-1"></i> Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold shadow-sm" onclick="eliminarCategoria(${c.idCategoria})">
                        <i class="bi bi-trash me-1"></i> Eliminar
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