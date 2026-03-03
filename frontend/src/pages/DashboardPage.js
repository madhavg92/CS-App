import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, AlertTriangle, Phone, TrendingUp, TrendingDown,
  Clock, ChevronRight, AlertCircle, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    total_clients: 0,
    at_risk_clients: 0,
    avg_recovery_rate: 0,
    open_followups: 0,
    active_alerts: 0
  });
  const [todayAlerts, setTodayAlerts] = useState([]);
  const [callList, setCallList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, alertsRes, callListRes] = await Promise.all([
        axios.get(`${API}/dashboard/metrics`),
        axios.get(`${API}/alerts/today`),
        axios.get(`${API}/followups/call-list`)
      ]);
      
      setMetrics(metricsRes.data);
      setTodayAlerts(alertsRes.data.slice(0, 5));
      setCallList(callListRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500 text-white animate-pulse',
      high: 'bg-red-100 text-red-700 border border-red-200',
      medium: 'bg-amber-100 text-amber-700 border border-amber-200',
      low: 'bg-slate-100 text-slate-600 border border-slate-200'
    };
    return colors[severity] || colors.low;
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4F72]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, {user?.name}. Here's your CS overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card 
          className="bg-white border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/clients')}
          data-testid="metric-total-clients"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Clients</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{metrics.total_clients}</p>
              </div>
              <div className="p-3 bg-[#85C1E9]/20 rounded-lg">
                <Users className="h-6 w-6 text-[#1B4F72]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/clients?status=at-risk')}
          data-testid="metric-at-risk"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">At-Risk</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{metrics.at_risk_clients}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200" data-testid="metric-recovery-rate">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg Recovery Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{metrics.avg_recovery_rate}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/followups')}
          data-testid="metric-followups"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Open Follow-ups</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{metrics.open_followups}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/alerts')}
          data-testid="metric-alerts"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Alerts</p>
                <p className="text-3xl font-bold text-[#1B4F72] mt-1">{metrics.active_alerts}</p>
              </div>
              <div className="p-3 bg-[#85C1E9]/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-[#1B4F72]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Alerts */}
        <Card className="bg-white border-slate-200" data-testid="todays-alerts">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Today's Alerts</CardTitle>
                <CardDescription>Sorted by severity</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/alerts')}
                className="text-[#1B4F72]"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No new alerts today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => navigate('/alerts')}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'critical' || alert.severity === 'high' ? 'text-red-500' :
                        alert.severity === 'medium' ? 'text-amber-500' : 'text-slate-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-slate-500">{alert.client_name}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium truncate">{alert.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CS Call List */}
        <Card className="bg-white border-slate-200" data-testid="call-list">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Today's Call List</CardTitle>
                <CardDescription>Top priority clients to contact</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/followups')}
                className="text-[#1B4F72]"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {callList.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Phone className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No calls scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {callList.slice(0, 5).map((item, index) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/clients/${item.client_id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                        index === 0 ? 'bg-red-500' : index === 1 ? 'bg-amber-500' : 'bg-[#1B4F72]'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.client_name}</p>
                        <p className="text-xs text-slate-500 truncate">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{item.days_open}d open</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          Score: {item.priority_score?.toFixed(1) || 'N/A'}
                        </Badge>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {user?.role !== 'ops' && (
        <Card className="bg-gradient-to-r from-[#1B4F72] to-[#154360] text-white border-0">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <p className="text-[#85C1E9] text-sm">Common tasks at your fingertips</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  onClick={() => navigate('/alerts')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Review Alerts
                </Button>
                <Button 
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  onClick={() => navigate('/communications?type=draft')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Draft Queue
                </Button>
                <Button 
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  onClick={() => navigate('/reports')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
