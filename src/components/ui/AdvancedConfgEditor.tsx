import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { type Agent, type RAGConfig, type AdvancedConfig, defaultAdvancedConfig} from '@/types/types';

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

const AgentConfigEditor = ({ agent, onUpdate, models }: AgentConfigEditorProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<AdvancedConfig>(defaultAdvancedConfig);

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
            
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Update Agent
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentConfigEditor;