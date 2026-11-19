import {createRoot} from 'react-dom/client';
import {installApiInterceptor} from './lib/api-interceptor';
import App from './App.tsx';
import './index.css';

installApiInterceptor();

createRoot(document.getElementById('root')!).render(<App />);
