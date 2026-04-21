// Iconos SVG inline — sin emojis

export const IconAntenna = ({ size=24, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12a7 7 0 0 1 14 0"/>
    <path d="M8 12a4 4 0 0 1 8 0"/>
    <circle cx="12" cy="12" r="1.5" fill={color}/>
    <line x1="12" y1="14" x2="12" y2="21"/>
  </svg>
)

export const IconScan = ({ size=16, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V5a1 1 0 0 1 1-1h2"/>
    <path d="M17 4h2a1 1 0 0 1 1 1v2"/>
    <path d="M20 17v2a1 1 0 0 1-1 1h-2"/>
    <path d="M7 20H5a1 1 0 0 1-1-1v-2"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
    <line x1="7" y1="9" x2="17" y2="9"/>
    <line x1="7" y1="15" x2="13" y2="15"/>
  </svg>
)

export const IconBolt = ({ size=14, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M13 2 3 14h7l-1 8 11-13h-7l1-7z"/>
  </svg>
)

export const IconSigma = ({ size=14, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h14M5 4l8 8-8 8h14"/>
  </svg>
)

export const IconCheck = ({ size=14, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 12 10 17 19 7"/>
  </svg>
)

export const IconX = ({ size=14, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="6" x2="18" y2="18"/>
    <line x1="18" y1="6" x2="6" y2="18"/>
  </svg>
)

export const IconWarning = ({ size=18, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 2 21h20L12 3z"/>
    <line x1="12" y1="10" x2="12" y2="14"/>
    <circle cx="12" cy="17.5" r="1" fill={color}/>
  </svg>
)

export const IconArrow = ({ size=14, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="13 6 19 12 13 18"/>
  </svg>
)

export const IconDot = ({ size=8, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 10 10">
    <circle cx="5" cy="5" r="5" fill={color}/>
  </svg>
)
