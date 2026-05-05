// =========================================
// 🕸️ PESADILLA MARKET - CORE DATA v3.0
// =========================================

const AS = "./assets"; // Carpeta de recursos

// Tiers: [Unidad, 3ud/Cuarto, 6ud/Media, 12ud/Docena]
const T = {
  "premium-1ra": [137.42, 300.00, 580.00, 1100.00],
  "estandar-2da": [94.75, 260.00, 500.00, 950.00],
  "economica-3ra": [74.50, 210.00, 400.00, 750.00],
  "basica-4ta": [32.80, 95.00, 185.00, 360.00]
};

// Bundles & Servicios (Precios escalonados)
const B_DTF = { ud: 35.00, d2: 65.42, d3: 95.75, d6: 180.90, d12: 342.42 };
const B_PIN = { ud: 12.50, d2: 23.42, d3: 32.75, d6: 59.90, d12: 108.42 };
const B_GEN = { v_silenciosa: 350.00, n_cancion: 300.00 };

const FREE_SHIPPING_THRESHOLD = 500.00;

// =========================================
// // CART STATE & PERSISTENCE
// =========================================
let cart = JSON.parse(localStorage.getItem('pesadilla-cart')) || [];

const saveCart = () => {
  localStorage.setItem('pesadilla-cart', JSON.stringify(cart));
};

// =========================================
// // PRICE ENGINE
// =========================================

/**
 * Devuelve el precio total para un producto según su id y cantidad.
 * - Poleras usan las tablas T (tiers 1/3/6/12).
 * - Pines usan B_PIN (escalonado por docenas).
 * - DTF usa B_DTF.
 * - Bundles (combos) usan B_GEN (precio fijo).
 * - Otros usan el atributo data-price del HTML.
 */
const getProductPrice = (id, qty) => {
  // 1. Poleras (tiers)
  if (T[id]) {
    const tiers = T[id];
    if (qty >= 12) return tiers[3];
    if (qty >= 6) return tiers[2];
    if (qty >= 3) return tiers[1];
    return tiers[0] * qty; // unidad * cantidad
  }

  // 2. Pines (B_PIN)
  if (id === 'pin-gotico') {
    if (qty >= 12) return B_PIN.d12;
    if (qty >= 6) return B_PIN.d6;
    if (qty >= 3) return B_PIN.d3;
    if (qty >= 2) return B_PIN.d2;
    return B_PIN.ud * qty;
  }

  // 3. Llaveros NFC (precio unitario fijo)
  if (id === 'llavero-nfc') {
    return 30.00 * qty;
  }

  // 4. DTF (B_DTF)
  if (id === 'dtf-premium') {
    if (qty >= 12) return B_DTF.d12;
    if (qty >= 6) return B_DTF.d6;
    if (qty >= 3) return B_DTF.d3;
    if (qty >= 2) return B_DTF.d2;
    return B_DTF.ud * qty;
  }

  // 5. Combos / Bundles (precio fijo)
  if (id === 'v_silenciosa') return B_GEN.v_silenciosa;
  if (id === 'n_cancion') return B_GEN.n_cancion;

  // 6. Fallback: usar data-price del HTML (polera-base, etc.)
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) {
    const unitPrice = parseFloat(card.querySelector('.price-main')?.dataset.price || 0);
    return unitPrice * qty;
  }

  return 0;
};

