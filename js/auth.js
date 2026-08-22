// ==========================================
// ARCHIVO: js/auth.js
// ==========================================

// 1. LÓGICA DE LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            // Hacemos la petición al Backend
            const res = await fetch(`${API_URL}/usuario/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                throw new Error("Correo o contraseña incorrectos");
            }

            const data = await res.json();

            // Guardamos el token
            localStorage.setItem("token", data.token);
            localStorage.setItem("email", email);

            // ============================================
            // 🚦 REDIRECCIÓN INTELIGENTE (EL SEMÁFORO)
            // ============================================
            
            // Decodificamos el token para ver el ROL
            // (El token son letras raras separadas por puntos. La info está en el medio)
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            
            // Verificamos si es ADMIN
            // Nota: Ajusta "ADMIN" si tu backend usa "ROLE_ADMIN"
            if (payload.rol === "ADMIN" || payload.rol === "ROLE_ADMIN") {
                
                // Si es ADMIN -> Al Dashboard
                window.location.href = "admin-dashboard.html";
                
            } else {
                
                // Si es CLIENTE -> A la Tienda
                window.location.href = "productos.html";
            }

        } catch (error) {
            console.error(error);
            // Usamos SweetAlert ya que lo tienes importado en tu HTML
            Swal.fire({
                icon: 'error',
                title: 'Error de acceso',
                text: error.message
            });
        }
    });
}

// 2. LÓGICA DE REGISTRO (Por si acaso usas el mismo archivo para register.html)
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usuario = {
            nombre: document.getElementById("nombre").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        };

        try {
            const res = await fetch(`${API_URL}/usuario/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(usuario)
            });

            if (!res.ok) throw new Error("Error al registrarse. Quizás el correo ya existe.");

            await Swal.fire({
                icon: 'success',
                title: '¡Cuenta creada!',
                text: 'Ahora inicia sesión para continuar.',
                confirmButtonText: 'Ir al Login'
            });

            // Al registrarse, mandamos al Login para que obtenga su token
            window.location.href = "login.html";

        } catch (error) {
            Swal.fire("Error", error.message, "error");
        }
    });
}

async function recuperarPassword() {
    const { value: email } = await Swal.fire({
        title: 'Recuperar Contraseña',
        text: 'Ingresa el correo con el que te registraste.',
        input: 'email',
        inputPlaceholder: 'tu@correo.com',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-send"></i> Enviar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0d6efd'
    });

    if (email) {
        try {
            Swal.fire({ title: 'Enviando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            const res = await fetch(`${API_URL}/usuario/recuperar-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email })
            });

            if (res.ok) {
                Swal.fire("¡Revisa tu bandeja!", "Si el correo existe en nuestro sistema, te enviamos las instrucciones para entrar.", "success");
            } else {
                Swal.fire("Error", "No pudimos procesar la solicitud.", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Problemas de conexión con el servidor.", "error");
        }
    }
}