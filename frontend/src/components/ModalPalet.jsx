import { useEffect } from 'react';
import DetallePalet from '../pages/DetallePalet';

export default function ModalPalet({ paletId, onClose, onVerHistorial }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.52)',
      zIndex: 500,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflow: 'auto',
      padding: '32px 24px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 980,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        marginBottom: 32,
        position: 'relative',
        animation: 'ds-entrada-modal 0.22s ease',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'none', border: '1px solid var(--ds-border-light)',
          borderRadius: 6, width: 32, height: 32,
          cursor: 'pointer', fontSize: 18, color: '#94A3B8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>×</button>
        <div style={{ padding: '24px 28px' }}>
          <DetallePalet
            paletId={paletId}
            onBack={onClose}
            onVerHistorial={onVerHistorial}
          />
        </div>
      </div>
    </div>
  );
}
