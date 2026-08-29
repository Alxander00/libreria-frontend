// ==========================================
// js/pos.js - Punto de Venta
// ==========================================
if (!getToken()) window.location.href = "index.html";
if (getUserRole() !== "ROLE_ADMIN") window.location.href = "productos.html";

let todosLosProductosPos = [];
let carritoPos = []; // Array local { idProducto, idVariacion, nombre, precio, cantidad, stock, imagen, variacionNombre }

// Cargar datos iniciales
document.addEventListener("DOMContentLoaded", () => {
    // Mostrar nombre del cajero
    const nombre = localStorage.getItem("nombre") || "Admin";
    document.getElementById("cajeroNombre").innerHTML = `<i class="bi bi-person-circle me-1"></i> ${nombre}`;
    
    cargarProductosPos();
});

async function cargarProductosPos() {
    const texto = document.getElementById("searchInputPos").value.trim();
    const grid = document.getElementById("productosGrid");
    grid.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    try {
        let url = `${API_URL}/producto?size=1000&activo=true`;
        if (texto) url += `&search=${encodeURIComponent(texto)}`;
        
        const res = await fetch(url, { headers: authHeaders() });
        const data = await res.json();
        todosLosProductosPos = data.content || data;
        renderizarProductos(todosLosProductosPos);
    } catch (error) {
        grid.innerHTML = `<div class="text-center py-5 text-danger">Error al cargar productos</div>`;
    }
}

function renderizarProductos(productos) {
    const grid = document.getElementById("productosGrid");
    grid.innerHTML = "";

    if (productos.length === 0) {
        grid.innerHTML = `<div class="text-center py-5 text-muted">No se encontraron productos</div>`;
        return;
    }

    productos.forEach(p => {
        const img = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : 'https://via.placeholder.com/150?text=No+Foto';
        
        // Calcular stock total
        let stockTotal = 0;
        let tieneVariaciones = false;
        if (p.variaciones && p.variaciones.length > 0) {
            stockTotal = p.variaciones.reduce((acc, v) => acc + v.stock, 0);
            tieneVariaciones = p.variaciones.length > 1 || 
                (p.variaciones.length === 1 && p.variaciones[0].color !== "Único");
        }

        // Ribbon de descuento
        let badgeDesc = '';
        let precioMostrar = p.precio;
        if (p.descuento > 0) {
            precioMostrar = p.precio - (p.precio * (p.descuento / 100));
            badgeDesc = `<span class="badge bg-danger position-absolute top-0 start-0 m-2">-${p.descuento}%</span>`;
        }

        const sinStock = stockTotal === 0;

        grid.innerHTML += `
            <div class="product-card-pos position-relative ${sinStock ? 'opacity-50' : ''}" 
                 onclick="${sinStock ? '' : `agregarAlCarritoPos(${p.idProducto})`}"
                 title="${sinStock ? 'Sin stock' : 'Click para agregar'}">
                ${badgeDesc}
                <img src="${img}" class="rounded-3 bg-light p-2 mb-2" loading="lazy">
                <h6 class="fw-bold mb-0 text-truncate small">${p.nombre}</h6>
                <span class="fw-bold text-primary">$${precioMostrar.toFixed(2)}</span>
                ${tieneVariaciones ? '<i class="bi bi-palette text-secondary ms-1" title="Tiene colores/tallas"></i>' : ''}
                ${sinStock ? '<div class="badge bg-secondary mt-1 d-block">Agotado</div>' : ''}
            </div>
        `;
    });
}

// ==========================================
// LÓGICA DEL CARRITO LOCAL
// ==========================================

