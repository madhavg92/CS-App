import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  AlertTriangle, Filter, Check, Clock, ArrowUpRight, Bell,
  ChevronDown, X, RefreshCw, Sparkles, FileText, AlertOctagon, UserPlus, TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlertsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'active',
    severity: 'all',
    type: ''
  });
  
  // Action dialogs
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [snoozeDays, setSnoozeDays] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  // Alert type configuration
  const alertTypeConfig = {
    engagement_gap: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    renewal: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
    performance_decline: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    followup_overdue: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    innovation_update_due: { icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
    policy_update: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    frustration: { icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50' },
    scope_creep: { icon: ArrowUpRight, color: 'text-amber-600', bg: 'bg-amber-50' },
    new_stakeholder: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, filters]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    if (filters.severity !== 'all') {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(a => a.alert_type === filters.type);
    }
    
    // Sort by severity priority
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    setFilteredAlerts(filtered);
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.patch(`${API}/alerts/${alertId}`, { status: 'acknowledged' });
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    setActionLoading(true);
    try {
      await axios.patch(`${API}/alerts/${selectedAlert.id}`, { 
        status: 'resolved',
        resolution_notes: resolutionNotes 
      });
      setShowResolveDialog(false);
      setSelectedAlert(null);
      setResolutionNotes('');
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSnooze = async () => {
    if (!selectedAlert) return;
    setActionLoading(true);
    try {
      await axios.post(`${API}/alerts/${selectedAlert.id}/snooze?days=${snoozeDays}`);
      setShowSnoozeDialog(false);
      setSelectedAlert(null);
      setSnoozeDays(1);
      fetchAlerts();
    } catch (error) {
      console.error('Error snoozing alert:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const runAlertChecks = async () => {
    setLoading(true);
    try {
      await Promise.all([
        axios.post(`${API}/alerts/check-engagement`),
        axios.post(`${API}/alerts/check-renewals`),
        axios.post(`${API}/alerts/check-overdue-followups`)
      ]);
      fetchAlerts();
    } catch (error) {
      console.error('Error running alert checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyles = (severity) => {
    const styles = {
      critical: {
        badge: 'bg-red-500 text-white animate-pulse',
        border: 'border-l-4 border-l-red-500',
        icon: 'text-red-500'
      },
      high: {
        badge: 'bg-red-100 text-red-700 border border-red-200',
        border: 'border-l-4 border-l-red-400',
        icon: 'text-red-500'
      },
      medium: {
        badge: 'bg-amber-100 text-amber-700 border border-amber-200',
        border: 'border-l-4 border-l-amber-400',
        icon: 'text-amber-500'
      },
      low: {
        badge: 'bg-slate-100 text-slate-600 border border-slate-200',
        border: 'border-l-4 border-l-slate-300',
        icon: 'text-slate-400'
      }
    };
    return styles[severity] || styles.low;
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-red-100 text-red-700',
      acknowledged: 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
      snoozed: 'bg-blue-100 text-blue-700'
    };
    return styles[status] || styles.active;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const alertTypes = [...new Set(alerts.map(a => a.alert_type))];

  const stats = {
    critical: alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length,
    high: alerts.filter(a => a.severity === 'high' && a.status !== 'resolved').length,
    active: alerts.filter(a => a.status === 'active').length,
    resolved: alerts.filter(a => a.status === 'resolved').length
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
          <p className="text-slate-600 mt-1">Monitor and manage client alerts</p>
        </div>
        {user?.role === 'cs_lead' && (
          <Button 
            className="bg-[#1B4F72] hover:bg-[#154360]"
            onClick={runAlertChecks}
            data-testid="run-checks-btn"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Alert Checks
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                <p className="text-xs text-slate-500">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Bell className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.high}</p>
                <p className="text-xs text-slate-500">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.active}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                <p className="text-xs text-slate-500">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
          <SelectTrigger className="w-40 bg-white" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="snoozed">Snoozed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.severity} onValueChange={(v) => setFilters({...filters, severity: v})}>
          <SelectTrigger className="w-40 bg-white" data-testid="filter-severity">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
          <SelectTrigger className="w-48 bg-white" data-testid="filter-type">
            <SelectValue placeholder="Alert Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {alertTypes.map((type) => (
              <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No alerts match your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            const typeConfig = alertTypeConfig[alert.alert_type] || { icon: AlertTriangle, color: 'text-slate-600', bg: 'bg-slate-50' };
            const TypeIcon = typeConfig.icon;
            return (
              <Card 
                key={alert.id}
                className={`bg-white ${styles.border} hover:shadow-md transition-shadow`}
                data-testid={`alert-${alert.id}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <TypeIcon className={`h-5 w-5 mt-1 flex-shrink-0 ${typeConfig.color}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={styles.badge}>{alert.severity}</Badge>
                        <Badge variant="outline" className={`${typeConfig.bg} ${typeConfig.color} border-0`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {alert.alert_type.replace(/_/g, ' ')}
                        </Badge>
                        <Badge className={getStatusBadge(alert.status)}>{alert.status}</Badge>
                      </div>
                      
                      <h3 className="font-medium text-slate-900">{alert.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                        <button 
                          className="flex items-center gap-1 hover:text-[#1B4F72]"
                          onClick={() => navigate(`/clients/${alert.client_id}`)}
                        >
                          {alert.client_name}
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                        <span>{formatDate(alert.created_at)}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {alert.status !== 'resolved' && (
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                            data-testid={`ack-${alert.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowSnoozeDialog(true);
                          }}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Snooze
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowResolveDialog(true);
                          }}
                        >
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Resolution Notes</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how this alert was resolved..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleResolve}
              disabled={actionLoading}
            >
              {actionLoading ? 'Resolving...' : 'Mark as Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snooze Dialog */}
      <Dialog open={showSnoozeDialog} onOpenChange={setShowSnoozeDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Snooze Alert</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Snooze Duration</Label>
            <Select value={String(snoozeDays)} onValueChange={(v) => setSnoozeDays(parseInt(v))}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="3">3 Days</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSnoozeDialog(false)}>Cancel</Button>
            <Button 
              className="bg-[#1B4F72] hover:bg-[#154360]"
              onClick={handleSnooze}
              disabled={actionLoading}
            >
              {actionLoading ? 'Snoozing...' : `Snooze for ${snoozeDays} day(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlertsPage;
