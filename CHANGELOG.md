# Changelog

All notable changes to Phantom Library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-02-10

### 🎉 Major Update: Studio Toolbox Enhancement

This release focuses on dramatically improving the Studio Tools experience with real-time editing, fullscreen mode, history management, and beautiful animations.

### Added

#### Studio Tools Enhancement
- **Real-time Markdown Editor** - Dual-pane editor with live preview
  - Left pane: Markdown text editor
  - Right pane: Live preview with syntax highlighting
  - Support for all Studio tools (Mind Map, Report, Flashcards, etc.)
  - Mermaid diagram real-time rendering
  - Math formulas support (KaTeX)
  
- **Fullscreen Work Mode** - Immersive creation experience
  - Dedicated fullscreen interface for Studio results
  - Adaptive layout maximizing workspace
  - Smooth enter/exit animations
  
- **Studio History Management** - Never lose your work
  - Auto-save last 20 generated results
  - One-click load previous results
  - LocalStorage persistence across sessions
  - Visual categorization by tool type (Mind Map, Report, etc.)
  - Delete unwanted history items
  
- **Keyboard Shortcuts System** - Boost productivity
  - `E` - Toggle edit mode
  - `F` - Toggle fullscreen
  - `Esc` - Close/cancel
  - `Ctrl+S` - Save edits
  - Visual hints at bottom of modal
  
- **Beautiful Loading Animations** - Persona 5 styled progress indicators
  - 4-step progress system (Analyzing → Processing → Generating → Finalizing)
  - Real-time progress bar (0-95%)
  - Animated tool icons
  - Dynamic background patterns
  - Professional visual feedback

#### Citation & Reference Enhancement
- **Enhanced Citation Preview** - Completely redesigned hover experience
  - Larger, more prominent citation tags (red background with yellow border)
  - Glow effect on hover (scale 1.25x)
  - Expanded preview window (350px → 500px)
  - Gradient header with animated background
  - Larger decorative quotes (4xl → 6xl)
  - Color gradient dividers
  - Spring animation effects
  
- **Split View Page Navigation** - Fixed PDF page jumping
  - Fixed issue where Split View only showed page 1
  - Added Previous/Next page buttons
  - Direct jump to citation page
  - Triple page-setting mechanism (URL fragment + iframe key + PDF.js API)
  - Page number display in navigation bar

### Changed

#### UI/UX Improvements
- Citation tags: Enhanced from simple red to red+yellow with glow
- Studio buttons: Improved hover effects
- Tool result modal: Increased size from 4xl to 6xl
- Preview window: Better positioning and sizing
- Overall Persona 5 theme consistency

#### Technical Improvements
- Added `StudioLoadingOverlay` component for professional loading animations
- Enhanced `CitationPreview` component with better styling
- Improved state management with 7 new state variables
- Better error handling and user feedback
- Optimized iframe reloading strategy

### Fixed
- Split View PDF now correctly displays the cited page instead of always page 1
- Citation preview window positioning improved
- Studio tool generation error handling enhanced
- Page navigation in Split View now works reliably

### Technical Details

#### New Components
- `src/components/shared/StudioLoadingOverlay.tsx` - Loading animation system
- Enhanced `src/components/shared/CitationPreview.tsx` - Citation preview

#### New State Variables
- `isEditingTool` - Edit mode toggle
- `editedContent` - Editor content
- `isToolFullscreen` - Fullscreen mode toggle
- `generatingToolInfo` - Loading animation info
- `studioHistory` - Tool result history
- `showStudioHistory` - History panel toggle

#### LocalStorage Keys
- `phantom_studio_history` - Stores generated tool results

---

## [1.1.0] - 2025-02-03

### Added
- **AI Assistant Toolbox (Studio Tools)**: 8 professional academic tools
  - Mind Map - Interactive Mermaid knowledge graphs
  - Info Map - Concept visualization flowcharts
  - Report - Auto-generated academic papers
  - Flashcards - Memory card sets
  - Poster - Conference poster layouts
  - Presentation - Slide outlines
  - Audio Script - Podcast/audio course scripts
  - Video Script - Educational video scripts
  
- **Smart Citation Jumping**: Citations in AI assistant support click-to-jump to original text
- **Batch Upload Optimization**: Fixed multi-file upload processing

### Changed
- Greatly optimized RAG vector database stability and error handling
- Reduced batch indexing memory usage (Batch Size: 10→1)
- Enhanced math formula readability in AI chat interface
- Backend default port changed from 8000 to 8002 to avoid conflicts

### Fixed
- Multiple backend concurrency crashes
- Multi-file upload only processing first file

### Dependencies
- Added: Mermaid chart library (^11.12.2)
- Added: React-Mermaid2 component (^0.1.4)

---

## [1.0.0] - 2025-02-02

### Initial Release
- Complete literature management and AI-assisted reading system
- DeepSeek API integration for intelligent Q&A
- ChromaDB vector storage for full-text retrieval
- 3D knowledge graph visualization (Three.js + React Three Fiber)
- Persona 5 theme UI design
- PDF OCR with RapidOCR
- Context-aware translation
- Split-screen reading mode

---

[1.2.0]: https://github.com/your-username/phantom-lib/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/your-username/phantom-lib/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/your-username/phantom-lib/releases/tag/v1.0.0