// =========================================
// // CART UI
// =========================================
const updateCartUI = () => {
  const cartCount = document.getElementById('cart-count');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const shippingBar = document.getElementById('shipping-bar');
  const shippingRemaining = document.getElementById('shipping-remaining');
  const freeShippingMsg = document.getElementById('free-shipping-msg');

  let totalQuantity = 0;
  let totalPrice = 0;
  cartItems.innerHTML = '';

  cart.forEach(item => {
    const itemTotal = getProductPrice(item.id, item.quantity);
    totalQuantity += item.quantity;
    totalPrice += itemTotal;

    const li = document.createElement('li');
    li.className = 'flex justify-between items-center pb-4 border-b border-[#8B0000]/10';
    li.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${item.image}" class="w-12 h-12 object-cover rounded" alt="${item.name}" />
        <div>
          <div class="font-bold text-xs">${item.name}</div>
          <div class="text-[10px] opacity-60">${item.quantity} ud · ${getProductPrice(item.id, 1).toFixed(2)} BOB/u</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-mono text-xs">${itemTotal.toFixed(2)} BOB</span>
        <button class="remove-item text-red-500 hover:text-red-300 text-lg" data-id="${item.id}" aria-label="Eliminar ${item.name}">×</button>
      </div>
    `;
    cartItems.appendChild(li);
  });

  cartCount.textContent = totalQuantity;
  cartTotal.textContent = totalPrice.toFixed(2);

  // Progreso de envío gratuito
  const remaining = FREE_SHIPPING_THRESHOLD - totalPrice;
  const percentage = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100);

  shippingBar.style.width = `${percentage}%`;
  if (remaining <= 0) {
    shippingRemaining.textContent = '¡Envío blindado gratis activado!';
    freeShippingMsg.textContent = '🎉 Tienes envío gratis en tu pedido.';
  } else {
    shippingRemaining.textContent = `Aún te faltan ${remaining.toFixed(2)} BOB`;
    freeShippingMsg.textContent = '';
  }

  saveCart();
};

// =========================================
// // CART ACTIONS
// =========================================
const addToCart = (productCard) => {
  const id = productCard.dataset.id;
  if (!id) return;
  const name = productCard.querySelector('.product-name')?.textContent || 'Producto';
  const image = productCard.querySelector('.product-media img')?.src || '';

  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id, name, image, quantity: 1 });
  }

  updateCartUI();

  // Mostrar el carrito brevemente al añadir
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if (sidebar.classList.contains('translate-x-full')) {
    sidebar.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    setTimeout(() => {
      sidebar.classList.add('translate-x-full');
      overlay.classList.add('hidden');
    }, 1500);
  }
};

const removeFromCart = (id) => {
  cart = cart.filter(item => item.id !== id);
  updateCartUI();
};

const clearCart = () => {
  cart = [];
  updateCartUI();
};

// =========================================
// // CART TOGGLE
// =========================================
const toggleCart = () => {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  sidebar.classList.toggle('translate-x-full');
  overlay.classList.toggle('hidden');
};

// =========================================
// // VISIÓN NOCTURNA DINÁMICA
// =========================================
function controlarEstadoAlerta() {
    const hora = new Date().getHours();
    const body = document.body;

    // Modo Vigilancia: De 18:00 (6 PM) a 06:00 (6 AM)
    if (hora >= 18 || hora < 6) {
        if (!body.classList.contains('modo-vigilancia')) {
            body.classList.add('modo-vigilancia');
            console.log('🕸️ MODO VIGILANCIA ACTIVADO: Visión Nocturna Iniciada.');
        }
    } else {
        if (body.classList.contains('modo-vigilancia')) {
            body.classList.remove('modo-vigilancia');
            console.log('🏙️ MODO OPERATIVO: Estética Limpia Activada.');
        }
    }
}

// Ejecutar al cargar y revisar cada minuto
document.addEventListener('DOMContentLoaded', () => {
    controlarEstadoAlerta();
    setInterval(controlarEstadoAlerta, 60000);
});

// =========================================
// // VIDEO HOVER
// =========================================
const initVideoHover = () => {
  const productMedias = document.querySelectorAll('.product-media');
  productMedias.forEach(media => {
    const video = media.querySelector('.product-video');
    if (!video) return;

    media.addEventListener('mouseenter', () => {
      video.play().catch(e => console.log('Reproducción de video fallida:', e));
    });

    media.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });
};

// -------------------------------------------------
// Iniciar reproducción del video al pasar el mouse sobre la tarjeta del producto
// -------------------------------------------------
const productCards = document.querySelectorAll('.product-card');
productCards.forEach(card => {
  const video = card.querySelector('video');
  if (video) {
    // Al entrar el mouse: reproducir el video
    card.addEventListener('mouseenter', () => {
      video.play().catch(err => console.log('Reproducción bloqueada:', err));
    });
    // Al salir del mouse: pausar y reiniciar el video
    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  }
});

// =========================================
// // PINES MODAL
// =========================================
const initPinesModal = () => {
  const modal = document.getElementById('pines-modal');
  const closeBtn = document.getElementById('close-pines');
  const pinesProduct = document.querySelector('[data-id="pin-gotico"]');

  if (pinesProduct) {
    pinesProduct.addEventListener('click', (e) => {
      if (e.target.closest('.btn-add-to-cart')) return;
      modal.classList.remove('hidden');
      document.getElementById('pines-video').play();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      document.getElementById('pines-video').pause();
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      document.getElementById('pines-video').pause();
    }
  });
};

// =========================================
// // FEATURED CAROUSEL (Full‑width, video background)
// =========================================
const initFeaturedCarousel = () => {
  // Crear el contenedor full‑width
  const carousel = document.createElement('section');
  carousel.id = 'featured-carousel';
  carousel.className = 'hero-carousel w-screen relative overflow-hidden';
  carousel.style.height = '90vh';
  carousel.innerHTML = `
    <div class="carousel-container relative w-full h-full">
      ${F.map((item, idx) => `
        <div class="carousel-slide absolute inset-0 ${idx === 0 ? 'active' : ''}" data-id="${item.id}">
          <video class="w-full h-full object-cover" autoplay muted loop playsinline>
            <source src="${AS}/${item.file}" type="video/mp4" />
          </video>
          <div class="slide-overlay absolute inset-0 bg-gradient-to-t from-[#0a0000]/80 to-transparent z-10"></div>
          <div class="slide-content absolute bottom-0 left-0 p-8 z-20 max-w-2xl">
            <div class="slide-tag text-[#8B0000] text-xs uppercase tracking-widest mb-2">Destacado</div>
            <h2 class="slide-title text-4xl md:text-6xl font-black uppercase italic text-white">${item.name}</h2>
            <div class="slide-price text-xl text-white mt-4">${item.price.toFixed(2)} BOB</div>
            <button class="btn-add-featured mt-6 bg-red-600 text-white px-6 py-3 font-bold uppercase text-xs hover:bg-[#8B0000] transition"
              data-id="${item.id}">
              Añadir al Carrito
            </button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="carousel-progress-container absolute bottom-8 left-8 right-8 flex gap-4 z-30">
      ${F.map((item, idx) => `
        <div class="progress-bar-wrapper flex-1 cursor-pointer ${idx === 0 ? 'active' : ''}" data-index="${idx}">
          <div class="progress-bar-fill h-0.5 bg-white/20 relative overflow-hidden">
            <div class="progress-bar-fill-inner h-full bg-white w-0 transition-all duration-[4800ms] linear"></div>
          </div>
          <span class="progress-label block text-[10px] uppercase tracking-widest text-white/40 mt-1">${item.name}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Insertar después de la sección Pesadilla Market
  const marketSection = document.querySelector('section.text-center');
  if (marketSection && marketSection.nextElementSibling) {
    marketSection.parentNode.insertBefore(carousel, marketSection.nextElementSibling);
  }

  // Lógica de rotación automática
  let current = 0;
  const slides = carousel.querySelectorAll('.carousel-slide');
  const wrappers = carousel.querySelectorAll('.progress-bar-wrapper');

  const goTo = (idx) => {
    slides[current].classList.remove('active');
    wrappers[current].classList.remove('active');
    // reset progress bar
    wrappers[current].querySelector('.progress-bar-fill-inner').style.width = '0%';

    current = idx;
    slides[current].classList.add('active');
    wrappers[current].classList.add('active');
    // animar barra
    wrappers[current].querySelector('.progress-bar-fill-inner').style.width = '100%';
  };

  let interval = setInterval(() => {
    goTo((current + 1) % slides.length);
  }, 5000);

  // Pausar al hacer hover
  carousel.addEventListener('mouseenter', () => clearInterval(interval));
  carousel.addEventListener('mouseleave', () => {
    interval = setInterval(() => {
      goTo((current + 1) % slides.length);
    }, 5000);
  });

  // Click en barras de progreso
  wrappers.forEach(wrapper => {
    wrapper.addEventListener('click', () => {
      const idx = parseInt(wrapper.dataset.index);
      if (idx !== current) goTo(idx);
    });
  });

  // Botones de añadir en el carrusel
  carousel.querySelectorAll('.btn-add-featured').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      // Buscar producto en el DOM para aprovechar addToCart
      const card = document.querySelector(`[data-id="${id}"]`) ||
                    (id === 'v_silenciosa' ? document.querySelector('[data-id="v_silenciosa"]') : null) ||
                    (id === 'n_cancion' ? document.querySelector('[data-id="n_cancion"]') : null);
      if (card) {
        addToCart(card);
      } else {
        // Fallback: añadir directamente
        const itemData = F.find(f => f.id === id);
        if (itemData) {
          const existing = cart.find(item => item.id === id);
          if (existing) existing.quantity += 1;
          else cart.push({ id, name: itemData.name, image: '', quantity: 1 });
          updateCartUI();
        }
      }
    });
  });

  // Iniciar barra de progreso del primer slide
  wrappers[0].querySelector('.progress-bar-fill-inner').style.width = '100%';
};

