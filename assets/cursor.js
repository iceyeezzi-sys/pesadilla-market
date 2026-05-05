/**
 * Pesadilla Store - Global Tactical Cursor System (Final Visibility Version)
 */

(function() {
    // 1. Detección de dispositivos (solo ocultar en móviles pequeños)
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    // 2. Creación forzada de elementos
    const cursor = document.createElement('div');
    cursor.id = 'cursor';
    const follower = document.createElement('div');
    follower.id = 'cursor-follower';
    
    document.body.appendChild(cursor);
    document.body.appendChild(follower);

    // 3. Variables de posición inicial (Centro de pantalla)
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX, cursorY = mouseY;
    let followerX = mouseX, followerY = mouseY;

    // 4. Captura de movimiento
    let firstMove = true;
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (firstMove) {
            cursor.style.opacity = '1';
            follower.style.opacity = '1';
            cursorX = mouseX;
            cursorY = mouseY;
            followerX = mouseX;
            followerY = mouseY;
            firstMove = false;
        }
    });

    // 5. Motor de renderizado ultra-suave
    function render() {
        // Interpolación lineal para el efecto rastro
        cursorX += (mouseX - cursorX) * 0.4;
        cursorY += (mouseY - cursorY) * 0.4;
        
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;

        // Aplicar transformaciones con translate3d para GPU
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
        follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0) translate(-50%, -50%)`;

        requestAnimationFrame(render);
    }
    
    render();

    // 6. Sistema de Interacción Universal (Escala y Blanco)
    function refreshInteractions() {
        const triggers = 'a, button, .product-card, .drop-card, .hotspot, input, [onclick], .interactive';
        document.querySelectorAll(triggers).forEach(el => {
            if (el.dataset.cursorReady) return;
            
            el.addEventListener('mouseenter', () => {
                cursor.style.width = '30px';
                cursor.style.height = '30px';
                cursor.style.backgroundColor = '#ffffff';
                follower.style.width = '60px';
                follower.style.height = '60px';
                follower.style.borderColor = '#ffffff';
            });
            
            el.addEventListener('mouseleave', () => {
                cursor.style.width = '12px';
                cursor.style.height = '12px';
                cursor.style.backgroundColor = '#ff0000';
                follower.style.width = '40px';
                follower.style.height = '40px';
                follower.style.borderColor = '#ff0000';
            });
            
            el.dataset.cursorReady = 'true';
        });
    }

    refreshInteractions();
    // Observar cambios para nuevos elementos
    new MutationObserver(refreshInteractions).observe(document.body, { childList: true, subtree: true });

})();
