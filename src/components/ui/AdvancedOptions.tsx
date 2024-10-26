import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AdvancedOptionsProps {
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  advancedConfig: {
    llm: {
      enabled: boolean;
      model: string;
      baseUrl: string;
      apiKey: string;
      temperature: number;
      apiType: string;
    };
    embeddings: {
      enabled: boolean;
      model: string;
      baseUrl: string;
      apiKey: string;
      huggingface_model: string;
      embedding_type: string;
    }
    sql: {
      enabled: boolean;
      url: string;
      username: string;
      password: string;
      dbName: string;
    };
    s3: {
      enabled: boolean;
      bucketName: string;
      regionName: string;
      awsAccessKey: string;
      awsSecretKey: string;
    };
  };
  handleConfigChange: (section: string, field: string, value: any) => void;
}

interface AdvancedSectionProps {
  title: string;
  enabled: boolean;
  children: React.ReactNode;
  onToggle: (enabled: boolean) => void;
}

const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  title,
  enabled,
  children,
  onToggle
}) => (
  <Card className="mb-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="rounded border-gray-300"
          />
          {title}
        </div>
      </CardTitle>
    </CardHeader>
    {enabled && <CardContent>{children}</CardContent>}
  </Card>
);

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  showAdvanced,
  setShowAdvanced,
  advancedConfig,
  handleConfigChange
}) => {
  return (
    <div>
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        Advanced Options
      </button>
      
      {showAdvanced && (
        <div className="space-y-4 mt-4">
          <AdvancedSection
            title="LLM"
            enabled={advancedConfig.llm.enabled}
            onToggle={(enabled) => handleConfigChange('llm', 'enabled', enabled)}
          >
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Model name"
                value={advancedConfig.llm.model}
                onChange={(e) => handleConfigChange('llm', 'model', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Base URL"
                value={advancedConfig.llm.baseUrl}
                onChange={(e) => handleConfigChange('llm', 'baseUrl', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="password"
                placeholder="API Key"
                value={advancedConfig.llm.apiKey}
                onChange={(e) => handleConfigChange('llm', 'apiKey', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Temperature"
                value={advancedConfig.llm.temperature}
                onChange={(e) => handleConfigChange('llm', 'temperature', parseFloat(e.target.value))}
                className="w-full p-2 border rounded-md"
                step="0.1"
                min="0"
                max="1"
              />
            </div>
          </AdvancedSection>

          <AdvancedSection
            title="Embeddings"
            enabled={advancedConfig.embeddings.enabled}
            onToggle={(enabled) => handleConfigChange('embeddings', 'enabled', enabled)}
          >
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Model name"
                value={advancedConfig.embeddings.model}
                onChange={(e) => handleConfigChange('embeddings', 'model', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Base URL"
                value={advancedConfig.embeddings.baseUrl}
                onChange={(e) => handleConfigChange('embeddings', 'baseUrl', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="password"
                placeholder="API Key"
                value={advancedConfig.embeddings.apiKey}
                onChange={(e) => handleConfigChange('embeddings', 'apiKey', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Hugging Face Model"
                value={advancedConfig.embeddings.huggingface_model}
                onChange={(e) => handleConfigChange('embeddings', 'huggingface_model', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <select
                value={advancedConfig.embeddings.embedding_type}
                onChange={(e) => handleConfigChange('embeddings', 'embedding_type', e.target.value)}
                className="w-full p-2 border rounded-md">
                <option value="OpenAI">Select Embedding Type</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Huggingface">Huggingface</option>
            </select>
            </div>
          </AdvancedSection>

          <AdvancedSection
            title="SQL"
            enabled={advancedConfig.sql.enabled}
            onToggle={(enabled) => handleConfigChange('sql', 'enabled', enabled)}
          >
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Database URL"
                value={advancedConfig.sql.url}
                onChange={(e) => handleConfigChange('sql', 'url', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Username"
                value={advancedConfig.sql.username}
                onChange={(e) => handleConfigChange('sql', 'username', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="password"
                placeholder="Password"
                value={advancedConfig.sql.password}
                onChange={(e) => handleConfigChange('sql', 'password', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Database Name"
                value={advancedConfig.sql.dbName}
                onChange={(e) => handleConfigChange('sql', 'dbName', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </AdvancedSection>

          <AdvancedSection
            title="S3"
            enabled={advancedConfig.s3.enabled}
            onToggle={(enabled) => handleConfigChange('s3', 'enabled', enabled)}
          >
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Bucket Name"
                value={advancedConfig.s3.bucketName}
                onChange={(e) => handleConfigChange('s3', 'bucketName', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Region Name"
                value={advancedConfig.s3.regionName}
                onChange={(e) => handleConfigChange('s3', 'regionName', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="AWS Access Key"
                value={advancedConfig.s3.awsAccessKey}
                onChange={(e) => handleConfigChange('s3', 'awsAccessKey', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="password"
                placeholder="AWS Secret Key"
                value={advancedConfig.s3.awsSecretKey}
                onChange={(e) => handleConfigChange('s3', 'awsSecretKey', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </AdvancedSection>
        </div>
      )}
    </div>
  );
};
