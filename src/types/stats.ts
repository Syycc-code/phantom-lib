/**
 * 统计数据相关类型定义
 */

export interface PhantomStats {
  knowledge: number;
  guts: number;
  proficiency: number;
  kindness: number;
  charm: number;
}

export type StatKey = keyof PhantomStats;
