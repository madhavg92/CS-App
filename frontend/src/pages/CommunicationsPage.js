import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, Send, FileEdit, Clock, Filter, Sparkles,
  Mail, Phone as PhoneIcon, Users, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CommunicationsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('drafts');
  const [communications, setCommunications] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    client_id: 'all',
    channel: 'all'
  });
  
  // Send dialog
  const [selectedComm, setSelectedComm] = useState(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [commsRes, clientsRes] = await Promise.all([
        axios.get(`${API}/communications`),
        axios.get(`${API}/clients`)
      ]);
      setCommunications(commsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDrafts = () => communications.filter(c => c.comm_type === 'draft');
  const getSent = () => communications.filter(c => c.comm_type === 'sent');
  const getReceived = () => communications.filter(c => c.comm_type === 'received');

  const getFilteredComms = (comms) => {
    let filtered = [...comms];
    if (filters.client_id !== 'all') {
      filtered = filtered.filter(c => c.client_id === filters.client_id);
    }
    if (filters.channel !== 'all') {
      filtered = filtered.filter(c => c.channel === filters.channel);
    }
    return filtered;
  };

  const handleSend = async () => {
    if (!selectedComm) return;
    setSending(true);
    try {
      await axios.patch(`${API}/communications/${selectedComm.id}/send`);
      setShowSendDialog(false);
      setSelectedComm(null);
      fetchData();
    } catch (error) {
      console.error('Error sending communication:', error);
    } finally {
      setSending(false);
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <PhoneIcon className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4F72]"></div>
      </div>
    );
  }

  const drafts = getFilteredComms(getDrafts());
  const sent = getFilteredComms(getSent());
  const received = getFilteredComms(getReceived());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
        <p className="text-slate-600 mt-1">Manage drafts, sent messages, and history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <FileEdit className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{getDrafts().length}</p>
                <p className="text-xs text-slate-500">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{getSent().length}</p>
                <p className="text-xs text-slate-500">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{getReceived().length}</p>
                <p className="text-xs text-slate-500">Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.client_id} onValueChange={(v) => setFilters({...filters, client_id: v})}>
          <SelectTrigger className="w-48 bg-white" data-testid="filter-client">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.channel} onValueChange={(v) => setFilters({...filters, channel: v})}>
          <SelectTrigger className="w-40 bg-white" data-testid="filter-channel">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="drafts" data-testid="tab-drafts">
            Draft Queue ({drafts.length})
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">
            Sent ({sent.length})
          </TabsTrigger>
          <TabsTrigger value="received" data-testid="tab-received">
            Received ({received.length})
          </TabsTrigger>
        </TabsList>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="mt-6">
          {drafts.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-12 text-center">
                <FileEdit className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No drafts pending review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {drafts.map((comm) => (
                <Card key={comm.id} className="bg-white hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        {getChannelIcon(comm.channel)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline">{comm.channel}</Badge>
                          {comm.ai_generated && (
                            <Badge className="bg-[#85C1E9] text-[#1B4F72]">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                          <span className="text-sm text-slate-500">{getClientName(comm.client_id)}</span>
                        </div>
                        
                        <h3 className="font-medium text-slate-900">{comm.subject}</h3>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{comm.body}</p>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(comm.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedComm(comm);
                            setShowSendDialog(true);
                          }}
                        >
                          Review
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedComm(comm);
                            setShowSendDialog(true);
                          }}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent Tab */}
        <TabsContent value="sent" className="mt-6">
          {sent.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-12 text-center">
                <Send className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No sent communications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sent.map((comm) => (
                <Card key={comm.id} className="bg-white">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-green-50 rounded-lg">
                        {getChannelIcon(comm.channel)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-700">Sent</Badge>
                          <Badge variant="outline">{comm.channel}</Badge>
                          <span className="text-sm text-slate-500">{getClientName(comm.client_id)}</span>
                        </div>
                        
                        <h3 className="font-medium text-slate-900">{comm.subject}</h3>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{comm.body}</p>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Sent: {formatDate(comm.sent_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Received Tab */}
        <TabsContent value="received" className="mt-6">
          {received.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No received communications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {received.map((comm) => (
                <Card key={comm.id} className="bg-white">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        {getChannelIcon(comm.channel)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className="bg-blue-100 text-blue-700">Received</Badge>
                          <Badge variant="outline">{comm.channel}</Badge>
                          <span className="text-sm text-slate-500">{getClientName(comm.client_id)}</span>
                        </div>
                        
                        <h3 className="font-medium text-slate-900">{comm.subject}</h3>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{comm.body}</p>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(comm.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review & Send</DialogTitle>
          </DialogHeader>
          {selectedComm && (
            <div className="py-4 space-y-4">
              <div>
                <Label>To</Label>
                <p className="mt-1 p-2 bg-slate-50 rounded border text-sm">
                  {getClientName(selectedComm.client_id)}
                </p>
              </div>
              <div>
                <Label>Subject</Label>
                <Input 
                  value={selectedComm.subject} 
                  readOnly 
                  className="mt-1 bg-slate-50"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea 
                  value={selectedComm.body} 
                  readOnly 
                  className="mt-1 bg-slate-50 min-h-48"
                />
              </div>
              {selectedComm.ai_generated && (
                <div className="flex items-center gap-2 p-2 bg-[#85C1E9]/10 rounded-lg border border-[#85C1E9]/20">
                  <Sparkles className="h-4 w-4 text-[#1B4F72]" />
                  <span className="text-sm text-[#1B4F72]">This draft was generated by AI</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunicationsPage;