function agregarAlCarritoPos(idProducto) {
    const producto = todosLosProductosPos.find(p => p.idProducto === idProducto);
    if (!producto) return;

    // Si tiene variaciones complejas (más de 1 opción), pedimos seleccionar una
    if (producto.variaciones && producto.variaciones.length > 0) {
        // Si es un producto con colores/tallas, abrimos un modal rápido o alerta
        // Para simplificar, si tiene más de 1 variación, usamos la primera disponible con stock
        const variacionesConStock = producto.variaciones.filter(v => v.stock > 0);
        if (variacionesConStock.length === 0) {
            return Swal.fire("Sin stock", "No hay unidades disponibles de este producto.", "warning");
        }

        // Si solo hay una variación con stock, la usamos
        if (variacionesConStock.length === 1) {
            agregarItemCarrito(producto, variacionesConStock[0]);
        } else {
            // Mostrar opciones en un Swal (rápido para el cajero)
            const opciones = variacionesConStock.map(v => {
                let label = v.color !== "Único" ? v.color : '';
                if (v.talla !== "Única") label += (label ? ' - ' : '') + v.talla;
                if (!label) label = 'Único';
                return `${label} (Stock: ${v.stock})`;
            });

            Swal.fire({
                title: `Selecciona variación para ${producto.nombre}`,
                input: 'select',
                inputOptions: variacionesConStock.reduce((acc, v, idx) => {
                    let label = v.color !== "Único" ? v.color : '';
                    if (v.talla !== "Única") label += (label ? ' - ' : '') + v.talla;
                    if (!label) label = 'Único';
                    acc[idx] = `${label} (Stock: ${v.stock})`;
                    return acc;
                }, {}),
                showCancelButton: true,
                confirmButtonText: 'Agregar',
                cancelButtonText: 'Cancelar'
            }).then(result => {
                if (result.isConfirmed && result.value !== undefined) {
                    const idx = parseInt(result.value);
                    agregarItemCarrito(producto, variacionesConStock[idx]);
                }
            });
        }
    } else {
        // Producto sin variaciones (no debería pasar, pero por si acaso)
        Swal.fire("Error", "Este producto no tiene stock configurado.", "error");
    }
}

function agregarItemCarrito(producto, variacion) {
    // Verificar si ya existe en el carrito (misma variación)
    const existente = carritoPos.find(item => 
        item.idProducto === producto.idProducto && 
        item.idVariacion === variacion.idVariacion
    );

    if (existente) {
        if (existente.cantidad + 1 > variacion.stock) {
            return Swal.fire("Límite alcanzado", `Solo hay ${variacion.stock} unidades disponibles.`, "warning");
        }
        existente.cantidad += 1;
    } else {
        if (variacion.stock <= 0) {
            return Swal.fire("Sin stock", "No hay unidades disponibles.", "warning");
        }
        carritoPos.push({
            idProducto: producto.idProducto,
            idVariacion: variacion.idVariacion,
            nombre: producto.nombre,
            precio: producto.precio - (producto.precio * (producto.descuento / 100)),
            cantidad: 1,
            stock: variacion.stock,
            imagen: (producto.imagenesUrls && producto.imagenesUrls.length > 0) ? producto.imagenesUrls[0] : null,
            variacionNombre: variacion.color !== "Único" ? variacion.color : (variacion.talla !== "Única" ? variacion.talla : '')
        });
    }

    renderizarCarritoPos();
}

function renderizarCarritoPos() {
    const container = document.getElementById("carritoPosItems");
    const totalSpan = document.getElementById("totalPos");
    const contador = document.getElementById("contadorItems");

    if (carritoPos.length === 0) {
        container.innerHTML = `<div class="text-muted text-center py-4">Carrito vacío</div>`;
        totalSpan.textContent = "$0.00";
        contador.textContent = "0";
        return;
    }

    let html = "";
    let total = 0;

    carritoPos.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        const imgSrc = item.imagen || 'https://via.placeholder.com/40?text=No';

        html += `
            <div class="cart-item">
                <img src="${imgSrc}" class="border">
                <div class="flex-grow-1">
                    <div class="fw-bold small text-truncate">${item.nombre}</div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-light text-dark border">${item.variacionNombre || 'Único'}</span>
                        <span class="text-muted small">$${item.precio.toFixed(2)}</span>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-outline-secondary rounded-circle p-0" style="width: 24px; height: 24px;" onclick="cambiarCantidadPos(${index}, -1)">-</button>
                    <span class="fw-bold mx-1" style="min-width: 20px; text-align: center;">${item.cantidad}</span>
                    <button class="btn btn-sm btn-outline-secondary rounded-circle p-0" style="width: 24px; height: 24px;" onclick="cambiarCantidadPos(${index}, 1)">+</button>
                </div>
                <button class="btn btn-sm btn-link text-danger p-0 ms-1" onclick="eliminarItemPos(${index})"><i class="bi bi-x"></i></button>
            </div>
        `;
    });

    container.innerHTML = html;
    totalSpan.textContent = `$${total.toFixed(2)}`;
    contador.textContent = carritoPos.reduce((acc, i) => acc + i.cantidad, 0);
}

