import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Plus, AlertTriangle, ChevronLeft, ChevronRight, Clock, Users, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddReview, setShowAddReview] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [reviewType, setReviewType] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [selectedMember, currentDate]);

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

  // Calendar generation
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getReviewsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reviews.filter(review => review.scheduled_date === dateStr && review.status === 'scheduled');
  };

  const hasConflictOnDate = (date) => {
    const dayReviews = getReviewsForDate(date);
    if (dayReviews.length < 2) return false;
    
    // Check if any attendees overlap
    for (let i = 0; i < dayReviews.length; i++) {
      for (let j = i + 1; j < dayReviews.length; j++) {
        const overlap = dayReviews[i].attendees.some(a => dayReviews[j].attendees.includes(a));
        if (overlap) {
          // Check if times actually conflict
          const time1 = dayReviews[i].scheduled_time;
          const time2 = dayReviews[j].scheduled_time;
          if (time1 === time2) return true;
        }
      }
    }
    return false;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getReviewTypeColor = (type) => {
    const colors = {
      weekly: 'bg-blue-500',
      monthly: 'bg-purple-500',
      qbr: 'bg-emerald-500'
    };
    return colors[type] || 'bg-slate-500';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Cross-Client Review Calendar</h2>
        <p className="text-slate-600 mt-2">Monthly calendar view with automatic conflict detection</p>
      </div>

      <div className=\"flex items-center justify-between mb-6\">
        <div className=\"flex items-center gap-4\">
          <div>
            <Label className=\"text-slate-700 mb-2 block\">Filter by Team Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className=\"w-64 bg-white border-slate-300\">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className=\"bg-white\">
                <SelectItem value=\"all\">All Team Members</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={showAddReview} onOpenChange={setShowAddReview}>
          <DialogTrigger asChild>
            <Button className=\"bg-emerald-600 hover:bg-emerald-700\">
              <Plus className=\"h-4 w-4 mr-2\" />
              Schedule Review
            </Button>
          </DialogTrigger>
          <DialogContent className=\"bg-white max-w-2xl\">
            <DialogHeader>
              <DialogTitle className=\"text-slate-900\">Schedule Client Review</DialogTitle>
              <DialogDescription className=\"text-slate-600\">
                Add a new review meeting with automatic conflict detection
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddReview}>
              <div className=\"space-y-4 py-4\">
                <div className=\"grid grid-cols-2 gap-4\">
                  <div>
                    <Label className=\"text-slate-700\">Client</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient} required>
                      <SelectTrigger className=\"bg-white border-slate-300\">
                        <SelectValue placeholder=\"Select client\" />
                      </SelectTrigger>
                      <SelectContent className=\"bg-white\">
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className=\"text-slate-700\">Review Type</Label>
                    <Select value={reviewType} onValueChange={setReviewType} required>
                      <SelectTrigger className=\"bg-white border-slate-300\">
                        <SelectValue placeholder=\"Select type\" />
                      </SelectTrigger>
                      <SelectContent className=\"bg-white\">
                        <SelectItem value=\"weekly\">Weekly Review</SelectItem>
                        <SelectItem value=\"monthly\">Monthly Review</SelectItem>
                        <SelectItem value=\"qbr\">Quarterly Business Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className=\"grid grid-cols-3 gap-4\">
                  <div>
                    <Label htmlFor=\"date\" className=\"text-slate-700\">Date</Label>
                    <Input id=\"date\" name=\"date\" type=\"date\" className=\"bg-white border-slate-300\" required />
                  </div>
                  <div>
                    <Label htmlFor=\"time\" className=\"text-slate-700\">Time</Label>
                    <Input id=\"time\" name=\"time\" type=\"time\" className=\"bg-white border-slate-300\" required />
                  </div>
                  <div>
                    <Label htmlFor=\"duration\" className=\"text-slate-700\">Duration (min)</Label>
                    <Input id=\"duration\" name=\"duration\" type=\"number\" defaultValue=\"60\" className=\"bg-white border-slate-300\" required />
                  </div>
                </div>
                <div>
                  <Label className=\"text-slate-700 mb-2 block\">Select Attendees</Label>
                  <div className=\"grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3\">
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
                        <div className=\"font-medium text-slate-900 text-sm\">{member.name}</div>
                        <div className=\"text-xs text-slate-600\">{member.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {conflicts.length > 0 && (
                  <div className=\"p-3 bg-amber-50 border border-amber-200 rounded-lg\">
                    <div className=\"flex items-center gap-2 text-amber-800 mb-2\">
                      <AlertTriangle className=\"h-4 w-4\" />
                      <span className=\"font-semibold\">Scheduling Conflicts Detected</span>
                    </div>
                    <div className=\"text-sm text-amber-700\">
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
                <Button type=\"button\" variant=\"outline\" onClick={() => setShowAddReview(false)}>Cancel</Button>
                <Button type=\"submit\" className=\"bg-emerald-600 hover:bg-emerald-700\">
                  Schedule Review
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className=\"bg-white border-slate-200\">
        <CardHeader>
          <div className=\"flex items-center justify-between\">
            <CardTitle className=\"flex items-center gap-2\">
              <CalendarIcon className=\"h-5 w-5 text-emerald-600\" />
              {monthName}
            </CardTitle>
            <div className=\"flex items-center gap-2\">
              <Button variant=\"outline\" size=\"sm\" onClick={previousMonth}>
                <ChevronLeft className=\"h-4 w-4\" />
              </Button>
              <Button variant=\"outline\" size=\"sm\" onClick={nextMonth}>
                <ChevronRight className=\"h-4 w-4\" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className=\"border border-slate-200 rounded-lg overflow-hidden\">
            {/* Week day headers */}
            <div className=\"grid grid-cols-7 bg-slate-100\">
              {weekDays.map(day => (
                <div key={day} className=\"p-2 text-center font-semibold text-slate-700 text-sm border-r border-slate-200 last:border-r-0\">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className=\"grid grid-cols-7\">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className=\"min-h-24 border-r border-b border-slate-200 bg-slate-50\"></div>;
                }
                
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayReviews = getReviewsForDate(date);
                const hasConflict = hasConflictOnDate(date);
                const isToday = new Date().toDateString() === date.toDateString();
                
                return (
                  <div
                    key={day}
                    className={`min-h-24 border-r border-b border-slate-200 p-2 hover:bg-slate-50 transition-colors ${
                      isToday ? 'bg-blue-50' : 'bg-white'
                    }`}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div className=\"flex items-start justify-between mb-1\">
                      <span className={`text-sm font-semibold ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                        {day}
                      </span>
                      {hasConflict && (
                        <AlertTriangle className=\"h-4 w-4 text-red-600\" title=\"Scheduling conflict\" />
                      )}
                    </div>
                    <div className=\"space-y-1\">
                      {dayReviews.slice(0, 3).map((review) => (
                        <div
                          key={review.id}
                          className={`text-xs p-1 rounded text-white ${getReviewTypeColor(review.review_type)} cursor-pointer hover:opacity-80`}
                          title={`${review.client_name} - ${review.scheduled_time}`}
                        >
                          <div className=\"font-medium truncate\">{review.scheduled_time}</div>
                          <div className=\"truncate\">{review.client_name}</div>
                        </div>
                      ))}
                      {dayReviews.length > 3 && (
                        <div className=\"text-xs text-slate-600 font-medium\">
                          +{dayReviews.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className=\"mt-4 flex items-center gap-6 text-sm\">
            <div className=\"flex items-center gap-2\">
              <div className=\"w-3 h-3 rounded bg-blue-500\"></div>
              <span className=\"text-slate-700\">Weekly Review</span>
            </div>
            <div className=\"flex items-center gap-2\">
              <div className=\"w-3 h-3 rounded bg-purple-500\"></div>
              <span className=\"text-slate-700\">Monthly Review</span>
            </div>
            <div className=\"flex items-center gap-2\">
              <div className=\"w-3 h-3 rounded bg-emerald-500\"></div>
              <span className=\"text-slate-700\">QBR</span>
            </div>
            <div className=\"flex items-center gap-2\">
              <AlertTriangle className=\"h-4 w-4 text-red-600\" />
              <span className=\"text-slate-700\">Conflict Detected</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
