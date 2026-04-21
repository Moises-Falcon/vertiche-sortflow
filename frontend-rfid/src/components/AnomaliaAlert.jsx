export default function AnomaliaAlert({ anomalia, onDismiss }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderLeft: '4px solid #dc3545',
      borderRadius: 6,
      marginBottom: 6,
      fontSize: 13,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span>
        <strong>{anomalia.tipo}</strong> — EPC: {anomalia.epc || 'DESCONOCIDO'} | Lector: {anomalia.lector_id} | Bahia: {anomalia.bahia}
      </span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#721c24', fontSize: 18, padding: '0 4px', lineHeight: 1 }}
        >
          x
        </button>
      )}
    </div>
  )
}
