/**
 * 音频系统类型定义
 */

export type SoundEffect = 'click' | 'hover' | 'confirm' | 'cancel' | 'impact' | 'rankup';

export type PlaySoundFunction = (type: SoundEffect) => void;
