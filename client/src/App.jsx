import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'sonner';
import GlobalVolumeButton from './components/shared/volume/GlobalVolumeButton';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <GlobalVolumeButton />
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  );
}

export default App;