// =========================================
// // SMOOTH SCROLL & ACTIVE NAV
// =========================================
const initSmoothScroll = () => {
  document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};

const initActiveNav = () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop;
      if (scrollY >= top - 200) current = section.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('text-[#E8D8D8]', 'opacity-100');
      link.classList.add('opacity-50');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('text-[#E8D8D8]', 'opacity-100');
        link.classList.remove('opacity-50');
      }
    });
  });
};

// =========================================
// // DTF MEDIA FIX – asegurar atributos
// =========================================
const fixDtfVideo = () => {
  const dtfCard = document.querySelector('#dtf .product-media');
  if (!dtfCard) return;
  const video = dtfCard.querySelector('.product-video');
  if (video) {
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    // Verificar ruta (usar dtf-premium.mp4)
    const source = video.querySelector('source');
    if (source && !source.src.includes('dtf-premium.mp4')) {
      source.src = './assets/dtf-premium.mp4';
      video.load();
    }
  }
  // Añadir data-id si no existe
  const dtfProduct = document.querySelector('#dtf .product-card');
  if (dtfProduct && !dtfProduct.dataset.id) {
    dtfProduct.dataset.id = 'dtf-premium';
  }
};

// =========================================
// // 3D TILT PARALLAX (Seguimiento del ratón)
// =========================================
const initTiltCards = () => {
  const cards = document.querySelectorAll('.product-card');

  cards.forEach(card => {
    let animationFrame;

    card.addEventListener('mousemove', (e) => {
      if (animationFrame) cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;   // posición X dentro de la tarjeta
        const y = e.clientY - rect.top;    // posición Y dentro de la tarjeta

        // Calculamos el porcentaje de posición (de -0.5 a 0.5)
        const percentX = (x / rect.width) - 0.5;
        const percentY = (y / rect.height) - 0.5;

        // Aplicamos rotación 3D (máximo ±15 grados)
        const rotateY = percentX * 30;  // left-right
        const rotateX = -percentY * 30; // up-down (invertido)

        // Brillo que sigue al ratón (efecto "luz")
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;

        // Aplicar transformación 3D
        card.style.transform = `
          perspective(1200px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          translateZ(50px)
          scale(1.02)
        `;

        // Buscar o crear el elemento de brillo (glare)
        let glare = card.querySelector('.tilt-glare');
        if (!glare) {
          glare = document.createElement('div');
          glare.className = 'tilt-glare';
          glare.style.cssText = `
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.3s ease;
          `;
          card.appendChild(glare);
        }
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
        glare.style.opacity = '1';
      });
    });

    card.addEventListener('mouseleave', () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      card.style.transform = '';
      const glare = card.querySelector('.tilt-glare');
      if (glare) glare.style.opacity = '0';
    });
  });
};

