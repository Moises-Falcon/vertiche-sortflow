export default function TagBadge({ tag }) {
  if (!tag) return null
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 10px',
      borderRadius: 12,
      background: '#e3f2fd',
      color: '#1565c0',
      fontSize: 12,
      fontFamily: 'monospace',
      border: '1px solid #90caf9'
    }}>
      {tag.epc?.substring(0, 16)}... | {tag.sku}
    </span>
  )
}
