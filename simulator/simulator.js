require('dotenv').config();
const axios = require('axios');
const { TAGS_CONOCIDOS, FLUJO_ETAPAS, ANOMALIAS, NUEVO_PREPACK_CADA_SEG, EPCS_DEMO } = require('./config');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// — Utilidades ─────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomRssi() { return parseFloat((-(Math.random() * 25 + 50)).toFixed(1)); }

function randomEpcDesconocido() {
  return 'UNKNOWN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function hora() {
  return new Date().toLocaleTimeString('es-MX', { hour12: false });
}

function reemplazarBahia(template, numBahia) {
  return template.replace(/\{B\}/g, numBahia);
}

// — Envio al backend ───────────────────────────────────────────────────────────

async function enviarLectura(payload, logLine) {
  if (EPCS_DEMO.includes(payload.epc)) return null;

  try {
    const res = await axios.post(`${BACKEND_URL}/api/lecturas`, payload, { timeout: 3000 });
    console.log(logLine + ` [${res.status}]`);
    return res.data;
  } catch (err) {
    const status = err.response?.status || 'ERR';
    console.log(`[ERROR] [${hora()}] ${status} -> ${payload.epc?.substring(0, 24)}`);
    return null;
  }
}

// — Flujo completo de un prepack ───────────────────────────────────────────────

async function procesarPrepack(tag) {
  const numBahia = tag.bahia_correcta.replace('BAHIA-', '');
  // CROSS_DOCK: 7 etapas; NUEVA_TIENDA/REFILL: solo primeras 3
  const pasos = tag.tipo_flujo === 'CROSS_DOCK' ? FLUJO_ETAPAS : FLUJO_ETAPAS.slice(0, 3);
  const etiquetaFlujo = tag.tipo_flujo;

  for (let i = 0; i < pasos.length; i++) {
    const paso = pasos[i];

    if (paso.delay_seg > 0) await sleep(paso.delay_seg * 1000);

    const esBahia = paso.etapa === 'BAHIA';
    const tieneAnomaliBahia = esBahia && Math.random() < ANOMALIAS.BAHIA_INCORRECTA;
    const bahiasAlternativas = ['1', '2', '3', '4'].filter(b => b !== numBahia);

    const bahiaUsada = tieneAnomaliBahia
      ? `BAHIA-${randomItem(bahiasAlternativas)}`
      : reemplazarBahia(paso.bahia, numBahia);

    const lectorId = tieneAnomaliBahia
      ? `RFID-BAHIA-${randomItem(bahiasAlternativas)}`
      : reemplazarBahia(paso.lector, numBahia);

    const payload = {
      epc:          tag.epc,
      lector_id:    lectorId,
      bahia:        bahiaUsada,
      etapa:        paso.etapa,
      rssi:         randomRssi(),
      antenna_port: `Antenna_${Math.floor(Math.random() * 4) + 1}`
    };

    const icono   = tieneAnomaliBahia ? '[WARN]' : '[OK]  ';
    const nota    = tieneAnomaliBahia ? ` ! BAHIA_INCORRECTA (esperada BAHIA-${numBahia})` : '';
    const logLine = `${icono} [${hora()}] ${tag.sku.padEnd(14)} | ${paso.etapa.padEnd(15)} | ${bahiaUsada.padEnd(16)} | ${etiquetaFlujo}${nota}`;

    await enviarLectura(payload, logLine);

    // Anomalia: TAG_DUPLICADO justo despues
    if (Math.random() < ANOMALIAS.TAG_DUPLICADO) {
      await sleep(800);
      const dupLog = `[WARN] [${hora()}] ${tag.sku.padEnd(14)} | DUP             | ${bahiaUsada.padEnd(16)} | doble ping`;
      await enviarLectura({ ...payload }, dupLog);
    }
  }

  const etapaFinal = tag.tipo_flujo === 'CROSS_DOCK' ? 'ENVIO' : 'REGISTRO';
  console.log(`[DONE] [${hora()}] ${tag.sku} completado -> ${etapaFinal}`);
}

// — Loop de tags desconocidos (independiente) ──────────────────────────────────

async function loopTagsDesconocidos() {
  while (true) {
    await sleep((20 + Math.random() * 15) * 1000);

    if (Math.random() > ANOMALIAS.TAG_DESCONOCIDO * 500) continue;

    const epcFalso = randomEpcDesconocido();
    const lector   = randomItem(['RFID-RECEPCION-1', 'RFID-QA-1', 'RFID-BAHIA-1']);
    const bahia    = lector.includes('RECEPCION') ? 'RAMPA-ENTRADA' : lector.includes('QA') ? 'ZONA-QA' : 'BAHIA-1';
    const etapa    = lector.includes('RECEPCION') ? 'PREREGISTRO' : lector.includes('QA') ? 'QA' : 'BAHIA';

    const payload  = { epc: epcFalso, lector_id: lector, bahia, etapa, rssi: randomRssi() };
    const logLine  = `[WARN] [${hora()}] DESCONOCIDO     | ${etapa.padEnd(15)} | ${bahia.padEnd(16)} | TAG_DESCONOCIDO`;
    await enviarLectura(payload, logLine);
  }
}

// — Loop principal ─────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(70));
  console.log('  Simulador RFID - Vertiche CEDIS  [V5]');
  console.log(`  Backend: ${BACKEND_URL}`);
  console.log(`  Tags en pool: ${TAGS_CONOCIDOS.length} | Flujo unico FLUJO_ETAPAS (7 pasos)`);
  console.log(`  Anomalias: ~0.2% por tipo (demo limpia)`);
  console.log('='.repeat(70));

  await sleep(2000);

  loopTagsDesconocidos().catch(console.error);

  let tagIndex = 0;
  while (true) {
    const tag = TAGS_CONOCIDOS[tagIndex % TAGS_CONOCIDOS.length];
    tagIndex++;

    procesarPrepack(tag).catch(err => console.error('Error en prepack:', err.message));

    await sleep(NUEVO_PREPACK_CADA_SEG * 1000);
  }
}

main().catch(console.error);
