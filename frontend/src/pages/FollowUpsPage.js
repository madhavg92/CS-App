import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ListTodo, CheckCircle, Clock, Mail, Phone, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

  const handleComplete = async (followupId) => {
    try {
      await axios.patch(`${API}/followups/${followupId}?status=completed`);
      fetchFollowups();
    } catch (error) {
      console.error('Error completing follow-up:', error);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-700 border-red-200';
    if (priority === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Follow-up Items & Action Lists</h2>
        <p className="text-slate-600 mt-2">Prioritized action items for CS team with AI-suggested next steps</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="pending" data-testid="pending-followups-tab">Pending ({followups.filter(f => f.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="completed" data-testid="completed-followups-tab">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {followups.length === 0 ? (
          <Card className="bg-white border-slate-200 col-span-2">
            <CardContent className="py-12 text-center">
              <ListTodo className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600" data-testid="no-followups-message">No {filter} follow-ups.</p>
            </CardContent>
          </Card>
        ) : (
          followups.map((followup) => (
            <Card key={followup.id} className="bg-white border-slate-200 hover:shadow-md transition-shadow" data-testid={`followup-card-${followup.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle 
                      className="text-lg hover:text-emerald-600 cursor-pointer" 
                      onClick={() => navigate(`/client/${followup.client_id}`)}
                      data-testid={`followup-client-${followup.id}`}
                    >
                      {followup.client_name}
                    </CardTitle>
                    <CardDescription className="mt-1">{followup.description}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={getPriorityColor(followup.priority)}>
                      {followup.priority.toUpperCase()}
                    </Badge>
                    {followup.action_type === 'call' ? (
                      <Badge variant="outline" className="text-blue-700">
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-700">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-emerald-50 p-3 rounded-md border border-emerald-200 mb-3">
                  <p className="text-sm text-emerald-800">
                    <strong>AI Suggested Action:</strong> {followup.suggested_action}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Days Open: {followup.days_open}</span>
                  </div>
                  <span>Owner: {followup.owner}</span>
                </div>
                {followup.status === 'pending' && (
                  <Button 
                    size="sm" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700" 
                    onClick={() => handleComplete(followup.id)} 
                    data-testid={`complete-followup-${followup.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FollowUpsPage;