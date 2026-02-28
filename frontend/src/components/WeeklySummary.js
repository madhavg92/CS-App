import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, AlertTriangle, CheckCircle, Users, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const WeeklySummary = ({ clientId, clientName }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const weekEnding = new Date().toISOString().split('T')[0];
      const response = await axios.post(`${API}/weekly-summary`, {
        client_id: clientId,
        week_ending: weekEnding
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white border border-slate-200 shadow-sm" data-testid="weekly-summary-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weekly Client Summary</CardTitle>
            <CardDescription>AI-generated summary from communications</CardDescription>
          </div>
          <Button
            onClick={generateSummary}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
            data-testid="generate-summary-btn"
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Summary'}
          </Button>
        </div>
      </CardHeader>
      {summary && (
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Key Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {summary.key_topics.map((topic, idx) => (
                <Badge key={idx} variant="outline" className="bg-emerald-50 text-emerald-700">{topic}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Action Items
            </h4>
            <div className="space-y-2">
              {summary.action_items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-900">{item.description}</span>
                    <Badge className={item.priority === 'high' ? 'bg-red-100 text-red-700' : item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                      {item.priority}
                    </Badge>
                  </div>
                  {item.owner && <p className="text-sm text-slate-600 mt-1">Owner: {item.owner}</p>}
                </div>
              ))}
            </div>
          </div>

          {summary.red_flags.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Red Flags
              </h4>
              <div className="space-y-2">
                {summary.red_flags.map((flag, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-700">
                    {flag}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.new_contacts.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                New Contacts Detected
              </h4>
              <div className="flex flex-wrap gap-2">
                {summary.new_contacts.map((contact, idx) => (
                  <Badge key={idx} className="bg-blue-100 text-blue-700">{contact}</Badge>
                ))}
              </div>
            </div>
          )}

          {summary.escalation_items.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Escalation Items</h4>
              <div className="space-y-2">
                {summary.escalation_items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
