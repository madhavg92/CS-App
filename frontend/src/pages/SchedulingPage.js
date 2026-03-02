import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Sparkles, Send, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SchedulingPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [duration, setDuration] = useState('60');
  const [dates, setDates] = useState('');
  const [attendees, setAttendees] = useState('');
  const [schedulingResult, setSchedulingResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

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

  const handleScheduleMeeting = async () => {
    if (!selectedClient || !meetingType || !dates || !attendees) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      const response = await axios.post(`${API}/schedule-meeting`, {
        client_id: selectedClient,
        client_name: client.name,
        meeting_type: meetingType,
        preferred_dates: dates.split(',').map(d => d.trim()),
        duration_minutes: parseInt(duration),
        attendees: attendees.split(',').map(a => a.trim())
      });
      setSchedulingResult(response.data);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Error generating schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">AI Scheduling Assistant</h2>
        <p className="text-slate-600 mt-2">Full EA-style automation for meeting coordination</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Schedule Meeting
            </CardTitle>
            <CardDescription>AI will suggest optimal times and draft invites</CardDescription>
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
              <Label className="text-slate-700">Meeting Type</Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="qbr">Quarterly Business Review</SelectItem>
                  <SelectItem value="check_in">Check-in Call</SelectItem>
                  <SelectItem value="demo">Product Demo</SelectItem>
                  <SelectItem value="implementation">Implementation Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-700">Duration (minutes)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-white border-slate-300"
              />
            </div>

            <div>
              <Label className="text-slate-700">Preferred Dates (comma-separated)</Label>
              <Input
                placeholder="2026-03-15, 2026-03-16, 2026-03-17"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                className="bg-white border-slate-300"
              />
            </div>

            <div>
              <Label className="text-slate-700">Attendees (comma-separated)</Label>
              <Input
                placeholder="John Doe, Jane Smith"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                className="bg-white border-slate-300"
              />
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={handleScheduleMeeting}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Generating Schedule...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Schedule with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Scheduling Results</CardTitle>
            <CardDescription>AI-suggested times and meeting invites</CardDescription>
          </CardHeader>
          <CardContent>
            {!schedulingResult ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Schedule suggestions will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Suggested Times
                  </h4>
                  <div className="space-y-2">
                    {schedulingResult.suggested_times.map((slot, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-blue-900">{slot.date} at {slot.time}</p>
                            <p className="text-sm text-blue-700">{slot.reason}</p>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-slate-700">Email Draft</Label>
                  <Textarea
                    value={schedulingResult.email_draft}
                    rows={6}
                    className="bg-slate-50 border-slate-300 font-sans"
                    readOnly
                  />
                </div>

                <div>
                  <Label className="text-slate-700">Calendar Invite</Label>
                  <Textarea
                    value={schedulingResult.calendar_invite}
                    rows={4}
                    className="bg-slate-50 border-slate-300 font-sans"
                    readOnly
                  />
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send Invites
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchedulingPage;