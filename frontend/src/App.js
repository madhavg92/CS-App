import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Users, BarChart3, AlertCircle, ListTodo, Mail, Activity, Calendar, Home, Network } from 'lucide-react';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AlertsPage from './pages/AlertsPage';
import FollowUpsPage from './pages/FollowUpsPage';
import ReportsPage from './pages/ReportsPage';
import CommunicationsPage from './pages/CommunicationsPage';
import SchedulingPage from './pages/SchedulingPage';
import OrgMappingPage from './pages/OrgMappingPage';
import CalendarPage from './pages/CalendarPage';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sidebar Navigation Component
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/', testId: 'nav-dashboard' },
    { icon: Users, label: 'Clients', path: '/clients', testId: 'nav-clients' },
    { icon: Network, label: 'Org Mapping', path: '/org-mapping', testId: 'nav-org-mapping' },
    { icon: Calendar, label: 'Review Calendar', path: '/calendar', testId: 'nav-calendar' },
    { icon: AlertCircle, label: 'Alerts', path: '/alerts', testId: 'nav-alerts' },
    { icon: ListTodo, label: 'Follow-ups', path: '/followups', testId: 'nav-followups' },
    { icon: BarChart3, label: 'Reports', path: '/reports', testId: 'nav-reports' },
    { icon: Mail, label: 'Communications', path: '/communications', testId: 'nav-communications' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Anka CS</h1>
            <p className="text-xs text-slate-600">Healthcare Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  data-testid={item.testId}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState({ clients: 0, alerts: 0, followups: 0, healthyClients: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const axios = (await import('axios')).default;
      const [clientsRes, alertsRes, followupsRes] = await Promise.all([
        axios.get(`${API}/clients`),
        axios.get(`${API}/alerts?status=open`),
        axios.get(`${API}/followups?status=pending`)
      ]);
      const healthyCount = clientsRes.data.filter(c => c.health_score >= 80).length;
      setStats({
        clients: clientsRes.data.length,
        alerts: alertsRes.data.length,
        followups: followupsRes.data.length,
        healthyClients: healthyCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const StatCard = ({ icon: Icon, label, value, subtext, color, onClick, testId }) => {
    const { Card, CardHeader, CardTitle, CardContent } = require('./components/ui/card');
    return (
      <Card 
        className={`bg-white border-slate-200 hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        data-testid={testId}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${color || 'text-slate-900'}`}>{value}</div>
          {subtext && <p className="text-sm text-slate-600 mt-1">{subtext}</p>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-600 mt-2">Welcome to your CS operations center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={stats.clients}
          subtext={`${stats.healthyClients} healthy`}
          color="text-slate-900"
          onClick={() => navigate('/clients')}
          testId="stat-total-clients"
        />
        <StatCard
          icon={AlertCircle}
          label="Active Alerts"
          value={stats.alerts}
          subtext="Needs attention"
          color="text-amber-600"
          onClick={() => navigate('/alerts')}
          testId="stat-active-alerts"
        />
        <StatCard
          icon={ListTodo}
          label="Pending Follow-ups"
          value={stats.followups}
          subtext="Action items"
          color="text-blue-600"
          onClick={() => navigate('/followups')}
          testId="stat-pending-followups"
        />
        <StatCard
          icon={Activity}
          label="Health Score Avg"
          value="87%"
          subtext="Above target"
          color="text-emerald-700"
          testId="stat-health-avg"
        />
      </div>
    </div>
  );
};

// Placeholder Pages
const PlaceholderPage = ({ title }) => (
  <div className="p-8">
    <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
    <p className="text-slate-600 mt-2">This section will be implemented next</p>
  </div>
);

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="ml-64 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/client/:clientId" element={<ClientDetailPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/followups" element={<FollowUpsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/communications" element={<CommunicationsPage />} />
            <Route path="/scheduling" element={<SchedulingPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
