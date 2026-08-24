// ==========================================
// js/components.js - Componentes Reutilizables
// ==========================================

class MiNavbar extends HTMLElement {
    connectedCallback() {
        const isLogged = typeof getToken === 'function' && getToken();
        let offcanvasUserHtml = '';
        let menuCuentaHtml = '';
        
        // 🔥 NUEVO: Detectamos en qué página estamos automáticamente
        const urlActual = window.location.pathname.split("/").pop();
        const activeInicio = (urlActual === 'productos.html' || urlActual === '' || urlActual === 'index.html') ? 'active' : '';
        const activeCatalogo = (urlActual === 'catalogo.html') ? 'active' : '';

        if (isLogged) {
            const rol = typeof getUserRole === 'function' ? getUserRole() : null;
            const email = localStorage.getItem("email") || "usuario@ejemplo.com";
            const esAdmin = rol === "ROLE_ADMIN";
            
            const panelLink = esAdmin ? "admin-dashboard.html" : "perfil.html";
            const txtSaludo = esAdmin ? "¡Hola, Admin!" : "¡Hola!";
            const txtPanel = esAdmin ? "Mi Panel" : "Mi Perfil";

            offcanvasUserHtml = `
                <h5 class="fw-bold mb-0 text-dark">${txtSaludo}</h5>
                <p class="text-muted small mb-4">${email}</p>
                <a href="${panelLink}" class="btn btn-outline-danger w-100 rounded-pill fw-bold mb-3 py-2">
                    <i class="bi bi-graph-up me-2"></i> ${txtPanel}
                </a>
                <button class="btn btn-danger w-100 rounded-pill fw-bold shadow-sm py-2" onclick="localStorage.clear(); window.location.href='index.html';">
                    <i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                </button>
            `;

            menuCuentaHtml = `
                <div class="dropdown">
                    <button class="btn btn-primary btn-sm dropdown-toggle shadow-none rounded-pill px-3 py-2 fw-bold" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle me-1"></i> Mi Cuenta
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                        <li id="itemAdmin" class="${esAdmin ? '' : 'd-none'}"><a class="dropdown-item fw-bold text-primary" href="admin-dashboard.html"><i class="bi bi-shield-lock me-2"></i> Administrar</a></li>
                        <li><a class="dropdown-item" href="mis-pedidos.html"><i class="bi bi-box-seam me-2 text-success"></i> Mis Compras</a></li>
                        <li><a class="dropdown-item" href="mis-listas.html"><i class="bi bi-card-checklist me-2 text-warning"></i> Mis Listas</a></li>
                        <li><a class="dropdown-item" href="mis-apartados.html"><i class="bi bi-clock-history me-2 text-info"></i> Mis Apartados</a></li>
                        <li><a class="dropdown-item" href="perfil.html"><i class="bi bi-person-lines-fill me-2 text-secondary"></i> Mi Perfil</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item text-danger fw-bold" id="btnSalir" onclick="localStorage.clear(); window.location.href='index.html';"><i class="bi bi-box-arrow-right me-2"></i> Salir</button></li>
                    </ul>
                </div>
            `;
        } else {
            offcanvasUserHtml = `
                <h5 class="fw-bold mb-3 text-dark">¡Bienvenido!</h5>
                <a href="index.html" class="btn btn-primary w-100 rounded-pill fw-bold mb-3 py-2 shadow-sm">
                    <i class="bi bi-box-arrow-in-right me-2"></i> Iniciar Sesión
                </a>
                <a href="register.html" class="btn btn-outline-primary w-100 rounded-pill fw-bold py-2">
                    Crear Cuenta
                </a>
            `;

            menuCuentaHtml = `
                <a href="index.html" class="btn btn-outline-primary rounded-pill fw-bold px-4 shadow-sm">Ingresar</a>
            `;
        }

        this.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
            <div class="container d-flex justify-content-between align-items-center">
                
                <a class="navbar-brand text-white fw-bold fs-4 m-0" href="productos.html">
                    <i class="bi bi-book-half text-primary"></i> MI LIBRERÍA
                </a>
                
                <button class="navbar-toggler border-0 shadow-none d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileMenuDrawer" aria-controls="mobileMenuDrawer">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="d-none d-lg-flex align-items-center w-100 ms-4">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0 fw-semibold">
                        <!-- 🔥 APLICAMOS LAS VARIABLES 'active' AQUÍ -->
                        <li class="nav-item"><a class="nav-link ${activeInicio}" href="productos.html">Inicio</a></li>
                        <li class="nav-item"><a class="nav-link ${activeCatalogo}" href="catalogo.html">Catálogo</a></li>
                    </ul>

                    <form class="d-flex me-4 my-2 my-lg-0" id="searchForm" onsubmit="event.preventDefault(); window.location.href='catalogo.html?buscar=' + encodeURIComponent(document.getElementById('searchInputInicio').value.trim());">
                        <div class="input-group">
                            <input class="form-control border-0 bg-light shadow-none" type="search" id="searchInputInicio" placeholder="Ej. Ficción, Manga...">
                            <button class="btn btn-primary" type="submit"><i class="bi bi-search"></i></button>
                        </div>
                    </form>
                    
                    <div class="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                        <a href="carrito.html" class="btn btn-outline-light position-relative border-0 shadow-none">
                            <i class="bi bi-cart3 fs-5"></i>
                            <span id="cart-count" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">0</span>
                        </a>

                        ${menuCuentaHtml}
                    </div>
                </div>
            </div>
        </nav>

        <!-- PANEL DESLIZANTE OFFCANVAS (SOLO MÓVIL) -->
        <div class="offcanvas offcanvas-end d-lg-none" tabindex="-1" id="mobileMenuDrawer" aria-labelledby="mobileMenuDrawerLabel">
            <div class="offcanvas-header border-bottom py-3">
                <h5 class="offcanvas-title fw-bold text-primary tracking-wide" id="mobileMenuDrawerLabel">OPCIONES</h5>
                <button type="button" class="btn-close shadow-none" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            
            <div class="offcanvas-body p-0 d-flex flex-column bg-white">
                <div class="p-3">
                    <small class="text-muted fw-bold" style="letter-spacing: 1px;">NUESTRA EMPRESA</small>
                    <div class="list-group list-group-flush mt-2 mb-4">
                        <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 px-2 py-3 bg-transparent">
                            <span class="text-dark"><i class="bi bi-people-fill text-primary me-3 fs-5"></i> Sobre Nosotros</span>
                            <i class="bi bi-chevron-right text-muted small"></i>
                        </a>
                        <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 px-2 py-3 bg-transparent">
                            <span class="text-dark"><i class="bi bi-envelope-fill text-primary me-3 fs-5"></i> Contáctanos</span>
                            <i class="bi bi-chevron-right text-muted small"></i>
                        </a>
                    </div>

                    <small class="text-muted fw-bold" style="letter-spacing: 1px;">SOPORTE</small>
                    <div class="list-group list-group-flush mt-2 mb-4">
                        <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 px-2 py-3 bg-transparent">
                            <span class="text-dark"><i class="bi bi-question-circle-fill text-primary me-3 fs-5"></i> Preguntas Frecuentes</span>
                            <i class="bi bi-chevron-right text-muted small"></i>
                        </a>
                        <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 px-2 py-3 bg-transparent">
                            <span class="text-dark"><i class="bi bi-file-earmark-text-fill text-primary me-3 fs-5"></i> Términos y Condiciones</span>
                            <i class="bi bi-chevron-right text-muted small"></i>
                        </a>
                    </div>
                </div>

                <div class="mt-auto p-4 bg-light text-center border-top">
                    ${offcanvasUserHtml}
                </div>
            </div>
        </div>
        `;
    }
}
customElements.define('mi-navbar', MiNavbar);

class MiFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer class="text-white pt-5 pb-4 mt-auto" style="background-color: #111827;">
            <div class="container text-center text-md-start">
                <div class="row">
                    
                    <!-- Logo e Información de Contacto -->
                    <div class="col-md-4 col-lg-4 col-xl-3 mx-auto mb-4">
                        <h4 class="text-uppercase fw-bold mb-4 d-flex align-items-center justify-content-center justify-content-md-start">
                            <i class="bi bi-book-half text-primary me-2"></i>MI LIBRERÍA
                        </h4>
                        <p class="text-white-50" style="font-size: 0.9rem;">
                            Tu destino confiable para comprar libros online. La mejor variedad literaria, calidad garantizada y la atención que mereces.
                        </p>
                        <div class="mt-4 text-start ms-4 ms-md-0">
                            <p class="mb-2"><i class="bi bi-geo-alt-fill me-3 text-primary"></i> Atiquizaya, Ahuachapán</p>
                            <p class="mb-2"><i class="bi bi-telephone-fill me-3 text-primary"></i> +503 7000-0000</p>
                            <p class="mb-2"><i class="bi bi-envelope-fill me-3 text-primary"></i> contacto@milibreria.com</p>
                        </div>
                    </div>

                    <!-- Categorías (Acordeón en móvil) -->
                    <div class="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
                        <h6 class="text-uppercase fw-bold mb-3 border-bottom border-secondary pb-2 d-flex justify-content-between align-items-center" data-bs-toggle="collapse" data-bs-target="#footerCat" style="cursor: pointer;">
                            Categorías <i class="bi bi-plus d-md-none text-primary fs-5"></i>
                        </h6>
                        <div class="collapse d-md-block text-start text-md-start text-center" id="footerCat">
                            <p class="mb-2"><a href="catalogo.html?buscar=Ficción" class="text-white-50 text-decoration-none small">Ficción y Novelas</a></p>
                            <p class="mb-2"><a href="catalogo.html?buscar=Manga" class="text-white-50 text-decoration-none small">Mangas y Cómics</a></p>
                            <p class="mb-2"><a href="catalogo.html?buscar=Ingeniería" class="text-decoration-none small text-white-50">Ingeniería y Estudio</a></p>
                        </div>
                    </div>

                    <!-- Servicios y Enlaces (Acordeón en móvil) -->
                    <div class="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
                        <h6 class="text-uppercase fw-bold mb-3 border-bottom border-secondary pb-2 d-flex justify-content-between align-items-center" data-bs-toggle="collapse" data-bs-target="#footerServ" style="cursor: pointer;">
                            Mi Cuenta <i class="bi bi-plus d-md-none text-primary fs-5"></i>
                        </h6>
                        <div class="collapse d-md-block text-start text-md-start text-center" id="footerServ">
                            <p class="mb-2"><a href="mis-pedidos.html" class="text-white-50 text-decoration-none small">Mis Compras</a></p>
                            <p class="mb-2"><a href="mis-listas.html" class="text-white-50 text-decoration-none small">Mis Listas Escolares</a></p>
                            <p class="mb-2"><a href="mis-apartados.html" class="text-white-50 text-decoration-none small">Mis Apartados</a></p>
                        </div>
                    </div>

                    <!-- Redes Sociales y Copyright -->
                    <div class="col-12 text-center mt-3 pt-4 border-top border-secondary">
                        <a class="btn btn-outline-light btn-floating m-1 rounded-circle" style="width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-color: rgba(255,255,255,0.2);" href="#" role="button"><i class="bi bi-facebook"></i></a>
                        <a class="btn btn-outline-light btn-floating m-1 rounded-circle" style="width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-color: rgba(255,255,255,0.2);" href="#" role="button"><i class="bi bi-instagram"></i></a>
                        <a class="btn btn-outline-light btn-floating m-1 rounded-circle" style="width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-color: rgba(255,255,255,0.2);" href="#" role="button"><i class="bi bi-tiktok"></i></a>
                        <a class="btn btn-outline-light btn-floating m-1 rounded-circle" style="width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-color: rgba(255,255,255,0.2);" href="#" role="button"><i class="bi bi-whatsapp"></i></a>
                        
                        <div class="mt-4 text-white-50 small">
                            &copy; 2026 MI LIBRERÍA. Todos los derechos reservados.
                        </div>
                    </div>
                    
                </div>
            </div>
        </footer>
        `;
    }
}
customElements.define('mi-footer', MiFooter);

