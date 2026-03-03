import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, AlertTriangle, MessageSquare, FileText, 
  Settings, ChevronRight, LogOut, Bell, Phone, Calendar,
  TrendingUp, UserCircle, Menu, X
} from 'lucide-react';
import axios from 'axios';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AlertsPage from './pages/AlertsPage';
import CommunicationsPage from './pages/CommunicationsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import FollowUpsPage from './pages/FollowUpsPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Auth error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4F72]"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Sidebar Navigation
const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', testId: 'nav-dashboard', roles: ['cs_lead', 'csm', 'ops'] },
    { icon: Users, label: 'Clients', path: '/clients', testId: 'nav-clients', roles: ['cs_lead', 'csm', 'ops'] },
    { icon: AlertTriangle, label: 'Alerts', path: '/alerts', testId: 'nav-alerts', roles: ['cs_lead', 'csm'] },
    { icon: Phone, label: 'Follow-Ups', path: '/followups', testId: 'nav-followups', roles: ['cs_lead', 'csm'] },
    { icon: MessageSquare, label: 'Communications', path: '/communications', testId: 'nav-communications', roles: ['cs_lead', 'csm'] },
    { icon: FileText, label: 'Reports', path: '/reports', testId: 'nav-reports', roles: ['cs_lead', 'csm', 'ops'] },
    { icon: Settings, label: 'Settings', path: '/settings', testId: 'nav-settings', roles: ['cs_lead'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`
        fixed top-0 left-0 z-50 h-screen bg-[#1B4F72] text-white
        w-64 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#85C1E9] rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#1B4F72]" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Anka CS Hub</h1>
                <p className="text-xs text-[#85C1E9]">Healthcare Platform</p>
              </div>
            </div>
            <button 
              className="lg:hidden text-white/70 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    data-testid={item.testId}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? 'bg-white/20 text-white font-medium'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {active && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-[#85C1E9] rounded-full flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-[#1B4F72]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-[#85C1E9] capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-btn"
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Top Header
const Header = ({ setIsOpen }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts/today`);
      setAlerts(response.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      <button 
        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6 text-slate-600" />
      </button>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button className="p-2 hover:bg-slate-100 rounded-lg relative" data-testid="notifications-btn">
            <Bell className="h-5 w-5 text-slate-600" />
            {alerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
        
        {/* User */}
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-slate-600">Welcome,</span>
          <span className="font-medium text-slate-900">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

// Main Layout
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="lg:ml-64">
        <Header setIsOpen={setSidebarOpen} />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout><DashboardPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute>
              <MainLayout><ClientsPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/clients/:clientId" element={
            <ProtectedRoute>
              <MainLayout><ClientDetailPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/alerts" element={
            <ProtectedRoute allowedRoles={['cs_lead', 'csm']}>
              <MainLayout><AlertsPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/followups" element={
            <ProtectedRoute allowedRoles={['cs_lead', 'csm']}>
              <MainLayout><FollowUpsPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/communications" element={
            <ProtectedRoute allowedRoles={['cs_lead', 'csm']}>
              <MainLayout><CommunicationsPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <MainLayout><ReportsPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['cs_lead']}>
              <MainLayout><SettingsPage /></MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
