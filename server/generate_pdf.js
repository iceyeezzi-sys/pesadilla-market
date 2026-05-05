const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function getBase64Image(filename) {
  try {
    const filePath = path.join(__dirname, '..', 'assets', filename);
    const ext = path.extname(filename).substring(1);
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : 'png';
    const base64 = fs.readFileSync(filePath).toString('base64');
    return `data:image/${mime};base64,${base64}`;
  } catch(e) {
    console.error("No se pudo cargar:", filename);
    return '';
  }
}

const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    
    body {
      background-color: #050505;
      color: #E8D8D8;
      font-family: 'Syne', sans-serif;
      margin: 0;
      padding: 40px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid rgba(255, 0, 0, 0.3);
      padding: 40px;
      position: relative;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #ff0000;
      padding-bottom: 20px;
    }
    
    .title {
      font-size: 36px;
      font-weight: 800;
      color: #ff0000;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0;
    }
    
    .subtitle {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: #888;
      margin-top: 10px;
    }
    
    .product-section {
      margin-bottom: 30px;
      background: rgba(20, 0, 0, 0.5);
      border-left: 4px solid #ff0000;
      padding: 20px;
      display: flex;
      gap: 20px;
      align-items: center;
    }
    
    .product-image {
      width: 150px;
      height: 150px;
      object-fit: cover;
      border: 1px solid rgba(255, 0, 0, 0.5);
      border-radius: 4px;
      flex-shrink: 0;
    }
    
    .product-info {
      flex-grow: 1;
    }
    
    .product-title {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 10px 0;
      text-transform: uppercase;
    }
    
    .product-desc {
      font-size: 14px;
      color: #ccc;
      margin-bottom: 15px;
    }
    
    .price-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
    }
    
    .price-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 8px;
      border: 1px dashed rgba(255, 255, 255, 0.2);
    }
    
    .price-item span {
      color: #ff0000;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #666;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
    }
    
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      color: rgba(255, 0, 0, 0.03);
      font-weight: 900;
      pointer-events: none;
      z-index: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="watermark">PESADILLA</div>
    <div class="header">
      <h1 class="title">MANIFIESTO DE SUMINISTROS</h1>
      <div class="subtitle">ESTADO: ACTUALIZADO // V4.5 // CONFIDENCIAL</div>
    </div>

    <!-- ELITE DROP -->
    <div class="product-section">
      <img class="product-image" src="${getBase64Image('POLERA1.jpg')}" alt="Elite Drop" />
      <div class="product-info">
        <h2 class="product-title">📦 #1. Elite Drop OVERSIZE</h2>
        <p class="product-desc">Corte premium de alta densidad (Algodón 20/1 Selecto). Disponible en Blanco, Negro y +20 colores. Escala: Solo disponible por Docena.</p>
        <div class="price-grid">
          <div class="price-item">RAW (Sin Diseño):<br><span>996 BOB / Docena</span></div>
          <div class="price-item">CON DISEÑO (DTF):<br><span>140 BOB / Unidad</span></div>
        </div>
      </div>
    </div>

    <!-- BASICA 1ERA -->
    <div class="product-section">
      <div class="product-info">
        <h2 class="product-title">📦 #2. BÁSICA DE 1ERA</h2>
        <p class="product-desc">Algodón 20/1 Selecto. Cuello redondo/V, corte entallado, costura doble. No se decolora. (Tallas S, M, L)</p>
        <div class="price-grid">
          <div class="price-item">Unidad [RAW]: <span>80 BOB</span></div>
          <div class="price-item">Cuarta (4): <span>230 BOB</span></div>
          <div class="price-item">Media (6): <span>449 BOB</span></div>
          <div class="price-item">Docena (12): <span>868 BOB</span></div>
        </div>
        <p style="font-size: 11px; color: #888; margin-top: 8px;">* Tallas XL y XXL: +5 BOB por unidad.<br>* Con Diseño (DTF): 135 BOB / Unidad.</p>
      </div>
      <img class="product-image" src="${getBase64Image('POLERA2.jpg')}" alt="Básica 1era" />
    </div>

    <!-- BASICA 2DA -->
    <div class="product-section">
      <img class="product-image" src="${getBase64Image('POLERA3.jpg')}" alt="Básica 2da" />
      <div class="product-info">
        <h2 class="product-title">📦 #3. BÁSICA DE 2DA</h2>
        <p class="product-desc">100% Algodón Standard. Cuello redondo, costura doble, masculino/unisex. (Tallas S, M, L)</p>
        <div class="price-grid">
          <div class="price-item">Unidad [RAW]: <span>60 BOB</span></div>
          <div class="price-item">Cuarta (4): <span>165 BOB</span></div>
          <div class="price-item">Media (6): <span>300 BOB</span></div>
          <div class="price-item">Docena (12): <span>540 BOB</span></div>
        </div>
        <p style="font-size: 11px; color: #888; margin-top: 8px;">* Tallas XL y XXL: +5 BOB por unidad.<br>* Con Diseño (DTF): 85 BOB / Unidad.</p>
      </div>
    </div>

    <!-- BASICA 3ERA -->
    <div class="product-section">
      <div class="product-info">
        <h2 class="product-title">📦 #4. BÁSICA DE 3ERA</h2>
        <p class="product-desc">Lienzo Core Resource (Algodón Básico). Solo a pedido.</p>
        <div class="price-grid">
          <div class="price-item">Pack 3 Unidades: <span>99 BOB</span></div>
          <div class="price-item">Media (6): <span>198 BOB</span></div>
          <div class="price-item">Docena (12): <span>396 BOB</span></div>
        </div>
        <p style="font-size: 11px; color: #888; margin-top: 8px;">* Con Diseño (DTF): 50 BOB / Unidad.</p>
      </div>
      <img class="product-image" src="${getBase64Image('POLERA4.jpg')}" alt="Básica 3era" />
    </div>

    <!-- LLAVERO NFC -->
    <div class="product-section" style="border-left-color: #0f0;">
      <img class="product-image" src="${getBase64Image('llavero-nfc.jpg')}" alt="Llavero NFC" style="border-color: rgba(0,255,0,0.5);" />
      <div class="product-info">
        <h2 class="product-title" style="color: #0f0;">🔑 LLAVERO NFC_v1</h2>
        <p class="product-desc">Tecnología de proximidad. Comparte tu contacto, links o secretos con solo acercar el celular.</p>
        <div class="price-grid">
          <div class="price-item" style="border-color: rgba(0,255,0,0.2);">Unidad:<br><span style="color:#0f0;">30 BOB</span></div>
          <div class="price-item" style="border-color: rgba(0,255,0,0.2);">Docena (12):<br><span style="color:#0f0;">240 BOB</span></div>
          <div class="price-item" style="border-color: rgba(0,255,0,0.2);">Cien (100):<br><span style="color:#0f0;">1500 BOB</span></div>
          <div class="price-item" style="border-color: rgba(0,255,0,0.2);">Mil (1000):<br><span style="color:#0f0;">10000 BOB</span></div>
        </div>
      </div>
    </div>

    <!-- DUAL PROTOCOL -->
    <div class="product-section" style="border-left-color: #fff;">
      <div class="product-info">
        <h2 class="product-title" style="color: #fff;">🎧 DUAL PROTOCOL</h2>
        <p class="product-desc">Combo especial "Nuestra Canción". Incluye polera temática y detalles únicos de diseño.</p>
        <div class="price-grid" style="grid-template-columns: 1fr;">
          <div class="price-item" style="border-color: rgba(255,255,255,0.2);">Paquete Completo:<br><span style="color:#fff;">300 BOB</span></div>
        </div>
      </div>
      <img class="product-image" src="${getBase64Image('n_cancion.jpg')}" alt="Nuestra Cancion" style="border-color: rgba(255,255,255,0.5);" />
    </div>

    <!-- RETAIL PACK -->
    <div class="product-section" style="border-left-color: #f0f;">
      <img class="product-image" src="${getBase64Image('v_silenciosa.jpg')}" alt="Venta Silenciosa" style="border-color: rgba(255,0,255,0.5);" />
      <div class="product-info">
        <h2 class="product-title" style="color: #f0f;">🤫 RETAIL PACK</h2>
        <p class="product-desc">"Venta Silenciosa". Piezas exclusivas bajo el radar. Unidades limitadas.</p>
        <div class="price-grid" style="grid-template-columns: 1fr;">
          <div class="price-item" style="border-color: rgba(255,0,255,0.2);">Paquete Completo:<br><span style="color:#f0f;">350 BOB</span></div>
        </div>
      </div>
    </div>

    <!-- BLOQUE DE DISTRIBUCION POR CANTIDADES -->
    <div class="product-section" style="background: rgba(255, 0, 0, 0.1); border-left-color: #ff0000; display: block;">
      <h2 class="product-title" style="color: #ff0000; text-align: center; font-size: 20px;">📦 PRECIOS DE DISTRIBUCIÓN (RAW)</h2>
      <p class="product-desc" style="text-align: center;">Escala oficial para distribuidores y pedidos por cantidad.</p>
      
      <div class="price-grid" style="grid-template-columns: 1fr 1fr 1fr; margin-top: 20px; text-align: center;">
        
        <!-- 1ERA -->
        <div class="price-item" style="border-color: rgba(255,0,0,0.3);">
          <span style="color:#fff; font-weight: bold; font-size: 14px;">BÁSICA 1ERA</span><br><br>
          <span style="font-size: 12px; color:#ccc;">Cuarta (4):</span> <span style="color:#ff0000;">230 BOB</span><br>
          <span style="font-size: 12px; color:#ccc;">Media (6):</span> <span style="color:#ff0000;">449 BOB</span><br>
          <span style="font-size: 12px; color:#ccc;">Docena (12):</span> <span style="color:#ff0000;">868 BOB</span>
        </div>

        <!-- 2DA -->
        <div class="price-item" style="border-color: rgba(255,0,0,0.3);">
          <span style="color:#fff; font-weight: bold; font-size: 14px;">BÁSICA 2DA</span><br><br>
          <span style="font-size: 12px; color:#ccc;">Cuarta (4):</span> <span style="color:#ff0000;">165 BOB</span><br>
          <span style="font-size: 12px; color:#ccc;">Media (6):</span> <span style="color:#ff0000;">300 BOB</span><br>
          <span style="font-size: 12px; color:#ccc;">Docena (12):</span> <span style="color:#ff0000;">540 BOB</span>
        </div>

        <!-- 3ERA -->
        <div class="price-item" style="border-color: rgba(255,0,0,0.3);">
          <span style="color:#fff; font-weight: bold; font-size: 14px;">BÁSICA 3ERA</span><br><br>
          <span style="font-size: 12px; color:#ccc;">Pack (3):</span> <span style="color:#ff0000;">99 BOB</span><br>
          <span style="font-size: 12px; color:#ccc;">Media (6):</span> <span style="color:#ff0000;">198 BOB</span><br>
          <span style="font-size: 12px; color:#ccc;">Docena (12):</span> <span style="color:#ff0000;">396 BOB</span>
        </div>

      </div>
      <p style="font-size: 11px; color: #888; margin-top: 15px; text-align: center;">* Elite Drop Oversize: 996 BOB / Docena. Tallas XL y XXL añaden +5 BOB por unidad en modelos básicos.</p>
    </div>

    <div class="footer">
      PUNTOS DE ENTREGA: Quillacollo (Plaza Bolivar) | Cercado (Terminal, KM 7)<br>
      DESPLIEGUE EXTERNO: Courier, Yango o inDrive (Adelanto del 50%)<br><br>
      SISTEMA PANDORA // NETWORK_LOGISTICS V4.5
    </div>
  </div>
</body>
</html>
`;

(async () => {
  console.log("Iniciando generación de PDF con imágenes...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
  
  const outputPath = path.join(__dirname, '..', 'CATALOGO_MAYORISTA_V4.6.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });

  await browser.close();
  console.log("✅ PDF generado con éxito en:", outputPath);
})();
