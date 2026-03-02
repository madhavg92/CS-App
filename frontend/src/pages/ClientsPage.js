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
        </div>\n        <Dialog open={showAddClient} onOpenChange={setShowAddClient}>\n          <DialogTrigger asChild>\n            <Button className=\"bg-emerald-600 hover:bg-emerald-700\" data-testid=\"add-client-btn\">\n              <Plus className=\"h-4 w-4 mr-2\" />\n              Add Client\n            </Button>\n          </DialogTrigger>\n          <DialogContent className=\"bg-white\">\n            <DialogHeader>\n              <DialogTitle className=\"text-slate-900\">Add New Client</DialogTitle>\n              <DialogDescription className=\"text-slate-600\">Create a new client profile for relationship tracking</DialogDescription>\n            </DialogHeader>\n            <form onSubmit={handleAddClient}>\n              <div className=\"space-y-4 py-4\">\n                <div>\n                  <Label htmlFor=\"name\" className=\"text-slate-700\">Client Name</Label>\n                  <Input id=\"name\" name=\"name\" className=\"bg-white border-slate-300\" required data-testid=\"client-name-input\" />\n                </div>\n                <div>\n                  <Label htmlFor=\"owner\" className=\"text-slate-700\">Relationship Owner</Label>\n                  <Input id=\"owner\" name=\"owner\" className=\"bg-white border-slate-300\" required data-testid=\"client-owner-input\" />\n                </div>\n                <div>\n                  <Label htmlFor=\"value\" className=\"text-slate-700\">Contract Value ($)</Label>\n                  <Input id=\"value\" name=\"value\" type=\"number\" step=\"0.01\" className=\"bg-white border-slate-300\" required data-testid=\"client-value-input\" />\n                </div>\n                <div>\n                  <Label htmlFor=\"renewal\" className=\"text-slate-700\">Renewal Date</Label>\n                  <Input id=\"renewal\" name=\"renewal\" type=\"date\" className=\"bg-white border-slate-300\" required data-testid=\"client-renewal-input\" />\n                </div>\n              </div>\n              <DialogFooter>\n                <Button type=\"submit\" className=\"bg-emerald-600 hover:bg-emerald-700\" data-testid=\"submit-client-btn\">Create Client</Button>\n              </DialogFooter>\n            </form>\n          </DialogContent>\n        </Dialog>\n      </div>\n\n      <div className=\"mb-6\">\n        <div className=\"relative\">\n          <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400\" />\n          <Input\n            placeholder=\"Search clients by name or owner...\"\n            value={searchTerm}\n            onChange={(e) => setSearchTerm(e.target.value)}\n            className=\"pl-10 bg-white border-slate-300\"\n            data-testid=\"search-clients-input\"\n          />\n        </div>\n      </div>\n\n      <div className=\"grid grid-cols-1 gap-4\">\n        {filteredClients.length === 0 ? (\n          <Card className=\"bg-white border-slate-200\">\n            <CardContent className=\"py-12 text-center\">\n              <Users className=\"h-12 w-12 text-slate-400 mx-auto mb-4\" />\n              <p className=\"text-slate-600\">No clients found. Add your first client to get started.</p>\n            </CardContent>\n          </Card>\n        ) : (\n          filteredClients.map((client) => (\n            <Card\n              key={client.id}\n              className=\"bg-white border-slate-200 hover:shadow-lg transition-all cursor-pointer\"\n              onClick={() => navigate(`/client/${client.id}`)}\n              data-testid={`client-card-${client.id}`}\n            >\n              <CardContent className=\"p-6\">\n                <div className=\"flex items-center justify-between\">\n                  <div className=\"flex items-center gap-4 flex-1\">\n                    <Avatar className=\"h-14 w-14\">\n                      <AvatarFallback className=\"bg-emerald-100 text-emerald-700 text-lg font-semibold\">\n                        {client.name.substring(0, 2).toUpperCase()}\n                      </AvatarFallback>\n                    </Avatar>\n                    <div className=\"flex-1\">\n                      <h3 className=\"font-semibold text-lg text-slate-900\" data-testid={`client-name-${client.id}`}>{client.name}</h3>\n                      <p className=\"text-sm text-slate-600\">Owner: {client.relationship_owner}</p>\n                      <div className=\"flex items-center gap-4 mt-2\">\n                        <span className=\"text-sm text-slate-600\">\n                          Contract: ${client.contract_value.toLocaleString()}\n                        </span>\n                        <span className=\"text-sm text-slate-600\">\n                          Renewal: {new Date(client.renewal_date).toLocaleDateString()}\n                        </span>\n                        <span className=\"text-sm text-slate-600\">\n                          {client.contacts?.length || 0} contacts\n                        </span>\n                      </div>\n                    </div>\n                  </div>\n                  <div className=\"flex items-center gap-6\">\n                    <div className=\"text-center\">\n                      <div className=\"text-sm text-slate-600 mb-1\">Health Score</div>\n                      <div className={`text-3xl font-bold ${getHealthColor(client.health_score)}`} data-testid={`health-score-${client.id}`}>\n                        {client.health_score}\n                      </div>\n                    </div>\n                    <Badge className={`${getStatusStyles(client.status)} border px-3 py-1`} data-testid={`status-badge-${client.id}`}>\n                      {client.status === 'healthy' && <TrendingUp className=\"h-3 w-3 mr-1\" />}\n                      {client.status === 'at-risk' && <AlertTriangle className=\"h-3 w-3 mr-1\" />}\n                      {client.status}\n                    </Badge>\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n          ))\n        )}\n      </div>\n    </div>\n  );\n};\n\nexport default ClientsPage;\n