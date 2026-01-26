# 📘 组件重构使用指南

## 🎯 目的
本指南说明如何在 `App.tsx` 中使用已提取的组件，实现代码模块化。

---

## ✅ 已提取的组件

### 1. **RankUpNotification** - 等级提升通知
**位置**: `src/components/notifications/RankUpNotification.tsx`

**原始代码（App.tsx第327-329行）**:
```typescript
const RankUpNotification = ({ stat }: { stat: string | null }) => (
  <AnimatePresence>{stat && (...)}</AnimatePresence>
);
```

**新用法**:
```typescript
import { RankUpNotification } from './components';

// 在App组件中使用
<RankUpNotification stat={showRankUp} />
```

---

### 2. **TransitionCurtain** - 过渡动画幕布
**位置**: `src/components/transitions/index.tsx`

**原始代码（App.tsx第336行）**:
```typescript
const TransitionCurtain = ({ isActive }: { isActive: boolean }) => (
  <AnimatePresence>{isActive && (...)}</AnimatePresence>
);
```

**新用法**:
```typescript
import { TransitionCurtain } from './components';

// 在App组件中使用
<TransitionCurtain isActive={showCurtain} />
```

---

### 3. **ShatterEffect** - 碎裂特效
**位置**: `src/components/transitions/index.tsx`

**原始代码（App.tsx第337行）**:
```typescript
const ShatterEffect = () => (
  <motion.div {...}><svg>...</svg></motion.div>
);
```

**新用法**:
```typescript
import { ShatterEffect } from './components';

// 在VelvetOverlay中使用
{step === 2 && <ShatterEffect />}
```

---

### 4. **StatsOverlay** - 统计数据覆盖层
**位置**: `src/components/overlays/StatsOverlay.tsx`

**原始代码（App.tsx第331-334行）**:
```typescript
const StatsOverlay = ({ stats, onClose, playSfx }: { 
  stats: PhantomStats, 
  onClose: () => void, 
  playSfx: any 
}) => { ... };
```

**新用法**:
```typescript
import { StatsOverlay } from './components';
import type { PhantomStats, PlaySoundFunction } from './types';

// 在App组件中使用
{showStats && (
  <StatsOverlay 
    stats={stats} 
    onClose={() => setShowStats(false)} 
    playSfx={playSfx} 
  />
)}
```

**优势**: 现在使用了类型安全的 `PlaySoundFunction` 替代 `any`

---

## 🔧 如何在App.tsx中应用这些改进

### 步骤1: 添加导入语句

在 `App.tsx` 文件顶部添加：

```typescript
// 导入类型
import type { 
  Paper, 
  Folder, 
  PhantomStats, 
  PlaySoundFunction,
  ChatMessage 
} from './types';

// 导入常量
import { 
  INITIAL_FOLDERS, 
  INITIAL_PAPERS, 
  INITIAL_STATS,
  STORAGE_KEYS 
} from './constants';

// 导入Hook
import { useAudioSystem } from './hooks/useAudioSystem';

// 导入组件
import { 
  RankUpNotification, 
  TransitionCurtain, 
  ShatterEffect,
  StatsOverlay 
} from './components';
```

### 步骤2: 替换类型定义

**删除** App.tsx中的这些类型定义（第154-188行）：
```typescript
// ❌ 删除这些
interface FolderType { ... }
interface Paper { ... }
interface ChatMessage { ... }
interface PhantomStats { ... }
```

**使用** 导入的类型：
```typescript
// ✅ 使用导入的类型
const [papers, setPapers] = useState<Paper[]>(() => { ... });
const [folders, setFolders] = useState<Folder[]>(() => { ... });
const [stats, setStats] = useState<PhantomStats>(() => { ... });
```

### 步骤3: 替换常量

**删除** App.tsx中的常量定义（第190-232行）：
```typescript
// ❌ 删除这些
const INITIAL_FOLDERS: FolderType[] = [ ... ];
const INITIAL_PAPERS: Paper[] = [ ... ];
const INITIAL_STATS: PhantomStats = { ... };
```

**使用** 导入的常量：
```typescript
// ✅ 使用导入的常量
const [papers, setPapers] = useState<Paper[]>(() => {
  const saved = localStorage.getItem(STORAGE_KEYS.PAPERS);
  return saved ? JSON.parse(saved) : INITIAL_PAPERS;
});
```

### 步骤4: 替换音频Hook

**删除** App.tsx中的useAudioSystem定义（第55-152行）：
```typescript
// ❌ 删除整个useAudioSystem函数
const useAudioSystem = () => { ... };
```

**使用** 导入的Hook：
```typescript
// ✅ 使用导入的Hook
const playSfx = useAudioSystem();
```

