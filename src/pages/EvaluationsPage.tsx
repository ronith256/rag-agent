import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, BarChart, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Agent, Evaluation, EvaluationJob } from '../types/types';
import { EvaluationDetails } from '../components/ui/EvaluationDetails';
import { UploadModal } from '../components/ui/EvalUploadModal';

const EvaluationsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [processingJobs, setProcessingJobs] = useState<Record<string, EvaluationJob>>({});
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
    const pollProcessingJobs = async () => {
      const jobIds = Object.keys(processingJobs);
      if (jobIds.length === 0) return;

      try {
        const updatedJobs: Record<string, EvaluationJob> = {};
        for (const jobId of jobIds) {
          const response = await axios.get<EvaluationJob>(
            `${baseURL}/api/agents/evaluation-jobs/${jobId}`
          );
          
          if (response.data.status === 'processing') {
            updatedJobs[jobId] = response.data;
          } else {
            // If job is complete or failed, refresh evaluations
            if (selectedAgent) {
              await fetchEvaluations(selectedAgent);
            }
          }
        }
        setProcessingJobs(updatedJobs);
      } catch (error) {
        console.error('Error polling jobs:', error);
      }
    };

    const interval = setInterval(pollProcessingJobs, 2000);
    return () => clearInterval(interval);
  }, [processingJobs, selectedAgent]);

  const fetchAgents = async () => {
    try {
      const response = await axios.get<Agent[]>(`${baseURL}/api/agents/user/${userId}`);
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchEvaluations = async (agentId: string) => {
    try {
      const response = await axios.get<Evaluation[]>(
        `${baseURL}/api/agents/${agentId}/evaluations`
      );
      setEvaluations(response.data);

      // Check for any processing evaluations and add them to processingJobs
      const processingEvals = response.data.filter(evaluation => evaluation.status === 'processing');
      if (processingEvals.length > 0) {
        const newProcessingJobs: Record<string, EvaluationJob> = {};
        for (const evaluation of processingEvals) {
          const jobResponse = await axios.get<EvaluationJob>(
            `${baseURL}/api/agents/evaluation-jobs/${evaluation.job_id}`
          );
          if (jobResponse.data.status === 'processing') {
            newProcessingJobs[evaluation.job_id] = jobResponse.data;
          }
        }
        setProcessingJobs(prev => ({ ...prev, ...newProcessingJobs }));
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };

  const handleUploadComplete = async (jobId: string) => {
    setProcessingJobs(prev => ({ ...prev, [jobId]: {
      _id: jobId,
      agent_id: selectedAgent || '',
      status: 'processing',
      progress: 0,
      total_questions: 0,
      processed_questions: 0,
      created_at: new Date().toISOString()
    }}));
    setShowUploadModal(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Evaluations Dashboard</h1>
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
            onClick={() => setSelectedAgent(
              selectedAgent === agent.id ? null : agent.id
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-medium">{agent.config.collection}</h3>
                  <p className="text-sm text-gray-500">{agent.config.llm}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedAgent && (
        <div className="space-y-4">
          {/* Show processing jobs first */}
          {Object.entries(processingJobs).map(([jobId, job]) => (
            <Card key={jobId} className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Processing Evaluation</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(job.processed_questions / job.total_questions) * 100}%`
                        }}
                      />
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Processed {job.processed_questions} of {job.total_questions} questions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Show completed evaluations */}
          {evaluations
            .filter(evaluation => evaluation.status !== 'processing')
            .map((evaluation) => (
              <EvaluationDetails 
                key={evaluation.job_id}
                evaluation={evaluation}
              />
            ))}

          {evaluations.length === 0 && Object.keys(processingJobs).length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <BarChart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Evaluations Yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start by creating a new evaluation for this agent.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FileUp className="w-4 h-4" />
                Create Evaluation
              </button>
            </div>
          )}
        </div>
      )}

      {showUploadModal && (
        <UploadModal
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentSelect={setSelectedAgent}
          onClose={() => setShowUploadModal(false)}
          onSubmit={handleUploadComplete}
        />
      )}
    </div>
  );
};

export default EvaluationsPage;