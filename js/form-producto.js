// ==========================================
// js/form-producto.js - UI de Grupos Premium
// ==========================================
if (!getToken() || getUserRole() !== "ROLE_ADMIN") window.location.href = "index.html";

const urlParams = new URLSearchParams(window.location.search);
const idEditar = urlParams.get("id"); 

const titulo = document.querySelector("h5");
const btn = document.getElementById("btnGuardar"); // Mejor usar el ID directo

document.addEventListener("DOMContentLoaded", async () => {
    await cargarCategorias();
    
    // Cambiamos el botón inicial para que encaje con el nuevo diseño
    const contenedorGlobal = document.getElementById("seccionVariaciones");
    if (contenedorGlobal) {
        const btnViejo = contenedorGlobal.querySelector("button");
        if (btnViejo) {
            btnViejo.outerHTML = `
                <div class="text-center mt-4 mb-2 border-top pt-4">
                    <button type="button" class="btn btn-primary fw-bold rounded-pill px-4 shadow-sm" onclick="agregarGrupoColorHTML()">
                        <i class="bi bi-palette-fill me-2"></i> Agregar un Nuevo Color
                    </button>
                </div>`;
        }
    }

    if (idEditar) {
        cargarDatos(idEditar);
    }
});

function toggleVariaciones() {
    const check = document.getElementById("checkVariaciones");
    const simple = document.getElementById("seccionStockSimple");
    const compleja = document.getElementById("seccionVariaciones");
    const contenedor = document.getElementById("contenedor-variaciones");

    if (check.checked) {
        simple.classList.add("d-none");
        compleja.classList.remove("d-none");
        if (contenedor.children.length === 0) agregarGrupoColorHTML();
    } else {
        simple.classList.remove("d-none");
        compleja.classList.add("d-none");
    }
}

async function cargarCategorias() {
    const res = await fetch(`${API_URL}/categoria`);
    const cats = await res.json();
    const sel = document.getElementById("categoria");
    sel.innerHTML = '<option value="">Seleccione...</option>';
    cats.forEach(c => sel.innerHTML += `<option value="${c.idCategoria}">${c.nombre}</option>`);
}

async function cargarDatos(id) {
    titulo.textContent = "✏️ Editar Producto";
    if(btn) {
        btn.innerHTML = '<i class="bi bi-save2-fill me-2"></i> Actualizar Producto';
    }

    const res = await fetch(`${API_URL}/producto/${id}`);
    const p = await res.json();

    document.getElementById("nombre").value = p.nombre;
    document.getElementById("descripcion").value = p.descripcion;
    document.getElementById("precio").value = p.precio;
    document.getElementById("categoria").value = p.categoria?.idCategoria || "";
    
    const check = document.getElementById("checkVariaciones");
    const contenedor = document.getElementById("contenedor-variaciones");
    contenedor.innerHTML = ""; 

    if (p.variaciones && p.variaciones.length > 0) {
        if (p.variaciones.length === 1 && p.variaciones[0].color === "Único" && p.variaciones[0].talla === "Única") {
            check.checked = false;
            const inputStockSimple = document.getElementById("stockSimple");
            inputStockSimple.value = p.variaciones[0].stock;
            // 🟢 Guardamos el ID de la variación única de forma invisible para que no de error al actualizar
            inputStockSimple.dataset.idVariacion = p.variaciones[0].idVariacion || p.variaciones[0].id || '';
            toggleVariaciones();
        } else {
            check.checked = true;
            toggleVariaciones();

            const gruposColor = {};
            p.variaciones.forEach(v => {
                if(!gruposColor[v.color]) gruposColor[v.color] = [];
                gruposColor[v.color].push(v);
            });

            for (const [color, tallas] of Object.entries(gruposColor)) {
                const grupoDiv = agregarGrupoColorHTML(color);
                const btnAgregarTalla = grupoDiv.querySelector('.btn-agregar-talla');
                grupoDiv.querySelector('.contenedor-tallas').innerHTML = ""; 
                
                tallas.forEach(t => {
                    // 🟢 Pasamos el ID exacto que viene de la BD
                    agregarTallaHTML(btnAgregarTalla, t.talla, t.stock, t.idVariacion || t.id || '');
                });
            }
        }
    } else {
        check.checked = false;
        toggleVariaciones();
    }
    
    if (p.imagenesUrls && p.imagenesUrls.length > 0) {
        const container = document.getElementById("multi-preview");
        container.innerHTML = "";
        p.imagenesUrls.forEach(url => {
            container.innerHTML += `<div class="position-relative"><img src="${url}" class="rounded shadow-sm border" style="width: 80px; height: 80px; object-fit: cover;"></div>`;
        });
    }
}

