/* Pesadilla – script.js
   Gestión del carrito con lógica de precios por escalas (tiers).
   Mejorado con lógica de envío gratis y feedback visual.
*/

// ==========================================
// 🕸️ PESADILLA MARKET - FILE SYNC v4.0
// ==========================================

const AS = "./assets";

// Tiers de Poleras (precio: [base, 3ud, 6ud, 12ud])
const T = {
  'oversize': { name: 'Elite Drop OVERSIZE', price: [140, 140, 140, 996] },
  'primera': { name: 'BÁSICA DE 1ERA', price: [135, 230, 449, 868] },
  'segunda': { name: 'BÁSICA DE 2DA', price: [85, 165, 300, 540] },
  'tercera': { name: 'BÁSICA DE 3ERA', price: [50, 99, 198, 396] }
};

// Accesorios (Nombres con guión medio)
const ACCESORIOS = {
    "llavero-nfc": { img: "llavero-nfc.jpg", vid: "llavero-nfc.mp4", price: 30.00 },
    "pin-gotico":  { img: "pin-gotico.jpg", vid: "pin-gotico.mp4", price: 12.50 }
};

// Combos
const COMBOS = {
  'dual-protocol': { name: 'DUAL PROTOCOL [Nuestra Canción]', price: 300 },
  'retail-pack': { name: 'RETAIL PACK [Venta Silenciosa]', price: 350 }
};

// DTF (usa .jpeg)
const DTF_DATA = { img: "dtf-premium.jpeg", vid: "dtf-premium.mp4", price: 35.00 };

