// ==========================================
// js/mis-listas.js - Versión mejorada
// ==========================================
if (!getToken()) window.location.href = "index.html";

// Variables globales
let itemsSeleccionados = [];
let productosGlobales = [];
let modalCrear;
let timeoutBusqueda = null;

// ==========================================
// DOCUMENT READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    modalCrear = new bootstrap.Modal(document.getElementById('modalCrearLista'));
    cargarMisListas();
    document.getElementById("btnSalir").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
});

// ==========================================
// CARGAR LISTAS DEL CLIENTE
// ==========================================
function cargarMisListas() {
    const container = document.getElementById("misListasContainer");
    if (!container) return;
    
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';

    fetch(`${API_URL}/lista/mis-listas`, { headers: authHeaders() })
        .then(res => {
            if (!res.ok) throw new Error('Error al cargar listas');
            return res.json();
        })
        .then(listas => {
            container.innerHTML = "";
            if (listas.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-inbox display-1 text-muted d-block mb-3"></i>
                        <h5 class="text-muted">No tienes listas creadas</h5>
                        <p class="text-secondary">Crea una nueva lista para empezar.</p>
                    </div>`;
                return;
            }
            listas.forEach(l => {
                const badgeClass = l.estado === 'PENDIENTE' ? 'bg-warning' : (l.estado === 'ARMADO' ? 'bg-success' : 'bg-secondary');
                const badgeText = l.estado === 'PENDIENTE' ? 'Pendiente' : (l.estado === 'ARMADO' ? 'Lista para retirar' : 'Retirada');
                const productosStr = l.detalles.map(d => `${d.productoNombre} (${d.variacionNombre}) x${d.cantidadSolicitada}`).join(', ');

                container.innerHTML += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card border-0 shadow-sm rounded-4 h-100">
                            <div class="card-body p-4">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <span class="fw-bold fs-5">#${l.idLista}</span>
                                    <span class="badge ${badgeClass} rounded-pill px-3">${badgeText}</span>
                                </div>
                                <div class="mb-2">
                                    <span class="badge bg-light text-dark border me-1"><i class="bi bi-book me-1"></i>${l.grado}</span>
                                    <span class="badge bg-light text-dark border"><i class="bi bi-calendar me-1"></i>${l.anio}</span>
                                </div>
                                <p class="text-muted small mb-1"><i class="bi bi-person me-1"></i>${l.nombreCliente}</p>
                                <hr>
                                <div class="small text-secondary" style="max-height: 80px; overflow-y: auto;">
                                    ${productosStr}
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = '<div class="col-12 text-center py-5 text-danger">Error al cargar tus listas.</div>';
        });
}

// ==========================================
// MOSTRAR MODAL
// ==========================================
function mostrarModalCrearLista() {
    itemsSeleccionados = [];
    document.getElementById("itemsSeleccionados").innerHTML = '<div class="text-muted text-center py-2">Aún no has agregado productos.</div>';
    document.getElementById("contadorItemsSeleccionados").textContent = "0";
    document.getElementById("inputGrado").value = "";
    document.getElementById("inputAnio").value = new Date().getFullYear();
    document.getElementById("resultadosBusqueda").innerHTML = '<span class="text-muted small">Empieza a escribir para buscar productos.</span>';
    modalCrear.show();
}

// ==========================================
// BUSCAR PRODUCTOS EN TIEMPO REAL
// ==========================================
function buscarProductosParaLista() {
    const texto = document.getElementById("searchProductoLista").value.trim();
    clearTimeout(timeoutBusqueda);
    if (texto.length < 2) {
        document.getElementById("resultadosBusqueda").innerHTML = '<span class="text-muted small">Escribe al menos 2 caracteres.</span>';
        return;
    }

    timeoutBusqueda = setTimeout(() => {
        fetch(`${API_URL}/producto?search=${encodeURIComponent(texto)}&size=30`, { headers: authHeaders() })
            .then(res => res.json())
            .then(data => {
                productosGlobales = data.content || data;
                const container = document.getElementById("resultadosBusqueda");
                container.innerHTML = "";
                if (productosGlobales.length === 0) {
                    container.innerHTML = '<span class="text-muted small">No se encontraron productos.</span>';
                    return;
                }
                productosGlobales.forEach(p => {
                    const stockTotal = p.variaciones?.reduce((acc, v) => acc + v.stock, 0) || 0;
                    if (stockTotal === 0) return;
                    const img = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : 'https://via.placeholder.com/50?text=No';
                    container.innerHTML += `
                        <div class="producto-item" onclick="agregarItemLista(${p.idProducto})">
                            <img src="${img}" alt="${p.nombre}" loading="lazy">
                            <div class="info">
                                <div class="nombre">${p.nombre}</div>
                                <div class="precio">$${p.precio.toFixed(2)}</div>
                            </div>
                            <button class="agregar-btn">Agregar</button>
                        </div>
                    `;
                });
                if (container.innerHTML === "") container.innerHTML = '<span class="text-muted small">No hay productos con stock disponible.</span>';
            })
            .catch(err => {
                console.error(err);
                document.getElementById("resultadosBusqueda").innerHTML = '<span class="text-danger small">Error al buscar.</span>';
            });
    }, 400); // Debounce de 400ms
}

// ==========================================
// AGREGAR PRODUCTO A LA LISTA
// ==========================================
function agregarItemLista(idProducto) {
    const p = productosGlobales.find(prod => prod.idProducto === idProducto);
    if (!p) return;

    if (p.variaciones && p.variaciones.length > 0) {
        const varConStock = p.variaciones.filter(v => v.stock > 0);
        if (varConStock.length === 0) {
            Swal.fire("Sin stock", "Este producto no tiene stock disponible.", "warning");
            return;
        }
        if (varConStock.length === 1) {
            agregarItemConVariacion(p, varConStock[0]);
        } else {
            const inputOptions = {};
            varConStock.forEach((v, idx) => {
                let label = v.color !== "Único" ? v.color : '';
                if (v.talla !== "Única") label += (label ? ' - ' : '') + v.talla;
                if (!label) label = 'Único';
                inputOptions[idx] = `${label} (Stock: ${v.stock})`;
            });
            Swal.fire({
                title: `Selecciona variación para ${p.nombre}`,
                input: 'select',
                inputOptions: inputOptions,
                showCancelButton: true,
                confirmButtonText: 'Agregar',
                cancelButtonText: 'Cancelar'
            }).then(result => {
                if (result.isConfirmed && result.value !== undefined) {
                    const idx = parseInt(result.value);
                    agregarItemConVariacion(p, varConStock[idx]);
                }
            });
        }
    } else {
        Swal.fire("Error", "Este producto no tiene stock configurado.", "error");
    }
}

function agregarItemConVariacion(producto, variacion) {
    const existente = itemsSeleccionados.find(i => i.idProducto === producto.idProducto && i.idVariacion === variacion.idVariacion);
    if (existente) {
        existente.cantidad++;
    } else {
        let variacionNombre = 'Único';
        if (variacion.color && variacion.color !== "Único") variacionNombre = variacion.color;
        if (variacion.talla && variacion.talla !== "Única") variacionNombre += (variacionNombre !== 'Único' ? ' - ' : '') + variacion.talla;
        itemsSeleccionados.push({
            idProducto: producto.idProducto,
            idVariacion: variacion.idVariacion,
            nombre: producto.nombre,
            variacionNombre: variacionNombre,
            cantidad: 1,
            precio: producto.precio
        });
    }
    renderizarItemsSeleccionados();
    // Limpiar búsqueda y resultados
    document.getElementById("searchProductoLista").value = "";
    document.getElementById("resultadosBusqueda").innerHTML = '<span class="text-muted small">Empieza a escribir para buscar productos.</span>';
}

function renderizarItemsSeleccionados() {
    const container = document.getElementById("itemsSeleccionados");
    const contador = document.getElementById("contadorItemsSeleccionados");
    if (itemsSeleccionados.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-2">Aún no has agregado productos.</div>';
        contador.textContent = "0";
        return;
    }
    contador.textContent = itemsSeleccionados.length;
    container.innerHTML = itemsSeleccionados.map((item, idx) => `
        <div class="item-seleccionado">
            <div>
                <span class="fw-semibold">${item.nombre}</span>
                <span class="badge-variacion ms-1">${item.variacionNombre}</span>
                <span class="ms-2 text-muted small">x ${item.cantidad}</span>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-secondary rounded-circle" onclick="cambiarCantidadItemLista(${idx}, -1)"><i class="bi bi-dash"></i></button>
                <button class="btn btn-sm btn-outline-secondary rounded-circle" onclick="cambiarCantidadItemLista(${idx}, 1)"><i class="bi bi-plus"></i></button>
                <button class="btn btn-sm btn-danger rounded-circle ms-1" onclick="eliminarItemLista(${idx})"><i class="bi bi-x"></i></button>
            </div>
        </div>
    `).join('');
}

function cambiarCantidadItemLista(idx, delta) {
    const item = itemsSeleccionados[idx];
    if (!item) return;
    if (item.cantidad + delta <= 0) return eliminarItemLista(idx);
    item.cantidad += delta;
    renderizarItemsSeleccionados();
}

function eliminarItemLista(idx) {
    itemsSeleccionados.splice(idx, 1);
    renderizarItemsSeleccionados();
}

// ==========================================
// GUARDAR LISTA
// ==========================================
function guardarLista() {
    if (itemsSeleccionados.length === 0) {
        Swal.fire("Lista vacía", "Agrega al menos un producto.", "warning");
        return;
    }
    const grado = document.getElementById("inputGrado").value.trim();
    if (!grado) {
        Swal.fire("Falta grado", "Indica el grado o nivel.", "warning");
        return;
    }
    const anio = document.getElementById("inputAnio").value.trim() || new Date().getFullYear();

    const payload = {
        grado: grado,
        anio: anio,
        items: itemsSeleccionados.map(i => ({
            idProducto: i.idProducto,
            idVariacion: i.idVariacion,
            cantidad: i.cantidad
        }))
    };

    Swal.fire({ title: 'Enviando lista...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    fetch(`${API_URL}/lista/crear`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (res.ok) {
            Swal.fire("¡Lista enviada!", "Tu lista escolar ha sido registrada. Pronto la armaremos.", "success");
            modalCrear.hide();
            cargarMisListas();
        } else {
            return res.text().then(t => { throw new Error(t); });
        }
    })
    .catch(err => {
        console.error(err);
        Swal.fire("Error", err.message || "No se pudo guardar la lista.", "error");
    });
}