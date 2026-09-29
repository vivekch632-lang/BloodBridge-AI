import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ToastContainer from './components/common/Toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DonorRegisterPage from './pages/DonorRegisterPage';
import EmergencyRequestPage from './pages/EmergencyRequestPage';
import DonorMatchingPage from './pages/DonorMatchingPage';
import RequestsFeedPage from './pages/RequestsFeedPage';
import DashboardPage from './pages/DashboardPage';
import AIAssistantPage from './pages/AIAssistantPage';
import { Storage } from './services/storage';

export default function App() {
  useEffect(() => {
    // Initialize mock database in localStorage
    Storage.init();
  }, []);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/find-blood" element={<EmergencyRequestPage />} />
            <Route path="/donor-matching" element={<DonorMatchingPage />} />
            <Route path="/become-donor" element={<DonorRegisterPage />} />
            <Route path="/requests" element={<RequestsFeedPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}