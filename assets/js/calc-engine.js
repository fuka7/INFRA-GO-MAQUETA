/* ═══════════════════════════════════════════════════════════════
   calc-engine.js — ElevalCorp
   Motor de cálculo centralizado. Fuente de verdad para:
   · Tramos de descuento por volumen
   · IVA (fórmula canónica: neto + round(neto × 0.19))
   · Tipo de cambio USD → CLP
   · Cuota mensual y tabla de amortización (sistema francés)
   · Clasificación de productos

   Sin dependencias de DOM. Expuesto como window.CalcEngine.
   ═══════════════════════════════════════════════════════════════ */

window.CalcEngine = (function () {
  'use strict';

  // ── Constantes ────────────────────────────────────────────────

  const IVA_RATE = 0.19;

  // Única definición de tramos — configurador.js y flat-catalog.js la importan
  const DCTO_TRAMOS = [
    { min: 10, max:   19, pct: 1 },
    { min: 20, max:   29, pct: 2 },
    { min: 30, max:   39, pct: 3 },
    { min: 40, max:   49, pct: 4 },
    { min: 50, max: 9999, pct: 5 },
  ];

  // ── Aritmética básica ─────────────────────────────────────────

  function round(n) { return Math.round(n); }

  /**
   * Retorna el monto de IVA: round(neto × 0.19).
   * Fórmula canónica — no usar Math.round(neto × 1.19) para evitar
   * discrepancias de 1 peso en ciertos montos enteros.
   */
  function montoIVA(neto) { return round(neto * IVA_RATE); }

  /**
   * Retorna neto con IVA incluido: neto + round(neto × 0.19).
   * Usar siempre esta función en lugar de Math.round(neto × 1.19).
   */
  function conIVA(neto) { return neto + montoIVA(neto); }

  // ── Precios de productos ──────────────────────────────────────

  /** Precio base en CLP, convirtiendo desde USD si corresponde. */
  function precioBase(producto, tc) {
    const tipoCambio = tc || window.tipoCambio || 900;
    if (producto.priceUSD && producto.priceUSD > 0) {
      return round(producto.priceUSD * tipoCambio);
    }
    return producto.price || 0;
  }

  /** Retorna true si el producto recibe descuento por volumen. */
  function aplicaDescuento(producto) {
    return producto.tipo !== 'servicio-tic'
        && producto.tipo !== 'accesorios'
        && producto.cat  !== 'licencias';
  }

  /** Retorna true si el producto ocupa caja física para despacho. */
  function esHardwareFisico(producto) {
    return producto.cat !== 'licencias' && producto.tipo !== 'servicio-tic';
  }

  /** Aplica el porcentaje de descuento al precio base. */
  function precioConDcto(base, pct) {
    if (!pct) return base;
    return round(base * (1 - pct / 100));
  }

  // ── Descuentos por volumen ────────────────────────────────────

  /** Porcentaje de descuento para la cantidad de hardware físico. */
  function pctDescuento(qtyHardware) {
    const t = DCTO_TRAMOS.find(t => qtyHardware >= t.min && qtyHardware <= t.max);
    return t ? t.pct : 0;
  }

  /** Tramo activo o null si no aplica descuento. */
  function tramoDescuento(qtyHardware) {
    return DCTO_TRAMOS.find(t => qtyHardware >= t.min && qtyHardware <= t.max) || null;
  }

  // ── Financiamiento ────────────────────────────────────────────

  /**
   * Cuota mensual exacta (sistema francés, sin redondear).
   * Usar este valor en los cálculos intermedios para evitar acumulación de errores.
   */
  function cuotaExacta(principal, tasaAnual, plazo) {
    if (plazo <= 0 || principal <= 0) return 0;
    const tm = tasaAnual / 100 / 12;
    if (tm === 0) return principal / plazo;
    const factor = Math.pow(1 + tm, plazo);
    return principal * (tm * factor) / (factor - 1);
  }

  /**
   * Tabla de amortización completa (sistema francés).
   *
   * Utiliza la cuota exacta (float) para los cálculos internos.
   * Redondea solo para el display de cada fila.
   * La última cuota paga exactamente el saldo pendiente → saldo final = $0.
   */
  function calcularAmortizacion(principal, tasaAnual, plazo) {
    const tm     = tasaAnual / 100 / 12;
    const cuotaF = cuotaExacta(principal, tasaAnual, plazo);
    const cuota  = round(cuotaF);

    let saldo = principal;
    const filas = [];
    let totalCapital = 0, totalInteres = 0, totalCuotas = 0;

    for (let i = 1; i <= plazo; i++) {
      const interes = round(saldo * tm);

      if (i === plazo) {
        // Última cuota: liquidar exactamente el saldo restante
        const capital    = saldo;
        const cuotaFinal = capital + interes;
        totalCapital += capital;
        totalInteres += interes;
        totalCuotas  += cuotaFinal;
        filas.push({ mes: i, cuota: cuotaFinal, capital, interes, saldo: 0 });
        saldo = 0;
      } else {
        // Usar cuotaF exacta para capital, evita drift acumulado
        const capital = Math.max(0, round(cuotaF - interes));
        saldo = Math.max(0, saldo - capital);
        totalCapital += capital;
        totalInteres += interes;
        totalCuotas  += cuota;
        filas.push({ mes: i, cuota, capital, interes, saldo });
      }
    }

    return {
      cuota,
      cuotaF,
      filas,
      totalCapital: round(totalCapital),
      totalInteres: round(totalInteres),
      totalCuotas:  round(totalCuotas),
      totalPagar:   round(totalCuotas),
      interesTotal: Math.max(0, round(totalCuotas - principal)),
    };
  }

  /**
   * Resumen completo del simulador de financiamiento.
   * eqNeto:  total equipos sin IVA
   * svcNeto: total servicios sin IVA (mensuales)
   */
  function calcularSimulador(eqNeto, svcNeto, tasaAnual, plazo) {
    const principal  = conIVA(eqNeto);
    const svcIVA     = conIVA(svcNeto);
    const amort      = calcularAmortizacion(principal, tasaAnual, plazo);
    const cuotaTotal = round(amort.cuota + svcIVA);
    const totalPagar = round(amort.totalPagar + svcIVA * plazo);
    const interesTotal = Math.max(0, round(amort.totalPagar - principal));

    return {
      principal,
      svcIVA,
      cuota:       amort.cuota,
      cuotaTotal,
      totalPagar,
      interesTotal,
      amort,
    };
  }

  // ── API pública ───────────────────────────────────────────────

  return {
    IVA_RATE,
    DCTO_TRAMOS,
    round,
    montoIVA,
    conIVA,
    precioBase,
    aplicaDescuento,
    esHardwareFisico,
    precioConDcto,
    pctDescuento,
    tramoDescuento,
    cuotaExacta,
    calcularAmortizacion,
    calcularSimulador,
  };
})();
