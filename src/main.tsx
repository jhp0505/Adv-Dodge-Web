import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('index.html에 <div id="root"></div>가 필요합니다.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
