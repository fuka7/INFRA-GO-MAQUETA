/* ═══════════════════════════════════════════════════════════════
   catalogo.js — Base de datos de Productos y Servicios · InfraGo
   ───────────────────────────────────────────────────────────────
   Este archivo es la ÚNICA fuente de verdad del catálogo.
   Para agregar, editar o eliminar productos/servicios, edita
   solo este archivo. El configurador.html lo carga dinámicamente.

   ESTRUCTURA DE UN PRODUCTO:
   {
     name:       "Nombre del producto",        // texto visible
     marca:      "HP",                         // para filtro de marca
     tipo:       "notebook",                   // para filtro de tipo (ver TIPOS)
     partNumber: "XX-XXXXX",                   // part number del producto
     price:      450000,                       // precio CLP (número, sin puntos)
     servicios: [                              // servicios asociados (puede ser [])
       { value: "instalacion", label: "Instalación y configuración", price: 80000, unidad: "",      frecuencia: "al inicio" },
       { value: "soporte",     label: "Soporte técnico mensual",     price: 35000, unidad: "/mes",  frecuencia: "/mes" },
     ]
   }

   TIPOS VÁLIDOS (deben coincidir con los filtros del HTML):
     pc | notebook | servidor | impresora | networking | storage | servicio-tic

   MARCAS VÁLIDAS (deben coincidir con los chips de filtro del HTML):
     HP | Dell | Lenovo | Apple | Brother | Cisco | Fortinet | Ubiquiti | Synology | QNAP | Canon | TIC Managers
   ═══════════════════════════════════════════════════════════════ */

