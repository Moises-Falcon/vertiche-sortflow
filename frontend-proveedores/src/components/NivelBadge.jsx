const NIVEL_STYLES = {
  ba: { bg:'var(--green-bg)', color:'var(--green-t)', border:'#1e3a18' },
  bb: { bg:'var(--amber-bg)', color:'var(--amber-t)', border:'#2e1e00' },
  bc: { bg:'var(--red-bg)',   color:'var(--red-t)',   border:'#2e0e0e' },
  bn: { bg:'var(--blue-bg)',  color:'var(--blue-t)',  border:'#0e1e2e' },
}

export default function NivelBadge({ level, color }) {
  const s = NIVEL_STYLES[color] || NIVEL_STYLES.bn
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:5,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      whiteSpace:'nowrap',
    }}>
      NIVEL {level}
    </span>
  )
}
