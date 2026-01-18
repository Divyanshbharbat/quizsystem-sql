import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './components/AuthContext'
createRoot(document.getElementById('root')).render(
  <StrictMode>
<App/>
  </StrictMode>,
)
