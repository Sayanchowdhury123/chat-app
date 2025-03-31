import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Authprovider } from './context/authcontext'
import { Socketprovider } from './context/socketcontext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Authprovider>
      <Socketprovider>
      <App />
      </Socketprovider>
    </Authprovider>
  </StrictMode>,
)
