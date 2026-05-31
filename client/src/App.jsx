import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from './context/NotificationContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GuideList from './pages/GuideList';
import GuideProfile from './pages/GuideProfile';
import Booking from './pages/Booking';
import Notifications from './pages/Notifications';
import ChatPage from './pages/ChatPage';
import TouristDashboard from './pages/TouristDashboard';
import GuideDashboard from './pages/GuideDashboard';
import TrekkingPackages from './pages/TrekkingPackages';
import PackageDetails from './pages/PackageDetails';

import AdminDashboard from './pages/AdminDashboard';
import CreatePackage from './pages/CreatePackage';
import GroupExplorer from './pages/GroupExplorer';
import Forum from './pages/Forum';
import GuideVerificationPortal from './pages/GuideVerificationPortal';
import Profile from './pages/Profile';
import TouristProfile from './pages/TouristProfile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  if (user?.role === 'guide') {
    if (!user.isVerifiedGuide) {
      return <Navigate to="/guide-verification" />;
    }
    return <GuideDashboard />;
  }
  return <TouristDashboard />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const LayoutWrapper = ({ children }) => {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/admin');
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      {!isDashboard && <Footer />}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "386246496395-aj89ecpuiffp4t22gqkg4n3arotf718v.apps.googleusercontent.com"}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <ScrollToTop />
            <LayoutWrapper>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/packages" element={<TrekkingPackages />} />
                  <Route path="/packages/:id" element={<PackageDetails />} />
                  <Route path="/guides" element={<GuideList />} />
                  <Route path="/guides/:id" element={<GuideProfile />} />
                  <Route path="/tourists/:id" element={<ProtectedRoute><TouristProfile /></ProtectedRoute>} />
                  <Route path="/groups" element={<ProtectedRoute><GroupExplorer /></ProtectedRoute>} />
                  <Route path="/forum" element={<Forum />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardRouter />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/book/:packageId"
                    element={
                      <ProtectedRoute>
                        <Booking />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/create-package"
                    element={
                      <ProtectedRoute>
                        <CreatePackage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/guide-verification"
                    element={
                      <ProtectedRoute>
                        <GuideVerificationPortal />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
            </LayoutWrapper>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