(function () {
  'use strict';

  /* ---------- Selección de elementos ---------- */
  const cartToggle   = document.getElementById('cart-toggle');
  const cartSidebar  = document.getElementById('cart-sidebar');
  const cartOverlay  = document.getElementById('cart-overlay');
  const cartCount    = document.getElementById('cart-count');
  const cartTotal    = document.getElementById('cart-total');
  const cartItems    = document.getElementById('cart-items');
  const clearCartBtn = document.getElementById('clear-cart');

  let cart = JSON.parse(localStorage.getItem('pesadilla-cart') || '[]');

  /* ---------- Persistencia ---------- */
  function saveCart() {
    localStorage.setItem('pesadilla-cart', JSON.stringify(cart));
  }

  /* ---------- Helper: rutas de archivos (corrige barra diagonal) ---------- */
  function imgPath(file) { return AS + "/" + file; }
  function vidPath(file) { return AS + "/" + file; }

  /* ---------- Precios por Escalas (Tiers) ---------- */
  function getTieredPrice(productId, quantity, basePrice) {
    const item = T[productId];
    if (!item) return basePrice * quantity;
    const t = item.price; // [base, 3, 6, 12]

    // Lógica de búsqueda de tier más cercano (hacia abajo)
    if (quantity >= 12) return t[3] + (quantity - 12) * basePrice;
    if (quantity >= 6) return t[2] + (quantity - 6) * basePrice;
    if (quantity >= 3) return t[1] + (quantity - 3) * basePrice;

    return basePrice * quantity;
  }

  /* ---------- Actualizar UI ---------- */
  function updateCartUI() {
    // Cantidad total
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalQty;

    // Precio total usando tiers
    const totalPrice = cart.reduce((sum, item) => {
      return sum + getTieredPrice(item.id, item.qty, item.price);
    }, 0);

    // Lógica de Envío Gratis (Umbral 500 BOB)
    const shippingCost = totalPrice >= 500 ? 0 : 25;
    cartTotal.textContent = (totalPrice + shippingCost).toFixed(2);

    // Indicador visual de envío gratis
    const freeShippingMsg = document.getElementById('free-shipping-msg');
    const shippingProgress = document.getElementById('shipping-progress');
    const shippingBar = document.getElementById('shipping-bar');
    const shippingRemaining = document.getElementById('shipping-remaining');
    
    if (freeShippingMsg) {
      freeShippingMsg.style.color = totalPrice >= 500 ? '#00ff00' : '#E8D8D8';
      freeShippingMsg.textContent = totalPrice >= 500
        ? '¡ENVÍO GRATIS ACTIVADO!'
        : `Faltan BOB ${(500 - totalPrice).toFixed(2)} para envío gratis`;
    }
    
    // Update shipping progress bar
    if (shippingBar && shippingProgress) {
      const progress = Math.min((totalPrice / 500) * 100, 100);
      shippingBar.style.width = progress + '%';
      shippingProgress.classList.toggle('hidden', totalPrice >= 500);
      
      if (shippingRemaining) {
        if (totalPrice >= 500) {
          shippingRemaining.textContent = '¡Envío blindado gratis activado!';
        } else {
          shippingRemaining.textContent = `Aún te faltan ${(500 - totalPrice).toFixed(2)} BOB`;
        }
      }
    }

    // Lista de items
    cartItems.innerHTML = '';
    cart.forEach((item, idx) => {
      const subtotal = getTieredPrice(item.id, item.qty, item.price);
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${item.name} × ${item.qty} <small>(B${subtotal.toFixed(2)})</small></span>
        <span>$${subtotal.toFixed(2)} <button class="remove-item" data-idx="${idx}">✕</button></span>
      `;
      cartItems.appendChild(li);
    });

    // Handlers para eliminar
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-idx'));
        cart.splice(idx, 1);
        saveCart();
        updateCartUI();
      });
    });
  }

  /* ---------- Añadir al carrito ---------- */
  function addToCart(productCard) {
    // Extract product info from the card
    const name = productCard.querySelector('.product-name').textContent;
    const idEl = productCard.closest('[data-id]');
    const rawId = idEl ? idEl.getAttribute('data-id') : name;
    // Determine if this is a Polera (uses T tiers) or an accesorio
    let id = rawId;
    let price = 0;
    if (T[rawId]) {
        // Polera: use base price (first element in price array)
        price = T[rawId].price[0];
        id = rawId; // keep rawId as tier identifier
    } else if (ACCESORIOS[rawId]) {
        price = ACCESORIOS[rawId].price;
        id = rawId;
    } else if (COMBOS[rawId]) {
        price = COMBOS[rawId].price;
        id = rawId;
    } else if (rawId === 'dtf-premium' || rawId === 'dtf') {
        price = DTF_DATA.price;
        id = 'dtf';
    } else {
        // Fallback: try to read price from data attribute if present
        const priceEl = productCard.querySelector('.price-main[data-price], .product-price[data-price]');
        if (priceEl) {
            price = parseFloat(priceEl.getAttribute('data-price'));
        }
    }

    // Merge with existing cart entry
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }

    saveCart();
    updateCartUI();
    openCart();
    setTimeout(closeCart, 1500);
  }

  /* ---------- Feedback visual en botón ---------- */
  function animateButton(btn) {
    const original = btn.textContent;
    btn.textContent = '¡Añadido! 🐇';
    btn.style.backgroundColor = '#00ff00';
    btn.style.color = '#0A0A0A';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.backgroundColor = '';
      btn.style.color = '';
    }, 2000);
  }

  /* ---------- Mostrar / Ocultar sidebar ---------- */
  function openCart() {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('open');
  }

  function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('open');
  }

  cartToggle.addEventListener('click', () => {
    cartSidebar.classList.contains('open') ? closeCart() : openCart();
  });

  cartOverlay.addEventListener('click', closeCart);

  clearCartBtn.addEventListener('click', () => {
    cart = [];
    saveCart();
    updateCartUI();
  });

  /* ---------- Checkout / Modal Logic ---------- */
  const checkoutBtn = document.getElementById('checkout-btn');
  const paymentModal = document.getElementById('payment-modal');
  const closePayment = document.getElementById('close-payment');
  const summaryTotal = document.getElementById('summary-total');
  const summaryAdv   = document.getElementById('summary-advance');
  const waConfirmBtn = document.getElementById('whatsapp-confirm-btn');

  function openPaymentModal() {
    if (cart.length === 0) return alert('Tu carrito está vacío 🐇');

    const totalPrice = cart.reduce((sum, item) => {
      return sum + getTieredPrice(item.id, item.qty, item.price);
    }, 0);
    const shippingCost = totalPrice >= 500 ? 0 : 25;
    const finalTotal = totalPrice + shippingCost;
    const advancePrice = finalTotal * 0.5;

    summaryTotal.textContent = `${finalTotal.toFixed(2)} BOB`;
    summaryAdv.textContent = `${advancePrice.toFixed(2)} BOB`;

    // Generar link de WhatsApp con el resumen
    let message = `¡Hola Pesadilla Market! 🐇 He realizado un pedido:\n\n`;
    cart.forEach(item => {
      const subtotal = getTieredPrice(item.id, item.qty, item.price);
      message += `• ${item.name} x${item.qty} - BOB ${subtotal.toFixed(2)}\n`;
    });
    message += `\n*DESPLIEGUE EXTERNO (Courier/Yango/InDrive):* BOB ${shippingCost.toFixed(2)}`;
    message += `\n*TOTAL:* BOB ${finalTotal.toFixed(2)}`;
    message += `\n*ADELANTO REQUERIDO (50%):* BOB ${advancePrice.toFixed(2)}`;
    message += `\n\nAdjunto aquí mi comprobante de depósito para iniciar la fabricación. 🐇`;

    waConfirmBtn.href = `https://wa.me/59160390130?text=${encodeURIComponent(message)}`;

    paymentModal.classList.add('open');
    closeCart();
  }

  if (checkoutBtn) checkoutBtn.addEventListener('click', openPaymentModal);
  if (closePayment) closePayment.addEventListener('click', () => paymentModal.classList.remove('open'));

  /* ---------- Botones "Añadir al Carrito" ---------- */
  document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', function () {
      const card = this.closest('.product-card');
      addToCart(card);
      animateButton(this);
    });
  });

  /* ---------- Hover Video ---------- */
  document.querySelectorAll('.product-card').forEach(card => {
    const video = card.querySelector('.product-video');
    const img   = card.querySelector('.product-media img');
    if (!video) return;

    card.addEventListener('mouseenter', () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });

    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });

  /* ---------- Scroll Animations (RTFKT) ---------- */
  const scrollElements = document.querySelectorAll('[data-scroll]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        entry.target.classList.remove('in-view');
      }
    });
  }, { threshold: 0.2 });
  scrollElements.forEach(el => observer.observe(el));

  /* ---------- Header visibility on scroll ---------- */
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
      header.classList.add('visible');
      header.classList.add('glitch-active');
    } else {
      header.classList.remove('visible');
      header.classList.remove('glitch-active');
    }
  });

  /* ---------- Parallax on product media ---------- */
  const productMedias = document.querySelectorAll('.product-media');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    productMedias.forEach(media => {
      const rect = media.getBoundingClientRect();
      const speed = 0.1;
      const y = (rect.top + rect.height/2 - window.innerHeight/2) * speed;
      media.style.transform = `translateY(${y}px)`;
    });
  });

  /* Mouse tilt 3D disabled to allow CSS :hover effects (distribucion.html) */
  // (Original code removed to prevent conflicts with 3D CSS hover)
  // If needed later, restore from conversation history.

  /* ---------- Hero Carousel Editorial (END. Style) ---------- */
  let heroCurrentSlide = 0;
  const heroSlides = document.querySelectorAll('.hero-carousel .carousel-slide');
  const heroProgressBars = document.querySelectorAll('.progress-bar-wrapper');
  let heroInterval;

  function showHeroSlide(index) {
    heroSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      heroProgressBars[i].classList.toggle('active', i === index);
    });
    heroCurrentSlide = index;

    // Restart progress bar animation
    resetProgressBarAnimation();
  }

  function resetProgressBarAnimation() {
    heroProgressBars.forEach(bar => {
      const fill = bar.querySelector('.progress-bar-fill::after');
      // Force reflow to restart animation is tricky with ::after
      // Instead, we rely on the .active class in CSS
    });
  }

  function heroCarouselNext() {
    const next = (heroCurrentSlide + 1) % heroSlides.length;
    showHeroSlide(next);
  }

  window.carouselGoTo = function(index) {
    clearInterval(heroInterval);
    showHeroSlide(index);
    startHeroInterval();
  };

  function startHeroInterval() {
    heroInterval = setInterval(heroCarouselNext, 4800); // 4.8s to match CSS transition
  }

  // Initialize Hero Carousel
  if (heroSlides.length > 0) {
    showHeroSlide(0);
    startHeroInterval();
  }

  /* ---------- Featured Scroll (Destacados) ---------- */
  // The carousel is now an infinite CSS scroll. No JS rotation needed.


  /* ---------- addFeaturedToCart ---------- */
  window.addFeaturedToCart = function(name) {
    // Resolve product information from the new data structures
    let id = name;
    let price = 0;
    if (ACCESORIOS[name]) {
        price = ACCESORIOS[name].price;
    } else if (COMBOS[name]) {
        price = COMBOS[name].price;
    } else if (name === 'Estampado DTF' || name === 'dtf-premium') {
        price = DTF_DATA.price;
        id = 'dtf';
    } else {
        // Fallback: keep given price if provided (legacy calls)
        console.warn('addFeaturedToCart: unknown product', name);
        return;
    }

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    saveCart();
    updateCartUI();
    openCart();
    setTimeout(closeCart, 1500);
  };

  /* ---------- addPinesToCart ---------- */
  window.addPinesToCart = function() {
    const key = 'llavero-nfc';
    const item = ACCESORIOS[key];
    if (!item) return;
    const existing = cart.find(cartItem => cartItem.id === key);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: key, name: 'Llavero NFC Individual', price: item.price, qty: 1 });
    }
    saveCart();
    updateCartUI();
    openCart();
    setTimeout(closeCart, 1500);
  };

  /* ---------- Pines modal button (replaces inline onclick) ---------- */
  const pinesModalBtn = document.querySelector('.pines-info .btn-add-to-cart');
  if (pinesModalBtn) {
    pinesModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      addPinesToCart();
    });
  }

  /* ---------- Inicialización ---------- */
  updateCartUI();

})();