const CATALOGO = [

  /* ──────────────────────────────────────────
     NOTEBOOKS
  ─────────────────────────────────────────── */
  {
    name:       "HP EliteBook 640",
    marca:      "HP",
    tipo:       "notebook",
    partNumber: "80A19LT#ABM",
    price:      450000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: "",      frecuencia: "al inicio"     },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes",  frecuencia: "/mes"  },
      { value: "garantia",    label: "Garantía extendida 3 años",    price: 45000, unidad: "/año",  frecuencia: "/año"  },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: "",      frecuencia: "al inicio"      },
    ],
  },
  {
    name:       "Dell Inspiron 15",
    marca:      "Dell",
    tipo:       "notebook",
    partNumber: "I15-I7U512-BLK",
    price:      520000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: "",      frecuencia: "al inicio"     },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes",  frecuencia: "/mes"  },
      { value: "garantia",    label: "Garantía extendida 3 años",    price: 45000, unidad: "/año",  frecuencia: "/año"  },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: "",      frecuencia: "al inicio"      },
    ],
  },
  {
    name:       "MacBook Pro 14",
    marca:      "Apple",
    tipo:       "notebook",
    partNumber: "MRX33LL/A",
    price:      1200000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes",  frecuencia: "/mes" },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: "",      frecuencia: "al inicio"     },
    ],
  },
  {
    name:       "Lenovo ThinkPad E14",
    marca:      "Lenovo",
    tipo:       "notebook",
    partNumber: "21JK0005CL",
    price:      480000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes",  frecuencia: "/mes" },
      { value: "garantia",    label: "Garantía extendida 3 años",    price: 45000, unidad: "/año",  frecuencia: "/año" },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: "",      frecuencia: "al inicio"     },
    ],
  },

  /* ──────────────────────────────────────────
     SERVIDORES
  ─────────────────────────────────────────── */
  {
    name:       "Dell PowerEdge R650",
    marca:      "Dell",
    tipo:       "servidor",
    partNumber: "R650-XS-4314-64G",
    price:      2500000,
    servicios: [
      { value: "instalacion", label: "Instalación rack y configuración", price: 150000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte Premium mensual",          price: 120000, unidad: "/mes",  frecuencia: "/mes" },
      { value: "monitoreo",   label: "Monitoreo 24/7",                   price: 80000,  unidad: "/mes",  frecuencia: "/mes" },
      { value: "backup",      label: "Backup & Replicación",             price: 200000, unidad: "/mes",  frecuencia: "/mes" },
    ],
  },
  {
    name:       "HP ProLiant DL380",
    marca:      "HP",
    tipo:       "servidor",
    partNumber: "P56963-B21",
    price:      3200000,
    servicios: [
      { value: "instalacion", label: "Instalación rack y configuración", price: 150000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte Premium mensual",          price: 120000, unidad: "/mes",  frecuencia: "/mes" },
      { value: "monitoreo",   label: "Monitoreo 24/7",                   price: 80000,  unidad: "/mes",  frecuencia: "/mes" },
      { value: "backup",      label: "Backup & Replicación",             price: 200000, unidad: "/mes",  frecuencia: "/mes" },
    ],
  },
  {
    name:       "Lenovo ThinkSystem SR650",
    marca:      "Lenovo",
    tipo:       "servidor",
    partNumber: "7X06A0BWEA",
    price:      2800000,
    servicios: [
      { value: "instalacion", label: "Instalación rack y configuración", price: 150000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte Premium mensual",          price: 120000, unidad: "/mes",  frecuencia: "/mes" },
      { value: "monitoreo",   label: "Monitoreo 24/7",                   price: 80000,  unidad: "/mes",  frecuencia: "/mes" },
      { value: "backup",      label: "Backup & Replicación",             price: 200000, unidad: "/mes",  frecuencia: "/mes" },
    ],
  },

  /* ──────────────────────────────────────────
     IMPRESORAS
  ─────────────────────────────────────────── */
  {
    name:       "HP LaserJet M110w",
    marca:      "HP",
    tipo:       "impresora",
    partNumber: "7MD66F#BGJ",
    price:      350000,
    servicios: [
      { value: "instalacion",    label: "Instalación y configuración red",   price: 40000, unidad: "",      frecuencia: "al inicio"    },
      { value: "mantenimiento",  label: "Mantenimiento preventivo mensual",  price: 25000, unidad: "/mes",  frecuencia: "/mes" },
      { value: "toner",          label: "Servicio tóner incluido",           price: 15000, unidad: "/mes",  frecuencia: "/mes" },
    ],
  },
  {
    name:       "Canon PIXMA G3160",
    marca:      "Canon",
    tipo:       "impresora",
    partNumber: "4468C002AA",
    price:      290000,
    servicios: [
      { value: "instalacion",   label: "Instalación y configuración red",  price: 40000, unidad: "",      frecuencia: "al inicio"    },
      { value: "mantenimiento", label: "Mantenimiento preventivo mensual", price: 25000, unidad: "/mes",  frecuencia: "/mes" },
    ],
  },
  {
    name:       "Brother MFC-L6915DW",
    marca:      "Brother",
    tipo:       "impresora",
    partNumber: "MFCL6915DW",
    price:      720000,
    servicios: [
      { value: "instalacion",   label: "Instalación y configuración red",  price: 50000, unidad: "",      frecuencia: "al inicio"    },
      { value: "mantenimiento", label: "Mantenimiento preventivo mensual", price: 30000, unidad: "/mes",  frecuencia: "/mes" },
      { value: "toner",         label: "Servicio tóner incluido",          price: 20000, unidad: "/mes",  frecuencia: "/mes" },
    ],
  },

  /* ──────────────────────────────────────────
     NETWORKING
  ─────────────────────────────────────────── */
  {
    name:       "Switch Cisco 24 puertos",
    marca:      "Cisco",
    tipo:       "networking",
    partNumber: "CBS350-24P-4G-CL",
    price:      680000,
    servicios: [
      { value: "instalacion",   label: "Instalación y cableado",         price: 90000,  unidad: "",      frecuencia: "al inicio"    },
      { value: "configuracion", label: "Configuración VLANs y QoS",      price: 120000, unidad: "",      frecuencia: "al inicio"    },
      { value: "monitoreo",     label: "Monitoreo de red mensual",        price: 60000,  unidad: "/mes",  frecuencia: "/mes" },
    ],
  },
  {
    name:       "Fortinet FortiGate 60F",
    marca:      "Fortinet",
    tipo:       "networking",
    partNumber: "FG-60F",
    price:      1100000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración firewall", price: 150000, unidad: "",      frecuencia: "al inicio"    },
      { value: "licencia",    label: "Licencia FortiCare anual",             price: 180000, unidad: "/año",  frecuencia: "/año" },
      { value: "monitoreo",   label: "Monitoreo de seguridad mensual",       price: 90000,  unidad: "/mes",  frecuencia: "/mes" },
    ],
  },
  {
    name:       "Ubiquiti UniFi U6",
    marca:      "Ubiquiti",
    tipo:       "networking",
    partNumber: "U6-LR",
    price:      220000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración AP",    price: 50000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte red inalámbrica mensual",   price: 30000, unidad: "/mes",  frecuencia: "/mes" },
    ],
  },

  /* ──────────────────────────────────────────
     ALMACENAMIENTO (NAS)
  ─────────────────────────────────────────── */
  {
    name:       "Synology DS923+",
    marca:      "Synology",
    tipo:       "servidor",
    partNumber: "DS923+",
    price:      950000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración NAS",   price: 100000, unidad: "",      frecuencia: "al inicio"    },
      { value: "backup",      label: "Configuración backup automático",   price: 150000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte administración mensual",    price: 60000,  unidad: "/mes",  frecuencia: "/mes" },
    ],
  },
  {
    name:       "QNAP TS-464",
    marca:      "QNAP",
    tipo:       "servidor",
    partNumber: "TS-464-8G",
    price:      870000,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración NAS",  price: 100000, unidad: "",      frecuencia: "al inicio"    },
      { value: "backup",      label: "Configuración backup automático",  price: 150000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte administración mensual",   price: 60000,  unidad: "/mes",  frecuencia: "/mes" },
    ],
  },

  /* ──────────────────────────────────────────
     SERVICIOS TIC
  ─────────────────────────────────────────── */
  {
    name:       "TIC Managers Instalación equipos TI",
    marca:      "TIC Managers",
    tipo:       "servicio-tic",
    price:      90000,
    servicios: [],
  },
  {
    name:       "TIC Managers Migración de datos",
    marca:      "TIC Managers",
    tipo:       "servicio-tic",
    price:      75000,
    servicios: [],
  },
  {
    name:       "TIC Managers Mesa de ayuda (mensual)",
    marca:      "TIC Managers",
    tipo:       "servicio-tic",
    price:      85000,
    servicios: [],
  },
  {
    name:       "TIC Managers Soporte en terreno",
    marca:      "TIC Managers",
    tipo:       "servicio-tic",
    price:      65000,
    servicios: [],
  },
  {
    name:       "TIC Managers Seguro equipos electrónicos",
    marca:      "TIC Managers",
    tipo:       "servicio-tic",
    price:      18000,
    servicios: [],
  },

  /* ──────────────────────────────────────────
     ALL IN ONE (PC AIO)
  ─────────────────────────────────────────── */
  {
    name:       "HP EliteOne 800 G9 AIO",
    marca:      "HP",
    tipo:       "pc",
    partNumber: "6B2Q4LA#ABM",
    priceUSD:   989,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes",  frecuencia: "/mes" },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: "",      frecuencia: "al inicio"     },
    ],
  },
  {
    name:       "HP ProOne 440 G9 AIO",
    marca:      "HP",
    tipo:       "pc",
    partNumber: "6B2D2LA#ABM",
    priceUSD:   800,
    servicios: [
      { value: "instalacion", label: "Instalación y configuración",  price: 80000, unidad: "",      frecuencia: "al inicio"    },
      { value: "soporte",     label: "Soporte técnico mensual",      price: 35000, unidad: "/mes",  frecuencia: "/mes" },
      { value: "migracion",   label: "Migración de datos",           price: 60000, unidad: "",      frecuencia: "al inicio"     },
    ],
  },

  /* ──────────────────────────────────────────
     LICENCIAS — OFFICE & ANTIVIRUS
  ─────────────────────────────────────────── */
  {
    name:       "Microsoft 365 Business Basic (mensual/usuario)",
    marca:      "TIC Managers",
    tipo:       "storage",
    partNumber: "CFQ7TTC0J25C",
    price:      7900,
    servicios: [],
  },
  {
    name:       "Microsoft 365 Business Standard (mensual/usuario)",
    marca:      "TIC Managers",
    tipo:       "storage",
    partNumber: "CFQ7TTC0JTHM",
    price:      15900,
    servicios: [],
  },
  {
    name:       "Microsoft 365 Apps for Business (mensual/usuario)",
    marca:      "TIC Managers",
    tipo:       "storage",
    partNumber: "CFQ7TTC0J7D9",
    price:      11900,
    servicios: [],
  },
  {
    name:       "Bitdefender GravityZone Business Security (mensual/equipo)",
    marca:      "TIC Managers",
    tipo:       "storage",
    partNumber: "BD-GZ-BS-MO",
    price:      4900,
    servicios: [],
  },
  {
    name:       "Bitdefender GravityZone Business Security Premium (mensual/equipo)",
    marca:      "TIC Managers",
    tipo:       "storage",
    partNumber: "BD-GZ-BSP-MO",
    price:      7500,
    servicios: [],
  },

  /* ──────────────────────────────────────────
     CIBERGESTIÓN MENSUAL
  ─────────────────────────────────────────── */
  {
    name:       "TIC Managers Cibergestión Esencial (mensual)",
    marca:      "TIC Managers",
    tipo:       "servicio-tic",
    partNumber: "TIC-CG-ESE",
    price:      85000,
    servicios: [],
  },
  {
    name:       "TIC Managers Cibergestión Avanzada (mensual)",
    marca:      "TIC Managers",
    tipo:       "servicio-tic",
    partNumber: "TIC-CG-AVZ",
    price:      150000,
    servicios: [],
  },
  {
    name:       "TIC Managers Cibergestión Enterprise (mensual)",
    marca:      "TIC Managers",
    tipo:       "servicio-tic",
    partNumber: "TIC-CG-ENT",
    price:      280000,
    servicios: [],
  },


];

/* ═══════════════════════════════════════════════════════════════
   EXPORTAR — disponible como window.CATALOGO para el configurador
   ═══════════════════════════════════════════════════════════════ */
window.CATALOGO = CATALOGO;