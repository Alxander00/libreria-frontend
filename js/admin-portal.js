// ==========================================
// js/admin-portal.js - Lógica del Portal Admin
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Validación de seguridad: Solo administradores
    if (!getToken() || getUserRole() !== "ROLE_ADMIN") {
        window.location.href = "index.html";
        return;
    }

    // Botón de salir / cerrar sesión
    const btnSalir = document.getElementById("btnCerrarSesionPortal");
    if (btnSalir) {
        btnSalir.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "index.html";
        });
    }
});