/* ---------- Audio Player (YZYI ICE) ---------- */
const audioPlayer = document.getElementById('bg-audio');
const playPauseBtn = document.getElementById('play-pause');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const audioProgress = document.getElementById('audio-progress');

if (playPauseBtn && audioPlayer) {
  playPauseBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
      if (iconPlay) iconPlay.classList.add('hidden');
      if (iconPause) iconPause.classList.remove('hidden');
    } else {
      audioPlayer.pause();
      if (iconPlay) iconPlay.classList.remove('hidden');
      if (iconPause) iconPause.classList.add('hidden');
    }
  });

  // Update progress bar
  audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
      const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      if (audioProgress) audioProgress.style.width = progress + '%';
    }
  });

  // Reset when ends
  audioPlayer.addEventListener('ended', () => {
    audioPlayer.currentTime = 0;
    if (iconPlay) iconPlay.classList.remove('hidden');
    if (iconPause) iconPause.classList.add('hidden');
    if (audioProgress) audioProgress.style.width = '0%';
  });
}

/* ---------- Glitch Effect on Scroll ---------- */
const glitchTitles = document.querySelectorAll('.category-title, .hero-title');
let glitchTimeout;

function checkGlitch() {
  glitchTitles.forEach(title => {
    const rect = title.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isVisible && !title.classList.contains('glitch-active')) {
      title.classList.add('glitch-active');
      clearTimeout(glitchTimeout);
      glitchTimeout = setTimeout(() => {
        title.classList.remove('glitch-active');
      }, 300);
    }
  });
}

window.addEventListener('scroll', checkGlitch);
window.addEventListener('load', checkGlitch);
