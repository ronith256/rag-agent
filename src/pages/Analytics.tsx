// /src/pages/Analytics.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';


interface Metrics {
  _id: string;
  agent_id: string;
  date: string;
  calls: number;
  first_token_latency?: number;
  total_response_time?: number;
}

interface Agent {
  id: string;
  user_id: string;
  config: {
    llm: string;
    embeddings_model: string;
    collection: string;
  };
  created_at: string;
}

const Analytics = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { user } = useAuth();
  const userId = user?.uid;
  const baseURL = import.meta.env.VITE_BACKEND_BASE_URL || '';

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/agents/user/${userId}`);
        setAgents(response.data);
        if (response.data.length > 0) {
          setSelectedAgent(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };
    fetchAgents();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedAgent) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get(`${baseURL}/api/metrics/agent/${selectedAgent}`, {
          params: {
            start_date: dateRange.start,
            end_date: dateRange.end,
          },
        });
        
        // Process and sort the metrics data
        // Handle both string dates and MongoDB date objects
        const processedMetrics = response.data.map((metric: any) => ({
          ...metric,
          // Handle both MongoDB date object and string date formats
          date: metric.date.$date ? metric.date.$date : metric.date,
          // Ensure these are numbers with defaults
          first_token_latency: metric.first_token_latency || 0,
          total_response_time: metric.total_response_time || 0
        })).sort((a: Metrics, b: Metrics) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Fill in missing dates with zero values
        const filledMetrics = fillMissingDates(processedMetrics, dateRange.start, dateRange.end);
        setMetrics(filledMetrics);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedAgent, dateRange]);

  // Function to fill in missing dates with zero values
  const fillMissingDates = (metrics: Metrics[], startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateMap = new Map(
      metrics.map(m => [new Date(m.date).toISOString().split('T')[0], m])
    );
    
    const filledMetrics: Metrics[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      filledMetrics.push(
        dateMap.get(dateStr) || {
          _id: dateStr,
          agent_id: selectedAgent,
          date: dateStr,
          calls: 0,
          first_token_latency: 0,
          total_response_time: 0
        }
      );
    }
    return filledMetrics;
  };

  const calculateAverages = () => {
    if (metrics.length === 0) return { avgCalls: 0, avgLatency: 0, avgResponseTime: 0 };
    
    const sum = metrics.reduce((acc, curr) => ({
      calls: acc.calls + (curr.calls || 0),
      latency: acc.latency + (curr.first_token_latency || 0),
      responseTime: acc.responseTime + (curr.total_response_time || 0),
    }), { calls: 0, latency: 0, responseTime: 0 });

    return {
      avgCalls: (sum.calls / metrics.length).toFixed(1),
      avgLatency: (sum.latency / metrics.length).toFixed(2),
      avgResponseTime: (sum.responseTime / metrics.length).toFixed(2),
    };
  };

  const averages = calculateAverages();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="p-2 border rounded-md"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.config.collection}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="p-2 border rounded-md"
            />
            <ArrowRight className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="p-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Daily Calls</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.avgCalls}</div>
                <p className="text-xs text-muted-foreground">calls per day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg First Token Latency</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.avgLatency}s</div>
                <p className="text-xs text-muted-foreground">seconds</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.avgResponseTime}s</div>
                <p className="text-xs text-muted-foreground">seconds</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={formatDate}
                        formatter={(value: number) => [value, 'Calls']}
                      />
                      <Legend />
                      <Bar dataKey="calls" fill="#4f46e5" name="Number of Calls" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={formatDate}
                        formatter={(value: number) => [`${value.toFixed(2)}s`, '']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="first_token_latency" 
                        stroke="#4f46e5" 
                        name="First Token Latency"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total_response_time" 
                        stroke="#10b981" 
                        name="Total Response Time"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;