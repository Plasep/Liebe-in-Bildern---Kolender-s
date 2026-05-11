import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Gallery from './pages/Gallery'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="upload" element={<Upload />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}
