import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;
