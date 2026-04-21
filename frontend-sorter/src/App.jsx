import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SorterScreen from './pages/SorterScreen'
import BayScreen    from './pages/BayScreen'

const link = document.createElement('link')
link.rel  = 'stylesheet'
link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'
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
