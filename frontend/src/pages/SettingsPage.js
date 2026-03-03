import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings as SettingsIcon, Users, Bell, Shield, Save, 
  UserPlus, Edit2, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('alerts');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Alert thresholds
  const [thresholds, setThresholds] = useState({
    engagement_gap_decision_maker_days: 14,
    engagement_gap_influencer_days: 30,
    renewal_alert_60_days: true,
    renewal_alert_30_days: true,
    renewal_alert_15_days: true,
    performance_decline_threshold_pct: 5.0,
    followup_overdue_days: 7
  });
  
  // Users
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'csm' });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [thresholdsRes, usersRes] = await Promise.all([
        axios.get(`${API}/settings/alert-thresholds`),
        axios.get(`${API}/users`)
      ]);
      setThresholds(thresholdsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveThresholds = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/settings/alert-thresholds`, thresholds);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving thresholds:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await axios.post(`${API}/auth/register`, newUser);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'csm' });
      fetchData();
    } catch (error) {
      console.error('Error adding user:', error);
      alert(error.response?.data?.detail || 'Failed to add user');
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await axios.patch(`${API}/users/${userId}`, null, { params: updates });
      setEditingUser(null);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      cs_lead: 'bg-purple-100 text-purple-700',
      csm: 'bg-blue-100 text-blue-700',
      ops: 'bg-green-100 text-green-700'
    };
    return styles[role] || 'bg-slate-100 text-slate-600';
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
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-[#1B4F72]" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">System configuration and user management</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alert Thresholds
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
        </TabsList>

        {/* Alert Thresholds Tab */}
        <TabsContent value="alerts" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Alert Threshold Configuration</CardTitle>
              <CardDescription>Configure when alerts are triggered for all clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Engagement Gap */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#1B4F72]" />
                  Engagement Gap Alerts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label>Decision Maker Gap (days)</Label>
                    <Input
                      type="number"
                      value={thresholds.engagement_gap_decision_maker_days}
                      onChange={(e) => setThresholds({
                        ...thresholds,
                        engagement_gap_decision_maker_days: parseInt(e.target.value)
                      })}
                      data-testid="threshold-decision-maker"
                    />
                    <p className="text-xs text-slate-500">Alert if no contact with decision makers for this many days</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Influencer Gap (days)</Label>
                    <Input
                      type="number"
                      value={thresholds.engagement_gap_influencer_days}
                      onChange={(e) => setThresholds({
                        ...thresholds,
                        engagement_gap_influencer_days: parseInt(e.target.value)
                      })}
                      data-testid="threshold-influencer"
                    />
                    <p className="text-xs text-slate-500">Alert if no contact with influencers for this many days</p>
                  </div>
                </div>
              </div>

              {/* Renewal Alerts */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#1B4F72]" />
                  Renewal Alerts
                </h3>
                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>60 Days Before Renewal</Label>
                      <p className="text-xs text-slate-500">Medium severity alert</p>
                    </div>
                    <Switch
                      checked={thresholds.renewal_alert_60_days}
                      onCheckedChange={(v) => setThresholds({...thresholds, renewal_alert_60_days: v})}
                      data-testid="toggle-renewal-60"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>30 Days Before Renewal</Label>
                      <p className="text-xs text-slate-500">High severity alert</p>
                    </div>
                    <Switch
                      checked={thresholds.renewal_alert_30_days}
                      onCheckedChange={(v) => setThresholds({...thresholds, renewal_alert_30_days: v})}
                      data-testid="toggle-renewal-30"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>15 Days Before Renewal</Label>
                      <p className="text-xs text-slate-500">Critical severity alert</p>
                    </div>
                    <Switch
                      checked={thresholds.renewal_alert_15_days}
                      onCheckedChange={(v) => setThresholds({...thresholds, renewal_alert_15_days: v})}
                      data-testid="toggle-renewal-15"
                    />
                  </div>
                </div>
              </div>

              {/* Performance Alerts */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#1B4F72]" />
                  Performance Alerts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label>Performance Decline Threshold (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={thresholds.performance_decline_threshold_pct}
                      onChange={(e) => setThresholds({
                        ...thresholds,
                        performance_decline_threshold_pct: parseFloat(e.target.value)
                      })}
                      data-testid="threshold-performance"
                    />
                    <p className="text-xs text-slate-500">Alert if recovery rate drops by this percentage</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Overdue (days)</Label>
                    <Input
                      type="number"
                      value={thresholds.followup_overdue_days}
                      onChange={(e) => setThresholds({
                        ...thresholds,
                        followup_overdue_days: parseInt(e.target.value)
                      })}
                      data-testid="threshold-followup"
                    />
                    <p className="text-xs text-slate-500">Alert if follow-up is open longer than this</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  className="bg-[#1B4F72] hover:bg-[#154360]"
                  onClick={handleSaveThresholds}
                  disabled={saving}
                  data-testid="save-thresholds"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="mt-6">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage team members and their access levels</CardDescription>
                </div>
                <Button 
                  className="bg-[#1B4F72] hover:bg-[#154360]"
                  onClick={() => setShowAddUser(true)}
                  data-testid="add-user-btn"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((u) => (
                  <div 
                    key={u.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between"
                    data-testid={`user-${u.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1B4F72] flex items-center justify-center text-white font-medium">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{u.name}</h4>
                          <Badge className={getRoleBadge(u.role)}>{u.role.replace('_', ' ')}</Badge>
                          {!u.is_active && <Badge className="bg-red-100 text-red-700">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    
                    {u.id !== user?.id && (
                      <div className="flex items-center gap-2">
                        <Select 
                          value={u.role}
                          onValueChange={(v) => handleUpdateUser(u.id, { role: v })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cs_lead">CS Lead</SelectItem>
                            <SelectItem value="csm">CSM</SelectItem>
                            <SelectItem value="ops">Ops</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant={u.is_active ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleUpdateUser(u.id, { is_active: !u.is_active })}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Role Permissions Info */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-900 mb-3">Role Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Badge className="bg-purple-100 text-purple-700 mb-2">CS Lead</Badge>
                    <ul className="space-y-1 text-slate-600">
                      <li>• Full access to all features</li>
                      <li>• Configure alert thresholds</li>
                      <li>• Manage users</li>
                      <li>• View all clients</li>
                    </ul>
                  </div>
                  <div>
                    <Badge className="bg-blue-100 text-blue-700 mb-2">CSM</Badge>
                    <ul className="space-y-1 text-slate-600">
                      <li>• Access assigned clients only</li>
                      <li>• Generate drafts & reports</li>
                      <li>• Manage alerts & follow-ups</li>
                      <li>• Cannot modify settings</li>
                    </ul>
                  </div>
                  <div>
                    <Badge className="bg-green-100 text-green-700 mb-2">Ops</Badge>
                    <ul className="space-y-1 text-slate-600">
                      <li>• Read-only access</li>
                      <li>• View performance data</li>
                      <li>• View reports</li>
                      <li>• No communications access</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="Full name"
                data-testid="new-user-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="email@company.com"
                data-testid="new-user-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Minimum 6 characters"
                data-testid="new-user-password"
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({...newUser, role: v})}>
                <SelectTrigger data-testid="new-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs_lead">CS Lead</SelectItem>
                  <SelectItem value="csm">CSM</SelectItem>
                  <SelectItem value="ops">Ops</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button 
              className="bg-[#1B4F72] hover:bg-[#154360]"
              onClick={handleAddUser}
              disabled={!newUser.name || !newUser.email || !newUser.password}
              data-testid="create-user-btn"
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
