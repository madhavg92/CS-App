import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Download, Calendar, TrendingUp, BarChart3, PieChart,
  Building2, Sparkles, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReportsPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Report generation
  const [selectedClient, setSelectedClient] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('internal');
  const [generatedReport, setGeneratedReport] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, perfRes] = await Promise.all([
        axios.get(`${API}/clients`),
        axios.get(`${API}/performance`)
      ]);
      setClients(clientsRes.data);
      setPerformance(perfRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }
    
    setGenerating(true);
    try {
      const templateSlug = reportType === 'external' ? 'client_report_external' : 'weekly_summary';
      const response = await axios.post(`${API}/templates/execute/${templateSlug}`, {
        client_id: selectedClient,
        date_range: `${dateRange.start} to ${dateRange.end}`
      });
      setGeneratedReport({
        type: reportType,
        client: clients.find(c => c.id === selectedClient)?.name,
        content: response.data.result,
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const getClientPerformance = (clientId) => {
    return performance.filter(p => p.client_id === clientId).slice(0, 6);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  // Calculate aggregate stats
  const aggregateStats = {
    totalDenials: performance.reduce((sum, p) => sum + (p.denials_worked || 0), 0),
    totalRecovered: performance.reduce((sum, p) => sum + (p.dollars_recovered || 0), 0),
    avgRecoveryRate: performance.length > 0 
      ? performance.reduce((sum, p) => sum + (p.recovery_rate || 0), 0) / performance.length 
      : 0,
    avgSLA: performance.length > 0
      ? performance.reduce((sum, p) => sum + (p.sla_compliance_pct || 0), 0) / performance.length
      : 0
  };

  // Aggregate denial codes
  const denialCodes = {};
  performance.forEach(p => {
    if (p.top_denial_codes) {
      Object.entries(p.top_denial_codes).forEach(([code, count]) => {
        denialCodes[code] = (denialCodes[code] || 0) + count;
      });
    }
  });
  const topDenialCodes = Object.entries(denialCodes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Aggregate payer breakdown
  const payerTotals = {};
  performance.forEach(p => {
    if (p.payer_breakdown) {
      Object.entries(p.payer_breakdown).forEach(([payer, amount]) => {
        payerTotals[payer] = (payerTotals[payer] || 0) + amount;
      });
    }
  });
  const payerBreakdown = Object.entries(payerTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-600 mt-1">Generate internal and client-facing performance reports</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-white border">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="generate" data-testid="tab-generate">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Aggregate Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-slate-500">Total Denials Worked</p>
                <p className="text-2xl font-bold text-slate-900">{aggregateStats.totalDenials.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-slate-500">Total Recovered</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(aggregateStats.totalRecovered)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-slate-500">Avg Recovery Rate</p>
                <p className="text-2xl font-bold text-[#1B4F72]">{aggregateStats.avgRecoveryRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-slate-500">Avg SLA Compliance</p>
                <p className="text-2xl font-bold text-[#1B4F72]">{aggregateStats.avgSLA.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Denial Codes */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#1B4F72]" />
                  Top Denial Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topDenialCodes.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No denial code data available</p>
                ) : (
                  <div className="space-y-3">
                    {topDenialCodes.map(([code, count], index) => {
                      const maxCount = topDenialCodes[0][1];
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={code}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700">{code}</span>
                            <span className="text-slate-500">{count.toLocaleString()}</span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#1B4F72] rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payer Breakdown */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-[#1B4F72]" />
                  Recovery by Payer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payerBreakdown.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No payer data available</p>
                ) : (
                  <div className="space-y-3">
                    {payerBreakdown.map(([payer, amount], index) => {
                      const total = payerBreakdown.reduce((sum, [, a]) => sum + a, 0);
                      const percentage = (amount / total) * 100;
                      const colors = ['bg-[#1B4F72]', 'bg-[#85C1E9]', 'bg-green-500', 'bg-amber-500', 'bg-purple-500'];
                      return (
                        <div key={payer} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-700">{payer}</span>
                              <span className="text-slate-500">{formatCurrency(amount)}</span>
                            </div>
                            <div className="text-xs text-slate-400">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client Performance Table */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Client Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-slate-600">Client</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-600">Health</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-600">Denials</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-600">Recovered</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-600">Rate</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-600">SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => {
                      const clientPerf = getClientPerformance(client.id);
                      const latestPerf = clientPerf[0];
                      return (
                        <tr key={client.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-2 font-medium text-slate-900">{client.name}</td>
                          <td className="text-right py-3 px-2">
                            <span className={`font-medium ${
                              client.health_score >= 80 ? 'text-green-600' :
                              client.health_score >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {client.health_score}
                            </span>
                          </td>
                          <td className="text-right py-3 px-2 text-slate-600">
                            {latestPerf?.denials_worked?.toLocaleString() || '-'}
                          </td>
                          <td className="text-right py-3 px-2 text-green-600">
                            {latestPerf ? formatCurrency(latestPerf.dollars_recovered) : '-'}
                          </td>
                          <td className="text-right py-3 px-2">
                            <span className={`font-medium ${
                              (latestPerf?.recovery_rate || 0) >= (client.sla_targets?.recovery_rate || 85)
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {latestPerf?.recovery_rate?.toFixed(1) || '-'}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-2 text-slate-600">
                            {latestPerf?.sla_compliance_pct?.toFixed(1) || '-'}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Generator */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#1B4F72]" />
                  Generate Report
                </CardTitle>
                <CardDescription>Create AI-powered performance reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger data-testid="select-client">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal Report</SelectItem>
                      <SelectItem value="external">Client Report (External)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {reportType === 'internal' 
                      ? 'Full metrics with team productivity and error rates'
                      : 'Professional client-facing format with AI-generated insights'
                    }
                  </p>
                </div>

                <Button 
                  className="w-full bg-[#1B4F72] hover:bg-[#154360]"
                  onClick={handleGenerateReport}
                  disabled={generating || !selectedClient}
                  data-testid="generate-report-btn"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Generating...
                    </span>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Report Preview */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedReport ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className={reportType === 'internal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                          {generatedReport.type === 'internal' ? 'Internal' : 'Client Report'}
                        </Badge>
                        <p className="text-sm text-slate-600 mt-1">{generatedReport.client}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border max-h-96 overflow-y-auto">
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                        {generatedReport.content}
                      </pre>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Generated: {new Date(generatedReport.generated_at).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>Select options and generate a report</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
