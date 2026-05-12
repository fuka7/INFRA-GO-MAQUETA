/* ═══════════════════════════════════════════════
   producto-detalle.js — InfraGo
   Descripción, specs técnicos e imágenes para
   la página de detalle de cada producto.
   Keyed por el mismo id que usa catalogo.js.
   © 2026 InfraGo SpA / TIC Managers
═══════════════════════════════════════════════ */

const PRODUCTO_DETALLE = {

  /* ── NOTEBOOKS ── */

  'hp-elitebook-640': {
    images: 4,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/34-841-434-01.jpg',
      'https://c1.neweggimages.com/productimage/nb640/34-841-434-02.jpg',
      'https://c1.neweggimages.com/productimage/nb640/34-841-434-03.jpg',
      'https://c1.neweggimages.com/productimage/nb640/34-841-434-04.jpg',
    ],
    description: "Notebook empresarial de 14 pulgadas con procesador Intel Core i5 de 13ª generación. Diseñado para profesionales que necesitan rendimiento y portabilidad con la seguridad certificada HP.",
    specs: [
      ["Procesador",        "Intel Core i5-1335U (10 núcleos, hasta 4.6 GHz)"],
      ["Memoria RAM",       "16 GB DDR4-3200 MHz"],
      ["Almacenamiento",    "512 GB SSD NVMe PCIe Gen4"],
      ["Pantalla",          "14\" FHD IPS anti-reflejo (1920×1080)"],
      ["Gráficos",          "Intel Iris Xe Graphics"],
      ["Batería",           "56 Wh — hasta 12 horas"],
      ["Conectividad",      "Wi-Fi 6E, Bluetooth 5.3"],
      ["Puertos",           "USB-A ×2, USB-C Thunderbolt 4, HDMI 2.0, RJ-45"],
      ["Sistema Operativo", "Windows 11 Pro"],
      ["Peso",              "1.38 kg"],
      ["Garantía",          "1 año on-site HP"]
    ]
  },

  'dell-inspiron-15': {
    images: 3,
    imgs: [
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/inspiron-notebooks/15-3530-intel/media-gallery/black/notebook-inspiron-15-3530-nt-plastic-black-gallery-2.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=606&qlt=100,1&resMode=sharp2&size=606,402&chrss=full',
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/inspiron-notebooks/15-3530-intel/media-gallery/black/notebook-inspiron-15-3530-nt-plastic-black-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=606&qlt=100,1&resMode=sharp2&size=606,402&chrss=full',
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/inspiron-notebooks/15-3530-intel/media-gallery/black/notebook-inspiron-15-3530-nt-plastic-black-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=606&qlt=100,1&resMode=sharp2&size=606,402&chrss=full',
    ],
    description: "Notebook de 15.6 pulgadas con pantalla Full HD y procesador Intel Core i7 de última generación. Versátil y potente para trabajo intensivo y productividad empresarial diaria.",
    specs: [
      ["Procesador",        "Intel Core i7-1355U (10 núcleos, hasta 5.0 GHz)"],
      ["Memoria RAM",       "16 GB DDR4-3200 MHz"],
      ["Almacenamiento",    "512 GB SSD NVMe"],
      ["Pantalla",          "15.6\" FHD (1920×1080) 120Hz"],
      ["Gráficos",          "Intel Iris Xe Graphics"],
      ["Batería",           "54 Wh — hasta 8 horas"],
      ["Conectividad",      "Wi-Fi 6, Bluetooth 5.1"],
      ["Puertos",           "USB-A ×3, USB-C, HDMI 1.4, SD Card"],
      ["Sistema Operativo", "Windows 11 Home"],
      ["Peso",              "1.71 kg"],
      ["Garantía",          "1 año Dell"]
    ]
  },

  'macbook-pro-14': {
    images: 4,
    imgs: [
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=png-alpha&.v=1697230830200',
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-gallery1-202310?wid=728&hei=666&fmt=jpeg&qlt=90&.v=1697230830200',
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-gallery2-202310?wid=728&hei=666&fmt=jpeg&qlt=90&.v=1697230830200',
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-gallery3-202310?wid=728&hei=666&fmt=jpeg&qlt=90&.v=1697230830200',
    ],
    description: "El MacBook Pro más potente con chip Apple M3 Pro. Pantalla Liquid Retina XDR de 14.2 pulgadas con ProMotion 120Hz. El estándar de oro para creativos y desarrolladores exigentes.",
    specs: [
      ["Procesador",        "Apple M3 Pro (11 núcleos CPU, hasta 5.0 GHz)"],
      ["Memoria RAM",       "18 GB RAM unificada"],
      ["Almacenamiento",    "512 GB SSD"],
      ["Pantalla",          "14.2\" Liquid Retina XDR (3024×1964) 120Hz ProMotion"],
      ["Gráficos",          "Apple M3 Pro GPU 14 núcleos"],
      ["Batería",           "70 Wh — hasta 18 horas"],
      ["Conectividad",      "Wi-Fi 6E, Bluetooth 5.3"],
      ["Puertos",           "Thunderbolt 4 ×3, HDMI, SD Card, MagSafe 3"],
      ["Sistema Operativo", "macOS Sonoma"],
      ["Peso",              "1.61 kg"],
      ["Garantía",          "1 año Apple Care"]
    ]
  },

  'lenovo-thinkpad-e14': {
    images: 3,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/34-840-332-01.jpg',
      'https://c1.neweggimages.com/productimage/nb640/34-840-332-02.jpg',
      'https://c1.neweggimages.com/productimage/nb640/34-840-332-03.jpg',
      'https://c1.neweggimages.com/productimage/nb640/34-840-332-04.jpg',
    ],
    description: "ThinkPad de 14 pulgadas reconocido por su teclado excepcional y durabilidad legendaria. Con AMD Ryzen 5, es ideal para profesionales que trabajan largas jornadas con máxima confiabilidad.",
    specs: [
      ["Procesador",        "AMD Ryzen 5 7530U (6 núcleos, hasta 4.5 GHz)"],
      ["Memoria RAM",       "16 GB DDR4"],
      ["Almacenamiento",    "512 GB SSD NVMe"],
      ["Pantalla",          "14\" FHD IPS (1920×1080) anti-glare"],
      ["Gráficos",          "AMD Radeon Graphics integrados"],
      ["Batería",           "57 Wh — hasta 11 horas"],
      ["Conectividad",      "Wi-Fi 6, Bluetooth 5.1"],
      ["Puertos",           "USB-A ×2, USB-C ×2, HDMI 2.0, RJ-45"],
      ["Sistema Operativo", "Windows 11 Pro"],
      ["Peso",              "1.5 kg"],
      ["Garantía",          "1 año Lenovo"]
    ]
  },

  /* ── SERVIDORES ── */

  'dell-poweredge-r650': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/59-155-904-01.png',
      'https://c1.neweggimages.com/productimage/nb640/59-155-904-02.png',
      'https://c1.neweggimages.com/productimage/nb640/59-155-904-03.png',
    ],
    description: "Servidor rack 1U de alto rendimiento con Intel Xeon Scalable para cargas de trabajo críticas. Gestión remota iDRAC9 y fuente redundante para máxima disponibilidad en centros de datos.",
    specs: [
      ["Procesador",        "Intel Xeon Silver 4314 (16 núcleos, 2.4 GHz)"],
      ["Memoria RAM",       "64 GB DDR4 ECC RDIMM"],
      ["Almacenamiento",    "1 TB SSD SAS RAID 1"],
      ["Factor de Forma",   "1U Rack"],
      ["Fuente de Poder",   "Dual 800W redundante"],
      ["Red",               "4×1GbE + 2×10GbE SFP+"],
      ["Bahías de Disco",   "8× SAS/SATA 2.5\""],
      ["RAID",              "PERC H755 (RAID 0,1,5,6,10)"],
      ["Gestión",           "iDRAC9 Enterprise"],
      ["Garantía",          "3 años ProSupport Dell"]
    ]
  },

  'hp-proliant-dl380': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/2NS-0006-36NU8-S01.jpg',
      'https://c1.neweggimages.com/productimage/nb640/2NS-0006-36NU8-S02.jpg',
    ],
    description: "Servidor rack 2U, el más vendido de HP. Balance perfecto entre rendimiento, escalabilidad y seguridad para virtualización, bases de datos y aplicaciones empresariales críticas.",
    specs: [
      ["Procesador",        "Intel Xeon Gold 5218 (16 núcleos, 2.3 GHz)"],
      ["Memoria RAM",       "128 GB DDR4 ECC RDIMM"],
      ["Almacenamiento",    "2 TB SSD SATA RAID 1"],
      ["Factor de Forma",   "2U Rack"],
      ["Fuente de Poder",   "Dual 1600W redundante 80+ Titanium"],
      ["Red",               "4×1GbE integrados"],
      ["Bahías de Disco",   "8× SFF 2.5\" NVMe/SAS/SATA"],
      ["RAID",              "HPE Smart Array P408i-a SR"],
      ["Gestión",           "iLO 6 Advanced"],
      ["Garantía",          "3 años HP Care Pack"]
    ]
  },

  'lenovo-thinksystem-sr650': {
    images: 2,
    imgs: [
      'https://lenovopress.lenovo.com/assets/images/LP1392/ThinkSystem%20SR650%20V2%20server.jpg',
    ],
    description: "Servidor rack 2U Lenovo ThinkSystem con procesador Intel Xeon Silver para virtualización y aplicaciones empresariales. Alta disponibilidad con gestión XClarity y eficiencia energética Platinum.",
    specs: [
      ["Procesador",        "Intel Xeon Silver 4210R (10 núcleos, 2.4 GHz)"],
      ["Memoria RAM",       "64 GB DDR4 ECC RDIMM"],
      ["Almacenamiento",    "1.2 TB SAS 10K RPM"],
      ["Factor de Forma",   "2U Rack"],
      ["Fuente de Poder",   "Dual 750W 80+ Platinum"],
      ["Red",               "4×1GbE integrados"],
      ["Bahías de Disco",   "8× SAS/SATA 2.5\""],
      ["RAID",              "ThinkSystem RAID 930-8i 2GB Flash"],
      ["Gestión",           "Lenovo XClarity Administrator"],
      ["Garantía",          "3 años Lenovo Foundation Service"]
    ]
  },

  'synology-ds923': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/0YH-0064-00009-01.jpg',
      'https://c1.neweggimages.com/productimage/nb640/0YH-0064-00009-02.jpg',
    ],
    description: "NAS de 4 bahías con AMD Ryzen R1600 ECC y soporte hasta 108 TB. Backup automático, colaboración en red y acceso remoto seguro gestionados desde DSM 7, sin suscripción mensual.",
    specs: [
      ["Procesador",        "AMD Ryzen R1600 (2 núcleos, 2.6 GHz)"],
      ["Memoria RAM",       "4 GB DDR4 ECC (expandible a 32 GB)"],
      ["Bahías de disco",   "4× 3.5\" SATA + 2× M.2 NVMe (caché)"],
      ["Puertos LAN",       "2× RJ-45 2.5GbE"],
      ["Puertos USB",       "USB 3.2 Gen 1 ×2, eSATA ×1"],
      ["Expansión",         "Hasta 2 unidades de expansión DX517"],
      ["Sistema operativo", "DiskStation Manager (DSM 7.x)"],
      ["Protocolos",        "SMB, AFP, NFS, iSCSI, WebDAV"],
      ["Consumo",           "45.64W en funcionamiento"],
      ["Garantía",          "3 años Synology"]
    ]
  },

  'qnap-ts-464': {
    images: 2,
    imgs: [
      'https://dgi6y9510e51q.cloudfront.net/catalog/product/cache/6f8b68960b249c68ae97c1b9d92c3006/6/3/636_1641439097_photo_ts-464_right.png',
    ],
    description: "NAS de 4 bahías con Intel Celeron N5105 quad-core y doble interfaz 2.5GbE. Rendimiento multimedia y virtualización en oficinas que necesitan almacenamiento rápido y confiable.",
    specs: [
      ["Procesador",        "Intel Celeron N5105 (4 núcleos, hasta 2.9 GHz)"],
      ["Memoria RAM",       "8 GB DDR4 (expandible a 16 GB)"],
      ["Bahías de disco",   "4× 3.5\"/2.5\" SATA + 2× M.2 NVMe"],
      ["Puertos LAN",       "2× RJ-45 2.5GbE"],
      ["Puertos USB",       "USB 3.2 Gen 2 ×2, USB 2.0 ×1"],
      ["PCIe",              "1× PCIe Gen 3 ×2 (expansión red/NVMe)"],
      ["Sistema operativo", "QTS 5.x y QuTS hero h5.x"],
      ["Protocolos",        "SMB, AFP, NFS, iSCSI, FTP, WebDAV"],
      ["Consumo",           "22.7W en funcionamiento"],
      ["Garantía",          "3 años QNAP"]
    ]
  },

  /* ── IMPRESORAS ── */

  'hp-laserjet-m110w': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/28-413-985-04.jpg',
      'https://c1.neweggimages.com/productimage/nb640/28-413-985-S07.jpg',
      'https://c1.neweggimages.com/productimage/nb640/28-413-985-S08.jpg',
    ],
    description: "Impresora láser monocromática compacta con conectividad Wi-Fi y Wi-Fi Direct. La solución perfecta para pequeñas oficinas con impresión rápida, silenciosa y tóner de larga duración.",
    specs: [
      ["Tipo",                "Láser monocromática"],
      ["Velocidad",           "21 ppm"],
      ["Resolución",          "600 × 600 dpi"],
      ["Ciclo mensual máx.",  "8.000 páginas"],
      ["Conectividad",        "USB 2.0, Wi-Fi 802.11n, Wi-Fi Direct"],
      ["Bandeja de entrada",  "150 hojas"],
      ["Tamaños de papel",    "A4, A5, Carta, Legal, Sobre"],
      ["Tóner",               "HP 105A / 106A"],
      ["Dimensiones",         "175 × 280 × 181 mm"],
      ["Garantía",            "1 año HP"]
    ]
  },

  'canon-pixma-g3160': {
    images: 2,
    imgs: [
      'https://imperialdata.com/cdn/shop/files/278152297.jpg',
    ],
    description: "Impresora multifunción de inyección con tanque de tinta recargable G3160. Impresión, copia y escaneo a color de alta calidad con el costo por página más bajo del mercado.",
    specs: [
      ["Tipo",                "Inyección de tinta Multifunción"],
      ["Funciones",           "Impresión, copia, escaneo"],
      ["Velocidad color",     "5 ipm"],
      ["Velocidad B/N",       "8.8 ipm"],
      ["Resolución",          "4800 × 1200 dpi"],
      ["Conectividad",        "USB 2.0, Wi-Fi, AirPrint, Mopria"],
      ["Bandeja de entrada",  "100 hojas"],
      ["Tamaños de papel",    "A4, A5, B5, Carta, Legal, Sobre"],
      ["Sistema de tinta",    "Tank GI-11 recargable (sin cartuchos)"],
      ["Garantía",            "1 año Canon"]
    ]
  },

  'brother-mfc-l6915dw': {
    images: 2,
    imgs: [
      'https://www.brother-usa.com/-/media/brother/product-catalog-media/images/2023/11/21/21/25/mfcl6915dw_spinner1-846x846.jpg',
    ],
    description: "Multifunción láser monocromática de alto volumen con 50 ppm y ADF dúplex de 100 hojas. Diseñada para grupos de trabajo exigentes que necesitan impresión, copia, escaneo y fax.",
    specs: [
      ["Tipo",                "Láser monocromática Multifunción"],
      ["Funciones",           "Impresión, copia, escaneo, fax"],
      ["Velocidad",           "50 ppm"],
      ["Resolución",          "1200 × 1200 dpi"],
      ["Conectividad",        "USB, Gigabit Ethernet, Wi-Fi, Wi-Fi Direct, NFC"],
      ["Alimentador ADF",     "100 hojas, dúplex automático"],
      ["Bandeja entrada",     "520 hojas (expandible a 1.610)"],
      ["Dúplex",              "Automático (impresión y escaneo)"],
      ["Ciclo mensual máx.",  "80.000 páginas"],
      ["Garantía",            "2 años Brother"]
    ]
  },

  /* ── REDES ── */

  'cisco-catalyst-2960': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/33-960-697-S01.jpg',
      'https://c1.neweggimages.com/productimage/nb640/33-960-697-V80.jpg',
    ],
    description: "Switch administrado Cisco CBS350 de 24 puertos GbE con PoE+ 370W y uplinks SFP+. Gestión avanzada de VLANs, QoS y seguridad de red para entornos corporativos.",
    specs: [
      ["Puertos",             "24× 10/100/1000 Mbps GbE"],
      ["Uplinks",             "4× 1G SFP"],
      ["PoE",                 "PoE+ hasta 370W total"],
      ["Capacidad switching", "88 Gbps"],
      ["VLANs",               "255 VLANs"],
      ["QoS",                 "4 colas de prioridad por puerto"],
      ["Seguridad",           "802.1X, ACL, DHCP Snooping, Dynamic ARP Inspection"],
      ["Gestión",             "Web GUI, CLI, SNMP v1/v2c/v3"],
      ["Factor de forma",     "1U Rack (incluyendo orejas)"],
      ["Garantía",            "Garantía limitada de por vida Cisco"]
    ]
  },

  'fortinet-fortigate-60f': {
    images: 2,
    imgs: [
      'https://snpi.dell.com/snp/images/products/large/en-us~AA868965_v1/AA868965_v1.jpg',
    ],
    description: "NGFW Fortinet con SD-WAN integrado para oficinas y sucursales. Protección completa con IPS, filtrado web SSL y VPN de alto rendimiento hasta 10 Gbps sin latencia apreciable.",
    specs: [
      ["Throughput Firewall", "10 Gbps"],
      ["Throughput IPS",      "1.4 Gbps"],
      ["Throughput VPN",      "6.5 Gbps"],
      ["Puertos",             "10× GbE RJ-45 + 2× SFP"],
      ["VPN",                 "IPSec y SSL VPN"],
      ["SD-WAN",              "Integrado (sin licencia adicional)"],
      ["Usuarios concurrentes","200 (recomendado)"],
      ["Factor de forma",     "Rack 1U / Sobremesa"],
      ["Gestión",             "FortiManager / FortiCloud"],
      ["Garantía",            "1 año FortiCare (renovable anual)"]
    ]
  },

  'ubiquiti-unifi-u6': {
    images: 2,
    imgs: [
      'https://images.svc.ui.com/?u=https%3A%2F%2Fcdn.ecomm.ui.com%2Fproducts%2Fd8fee47d-b53e-4a86-a5cb-cf2f6ab1c5ef%2F1a7279b8-ac84-41ad-8c9d-f35652099422.png&q=75&w=400',
    ],
    description: "Punto de acceso Wi-Fi 6 Long-Range con 4 antenas de 5 dBi. Hasta 300 clientes simultáneos gestionados desde la app UniFi sin costos de suscripción recurrente.",
    specs: [
      ["Estándar Wi-Fi",      "Wi-Fi 6 (802.11ax) dual-band"],
      ["Velocidad máx.",      "1775 Mbps (5 GHz) + 573 Mbps (2.4 GHz)"],
      ["Antenas",             "4× antena interna 5 dBi"],
      ["Clientes simultáneos","Hasta 300"],
      ["Alimentación",        "PoE 802.3af (12–24W)"],
      ["Montaje",             "Techo (kit incluido)"],
      ["Gestión",             "UniFi Network App (local o cloud)"],
      ["Alcance",             "Hasta 183 m en espacio abierto"],
      ["Consumo máx.",        "19W"],
      ["Garantía",            "2 años Ubiquiti"]
    ]
  },

  /* ── PC ALL-IN-ONE ── */

  'hp-eliteone-800-g9': {
    images: 3,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/83-451-689-01.jpg',
      'https://c1.neweggimages.com/productimage/nb640/83-451-689-02.jpg',
      'https://c1.neweggimages.com/productimage/nb640/83-451-689-03.jpg',
      'https://c1.neweggimages.com/productimage/nb640/83-451-689-04.jpg',
    ],
    description: "PC All-in-One empresarial de 23.8\" FHD táctil con Intel Core i7 de 12ª generación. Diseño ultra-delgado, DDR5 y Windows 11 Pro para escritorios ejecutivos de alto rendimiento.",
    specs: [
      ["Procesador",        "Intel Core i7-12700 (12 núcleos, hasta 4.9 GHz)"],
      ["Memoria RAM",       "16 GB DDR5-4800 MHz"],
      ["Almacenamiento",    "512 GB SSD NVMe PCIe Gen4"],
      ["Pantalla",          "23.8\" FHD IPS Touch (1920×1080)"],
      ["Gráficos",          "Intel UHD Graphics 770"],
      ["Conectividad",      "Wi-Fi 6E, Bluetooth 5.3, Gigabit LAN"],
      ["Puertos",           "USB-A ×4, USB-C ×2, HDMI In/Out, RJ-45"],
      ["Sistema Operativo", "Windows 11 Pro"],
      ["Dimensiones",       "54.3 × 39.3 × 5.3 cm"],
      ["Garantía",          "3 años on-site HP"]
    ]
  },

  'hp-proone-440-g9': {
    images: 3,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/83-451-700-01.jpg',
      'https://c1.neweggimages.com/productimage/nb640/83-451-700-02.jpg',
      'https://c1.neweggimages.com/productimage/nb640/83-451-700-03.jpg',
    ],
    description: "PC All-in-One de 23.8\" con Intel Core i5-12500T de bajo consumo. Rendimiento empresarial comprobado en formato compacto, ideal para puestos de trabajo estándar en oficinas.",
    specs: [
      ["Procesador",        "Intel Core i5-12500T (6 núcleos, hasta 4.4 GHz)"],
      ["Memoria RAM",       "16 GB DDR4-3200 MHz"],
      ["Almacenamiento",    "512 GB SSD NVMe PCIe Gen4"],
      ["Pantalla",          "23.8\" FHD IPS (1920×1080)"],
      ["Gráficos",          "Intel UHD Graphics 770"],
      ["Conectividad",      "Wi-Fi 6, Bluetooth 5.2, Gigabit LAN"],
      ["Puertos",           "USB-A ×4, USB-C ×1, HDMI, RJ-45"],
      ["Sistema Operativo", "Windows 11 Pro"],
      ["Dimensiones",       "54.3 × 39.3 × 5.3 cm"],
      ["Garantía",          "1 año on-site HP"]
    ]
  },

  /* ── ACCESORIOS — MONITORES ── */

  'dell-monitor-p2423d': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/24-260-840-S01.jpg',
      'https://c1.neweggimages.com/productimage/nb640/24-260-840-S02.jpg',
      'https://c1.neweggimages.com/productimage/nb640/24-260-840-S03.jpg',
      'https://c1.neweggimages.com/productimage/nb640/24-260-840-S04.jpg',
    ],
    description: "Monitor QHD 23.8\" con panel IPS y resolución 2560×1440. Ajuste ergonómico completo (altura, giro, pivote), USB-C y hub USB 3.2 integrado. Certificado Dell Premium Panel.",
    specs: [
      ["Tamaño",              "23.8\" (60.5 cm)"],
      ["Resolución",          "2560 × 1440 QHD"],
      ["Panel",               "IPS"],
      ["Tiempo de respuesta", "5 ms (GtG)"],
      ["Frecuencia de refresco","60 Hz"],
      ["Brillo",              "300 cd/m²"],
      ["Contraste",           "1000:1"],
      ["Conectividad",        "DisplayPort 1.2, HDMI 1.4, USB-C 65W, USB Hub 3.2"],
      ["Ergonomía",           "Altura, inclinación ±21°, giro ±45°, pivote 90°"],
      ["Garantía",            "3 años Dell Premium Panel"]
    ]
  },

  'dell-monitor-p2723d': {
    images: 2,
    imgs: [
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/p-series/p2723d/media-gallery/monitor-p2723d-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=839&qlt=100,1&resMode=sharp2&size=839,804&chrss=full',
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/p-series/p2723d/media-gallery/monitor-p2723d-gallery-2.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=839&qlt=100,1&resMode=sharp2&size=839,804&chrss=full',
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/p-series/p2723d/media-gallery/monitor-p2723d-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=839&qlt=100,1&resMode=sharp2&size=839,804&chrss=full',
    ],
    description: "Monitor QHD 27\" con panel IPS, USB-C con carga de 65W y hub USB 3.2. Para diseñadores y profesionales que necesitan mayor espacio de trabajo con fidelidad cromática comprobada.",
    specs: [
      ["Tamaño",              "27\" (68.6 cm)"],
      ["Resolución",          "2560 × 1440 QHD"],
      ["Panel",               "IPS"],
      ["Tiempo de respuesta", "5 ms (GtG)"],
      ["Frecuencia de refresco","60 Hz"],
      ["Brillo",              "350 cd/m²"],
      ["Contraste",           "1000:1"],
      ["Conectividad",        "DisplayPort 1.2, HDMI 1.4, USB-C 65W, USB Hub 3.2 ×4"],
      ["Ergonomía",           "Altura, inclinación ±21°, giro ±45°, pivote 90°"],
      ["Garantía",            "3 años Dell Premium Panel"]
    ]
  },

  'hp-monitor-m27fw': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/V1DSD2201060WYQFLE6.jpg',
      'https://c1.neweggimages.com/productimage/nb640/A0ZXD2201310XF2I4AE.jpg',
      'https://c1.neweggimages.com/productimage/nb640/A17PD2209120UNMJ529.jpg',
    ],
    description: "Monitor FHD 27\" con marcos ultra-delgados y panel IPS sin parpadeo. Diseño moderno con doble HDMI, perfecto para trabajo diario con comodidad visual durante largas jornadas.",
    specs: [
      ["Tamaño",              "27\" (68.6 cm)"],
      ["Resolución",          "1920 × 1080 Full HD"],
      ["Panel",               "IPS"],
      ["Tiempo de respuesta", "5 ms"],
      ["Frecuencia de refresco","75 Hz"],
      ["Brillo",              "300 cd/m²"],
      ["Conectividad",        "HDMI ×2, VGA"],
      ["Ergonomía",           "Inclinación -5° a +25°"],
      ["Dimensiones",         "61.1 × 36.7 × 5.3 cm (sin base)"],
      ["Garantía",            "3 años HP"]
    ]
  },

  'hp-monitor-e24-g5': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/AR0TD26020419WL8314.jpg',
      'https://c1.neweggimages.com/productimage/nb640/A24GD2408150D060M2C.jpg',
      'https://c1.neweggimages.com/productimage/nb640/A24GD2408150D063MDE.jpg',
    ],
    description: "Monitor empresarial 23.8\" FHD con ajuste ergonómico completo y USB-C 65W. Certificado Microsoft Teams, filtro de luz azul integrado y hub USB 3.2 para un escritorio organizado.",
    specs: [
      ["Tamaño",              "23.8\" (60.5 cm)"],
      ["Resolución",          "1920 × 1080 Full HD"],
      ["Panel",               "IPS"],
      ["Tiempo de respuesta", "5 ms"],
      ["Frecuencia de refresco","75 Hz"],
      ["Brillo",              "250 cd/m²"],
      ["Conectividad",        "USB-C 65W, DisplayPort 1.2, HDMI 1.4, USB Hub 3.2"],
      ["Ergonomía",           "Altura, inclinación ±23°, giro ±45°, pivote 90°"],
      ["Certificaciones",     "Microsoft Teams, EPEAT Gold, Energy Star 8.0"],
      ["Garantía",            "3 años HP"]
    ]
  },

  /* ── ACCESORIOS — PERIFÉRICOS ── */

  'logitech-mx-master-3s': {
    images: 2,
    imgs: [
      'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png',
      'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-side-view-graphite.png',
      'https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/2025-update/mx-master-3s-bluetooth-edition-top-view-black-new-1.png',
    ],
    description: "Mouse inalámbrico ergonómico con sensor Darkfield 8.000 DPI y scroll MagSpeed electromagnético ultrasilencioso. Productividad máxima en Windows y macOS con Logi Options+.",
    specs: [
      ["Tipo",              "Mouse inalámbrico ergonómico"],
      ["Sensor",            "Darkfield, hasta 8.000 DPI"],
      ["Conectividad",      "Logi Bolt USB + Bluetooth (3 dispositivos)"],
      ["Batería",           "Recargable USB-C, hasta 70 días"],
      ["Botones",           "7 botones programables"],
      ["Scroll",            "MagSpeed electromagnético (silencioso)"],
      ["Compatibilidad",    "Windows, macOS, Linux"],
      ["Software",          "Logi Options+"],
      ["Dimensiones",       "124.9 × 84.3 × 51 mm"],
      ["Garantía",          "2 años Logitech"]
    ]
  },

  'logitech-mx-keys-s': {
    images: 2,
    imgs: [
      'https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/mx-keys-s/migration-assets-for-delorean-2025/gallery/mx-keys-s-top-view-pale-gray-us.png',
      'https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/mx-keys-s/migration-assets-for-delorean-2025/gallery/mx-keys-s-bty-view-pale-gray-us.png',
    ],
    description: "Teclado inalámbrico premium con teclas esféricas de precisión y retroiluminación adaptativa por luz ambiental. Multi-dispositivo para hasta 3 equipos con un solo teclado.",
    specs: [
      ["Tipo",              "Teclado inalámbrico perfil bajo"],
      ["Conectividad",      "Logi Bolt USB + Bluetooth (3 dispositivos)"],
      ["Retroiluminación",  "Adaptativa por sensor de luz ambiental"],
      ["Batería",           "Recargable USB-C, hasta 10 días"],
      ["Teclas",            "Esféricas de precisión, recorrido 1.8 mm"],
      ["Compatibilidad",    "Windows, macOS, Linux"],
      ["Idioma",            "Español Latino"],
      ["Software",          "Logi Options+"],
      ["Dimensiones",       "430.2 × 131.6 × 20.5 mm"],
      ["Garantía",          "2 años Logitech"]
    ]
  },

  'logitech-mx-keys-mini': {
    images: 2,
    imgs: [
      'https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/mx-keys-mini/gallery/us/mx-keys-mini-top-rose-us.png',
    ],
    description: "Teclado compacto TKL inalámbrico con calidad MX en tamaño reducido. Retroiluminación inteligente y conexión a 3 dispositivos. Ideal para escritorios pequeños o uso en movimiento.",
    specs: [
      ["Tipo",              "Teclado compacto inalámbrico TKL"],
      ["Conectividad",      "Logi Bolt USB + Bluetooth (3 dispositivos)"],
      ["Retroiluminación",  "Adaptativa por sensor de luz ambiental"],
      ["Batería",           "Recargable USB-C, hasta 10 días"],
      ["Teclas",            "Esféricas de precisión, recorrido 1.8 mm"],
      ["Compatibilidad",    "Windows, macOS, Linux"],
      ["Software",          "Logi Options+"],
      ["Dimensiones",       "295.4 × 132.8 × 20.9 mm"],
      ["Peso",              "506 g"],
      ["Garantía",          "2 años Logitech"]
    ]
  },

  /* ── ACCESORIOS — DOCKING STATIONS ── */

  'hp-dock-usbc-g5': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/V0Y4D2208310VMRUBC9.jpg',
      'https://c1.neweggimages.com/productimage/nb640/AR0TD2507150OGCCQA8.jpg',
      'https://c1.neweggimages.com/productimage/nb640/AR0TD23072013030C04.jpg',
    ],
    description: "Docking station USB-C con carga de 100W, triple display y hub USB completo. Un solo cable conecta tu notebook a un entorno de escritorio profesional con Thunderbolt 3/4.",
    specs: [
      ["Conexión",          "USB-C (datos + video + carga en 1 cable)"],
      ["Entrega de energía","Hasta 100W pass-through"],
      ["Video",             "2× DisplayPort 1.4 + 1× HDMI 2.0 (triple display)"],
      ["Puertos USB",       "USB-A 3.2 ×4, USB-C ×2"],
      ["Red",               "Gigabit Ethernet RJ-45"],
      ["Audio",             "Jack 3.5 mm combo"],
      ["Thunderbolt",       "Compatible Thunderbolt 3/4"],
      ["Compatibilidad",    "Windows, macOS, Chrome OS"],
      ["Dimensiones",       "16.5 × 8.0 × 3.6 cm"],
      ["Garantía",          "3 años HP"]
    ]
  },

  'dell-dock-wd19s': {
    images: 2,
    imgs: [
      'https://c1.neweggimages.com/productimage/nb640/V1DSD2301030UOBBJCC.jpg',
      'https://c1.neweggimages.com/productimage/nb640/A90RD210420R0IQR.jpg',
      'https://c1.neweggimages.com/productimage/nb640/V009D2103309ZC1V.jpg',
    ],
    description: "Docking station Dell WD19S con 180W de entrega de energía para notebooks Dell. Triple monitor simultáneo, Gigabit LAN y hub USB completo desde un único punto de conexión.",
    specs: [
      ["Conexión",          "USB-C con Power Delivery"],
      ["Entrega de energía","Hasta 180W (Dell) / 90W (otros USB-C)"],
      ["Video",             "2× HDMI 2.0 + 1× DisplayPort 1.4 (triple display)"],
      ["Puertos USB",       "USB-A 3.1 ×3, USB-C ×2, USB-A 2.0 ×1"],
      ["Red",               "Gigabit Ethernet RJ-45"],
      ["Audio",             "Jack 3.5 mm combo"],
      ["Compatibilidad",    "Dell con USB-C / Thunderbolt + otros USB-C"],
      ["Thunderbolt",       "Compatible"],
      ["Dimensiones",       "18.0 × 8.5 × 3.8 cm"],
      ["Garantía",          "3 años Dell"]
    ]
  },

  'hp-elite-presenter-mouse': {
    images: 2,
    imgs: [
      'https://cdn11.bigcommerce.com/s-bfxxgrup/images/stencil/1280x1280/products/105968/155006/2CE30AAABA__63250.1591724876.jpg',
      'https://cdn11.bigcommerce.com/s-bfxxgrup/images/stencil/1280x1280/products/105968/155007/2CE30AAABA-2__77139.1591724881.jpg',
    ],
    description: "Mouse inalámbrico con puntero láser integrado para presentaciones profesionales. Controla diapositivas y mueve el cursor con un solo dispositivo elegante y compacto.",
    specs: [
      ["Tipo",              "Mouse + Puntero láser inalámbrico"],
      ["Conectividad",      "Receptor nano USB 2.4 GHz"],
      ["Alcance",           "Hasta 10 metros"],
      ["Láser",             "Clase 2, punto rojo visible"],
      ["Controles",         "Ant./Sig. diapositiva, clic izq./der., scroll"],
      ["Batería",           "2× AAA (incluidas)"],
      ["Compatibilidad",    "Windows, macOS, Linux"],
      ["Dimensiones",       "114 × 57 × 31 mm"],
      ["Peso",              "78 g (sin pilas)"],
      ["Garantía",          "1 año HP"]
    ]
  }

};

window.PRODUCTO_DETALLE = PRODUCTO_DETALLE;
