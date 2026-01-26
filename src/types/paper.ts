/**
 * 论文相关类型定义
 */

export type PaperType = 'PDF' | 'Arxiv' | 'WEB' | 'FILE' | 'IMG';
export type OCRStatus = 'idle' | 'scanning' | 'complete' | 'failed';

export interface Paper {
  id: number;
  title: string;
  author: string;
  year: string;
  type: PaperType;
  folderId?: string;
  tags: string[];
  abstract: string;
  content?: string;
  fileUrl?: string;
  shadow_problem?: string;
  persona_solution?: string;
  weakness_flaw?: string;
  ocrStatus?: OCRStatus;
}

export interface PaperCreate {
  title: string;
  author: string;
  year: string;
  type: PaperType;
  abstract: string;
  tags?: string[];
}

export interface PaperUpdate {
  title?: string;
  author?: string;
  year?: string;
  abstract?: string;
  tags?: string[];
  shadow_problem?: string;
  persona_solution?: string;
  weakness_flaw?: string;
}
