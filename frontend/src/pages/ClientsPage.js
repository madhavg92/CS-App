import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Plus, Filter, ChevronRight, Building2, User, Calendar,
  AlertTriangle, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [newClient, setNewClient] = useState({
    name: '',
    contract_start: '',
    contract_end: '',
    contracted_services: [],
    sla_targets: { recovery_rate: 85, error_rate: 2 },
    assigned_csm: '',
    assigned_cs_lead: ''
  });

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery, statusFilter]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.assigned_csm?.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    setFilteredClients(filtered);
  };

  const handleCreateClient = async () => {
    try {
      await axios.post(`${API}/clients`, newClient);
      setShowAddDialog(false);
      setNewClient({
        name: '',
        contract_start: '',
        contract_end: '',
        contracted_services: [],
        sla_targets: { recovery_rate: 85, error_rate: 2 },
        assigned_csm: '',
        assigned_cs_lead: ''
      });
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client');
    }
  };

  const getHealthBadge = (score) => {
    if (score >= 80) return { class: 'bg-green-100 text-green-700 border-green-200', label: 'Healthy' };
    if (score >= 60) return { class: 'bg-amber-100 text-amber-700 border-amber-200', label: 'At Risk' };
    return { class: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' };
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      'at-risk': 'bg-amber-100 text-amber-700',
      churned: 'bg-red-100 text-red-700'
    };
    return styles[status] || styles.active;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilRenewal = (endDate) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const services = ['EV', 'Prior Auth', 'Coding', 'Billing', 'AR', 'Payment Posting'];

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
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-600 mt-1">{filteredClients.length} clients found</p>
        </div>
        {user?.role !== 'ops' && (
          <Button 
            className="bg-[#1B4F72] hover:bg-[#154360]"
            onClick={() => setShowAddDialog(true)}
            data-testid="add-client-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search clients by name or CSM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
            data-testid="search-clients"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white" data-testid="filter-status">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="at-risk">At Risk</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client List */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No clients found</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            const healthBadge = getHealthBadge(client.health_score);
            const daysUntilRenewal = getDaysUntilRenewal(client.contract_end);
            
            return (
              <Card 
                key={client.id}
                className="bg-white border-slate-200 hover:shadow-md hover:border-[#85C1E9] transition-all cursor-pointer"
                onClick={() => navigate(`/clients/${client.id}`)}
                data-testid={`client-card-${client.id}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Health Score */}
                    <div className="hidden sm:flex flex-col items-center justify-center w-16">
                      <div className={`text-2xl font-bold ${
                        client.health_score >= 80 ? 'text-green-600' :
                        client.health_score >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {client.health_score}
                      </div>
                      <span className="text-xs text-slate-500">Health</span>
                    </div>

                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{client.name}</h3>
                        <Badge className={getStatusBadge(client.status)}>{client.status}</Badge>
                        <Badge className={`${healthBadge.class} sm:hidden`}>{client.health_score}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        {client.assigned_csm && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {users.find(u => u.id === client.assigned_csm)?.name || client.assigned_csm}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Renewal: {formatDate(client.contract_end)}
                        </span>
                        {client.last_contact_date && (
                          <span>Last Contact: {formatDate(client.last_contact_date)}</span>
                        )}
                      </div>
                    </div>

                    {/* Renewal Warning */}
                    {daysUntilRenewal !== null && daysUntilRenewal <= 60 && daysUntilRenewal > 0 && (
                      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">{daysUntilRenewal}d to renewal</span>
                      </div>
                    )}

                    {/* Services */}
                    <div className="hidden lg:flex flex-wrap gap-1 max-w-48">
                      {client.contracted_services?.slice(0, 3).map((service) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {client.contracted_services?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{client.contracted_services.length - 3}
                        </Badge>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input
                value={newClient.name}
                onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                placeholder="Enter client name"
                data-testid="new-client-name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Start *</Label>
                <Input
                  type="date"
                  value={newClient.contract_start}
                  onChange={(e) => setNewClient({...newClient, contract_start: e.target.value})}
                  data-testid="new-client-start"
                />
              </div>
              <div className="space-y-2">
                <Label>Contract End *</Label>
                <Input
                  type="date"
                  value={newClient.contract_end}
                  onChange={(e) => setNewClient({...newClient, contract_end: e.target.value})}
                  data-testid="new-client-end"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contracted Services</Label>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <Badge
                    key={service}
                    variant={newClient.contracted_services.includes(service) ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      newClient.contracted_services.includes(service) 
                        ? 'bg-[#1B4F72] hover:bg-[#154360]' 
                        : 'hover:bg-slate-100'
                    }`}
                    onClick={() => {
                      const services = newClient.contracted_services.includes(service)
                        ? newClient.contracted_services.filter(s => s !== service)
                        : [...newClient.contracted_services, service];
                      setNewClient({...newClient, contracted_services: services});
                    }}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assigned CSM</Label>
                <Select 
                  value={newClient.assigned_csm}
                  onValueChange={(v) => setNewClient({...newClient, assigned_csm: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CSM" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role === 'csm' || u.role === 'cs_lead').map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CS Lead</Label>
                <Select 
                  value={newClient.assigned_cs_lead}
                  onValueChange={(v) => setNewClient({...newClient, assigned_cs_lead: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role === 'cs_lead').map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SLA Recovery Rate Target (%)</Label>
                <Input
                  type="number"
                  value={newClient.sla_targets.recovery_rate}
                  onChange={(e) => setNewClient({
                    ...newClient, 
                    sla_targets: {...newClient.sla_targets, recovery_rate: parseInt(e.target.value)}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Error Rate (%)</Label>
                <Input
                  type="number"
                  value={newClient.sla_targets.error_rate}
                  onChange={(e) => setNewClient({
                    ...newClient, 
                    sla_targets: {...newClient.sla_targets, error_rate: parseInt(e.target.value)}
                  })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button 
              className="bg-[#1B4F72] hover:bg-[#154360]"
              onClick={handleCreateClient}
              disabled={!newClient.name || !newClient.contract_start || !newClient.contract_end}
              data-testid="create-client-btn"
            >
              Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
