# 翻译文字颜色修复 - 严格黑色

## 问题
翻译出来的文字颜色不是纯黑色，而是白色或其他颜色。

## 原因
1. ReaderOverlay使用了 `prose-invert` 类，导致文字变白
2. CSS中的prose样式使用 `#111` 而非纯黑 `#000`

## 修复内容

### 1. ReaderOverlay组件 (src/components/overlays/ReaderOverlay.tsx:482)

**修改前:**
```tsx
<div 
    className="font-serif text-lg leading-loose prose prose-invert max-w-none text-black"
    dangerouslySetInnerHTML={{ __html: formatContent(block.dst) }}
/>
```

**修改后:**
```tsx
<div 
    className="font-serif text-lg leading-loose prose max-w-none"
    style={{ color: '#000000' }}
    dangerouslySetInnerHTML={{ __html: formatContent(block.dst) }}
/>
```

**变更:**
- ❌ 移除 `prose-invert`（导致白色文字）
- ❌ 移除 `text-black`（不够强制）
- ✅ 添加 `style={{ color: '#000000' }}`（强制纯黑）

### 2. CSS样式 (src/index.css:185)

**修改前:**
```css
.prose {
  color: #111; /* 纯黑文字 */
  line-height: 1.8;
}
```

**修改后:**
```css
.prose {
  color: #000000 !important; /* 强制纯黑文字 */
  line-height: 1.8;
}

.prose * {
  color: inherit !important; /* 所有子元素继承黑色 */
}

.prose strong,
.prose b {
  color: #000000 !important; /* 粗体也是纯黑 */
  font-weight: bold;
}

.prose h1, 
.prose h2, 
.prose h3, 
.prose h4, 
.prose h5, 
.prose h6 {
  color: #000000 !important; /* 标题纯黑 */
}

.prose p,
.prose span,
.prose div,
.prose li {
  color: #000000 !important; /* 所有文本纯黑 */
}

.prose code {
  color: #d63384 !important; /* 代码块保持特殊颜色 */
}
```

**变更:**
- ✅ 使用 `#000000` 替代 `#111`（严格纯黑）
- ✅ 添加 `!important` 强制优先级
- ✅ 覆盖所有prose子元素（h1-h6, p, span, div, li）
- ✅ 保持代码块的特殊颜色

## 效果

### 修复前
- 翻译文字可能显示为白色（因为prose-invert）
- 或显示为深灰色 #111
- 在不同主题下颜色不一致

### 修复后
- ✅ 翻译文字**严格显示为纯黑色** #000000
- ✅ 所有文本元素（标题、段落、列表）都是纯黑
- ✅ 使用 `!important` 确保优先级最高
- ✅ 代码块保持特殊颜色以区分

## 测试步骤

1. 刷新前端页面
2. 打开任意PDF
3. 进入分屏模式
4. 点击"Translate Page"翻译页面
5. 查看右侧翻译文本

**预期结果:**
- 所有翻译文字显示为**严格的纯黑色** (#000000)
- 文字清晰可读
- 无白色或灰色文字

## 相关文件

- `src/components/overlays/ReaderOverlay.tsx` - 翻译显示组件
- `src/index.css` - 全局样式

## 版本

修复时间: 2026-02-10  
涉及版本: v1.2.1+
