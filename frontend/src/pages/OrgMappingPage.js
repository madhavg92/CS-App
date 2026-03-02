import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Users, Plus, Trash2, UserPlus, Network, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Org Chart Visualization Component
const OrgChartView = ({ client, mappings, lobs, teamMembers }) => {
  const getRoleBadgeColor = (role) => {
    const colors = {
      manager: 'bg-purple-600',
      supervisor: 'bg-blue-600',
      team_lead: 'bg-emerald-600'
    };
    return colors[role] || 'bg-slate-600';
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-12">
        {/* Client Side */}
        <div>
          <div className="mb-6 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Client Organization</h3>
            <div className="inline-block p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
              <Building2 className="h-8 w-8 text-blue-700 mx-auto mb-2" />
              <div className="font-bold text-blue-900">{client?.name}</div>
            </div>
          </div>
          
          <div className="space-y-3">
            {mappings.map((mapping, idx) => (
              <div key={mapping.id} className="relative">
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-blue-900">{mapping.lob_name}</div>
                      <div className="text-sm text-blue-700">{mapping.anka_team_members.length} team members</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-emerald-500"></div>
                      <ArrowRight className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </div>
                {/* Connection lines */}
                <svg className="absolute top-1/2 left-full w-12 h-1 -translate-y-1/2 pointer-events-none z-10" style={{ marginLeft: '-2px' }}>
                  <line x1="0" y1="0" x2="48" y2="0" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Anka Delivery Team Side */}
        <div>
          <div className="mb-6 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Anka Delivery Team</h3>
            <div className="inline-block p-4 bg-emerald-100 rounded-lg border-2 border-emerald-300">
              <Users className="h-8 w-8 text-emerald-700 mx-auto mb-2" />
              <div className="font-bold text-emerald-900">Delivery Org</div>
            </div>
          </div>
          
          <div className="space-y-3">
            {mappings.map((mapping) => (
              <div key={mapping.id} className="p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                <div className="font-semibold text-emerald-900 mb-2">{mapping.lob_name} Team</div>
                <div className="space-y-2">
                  {mapping.anka_team_members.map(memberId => {
                    const member = teamMembers.find(m => m.id === memberId);
                    return member ? (
                      <div key={memberId} className="flex items-center gap-2 p-2 bg-white rounded border border-emerald-200">
                        <div className={`w-2 h-2 rounded-full ${getRoleBadgeColor(member.role)}`}></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-600">{member.role}</div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Team Roles</h4>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span className="text-sm text-slate-700">Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-sm text-slate-700">Supervisor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
            <span className="text-sm text-slate-700">Team Lead</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrgMappingPage = () => {
  const [clients, setClients] = useState([]);
  const [lobs, setLobs] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [showAddLOB, setShowAddLOB] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [selectedLOB, setSelectedLOB] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchMappings(selectedClient);
    }
  }, [selectedClient]);

  const fetchData = async () => {
    try {
      const [clientsRes, lobsRes, membersRes] = await Promise.all([
        axios.get(`${API}/clients`),
        axios.get(`${API}/lobs`),
        axios.get(`${API}/team-members`)
      ]);
      setClients(clientsRes.data);
      setLobs(lobsRes.data);
      setTeamMembers(membersRes.data);
      if (clientsRes.data.length > 0) {
        setSelectedClient(clientsRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchMappings = async (clientId) => {
    try {
      const response = await axios.get(`${API}/client-lob-mappings?client_id=${clientId}`);
      setMappings(response.data);
    } catch (error) {
      console.error('Error fetching mappings:', error);
    }
  };

  const handleAddLOB = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await axios.post(`${API}/lobs`, {
        name: formData.get('name'),
        description: formData.get('description')
      });
      setShowAddLOB(false);
      fetchData();
    } catch (error) {
      console.error('Error adding LOB:', error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await axios.post(`${API}/team-members`, {
        name: formData.get('name'),
        role: formData.get('role'),
        email: formData.get('email'),
        phone: formData.get('phone')
      });
      setShowAddMember(false);
      fetchData();
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const handleAddMapping = async () => {
    if (!selectedClient || !selectedLOB || selectedMembers.length === 0) {
      alert('Please select a client, LOB, and at least one team member');
      return;
    }

    try {
      const client = clients.find(c => c.id === selectedClient);
      const lob = lobs.find(l => l.id === selectedLOB);
      
      await axios.post(`${API}/client-lob-mappings`, {
        client_id: selectedClient,
        client_name: client.name,
        lob_id: selectedLOB,
        lob_name: lob.name,
        anka_team_member_ids: selectedMembers
      });
      
      setShowAddMapping(false);
      setSelectedLOB('');
      setSelectedMembers([]);
      fetchMappings(selectedClient);
    } catch (error) {
      console.error('Error adding mapping:', error);
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;
    
    try {
      await axios.delete(`${API}/client-lob-mappings/${mappingId}`);
      fetchMappings(selectedClient);
    } catch (error) {
      console.error('Error deleting mapping:', error);
    }
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      manager: 'bg-purple-100 text-purple-700',
      supervisor: 'bg-blue-100 text-blue-700',
      team_lead: 'bg-emerald-100 text-emerald-700'
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Delivery Org Structure Mapping</h2>
        <p className="text-slate-600 mt-2">Map Anka team members to client LOBs (EV, Prior Auth, Coding, Billing, AR, Payment Posting)</p>
      </div>

      <Tabs defaultValue="mappings" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="mappings">Client-LOB Mappings</TabsTrigger>
          <TabsTrigger value="lobs">Manage LOBs</TabsTrigger>
          <TabsTrigger value="team">Manage Team</TabsTrigger>
        </TabsList>

        <TabsContent value="mappings">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <Label className="text-slate-700 mb-2 block">Select Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={showAddMapping} onOpenChange={setShowAddMapping}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add LOB Mapping
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900">Map LOB to Team Members</DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Assign Anka team members to manage this client's LOB
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-slate-700">Line of Business (LOB)</Label>
                      <Select value={selectedLOB} onValueChange={setSelectedLOB}>
                        <SelectTrigger className="bg-white border-slate-300">
                          <SelectValue placeholder="Select LOB" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {lobs.map((lob) => (
                            <SelectItem key={lob.id} value={lob.id}>
                              {lob.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-700 mb-2 block">Assign Team Members</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
                        {teamMembers.map((member) => (
                          <div
                            key={member.id}
                            onClick={() => toggleMemberSelection(member.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedMembers.includes(member.id)
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="font-medium text-slate-900">{member.name}</div>
                            <div className="text-sm text-slate-600">{member.role}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddMapping(false)}>Cancel</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddMapping}>
                      Create Mapping
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {selectedClientData && (
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-emerald-600" />
                    <CardTitle>{selectedClientData.name} - Organization Structure</CardTitle>
                  </div>
                  <CardDescription>Visual mapping of client LOBs to Anka delivery team</CardDescription>
                </CardHeader>
                <CardContent>
                  {mappings.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No LOB mappings configured yet</p>
                    </div>
                  ) : (
                    <OrgChartView 
                      client={selectedClientData}
                      mappings={mappings}
                      lobs={lobs}
                      teamMembers={teamMembers}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lobs">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lines of Business (LOBs)</CardTitle>
                  <CardDescription>Manage service lines: EV, Prior Auth, Coding, Billing, AR, Payment Posting</CardDescription>
                </div>
                <Dialog open={showAddLOB} onOpenChange={setShowAddLOB}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add LOB
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">Add Line of Business</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddLOB}>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="name" className="text-slate-700">LOB Name</Label>
                          <Input id="name" name="name" className="bg-white border-slate-300" placeholder="e.g., Prior Authorization" required />
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-slate-700">Description</Label>
                          <Input id="description" name="description" className="bg-white border-slate-300" placeholder="Optional description" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Add LOB</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lobs.map((lob) => (
                  <div key={lob.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-900">{lob.name}</h4>
                    {lob.description && (
                      <p className="text-sm text-slate-600 mt-1">{lob.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Anka Team Members</CardTitle>
                  <CardDescription>Managers and supervisors in delivery organization</CardDescription>
                </div>
                <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">Add Team Member</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddMember}>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="name" className="text-slate-700">Name</Label>
                          <Input id="name" name="name" className="bg-white border-slate-300" required />
                        </div>
                        <div>
                          <Label htmlFor="role" className="text-slate-700">Role</Label>
                          <Input id="role" name="role" className="bg-white border-slate-300" placeholder="e.g., manager, supervisor, team_lead" required />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-slate-700">Email</Label>
                          <Input id="email" name="email" type="email" className="bg-white border-slate-300" required />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-slate-700">Phone</Label>
                          <Input id="phone" name="phone" className="bg-white border-slate-300" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Add Member</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{member.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                        <span>{member.email}</span>
                        {member.phone && <span>{member.phone}</span>}
                      </div>
                    </div>
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrgMappingPage;
