import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Plus, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
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
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusStyles = (status) => {
    const styles = {
      healthy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'at-risk': 'bg-amber-100 text-amber-700 border-amber-200',
      active: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return styles[status] || styles.active;
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.relationship_owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Client Org Mapping</h2>
          <p className="text-slate-600 mt-2">Manage client relationships and organizational structure</p>
        </div>
        <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="add-client-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Add New Client</DialogTitle>
              <DialogDescription className="text-slate-600">Create a new client profile for relationship tracking</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClient}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name" className="text-slate-700">Client Name</Label>
                  <Input id="name" name="name" className="bg-white border-slate-300" required data-testid="client-name-input" />
                </div>
                <div>
                  <Label htmlFor="owner" className="text-slate-700">Relationship Owner</Label>
                  <Input id="owner" name="owner" className="bg-white border-slate-300" required data-testid="client-owner-input" />
                </div>
                <div>
                  <Label htmlFor="value" className="text-slate-700">Contract Value ($)</Label>
                  <Input id="value" name="value" type="number" step="0.01" className="bg-white border-slate-300" required data-testid="client-value-input" />
                </div>
                <div>
                  <Label htmlFor="renewal" className="text-slate-700">Renewal Date</Label>
                  <Input id="renewal" name="renewal" type="date" className="bg-white border-slate-300" required data-testid="client-renewal-input" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="submit-client-btn">Create Client</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search clients by name or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300"
            data-testid="search-clients-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredClients.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No clients found. Add your first client to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card
              key={client.id}
              className="bg-white border-slate-200 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/client/${client.id}`)}
              data-testid={`client-card-${client.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">
                        {client.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-900" data-testid={`client-name-${client.id}`}>{client.name}</h3>
                      <p className="text-sm text-slate-600">Owner: {client.relationship_owner}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-slate-600">
                          Contract: ${client.contract_value.toLocaleString()}
                        </span>
                        <span className="text-sm text-slate-600">
                          Renewal: {new Date(client.renewal_date).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-slate-600">
                          {client.contacts?.length || 0} contacts
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-slate-600 mb-1">Health Score</div>
                      <div className={`text-3xl font-bold ${getHealthColor(client.health_score)}`} data-testid={`health-score-${client.id}`}>
                        {client.health_score}
                      </div>
                    </div>
                    <Badge className={`${getStatusStyles(client.status)} border px-3 py-1`} data-testid={`status-badge-${client.id}`}>
                      {client.status === 'healthy' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {client.status === 'at-risk' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {client.status}
                    </Badge>
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

export default ClientsPage;
