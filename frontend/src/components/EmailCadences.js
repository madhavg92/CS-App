import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Calendar, Mail, Send, Pause, Play, Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const EmailCadences = ({ clientId, clientName }) => {
  const [cadences, setCadences] = useState([]);
  const [showAddCadence, setShowAddCadence] = useState(false);
  const [cadenceType, setCadenceType] = useState('');
  const [autoSend, setAutoSend] = useState(false);

  useEffect(() => {
    fetchCadences();
  }, [clientId]);

  const fetchCadences = async () => {
    try {
      const response = await axios.get(`${API}/email-cadences?client_id=${clientId}`);
      setCadences(response.data);
    } catch (error) {
      console.error('Error fetching cadences:', error);
    }
  };

  const handleAddCadence = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await axios.post(`${API}/email-cadences`, {
        client_id: clientId,
        client_name: clientName,
        cadence_type: cadenceType,
        frequency_days: parseInt(formData.get('frequency')),
        auto_send: autoSend
      });
      setShowAddCadence(false);
      setCadenceType('');
      setAutoSend(false);
      fetchCadences();
    } catch (error) {
      console.error('Error adding cadence:', error);
    }
  };

  const handleToggleCadence = async (cadenceId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await axios.patch(`${API}/email-cadences/${cadenceId}?status=${newStatus}`);
      fetchCadences();
    } catch (error) {
      console.error('Error toggling cadence:', error);
    }
  };

  const handleSendNow = async (cadenceId) => {
    try {
      await axios.post(`${API}/email-cadences/${cadenceId}/send`);
      alert('Email sent successfully!');
      fetchCadences();
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const getCadenceLabel = (type) => {
    const labels = {
      'monthly_checkin': 'Monthly Check-in',
      'qbr_reminder': 'QBR Reminder',
      'renewal_reminder': 'Renewal Reminder'
    };
    return labels[type] || type;
  };

  return (
    <Card className="bg-white border border-slate-200 shadow-sm" data-testid="email-cadences-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email Cadences</CardTitle>
            <CardDescription>Automated email sequences for recurring touchpoints</CardDescription>
          </div>
          <Dialog open={showAddCadence} onOpenChange={setShowAddCadence}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="add-cadence-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Cadence
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-cadence-dialog">
              <DialogHeader>
                <DialogTitle>Create Email Cadence</DialogTitle>
                <DialogDescription>Set up automated email sequence</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCadence}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Cadence Type</Label>
                    <Select value={cadenceType} onValueChange={setCadenceType} required>
                      <SelectTrigger data-testid="cadence-type-select">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly_checkin">Monthly Check-in</SelectItem>
                        <SelectItem value="qbr_reminder">QBR Reminder</SelectItem>
                        <SelectItem value="renewal_reminder">Renewal Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency (days)</Label>
                    <Input id="frequency" name="frequency" type="number" defaultValue="30" required data-testid="frequency-input" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-send">Auto-send emails (Phase 3)</Label>
                    <Switch id="auto-send" checked={autoSend} onCheckedChange={setAutoSend} data-testid="auto-send-switch" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="submit-cadence-btn">Create Cadence</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cadences.length === 0 ? (
            <p className="text-slate-500 text-center py-8" data-testid="no-cadences-message">No email cadences configured yet.</p>
          ) : (
            cadences.map((cadence) => (
              <div key={cadence.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`cadence-card-${cadence.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{getCadenceLabel(cadence.cadence_type)}</h4>
                      <Badge className={cadence.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                        {cadence.status}
                      </Badge>
                      {cadence.auto_send && (
                        <Badge className="bg-blue-100 text-blue-700">Auto-send</Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>Frequency: Every {cadence.frequency_days} days</p>
                      <p>Next scheduled: {new Date(cadence.next_scheduled).toLocaleDateString()}</p>
                      {cadence.last_sent && <p>Last sent: {new Date(cadence.last_sent).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleCadence(cadence.id, cadence.status)}
                      data-testid={`toggle-cadence-${cadence.id}`}
                    >
                      {cadence.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleSendNow(cadence.id)}
                      data-testid={`send-cadence-${cadence.id}`}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
