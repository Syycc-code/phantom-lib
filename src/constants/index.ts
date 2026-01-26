/**
 * 应用常量定义
 */

import type { Folder, Paper, PhantomStats } from '../types';

// -------------------- 初始文件夹 --------------------
export const INITIAL_FOLDERS: Folder[] = [
  { id: 'f1', name: 'Cognitive Science' },
  { id: 'f2', name: 'Metaverse Tech' }
];

// -------------------- 初始论文 --------------------
export const INITIAL_PAPERS: Paper[] = [
  { 
    id: 1, 
    title: "Cognitive Psience in the Metaverse", 
    author: "Dr. Maruki", 
    year: "2020",
    type: "PDF",
    folderId: 'f1',
    tags: ["Cognition", "Reality", "Psychology"],
    abstract: "This paper explores the theoretical framework of cognitive psience.",
    content: "CHAPTER 1: THE COGNITIVE WORLD...",
    ocrStatus: 'complete',
    shadow_problem: "Escapism from Reality",
    persona_solution: "Actualization of Will",
    weakness_flaw: "Subjective Tyranny"
  },
  { 
    id: 2, 
    title: "Mamba: Linear-Time Sequence Modeling", 
    author: "Gu, A. & Dao, T.", 
    year: "2023",
    type: "Arxiv",
    folderId: 'f2',
    tags: ["AI", "LLM", "Cognition"],
    abstract: "Foundation models, now powering most of the exciting applications...",
    content: "ABSTRACT\\n\\nTransformers have become the de facto standard...",
    ocrStatus: 'complete'
  }
];

// -------------------- 初始统计数据 --------------------
export const INITIAL_STATS: PhantomStats = {
  knowledge: 1,
  guts: 1,
  proficiency: 1,
  kindness: 1,
  charm: 1
};

// -------------------- 本地存储键名 --------------------
export const STORAGE_KEYS = {
  PAPERS: 'phantom_papers',
  FOLDERS: 'phantom_folders',
  STATS: 'phantom_stats'
} as const;

// -------------------- API端点 --------------------
export const API_ENDPOINTS = {
  SCAN_DOCUMENT: '/api/scan_document',
  MIND_HACK: '/api/mind_hack',
  CHAT: '/api/chat',
  CHAT_STREAM: '/api/chat_stream',
  FUSE: '/api/fuse'
} as const;