### 步骤5: 替换组件定义

**删除** App.tsx中的组件定义：
```typescript
// ❌ 删除这些组件定义
const RankUpNotification = ({ stat }: { stat: string | null }) => ( ... );
const StatsOverlay = ({ stats, onClose, playSfx }: { ... }) => { ... };
const TransitionCurtain = ({ isActive }: { isActive: boolean }) => ( ... );
const ShatterEffect = () => ( ... );
```

**保留** 组件的使用位置不变，它们会自动使用导入的新组件。

---

## 📊 改进效果

### 代码行数减少
| 文件 | 改进前 | 改进后 | 减少 |
|------|--------|--------|------|
| **App.tsx** | ~643行 | ~450行 | **-193行 (-30%)** |

### 类型安全提升
| 项目 | 改进前 | 改进后 |
|------|--------|--------|
| **any类型使用** | 3处 | 0处 |
| **类型定义集中** | ❌ 分散 | ✅ 统一 |
| **IDE自动补全** | ⚠️ 部分支持 | ✅ 完全支持 |

---

## ⚠️ 注意事项

### 1. 保持兼容性
- 所有组件的Props接口保持不变
- 组件的使用方式完全一致
- 不需要修改任何现有逻辑

### 2. 逐步迁移
建议按以下顺序进行迁移：
1. ✅ 先导入类型和常量（最安全）
2. ✅ 再导入Hook（独立功能）
3. ✅ 最后导入组件（逐个验证）

### 3. 测试验证
每次修改后，建议测试以下功能：
- [ ] 音频系统正常工作
- [ ] 等级提升通知显示正常
- [ ] 统计数据弹窗正常
- [ ] 过渡动画流畅

---

## 🚀 完整迁移示例

### 修改前的App.tsx结构：
```typescript
// App.tsx (643行)
import { ... } from 'framer-motion';

// 定义类型
interface Paper { ... }
interface Folder { ... }

// 定义常量
const INITIAL_PAPERS = [ ... ];

// 定义Hook
const useAudioSystem = () => { ... };

// 定义组件
const RankUpNotification = () => { ... };
const StatsOverlay = () => { ... };

// 主组件
function App() { ... }
```

### 修改后的App.tsx结构：
```typescript
// App.tsx (450行)
import { ... } from 'framer-motion';

// 导入类型
import type { Paper, Folder, PhantomStats } from './types';

// 导入常量
import { INITIAL_PAPERS, INITIAL_FOLDERS } from './constants';

// 导入Hook
import { useAudioSystem } from './hooks/useAudioSystem';

// 导入组件
import { RankUpNotification, StatsOverlay } from './components';

// 主组件（其他大型组件仍在此文件）
const SubwayOverlay = () => { ... };
const ReaderOverlay = () => { ... };
const VelvetOverlay = () => { ... };

function App() { ... }
```

---

## 📝 下一步建议

### 优先级P1（立即可做）
1. ✅ 在App.tsx中添加导入语句
2. ✅ 替换类型定义和常量
3. ✅ 使用新的音频Hook
4. ✅ 使用提取的小组件

### 优先级P2（后续改进）
5. 🔄 继续提取大型组件（SubwayOverlay, ReaderOverlay等）
6. 🔄 提取LeftPane, MiddlePane, RightPane
7. 🔄 创建自定义Hook（usePapers, useFolders等）

---

## 💡 最佳实践

### 1. 组件命名
- 使用PascalCase命名组件
- 组件名应描述其功能
- 避免过于抽象的名称

### 2. 文件组织
```
src/
├── components/
│   ├── notifications/   # 通知类组件
│   ├── overlays/       # 覆盖层组件
│   └── transitions/    # 动画过渡组件
├── hooks/              # 自定义Hooks
├── types/              # 类型定义
└── constants/          # 常量配置
```

### 3. 导入顺序
```typescript
// 1. 外部依赖
import { useState } from 'react';
import { motion } from 'framer-motion';

// 2. 类型导入
import type { Paper } from './types';

// 3. 常量导入
import { INITIAL_PAPERS } from './constants';

// 4. Hook导入
import { useAudioSystem } from './hooks';

// 5. 组件导入
import { RankUpNotification } from './components';
```

---

## 🔗 相关文档

- [REFACTORING.md](./REFACTORING.md) - 完整的重构文档
- [.env.example](./.env.example) - 环境配置示例
- [TypeScript文档](https://www.typescriptlang.org/)
- [React最佳实践](https://react.dev/)

---

**更新时间**: 2026-01-26  
**维护者**: Refactoring Team  
**分支**: `refactor/architecture-improvement`
