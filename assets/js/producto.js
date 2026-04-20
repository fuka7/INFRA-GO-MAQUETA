/* ═══════════════════════════════════════════════
   producto.js — InfraGo
   Página de detalle de producto
   © 2026 InfraGo SpA / TIC Managers
═══════════════════════════════════════════════ */

/* ── BASE DE DATOS DE PRODUCTOS ── */
const PRODUCTOS_DB = [
  {
    "id": "hp-elitebook-640",
    "nombre": "HP EliteBook 640",
    "nombreLargo": "EliteBook 640 G10",
    "marca": "HP",
    "cat": "notebooks",
    "precio": 18750,
    "badge": "Más vendido",
    "partNumber": "80A19LT#ABM",
    "description": "Notebook empresarial de 14 pulgadas con procesador Intel Core i5 de 13a generacion. Disenado para profesionales que necesitan rendimiento y portabilidad con seguridad HP.",
    "specs": [
      [
        "Procesador",
        "Intel Core i5-1335U (10 nucleos, hasta 4.6 GHz)"
      ],
      [
        "Memoria RAM",
        "16 GB DDR4-3200 MHz"
      ],
      [
        "Almacenamiento",
        "512 GB SSD NVMe PCIe Gen4"
      ],
      [
        "Pantalla",
        "14\" FHD IPS anti-reflejo (1920x1080)"
      ],
      [
        "Graficos",
        "Intel Iris Xe Graphics"
      ],
      [
        "Bateria",
        "56 Wh — hasta 12 horas"
      ],
      [
        "Conectividad",
        "Wi-Fi 6E, Bluetooth 5.3"
      ],
      [
        "Puertos",
        "USB-A x2, USB-C Thunderbolt 4, HDMI 2.0, RJ-45"
      ],
      [
        "Sistema Operativo",
        "Windows 11 Pro"
      ],
      [
        "Peso",
        "1.38 kg"
      ],
      [
        "Garantia",
        "1 ano on-site HP"
      ]
    ],
    "specsResumen": [
      "Intel Core i5-1335U",
      "16GB DDR4",
      "512GB SSD NVMe",
      "14\" FHD"
    ],
    "images": 4,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"12\" y=\"6\" width=\"96\" height=\"60\" rx=\"4\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"20\" y=\"14\" width=\"80\" height=\"44\" rx=\"2\" fill=\"rgba(59,130,246,0.08)\" stroke=\"rgba(59,130,246,0.2)\" stroke-width=\"1\"/><rect x=\"42\" y=\"66\" width=\"36\" height=\"5\" rx=\"1.5\" fill=\"rgba(255,255,255,0.08)\"/><rect x=\"30\" y=\"71\" width=\"60\" height=\"3\" rx=\"1.5\" fill=\"rgba(255,255,255,0.06)\"/></svg>"
  },
  {
    "id": "hp-elitebook-840",
    "nombre": "HP EliteBook 840",
    "nombreLargo": "EliteBook 840 G10",
    "marca": "HP",
    "cat": "notebooks",
    "precio": 22500,
    "badge": "",
    "partNumber": "6T252LA#ABM",
    "description": "Notebook premium de 14 pulgadas con pantalla IPS de alta resolucion y procesador Intel Core i7. La opcion ideal para ejecutivos y equipos exigentes.",
    "specs": [
      [
        "Procesador",
        "Intel Core i7-1355U (10 nucleos, hasta 5.0 GHz)"
      ],
      [
        "Memoria RAM",
        "16 GB DDR5-4800 MHz"
      ],
      [
        "Almacenamiento",
        "512 GB SSD NVMe PCIe Gen4"
      ],
      [
        "Pantalla",
        "14\" FHD IPS Sure View (1920x1080)"
      ],
      [
        "Graficos",
        "Intel Iris Xe Graphics"
      ],
      [
        "Bateria",
        "51 Wh — hasta 14 horas"
      ],
      [
        "Conectividad",
        "Wi-Fi 6E, Bluetooth 5.3, 4G LTE"
      ],
      [
        "Puertos",
        "USB-A x2, Thunderbolt 4 x2, HDMI 2.0, microSD"
      ],
      [
        "Sistema Operativo",
        "Windows 11 Pro"
      ],
      [
        "Peso",
        "1.35 kg"
      ],
      [
        "Garantia",
        "3 anos on-site HP"
      ]
    ],
    "specsResumen": [
      "Intel Core i7-1355U",
      "16GB DDR5",
      "512GB SSD NVMe",
      "14\" FHD IPS"
    ],
    "images": 3,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"12\" y=\"6\" width=\"96\" height=\"60\" rx=\"4\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"20\" y=\"14\" width=\"80\" height=\"44\" rx=\"2\" fill=\"rgba(59,130,246,0.08)\" stroke=\"rgba(59,130,246,0.2)\" stroke-width=\"1\"/><rect x=\"42\" y=\"66\" width=\"36\" height=\"5\" rx=\"1.5\" fill=\"rgba(255,255,255,0.08)\"/><rect x=\"30\" y=\"71\" width=\"60\" height=\"3\" rx=\"1.5\" fill=\"rgba(255,255,255,0.06)\"/></svg>"
  },
  {
    "id": "dell-inspiron-15",
    "nombre": "Dell Inspiron 15",
    "nombreLargo": "Inspiron 15 3530",
    "marca": "Dell",
    "cat": "notebooks",
    "precio": 21667,
    "badge": "",
    "partNumber": "I15-I7U512-BLK",
    "description": "Notebook de 15.6 pulgadas con pantalla Full HD y procesador Intel Core i7 de ultima generacion. Versatil para trabajo y productividad empresarial.",
    "specs": [
      [
        "Procesador",
        "Intel Core i7-1355U (10 nucleos, hasta 5.0 GHz)"
      ],
      [
        "Memoria RAM",
        "16 GB DDR4-3200 MHz"
      ],
      [
        "Almacenamiento",
        "512 GB SSD NVMe"
      ],
      [
        "Pantalla",
        "15.6\" FHD (1920x1080) 120Hz"
      ],
      [
        "Graficos",
        "Intel Iris Xe Graphics"
      ],
      [
        "Bateria",
        "54 Wh — hasta 8 horas"
      ],
      [
        "Conectividad",
        "Wi-Fi 6, Bluetooth 5.1"
      ],
      [
        "Puertos",
        "USB-A x3, USB-C, HDMI 1.4, SD Card"
      ],
      [
        "Sistema Operativo",
        "Windows 11 Home"
      ],
      [
        "Peso",
        "1.71 kg"
      ],
      [
        "Garantia",
        "1 ano Dell"
      ]
    ],
    "specsResumen": [
      "Intel Core i7-1355U",
      "16GB DDR4",
      "512GB SSD",
      "15.6\" FHD"
    ],
    "images": 3,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"12\" y=\"6\" width=\"96\" height=\"60\" rx=\"4\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"20\" y=\"14\" width=\"80\" height=\"44\" rx=\"2\" fill=\"rgba(59,130,246,0.08)\" stroke=\"rgba(59,130,246,0.2)\" stroke-width=\"1\"/><rect x=\"42\" y=\"66\" width=\"36\" height=\"5\" rx=\"1.5\" fill=\"rgba(255,255,255,0.08)\"/><rect x=\"30\" y=\"71\" width=\"60\" height=\"3\" rx=\"1.5\" fill=\"rgba(255,255,255,0.06)\"/></svg>"
  },
  {
    "id": "dell-latitude-5540",
    "nombre": "Dell Latitude 5540",
    "nombreLargo": "Latitude 5540",
    "marca": "Dell",
    "cat": "notebooks",
    "precio": 27083,
    "badge": "Nuevo",
    "partNumber": "LAT-5540-I7-512",
    "description": "Notebook empresarial de 15.6 pulgadas con chasis de aluminio y certificaciones MIL-STD-810H. Rendimiento y durabilidad para trabajo exigente.",
    "specs": [
      [
        "Procesador",
        "Intel Core i7-1365U (10 nucleos, hasta 5.2 GHz)"
      ],
      [
        "Memoria RAM",
        "16 GB DDR4"
      ],
      [
        "Almacenamiento",
        "512 GB SSD"
      ],
      [
        "Pantalla",
        "15.6\" FHD IPS (1920x1080)"
      ],
      [
        "Graficos",
        "Intel Iris Xe Graphics"
      ],
      [
        "Bateria",
        "65 Wh — hasta 10 horas"
      ],
      [
        "Conectividad",
        "Wi-Fi 6E, Bluetooth 5.3, 4G LTE"
      ],
      [
        "Puertos",
        "Thunderbolt 4 x2, USB-A x3, HDMI, RJ-45"
      ],
      [
        "Sistema Operativo",
        "Windows 11 Pro"
      ],
      [
        "Peso",
        "1.78 kg"
      ],
      [
        "Garantia",
        "3 anos ProSupport Dell"
      ]
    ],
    "specsResumen": [
      "Intel Core i7-1365U",
      "16GB DDR4",
      "256GB SSD",
      "15.6\" FHD"
    ],
    "images": 3,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"12\" y=\"6\" width=\"96\" height=\"60\" rx=\"4\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"20\" y=\"14\" width=\"80\" height=\"44\" rx=\"2\" fill=\"rgba(59,130,246,0.08)\" stroke=\"rgba(59,130,246,0.2)\" stroke-width=\"1\"/><rect x=\"42\" y=\"66\" width=\"36\" height=\"5\" rx=\"1.5\" fill=\"rgba(255,255,255,0.08)\"/><rect x=\"30\" y=\"71\" width=\"60\" height=\"3\" rx=\"1.5\" fill=\"rgba(255,255,255,0.06)\"/></svg>"
  },
  {
    "id": "lenovo-thinkpad-e14",
    "nombre": "Lenovo ThinkPad E14",
    "nombreLargo": "ThinkPad E14 Gen 5",
    "marca": "Lenovo",
    "cat": "notebooks",
    "precio": 19583,
    "badge": "",
    "partNumber": "21JK0005CL",
    "description": "ThinkPad de 14 pulgadas reconocido por su teclado excepcional y durabilidad legendaria. Ideal para profesionales que trabajan largas horas.",
    "specs": [
      [
        "Procesador",
        "AMD Ryzen 5 7530U (6 nucleos, hasta 4.5 GHz)"
      ],
      [
        "Memoria RAM",
        "16 GB DDR4"
      ],
      [
        "Almacenamiento",
        "512 GB SSD NVMe"
      ],
      [
        "Pantalla",
        "14\" FHD IPS (1920x1080) anti-glare"
      ],
      [
        "Graficos",
        "AMD Radeon Graphics integrados"
      ],
      [
        "Bateria",
        "57 Wh — hasta 11 horas"
      ],
      [
        "Conectividad",
        "Wi-Fi 6, Bluetooth 5.1"
      ],
      [
        "Puertos",
        "USB-A x2, USB-C x2, HDMI 2.0, RJ-45"
      ],
      [
        "Sistema Operativo",
        "Windows 11 Pro"
      ],
      [
        "Peso",
        "1.5 kg"
      ],
      [
        "Garantia",
        "1 ano Lenovo"
      ]
    ],
    "specsResumen": [
      "AMD Ryzen 5 7530U",
      "16GB DDR4",
      "512GB SSD",
      "14\" FHD IPS"
    ],
    "images": 3,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"12\" y=\"6\" width=\"96\" height=\"60\" rx=\"4\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"20\" y=\"14\" width=\"80\" height=\"44\" rx=\"2\" fill=\"rgba(59,130,246,0.08)\" stroke=\"rgba(59,130,246,0.2)\" stroke-width=\"1\"/><rect x=\"42\" y=\"66\" width=\"36\" height=\"5\" rx=\"1.5\" fill=\"rgba(255,255,255,0.08)\"/><rect x=\"30\" y=\"71\" width=\"60\" height=\"3\" rx=\"1.5\" fill=\"rgba(255,255,255,0.06)\"/></svg>"
  },
  {
    "id": "macbook-pro-14",
    "nombre": "MacBook Pro 14",
    "nombreLargo": "MacBook Pro 14\"",
    "marca": "Apple",
    "cat": "notebooks",
    "precio": 50000,
    "badge": "Premium",
    "partNumber": "MRX33LL/A",
    "description": "El MacBook Pro mas potente con chip Apple M3 Pro. Pantalla Liquid Retina XDR de 14.2 pulgadas con ProMotion 120Hz. El estandar de oro para creativos y desarrolladores.",
    "specs": [
      [
        "Procesador",
        "Apple M3 Pro (11 nucleos CPU, hasta 5.0 GHz)"
      ],
      [
        "Memoria RAM",
        "18 GB RAM unificada"
      ],
      [
        "Almacenamiento",
        "512 GB SSD"
      ],
      [
        "Pantalla",
        "14.2\" Liquid Retina XDR (3024x1964) 120Hz ProMotion"
      ],
      [
        "Graficos",
        "Apple M3 Pro 14-core GPU"
      ],
      [
        "Bateria",
        "70 Wh — hasta 18 horas"
      ],
      [
        "Conectividad",
        "Wi-Fi 6E, Bluetooth 5.3"
      ],
      [
        "Puertos",
        "Thunderbolt 4 x3, HDMI, SD Card, MagSafe 3"
      ],
      [
        "Sistema Operativo",
        "macOS Sonoma"
      ],
      [
        "Peso",
        "1.61 kg"
      ],
      [
        "Garantia",
        "1 ano Apple Care"
      ]
    ],
    "specsResumen": [
      "Apple M3 Pro",
      "18GB RAM",
      "512GB SSD",
      "14\" Liquid Retina XDR"
    ],
    "images": 4,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"12\" y=\"6\" width=\"96\" height=\"60\" rx=\"4\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"20\" y=\"14\" width=\"80\" height=\"44\" rx=\"2\" fill=\"rgba(59,130,246,0.08)\" stroke=\"rgba(59,130,246,0.2)\" stroke-width=\"1\"/><rect x=\"42\" y=\"66\" width=\"36\" height=\"5\" rx=\"1.5\" fill=\"rgba(255,255,255,0.08)\"/><rect x=\"30\" y=\"71\" width=\"60\" height=\"3\" rx=\"1.5\" fill=\"rgba(255,255,255,0.06)\"/></svg>"
  },
  {
    "id": "dell-poweredge-r650",
    "nombre": "Dell PowerEdge R650",
    "nombreLargo": "PowerEdge R650",
    "marca": "Dell",
    "cat": "servidores",
    "precio": 104167,
    "badge": "",
    "partNumber": "R650-XS-4314-64G",
    "description": "Servidor rack 1U de alto rendimiento con procesador Intel Xeon Scalable. Para cargas de trabajo criticas en centros de datos.",
    "specs": [
      [
        "Procesador",
        "Intel Xeon Silver 4314 (16 nucleos, 2.4 GHz)"
      ],
      [
        "Memoria RAM",
        "64 GB DDR4 ECC RDIMM"
      ],
      [
        "Almacenamiento",
        "1 TB SSD SAS RAID 1"
      ],
      [
        "Factor de Forma",
        "1U Rack"
      ],
      [
        "Fuente de Poder",
        "Dual 800W redundante"
      ],
      [
        "Red",
        "4x 1GbE + 2x 10GbE SFP+"
      ],
      [
        "Bahias de Disco",
        "8x SAS/SATA 2.5\""
      ],
      [
        "RAID",
        "PERC H755 (RAID 0,1,5,6,10)"
      ],
      [
        "Gestion",
        "iDRAC9 Enterprise"
      ],
      [
        "Garantia",
        "3 anos ProSupport Dell"
      ]
    ],
    "specsResumen": [
      "Intel Xeon Silver 4314",
      "64GB DDR4 ECC",
      "1TB SSD RAID",
      "1U Rack"
    ],
    "images": 2,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"6\" y=\"6\" width=\"108\" height=\"20\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"6\" y=\"32\" width=\"108\" height=\"20\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"6\" y=\"58\" width=\"108\" height=\"20\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><circle cx=\"18\" cy=\"16\" r=\"3\" fill=\"rgba(34,197,94,0.7)\"/><circle cx=\"18\" cy=\"42\" r=\"3\" fill=\"rgba(34,197,94,0.7)\"/><circle cx=\"18\" cy=\"68\" r=\"3\" fill=\"rgba(255,255,255,0.2)\"/></svg>"
  },
  {
    "id": "hp-proliant-dl380",
    "nombre": "HP ProLiant DL380",
    "nombreLargo": "ProLiant DL380 Gen10",
    "marca": "HP",
    "cat": "servidores",
    "precio": 133333,
    "badge": "",
    "partNumber": "P56963-B21",
    "description": "Servidor rack 2U con el balance perfecto entre rendimiento, escalabilidad y seguridad. El servidor mas vendido de HP.",
    "specs": [
      [
        "Procesador",
        "Intel Xeon Silver 4410Y (12 nucleos, 2.0 GHz)"
      ],
      [
        "Memoria RAM",
        "32 GB DDR5 ECC"
      ],
      [
        "Almacenamiento",
        "960 GB SSD SATA"
      ],
      [
        "Factor de Forma",
        "2U Rack"
      ],
      [
        "Fuente de Poder",
        "Dual 1600W redundante 80+ Titanium"
      ],
      [
        "Red",
        "4x 1GbE integrados"
      ],
      [
        "Bahias de Disco",
        "8x SFF 2.5\" NVMe/SAS/SATA"
      ],
      [
        "RAID",
        "HPE Smart Array P408i-a SR"
      ],
      [
        "Gestion",
        "iLO 6 Advanced"
      ],
      [
        "Garantia",
        "3 anos HP Care Pack"
      ]
    ],
    "specsResumen": [
      "Intel Xeon Gold 5218",
      "128GB DDR4 ECC",
      "2TB SSD RAID",
      "2U Rack"
    ],
    "images": 2,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"6\" y=\"6\" width=\"108\" height=\"20\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"6\" y=\"32\" width=\"108\" height=\"20\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"6\" y=\"58\" width=\"108\" height=\"20\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><circle cx=\"18\" cy=\"16\" r=\"3\" fill=\"rgba(34,197,94,0.7)\"/><circle cx=\"18\" cy=\"42\" r=\"3\" fill=\"rgba(34,197,94,0.7)\"/><circle cx=\"18\" cy=\"68\" r=\"3\" fill=\"rgba(34,197,94,0.7)\"/></svg>"
  },
  {
    "id": "dell-poweredge-t350",
    "nombre": "Dell PowerEdge T350",
    "nombreLargo": "PowerEdge T350",
    "marca": "Dell",
    "cat": "servidores",
    "precio": 62500,
    "badge": "",
    "partNumber": "T350-E-2336-16G",
    "description": "Servidor torre compacto ideal para PYMEs. Rendimiento enterprise en formato desktop, perfecto para oficinas sin sala de servidores.",
    "specs": [
      [
        "Procesador",
        "Intel Xeon E-2336 (6 nucleos, hasta 4.8 GHz)"
      ],
      [
        "Memoria RAM",
        "16 GB DDR4 ECC UDIMM"
      ],
      [
        "Almacenamiento",
        "2x 2TB HDD SATA RAID 1"
      ],
      [
        "Factor de Forma",
        "Tower"
      ],
      [
        "Fuente de Poder",
        "700W"
      ],
      [
        "Red",
        "2x 1GbE"
      ],
      [
        "Bahias de Disco",
        "8x 3.5\" SATA"
      ],
      [
        "RAID",
        "PERC H355"
      ],
      [
        "Gestion",
        "iDRAC9 Basic"
      ],
      [
        "Garantia",
        "3 anos ProSupport Dell"
      ]
    ],
    "specsResumen": [
      "Intel Xeon E-2356G",
      "32GB DDR4 ECC",
      "1TB SATA",
      "Torre"
    ],
    "images": 2,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"30\" y=\"4\" width=\"60\" height=\"76\" rx=\"4\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"38\" y=\"12\" width=\"44\" height=\"28\" rx=\"2\" fill=\"rgba(59,130,246,0.08)\" stroke=\"rgba(59,130,246,0.15)\" stroke-width=\"1\"/><circle cx=\"60\" cy=\"56\" r=\"8\" stroke=\"rgba(255,255,255,0.1)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/></svg>"
  },
  {
    "id": "hp-laserjet-m110w",
    "nombre": "HP LaserJet M110w",
    "nombreLargo": "LaserJet M110w",
    "marca": "HP",
    "cat": "impresoras",
    "precio": 14583,
    "badge": "",
    "partNumber": "7MD66F#BGJ",
    "description": "Impresora laser monocromatica compacta con conectividad inalambrica. La solucion perfecta para pequenas oficinas.",
    "specs": [
      [
        "Tipo",
        "Laser monocromatica"
      ],
      [
        "Velocidad",
        "21 ppm"
      ],
      [
        "Resolucion",
        "600 x 600 dpi"
      ],
      [
        "Ciclo mensual max.",
        "8.000 paginas"
      ],
      [
        "Conectividad",
        "USB 2.0, Wi-Fi, Wi-Fi Direct"
      ],
      [
        "Bandeja de entrada",
        "150 hojas"
      ],
      [
        "Tamanos de papel",
        "A4, A5, Carta, Legal"
      ],
      [
        "Toner",
        "HP 105A / 106A"
      ],
      [
        "Dimensiones",
        "175 x 280 x 181 mm"
      ],
      [
        "Garantia",
        "1 ano HP"
      ]
    ],
    "specsResumen": [
      "Impresión B/N",
      "21 ppm",
      "Wi-Fi + USB",
      "Tóner incluido"
    ],
    "images": 2,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"20\" y=\"20\" width=\"80\" height=\"44\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"30\" y=\"8\" width=\"60\" height=\"18\" rx=\"2\" fill=\"rgba(255,255,255,0.03)\" stroke=\"rgba(255,255,255,0.1)\" stroke-width=\"1\"/><rect x=\"30\" y=\"64\" width=\"60\" height=\"12\" rx=\"2\" fill=\"rgba(255,255,255,0.03)\" stroke=\"rgba(255,255,255,0.1)\" stroke-width=\"1\"/><rect x=\"38\" y=\"32\" width=\"44\" height=\"3\" rx=\"1.5\" fill=\"rgba(59,130,246,0.3)\"/><circle cx=\"90\" cy=\"33.5\" r=\"3\" fill=\"rgba(34,197,94,0.7)\"/></svg>"
  },
  {
    "id": "hp-laserjet-mfp-m236sdw",
    "nombre": "HP LaserJet MFP M236sdw",
    "nombreLargo": "LaserJet MFP M236sdw",
    "marca": "HP",
    "cat": "impresoras",
    "precio": 20833,
    "badge": "Popular",
    "partNumber": "9UQ74A#BGJ",
    "description": "Multifuncional laser con impresion, copia, escaneo y fax. Duplex automatico y Wi-Fi para mayor eficiencia.",
    "specs": [
      [
        "Tipo",
        "Multifuncional laser monocromatica"
      ],
      [
        "Velocidad",
        "29 ppm"
      ],
      [
        "Resolucion impresion",
        "600 x 600 dpi"
      ],
      [
        "Resolucion escaneo",
        "1.200 dpi optico"
      ],
      [
        "Conectividad",
        "USB, Wi-Fi, Ethernet, Wi-Fi Direct"
      ],
      [
        "Alimentador",
        "ADF 40 hojas"
      ],
      [
        "Bandeja entrada",
        "250 hojas"
      ],
      [
        "Duplex",
        "Automatico"
      ],
      [
        "Toner",
        "HP 136A / 137A"
      ],
      [
        "Garantia",
        "1 ano HP"
      ]
    ],
    "specsResumen": [
      "Impresión / Copia / Scan",
      "29 ppm",
      "Wi-Fi + LAN + USB",
      "Tóner incluido"
    ],
    "images": 2,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"20\" y=\"20\" width=\"80\" height=\"44\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"30\" y=\"8\" width=\"60\" height=\"18\" rx=\"2\" fill=\"rgba(255,255,255,0.03)\" stroke=\"rgba(255,255,255,0.1)\" stroke-width=\"1\"/><rect x=\"30\" y=\"64\" width=\"60\" height=\"12\" rx=\"2\" fill=\"rgba(255,255,255,0.03)\" stroke=\"rgba(255,255,255,0.1)\" stroke-width=\"1\"/><rect x=\"38\" y=\"32\" width=\"44\" height=\"3\" rx=\"1.5\" fill=\"rgba(59,130,246,0.3)\"/><circle cx=\"90\" cy=\"33.5\" r=\"3\" fill=\"rgba(34,197,94,0.7)\"/></svg>"
  },
  {
    "id": "dell-p2423d",
    "nombre": "Dell P2423D",
    "nombreLargo": "Monitor P2423D",
    "marca": "Dell",
    "cat": "monitores",
    "precio": 10417,
    "badge": "",
    "partNumber": "DELL-P2423D",
    "description": "Monitor QHD de 24 pulgadas con panel IPS y resolucion 2560x1440. Ideal para diseniadores y profesionales.",
    "specs": [
      [
        "Tamano",
        "23.8\" (60.5 cm)"
      ],
      [
        "Resolucion",
        "2560 x 1440 QHD"
      ],
      [
        "Panel",
        "IPS"
      ],
      [
        "Tiempo de respuesta",
        "5 ms"
      ],
      [
        "Frecuencia",
        "60 Hz"
      ],
      [
        "Brillo",
        "300 cd/m2"
      ],
      [
        "Contraste",
        "1000:1"
      ],
      [
        "Conectividad",
        "DisplayPort 1.2, HDMI 1.4, USB-C, USB Hub"
      ],
      [
        "Ergonomia",
        "Altura, inclinacion, giro, pivote"
      ],
      [
        "Garantia",
        "3 anos Dell Premium Panel"
      ]
    ],
    "specsResumen": [
      "23.8\" QHD 2560×1440",
      "Panel IPS",
      "USB-C + HDMI + DP",
      "Ajuste de altura"
    ],
    "images": 2,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"18\" y=\"6\" width=\"84\" height=\"56\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"26\" y=\"14\" width=\"68\" height=\"40\" rx=\"1\" fill=\"rgba(59,130,246,0.08)\" stroke=\"rgba(59,130,246,0.15)\" stroke-width=\"1\"/><rect x=\"50\" y=\"62\" width=\"20\" height=\"10\" rx=\"1\" fill=\"rgba(255,255,255,0.08)\"/><rect x=\"38\" y=\"72\" width=\"44\" height=\"3\" rx=\"1.5\" fill=\"rgba(255,255,255,0.06)\"/></svg>"
  },
  {
    "id": "hp-m27fw",
    "nombre": "HP M27fw",
    "nombreLargo": "Monitor M27fw",
    "marca": "HP",
    "cat": "monitores",
    "precio": 8333,
    "badge": "",
    "partNumber": "HP-M27FW",
    "description": "Monitor FHD de 27 pulgadas con marcos ultra-delgados y panel IPS. Perfecto para trabajo diario con comodidad visual.",
    "specs": [
      [
        "Tamano",
        "27\" (68.6 cm)"
      ],
      [
        "Resolucion",
        "1920 x 1080 Full HD"
      ],
      [
        "Panel",
        "IPS"
      ],
      [
        "Tiempo de respuesta",
        "5 ms"
      ],
      [
        "Frecuencia",
        "75 Hz"
      ],
      [
        "Brillo",
        "300 cd/m2"
      ],
      [
        "Conectividad",
        "HDMI x2, VGA"
      ],
      [
        "Ergonomia",
        "Inclinacion -5 a 25 grados"
      ],
      [
        "Garantia",
        "3 anos HP"
      ]
    ],
    "specsResumen": [
      "27\" FHD 1920×1080",
      "Panel IPS",
      "HDMI + VGA",
      "Sin marcos laterales"
    ],
    "images": 2,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"18\" y=\"6\" width=\"84\" height=\"56\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><rect x=\"26\" y=\"14\" width=\"68\" height=\"40\" rx=\"1\" fill=\"rgba(59,130,246,0.08)\" stroke=\"rgba(59,130,246,0.15)\" stroke-width=\"1\"/><rect x=\"50\" y=\"62\" width=\"20\" height=\"10\" rx=\"1\" fill=\"rgba(255,255,255,0.08)\"/><rect x=\"38\" y=\"72\" width=\"44\" height=\"3\" rx=\"1.5\" fill=\"rgba(255,255,255,0.06)\"/></svg>"
  },
  {
    "id": "cisco-catalyst-2960",
    "nombre": "Cisco Catalyst 2960",
    "nombreLargo": "Catalyst 2960-X 24",
    "marca": "Cisco",
    "cat": "redes",
    "precio": 25000,
    "badge": "",
    "partNumber": "WS-C2960X-24TS-L",
    "description": "Switch empresarial de 24 puertos con PoE+ y uplinks 4x1G SFP. Columna vertebral de redes corporativas.",
    "specs": [
      [
        "Puertos",
        "24x 10/100/1000 Mbps"
      ],
      [
        "Uplinks",
        "4x 1G SFP"
      ],
      [
        "PoE",
        "PoE+ hasta 370W total"
      ],
      [
        "Capacidad switching",
        "88 Gbps"
      ],
      [
        "VLANs",
        "255"
      ],
      [
        "QoS",
        "4 colas por puerto"
      ],
      [
        "Gestion",
        "Web GUI, CLI, SNMP"
      ],
      [
        "Garantia",
        "Garantia limitada Cisco"
      ]
    ],
    "specsResumen": [
      "24 puertos GbE",
      "4 uplinks SFP+",
      "PoE+ 370W",
      "Gestionable"
    ],
    "images": 2,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"6\" y=\"28\" width=\"108\" height=\"28\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><g><rect x=\"14\" y=\"36\" width=\"6\" height=\"12\" rx=\"1\" fill=\"rgba(59,130,246,0.2)\" stroke=\"rgba(59,130,246,0.4)\" stroke-width=\"1\"/><rect x=\"24\" y=\"36\" width=\"6\" height=\"12\" rx=\"1\" fill=\"rgba(59,130,246,0.2)\" stroke=\"rgba(59,130,246,0.4)\" stroke-width=\"1\"/><rect x=\"34\" y=\"36\" width=\"6\" height=\"12\" rx=\"1\" fill=\"rgba(59,130,246,0.2)\" stroke=\"rgba(59,130,246,0.4)\" stroke-width=\"1\"/><rect x=\"44\" y=\"36\" width=\"6\" height=\"12\" rx=\"1\" fill=\"rgba(59,130,246,0.2)\" stroke=\"rgba(59,130,246,0.4)\" stroke-width=\"1\"/></g><circle cx=\"100\" cy=\"42\" r=\"4\" fill=\"rgba(34,197,94,0.7)\"/></svg>"
  },
  {
    "id": "cisco-rv340-router",
    "nombre": "Cisco RV340 Router",
    "nombreLargo": "RV340 Dual WAN",
    "marca": "Cisco",
    "cat": "redes",
    "precio": 16667,
    "badge": "",
    "partNumber": "RV340-K9-G5",
    "description": "Router VPN dual WAN para PYMES. Seguridad avanzada con firewall SPI y soporte VPN IPSec/SSL.",
    "specs": [
      [
        "WAN",
        "2x Gigabit Ethernet (dual WAN)"
      ],
      [
        "LAN",
        "4x Gigabit Ethernet"
      ],
      [
        "VPN",
        "IPSec, SSL/OpenVPN (hasta 50 tuneles)"
      ],
      [
        "Firewall",
        "SPI, DoS, URL Filtering"
      ],
      [
        "Throughput",
        "Hasta 900 Mbps"
      ],
      [
        "USB",
        "2x USB 3.0 (4G LTE / Storage)"
      ],
      [
        "QoS",
        "Avanzado por aplicacion"
      ],
      [
        "Garantia",
        "1 ano Cisco"
      ]
    ],
    "specsResumen": [
      "Dual WAN Gigabit",
      "4 puertos LAN",
      "VPN IPSec/SSL",
      "Firewall integrado"
    ],
    "images": 2,
    "svg": "<svg viewBox=\"0 0 120 84\" fill=\"none\"><rect x=\"20\" y=\"28\" width=\"80\" height=\"28\" rx=\"3\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"1.5\" fill=\"rgba(255,255,255,0.03)\"/><path d=\"M60 14 L60 28\" stroke=\"rgba(255,255,255,0.15)\" stroke-width=\"2\"/><path d=\"M40 10 L60 14 L80 10\" stroke=\"rgba(255,255,255,0.1)\" stroke-width=\"1.5\" stroke-linecap=\"round\"/><circle cx=\"100\" cy=\"42\" r=\"3\" fill=\"rgba(34,197,94,0.7)\"/><circle cx=\"92\" cy=\"42\" r=\"3\" fill=\"rgba(240,165,0,0.7)\"/></svg>"
  }
];

