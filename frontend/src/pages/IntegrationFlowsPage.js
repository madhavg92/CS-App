import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, ArrowRight, CheckCircle, AlertCircle, Mail, Calendar, Database, MessageSquare, Phone, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Integration Data Flow Mappings
const DATA_FLOWS = [
  {
    integration: 'microsoft_graph',
    name: 'Microsoft Graph',
    icon: Mail,
    flows: [
      {
        source: 'Outlook Emails',
        target: 'Communications History',
        description: 'Auto-import client emails with sentiment analysis',
        frequency: 'Every 15 minutes',
        direction: 'inbound'
      },
      {
        source: 'Outlook Calendar',
        target: 'Review Calendar',
        description: 'Sync scheduled client meetings and reviews',
        frequency: 'Real-time',
        direction: 'bidirectional'
      },
      {
        source: 'Teams Messages',
        target: 'Communications History',
        description: 'Track internal discussions about clients',
        frequency: 'Every 30 minutes',
        direction: 'inbound'
      }
    ]
  },
  {
    integration: 'google_calendar',
    name: 'Google Calendar',
    icon: Calendar,
    flows: [
      {
        source: 'Google Calendar Events',
        target: 'Review Calendar',
        description: 'Sync team member availability and meetings',
        frequency: 'Real-time',
        direction: 'bidirectional'
      },
      {
        source: 'Review Calendar',
        target: 'Google Calendar',
        description: 'Create calendar invites when scheduling reviews',
        frequency: 'Instant',
        direction: 'outbound'
      }
    ]
  },
  {
    integration: 'salesforce',
    name: 'Salesforce CRM',
    icon: Database,
    flows: [
      {
        source: 'Salesforce Accounts',
        target: 'Clients',
        description: 'Sync client organization data and contacts',
        frequency: 'Every hour',
        direction: 'bidirectional'
      },
      {
        source: 'Salesforce Notes',
        target: 'Communications',
        description: 'Import account notes and interactions',
        frequency: 'Every hour',
        direction: 'inbound'
      },
      {
        source: 'Performance Metrics',
        target: 'Salesforce Custom Objects',
        description: 'Push weekly performance reports to CRM',
        frequency: 'Weekly',
        direction: 'outbound'
      }
    ]
  },
  {
    integration: 'slack',
    name: 'Slack',
    icon: MessageSquare,
    flows: [
      {
        source: 'High Priority Alerts',
        target: 'Slack Channel',
        description: 'Send urgent alerts to #cs-alerts channel',
        frequency: 'Instant',
        direction: 'outbound'
      },
      {
        source: 'Daily Summary',
        target: 'Slack Channel',
        description: 'Post daily CS metrics to #cs-team',
        frequency: 'Daily at 9 AM',
        direction: 'outbound'
      },
      {
        source: 'Client Health Changes',
        target: 'Slack DM',
        description: 'Notify account owner when health score drops',
        frequency: 'Instant',
        direction: 'outbound'
      }
    ]
  },
  {
    integration: 'twilio',
    name: 'Twilio SMS',
    icon: Phone,
    flows: [
      {
        source: 'Critical Alerts',
        target: 'SMS to On-Call',
        description: 'Text on-call manager for critical escalations',
        frequency: 'Instant',
        direction: 'outbound'
      },
      {
        source: 'Meeting Reminders',
        target: 'SMS to Attendees',
        description: 'Send review reminders 1 hour before',
        frequency: 'Scheduled',
        direction: 'outbound'
      }
    ]
  }
];

// Automation Rules
const AUTOMATION_RULES = [
  {
    id: 'auto-1',
    name: 'High Priority Alert → Slack',
    trigger: 'Alert created with severity = high',
    action: 'Send message to #cs-alerts Slack channel',
    integration: 'slack',
    enabled: true
  },
  {
    id: 'auto-2',
    name: 'New Email → Communication',
    trigger: 'Email received from client in Outlook',
    action: 'Create Communication record with AI sentiment',
    integration: 'microsoft_graph',
    enabled: true
  },
  {
    id: 'auto-3',
    name: 'Review Scheduled → Calendar Invite',
    trigger: 'Review scheduled in platform',
    action: 'Create Google Calendar invite for attendees',
    integration: 'google_calendar',
    enabled: true
  },
  {
    id: 'auto-4',
    name: 'Client Health Drop → Notification',
    trigger: 'Client health score drops below 70',
    action: 'Send Slack DM to relationship owner',
    integration: 'slack',
    enabled: false
  },
  {
    id: 'auto-5',
    name: 'Weekly Metrics → Salesforce',
    trigger: 'Every Monday 8 AM',
    action: 'Push weekly performance data to Salesforce',
    integration: 'salesforce',
    enabled: false
  },
  {
    id: 'auto-6',
    name: 'Critical Escalation → SMS',
    trigger: 'Follow-up marked as high priority and open > 24h',
    action: 'Send SMS to on-call manager',
    integration: 'twilio',
    enabled: false
  }
];

