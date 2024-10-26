import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileUploadSection } from '../components/ui/FileUploadSelection';
import { AdvancedOptions } from '../components/ui/AdvancedOptions';
import type { RAGConfig, Agent, AdvancedConfig } from '../types/types';
import { defaultAdvancedConfig, isValidField, isValidSection } from '../types/types';
import { useAuth } from '@/context/AuthContext';

const CreateAgent = () => {
  const [name, setName] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [models, setModels] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [isAgentCreated, setIsAgentCreated] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>(defaultAdvancedConfig);
  const { user } = useAuth();
  const userId = user?.uid;
  const baseURL = import.meta.env.VITE_BACKEND_BASE_URL || '';

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/agents/models`);
        setModels(response.data);
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (advancedConfig.llm.enabled) {
      setSelectedModel('');
    }
  }, [advancedConfig.llm.enabled]);

  const handleCreateAgent = async () => {
    try {
      const config: RAGConfig = {
        llm: selectedModel,
        embeddings_model: advancedConfig.embeddings.enabled ? 
          advancedConfig.embeddings.model : 
          "text-embedding-ada-002",
        collection: name.toLowerCase().replace(/\s+/g, '-'),
      };

      if (advancedConfig.llm.enabled) {
        config.advancedLLMConfig = {
          model: advancedConfig.llm.model,
          base_url: advancedConfig.llm.baseUrl,
          api_key: advancedConfig.llm.apiKey,
          temperature: advancedConfig.llm.temperature,
          api_type: advancedConfig.llm.apiType
        };
        config.llm = advancedConfig.llm.model;
      }

      if (advancedConfig.embeddings.enabled) {
        config.advancedEmbeddingsConfig = {
          model: advancedConfig.embeddings.model,
          base_url: advancedConfig.embeddings.baseUrl,
          api_key: advancedConfig.embeddings.apiKey,
          embedding_type: advancedConfig.embeddings.embedding_type,
          huggingface_model: advancedConfig.embeddings.huggingface_model
        };
      }

      if (advancedConfig.sql.enabled) {
        config.sql_config = {
          url: advancedConfig.sql.url,
          username: advancedConfig.sql.username,
          password: advancedConfig.sql.password,
          db_name: advancedConfig.sql.dbName
        };
      }

      if (advancedConfig.s3.enabled) {
        config.s3_config = {
          bucket_name: advancedConfig.s3.bucketName,
          region_name: advancedConfig.s3.regionName,
          aws_access_key: advancedConfig.s3.awsAccessKey,
          aws_secret_key: advancedConfig.s3.awsSecretKey
        };
      }

      const response = await axios.post<Agent>(`${baseURL}/api/agents`, {
        user_id: userId,
        config
      });
      
      setAgentId(response.data.id);
      setIsAgentCreated(true);
      } catch (error) {
        console.error('Error creating agent:', error);
      }
  };

  const handleConfigChange = (section: string, field: string, value: any) => {
    if (!isValidSection(section)) return;
    if (!isValidField(section, field)) return;
    
    setAdvancedConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-8">Create New Agent</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-6">
            {/* Name input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter agent name"
              />
            </div>

            {/* Model selection - Only show if advanced LLM is not enabled */}
            {!advancedConfig.llm.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a model</option>
                  {Object.entries(models).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Embedding Model
              </label>
              <select
                value="Ada 002"
                disabled
                className="w-full p-2 border rounded-md bg-gray-50"
              >
                <option>Ada 002</option>
              </select>
            </div>

            <AdvancedOptions
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              advancedConfig={advancedConfig}
              handleConfigChange={handleConfigChange}
            />

            <button
              onClick={handleCreateAgent}
              disabled={!name || (!selectedModel && !advancedConfig.llm.enabled) || (advancedConfig.llm.enabled && !advancedConfig.llm.model)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create Agent
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - File Upload */}
      <FileUploadSection
        files={files}
        setFiles={setFiles}
        isAgentCreated={isAgentCreated}
        agentId={agentId}
      />
    </div>
  );
};

export default CreateAgent;