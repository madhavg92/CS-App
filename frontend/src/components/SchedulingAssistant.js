import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Calendar, Clock, Users, Send } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SchedulingAssistant = ({ clientId, clientName }) => {
  const [showScheduling, setShowScheduling] = useState(false);
  const [schedulingResult, setSchedulingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [meetingType, setMeetingType] = useState('');

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setLoading(true);

    try {
      const response = await axios.post(`${API}/schedule-meeting`, {
        client_id: clientId,
        client_name: clientName,
        meeting_type: meetingType,
        preferred_dates: formData.get('dates').split(',').map(d => d.trim()),
        duration_minutes: parseInt(formData.get('duration')),
        attendees: formData.get('attendees').split(',').map(a => a.trim())
      });
      setSchedulingResult(response.data);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white border border-slate-200 shadow-sm" data-testid="scheduling-assistant-card">
      <CardHeader>
        <CardTitle>AI Scheduling Assistant</CardTitle>
        <CardDescription>Automated meeting scheduling and coordination</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={showScheduling} onOpenChange={setShowScheduling}>
          <DialogTrigger asChild>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="open-scheduling-btn">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="scheduling-dialog">
            <DialogHeader>
              <DialogTitle>AI-Powered Meeting Scheduler</DialogTitle>
              <DialogDescription>Let AI handle the coordination</DialogDescription>
            </DialogHeader>
            {!schedulingResult ? (
              <form onSubmit={handleScheduleMeeting}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Meeting Type</Label>
                    <Select value={meetingType} onValueChange={setMeetingType} required>
                      <SelectTrigger data-testid="meeting-type-select">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qbr">Quarterly Business Review</SelectItem>
                        <SelectItem value="check_in">Check-in Call</SelectItem>
                        <SelectItem value="demo">Product Demo</SelectItem>
                        <SelectItem value="implementation">Implementation Planning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input id="duration" name="duration" type="number" defaultValue="60" required data-testid="duration-input" />
                  </div>
                  <div>
                    <Label htmlFor="dates">Preferred Dates (comma-separated, YYYY-MM-DD)</Label>
                    <Input id="dates" name="dates" placeholder="2026-03-15, 2026-03-16, 2026-03-17" required data-testid="dates-input" />
                  </div>
                  <div>
                    <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                    <Input id="attendees" name="attendees" placeholder="John Doe, Jane Smith" required data-testid="attendees-input" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading} data-testid="schedule-submit-btn">
                    {loading ? 'Scheduling...' : 'Generate Schedule'}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-6 py-4">
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
                  <h4 className="font-semibold text-slate-900 mb-2">Email Draft</h4>
                  <Textarea value={schedulingResult.email_draft} rows={6} className="font-sans" readOnly data-testid="scheduling-email-draft" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Calendar Invite</h4>
                  <Textarea value={schedulingResult.calendar_invite} rows={4} className="font-sans" readOnly data-testid="calendar-invite" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setSchedulingResult(null)} variant="outline" data-testid="back-scheduling-btn">Back</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="send-invites-btn">
                    <Send className="h-4 w-4 mr-2" />
                    Send Invites
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
