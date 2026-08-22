const API_URL = "http://localhost:8080";

function getToken(){
    return localStorage.getItem("token");
}

function authHeaders(){
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
    };
}

async function actualizarBadge() {
    const badge = document.getElementById("cart-count"); // O el ID que uses
    if (!badge || !getToken()) return;

    try {
        const res = await fetch(`${API_URL}/carrito`, { headers: authHeaders() });
        if (res.ok) {
            const carrito = await res.json();
            const total = carrito.items?.reduce((s, i) => s + i.cantidad, 0) || 0;
            badge.textContent = total;
        }
    } catch (error) {
        console.error("Error al actualizar badge", error);
    }
}

function getUserRole() {
    const token = getToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        // Tu backend guarda "rol": "ADMIN" | "CLIENTE"
        if (payload.rol === "ADMIN") return "ROLE_ADMIN";
        if (payload.rol === "CLIENTE") return "ROLE_CLIENTE";

        return null;
    } catch (e) {
        console.error("Error leyendo rol del token", e);
        return null;
    }
}

// ==========================================
// UTILIDAD: FORMATO DE MONEDA (Agregar al final)
// ==========================================
const formatoMoneda = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});