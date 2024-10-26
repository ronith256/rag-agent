// Base configuration types
export interface LLMConfig {
    model: string;
    base_url?: string;
    api_key: string;
    temperature?: number;
    api_type: string;
  }

export interface EmbeddingsConfig {
    model: string;
    base_url?: string;
    api_key?: string;
    huggingface_model?: string;
    embedding_type: string;
}
  
  export interface SQLConfig {
    url: string;
    username: string;
    password: string;
    db_name: string;
  }
  
  export interface S3Config {
    bucket_name: string;
    region_name: string;
    aws_access_key: string;
    aws_secret_key: string;
  }
  
  export interface RAGConfig {
    llm: string;
    embeddings_model: string;
    collection: string;
    system_prompt?: string;
    contextualization_prompt?: string;
    temperature?: number;
    advancedLLMConfig?: LLMConfig;
    sql_config?: SQLConfig;
    s3_config?: S3Config;
    advancedEmbeddingsConfig?: EmbeddingsConfig;
  }
  
  export interface Agent {
    id: string;
    user_id: string;
    config: RAGConfig;
    created_at: string;
  }
  
  // Advanced configuration types for the UI
  export interface LLMAdvancedConfig {
    enabled: boolean;
    model: string;
    baseUrl: string;
    apiKey: string;
    temperature: number;
    apiType: string;
  }

  export interface EmbeddingsAdvancedConfig {
    enabled: boolean;
    model: string;
    baseUrl: string;
    apiKey: string;
    huggingface_model: string;
    embedding_type: string;
  }
  
  export interface SQLAdvancedConfig {
    enabled: boolean;
    url: string;
    username: string;
    password: string;
    dbName: string;
  }
  
  export interface S3AdvancedConfig {
    enabled: boolean;
    bucketName: string;
    regionName: string;
    awsAccessKey: string;
    awsSecretKey: string;
  }
  
  export interface AdvancedConfig {
    llm: LLMAdvancedConfig;
    sql: SQLAdvancedConfig;
    s3: S3AdvancedConfig;
    embeddings: EmbeddingsAdvancedConfig;
  }
  
  // Chat and message types
  export interface Message {
    role: 'user' | 'assistant';
    content: string;
  }
  
  export interface ChatRequest {
    agent_id: string;
    messages: Message[];
  }
  
  // Metrics types
  export interface Metrics {
    _id: string;
    agent_id: string;
    date: string;
    calls: number;
    first_token_latency?: number;
    total_response_time?: number;
  }
  
  // Type guards
  export function isValidSection(section: string): section is keyof AdvancedConfig {
    return ['llm', 'embeddings', 'sql', 's3'].includes(section);
  }
  
  export function isValidField(section: keyof AdvancedConfig, field: string): boolean {
    return Object.keys(defaultAdvancedConfig[section]).includes(field);
  }
  // Default configurations
  export const defaultAdvancedConfig: AdvancedConfig = {
    llm: {
      enabled: false,
      model: '',
      baseUrl: '',
      apiKey: '',
      temperature: 0.7,
      apiType: 'OpenAI'
    },
    embeddings: {
      enabled: false,
      model: 'text-embedding-3-small',
      baseUrl: '',
      apiKey: '',
      huggingface_model: '',
      embedding_type: 'OpenAI' 
    },
    sql: {
      enabled: false,
      url: '',
      username: '',
      password: '',
      dbName: ''
    },
    s3: {
      enabled: false,
      bucketName: '',
      regionName: '',
      awsAccessKey: '',
      awsSecretKey: ''
    }
  };
  
  // API Response types
  export interface ApiError {
    status: number;
    message: string;
    details?: any;
  }
  
  export interface JobStatus {
    _id: string;
    agent_id: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
    created_at: string;
    total_files?: number;
    processed_files?: number;
  }
  
  // Utility type for handling async state
  export type AsyncState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
  };
  
  // Form validation types
  export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
  }
  
  export interface FormField {
    value: string;
    error?: string;
    required?: boolean;
    validator?: (value: string) => boolean;
  }
  
  // Configuration mapping types for conversion between UI and API formats
  export interface ConfigMapping {
    uiToApi: {
      [K in keyof AdvancedConfig]: (config: AdvancedConfig[K]) => any;
    };
    apiToUi: {
      [K in keyof AdvancedConfig]: (config: any) => AdvancedConfig[K];
    };
  }

  export interface EvalAgent {
    id: string;
    config: {
      collection: string;
      llm: string;
    };
    status?: 'active' | 'inactive'| string;
    lastActive?: string;
  }
  
  export type EvaluationStatus = 'processing' | 'completed' | 'failed';
  export type FilterStatus = 'all' | 'active' | 'completed' | 'failed';
  
  export interface EvaluationJob {
    _id: string;
    agent_id: string;
    status: EvaluationStatus;
    progress: number;
    total_questions: number;
    processed_questions: number;
    created_at: string;
    completion_time?: string;
    error?: string;
  }
  
  export interface EvaluationResult {
    question: string;
    original_answer: string;
    generated_answer: string;
    similarity_score: number;
  }
  
  export interface AggregateMetrics {
    mean_similarity: number;
    median_similarity: number;
    min_similarity: number;
    max_similarity: number;
    std_similarity: number;
  }
  
  export interface Evaluation {
    agent_id: string;
    job_id: string;
    timestamp: string;
    status: EvaluationStatus;
    results: EvaluationResult[];
    aggregate_metrics: AggregateMetrics;
    error?: string;
  }