/* ── Helpers ── */
function fmtPrecio(n) {
  return '$' + n.toLocaleString('es-CL');
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* ── Obtener producto de la URL ── */
function getProducto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return null;
  return PRODUCTOS_DB.find(p => p.id === id) || null;
}

/* ── Generar miniaturas SVG (variantes de color) ── */
function buildThumbs(producto, n) {
  const opacities = [1, 0.75, 0.5, 0.35];
  let html = '';
  for (let i = 0; i < Math.min(n, opacities.length); i++) {
    const op = opacities[i];
    const svgMod = producto.svg.replace(/opacity="[\d.]+"/g, `opacity="${op}"`);
    html += `<div class="prd-thumb ${i===0?'active':" "} " data-idx="${i}" onclick="selectThumb(this, ${i})">
      ${svgMod}
    </div>`;
  }
  return html;
}

function selectThumb(el, idx) {
  document.querySelectorAll('.prd-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  // Cambiar opacidad de la imagen principal
  const opacities = [1, 0.75, 0.5, 0.35];
  const mainSvg = document.querySelector('.prd-img-main');
  if (mainSvg) {
    const op = opacities[idx] || 1;
    mainSvg.style.opacity = op;
  }
}

/* ── Render estrellas ── */
function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<svg class="prd-star${i > rating ? ' empty' : ''}" viewBox="0 0 24 24" fill="${i <= rating ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>`;
  }
  return html;
}

