/* ═══════════════════════════════════════════════════════════════
   catalogo.js — Base de datos de Productos y Servicios · InfraGo
   ───────────────────────────────────────────────────────────────
   Este archivo es la ÚNICA fuente de verdad del catálogo.
   Para agregar, editar o eliminar productos/servicios, edita
   solo este archivo. El configurador.html lo carga dinámicamente.

   ESTRUCTURA DE UN PRODUCTO:
   {
     name:     "Nombre del producto",        // texto visible
     marca:    "HP",                         // para filtro de marca
     tipo:     "notebook",                   // para filtro de tipo (ver TIPOS)
     specs:    "Especificaciones breves",    // subtítulo visible
     price:    450000,                       // precio CLP (número, sin puntos)
     servicios: [                            // servicios asociados (puede ser [])
       { value: "instalacion", label: "Instalación y configuración", price: 80000, unidad: "" },
       { value: "soporte",     label: "Soporte técnico mensual",     price: 35000, unidad: "/mes" },
     ]
   }

   TIPOS VÁLIDOS (deben coincidir con los filtros del HTML):
     notebook | servidor | impresora | networking | storage

   MARCAS VÁLIDAS (deben coincidir con los chips de filtro del HTML):
     HP | Dell | Lenovo | Apple | Brother | Cisco | Fortinet | Ubiquiti | Synology | QNAP | Canon
   ═══════════════════════════════════════════════════════════════ */

