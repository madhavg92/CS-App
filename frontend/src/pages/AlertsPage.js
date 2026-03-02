import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('open');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts${filter ? `?status=${filter}` : ''}`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleUpdateStatus = async (alertId, status) => {
    try {
      await axios.patch(`${API}/alerts/${alertId}?status=${status}`);
      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'high') return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (severity === 'medium') return <AlertCircle className="h-5 w-5 text-amber-600" />;
    return <AlertCircle className="h-5 w-5 text-blue-600" />;
  };

  const getSeverityColor = (severity) => {
    if (severity === 'high') return 'bg-red-50 border-red-200';
    if (severity === 'medium') return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      'engagement_gap': 'Engagement Gap',
      'new_stakeholder': 'New Stakeholder',
      'frustration': 'Client Frustration',
      'scope_creep': 'Scope Creep',
      'innovation_update': 'Innovation Update',
      'policy_alert': 'Policy Alert'
    };
    return labels[type] || type;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Proactive Alerts</h2>
        <p className="text-slate-600 mt-2">AI-powered alerts for risk detection and engagement management</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="open" data-testid="open-alerts-tab">Open ({alerts.filter(a => a.status === 'open').length})</TabsTrigger>
          <TabsTrigger value="acknowledged" data-testid="acknowledged-alerts-tab">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved" data-testid="resolved-alerts-tab">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-slate-600" data-testid="no-alerts-message">No {filter} alerts. Everything looks good!</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={`bg-white border ${getSeverityColor(alert.severity)}`} data-testid={`alert-card-${alert.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 
                          className="font-semibold text-slate-900 hover:text-emerald-600 cursor-pointer" 
                          onClick={() => navigate(`/client/${alert.client_id}`)}
                          data-testid={`alert-client-${alert.id}`}
                        >
                          {alert.client_name}
                        </h3>
                        <Badge variant="outline" className="text-slate-700">{getAlertTypeLabel(alert.alert_type)}</Badge>
                        <Badge className={
                          alert.severity === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                          alert.severity === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-blue-100 text-blue-700 border-blue-200'
                        }>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="h-4 w-4" />
                        {new Date(alert.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-slate-700 mb-4">{alert.message}</p>
                    {alert.status === 'open' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateStatus(alert.id, 'acknowledged')} 
                          data-testid={`acknowledge-alert-${alert.id}`}
                        >
                          Acknowledge
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700" 
                          onClick={() => handleUpdateStatus(alert.id, 'resolved')} 
                          data-testid={`resolve-alert-${alert.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;