function cambiarCantidadPos(index, delta) {
    const item = carritoPos[index];
    if (!item) return;
    const nuevaCant = item.cantidad + delta;
    if (nuevaCant < 1) return;
    if (nuevaCant > item.stock) {
        return Swal.fire("Límite", `Solo hay ${item.stock} unidades.`, "warning");
    }
    item.cantidad = nuevaCant;
    renderizarCarritoPos();
}

function eliminarItemPos(index) {
    carritoPos.splice(index, 1);
    renderizarCarritoPos();
}

function vaciarCarritoPos() {
    if (carritoPos.length === 0) return;
    Swal.fire({
        title: '¿Vaciar carrito?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar'
    }).then(res => {
        if (res.isConfirmed) {
            carritoPos = [];
            renderizarCarritoPos();
        }
    });
}

// ==========================================
// PROCESAR VENTA (ENVIAR AL BACKEND)
// ==========================================
async function procesarVentaPos() {
    if (carritoPos.length === 0) {
        return Swal.fire("Carrito vacío", "Agrega productos antes de cobrar.", "warning");
    }

    const metodoPago = document.getElementById("metodoPagoPos").value;
    const montoRecibido = parseFloat(document.getElementById("montoRecibido").value) || 0;
    const total = carritoPos.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);

    if (montoRecibido < 0) {
        return Swal.fire("Monto Inválido", "No puedes ingresar un valor negativo.", "error");
    }

    if (metodoPago === "EFECTIVO" && montoRecibido < total) {
        return Swal.fire("Monto insuficiente", `El total es $${total.toFixed(2)}. Recibido: $${montoRecibido.toFixed(2)}`, "error");
    }

    const confirmacion = await Swal.fire({
        title: `Confirmar venta por $${total.toFixed(2)}`,
        text: `Método: ${metodoPago}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '✅ Cobrar y Finalizar',
        cancelButtonText: 'Revisar'
    });

    if (!confirmacion.isConfirmed) return;

    const items = carritoPos.map(item => ({
        idProducto: item.idProducto,
        idVariacion: item.idVariacion,
        cantidad: item.cantidad
    }));

    try {
        Swal.fire({ title: 'Procesando venta...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const res = await fetch(`${API_URL}/pedidos/pos/crear`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                items: items,
                metodoPago: metodoPago
            })
        });

        if (res.ok) {
            const pedido = await res.json();
            let mensaje = `Venta #${pedido.idPedido} registrada por $${pedido.total.toFixed(2)}`;
            if (metodoPago === "EFECTIVO" && montoRecibido > total) {
                mensaje += `\nCambio: $${(montoRecibido - total).toFixed(2)}`;
            }

            Swal.fire({
                title: "🎉 ¡Venta Exitosa!",
                text: mensaje,
                icon: "success",
                showCancelButton: true,
                confirmButtonText: "🖨️ Ver / Imprimir Ticket",
                cancelButtonText: "Nueva Venta"
            }).then((result) => {
                if (result.isConfirmed) {
                    // Abre la ventana del ticket con el ID del pedido recién creado
                    window.open(`ticket.html?id=${pedido.idPedido}`, '_blank');
                }
                
                // Limpiar carrito y campo de monto
                carritoPos = [];
                renderizarCarritoPos();
                document.getElementById("montoRecibido").value = "";
                
                // Recargar productos para actualizar stock visual
                cargarProductosPos();
            });

        } else {
            const error = await res.text();
            Swal.fire("Error", error || "No se pudo procesar la venta", "error");
        }
    } catch (e) {
        Swal.fire("Error", "Problemas de conexión con el servidor.", "error");
    }
}

// Soporte para teclado (Enter para buscar)
document.getElementById("searchInputPos")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") cargarProductosPos();
});