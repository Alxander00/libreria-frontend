// ==========================================
// js/register.js
// ==========================================

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Captura de datos
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value.trim();
    const direccion = document.getElementById("direccion").value.trim();

    // Validaciones básicas de Ingeniería
    if (!nombre || !email || !password || !telefono) {
        return Swal.fire("Atención", "Todos los campos marcados son obligatorios.", "warning");
    }

    if (telefono.length < 8) {
        return Swal.fire("Atención", "El número de teléfono debe tener al menos 8 dígitos.", "warning");
    }

    // Objeto que coincide con tu UsuarioRequest en el Backend
    const datosUsuario = {
        nombre: nombre,
        email: email,
        password: password,
        telefono: telefono,
        direccion: direccion,
        rol: "CLIENTE" // Rol por defecto según tu controlador
    };

    try {
        Swal.fire({ title: 'Creando cuenta...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const res = await fetch(`${API_URL}/usuario/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosUsuario)
        });

        if (res.ok) {
            await Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.',
                confirmButtonColor: '#0d6efd'
            });
            window.location.href = "index.html"; // Redirigir al login
        } else {
            const error = await res.json();
            Swal.fire("Error", error.mensaje || "El correo ya está registrado.", "error");
        }
    } catch (error) {
        console.error("Error en el registro:", error);
        Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
});