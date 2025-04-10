export interface UploadedImage {
  fileName: string;
  status: string;
  aiTags?: string;
  instanceId: string;
}

export interface UploadResponse {
  id: string;
  details: {
    status: string;
    [key: string]: unknown;
  };
  success: boolean;
  message: string;
}

export interface StatusResponse {
  status: string;
  error?: string;
  output?: {
    [key: string]: unknown;
  };
}
