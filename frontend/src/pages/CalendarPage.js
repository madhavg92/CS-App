import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Plus, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CalendarPage = () => {
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedMember, setSelectedMember] = useState('all');
  const [showAddReview, setShowAddReview] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [reviewType, setReviewType] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [selectedMember]);

  const fetchData = async () => {
    try {
      const [clientsRes, membersRes] = await Promise.all([
        axios.get(`${API}/clients`),
        axios.get(`${API}/team-members`)
      ]);
      setClients(clientsRes.data);
      setTeamMembers(membersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const params = selectedMember !== 'all' ? `?attendee_id=${selectedMember}` : '';
      const response = await axios.get(`${API}/scheduled-reviews${params}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleCheckConflicts = async (date, time, attendeeIds) => {
    try {
      const response = await axios.get(`${API}/calendar/conflicts`, {
        params: {
          date,
          time,
          attendee_ids: attendeeIds.join(',')
        }
      });
      setConflicts(response.data.conflicts);
      return response.data.has_conflicts;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return false;
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const date = formData.get('date');
    const time = formData.get('time');
    
    // Check for conflicts
    const hasConflicts = await handleCheckConflicts(date, time, selectedAttendees);
    
    if (hasConflicts) {
      if (!confirm('There are scheduling conflicts with some attendees. Do you want to proceed anyway?')) {
        return;
      }
    }

    try {
      const client = clients.find(c => c.id === selectedClient);
      await axios.post(`${API}/scheduled-reviews`, {
        client_id: selectedClient,
        client_name: client.name,
        review_type: reviewType,
        scheduled_date: date,
        scheduled_time: time,
        duration_minutes: parseInt(formData.get('duration')),
        attendee_ids: selectedAttendees
      });
      
      setShowAddReview(false);
      setSelectedClient('');
      setReviewType('');
      setSelectedAttendees([]);
      setConflicts([]);
      fetchReviews();
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  const toggleAttendeeSelection = (memberId) => {
    setSelectedAttendees(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const groupReviewsByWeek = () => {
    const grouped = {};
    reviews.forEach(review => {
      const date = new Date(review.scheduled_date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(review);
    });
    return grouped;
  };

  const weeklyReviews = groupReviewsByWeek();
  const weeks = Object.keys(weeklyReviews).sort();

  const getReviewTypeColor = (type) => {
    const colors = {
      weekly: 'bg-blue-100 text-blue-700',
      monthly: 'bg-purple-100 text-purple-700',
      qbr: 'bg-emerald-100 text-emerald-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Cross-Client Review Calendar</h2>
        <p className="text-slate-600 mt-2">Unified calendar view across all clients to prevent scheduling conflicts</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <Label className="text-slate-700 mb-2 block">Filter by Team Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="w-64 bg-white border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Team Members</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="pt-8">
            <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
              {reviews.length} scheduled reviews
            </Badge>
          </div>
        </div>

        <Dialog open={showAddReview} onOpenChange={setShowAddReview}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Review
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Schedule Client Review</DialogTitle>
              <DialogDescription className="text-slate-600">
                Add a new review meeting with conflict detection
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddReview}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700">Client</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient} required>
                      <SelectTrigger className="bg-white border-slate-300">
                        <SelectValue placeholder="Select client" />
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
                    <Label className="text-slate-700">Review Type</Label>
                    <Select value={reviewType} onValueChange={setReviewType} required>
                      <SelectTrigger className="bg-white border-slate-300">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="weekly">Weekly Review</SelectItem>
                        <SelectItem value="monthly">Monthly Review</SelectItem>
                        <SelectItem value="qbr">Quarterly Business Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-slate-700">Date</Label>
                    <Input id="date" name="date" type="date" className="bg-white border-slate-300" required />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-slate-700">Time</Label>
                    <Input id="time" name="time" type="time" className="bg-white border-slate-300" required />
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-slate-700">Duration (min)</Label>
                    <Input id="duration" name="duration" type="number" defaultValue="60" className="bg-white border-slate-300" required />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700 mb-2 block">Select Attendees</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => toggleAttendeeSelection(member.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedAttendees.includes(member.id)
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-medium text-slate-900 text-sm">{member.name}</div>
                        <div className="text-xs text-slate-600">{member.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {conflicts.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-semibold">Scheduling Conflicts Detected</span>
                    </div>
                    <div className="text-sm text-amber-700">
                      {conflicts.map((conflict, idx) => (
                        <div key={idx}>
                          Conflict with {conflict.review.client_name} at {conflict.review.scheduled_time}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddReview(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Schedule Review
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {weeks.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No reviews scheduled yet</p>
            </CardContent>
          </Card>
        ) : (
          weeks.map(weekStart => {
            const weekReviews = weeklyReviews[weekStart];
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            return (
              <Card key={weekStart} className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle>
                    Week of {new Date(weekStart).toLocaleDateString()} - {weekEnd.toLocaleDateString()}
                  </CardTitle>
                  <CardDescription>
                    {weekReviews.length} review{weekReviews.length !== 1 ? 's' : ''} scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weekReviews.sort((a, b) => {
                      const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date);
                      return dateCompare !== 0 ? dateCompare : a.scheduled_time.localeCompare(b.scheduled_time);
                    }).map((review) => (
                      <div key={review.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-900">{review.client_name}</h4>
                              <Badge className={getReviewTypeColor(review.review_type)}>
                                {review.review_type}
                              </Badge>
                              {review.status === 'completed' && (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-6 text-sm text-slate-600 mb-3">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{new Date(review.scheduled_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{review.scheduled_time} ({review.duration_minutes} min)</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-slate-500" />
                              <div className="flex flex-wrap gap-1">
                                {review.attendee_names.map((name, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
