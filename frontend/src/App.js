import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Users, BarChart3, AlertCircle, ListTodo, Mail, Plus, TrendingUp, TrendingDown, Activity, Calendar, Phone, Building2, User, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [clients, setClients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, alertsRes, followupsRes] = await Promise.all([
        axios.get(`${API}/clients`),
        axios.get(`${API}/alerts?status=open`),
        axios.get(`${API}/followups?status=pending`)
      ]);
      setClients(clientsRes.data);
      setAlerts(alertsRes.data);
      setFollowups(followupsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await axios.post(`${API}/clients`, {
        name: formData.get('name'),
        relationship_owner: formData.get('owner'),
        contract_value: parseFloat(formData.get('value')),
        renewal_date: formData.get('renewal')
      });
      setShowAddClient(false);
      fetchData();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status) => {
    const styles = {
      healthy: 'bg-emerald-100 text-emerald-700',
      'at-risk': 'bg-amber-100 text-amber-700',
      active: 'bg-blue-100 text-blue-700'
    };
    return styles[status] || styles.active;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Anka CS Platform</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')} data-testid="nav-dashboard-btn">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate('/alerts')} data-testid="nav-alerts-btn">
                <AlertCircle className="h-4 w-4 mr-2" />
                Alerts
                {alerts.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white" data-testid="alerts-count-badge">{alerts.length}</Badge>
                )}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/followups')} data-testid="nav-followups-btn">
                <ListTodo className="h-4 w-4 mr-2" />
                Follow-ups
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Client Overview</h2>
            <p className="text-slate-600 mt-2">Manage your customer success operations</p>
          </div>
          <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="add-client-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-client-dialog">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>Create a new client profile</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddClient}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Client Name</Label>
                    <Input id="name" name="name" required data-testid="client-name-input" />
                  </div>
                  <div>
                    <Label htmlFor="owner">Relationship Owner</Label>
                    <Input id="owner" name="owner" required data-testid="client-owner-input" />
                  </div>
                  <div>
                    <Label htmlFor="value">Contract Value ($)</Label>
                    <Input id="value" name="value" type="number" step="0.01" required data-testid="client-value-input" />
                  </div>
                  <div>
                    <Label htmlFor="renewal">Renewal Date</Label>
                    <Input id="renewal" name="renewal" type="date" required data-testid="client-renewal-input" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="submit-client-btn">Create Client</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border border-slate-200 shadow-sm" data-testid="total-clients-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{clients.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 shadow-sm" data-testid="active-alerts-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{alerts.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 shadow-sm" data-testid="pending-followups-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{followups.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-white border border-slate-200 shadow-sm" data-testid="clients-list-card">
            <CardHeader>
              <CardTitle>Clients</CardTitle>
              <CardDescription>All active client accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.length === 0 ? (
                  <p className="text-slate-500 text-center py-8" data-testid="no-clients-message">No clients yet. Add your first client to get started.</p>
                ) : (
                  clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/client/${client.id}`)}
                      data-testid={`client-card-${client.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-slate-900" data-testid={`client-name-${client.id}`}>{client.name}</h3>
                          <p className="text-sm text-slate-600">{client.relationship_owner}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-slate-600">Health Score</div>
                          <div className={`text-2xl font-bold ${getHealthColor(client.health_score)}`} data-testid={`health-score-${client.id}`}>
                            {client.health_score}
                          </div>
                        </div>
                        <Badge className={getStatusBadge(client.status)} data-testid={`status-badge-${client.id}`}>
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const ClientDetail = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' });
  const [draftLoading, setDraftLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const [clientRes, commsRes, metricsRes] = await Promise.all([
        axios.get(`${API}/clients/${clientId}`),
        axios.get(`${API}/communications/${clientId}`),
        axios.get(`${API}/performance?client_id=${clientId}`)
      ]);
      setClient(clientRes.data);
      setCommunications(commsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await axios.post(`${API}/clients/${clientId}/contacts`, {
        name: formData.get('name'),
        title: formData.get('title'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: formData.get('role')
      });
      setShowAddContact(false);
      fetchClientData();
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const handleDraftEmail = async (emailType, context) => {
    setDraftLoading(true);
    try {
      const response = await axios.post(`${API}/draft-email`, {
        client_id: clientId,
        client_name: client.name,
        context: context,
        email_type: emailType
      });
      setEmailDraft(response.data);
      setShowEmailDraft(true);
    } catch (error) {
      console.error('Error drafting email:', error);
    } finally {
      setDraftLoading(false);
    }
  };

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading client details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-to-dashboard-btn">
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                  {client.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900" data-testid="client-detail-name">{client.name}</h1>
                <p className="text-slate-600 mt-1">{client.relationship_owner}</p>
              </div>
            </div>
            <Badge className={`px-4 py-2 text-base ${client.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`} data-testid="client-detail-status">
              {client.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600" data-testid="client-detail-health-score">{client.health_score}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Contract Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900" data-testid="client-detail-contract-value">${client.contract_value.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Renewal Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-slate-900" data-testid="client-detail-renewal-date">{new Date(client.renewal_date).toLocaleDateString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Last Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-slate-900">{new Date(client.last_engagement).toLocaleDateString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contacts" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="contacts" data-testid="contacts-tab">Contacts</TabsTrigger>
            <TabsTrigger value="communications" data-testid="communications-tab">Communications</TabsTrigger>
            <TabsTrigger value="metrics" data-testid="metrics-tab">Performance</TabsTrigger>
            <TabsTrigger value="actions" data-testid="actions-tab">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" data-testid="contacts-content">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contacts</CardTitle>
                  <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="add-contact-btn">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Contact</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddContact}>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" required data-testid="contact-name-input" />
                          </div>
                          <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" required data-testid="contact-title-input" />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required data-testid="contact-email-input" />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" data-testid="contact-phone-input" />
                          </div>
                          <div>
                            <Label htmlFor="role">Role</Label>
                            <Select name="role" required>
                              <SelectTrigger data-testid="contact-role-select">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="decision-maker">Decision Maker</SelectItem>
                                <SelectItem value="influencer">Influencer</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="submit-contact-btn">Add Contact</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client.contacts.length === 0 ? (
                    <p className="text-slate-500 text-center py-8" data-testid="no-contacts-message">No contacts yet. Add contacts to build your relationship map.</p>
                  ) : (
                    client.contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`contact-card-${contact.id}`}>
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {contact.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{contact.name}</h4>
                          <p className="text-sm text-slate-600">{contact.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span>{contact.email}</span>
                            {contact.phone && <span>{contact.phone}</span>}
                          </div>
                        </div>
                        <Badge variant="outline">{contact.role}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communications" data-testid="communications-content">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Communication History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communications.length === 0 ? (
                    <p className="text-slate-500 text-center py-8" data-testid="no-communications-message">No communications recorded yet.</p>
                  ) : (
                    communications.map((comm) => (
                      <div key={comm.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`communication-card-${comm.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{comm.comm_type}</Badge>
                            <Badge className={comm.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' : comm.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}>
                              {comm.sentiment}
                            </Badge>
                          </div>
                          <span className="text-sm text-slate-500">{new Date(comm.created_at).toLocaleDateString()}</span>
                        </div>
                        {comm.subject && <h4 className="font-semibold text-slate-900 mb-2">{comm.subject}</h4>}
                        <p className="text-slate-600 text-sm">{comm.summary}</p>
                        {comm.action_items.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">Action Items:</p>
                            <ul className="list-disc list-inside text-sm text-slate-600">
                              {comm.action_items.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" data-testid="metrics-content">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.length === 0 ? (
                    <p className="text-slate-500 text-center py-8" data-testid="no-metrics-message">No performance metrics recorded yet.</p>
                  ) : (
                    metrics.map((metric) => (
                      <div key={metric.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`metric-card-${metric.id}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-900">Week Ending: {new Date(metric.week_ending).toLocaleDateString()}</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-slate-600">Denials Worked</div>
                            <div className="text-2xl font-bold text-slate-900">{metric.denials_worked}</div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600">Recovery Rate</div>
                            <div className="text-2xl font-bold text-emerald-600">{metric.recovery_rate}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600">Dollars Recovered</div>
                            <div className="text-2xl font-bold text-emerald-600">${metric.dollars_recovered.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600">SLA Compliance</div>
                            <div className="text-2xl font-bold text-blue-600">{metric.sla_compliance}%</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" data-testid="actions-content">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>AI-powered actions for this client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-start gap-2 hover:border-emerald-500 hover:bg-emerald-50"
                    onClick={() => handleDraftEmail('follow_up', 'General follow-up on recent activities')}
                    disabled={draftLoading}
                    data-testid="draft-followup-email-btn"
                  >
                    <Mail className="h-6 w-6 text-emerald-600" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-900">Draft Follow-up Email</div>
                      <div className="text-sm text-slate-600">AI-generated check-in email</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-start gap-2 hover:border-blue-500 hover:bg-blue-50"
                    onClick={() => handleDraftEmail('innovation_update', 'Share latest Anka product innovations')}
                    disabled={draftLoading}
                    data-testid="draft-innovation-email-btn"
                  >
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-900">Draft Innovation Update</div>
                      <div className="text-sm text-slate-600">Share product updates</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showEmailDraft} onOpenChange={setShowEmailDraft}>
        <DialogContent className="max-w-2xl" data-testid="email-draft-dialog">
          <DialogHeader>
            <DialogTitle>AI-Generated Email Draft</DialogTitle>
            <DialogDescription>Review and edit before sending</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input value={emailDraft.subject} onChange={(e) => setEmailDraft({...emailDraft, subject: e.target.value})} data-testid="email-subject-input" />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea value={emailDraft.body} onChange={(e) => setEmailDraft({...emailDraft, body: e.target.value})} rows={12} className="font-sans" data-testid="email-body-textarea" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDraft(false)} data-testid="close-email-dialog-btn">Close</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="copy-email-btn">Copy to Clipboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

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
    if (severity === 'high') return 'bg-red-100 text-red-700 border-red-200';
    if (severity === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-to-dashboard-from-alerts-btn">
            ← Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Alerts</h1>
          <p className="text-slate-600 mt-2">Proactive notifications for your client accounts</p>
        </div>

        <div className="mb-6">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="open" data-testid="open-alerts-tab">Open</TabsTrigger>
              <TabsTrigger value="acknowledged" data-testid="acknowledged-alerts-tab">Acknowledged</TabsTrigger>
              <TabsTrigger value="resolved" data-testid="resolved-alerts-tab">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="py-12">
                <p className="text-slate-500 text-center" data-testid="no-alerts-message">No {filter} alerts.</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className={`bg-white border shadow-sm ${getSeverityColor(alert.severity)}`} data-testid={`alert-card-${alert.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-slate-900" data-testid={`alert-client-${alert.id}`}>{alert.client_name}</h3>
                          <Badge variant="outline">{alert.alert_type.replace('_', ' ')}</Badge>
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        </div>
                        <span className="text-sm text-slate-500">{new Date(alert.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 mb-4">{alert.message}</p>
                      {alert.status === 'open' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(alert.id, 'acknowledged')} data-testid={`acknowledge-alert-${alert.id}`}>
                            Acknowledge
                          </Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(alert.id, 'resolved')} data-testid={`resolve-alert-${alert.id}`}>
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
      </main>
    </div>
  );
};

const FollowUpsPage = () => {
  const [followups, setFollowups] = useState([]);
  const [filter, setFilter] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowups();
  }, [filter]);

  const fetchFollowups = async () => {
    try {
      const response = await axios.get(`${API}/followups${filter ? `?status=${filter}` : ''}`);
      setFollowups(response.data);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
    }
  };

  const handleUpdateStatus = async (followupId, status) => {
    try {
      await axios.patch(`${API}/followups/${followupId}?status=${status}`);
      fetchFollowups();
    } catch (error) {
      console.error('Error updating follow-up:', error);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-700';
    if (priority === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-to-dashboard-from-followups-btn">
            ← Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Follow-up Items</h1>
          <p className="text-slate-600 mt-2">Prioritized action items for your CS team</p>
        </div>

        <div className="mb-6">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="pending" data-testid="pending-followups-tab">Pending</TabsTrigger>
              <TabsTrigger value="completed" data-testid="completed-followups-tab">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4">
          {followups.length === 0 ? (
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="py-12">
                <p className="text-slate-500 text-center" data-testid="no-followups-message">No {filter} follow-ups.</p>
              </CardContent>
            </Card>
          ) : (
            followups.map((followup) => (
              <Card key={followup.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid={`followup-card-${followup.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900" data-testid={`followup-client-${followup.id}`}>{followup.client_name}</h3>
                        <Badge className={getPriorityColor(followup.priority)}>{followup.priority}</Badge>
                        <Badge variant="outline">{followup.action_type}</Badge>
                      </div>
                      <p className="text-slate-700 mb-3">{followup.description}</p>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mb-3">
                        <p className="text-sm text-slate-600"><strong>Suggested Action:</strong> {followup.suggested_action}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>Owner: {followup.owner}</span>
                        <span>•</span>
                        <span>Days Open: {followup.days_open}</span>
                      </div>
                    </div>
                    {followup.status === 'pending' && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(followup.id, 'completed')} data-testid={`complete-followup-${followup.id}`}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/client/:clientId" element={<ClientDetail />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/followups" element={<FollowUpsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
