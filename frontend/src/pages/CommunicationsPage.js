import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Send, FileText, Sparkles, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CommunicationsPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [emailType, setEmailType] = useState('');
  const [context, setContext] = useState('');
  const [draftedEmail, setDraftedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [communications, setCommunications] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchCommunications(selectedClient);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`);
      setClients(response.data);
      if (response.data.length > 0) {
        setSelectedClient(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCommunications = async (clientId) => {
    try {
      const response = await axios.get(`${API}/communications/${clientId}`);
      setCommunications(response.data);
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };

  const handleDraftEmail = async () => {
    if (!selectedClient || !emailType || !context) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      const response = await axios.post(`${API}/draft-email`, {
        client_id: selectedClient,
        client_name: client.name,
        context: context,
        email_type: emailType
      });
      setDraftedEmail(response.data);
    } catch (error) {
      console.error('Error drafting email:', error);
      alert('Error generating email draft');
    } finally {
      setLoading(false);
    }
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Client Communications & Auto-Response</h2>
        <p className="text-slate-600 mt-2">AI-powered email drafting and communication tracking</p>
      </div>

      <Tabs defaultValue="draft" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="draft">Draft Email</TabsTrigger>
          <TabsTrigger value="history">Communication History</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="draft">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  AI Email Composer
                </CardTitle>
                <CardDescription>Generate context-aware emails using GPT-5.2</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-700">Select Client</Label>
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

                <div>
                  <Label className="text-slate-700">Email Type</Label>
                  <Select value={emailType} onValueChange={setEmailType}>
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue placeholder="Select email type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="follow_up">Follow-up / Check-in</SelectItem>
                      <SelectItem value="response">Response to Query</SelectItem>
                      <SelectItem value="innovation_update">Innovation Update</SelectItem>
                      <SelectItem value="policy_alert">Policy Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-700">Context / Details</Label>
                  <Textarea
                    placeholder="E.g., Following up on last week's QBR discussion about expanding to new locations..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={5}
                    className="bg-white border-slate-300"
                  />
                </div>

                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700" 
                  onClick={handleDraftEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Email Draft
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>AI-generated draft ready for review</CardDescription>
              </CardHeader>
              <CardContent>
                {!draftedEmail ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Email draft will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-700">Subject</Label>
                      <Input value={draftedEmail.subject} className="bg-slate-50 border-slate-300" readOnly />
                    </div>
                    <div>
                      <Label className="text-slate-700">Body</Label>
                      <Textarea
                        value={draftedEmail.body}
                        rows={12}
                        className="bg-slate-50 border-slate-300 font-sans"
                        readOnly
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        Edit
                      </Button>
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>
                {selectedClientData ? `All communications with ${selectedClientData.name}` : 'Select a client'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {communications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No communications recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-slate-700">{comm.comm_type}</Badge>
                          <Badge className={
                            comm.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                            comm.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            {comm.sentiment}
                          </Badge>
                        </div>
                        <span className="text-sm text-slate-500">{new Date(comm.created_at).toLocaleDateString()}</span>
                      </div>
                      {comm.subject && <h4 className="font-semibold text-slate-900 mb-2">{comm.subject}</h4>}
                      <p className="text-slate-600 text-sm mb-2">{comm.summary}</p>
                      {comm.action_items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-sm font-medium text-slate-700 mb-1">Action Items:</p>
                          <ul className="list-disc list-inside text-sm text-slate-600">
                            {comm.action_items.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Weekly Client Summary</CardTitle>
              <CardDescription>AI-generated intelligence report from call transcripts and emails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Generate AI-powered weekly summary</p>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationsPage;