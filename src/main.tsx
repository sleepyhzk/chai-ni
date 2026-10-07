import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './hooks/useAuth';
import { SrsProgressProvider } from './hooks/useSrsProgress';
import { StarredProvider } from './hooks/useStarred';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SrsProgressProvider>
        <StarredProvider>
          <App />
        </StarredProvider>
      </SrsProgressProvider>
    </AuthProvider>
  </StrictMode>
);
