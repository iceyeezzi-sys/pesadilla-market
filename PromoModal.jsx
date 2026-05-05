import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';

export default function PromoModal() {
  const [isVisible, setIsVisible] = useState(false);

  // Persistencia: no mostrar si el usuario ya lo cerró (duración: 24h)
  useEffect(() => {
    const dismissed = localStorage.getItem('pesadilla-promo-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return;

    const timer = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pesadilla-promo-dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">

          {/* Backdrop con efecto bloom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Ventana flotante con Glassmorphism */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-zinc-950 border border-red-600/30 w-full max-w-lg overflow-hidden shadow-[0_0_80px_rgba(200,16,46,0.2)]"
          >
            {/* Botón Cerrar */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white/40 hover:text-white z-10 transition-colors"
              aria-label="Cerrar promoción"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Imagen con efecto Chromatic Aberration */}
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-zinc-900 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img
                  src="assets/combo-silencioso.jpg"
                  alt="Combo Venta Silenciosa"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-105 hover:scale-100"
                  onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full bg-zinc-800 flex items-center justify-center text-white/20 text-xs">COMBO</svg>'; }}
                />
                {/* Efecto glow rojo en esquinas */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-red-600/40" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-red-600/40" />
              </div>

              {/* Contenido de la oferta */}
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-black relative">
                <span className="text-red-600 font-bold text-[10px] tracking-[0.4em] uppercase mb-2 flex items-center gap-2">
                  <Zap size={12} fill="currentColor" /> Oferta Relámpago 🐇
                </span>
                <h3 className="text-2xl font-black uppercase leading-tight mb-4 italic font-syne">
                  Venta <br /> Silenciosa
                </h3>
                <p className="text-white/40 text-xs mb-6 leading-relaxed">
                  3 Poleras Premium + Llavero NFC de regalo. <br />
                  <span className="text-white font-semibold">Solo por las próximas 24 horas.</span>
                </p>

                {/* Precio con estilo "ingeniería" */}
                <div className="text-3xl font-mono text-red-500 mb-8 font-bold tracking-wider">
                  350.00 <span className="text-sm text-white/40">BOB</span>
                </div>

                <a
                  href="https://wa.me/59160390130?text=Hola%20Pesadilla!%20Quiero%20el%20Combo%20Venta%20Silenciosa%20de%203%20poleras%20%2B%20llavero%20NFC%20%F0%9F%90%87"
                  className="w-full bg-white text-black py-4 text-center font-black text-[10px] tracking-[0.2em] uppercase hover:bg-red-600 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
                  onClick={handleDismiss}
                >
                  CONSEGUIR AHORA 🐇
                </a>
              </div>
            </div>

            {/* Decoración gótica esquinas inferiores */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-red-600/50" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-red-600/50" />

            {/* Línea superior con gradiente neón */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