class AdminSidebar extends HTMLElement {
    connectedCallback() {
        const current = this.getAttribute('current') || 'dashboard';
        const isActive = (tab) => current === tab ? 'active shadow-sm' : '';

        this.innerHTML = `
        <aside class="sidebar shadow-sm">
            <div class="brand-box mb-3 text-center border-bottom pb-3">
                <a href="admin-portal.html" class="text-decoration-none">
                    <h4 class="fw-bold m-0 text-dark"><i class="bi bi-book-half text-primary"></i> MI LIBRERÍA</h4>
                </a>
                <span class="badge bg-primary bg-opacity-10 text-primary mt-2 rounded-pill px-3 fw-bold" style="font-size: 0.7rem;">Portal Administrativo</span>
            </div>
            
            <nav class="nav-sidebar-content">
                
                <!-- SECCIÓN: PRINCIPAL -->
                <div class="text-muted fw-bold px-2 mb-2" style="font-size: 0.65rem; letter-spacing: 1px;">PRINCIPAL</div>
                <a href="admin-dashboard.html" class="nav-link-custom ${isActive('dashboard')}"><i class="bi bi-grid-1x2-fill me-2"></i> Dashboard</a>
                
                <hr class="text-muted opacity-25 my-3">

                <!-- SECCIÓN: GESTIÓN DE TIENDA -->
                <div class="text-muted fw-bold px-2 mb-2" style="font-size: 0.65rem; letter-spacing: 1px;">GESTIÓN DE TIENDA</div>
                <a href="admin-productos.html" class="nav-link-custom ${isActive('productos')}"><i class="bi bi-box-seam me-2"></i> Inventario</a>
                
                <a href="admin-pedidos.html" class="nav-link-custom ${isActive('pedidos')} d-flex align-items-center justify-content-between">
                    <div><i class="bi bi-truck me-2"></i> Pedidos</div>
                    <span class="badge bg-danger rounded-pill badge-pedidos-nav d-none shadow-sm" style="font-size: 0.75rem;">0</span>
                </a>
                
                <a href="admin-categorias.html" class="nav-link-custom ${isActive('categorias')}"><i class="bi bi-tags me-2"></i> Categorías</a>
                <a href="admin-clientes.html" class="nav-link-custom ${isActive('clientes')}"><i class="bi bi-people me-2"></i> Clientes</a>
                <a href="admin-descuentos.html" class="nav-link-custom ${isActive('descuentos')}"><i class="bi bi-percent me-2"></i> Descuentos</a>
                
                <a href="admin-listas.html" class="nav-link-custom ${isActive('listas')}">
                    <i class="bi bi-list-ul me-2"></i> Listas Escolares
                </a>
                
                <a href="admin-apartados.html" class="nav-link-custom ${isActive('apartados')}">
                    <i class="bi bi-lock me-2"></i> Apartados
                </a>
                
                <hr class="text-muted opacity-25 my-3">

                <!-- SECCIÓN: FINANZAS Y CAJA -->
                <div class="text-muted fw-bold px-2 mb-2" style="font-size: 0.65rem; letter-spacing: 1px;">FINANZAS Y CAJA</div>
                
                <a href="admin-corte.html" class="nav-link-custom ${isActive('corte')}">
                    <i class="bi bi-cash-stack me-2"></i> Corte de Caja
                </a>
                
                <a href="admin-historial-cortes.html" class="nav-link-custom ${isActive('historial')}">
                    <i class="bi bi-clock-history me-2"></i> Historial de Cortes
                </a>
                
                <a href="admin-reportes.html" class="nav-link-custom ${isActive('reportes')}">
                    <i class="bi bi-file-earmark-excel me-2"></i> Exportar Ventas
                </a>
                
                <!-- ACCESOS INFERIORES -->
                <div style="margin-top: 1.5rem; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 1rem;">
                    <a href="admin-portal.html" class="nav-link-custom text-primary bg-primary bg-opacity-10 mb-2">
                        <i class="bi bi-arrow-left-circle me-2"></i> Volver al Portal
                    </a>
                    <a href="#" id="logoutBtn" class="nav-link-custom text-danger" onclick="localStorage.clear(); window.location.href='index.html';">
                        <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                    </a>
                </div>
            </nav>
        </aside>
        `;
    }
}
customElements.define('admin-sidebar', AdminSidebar);


