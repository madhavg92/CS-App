import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Building2, User, Calendar, Phone, Mail, AlertTriangle,
  TrendingUp, TrendingDown, Users, MessageSquare, FileText, Bell,
  CheckCircle2, Clock, BarChart3, Plus, Edit2, Network
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '', title: '', email: '', phone: '', role_type: 'operations'
  });

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const [clientRes, contactsRes, perfRes, alertsRes, commsRes, followupsRes] = await Promise.all([
        axios.get(`${API}/clients/${clientId}`),
        axios.get(`${API}/contacts?client_id=${clientId}`),
        axios.get(`${API}/performance?client_id=${clientId}`),
        axios.get(`${API}/alerts?client_id=${clientId}`),
        axios.get(`${API}/communications?client_id=${clientId}`),
        axios.get(`${API}/followups?client_id=${clientId}`)
      ]);
      
      setClient(clientRes.data);
      setContacts(contactsRes.data);
      setPerformance(perfRes.data);
      setAlerts(alertsRes.data);
      setCommunications(commsRes.data);
      setFollowups(followupsRes.data);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      await axios.post(`${API}/contacts`, {
        client_id: clientId,
        ...newContact
      });
      setShowAddContact(false);
      setNewContact({ name: '', title: '', email: '', phone: '', role_type: 'operations' });
      fetchClientData();
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-slate-100 text-slate-600'
    };
    return colors[severity] || colors.low;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRoleTypeColor = (role) => {
    const colors = {
      'decision-maker': 'bg-purple-100 text-purple-700',
      'influencer': 'bg-blue-100 text-blue-700',
      'operations': 'bg-green-100 text-green-700',
      'billing': 'bg-amber-100 text-amber-700'
    };
    return colors[role] || 'bg-slate-100 text-slate-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4F72]"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Client not found</p>
        <Button onClick={() => navigate('/clients')} className="mt-4">Back to Clients</Button>
      </div>
    );
  }

  const latestPerf = performance[0];
  const openAlerts = alerts.filter(a => a.status === 'active' || a.status === 'acknowledged');
  const openFollowups = followups.filter(f => f.status === 'open');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <Badge className={
              client.status === 'active' ? 'bg-green-100 text-green-700' :
              client.status === 'at-risk' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }>
              {client.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Contract: {formatDate(client.contract_start)} - {formatDate(client.contract_end)}
            </span>
            {client.contracted_services?.length > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {client.contracted_services.join(', ')}
              </span>
            )}
          </div>
        </div>
        
        {/* Health Score */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getHealthColor(client.health_score)}`}>
            {client.health_score}
          </div>
          <span className="text-sm text-slate-500">Health Score</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#85C1E9]/20 rounded-lg">
                <Users className="h-5 w-5 text-[#1B4F72]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{contacts.length}</p>
                <p className="text-xs text-slate-500">Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{openAlerts.length}</p>
                <p className="text-xs text-slate-500">Open Alerts</p>
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
                <p className="text-2xl font-bold text-amber-600">{openFollowups.length}</p>
                <p className="text-xs text-slate-500">Follow-ups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {latestPerf?.recovery_rate?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-slate-500">Recovery Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">Org Chart</TabsTrigger>
          <TabsTrigger value="communications" data-testid="tab-communications">Communications</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts</TabsTrigger>
          <TabsTrigger value="followups" data-testid="tab-followups">Follow-Ups</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SLA Targets */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">SLA Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Recovery Rate Target</span>
                    <span className="font-semibold">{client.sla_targets?.recovery_rate || 85}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Max Error Rate</span>
                    <span className="font-semibold">{client.sla_targets?.error_rate || 2}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Current Recovery Rate</span>
                    <span className={`font-semibold ${
                      (latestPerf?.recovery_rate || 0) >= (client.sla_targets?.recovery_rate || 85)
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {latestPerf?.recovery_rate?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {communications.slice(0, 3).map((comm) => (
                    <div key={comm.id} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                      <MessageSquare className="h-4 w-4 text-slate-400 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{comm.subject}</p>
                        <p className="text-xs text-slate-500">{formatDate(comm.created_at)} - {comm.channel}</p>
                      </div>
                    </div>
                  ))}
                  {communications.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contacts/Org Chart Tab */}
        <TabsContent value="contacts" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Client Contacts</CardTitle>
                  <CardDescription>Organization structure and key stakeholders</CardDescription>
                </div>
                {user?.role !== 'ops' && (
                  <Button 
                    className="bg-[#1B4F72] hover:bg-[#154360]"
                    onClick={() => setShowAddContact(true)}
                    data-testid="add-contact-btn"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Org Chart Visual */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Organization Hierarchy
                </h4>
                <div className="flex flex-col items-center gap-4">
                  {/* Decision Makers */}
                  <div className="flex flex-wrap justify-center gap-3">
                    {contacts.filter(c => c.role_type === 'decision-maker').map((contact) => (
                      <div key={contact.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center min-w-32">
                        <p className="font-medium text-purple-900">{contact.name}</p>
                        <p className="text-xs text-purple-600">{contact.title}</p>
                        <Badge className="mt-1 bg-purple-100 text-purple-700 text-xs">Decision Maker</Badge>
                      </div>
                    ))}
                  </div>
                  
                  {/* Connector */}
                  {contacts.filter(c => c.role_type === 'decision-maker').length > 0 && 
                   contacts.filter(c => c.role_type !== 'decision-maker').length > 0 && (
                    <div className="w-0.5 h-6 bg-slate-300"></div>
                  )}
                  
                  {/* Influencers */}
                  <div className="flex flex-wrap justify-center gap-3">
                    {contacts.filter(c => c.role_type === 'influencer').map((contact) => (
                      <div key={contact.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center min-w-32">
                        <p className="font-medium text-blue-900">{contact.name}</p>
                        <p className="text-xs text-blue-600">{contact.title}</p>
                        <Badge className="mt-1 bg-blue-100 text-blue-700 text-xs">Influencer</Badge>
                      </div>
                    ))}
                  </div>
                  
                  {/* Operations & Billing */}
                  <div className="flex flex-wrap justify-center gap-3">
                    {contacts.filter(c => c.role_type === 'operations' || c.role_type === 'billing').map((contact) => (
                      <div key={contact.id} className={`p-3 border rounded-lg text-center min-w-32 ${
                        contact.role_type === 'operations' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <p className={`font-medium ${contact.role_type === 'operations' ? 'text-green-900' : 'text-amber-900'}`}>
                          {contact.name}
                        </p>
                        <p className={`text-xs ${contact.role_type === 'operations' ? 'text-green-600' : 'text-amber-600'}`}>
                          {contact.title}
                        </p>
                        <Badge className={`mt-1 text-xs ${getRoleTypeColor(contact.role_type)}`}>
                          {contact.role_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                {contacts.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No contacts added yet</p>
                )}
              </div>

              {/* Contact List */}
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900">{contact.name}</h4>
                          <Badge className={getRoleTypeColor(contact.role_type)}>{contact.role_type}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{contact.title}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        {contact.last_email_date && <p>Last email: {formatDate(contact.last_email_date)}</p>}
                        {contact.last_call_date && <p>Last call: {formatDate(contact.last_call_date)}</p>}
                        {contact.last_meeting_date && <p>Last meeting: {formatDate(contact.last_meeting_date)}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {communications.map((comm) => (
                  <div key={comm.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{comm.channel}</Badge>
                        <Badge variant={comm.comm_type === 'draft' ? 'secondary' : 'default'}>
                          {comm.comm_type}
                        </Badge>
                        {comm.ai_generated && <Badge className="bg-[#85C1E9] text-[#1B4F72]">AI Generated</Badge>}
                      </div>
                      <span className="text-xs text-slate-500">{formatDate(comm.created_at)}</span>
                    </div>
                    <h4 className="font-medium text-slate-900">{comm.subject}</h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{comm.body}</p>
                  </div>
                ))}
                {communications.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No communications recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.map((perf) => (
                  <div key={perf.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-700">
                        {formatDate(perf.period_start)} - {formatDate(perf.period_end)}
                      </span>
                      <Badge className={
                        perf.recovery_rate >= (client.sla_targets?.recovery_rate || 85)
                          ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }>
                        {perf.recovery_rate >= (client.sla_targets?.recovery_rate || 85) ? 'On Target' : 'Below Target'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Denials Worked</p>
                        <p className="font-semibold text-slate-900">{perf.denials_worked?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Dollars Recovered</p>
                        <p className="font-semibold text-green-600">${perf.dollars_recovered?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Recovery Rate</p>
                        <p className={`font-semibold ${
                          perf.recovery_rate >= (client.sla_targets?.recovery_rate || 85)
                            ? 'text-green-600' : 'text-red-600'
                        }`}>{perf.recovery_rate?.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500">SLA Compliance</p>
                        <p className="font-semibold text-slate-900">{perf.sla_compliance_pct?.toFixed(1)}%</p>
                      </div>
                    </div>
                    {perf.top_denial_codes && Object.keys(perf.top_denial_codes).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-2">Top Denial Codes</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(perf.top_denial_codes).slice(0, 5).map(([code, count]) => (
                            <Badge key={code} variant="outline">{code}: {count}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {performance.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No performance data recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        <Badge variant="outline">{alert.alert_type.replace(/_/g, ' ')}</Badge>
                        <Badge variant={alert.status === 'resolved' ? 'secondary' : 'default'}>
                          {alert.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">{formatDate(alert.created_at)}</span>
                    </div>
                    <h4 className="font-medium text-slate-900">{alert.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No alerts for this client</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups Tab */}
        <TabsContent value="followups" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Follow-Up Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {followups.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={
                            item.category === 'call_required' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }>
                            {item.category === 'call_required' ? 'Call Required' : 'Email OK'}
                          </Badge>
                          <Badge variant={item.status === 'completed' ? 'secondary' : 'default'}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="font-medium text-slate-900">{item.description}</p>
                        <p className="text-sm text-slate-600 mt-1">{item.suggested_action}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{item.days_open}d open</p>
                        <p className="text-xs text-slate-500">Score: {item.priority_score?.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {followups.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No follow-up items</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                placeholder="Contact name"
              />
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newContact.title}
                onChange={(e) => setNewContact({...newContact, title: e.target.value})}
                placeholder="Job title"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                placeholder="email@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Role Type *</Label>
              <Select value={newContact.role_type} onValueChange={(v) => setNewContact({...newContact, role_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="decision-maker">Decision Maker</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContact(false)}>Cancel</Button>
            <Button 
              className="bg-[#1B4F72] hover:bg-[#154360]"
              onClick={handleAddContact}
              disabled={!newContact.name || !newContact.title || !newContact.email}
            >
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailPage;