const CATALOGO = [

  /* ──────────────────────────────────────────
     NOTEBOOKS
  ─────────────────────────────────────────── */
  {
    name:  "HP EliteBook 640",
    marca: "HP",
    tipo:  "notebook",
    specs: "Intel Core i5 · 16GB RAM · 512GB SSD",
    price: 450000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: ""     },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes"  },
      { value: "garantia",    label: "Garantía extendida 3 años",    price: 45000, unidad: "/año"  },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: ""      },
    ],
  },
  {
    name:  "Dell Inspiron 15",
    marca: "Dell",
    tipo:  "notebook",
    specs: "Intel Core i7 · 16GB RAM · 512GB SSD",
    price: 520000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: ""     },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes"  },
      { value: "garantia",    label: "Garantía extendida 3 años",    price: 45000, unidad: "/año"  },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: ""      },
    ],
  },
  {
    name:  "MacBook Pro 14",
    marca: "Apple",
    tipo:  "notebook",
    specs: "Apple M3 · 16GB RAM · 512GB SSD",
    price: 1200000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: ""    },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes" },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: ""     },
    ],
  },
  {
    name:  "Lenovo ThinkPad E14",
    marca: "Lenovo",
    tipo:  "notebook",
    specs: "AMD Ryzen 5 · 16GB RAM · 512GB SSD",
    price: 480000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: ""    },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes" },
      { value: "garantia",    label: "Garantía extendida 3 años",    price: 45000, unidad: "/año" },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: ""     },
    ],
  },

  /* ──────────────────────────────────────────
     SERVIDORES
  ─────────────────────────────────────────── */
  {
    name:  "Dell PowerEdge R650",
    marca: "Dell",
    tipo:  "servidor",
    specs: "Intel Xeon · 64GB RAM · 1TB SSD",
    price: 2500000,
    servicios: [
      { value: "instalacion", label: "Instalación rack y configuración", price: 150000, unidad: ""    },
      { value: "soporte",     label: "Soporte Premium mensual",          price: 120000, unidad: "/mes" },
      { value: "monitoreo",   label: "Monitoreo 24/7",                   price: 80000,  unidad: "/mes" },
      { value: "backup",      label: "Backup & Replicación",             price: 200000, unidad: "/mes" },
    ],
  },
  {
    name:  "HP ProLiant DL380",
    marca: "HP",
    tipo:  "servidor",
    specs: "Intel Xeon · 128GB RAM · 2TB SSD",
    price: 3200000,
    servicios: [
      { value: "instalacion", label: "Instalación rack y configuración", price: 150000, unidad: ""    },
      { value: "soporte",     label: "Soporte Premium mensual",          price: 120000, unidad: "/mes" },
      { value: "monitoreo",   label: "Monitoreo 24/7",                   price: 80000,  unidad: "/mes" },
      { value: "backup",      label: "Backup & Replicación",             price: 200000, unidad: "/mes" },
    ],
  },
  {
    name:  "Lenovo ThinkSystem SR650",
    marca: "Lenovo",
    tipo:  "servidor",
    specs: "Intel Xeon · 96GB RAM · 1.5TB SSD",
    price: 2800000,
    servicios: [
      { value: "instalacion", label: "Instalación rack y configuración", price: 150000, unidad: ""    },
      { value: "soporte",     label: "Soporte Premium mensual",          price: 120000, unidad: "/mes" },
      { value: "monitoreo",   label: "Monitoreo 24/7",                   price: 80000,  unidad: "/mes" },
      { value: "backup",      label: "Backup & Replicación",             price: 200000, unidad: "/mes" },
    ],
  },

  /* ──────────────────────────────────────────
     IMPRESORAS
  ─────────────────────────────────────────── */
  {
    name:  "HP LaserJet M110w",
    marca: "HP",
    tipo:  "impresora",
    specs: "Impresión B/N · Red + Wi-Fi",
    price: 350000,
    servicios: [
      { value: "instalacion",    label: "Instalación y configuración red",   price: 40000, unidad: ""    },
      { value: "mantenimiento",  label: "Mantenimiento preventivo mensual",  price: 25000, unidad: "/mes" },
      { value: "toner",          label: "Servicio tóner incluido",           price: 15000, unidad: "/mes" },
    ],
  },
  {
    name:  "Canon PIXMA G3160",
    marca: "Canon",
    tipo:  "impresora",
    specs: "Impresión Color · Wi-Fi · Ecotank",
    price: 290000,
    servicios: [
      { value: "instalacion",   label: "Instalación y configuración red",  price: 40000, unidad: ""    },
      { value: "mantenimiento", label: "Mantenimiento preventivo mensual", price: 25000, unidad: "/mes" },
    ],
  },
  {
    name:  "Brother MFC-L6915DW",
    marca: "Brother",
    tipo:  "impresora",
    specs: "Impresión/Escaneo/Fax · Red + Wi-Fi",
    price: 720000,
    servicios: [
      { value: "instalacion",   label: "Instalación y configuración red",  price: 50000, unidad: ""    },
      { value: "mantenimiento", label: "Mantenimiento preventivo mensual", price: 30000, unidad: "/mes" },
      { value: "toner",         label: "Servicio tóner incluido",          price: 20000, unidad: "/mes" },
    ],
  },

  /* ──────────────────────────────────────────
     NETWORKING
  ─────────────────────────────────────────── */
  {
    name:  "Switch Cisco 24 puertos",
    marca: "Cisco",
    tipo:  "networking",
    specs: "Gigabit Managed · PoE+ · 24P",
    price: 680000,
    servicios: [
      { value: "instalacion",   label: "Instalación y cableado",         price: 90000,  unidad: ""    },
      { value: "configuracion", label: "Configuración VLANs y QoS",      price: 120000, unidad: ""    },
      { value: "monitoreo",     label: "Monitoreo de red mensual",        price: 60000,  unidad: "/mes" },
    ],
  },
  {
    name:  "Fortinet FortiGate 60F",
    marca: "Fortinet",
    tipo:  "networking",
    specs: "Firewall UTM · 10 Gbps · VPN",
    price: 1100000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración firewall", price: 150000, unidad: ""    },
      { value: "licencia",    label: "Licencia FortiCare anual",             price: 180000, unidad: "/año" },
      { value: "monitoreo",   label: "Monitoreo de seguridad mensual",       price: 90000,  unidad: "/mes" },
    ],
  },
  {
    name:  "Ubiquiti UniFi U6",
    marca: "Ubiquiti",
    tipo:  "networking",
    specs: "Wi-Fi 6 · 2.4/5 GHz · PoE",
    price: 220000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración AP",    price: 50000, unidad: ""    },
      { value: "soporte",     label: "Soporte red inalámbrica mensual",   price: 30000, unidad: "/mes" },
    ],
  },

  /* ──────────────────────────────────────────
     ALMACENAMIENTO (NAS)
  ─────────────────────────────────────────── */
  {
    name:  "Synology DS923+",
    marca: "Synology",
    tipo:  "storage",
    specs: "NAS 4-bay · AMD Ryzen · 4GB RAM",
    price: 950000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración NAS",   price: 100000, unidad: ""    },
      { value: "backup",      label: "Configuración backup automático",   price: 150000, unidad: ""    },
      { value: "soporte",     label: "Soporte administración mensual",    price: 60000,  unidad: "/mes" },
    ],
  },
  {
    name:  "QNAP TS-464",
    marca: "QNAP",
    tipo:  "storage",
    specs: "NAS 4-bay · Intel N5105 · 8GB RAM",
    price: 870000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración NAS",  price: 100000, unidad: ""    },
      { value: "backup",      label: "Configuración backup automático",  price: 150000, unidad: ""    },
      { value: "soporte",     label: "Soporte administración mensual",   price: 60000,  unidad: "/mes" },
    ],
  },

];

/* ═══════════════════════════════════════════════════════════════
   EXPORTAR — disponible como window.CATALOGO para el configurador
   ═══════════════════════════════════════════════════════════════ */
window.CATALOGO = CATALOGO;