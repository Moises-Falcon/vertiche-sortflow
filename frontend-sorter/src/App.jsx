import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SorterScreen from './pages/SorterScreen'
import BayScreen    from './pages/BayScreen'

const link = document.createElement('link')
link.rel  = 'stylesheet'
link.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap'
document.head.appendChild(link)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Navigate to="/sorter" replace />} />
        <Route path="/sorter"      element={<SorterScreen />} />
        <Route path="/bahia/:id"   element={<BayScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
