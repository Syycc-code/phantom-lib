/**
 * API 请求/响应类型定义
 */

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface MindHackRequest {
  text: string;
  mode: 'translate' | 'decipher';
}

export interface MindHackResponse {
  result: string;
}

export interface FusionRequest {
  text_a: string;
  title_a: string;
  text_b: string;
  title_b: string;
}

export interface FusionResponse {
  result: string;
}

export interface ChatRequest {
  query: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
}

export interface ScanDocumentResponse {
  filename: string;
  extracted_text: string;
  char_count: number;
  error?: string;
}
