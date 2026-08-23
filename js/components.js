// ==========================================
// js/components.js - Componentes Reutilizables
// ==========================================

class MiNavbar extends HTMLElement {
    connectedCallback() {
        // Determinamos el estado de la sesión dinámicamente para construir la tarjeta del usuario
        let offcanvasUserHtml = '';
        
        if (typeof getToken === 'function' && getToken()) {
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
        }

        this.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
            <div class="container d-flex justify-content-between align-items-center">
                
                <!-- Logo -->
                <a class="navbar-brand text-white fw-bold fs-4 m-0" href="productos.html">
                    <i class="bi bi-book-half text-primary"></i> MI LIBRERÍA
                </a>
                
                <!-- Botón Hamburguesa (SOLO MÓVIL) -> Activa el Offcanvas -->
                <button class="navbar-toggler border-0 shadow-none d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileMenuDrawer" aria-controls="mobileMenuDrawer">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <!-- Menú normal (SOLO PC - d-none d-lg-flex) -->
                <div class="d-none d-lg-flex align-items-center w-100 ms-4">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0 fw-semibold">
                        <li class="nav-item"><a class="nav-link active" href="productos.html">Inicio</a></li>
                        <li class="nav-item"><a class="nav-link" href="catalogo.html">Catálogo</a></li>
                        <li class="nav-item d-none" id="navMisPedidos"><a class="nav-link" href="mis-pedidos.html">Mis Pedidos</a></li>
                        <li class="nav-item d-none" id="navMisListas"><a class="nav-link" href="mis-listas.html">Mis Listas</a></li>
                        <li class="nav-item d-none" id="navMisApartados"><a class="nav-link" href="mis-apartados.html">Mis Apartados</a></li>
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

                        <div class="dropdown">
                            <button class="btn btn-primary btn-sm dropdown-toggle shadow-none" type="button" data-bs-toggle="dropdown">
                                <i class="bi bi-person-circle me-1"></i> Cuenta
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                                <li id="itemAdmin" class="d-none"><a class="dropdown-item fw-bold text-primary" href="admin-dashboard.html"><i class="bi bi-shield-lock me-2"></i> Administrar</a></li>
                                <li><a class="dropdown-item" href="mis-pedidos.html"><i class="bi bi-box-seam me-2"></i> Mis Compras</a></li>
                                <li><a class="dropdown-item" href="mis-listas.html"><i class="bi bi-list-ul me-2"></i> Mis Listas</a></li>
                                <li><a class="dropdown-item" href="mis-apartados.html"><i class="bi bi-lock me-2"></i> Mis Apartados</a></li>
                                <li><a class="dropdown-item" href="perfil.html"><i class="bi bi-person-lines-fill"></i> Mi Perfil</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><button class="dropdown-item text-danger fw-bold" id="btnSalir"><i class="bi bi-box-arrow-right me-2"></i> Salir</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ==================================================== -->
        <!-- PANEL DESLIZANTE OFFCANVAS (SOLO MÓVIL) -->
        <!-- ==================================================== -->
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

                <!-- SECCIÓN DINÁMICA DE USUARIO (Abajo) -->
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
        const isColored = (tab, color) => current === tab ? `style="background: ${color}; color: white; border-radius: 8px; margin-top: 0.3rem;"` : '';

        this.innerHTML = `
        <aside class="sidebar shadow-sm">
            <div class="brand-box mb-4 text-center border-bottom pb-3">
                <h4 class="fw-bold m-0 text-dark"><i class="bi bi-book-half text-primary"></i> MI LIBRERÍA</h4>
                <span class="badge bg-primary mt-2 rounded-pill px-3">Administración</span>
            </div>
            <nav>
                <a href="admin-dashboard.html" class="nav-link-custom ${isActive('dashboard')}"><i class="bi bi-grid-1x2-fill me-2"></i> Dashboard</a>
                <a href="admin-productos.html" class="nav-link-custom ${isActive('productos')}"><i class="bi bi-box-seam me-2"></i> Inventario</a>
                <a href="admin-pedidos.html" class="nav-link-custom ${isActive('pedidos')} d-flex align-items-center justify-content-between">
                    <div><i class="bi bi-truck me-2"></i> Pedidos</div>
                    <span class="badge bg-danger rounded-pill badge-pedidos-nav d-none shadow-sm" style="font-size: 0.75rem;">0</span>
                </a>
                <a href="admin-categorias.html" class="nav-link-custom ${isActive('categorias')}"><i class="bi bi-tags me-2"></i> Categorías</a>
                <a href="admin-clientes.html" class="nav-link-custom ${isActive('clientes')}"><i class="bi bi-people me-2"></i> Clientes</a>
                <a href="admin-descuentos.html" class="nav-link-custom ${isActive('descuentos')}"><i class="bi bi-percent me-2"></i> Descuentos</a>
                
                <a href="admin-listas.html" class="nav-link-custom ${current === 'listas' ? 'active shadow-sm' : ''}" ${current === 'listas' ? 'style="background: #0d6efd; color: white; border-radius: 8px; margin-top: 0.5rem;"' : 'style="margin-top: 0.5rem;"'}>
                    <i class="bi bi-list-ul me-2"></i> Listas Escolares
                </a>
                
                <a href="admin-apartados.html" class="nav-link-custom ${current === 'apartados' ? 'active shadow-sm' : ''}" ${current === 'apartados' ? 'style="background: #6f42c1; color: white; border-radius: 8px; margin-top: 0.3rem;"' : 'style="margin-top: 0.3rem;"'}>
                    <i class="bi bi-lock me-2"></i> Apartados
                </a>
                
                <a href="pos.html" class="nav-link-custom" style="background: #198754; color: white; border-radius: 8px; margin-top: 0.3rem;">
                    <i class="bi bi-cash-coin me-2"></i> Punto de Venta
                </a>
                
                <a href="admin-corte.html" class="nav-link-custom ${current === 'corte' ? 'active shadow-sm' : ''}" ${current === 'corte' ? 'style="background: #fd7e14; color: white; border-radius: 8px; margin-top: 0.3rem;"' : 'style="margin-top: 0.3rem;"'}>
                    <i class="bi bi-cash-stack me-2"></i> Corte de Caja
                </a>
                
                <a href="admin-historial-cortes.html" class="nav-link-custom ${current === 'historial' ? 'active shadow-sm' : ''}" ${current === 'historial' ? 'style="background: #6c757d; color: white; border-radius: 8px; margin-top: 0.3rem;"' : 'style="margin-top: 0.3rem;"'}>
                    <i class="bi bi-clock-history me-2"></i> Historial de Cortes
                </a>
                
                <a href="admin-reportes.html" class="btn btn-info w-100 py-2 fw-bold rounded-pill shadow-sm mt-3 ${current === 'reportes' ? 'active' : ''}">
                    <i class="bi bi-file-earmark-excel me-2"></i> Exportar Ventas
                </a>
                
                <div style="margin-top: 3rem; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 1rem;">
                    <a href="productos.html" class="nav-link-custom">
                        <i class="bi bi-shop"></i> Ir a la Tienda
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
        const isActive = (tab) => current === tab ? 'active' : '';

        this.innerHTML = `
        <div class="mobile-bottom-nav d-lg-none">
            <a href="productos.html" class="nav-item ${isActive('inicio')}">
                <i class="bi bi-house-door-fill"></i>
                <span>Inicio</span>
            </a>
            <a href="catalogo.html" class="nav-item ${isActive('catalogo')}">
                <i class="bi bi-search"></i>
                <span>Catálogo</span>
            </a>
            <a href="mis-listas.html" class="nav-item ${isActive('listas')}">
                <i class="bi bi-card-checklist"></i>
                <span>Mi Lista</span>
            </a>
            <a href="perfil.html" class="nav-item ${isActive('cuenta')}">
                <i class="bi bi-person-fill"></i>
                <span>Cuenta</span>
            </a>
            <a href="carrito.html" class="nav-item ${isActive('carrito')} position-relative">
                <i class="bi bi-cart-fill"></i>
                <span>Carrito</span>
                <span id="mobile-cart-count" class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger" style="font-size: 0.6rem; margin-top: 5px; margin-left: 10px;">0</span>
            </a>
        </div>
        
        <!-- Botón Flotante de WhatsApp con tu número -->
        <a href="https://wa.me/50371584643?text=${encodeURIComponent('¡Hola! Estoy interesado en los libros de MI LIBRERÍA. ¿Me pueden ayudar?')}" target="_blank" class="btn-whatsapp-float">
            <i class="bi bi-whatsapp"></i>
        </a>
        `;
    }
}
customElements.define('mi-bottom-nav', MiBottomNav);