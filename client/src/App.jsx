import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import BigScreen from './pages/BigScreen';
import QRCodePage from './pages/QRCodePage';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="text-white min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaign/:id/checkin" element={<CheckIn />} />
            <Route path="/campaign/:id/screen" element={<BigScreen />} />
            <Route path="/campaign/:id/qr" element={<QRCodePage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;