/* ── Cantidad ── */
let qty = 1;
function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  const el = document.getElementById('prdQty');
  if (el) el.textContent = qty;
}

/* ── Renderizar página completa ── */
function renderProducto(p) {
  // Breadcrumb
  const catLabel = {
    notebooks: 'Notebooks', servidores: 'Servidores',
    impresoras: 'Impresoras', monitores: 'Monitores', redes: 'Redes'
  }[p.cat] || p.cat;

  document.getElementById('prdBreadcrumb').innerHTML = `
    <a href="/tienda.html">Tienda</a>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    <a href="/tienda.html?cat=${p.cat}">${catLabel}</a>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    <span>${p.nombre}</span>
  `;

  // Galería
  document.getElementById('prdImgMain').innerHTML = p.svg || `<svg viewBox="0 0 120 84" fill="none"><rect x="12" y="6" width="96" height="60" rx="4" fill="rgba(17,17,17,0.05)"/></svg>`;
  document.getElementById('prdThumbs').innerHTML = buildThumbs(p, p.images);

  // Descripción
  document.getElementById('prdDescription').textContent = p.description;

  // Specs tabla
  const specsHtml = p.specs.map(([k, v]) =>
    `<tr><td>${k}</td><td>${v}</td></tr>`
  ).join('');
  document.getElementById('prdSpecsTable').innerHTML = specsHtml;

  // Panel derecho
  if (p.badge) {
    document.getElementById('prdBadge').textContent = p.badge;
    document.getElementById('prdBadge').style.display = 'inline-block';
  }
  document.getElementById('prdBrand').textContent = p.marca;
  document.getElementById('prdName').textContent = p.nombre;
  document.getElementById('prdSku').textContent = p.partNumber ? `SKU: ${p.partNumber}` : '';

  // Rating aleatorio entre 4.2 y 5.0
  const rating = (4.2 + Math.random() * 0.8).toFixed(1);
  const reviews = Math.floor(Math.random() * 40) + 5;
  document.getElementById('prdStars').innerHTML = renderStars(Math.round(parseFloat(rating)));
  document.getElementById('prdRating').textContent = rating;
  document.getElementById('prdReviews').textContent = `(${reviews} reseñas)`;

  // Specs resumen
  document.getElementById('prdSpecsList').innerHTML = p.specsResumen
    .map(s => `<div class="prd-panel-spec">${s}</div>`).join('');

  // Precio
  document.getElementById('prdPrice').textContent = fmtPrecio(p.precio);

  // Botón cotizar
  document.getElementById('prdBtnCotizar').href = `/configurador.html`;
  document.getElementById('prdBtnCotizar').onclick = () => {
    sessionStorage.setItem('igb_producto_cotizar', JSON.stringify(p));
  };

  // Title de la página
  document.title = `${p.nombre} — InfraGo`;
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  const p = getProducto();
  if (!p) {
    window.location.href = '/tienda.html';
    return;
  }
  renderProducto(p);
});
PYEOF
/* ── Agregar al carro ── */
function igbAddToCart() {
  const p = getProducto();
  if (!p) return;
  const cart = JSON.parse(localStorage.getItem('igb_cart') || '[]');
  const existing = cart.find(i => i.id === p.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: p.id, nombre: p.nombre, marca: p.marca, precio: p.precio, qty });
  }
  localStorage.setItem('igb_cart', JSON.stringify(cart));

  // Actualizar badge del carro en navbar
  const badge = document.querySelector('.igb-cart-count');
  if (badge) {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    badge.textContent = total;
  }

  // Feedback visual en el botón
  const btn = document.querySelector('.prd-btn-secondary');
  const orig = btn.innerHTML;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg> Agregado';
  btn.style.background = '#16a34a';
  setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
}