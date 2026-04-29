import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import KnowledgeGraphVisualizer from './components/features/knowledge-graph/KnowledgeGraphVisualizer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/graph-test" element={<KnowledgeGraphVisualizer />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
