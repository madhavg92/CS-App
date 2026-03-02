import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Plus, Trash2, Check, X, RefreshCw, Shield, Key, Mail, Calendar, Database, Cloud } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AVAILABLE_INTEGRATIONS = [
  {
    name: 'microsoft_graph',
    displayName: 'Microsoft Graph (Outlook, Calendar, Teams)',
    icon: Mail,
    fields: [
      { name: 'client_id', label: 'Client ID', type: 'text', required: true },
      { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { name: 'tenant_id', label: 'Tenant ID', type: 'text', required: true }
    ],
    description: 'Connect to Microsoft 365 for email, calendar, and Teams integration'
  },
  {
    name: 'google_calendar',
    displayName: 'Google Calendar',
    icon: Calendar,
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true },
      { name: 'client_id', label: 'OAuth Client ID', type: 'text', required: false },
      { name: 'client_secret', label: 'OAuth Client Secret', type: 'password', required: false }
    ],
    description: 'Sync meetings and reviews with Google Calendar'
  },
  {
    name: 'salesforce',
    displayName: 'Salesforce CRM',
    icon: Database,
    fields: [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'security_token', label: 'Security Token', type: 'password', required: true },
      { name: 'instance_url', label: 'Instance URL', type: 'text', required: true, placeholder: 'https://yourinstance.salesforce.com' }
    ],
    description: 'Sync client data with Salesforce CRM'
  },
  {
    name: 'slack',
    displayName: 'Slack',
    icon: Cloud,
    fields: [
      { name: 'bot_token', label: 'Bot Token', type: 'password', required: true },
      { name: 'webhook_url', label: 'Webhook URL', type: 'text', required: false }
    ],
    description: 'Send notifications and alerts to Slack channels'
  },
  {
    name: 'twilio',
    displayName: 'Twilio SMS',
    icon: Mail,
    fields: [
      { name: 'account_sid', label: 'Account SID', type: 'text', required: true },
      { name: 'auth_token', label: 'Auth Token', type: 'password', required: true },
      { name: 'phone_number', label: 'Twilio Phone Number', type: 'text', required: true }
    ],
    description: 'Send SMS notifications for urgent alerts'
  }
];

const SettingsPage = () => {
  const [integrations, setIntegrations] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [formData, setFormData] = useState({});
  const [testingId, setTestingId] = useState(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await axios.get(`${API}/integrations`);
      setIntegrations(response.data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const handleAddIntegration = async () => {
    if (!selectedIntegration) return;

    const integrationTemplate = AVAILABLE_INTEGRATIONS.find(i => i.name === selectedIntegration);
    const credentials = {};
    
    integrationTemplate.fields.forEach(field => {
      if (formData[field.name]) {
        credentials[field.name] = formData[field.name];
      }
    });

    try {
      await axios.post(`${API}/integrations`, {
        integration_name: selectedIntegration,
        display_name: integrationTemplate.displayName,
        credentials,
        config: {}
      });
      
      setShowAddDialog(false);
      setSelectedIntegration(null);
      setFormData({});
      fetchIntegrations();
    } catch (error) {
      console.error('Error adding integration:', error);
      alert('Error adding integration');
    }
  };

  const handleToggleEnabled = async (integrationId, currentStatus) => {
    try {
      await axios.patch(`${API}/integrations/${integrationId}`, {
        is_enabled: !currentStatus
      });
      fetchIntegrations();
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  };

  const handleTestConnection = async (integrationId) => {
    setTestingId(integrationId);
    try {
      const response = await axios.post(`${API}/integrations/${integrationId}/test`);
      alert(response.data.status === 'connected' ? 'Connection successful!' : `Connection failed: ${response.data.message}`);
      fetchIntegrations();
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Error testing connection');
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteIntegration = async (integrationId) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      await axios.delete(`${API}/integrations/${integrationId}`);
      fetchIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      connected: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Check },
      error: { bg: 'bg-red-100 text-red-700 border-red-200', icon: X },
      not_configured: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: SettingsIcon }
    };
    
    const style = styles[status] || styles.not_configured;
    const Icon = style.icon;
    
    return (
      <Badge className={`${style.bg} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const configuredIntegrations = integrations.length;
  const activeIntegrations = integrations.filter(i => i.is_enabled).length;
  const connectedIntegrations = integrations.filter(i => i.connection_status === 'connected').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-emerald-600" />
          <h2 className="text-3xl font-bold text-slate-900">Super Admin Settings</h2>
        </div>
        <p className="text-slate-600">Manage API integrations and system-wide configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Configured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{configuredIntegrations}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{activeIntegrations}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{connectedIntegrations}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="integrations">API Integrations</TabsTrigger>
          <TabsTrigger value="available">Available Integrations</TabsTrigger>
          <TabsTrigger value="flows">Data Flows & Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configured Integrations</CardTitle>
                  <CardDescription>Manage your API connections and credentials</CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Integration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">Add New Integration</DialogTitle>
                      <DialogDescription className="text-slate-600">
                        Configure a new API integration
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-slate-700">Select Integration</Label>
                        <select
                          className="w-full p-2 border border-slate-300 rounded-md"
                          value={selectedIntegration || ''}
                          onChange={(e) => {
                            setSelectedIntegration(e.target.value);
                            setFormData({});
                          }}
                        >
                          <option value="">Choose an integration...</option>
                          {AVAILABLE_INTEGRATIONS.map((integration) => (
                            <option key={integration.name} value={integration.name}>
                              {integration.displayName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedIntegration && (
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                          {AVAILABLE_INTEGRATIONS.find(i => i.name === selectedIntegration)?.fields.map((field) => (
                            <div key={field.name}>
                              <Label className="text-slate-700">
                                {field.label}
                                {field.required && <span className="text-red-600 ml-1">*</span>}
                              </Label>
                              <Input
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formData[field.name] || ''}
                                onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                                className="bg-white border-slate-300"
                                required={field.required}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700" 
                        onClick={handleAddIntegration}
                        disabled={!selectedIntegration}
                      >
                        Add Integration
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {integrations.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No integrations configured yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => {
                    const template = AVAILABLE_INTEGRATIONS.find(i => i.name === integration.integration_name);
                    const Icon = template?.icon || Database;
                    
                    return (
                      <div key={integration.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                              <Icon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-slate-900">{integration.display_name}</h4>
                                {getStatusBadge(integration.connection_status)}
                                {integration.is_enabled && (
                                  <Badge className="bg-emerald-100 text-emerald-700">Enabled</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mb-3">{template?.description}</p>
                              {integration.last_tested && (
                                <p className="text-xs text-slate-500">
                                  Last tested: {new Date(integration.last_tested).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={integration.is_enabled}
                              onCheckedChange={() => handleToggleEnabled(integration.id, integration.is_enabled)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConnection(integration.id)}
                              disabled={testingId === integration.id}
                            >
                              <RefreshCw className={`h-4 w-4 ${testingId === integration.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteIntegration(integration.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
              <CardDescription>Third-party services you can connect to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_INTEGRATIONS.map((integration) => {
                  const Icon = integration.icon;
                  const isConfigured = integrations.some(i => i.integration_name === integration.name);
                  
                  return (
                    <div key={integration.name} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-1">{integration.displayName}</h4>
                          <p className="text-sm text-slate-600 mb-2">{integration.description}</p>
                          {isConfigured && (
                            <Badge className="bg-emerald-100 text-emerald-700">Configured</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
