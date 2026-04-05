import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/packages" element={<TrekkingPackages />} />
                  <Route path="/packages/:id" element={<PackageDetails />} />
                  <Route path="/guides" element={<GuideList />} />
                  <Route path="/guides/:id" element={<GuideProfile />} />
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
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              <Footer />
              <ToastContainer position="bottom-right" />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
