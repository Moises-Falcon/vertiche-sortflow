export default function EventoRow({ evento, index }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '150px 1fr 160px 100px 60px',
      gap: 8,
      padding: '8px 12px',
      background: index % 2 === 0 ? '#fff' : '#f8f9fa',
      borderRadius: 4,
      alignItems: 'center',
      fontFamily: 'monospace',
      fontSize: 12
    }}>
      <span style={{ color: '#666' }}>
        {new Date(evento.timestamp).toLocaleTimeString()}
      </span>
      <span title={evento.epc} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {evento.epc?.substring(0, 24)}
      </span>
      <span style={{ fontSize: 10, color: '#555' }}>{evento.lector_id}</span>
      <span style={{ background: '#e3f2fd', padding: '2px 6px', borderRadius: 4, textAlign: 'center' }}>
        {evento.bahia}
      </span>
      <span style={{ color: evento.es_duplicado ? '#dc3545' : '#28a745', fontWeight: 600 }}>
        {evento.es_duplicado ? 'DUP' : 'OK'}
      </span>
    </div>
  )
}
