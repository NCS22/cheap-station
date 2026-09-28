import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

/**
 * base.css → Tailwind + tokens + reset propio.
 * layout.css → estructura de página (header, main, footer).
 * componentes.css → tarjetas, formulario, resultados, feedback.
 */
import './estilos/base.css';
import './estilos/layout.css';
import './estilos/componentes.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
