export const validateLLMConfig = (config: any) => {
    if (!config.model) return false;
    if (!config.api_key) return false;
    if (config.temperature && (config.temperature < 0 || config.temperature > 1)) return false;
    return true;
  };
  
  export const validateSQLConfig = (config: any) => {
    if (!config.url) return false;
    if (!config.username) return false;
    if (!config.password) return false;
    if (!config.db_name) return false;
    return true;
  };
  
  export const validateS3Config = (config: any) => {
    if (!config.bucket_name) return false;
    if (!config.region_name) return false;
    if (!config.aws_access_key) return false;
    if (!config.aws_secret_key) return false;
    return true;
  };