class MiBottomNav extends HTMLElement {
    connectedCallback() {
        const current = this.getAttribute('current') || 'inicio';
        const isActive = (tab) => current === tab ? 'text-primary' : 'text-muted';
        const iconActive = (tab, iconBase, iconFill) => current === tab ? iconFill : iconBase;

        this.innerHTML = `
        <!-- BARRA DE BÚSQUEDA EXPRESS FLOTANTE ARRIBA CON RESULTADOS EN TIEMPO REAL -->
        <div id="searchBarMobile" class="position-fixed top-0 start-0 w-100 bg-white p-3 shadow-lg border-bottom d-lg-none" style="z-index: 1050; display: none; border-bottom-left-radius: 1.5rem; border-bottom-right-radius: 1.5rem;">
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-bold text-dark small"><i class="bi bi-search text-primary me-1"></i> Búsqueda Mágica</span>
                    <button type="button" class="btn-close shadow-none btn-sm" onclick="toggleSearchMobile()"></button>
                </div>
                
                <form onsubmit="event.preventDefault(); const val = document.getElementById('inputSearchMobileModal').value.trim(); if(val) window.location.href='catalogo.html?buscar=' + encodeURIComponent(val);">
                    <div class="input-group">
                        <input type="text" id="inputSearchMobileModal" class="form-control bg-light border-0 shadow-none py-2" placeholder="Escribe un libro o útil..." oninput="filtrarProductosMobile(this.value)" autocomplete="off">
                        <button class="btn btn-primary px-4 fw-bold" type="submit"><i class="bi bi-arrow-right"></i></button>
                    </div>
                </form>

                <!-- Contenedor donde aparecerán los productos en tiempo real -->
                <div id="resultadosLiveSearch" class="mt-2 bg-white rounded-3 shadow-sm border-0 overflow-hidden" style="max-height: 250px; overflow-y: auto; display: none;"></div>
            </div>
        </div>

        <nav class="fixed-bottom bg-white border-top shadow-lg d-lg-none pb-2 pt-2 px-3" style="z-index: 1040;">
            <ul class="nav justify-content-between align-items-center m-0 p-0 text-center" style="list-style: none;">
                
                <li class="nav-item">
                    <a href="productos.html" class="nav-link p-1 d-flex flex-column align-items-center text-decoration-none ${isActive('inicio')}">
                        <i class="bi ${iconActive('inicio', 'bi-house-door', 'bi-house-door-fill')} fs-4 mb-1"></i>
                        <span class="small fw-bold" style="font-size: 0.7rem;">Inicio</span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="catalogo.html" class="nav-link p-1 d-flex flex-column align-items-center text-decoration-none ${isActive('catalogo')}">
                        <i class="bi ${iconActive('catalogo', 'bi-collection', 'bi-collection-fill')} fs-4 mb-1"></i>
                        <span class="small fw-bold" style="font-size: 0.7rem;">Catálogo</span>
                    </a>
                </li>
                
                <!-- Botón Flotante Central (Abre el Buscador Superior) -->
                <li class="nav-item mt-n3">
                    <button type="button" onclick="toggleSearchMobile()" class="nav-link p-0 d-flex flex-column align-items-center justify-content-center bg-primary text-white rounded-circle shadow border border-3 border-white transition-all mx-auto" style="width: 55px; height: 55px; transform: translateY(-15px); border: none;">
                        <i class="bi bi-search fs-4"></i>
                    </button>
                </li>
                
                <li class="nav-item">
                    <a href="perfil.html" class="nav-link p-1 d-flex flex-column align-items-center text-decoration-none ${isActive('cuenta')}">
                        <i class="bi ${iconActive('cuenta', 'bi-person', 'bi-person-fill')} fs-4 mb-1"></i>
                        <span class="small fw-bold" style="font-size: 0.7rem;">Cuenta</span>
                    </a>
                </li>
                
                <li class="nav-item position-relative">
                    <a href="carrito.html" class="nav-link p-1 d-flex flex-column align-items-center text-decoration-none ${isActive('carrito')}">
                        <i class="bi ${iconActive('carrito', 'bi-cart3', 'bi-cart-fill')} fs-4 mb-1"></i>
                        <span class="small fw-bold" style="font-size: 0.7rem;">Carrito</span>
                        <span id="cartBadgeMobile" class="position-absolute top-0 start-75 translate-middle badge rounded-pill bg-danger shadow-sm" style="font-size: 0.6rem; transform: translate(-25%, -25%); display:none;">0</span>
                    </a>
                </li>
                
            </ul>
        </nav>
        
        <!-- Botón Flotante de WhatsApp con tu número -->
        <a href="https://wa.me/50371584643?text=${encodeURIComponent('¡Hola! Estoy interesado en los libros de MI LIBRERÍA. ¿Me pueden ayudar?')}" target="_blank" class="btn-whatsapp-float" style="bottom: 80px; z-index: 1030;">
            <i class="bi bi-whatsapp"></i>
        </a>
        `;
        
        // Función global para desplegar/ocultar el buscador
        if (!window.toggleSearchMobile) {
            window.toggleSearchMobile = function() {
                const bar = document.getElementById('searchBarMobile');
                const resultados = document.getElementById('resultadosLiveSearch');
                if (bar) {
                    if (bar.style.display === 'none' || bar.style.display === '') {
                        bar.style.display = 'block';
                        setTimeout(() => {
                            const input = document.getElementById('inputSearchMobileModal');
                            if(input) input.focus();
                        }, 100);
                    } else {
                        bar.style.display = 'none';
                        if(resultados) resultados.style.display = 'none';
                    }
                }
            };
        }

        // Función de búsqueda en tiempo real conectada a tu API
        if (!window.filtrarProductosMobile) {
            let timeoutLiveSearch = null;
            window.filtrarProductosMobile = function(texto) {
                clearTimeout(timeoutLiveSearch);
                const container = document.getElementById('resultadosLiveSearch');
                if (!container) return;

                if (texto.trim().length < 2) {
                    container.style.display = 'none';
                    container.innerHTML = '';
                    return;
                }

                timeoutLiveSearch = setTimeout(() => {
                    // Usamos tu ruta estándar de búsqueda de productos con la API global
                    const urlApi = (typeof API_URL !== 'undefined') ? API_URL : 'http://localhost:8080/api';
                    
                    fetch(`${urlApi}/producto?search=${encodeURIComponent(texto)}&size=5`)
                        .then(res => res.json())
                        .then(data => {
                            const productos = data.content || data;
                            container.innerHTML = '';
                            
                            if (!productos || productos.length === 0) {
                                container.innerHTML = `<div class="p-3 text-muted small text-center">No se encontraron productos.</div>`;
                                container.style.display = 'block';
                                return;
                            }

                            productos.forEach(p => {
                                const img = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : 'https://via.placeholder.com/40?text=Libro';
                                container.innerHTML += `
                                    <a href="catalogo.html?buscar=${encodeURIComponent(p.nombre)}" class="d-flex align-items-center p-2 text-decoration-none border-bottom text-dark product-search-hover">
                                        <img src="${img}" alt="${p.nombre}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px;" class="bg-light border me-2">
                                        <div class="flex-grow-1 text-truncate">
                                            <div class="fw-bold small text-truncate">${p.nombre}</div>
                                            <div class="text-primary" style="font-size: 0.75rem;">$${p.precio ? p.precio.toFixed(2) : '0.00'}</div>
                                        </div>
                                    </a>
                                `;
                            });
                            container.style.display = 'block';
                        })
                        .catch(err => {
                            console.error("Error en búsqueda live:", err);
                            container.style.display = 'none';
                        });
                }, 300); // Retraso de 300ms para no saturar peticiones
            };
        }
    }
}
customElements.define('mi-bottom-nav', MiBottomNav);