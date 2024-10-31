import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { type Agent, type RAGConfig, type AdvancedConfig, defaultAdvancedConfig } from '@/types/types';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface AgentConfigEditorProps {
  agent: Agent;
  models: Record<string, string>;
  onUpdate: (config: RAGConfig) => void;
}

interface Field {
  name: string;
  type: string;
  placeholder: string;
}

interface SectionConfig {
  title: string;
  section: keyof AdvancedConfig;
  fields: Field[];
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, agentName, onConfirm }) => {
  const [confirmText, setConfirmText] = useState('');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-4">Delete Agent</h3>
        <p className="text-gray-600 mb-4">
          This action cannot be undone. Please type <span className="font-bold">{agentName}</span> to confirm.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type agent name to confirm"
          className="w-full p-2 border rounded-md mb-4"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== agentName}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Delete Agent
          </button>
        </div>
      </div>
    </div>
  );
};

const AgentConfigEditor = ({ agent, models, onUpdate }: AgentConfigEditorProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<AdvancedConfig>(defaultAdvancedConfig);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user } = useAuth();
  const baseURL = import.meta.env.VITE_BACKEND_BASE_URL || '';


  useEffect(() => {
    if (agent) {
      const newConfig: AdvancedConfig = {
        llm: {
          enabled: !!agent.config.advancedLLMConfig,
          model: agent.config.advancedLLMConfig?.model || '',
          baseUrl: agent.config.advancedLLMConfig?.base_url || '',
          apiKey: agent.config.advancedLLMConfig?.api_key || '',
          temperature: agent.config.advancedLLMConfig?.temperature || 0.7,
          apiType: agent.config.advancedLLMConfig?.api_type || 'OpenAI'
        },
        embeddings: {
          enabled: !!agent.config.advancedEmbeddingsConfig,
          model: agent.config.advancedEmbeddingsConfig?.model || 'text-embedding-ada-002',
          baseUrl: agent.config.advancedEmbeddingsConfig?.base_url || '',
          apiKey: agent.config.advancedEmbeddingsConfig?.api_key || '',
          huggingface_model: agent.config.advancedEmbeddingsConfig?.huggingface_model || '',
          embedding_type: agent.config.advancedEmbeddingsConfig?.embedding_type || 'OpenAI'
        },
        sql: {
          enabled: !!agent.config.sql_config,
          url: agent.config.sql_config?.url || '',
          username: agent.config.sql_config?.username || '',
          password: agent.config.sql_config?.password || '',
          dbName: agent.config.sql_config?.db_name || ''
        },
        s3: {
          enabled: !!agent.config.s3_config,
          bucketName: agent.config.s3_config?.bucket_name || '',
          regionName: agent.config.s3_config?.region_name || '',
          awsAccessKey: agent.config.s3_config?.aws_access_key || '',
          awsSecretKey: agent.config.s3_config?.aws_secret_key || ''
        }
      };
      setConfig(newConfig);
    }
  }, [agent]);

  const handleConfigChange = (section: keyof AdvancedConfig, field: string, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleDeleteAgent = async () => {
    try {
      await axios.delete(`${baseURL}/api/agents/${agent.id}`, {
        params: { user_id: user?.uid }
      });
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const handleSave = () => {
    const updatedConfig: RAGConfig = {
      ...agent.config,
      collection: agent.config.collection,
      llm: config.llm.enabled ? config.llm.model : agent.config.llm,
      embeddings_model: "text-embedding-ada-002"
    };

    if (config.llm.enabled) {
      updatedConfig.advancedLLMConfig = {
        model: config.llm.model,
        base_url: config.llm.baseUrl,
        api_key: config.llm.apiKey,
        temperature: config.llm.temperature,
        api_type: config.llm.apiType
      };
    }

    if (config.embeddings.enabled) {
      updatedConfig.advancedEmbeddingsConfig = {
        model: config.embeddings.model,
        base_url: config.embeddings.baseUrl,
        api_key: config.embeddings.apiKey,
        huggingface_model: config.embeddings.huggingface_model,
        embedding_type: config.embeddings.embedding_type
      };
    }

    if (config.sql.enabled) {
      updatedConfig.sql_config = {
        url: config.sql.url,
        username: config.sql.username,
        password: config.sql.password,
        db_name: config.sql.dbName
      };
    }

    if (config.s3.enabled) {
      updatedConfig.s3_config = {
        bucket_name: config.s3.bucketName,
        region_name: config.s3.regionName,
        aws_access_key: config.s3.awsAccessKey,
        aws_secret_key: config.s3.awsSecretKey
      };
    }

    onUpdate(updatedConfig);
  };

  const renderSection = ({ title, section, fields }: SectionConfig) => (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config[section].enabled}
              onChange={(e) => handleConfigChange(section, 'enabled', e.target.checked)}
              className="rounded border-gray-300"
            />
            {title}
          </div>
        </CardTitle>
      </CardHeader>
      {config[section].enabled && (
        <CardContent className="space-y-4">
          {fields.map(({ name, type, placeholder }) => {
            // Get the value and ensure it's the correct type for the input
            const value = config[section][name as keyof typeof config[typeof section]];
            const inputValue = typeof value === 'boolean' ? '' : String(value);
  
            return (
              <input
                key={name}
                type={type}
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => handleConfigChange(
                  section,
                  name,
                  type === 'number' ? parseFloat(e.target.value) : e.target.value
                )}
                className="w-full p-2 border rounded-md"
                step={type === 'number' ? '0.1' : undefined}
                min={type === 'number' ? '0' : undefined}
                max={type === 'number' ? '1' : undefined}
              />
            );
          })}
        </CardContent>
      )}
    </Card>
  );

  const sections: SectionConfig[] = [
    {
      title: 'LLM',
      section: 'llm',
      fields: [
        { name: 'model', type: 'text', placeholder: 'Model name' },
        { name: 'baseUrl', type: 'text', placeholder: 'Base URL' },
        { name: 'apiKey', type: 'password', placeholder: 'API Key' },
        { name: 'temperature', type: 'number', placeholder: 'Temperature' }
      ]
    },
    {
      title: 'Embeddings',
      section: 'embeddings',
      fields: [
        { name: 'model', type: 'text', placeholder: 'Model name' },
        { name: 'baseUrl', type: 'text', placeholder: 'Base URL' },
        { name: 'apiKey', type: 'password', placeholder: 'API Key' },
        { name: 'huggingface_model', type: 'text', placeholder: 'Hugging Face Model' }
      ]
    },
    {
      title: 'SQL',
      section: 'sql',
      fields: [
        { name: 'url', type: 'text', placeholder: 'Database URL' },
        { name: 'username', type: 'text', placeholder: 'Username' },
        { name: 'password', type: 'password', placeholder: 'Password' },
        { name: 'dbName', type: 'text', placeholder: 'Database Name' }
      ]
    },
    {
      title: 'S3',
      section: 's3',
      fields: [
        { name: 'bucketName', type: 'text', placeholder: 'Bucket Name' },
        { name: 'regionName', type: 'text', placeholder: 'Region Name' },
        { name: 'awsAccessKey', type: 'text', placeholder: 'AWS Access Key' },
        { name: 'awsSecretKey', type: 'password', placeholder: 'AWS Secret Key' }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={agent.config.collection}
          disabled
          className="w-full p-2 border rounded-md bg-gray-50"
        />
      </div>

      {!config.llm.enabled && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            value={agent.config.llm}
            onChange={(e) => onUpdate({ ...agent.config, llm: e.target.value })}
            className="w-full p-2 border rounded-md"
          >
            {Object.entries(models).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          {showAdvanced ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {sections.map((section) => renderSection(section))}
          </div>
        )}
      </div>
        <div className="mt-8">
          <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Update Agent
          </button>
        </div>
        <div className="mt-8">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Agent
          </button>
        </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        agentName={agent.config.collection}
        onConfirm={handleDeleteAgent}
      />
    </div>
  );
};

export default AgentConfigEditor;