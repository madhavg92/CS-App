import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Phone, Mail, Clock, Check, ArrowUpRight, Sparkles, Filter,
  ListTodo, AlertCircle, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FollowUpsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [followups, setFollowups] = useState([]);
  const [filteredFollowups, setFilteredFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'open',
    category: 'all'
  });
  
  // Draft generation
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchFollowups();
  }, []);

  useEffect(() => {
    filterFollowups();
  }, [followups, filters]);

  const fetchFollowups = async () => {
    try {
      const response = await axios.get(`${API}/followups`);
      setFollowups(response.data);
    } catch (error) {
      console.error('Error fetching followups:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFollowups = () => {
    let filtered = [...followups];
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(f => f.status === filters.status);
    }
    if (filters.category !== 'all') {
      filtered = filtered.filter(f => f.category === filters.category);
    }
    
    // Already sorted by priority_score from API
    setFilteredFollowups(filtered);
  };

  const handleComplete = async (followupId) => {
    try {
      await axios.patch(`${API}/followups/${followupId}?status=completed`);
      fetchFollowups();
    } catch (error) {
      console.error('Error completing followup:', error);
    }
  };

  const handleGenerateDraft = async (followup) => {
    setSelectedFollowup(followup);
    setShowDraftDialog(true);
    setGenerating(true);
    setGeneratedDraft(null);
    
    try {
      const response = await axios.post(`${API}/followups/${followup.id}/generate-draft`);
      setGeneratedDraft(response.data);
    } catch (error) {
      console.error('Error generating draft:', error);
      setGeneratedDraft({ error: 'Failed to generate draft' });
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 7) return 'text-red-600';
    if (score >= 4) return 'text-amber-600';
    return 'text-green-600';
  };

  const getCategoryStyles = (category) => {
    if (category === 'call_required') {
      return {
        badge: 'bg-red-100 text-red-700 border-red-200',
        icon: Phone,
        iconColor: 'text-red-600'
      };
    }
    return {
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Mail,
      iconColor: 'text-blue-600'
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const stats = {
    total: followups.filter(f => f.status === 'open').length,
    callRequired: followups.filter(f => f.status === 'open' && f.category === 'call_required').length,
    emailSufficient: followups.filter(f => f.status === 'open' && f.category === 'email_sufficient').length,
    overdue: followups.filter(f => f.status === 'open' && f.days_open > 7).length
  };

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Follow-Ups</h1>
        <p className="text-slate-600 mt-1">Prioritized action items for your clients</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#85C1E9]/20 rounded-lg">
                <ListTodo className="h-5 w-5 text-[#1B4F72]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Open Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Phone className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.callRequired}</p>
                <p className="text-xs text-slate-500">Call Required</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.emailSufficient}</p>
                <p className="text-xs text-slate-500">Email OK</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.overdue}</p>
                <p className="text-xs text-slate-500">Overdue (7d+)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
          <SelectTrigger className="w-40 bg-white" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
          <SelectTrigger className="w-48 bg-white" data-testid="filter-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="call_required">Call Required</SelectItem>
            <SelectItem value="email_sufficient">Email Sufficient</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Follow-up List */}
      <div className="space-y-3">
        {filteredFollowups.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-3" />
              <p className="text-slate-600 font-medium">All caught up!</p>
              <p className="text-sm text-slate-400 mt-1">No follow-ups match your current filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredFollowups.map((followup, index) => {
            const categoryStyles = getCategoryStyles(followup.category);
            const CategoryIcon = categoryStyles.icon;
            
            return (
              <Card 
                key={followup.id}
                className={`bg-white hover:shadow-md transition-shadow ${
                  followup.days_open > 7 ? 'border-l-4 border-l-amber-400' : ''
                }`}
                data-testid={`followup-${followup.id}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    {/* Priority Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-red-500' : 
                      index === 1 ? 'bg-amber-500' : 
                      index < 5 ? 'bg-[#1B4F72]' : 'bg-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={categoryStyles.badge}>
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {followup.category === 'call_required' ? 'Call Required' : 'Email OK'}
                        </Badge>
                        <Badge variant={followup.status === 'completed' ? 'secondary' : 'outline'}>
                          {followup.status}
                        </Badge>
                        {followup.days_open > 7 && (
                          <Badge className="bg-amber-100 text-amber-700">Overdue</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <button 
                          className="font-medium text-[#1B4F72] hover:underline flex items-center gap-1"
                          onClick={() => navigate(`/clients/${followup.client_id}`)}
                        >
                          {followup.client_name}
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <p className="text-slate-700">{followup.description}</p>
                      <p className="text-sm text-slate-500 mt-1">{followup.suggested_action}</p>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {followup.days_open}d open
                        </span>
                        <span>Owner: {followup.owner}</span>
                        <span className={`font-medium ${getPriorityColor(followup.priority_score)}`}>
                          Score: {followup.priority_score?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {followup.status !== 'completed' && (
                      <div className="flex flex-col gap-2">
                        {followup.category === 'email_sufficient' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleGenerateDraft(followup)}
                            data-testid={`draft-${followup.id}`}
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            AI Draft
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleComplete(followup.id)}
                          data-testid={`complete-${followup.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Draft Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#1B4F72]" />
              AI-Generated Email Draft
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {generating ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72]"></div>
                <span className="ml-3 text-slate-600">Generating draft...</span>
              </div>
            ) : generatedDraft?.error ? (
              <div className="text-center py-8 text-red-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-3" />
                <p>{generatedDraft.error}</p>
              </div>
            ) : generatedDraft ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Subject</label>
                  <p className="mt-1 p-3 bg-slate-50 rounded-lg border">{generatedDraft.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Body</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border whitespace-pre-wrap text-sm">
                    {generatedDraft.body}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDraftDialog(false)}>Close</Button>
            {generatedDraft && !generatedDraft.error && (
              <Button 
                className="bg-[#1B4F72] hover:bg-[#154360]"
                onClick={() => {
                  navigate('/communications?type=draft');
                  setShowDraftDialog(false);
                }}
              >
                View in Drafts
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FollowUpsPage;
