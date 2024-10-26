import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, BarChart, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Agent, EvalAgent, Evaluation, EvaluationJob, FilterStatus } from '../types/types';
import { EvaluationDetails } from '../components/ui/EvaluationDetails';
import { UploadModal } from '../components/ui/EvalUploadModal';

const EvaluationsPage = () => {
  const [agents, setAgents] = useState<EvalAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const { user } = useAuth();
  const userId = user?.uid;
  const baseURL = import.meta.env.VITE_BACKEND_BASE_URL || '';
  useEffect(() => {
    if (userId) {
      fetchAgents();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedAgent) {
      fetchEvaluations(selectedAgent);
    } else {
      setEvaluations([]);
    }
  }, [selectedAgent]);

  useEffect(() => {
    const pollProcessingEvaluations = async () => {
      if (!selectedAgent) return;

      const processingEvaluations = evaluations.filter(evaluation => evaluation.status === 'processing');
      if (processingEvaluations.length === 0) return;

      for (const evaluation of processingEvaluations) {
        try {
          const response = await axios.get<EvaluationJob>(`${baseURL}/api/evaluation-jobs/${evaluation.job_id}`);
          if (response.data.status !== 'processing') {
            await fetchEvaluations(selectedAgent);
          }
        } catch (error) {
          console.error('Error polling evaluation status:', error);
        }
      }
    };

    const interval = setInterval(pollProcessingEvaluations, 5000);
    return () => clearInterval(interval);
  }, [selectedAgent, evaluations]);

  const fetchAgents = async () => {
    try {
      const response = await axios.get<Agent[]>(`${baseURL}/api/agents/user/${userId}`);
      const fetchedAgents = response.data;

      // Fetch evaluations for each agent to determine status
      const agentsWithStatus = await Promise.all(
        fetchedAgents.map(async (agent) => {
          try {
            const evalResponse = await axios.get<Evaluation[]>(`${baseURL}/api/agents/${agent.id}/evaluations`);
            const latestEval = evalResponse.data[0];
            const isActive = latestEval && 
              new Date(latestEval.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            return {
              ...agent,
              status: isActive ? 'active' : 'inactive',
              lastActive: latestEval?.timestamp
            };
          } catch (error) {
            return {
              ...agent,
              status: 'inactive'
            };
          }
        })
      );

      setAgents(agentsWithStatus);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchEvaluations = async (agentId: string) => {
    try {
      const response = await axios.get<Evaluation[]>(`${baseURL}/api/agents/${agentId}/evaluations`);
      setEvaluations(response.data);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(selectedAgent === agentId ? null : agentId);
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    if (filter === 'all') return true;
    return evaluation.status === filter;
  });

  const getAgentStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'inactive':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Evaluations Dashboard</h1>
          <div className="mt-2 flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all' 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Evaluations
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'active' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'failed' 
                  ? 'bg-red-100 text-red-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Failed
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FileUp className="w-4 h-4" />
          New Evaluation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`cursor-pointer transition-all ${
              selectedAgent === agent.id 
                ? 'ring-2 ring-blue-500' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => handleAgentSelect(agent.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  agent.status === 'active' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Bot className={`w-5 h-5 ${getAgentStatusColor(agent.status)}`} />
                </div>
                <div>
                  <h3 className="font-medium">{agent.config.collection}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm ${getAgentStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                    {agent.lastActive && (
                      <span className="text-xs text-gray-500">
                        Last active: {new Date(agent.lastActive).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedAgent && filteredEvaluations.length > 0 ? (
        <div className="space-y-4">
          {filteredEvaluations.map((evaluation) => (
            <EvaluationDetails 
              key={evaluation.job_id}
              evaluation={evaluation}
            />
          ))}
        </div>
      ) : selectedAgent && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <BarChart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluations Yet</h3>
          <p className="text-gray-500 mb-4">Start by creating a new evaluation for this agent.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FileUp className="w-4 h-4" />
            Create Evaluation
          </button>
        </div>
      )}

      {showUploadModal && (
        <UploadModal
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentSelect={setSelectedAgent}
          onClose={() => setShowUploadModal(false)}
          onSubmit={() => {
            setShowUploadModal(false);
            if (selectedAgent) {
              fetchEvaluations(selectedAgent);
            }
          }}
        />
      )}
    </div>
  );
};

export default EvaluationsPage;