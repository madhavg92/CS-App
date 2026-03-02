import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Mail, Building2, User, Phone, Briefcase, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const response = await axios.get(`${API}/clients/${clientId}`);
      setClient(response.data);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
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
        role: selectedRole,
        last_contact: new Date().toISOString(),
        notes: formData.get('notes')
      });
      setShowAddContact(false);
      setSelectedRole('');
      fetchClientData();
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'decision-maker': 'bg-purple-100 text-purple-700 border-purple-200',
      'influencer': 'bg-blue-100 text-blue-700 border-blue-200',
      'user': 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[role] || colors.user;
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-slate-600">Loading client details...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Client not found</p>
          <Button onClick={() => navigate('/clients')} className="mt-4">Back to Clients</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/clients')}
          className="mb-4 text-slate-600 hover:text-slate-900"
          data-testid="back-to-clients-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-3xl font-bold">
                {client.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold text-slate-900" data-testid="client-detail-name">{client.name}</h1>
              <p className="text-slate-600 mt-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                {client.relationship_owner}
              </p>
            </div>
          </div>
          <Badge 
            className={`px-4 py-2 text-base border ${
              client.status === 'healthy' 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}
            data-testid="client-detail-status"
          >
            {client.status}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${getHealthColor(client.health_score)}`} data-testid="client-detail-health-score">
              {client.health_score}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Contract Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900" data-testid="client-detail-contract-value">
              ${client.contract_value.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Renewal Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-slate-900" data-testid="client-detail-renewal-date">
              {new Date(client.renewal_date).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {client.contacts?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="contacts" data-testid="contacts-tab">Org Map & Contacts</TabsTrigger>
          <TabsTrigger value="relationship" data-testid="relationship-tab">Relationship Health</TabsTrigger>
          <TabsTrigger value="engagement" data-testid="engagement-tab">Engagement History</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" data-testid="contacts-content">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organization Map & Key Contacts</CardTitle>
                  <CardDescription>Decision-makers, influencers, and key stakeholders</CardDescription>
                </div>
                <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="add-contact-btn">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">Add New Contact</DialogTitle>
                      <DialogDescription className="text-slate-600">Add a key stakeholder to the organization map</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddContact}>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2">
                          <Label htmlFor="name" className="text-slate-700">Full Name *</Label>
                          <Input id="name" name="name" className="bg-white border-slate-300" required data-testid="contact-name-input" />
                        </div>
                        <div>
                          <Label htmlFor="title" className="text-slate-700">Title/Position *</Label>
                          <Input id="title" name="title" className="bg-white border-slate-300" required data-testid="contact-title-input" />
                        </div>
                        <div>
                          <Label htmlFor="role" className="text-slate-700">Role Type *</Label>
                          <Select value={selectedRole} onValueChange={setSelectedRole} required>
                            <SelectTrigger className="bg-white border-slate-300" data-testid="contact-role-select">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="decision-maker">Decision Maker</SelectItem>
                              <SelectItem value="influencer">Influencer</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-slate-700">Email *</Label>
                          <Input id="email" name="email" type="email" className="bg-white border-slate-300" required data-testid="contact-email-input" />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-slate-700">Phone</Label>
                          <Input id="phone" name="phone" className="bg-white border-slate-300" data-testid="contact-phone-input" />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="notes" className="text-slate-700">Notes</Label>
                          <Input id="notes" name="notes" className="bg-white border-slate-300" placeholder="Key insights about this contact..." data-testid="contact-notes-input" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowAddContact(false)}>Cancel</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="submit-contact-btn">Add Contact</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {(!client.contacts || client.contacts.length === 0) ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600" data-testid="no-contacts-message">No contacts added yet. Build your relationship map by adding key stakeholders.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group contacts by role */}
                  {['decision-maker', 'influencer', 'user'].map(roleType => {
                    const roleContacts = client.contacts.filter(c => c.role === roleType);
                    if (roleContacts.length === 0) return null;
                    
                    return (
                      <div key={roleType}>
                        <h4 className="text-sm font-semibold text-slate-700 uppercase mb-3">
                          {roleType === 'decision-maker' ? 'Decision Makers' : roleType === 'influencer' ? 'Influencers' : 'Users'}
                          <span className="ml-2 text-slate-500">({roleContacts.length})</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {roleContacts.map((contact) => (
                            <div key={contact.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`contact-card-${contact.id}`}>
                              <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                    {contact.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h5 className="font-semibold text-slate-900">{contact.name}</h5>
                                      <p className="text-sm text-slate-600">{contact.title}</p>
                                    </div>
                                    <Badge className={`${getRoleColor(contact.role)} border text-xs px-2 py-0.5`}>
                                      {contact.role.replace('-', ' ')}
                                    </Badge>
                                  </div>
                                  <div className="mt-3 space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{contact.email}</span>
                                    </div>
                                    {contact.phone && (
                                      <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone className="h-3 w-3" />
                                        <span>{contact.phone}</span>
                                      </div>
                                    )}
                                    {contact.last_contact && (
                                      <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Calendar className="h-3 w-3" />
                                        <span>Last contact: {new Date(contact.last_contact).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                  </div>
                                  {contact.notes && (
                                    <p className="mt-2 text-xs text-slate-500 italic">{contact.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationship" data-testid="relationship-content">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Relationship Health Dashboard</CardTitle>
              <CardDescription>Visual overview of engagement recency and relationship strength</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-sm text-emerald-700 font-medium mb-1">Overall Health</div>
                    <div className="text-3xl font-bold text-emerald-700">{client.health_score}%</div>
                    <div className="text-xs text-emerald-600 mt-1">Strong relationship</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 font-medium mb-1">Last Engagement</div>
                    <div className="text-lg font-bold text-blue-700">{new Date(client.last_engagement).toLocaleDateString()}</div>
                    <div className="text-xs text-blue-600 mt-1">{Math.floor((new Date() - new Date(client.last_engagement)) / (1000 * 60 * 60 * 24))} days ago</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-sm text-slate-700 font-medium mb-1">Engagement Gaps</div>
                    <div className="text-3xl font-bold text-slate-700">0</div>
                    <div className="text-xs text-slate-600 mt-1">No gaps detected</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact Coverage by Role</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">Decision Makers</span>
                        <span className="text-sm font-medium text-slate-900">{client.contacts?.filter(c => c.role === 'decision-maker').length || 0}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(100, (client.contacts?.filter(c => c.role === 'decision-maker').length || 0) * 33)}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">Influencers</span>
                        <span className="text-sm font-medium text-slate-900">{client.contacts?.filter(c => c.role === 'influencer').length || 0}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, (client.contacts?.filter(c => c.role === 'influencer').length || 0) * 33)}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">Users</span>
                        <span className="text-sm font-medium text-slate-900">{client.contacts?.filter(c => c.role === 'user').length || 0}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-slate-600 h-2 rounded-full" style={{ width: `${Math.min(100, (client.contacts?.filter(c => c.role === 'user').length || 0) * 25)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" data-testid="engagement-content">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Engagement Timeline</CardTitle>
              <CardDescription>Track all interactions and touchpoints with this client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Engagement history will be displayed here once communications are tracked</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetailPage;
