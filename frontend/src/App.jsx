import { useState } from 'react';
import FlujoCEDIS   from './pages/FlujoCEDIS';
import LecturasLive from './pages/LecturasLive';
import Trazabilidad from './pages/Trazabilidad';
import Vinculacion  from './pages/Vinculacion';
import Pedidos      from './pages/Pedidos';
import ModalOC      from './components/ModalOC';
import ModalPalet      from './components/ModalPalet';
import ModalResumenOC  from './components/ModalResumenOC';

const TABS = [
  { id: 'flujo',        label: 'Flujo CEDIS'     },
  { id: 'pedidos',      label: 'Pedidos'          },
  { id: 'live',         label: 'Lecturas en Vivo' },
  { id: 'trazabilidad', label: 'Trazabilidad'     },
  { id: 'vinculacion',  label: 'Registrar Tag'    },
];

export default function App() {
  const [tab, setTab] = useState('flujo');
  const [trazabilidadEPC, setTrazabilidadEPC] = useState(null);
  const [ocModalId, setOcModalId] = useState(null);
  const [ocDemoData, setOcDemoData] = useState(null);
  const [ocEtapaOrigen, setOcEtapaOrigen] = useState(null);
  const [paletModalId, setPaletModalId] = useState(null);
  const [ocResumen, setOcResumen] = useState(null);

  function abrirOC(ordenId, demoData = null, etapaId = null) {
    setOcModalId(ordenId);
    setOcDemoData(demoData || null);
    setOcEtapaOrigen(etapaId || null);
  }

  function irATrazabilidad(epc) {
    setTrazabilidadEPC(epc);
    setTab('trazabilidad');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ds-bg-page)', fontFamily: 'var(--font-main)' }}>
      <header style={{ background: 'var(--bg-header)', height: 52, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 32, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 4, background: '#2980B9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>V</div>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1 }}>Vertiche CEDIS</div>
            <div style={{ color: '#7FB3D3', fontSize: 10, lineHeight: 1.4, letterSpacing: '.05em' }}>SISTEMA RFID</div>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t.id ? '#fff' : '#7FB3D3',
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              padding: '0 14px', height: 52,
              borderBottom: tab === t.id ? '2px solid #fff' : '2px solid transparent',
              transition: 'color 0.15s',
            }}>{t.label}</button>
          ))}
        </nav>
      </header>

      <main style={{ padding: '20px 24px' }}>
        {tab === 'flujo'        && <FlujoCEDIS onAbrirOC={abrirOC} onAbrirPalet={setPaletModalId} onAbrirResumen={setOcResumen} />}
        {tab === 'pedidos'      && <Pedidos onAbrirOC={abrirOC} onVerHistorial={irATrazabilidad} />}
        {tab === 'live'         && <LecturasLive />}
        {tab === 'trazabilidad' && <Trazabilidad initialEpc={trazabilidadEPC} />}
        {tab === 'vinculacion'  && <Vinculacion />}
      </main>

      {ocModalId && <ModalOC ordenId={ocModalId} demoData={ocDemoData} etapaOrigen={ocEtapaOrigen} onClose={() => { setOcModalId(null); setOcDemoData(null); setOcEtapaOrigen(null); }} onVerHistorial={irATrazabilidad} />}
      {paletModalId && <ModalPalet paletId={paletModalId} onClose={() => setPaletModalId(null)} onVerHistorial={irATrazabilidad} />}
      {ocResumen && <ModalResumenOC oc={ocResumen} onClose={() => setOcResumen(null)} />}
    </div>
  );
}
