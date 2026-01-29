/**
 * 文件夹相关类型定义
 */

export interface Folder {
  id: string;
  name: string;
  description?: string;
}

export interface FolderCreate {
  name: string;
  description?: string;
}


// Alias for backward compatibility
export type FolderType = Folder;
