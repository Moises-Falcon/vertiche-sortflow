export default function Stars({ rating, size = 14 }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          width:size, height:size,
          background: i <= Math.round(rating) ? 'var(--gold)' : 'var(--bg3)',
          clipPath:'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
        }} />
      ))}
    </div>
  )
}