// -----------------------------------------------------------------
// NUEVA INTERFAZ VISUAL PREMIUM: GRUPOS Y TALLAS
// -----------------------------------------------------------------

function agregarGrupoColorHTML(color = '') {
    const contenedor = document.getElementById("contenedor-variaciones");

    const div = document.createElement("div");
    div.className = "grupo-color position-relative bg-white rounded-4 shadow-sm border mb-4";
    div.style.overflow = "hidden";
    
    div.innerHTML = `
        <div class="position-absolute top-0 start-0 h-100 bg-primary" style="width: 5px;"></div>
        
        <div class="p-4 ms-2">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                <div class="d-flex align-items-center w-75">
                    <div class="bg-primary bg-opacity-10 p-2 rounded-circle me-3 text-primary shadow-sm">
                        <i class="bi bi-palette-fill fs-5"></i>
                    </div>
                    <div class="flex-grow-1">
                        <label class="form-label-custom mb-1 text-primary">Color de este grupo</label>
                        <input type="text" class="form-control input-neo fw-bold border-0 bg-light input-color shadow-none" placeholder="Ej: Azul Marino, Negro..." value="${color}">
                    </div>
                </div>
                <button type="button" class="btn btn-light text-danger rounded-circle p-2 shadow-sm border" title="Eliminar este color completo" onclick="this.closest('.grupo-color').remove()">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </div>

            <div class="contenedor-tallas d-flex flex-column gap-2 mb-3">
                </div>
            
            <button type="button" class="btn btn-sm btn-outline-primary fw-bold rounded-pill px-3 btn-agregar-talla bg-primary bg-opacity-10 border-0" onclick="agregarTallaHTML(this)">
                <i class="bi bi-plus-lg me-1"></i> Añadir Talla a este Color
            </button>
        </div>
    `;
    
    contenedor.appendChild(div);
    
    const btnAgregarTalla = div.querySelector('.btn-agregar-talla');
    if(!color) agregarTallaHTML(btnAgregarTalla); 
    
    return div;
}

// 🟢 Agregamos el parámetro idVariacion al final
function agregarTallaHTML(btnElement, talla = '', stock = 1, idVariacion = '') {
    const contenedorTallas = btnElement.previousElementSibling;
    const div = document.createElement("div");
    
    div.className = "fila-talla d-flex align-items-center gap-3 p-2 bg-light rounded-4 border";
    
    div.innerHTML = `
        <!-- 🟢 Input oculto para recordar el ID de la base de datos -->
        <input type="hidden" class="input-id-variacion" value="${idVariacion}">
        
        <div class="input-group border-0 w-50">
            <span class="input-group-text bg-white border-0 text-muted rounded-start-4 ps-3"><i class="bi bi-rulers"></i></span>
            <input type="text" class="form-control border-0 bg-white input-talla shadow-none" placeholder="Talla (Ej: M, 42...)" value="${talla}">
        </div>
        
        <div class="input-group border-0 w-50">
            <span class="input-group-text bg-white border-0 text-muted rounded-start-4 ps-3"><i class="bi bi-box-seam"></i></span>
            <input type="number" class="form-control border-0 bg-white input-stock shadow-none text-center" placeholder="Stock" value="${stock}" min="0">
        </div>
        
        <button type="button" class="btn btn-white text-danger border-0 p-1 me-2" title="Quitar talla" onclick="this.closest('.fila-talla').remove()">
            <i class="bi bi-x-circle-fill fs-5"></i>
        </button>
    `;
    contenedorTallas.appendChild(div);
}

// -----------------------------------------------------------------