// =========================================
// // 3D TILT HERO TITLE (Pesadilla Market)
// =========================================
const initHeroTilt = () => {
  const hero = document.getElementById('hero-title-section');
  const heroTitle = document.getElementById('hero-title');
  if (!hero || !heroTitle) return;

  let animationFrame;

  hero.addEventListener('mousemove', (e) => {
    if (animationFrame) cancelAnimationFrame(animationFrame);

    animationFrame = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const percentX = (x / rect.width) - 0.5;
      const percentY = (y / rect.height) - 0.5;

      // Rotación más sutil para el título (máximo ±8 grados)
      const rotateY = percentX * 16;
      const rotateX = -percentY * 16;

      heroTitle.style.transform = `
        perspective(1200px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale(1.02)
      `;
    });
  });

  hero.addEventListener('mouseleave', () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    heroTitle.style.transform = 'perspective(1200px)';
  });
};

// =========================================
// // INIT
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  initTiltCards(); // Activar efecto 3D
  initHeroTilt(); // Activar efecto 3D en título
  updateCartUI();

  // --- Eventos del carrito ---
  document.getElementById('cart-toggle')?.addEventListener('click', toggleCart);
  document.getElementById('close-cart')?.addEventListener('click', toggleCart);
  document.getElementById('cart-overlay')?.addEventListener('click', toggleCart);

  // --- Botones de añadir al carrito ---
  document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (card) addToCart(card);
    });
  });

  // --- Delegación para eliminar items ---
  document.getElementById('cart-items')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item')) {
      removeFromCart(e.target.dataset.id);
    }
  });

  // --- Vaciar carrito ---
  document.getElementById('clear-cart')?.addEventListener('click', clearCart);

  // --- Video hover ---
  initVideoHover();

  // --- Modal de pines ---
  initPinesModal();

  // --- Carrusel destacado (removed)

  // --- Desplazamiento suave ---
  initSmoothScroll();

  // --- Nav activa ---
  initActiveNav();

  // --- Fix DTF video ---
  fixDtfVideo();

  // --- Cerrar con Escape ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const sidebar = document.getElementById('cart-sidebar');
      const modal = document.getElementById('pines-modal');
      if (sidebar && !sidebar.classList.contains('translate-x-full')) toggleCart();
      if (modal && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
        document.getElementById('pines-video')?.pause();
      }
    }
  });

  // --- Scroll Animations (IntersectionObserver for [data-scroll]) ---
  const scrollElements = document.querySelectorAll('[data-scroll]');
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        entry.target.classList.remove('in-view');
      }
    });
  }, { threshold: 0.2 });
  scrollElements.forEach(el => scrollObserver.observe(el));
});

// =========================================
// // FUNCIÓN GLOBAL PARA MODAL DE PINES
// =========================================
const addPinesToCart = () => {
  const pinesProduct = document.querySelector('[data-id="pin-gotico"]');
  if (pinesProduct) {
    addToCart(pinesProduct);
    document.getElementById('pines-modal')?.classList.add('hidden');
    document.getElementById('pines-video')?.pause();
  }
};
