// ==========================================
// js/perfil.js - Versión Full-Stack con Avatar
// ==========================================
if (!getToken()) window.location.href = "index.html";

document.addEventListener("DOMContentLoaded", () => {
    cargarDatosPerfil();
    if(typeof actualizarBadge === 'function') actualizarBadge();
    
    document.getElementById("btnSalir").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });

    const passInput = document.getElementById("perfilPassword");
    if(passInput) {
        passInput.addEventListener("input", evaluarFuerzaPassword);
    }
});

// Función para mostrar/ocultar contraseña (Ojo visual)
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector("i");
    if (input.type === "password") {
        input.type = "text";
        icon.className = "bi bi-eye-slash text-primary";
    } else {
        input.type = "password";
        icon.className = "bi bi-eye text-muted";
    }
}

// Analizador visual de fuerza de contraseña
function evaluarFuerzaPassword(e) {
    const valor = e.target.value;
    const meter = document.getElementById("meterFill");
    const txt = document.getElementById("meterText");

    if (valor.length === 0) {
        meter.style.width = "0%";
        txt.innerText = "Mínimo 6 caracteres recomendados.";
        return;
    }

    let fuerza = 0;
    if (valor.length >= 6) fuerza += 33;
    if (valor.match(/[A-Z]/) || valor.match(/[0-9]/)) fuerza += 33;
    if (valor.length >= 8 && valor.match(/[^A-Za-z0-9]/)) fuerza += 34;

    meter.style.width = fuerza + "%";

    if (fuerza <= 33) {
        meter.className = "password-meter-fill bg-danger";
        txt.innerText = "Fuerza: Débil";
    } else if (fuerza <= 66) {
        meter.className = "password-meter-fill bg-warning";
        txt.innerText = "Fuerza: Media";
    } else {
        meter.className = "password-meter-fill bg-success";
        txt.innerText = "Fuerza: Fuerte";
    }
}

async function cargarDatosPerfil() {
    try {
        const res = await fetch(`${API_URL}/usuario/mi-perfil`, { headers: authHeaders() });
        
        if (res.ok) {
            const usuario = await res.json();
            
            document.getElementById("perfilEmail").value = usuario.email;
            document.getElementById("perfilNombre").value = usuario.nombre;
            document.getElementById("perfilTelefono").value = usuario.telefono || "";
            document.getElementById("perfilDireccion").value = usuario.direccion || "";
            
            document.getElementById("lblNombreLateral").innerText = usuario.nombre;
            document.getElementById("lblEmailLateral").innerText = usuario.email;
            
            // 👇 LÓGICA INTELIGENTE DE AVATAR 👇
            const avatarImg = document.getElementById("profileAvatarImg");
            
            if (usuario.fotoUrl) {
                // Si tiene foto real, la traemos de la carpeta expuesta en el backend (/avatars/)
                avatarImg.src = `${API_URL}/uploads/avatars/${usuario.fotoUrl}`;
            } else {
                // Si no tiene foto, fallback profesional con iniciales
                const avatarFallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre)}&background=0d6efd&color=fff&size=150&font-size=0.4&bold=true`;
                avatarImg.src = avatarFallbackUrl;
            }
            
        } else {
            Swal.fire("Error", "Tu sesión ha expirado.", "error").then(() => {
                localStorage.clear();
                window.location.href = "index.html";
            });
        }
    } catch (e) {
        console.error(e);
        Swal.fire("Error", "No hay conexión con el servidor.", "error");
    }
}

async function actualizarPerfil() {
    const botones = document.querySelectorAll(".btn-guardar-global");
    botones.forEach(b => b.disabled = true);
    
    const nombre = document.getElementById("perfilNombre").value.trim();
    const telefono = document.getElementById("perfilTelefono").value.trim();
    const direccion = document.getElementById("perfilDireccion").value.trim();
    const password = document.getElementById("perfilPassword").value;
    const confirmPassword = document.getElementById("perfilConfirmPassword").value;

    if (!nombre || !telefono) {
        botones.forEach(b => b.disabled = false);
        return Swal.fire("Atención", "El nombre y el teléfono son obligatorios.", "warning");
    }

    if (password !== "" || confirmPassword !== "") {
        if (password.length < 6) {
            botones.forEach(b => b.disabled = false);
            return Swal.fire("Seguridad", "La nueva contraseña debe tener al menos 6 caracteres.", "warning");
        }
        if (password !== confirmPassword) {
            botones.forEach(b => b.disabled = false);
            return Swal.fire("Error", "Las contraseñas no coinciden. Intenta de nuevo.", "error");
        }
    }

    const payload = {
        nombre: nombre,
        telefono: telefono,
        direccion: direccion,
        password: password !== "" ? password : null 
    };

    try {
        const res = await fetch(`${API_URL}/usuario/actualizar`, {
            method: "PUT",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            await Swal.fire({
                icon: 'success',
                title: 'Perfil Sincronizado',
                text: 'Tus datos están seguros y actualizados.',
                confirmButtonColor: '#0d6efd'
            });
            
            document.getElementById("perfilPassword").value = "";
            document.getElementById("perfilConfirmPassword").value = "";
            document.getElementById("meterFill").style.width = "0%";
            document.getElementById("meterText").innerText = "Mínimo 6 caracteres recomendados.";
            
            await cargarDatosPerfil();
        } else {
            Swal.fire("Error", "El servidor no pudo procesar la actualización.", "error");
        }
    } catch (e) {
        Swal.fire("Error", "Problemas de conexión con el backend.", "error");
    } finally {
        botones.forEach(b => b.disabled = false);
    }
}

// 👇 NUEVA FUNCIÓN PARA SUBIR EL AVATAR AUTOMÁTICAMENTE 👇
async function subirAvatar(input) {
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validación básica de tamaño (ej: máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
        Swal.fire("Imagen muy grande", "El tamaño máximo permitido es de 2MB.", "warning");
        input.value = ""; // Limpiar input
        return;
    }

    // Creamos el FormData para enviar el archivo
    const formData = new FormData();
    formData.append("file", file);

    Swal.fire({
        title: 'Subiendo foto...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        // 👇 SOLUCIÓN: Creamos los headers manualmente SOLO con la autorización 👇
        const token = getToken();
        const headersPersonalizados = {
            "Authorization": `Bearer ${token}`
            // NOTA: NO agregamos "Content-Type" aquí. Fetch lo calculará solo por ser FormData.
        };
        
        const res = await fetch(`${API_URL}/usuario/actualizar-avatar`, {
            method: "POST",
            headers: headersPersonalizados, 
            body: formData
        });

        if (res.ok) {
            Swal.close();
            await Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Foto de perfil actualizada', showConfirmButton: false, timer: 2000 });
            
            await cargarDatosPerfil();
            if(typeof actualizarBadge === 'function') actualizarBadge();
            
        } else {
            Swal.close();
            const errorText = await res.text();
            Swal.fire("Error", `No se pudo subir la foto: ${errorText}`, "error");
        }
    } catch (e) {
        Swal.close();
        console.error(e);
        Swal.fire("Error", "Fallo de conexión al subir la imagen.", "error");
    } finally {
        input.value = ""; 
    }
}