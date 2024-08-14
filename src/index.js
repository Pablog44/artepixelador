import React from 'react';
import ReactDOM from 'react-dom/client'; // Importa desde 'react-dom/client'
import App from './App';
import './styles/styles.css';

const root = ReactDOM.createRoot(document.getElementById('root')); // Usa createRoot
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
