export default function Sparkline({ data = [], height = 60 }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height }}>
      {data.map((v, i) => (
        <div key={i} title={`${v}`} style={{
          flex:1, borderRadius:'2px 2px 0 0', minHeight:4,
          background: v >= 4.5 ? 'var(--green)' : v >= 2.5 ? 'var(--amber)' : v > 0 ? 'var(--red)' : 'var(--bg3)',
          height: `${(v/5)*100}%`,
          transition:'height .3s ease',
        }} />
      ))}
    </div>
  )
}
