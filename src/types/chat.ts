/**
 * 聊天相关类型定义
 */

export type MessageRole = 'igor' | 'user' | 'oracle';

export interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  sources?: string[];
}