const IntegrationFlowsPage = () => {
  const [integrations, setIntegrations] = useState([]);
  const [syncingId, setSyncingId] = useState(null);
  const [automationRules, setAutomationRules] = useState(AUTOMATION_RULES);

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

  const handleSync = async (integrationType) => {
    setSyncingId(integrationType);
    // Simulate sync process
    setTimeout(() => {
      setSyncingId(null);
      alert(`Sync completed for ${integrationType}`);
    }, 2000);
  };

  const toggleAutomation = (ruleId) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? {...rule, enabled: !rule.enabled} : rule
      )
    );
  };

  const getIntegrationStatus = (integrationName) => {
    const integration = integrations.find(i => i.integration_name === integrationName);
    return integration?.connection_status === 'connected';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-8 w-8 text-emerald-600" />
          <h2 className="text-3xl font-bold text-slate-900">Integration Flows & Automation</h2>
        </div>
        <p className="text-slate-600">Understand how integrations sync data and automate workflows</p>
      </div>

      <Tabs defaultValue="flows" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="flows">Data Flows</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
        </TabsList>

        <TabsContent value="flows">
          <div className="space-y-6">
            {DATA_FLOWS.map((integration) => {
              const Icon = integration.icon;
              const isConfigured = getIntegrationStatus(integration.integration);
              
              return (
                <Card key={integration.integration} className="bg-white border-slate-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                          <Icon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle>{integration.name}</CardTitle>
                          <CardDescription>Data synchronization flows</CardDescription>
                        </div>
                      </div>
                      {isConfigured ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not Configured
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {integration.flows.map((flow, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-md">
                                  {flow.source}
                                </span>
                                <ArrowRight className={`h-5 w-5 ${\n                                  flow.direction === 'bidirectional' ? 'text-purple-600' :\n                                  flow.direction === 'inbound' ? 'text-emerald-600' :\n                                  'text-amber-600'\n                                }`} />
                                <span className="font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md">
                                  {flow.target}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{flow.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>Frequency: {flow.frequency}</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {flow.direction === 'bidirectional' ? '↔️ Two-way' : 
                                   flow.direction === 'inbound' ? '⬇️ Import' : '⬆️ Export'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="automation">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>Configure automatic actions when events occur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900">{rule.name}</h4>
                          {rule.enabled ? (
                            <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700">Inactive</Badge>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-slate-600 font-medium min-w-20">Trigger:</span>
                            <span className="text-slate-700">{rule.trigger}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-slate-600 font-medium min-w-20">Action:</span>
                            <span className="text-slate-700">{rule.action}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-medium min-w-20">Uses:</span>
                            <Badge variant="outline" className="text-xs">{rule.integration}</Badge>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleAutomation(rule.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Manual Sync Controls</CardTitle>
              <CardDescription>Trigger immediate data synchronization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DATA_FLOWS.map((integration) => {
                  const Icon = integration.icon;
                  const isConfigured = getIntegrationStatus(integration.integration);
                  const isSyncing = syncingId === integration.integration;
                  
                  return (
                    <div key={integration.integration} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="h-5 w-5 text-emerald-600" />
                        <h4 className="font-semibold text-slate-900">{integration.name}</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {integration.flows.length} active data flow{integration.flows.length !== 1 ? 's' : ''}
                      </p>
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={!isConfigured || isSyncing}
                        onClick={() => handleSync(integration.integration)}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                      </Button>
                      {!isConfigured && (
                        <p className="text-xs text-amber-600 mt-2">Configure in Settings first</p>
                      )}
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

export default IntegrationFlowsPage;