function previewMultiplesImagenes(event) {
    const container = document.getElementById("multi-preview");
    container.innerHTML = ""; 
    const files = event.target.files;
    
    if (files.length === 0) {
        container.innerHTML = `<div class="text-center text-muted opacity-50"><i class="bi bi-cloud-upload display-4 d-block mb-2"></i><p class="small m-0 px-2 fw-bold text-uppercase">Tus fotos aparecerán aquí</p></div>`;
        return;
    }

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement("div");
            div.className = "position-relative";
            div.innerHTML = `<img src="${e.target.result}" class="rounded shadow-sm border" style="width: 80px; height: 80px; object-fit: cover;">`;
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

async function crearProducto() {
    const nombre = document.getElementById("nombre").value;
    const precio = document.getElementById("precio").value;
    const descripcion = document.getElementById("descripcion").value;
    const categoria = document.getElementById("categoria").value;
    const hasVariaciones = document.getElementById("checkVariaciones").checked;
    const files = document.getElementById("imagenes").files;

    let variacionesFinales = [];

    if (hasVariaciones) {
        document.querySelectorAll(".grupo-color").forEach(grupo => {
            let color = grupo.querySelector(".input-color").value.trim();
            if (color === "") color = "Único";

            grupo.querySelectorAll(".fila-talla").forEach(fila => {
                let talla = fila.querySelector(".input-talla").value.trim();
                if (talla === "") talla = "Única";
                
                const stock = fila.querySelector(".input-stock").value;
                
                // 🟢 Capturamos el ID oculto
                const idVariacion = fila.querySelector(".input-id-variacion").value;
                
                let variacionObj = { 
                    color: color, 
                    talla: talla, 
                    stock: parseInt(stock) || 0 
                };

                // 🟢 Si existe el ID, se lo inyectamos al JSON para que Spring Boot no intente borrarla
                if (idVariacion) {
                    variacionObj.idVariacion = parseInt(idVariacion); 
                }

                variacionesFinales.push(variacionObj);
            });
        });
    } else {
        const inputStockSimple = document.getElementById("stockSimple");
        const stockUnico = inputStockSimple.value;
        const idVarSimple = inputStockSimple.dataset.idVariacion; // Capturamos el ID si existe
        
        let varSimpleObj = { 
            color: "Único", 
            talla: "Única", 
            stock: parseInt(stockUnico) || 0 
        };
        
        if (idVarSimple) {
            varSimpleObj.idVariacion = parseInt(idVarSimple);
        }
        
        variacionesFinales.push(varSimpleObj);
    }

    if (!nombre || !precio || !categoria) return Swal.fire("Atención", "Completa los campos obligatorios (*)", "warning");
    if (variacionesFinales.length === 0) return Swal.fire("Atención", "Debes configurar el stock del producto", "warning");

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("precio", precio);
    formData.append("descripcion", descripcion);
    formData.append("categoriaId", categoria);
    formData.append("variacionesStr", JSON.stringify(variacionesFinales));

    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            formData.append("imagenes", files[i]);
        }
    }

    try {
        let url = idEditar ? `${API_URL}/producto/editar-con-imagen/${idEditar}` : `${API_URL}/producto/imagen`; 
        let method = idEditar ? "PUT" : "POST";

        if(btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
        }

        const res = await fetch(url, {
            method: method,
            headers: { "Authorization": "Bearer " + getToken() },
            body: formData
        });

        if (res.ok) {
            await Swal.fire("Éxito", "Producto guardado correctamente", "success");
            window.location.href = "admin-productos.html"; 
        } else {
            const textoError = await res.text();
            Swal.fire("Error", "No se pudo guardar: " + textoError, "error");
            if(btn) {
                btn.disabled = false;
                btn.innerHTML = idEditar ? '<i class="bi bi-save2-fill me-2"></i> Actualizar Producto' : '<i class="bi bi-save2-fill me-2"></i> Guardar Producto';
            }
        }
    } catch (e) {
        Swal.fire("Error", "Fallo de conexión", "error");
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = idEditar ? '<i class="bi bi-save2-fill me-2"></i> Actualizar Producto' : '<i class="bi bi-save2-fill me-2"></i> Guardar Producto';
        }
    }
}