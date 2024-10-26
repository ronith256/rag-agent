# File: app/services/storage_service.py
import boto3
from botocore.exceptions import ClientError
from typing import BinaryIO, Optional
from core.models import S3Config

class StorageService:
    def __init__(self, s3_config: Optional[S3Config] = None):
        self.s3_config = s3_config
        self.s3_client = None
        if s3_config:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=s3_config.aws_access_key,
                aws_secret_access_key=s3_config.aws_secret_key,
                region_name=s3_config.region_name
            )

    async def download_from_s3(self, file_key: str) -> BinaryIO:
        if not self.s3_client:
            raise ValueError("S3 not configured")
        try:
            response = self.s3_client.get_object(
                Bucket=self.s3_config.bucket_name,
                Key=file_key
            )
            return response['Body']
        except ClientError as e:
            raise Exception(f"Error downloading from S3: {str(e)}")