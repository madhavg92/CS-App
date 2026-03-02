import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReportsPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchMetrics(selectedClient);
    }
  }, [selectedClient]);

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

  const fetchMetrics = async (clientId) => {
    try {
      const response = await axios.get(`${API}/performance?client_id=${clientId}`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Performance Reports</h2>
        <p className="text-slate-600 mt-2">Internal and client-facing performance metrics</p>
      </div>

      <div className="mb-6">
        <Label className="text-slate-700 mb-2 block">Select Client</Label>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-full max-w-md bg-white border-slate-300">
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

      {selectedClientData && (
        <div className="space-y-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Performance Summary</CardTitle>
                  <CardDescription className="mt-1">{selectedClientData.name}</CardDescription>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600 mb-1">Health Score</div>
                  <div className="text-3xl font-bold text-emerald-600">{selectedClientData.health_score}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600 mb-1">Contract Value</div>
                  <div className="text-2xl font-bold text-slate-900">${selectedClientData.contract_value.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600 mb-1">Status</div>
                  <div className="text-xl font-bold text-slate-900 capitalize">{selectedClientData.status}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600 mb-1">Contacts</div>
                  <div className="text-3xl font-bold text-slate-900">{selectedClientData.contacts?.length || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Internal Metrics (Weekly)</CardTitle>
                <CardDescription>Performance tracking for internal review</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No performance data recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metrics.slice(0, 3).map((metric) => (
                      <div key={metric.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-slate-600">Week: {new Date(metric.week_ending).toLocaleDateString()}</span>
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-slate-600">Denials Worked</div>
                            <div className="font-bold text-slate-900">{metric.denials_worked}</div>
                          </div>
                          <div>
                            <div className="text-slate-600">Recovery Rate</div>
                            <div className="font-bold text-emerald-600">{metric.recovery_rate}%</div>
                          </div>
                          <div>
                            <div className="text-slate-600">SLA Compliance</div>
                            <div className="font-bold text-blue-600">{metric.sla_compliance}%</div>
                          </div>
                          <div>
                            <div className="text-slate-600">Error Rate</div>
                            <div className="font-bold text-slate-900">{metric.error_rate}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>External Report (Client-Facing)</CardTitle>
                <CardDescription>Professional report for client delivery</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No reports generated yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metrics.slice(0, 1).map((metric) => (
                      <div key={metric.id} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <h4 className="font-semibold text-emerald-900 mb-3">Weekly Performance Report</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-emerald-700">Denials Recovered:</span>
                            <span className="font-bold text-emerald-900">{metric.denials_recovered}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-emerald-700">Dollars Recovered:</span>
                            <span className="font-bold text-emerald-900">${metric.dollars_recovered.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-emerald-700">Recovery Rate:</span>
                            <span className="font-bold text-emerald-900">{metric.recovery_rate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-emerald-700">SLA Status:</span>
                            <span className="font-bold text-emerald-900">{metric.sla_compliance}% Compliant</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-emerald-300">
                          <p className="text-xs text-emerald-700 italic">Next week focus: Continue strong performance and explore optimization opportunities</p>
                        </div>
                      </div>
                    ))}
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Client Report (Word)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;