import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Users, BarChart3, AlertCircle, ListTodo, Mail, Plus, Activity, Calendar, Building2, CheckCircle, AlertTriangle, FileText, Send, TrendingUp, Home, Settings } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Avatar, AvatarFallback } from './components/ui/avatar';
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
    { icon: AlertCircle, label: 'Alerts', path: '/alerts', testId: 'nav-alerts' },
    { icon: ListTodo, label: 'Follow-ups', path: '/followups', testId: 'nav-followups' },
    { icon: BarChart3, label: 'Reports', path: '/reports', testId: 'nav-reports' },
    { icon: Mail, label: 'Communications', path: '/communications', testId: 'nav-communications' },
    { icon: Calendar, label: 'Scheduling', path: '/scheduling', testId: 'nav-scheduling' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Anka CS</h1>
            <p className="text-xs text-slate-600">Healthcare Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  data-testid={item.testId}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-600 mt-2">Welcome to your CS operations center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/clients')} data-testid="stat-total-clients">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.clients}</div>
            <p className="text-sm text-emerald-600 mt-1">{stats.healthyClients} healthy</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/alerts')} data-testid="stat-active-alerts">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.alerts}</div>
            <p className="text-sm text-slate-600 mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/followups')} data-testid="stat-pending-followups">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Pending Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.followups}</div>
            <p className="text-sm text-slate-600 mt-1">Action items</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Health Score Avg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">87%</div>
            <p className="text-sm text-emerald-600 mt-1">Above target</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/clients')} data-testid="quick-view-clients">
              <Users className="h-4 w-4 mr-2" />
              View All Clients
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/alerts')} data-testid="quick-review-alerts">
              <AlertCircle className="h-4 w-4 mr-2" />
              Review Alerts
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/communications')} data-testid="quick-draft-email">
              <Mail className="h-4 w-4 mr-2" />
              Draft Email
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-600 mt-2"></div>
                <div>
                  <p className="text-sm text-slate-900 font-medium">New client added</p>
                  <p className="text-xs text-slate-600">Springfield General Hospital</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-600 mt-2"></div>
                <div>
                  <p className="text-sm text-slate-900 font-medium">Alert triggered</p>
                  <p className="text-xs text-slate-600">Engagement gap detected</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-2"></div>
                <div>
                  <p className="text-sm text-slate-900 font-medium">Follow-up completed</p>
                  <p className="text-xs text-slate-600">QBR scheduled with client</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="ml-64 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<div className="p-8"><h2 className="text-3xl font-bold">Clients - Coming in next iteration</h2></div>} />
            <Route path="/alerts" element={<div className="p-8"><h2 className="text-3xl font-bold">Alerts - Coming in next iteration</h2></div>} />
            <Route path="/followups" element={<div className="p-8"><h2 className="text-3xl font-bold">Follow-ups - Coming in next iteration</h2></div>} />
            <Route path="/reports" element={<div className="p-8"><h2 className="text-3xl font-bold">Reports - Coming in next iteration</h2></div>} />
            <Route path="/communications" element={<div className="p-8"><h2 className="text-3xl font-bold">Communications - Coming in next iteration</h2></div>} />
            <Route path="/scheduling" element={<div className="p-8"><h2 className="text-3xl font-bold">Scheduling - Coming in next iteration</h2></div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
