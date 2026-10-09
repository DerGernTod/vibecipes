/// <reference types="vite/client" />
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { StyleGuide } from './ui/StyleGuide.tsx';
import './styles/theme.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      {import.meta.env.DEV && new URLSearchParams(window.location.search).has('guide') ? <StyleGuide /> : <App />}
    </React.StrictMode>
  );
}
