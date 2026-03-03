import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Building2, User, Calendar, Phone, Mail, AlertTriangle,
  TrendingUp, TrendingDown, Users, MessageSquare, FileText, Bell,
  CheckCircle2, Clock, BarChart3, Plus, Edit2, Network, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../App';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#1B4F72', '#85C1E9', '#27AE60', '#F39C12', '#E74C3C', '#9B59B6'];

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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [downloadingReport, setDownloadingReport] = useState(false);
  
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
      const [clientRes, contactsRes, perfRes, alertsRes, commsRes, followupsRes, usersRes] = await Promise.all([
        axios.get(`${API}/clients/${clientId}`),
        axios.get(`${API}/contacts?client_id=${clientId}`),
        axios.get(`${API}/performance?client_id=${clientId}`),
        axios.get(`${API}/alerts?client_id=${clientId}`),
        axios.get(`${API}/communications?client_id=${clientId}`),
        axios.get(`${API}/followups?client_id=${clientId}`),
        axios.get(`${API}/users`)
      ]);
      
      setClient(clientRes.data);
      setContacts(contactsRes.data);
      setPerformance(perfRes.data);
      setAlerts(alertsRes.data);
      setCommunications(commsRes.data);
      setFollowups(followupsRes.data);
      setUsers(usersRes.data);
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

  const handleDownloadReport = async (reportType) => {
    setDownloadingReport(true);
    try {
      const response = await axios.post(
        `${API}/reports/generate-docx?client_id=${clientId}&report_type=${reportType}`,
        {},
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `anka_report_${client.name.replace(/\s/g, '_')}_${reportType}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    } finally {
      setDownloadingReport(false);
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
      'decision-maker': 'bg-purple-100 text-purple-700 border-purple-200',
      'influencer': 'bg-blue-100 text-blue-700 border-blue-200',
      'operations': 'bg-green-100 text-green-700 border-green-200',
      'billing': 'bg-amber-100 text-amber-700 border-amber-200'
    };
    return colors[role] || 'bg-slate-100 text-slate-600';
  };

  const getEngagementColor = (contact) => {
    const now = new Date();
    const dates = [contact.last_email_date, contact.last_call_date, contact.last_meeting_date]
      .filter(d => d)
      .map(d => new Date(d));
    
    if (dates.length === 0) return 'bg-red-500'; // No engagement
    
    const mostRecent = new Date(Math.max(...dates));
    const daysSince = Math.ceil((now - mostRecent) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 14) return 'bg-green-500';
    if (daysSince <= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getUserName = (userId) => {
    const u = users.find(u => u.id === userId);
    return u?.name || 'Unassigned';
  };

  // Prepare chart data
  const performanceChartData = performance.slice(0, 8).reverse().map(p => ({
    period: formatDate(p.period_end).split(',')[0],
    recoveryRate: p.recovery_rate,
    slaCompliance: p.sla_compliance_pct
  }));

  const latestPerf = performance[0];
  const denialCodesData = latestPerf?.top_denial_codes 
    ? Object.entries(latestPerf.top_denial_codes).map(([code, count]) => ({ code, count }))
    : [];
  
  const payerData = latestPerf?.payer_breakdown
    ? Object.entries(latestPerf.payer_breakdown).map(([name, value]) => ({ name, value }))
    : [];

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
        
        {/* Health Score & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getHealthColor(client.health_score)}`}>
              {client.health_score}
            </div>
            <span className="text-sm text-slate-500">Health Score</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              size="sm"
              className="bg-[#1B4F72] hover:bg-[#154360]"
              onClick={() => handleDownloadReport('external')}
              disabled={downloadingReport}
            >
              <Download className="h-4 w-4 mr-1" />
              Client Report
            </Button>
            {user?.role === 'cs_lead' && (
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleDownloadReport('internal')}
                disabled={downloadingReport}
              >
                <Download className="h-4 w-4 mr-1" />
                Internal Report
              </Button>
            )}
          </div>
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
                <CardTitle className="text-lg">SLA Targets vs Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Recovery Rate Target</span>
                    <span className="font-semibold">{client.sla_targets?.recovery_rate || 85}%</span>
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
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Max Error Rate</span>
                    <span className="font-semibold">{client.sla_targets?.error_rate || 2}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Current Error Rate</span>
                    <span className={`font-semibold ${
                      (latestPerf?.error_rate || 0) <= (client.sla_targets?.error_rate || 2)
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {latestPerf?.error_rate?.toFixed(1) || 0}%
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
                {communications.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No recent activity</p>
                  </div>
                ) : (
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
                  </div>
                )}
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
                  <CardTitle className="text-lg">Client Organization</CardTitle>
                  <CardDescription>Contacts mapped to Anka relationship owners</CardDescription>
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
              {contacts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p>No contacts added yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Visual Org Chart */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Organization Hierarchy
                      <span className="text-xs text-slate-400 ml-auto">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> &lt;14d
                        <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mx-1 ml-3"></span> 14-30d
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mx-1 ml-3"></span> &gt;30d
                      </span>
                    </h4>
                    
                    {/* Decision Makers */}
                    {contacts.filter(c => c.role_type === 'decision-maker').length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-purple-600 mb-2">Decision Makers</p>
                        <div className="flex flex-wrap gap-3">
                          {contacts.filter(c => c.role_type === 'decision-maker').map((contact) => (
                            <div key={contact.id} className="p-3 bg-white border border-purple-200 rounded-lg min-w-48 relative">
                              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getEngagementColor(contact)}`} title="Last engagement" />
                              <p className="font-medium text-slate-900 pr-4">{contact.name}</p>
                              <p className="text-xs text-slate-600">{contact.title}</p>
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                                <User className="h-3 w-3 text-[#1B4F72]" />
                                <span className="text-xs text-[#1B4F72]">{getUserName(contact.anka_relationship_owner)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Influencers */}
                    {contacts.filter(c => c.role_type === 'influencer').length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-blue-600 mb-2">Influencers</p>
                        <div className="flex flex-wrap gap-3">
                          {contacts.filter(c => c.role_type === 'influencer').map((contact) => (
                            <div key={contact.id} className="p-3 bg-white border border-blue-200 rounded-lg min-w-48 relative">
                              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getEngagementColor(contact)}`} />
                              <p className="font-medium text-slate-900 pr-4">{contact.name}</p>
                              <p className="text-xs text-slate-600">{contact.title}</p>
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                                <User className="h-3 w-3 text-[#1B4F72]" />
                                <span className="text-xs text-[#1B4F72]">{getUserName(contact.anka_relationship_owner)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Operations & Billing */}
                    {contacts.filter(c => c.role_type === 'operations' || c.role_type === 'billing').length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-600 mb-2">Operations & Billing</p>
                        <div className="flex flex-wrap gap-3">
                          {contacts.filter(c => c.role_type === 'operations' || c.role_type === 'billing').map((contact) => (
                            <div key={contact.id} className={`p-3 bg-white border rounded-lg min-w-48 relative ${
                              contact.role_type === 'operations' ? 'border-green-200' : 'border-amber-200'
                            }`}>
                              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getEngagementColor(contact)}`} />
                              <p className="font-medium text-slate-900 pr-4">{contact.name}</p>
                              <p className="text-xs text-slate-600">{contact.title}</p>
                              <Badge className={`mt-1 ${getRoleTypeColor(contact.role_type)}`}>{contact.role_type}</Badge>
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                                <User className="h-3 w-3 text-[#1B4F72]" />
                                <span className="text-xs text-[#1B4F72]">{getUserName(contact.anka_relationship_owner)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact List with Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-700">Contact Details</h4>
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
                </div>
              )}
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
              {communications.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p>No communications recorded</p>
                </div>
              ) : (
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-6 space-y-6">
          {performance.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No performance data recorded</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Performance Trend Chart */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Performance Trends</CardTitle>
                  <CardDescription>Recovery rate and SLA compliance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }} />
                      <Legend />
                      <Line type="monotone" dataKey="recoveryRate" stroke="#1B4F72" strokeWidth={2} name="Recovery Rate %" dot={{ fill: '#1B4F72' }} />
                      <Line type="monotone" dataKey="slaCompliance" stroke="#85C1E9" strokeWidth={2} name="SLA Compliance %" dot={{ fill: '#85C1E9' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Denial Codes and Payer Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Top Denial Codes</CardTitle>
                    <CardDescription>Latest period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {denialCodesData.length === 0 ? (
                      <p className="text-center py-8 text-slate-500">No denial code data</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={denialCodesData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <YAxis dataKey="code" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={60} />
                          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }} />
                          <Bar dataKey="count" fill="#1B4F72" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Payer Breakdown</CardTitle>
                    <CardDescription>Recovery by payer (latest period)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payerData.length === 0 ? (
                      <p className="text-center py-8 text-slate-500">No payer data</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={payerData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {payerData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance History Table */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Performance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-slate-600">Period</th>
                          <th className="text-right py-3 px-2 font-medium text-slate-600">Denials</th>
                          <th className="text-right py-3 px-2 font-medium text-slate-600">Recovered</th>
                          <th className="text-right py-3 px-2 font-medium text-slate-600">Rate</th>
                          <th className="text-right py-3 px-2 font-medium text-slate-600">SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performance.slice(0, 6).map((perf) => (
                          <tr key={perf.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-2 text-slate-700">
                              {formatDate(perf.period_start)} - {formatDate(perf.period_end)}
                            </td>
                            <td className="text-right py-3 px-2 text-slate-600">
                              {perf.denials_worked?.toLocaleString()}
                            </td>
                            <td className="text-right py-3 px-2 text-green-600">
                              ${perf.dollars_recovered?.toLocaleString()}
                            </td>
                            <td className={`text-right py-3 px-2 font-medium ${
                              perf.recovery_rate >= (client.sla_targets?.recovery_rate || 85)
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {perf.recovery_rate?.toFixed(1)}%
                            </td>
                            <td className="text-right py-3 px-2 text-slate-600">
                              {perf.sla_compliance_pct?.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p>No alerts for this client</p>
                </div>
              ) : (
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
                </div>
              )}
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
              {followups.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p>No follow-up items</p>
                </div>
              ) : (
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
                </div>
              )}
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
