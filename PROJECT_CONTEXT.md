# PROJECT_CONTEXT

本文件记录当前 `vo1d-blog-react` 项目中 hobbies/game 模块的状态。后续关于该模块的修改以本文件为准；如果实现发生变化，先同步更新本文件。

## 项目状态

- 项目目录：`D:\Code_Project\vo1d-blog-react`
- 项目类型：Vite + React + TypeScript，`package.json` 中脚本为 `dev`、`build`、`lint`、`preview`。
- 当前目录不是 Git 仓库，无法通过 `git status` 判断改动来源；状态以文件系统和构建结果为准。
- 最近验证通过：
  - `tsc -b`
  - `vite build`
- 当前主要工作集中在 hobbies 的 game 模块，把游戏展示做成 Apple Music 播放器/iPhone mockup 风格。

## 已修改或关键文件

- `src/components/GameMusicPlayer.tsx`
  - 游戏播放器主组件。
  - 包含 Magic UI 风格 iPhone SVG 外框、状态栏、灵动岛、电源键交互、封面/评论/列表三种模式、列表点击/拖动、动态背景取色和背景切换过渡。
- `src/components/GameMusicPlayer.css`
  - 播放器所有布局、iPhone 外框位置、侧边按键、状态栏图标、封面过渡、列表尺寸、底部按钮、动态背景渐变等样式。
- `src/data/games.ts`
  - 游戏数据源。
  - 当前从 `public/images/games` 中加入大量游戏封面，`cover` 基本对应 `/images/games/<游戏名称>.jpg`。
  - `platform` 暂定为 `undefined`。
  - `playtimeHours`、`rating`、`likeLevel`、`comment` 后续需要继续补充真实数据。
- `src/types/index.ts`
  - `Game` 类型当前字段为：
    - `id`
    - `title`
    - `platform?`
    - `cover`
    - `rating`
    - `playtimeHours`
    - `likeLevel`
    - `comment`
  - 单个游戏的 `totalHours` 已删除，总游戏时长由全部游戏 `playtimeHours` 求和得到。
- `public/images/games/`
  - 游戏封面资源目录。
  - 文件名基本就是游戏名称，例如 `Counter-Strike 2.jpg`、`Cyberpunk 2077.jpg` 等。
- `public/images/apple-icons/`
  - Apple 风格图标资源目录。
  - 当前包含：`cellular.png`、`wifi.png`、`power-full.png`、`pause.png`、`previous.png`、`next.png`、`review-outline.png`、`list-lines.png`、`row-lines.png` 等。

## 当前已实现行为

- iPhone 外框
  - 使用 Magic UI 提供的 iPhone SVG 结构改造。
  - 黑色机身、黑色灵动岛。
  - 左侧有辅助键和两个音量键，右侧有电源键。
  - 手机内容被裁剪在 `.iphone-screen-slot` 内。

- 状态栏
  - 时间使用当前系统时间。
  - 灵动岛左右保留状态栏元素。
  - 右侧使用 Apple 图标资源显示蜂窝、WiFi、满电电池。

- 电源键交互
  - `.iphone-power-hotspot` 是透明可点击区域。
  - 鼠标悬停电源键附近时，手机外部显示箭头指向电源键。
  - 点击电源键会切换息屏/亮屏。
  - 息屏通过 `.game-player-shell.is-screen-off::after` 添加黑色遮罩。

- 播放器主页
  - 大封面显示当前游戏封面。
  - 名称和发行商/平台显示在封面与进度条之间。
  - 进度条左侧为当前游戏时长，右侧为所有游戏时长总和。
  - 进度条比例为 `currentGame.playtimeHours / totalGameHours`。
  - 音量条表示喜欢程度 `likeLevel`。
  - 上一首/下一首按钮用于切换上一个/下一个游戏。

- 底部三个按钮
  - 左：评价页。
  - 中：点赞。
  - 右：列表页。
  - 激活状态已去掉过强白色描边，尽量接近 Apple Music 样式。

- 评论页
  - 点击评价按钮后进入评论页。
  - 不再显示多余的翻译/跟唱按钮。
  - 评论内容来自当前游戏 `comment`。
  - 小封面、标题、点赞、更多按钮位于顶部 compact header。

- 列表页
  - 点击列表按钮后进入列表页。
  - 列表展示所有玩过的游戏，但不展示当前正在播放的游戏。
  - 列表排序逻辑：
    1. `playtimeHours` 降序
    2. `rating` 降序
    3. `title` 稳定排序
  - 列表超过约四行时通过 mask 渐进模糊/隐藏，避免硬截断。
  - 列表支持上下拖动。
  - 拖动时使用 pointer capture，拖出列表区域后仍可继续拖动，松开才结束。
  - 普通点击列表行会切换当前游戏；真实拖动超过阈值时才抑制点击。

- 页面过渡
  - 大封面和小封面之间有缩放过渡。
  - 评论页/列表页内容上升进入。
  - 评论页和列表页顶部 compact header 位置固定，二者切换时不应额外漂移。
  - 切换游戏时背景使用双层渐变交叉淡出，避免颜色硬切。

- 动态背景
  - 背景不是直接把封面当背景。
  - `GameMusicPlayer.tsx` 会通过 canvas 从当前封面提取主色、辅助色、强调色。
  - 颜色会经过暗化和降饱和处理，避免 Cyberpunk 2077 这类鲜艳封面导致文字不可读。
  - CSS 通过 `--game-bg-primary`、`--game-bg-secondary`、`--game-bg-accent`、`--game-bg-deep`、`--game-bg-glow` 生成渐变背景。

## 关键设计要求

- 整体目标是高还原 Apple Music 播放器视觉，但内容语义替换为游戏：
  - 歌曲封面 -> 游戏封面
  - 歌曲名 -> 游戏名
  - 歌手 -> 发行商/平台，当前暂为 `undefined`
  - 歌词 -> 我的评价
  - 歌单 -> 玩过的游戏列表
  - 歌曲进度 -> 游戏时长占总游戏时长
  - 音量 -> 喜欢程度
- 手机尺寸、灵动岛、状态栏图标、侧边按键比例都需要以用户给的截图为准继续微调。
- 图标优先使用用户提供的 Apple 原版图标资源，必要时用 CSS mask 调色。
- 列表页、评论页和主页要有自然过渡，不能突然跳变。
- 列表和评论页的 compact header 名称区域位置应固定；它们只需要和主页的大标题区过渡。
- 文字过长时应省略号，不允许换行挤压布局。
- 鲜艳封面生成的背景必须被压暗，保证白色文字、列表、评论内容可读。
- 游戏封面图片先以本地 `public/images/games` 为准，不额外拉取网络图片。

## 常用调节位置

- 手机整体大小：
  - `src/components/GameMusicPlayer.css`
  - `.iphone-device-frame { width: min(100%, 368px); }`
- 屏幕裁剪位置：
  - `.iphone-screen-slot`
- 电源键热点和箭头：
  - `.iphone-power-hotspot`
  - `.iphone-power-cursor`
- 背景颜色生成和暗化：
  - `src/components/GameMusicPlayer.tsx`
  - `backgroundSafeColor()`
  - `extractCoverPalette()`
- 背景视觉层：
  - `src/components/GameMusicPlayer.css`
  - `.game-bg-layer`
  - `.game-bg-layer::after`
  - `.game-bg-layer-previous`
  - `@keyframes game-bg-fade-out`
- 大封面大小和过渡：
  - `.game-cover-motion`
  - `.game-cover`
- 小封面大小：
  - `.game-cover-compact`
  - `.game-cover-compact-spacer`
  - `.game-compact-now`
- 小封面圆角：
  - 顶部 compact 小封面受 `.game-player-review .game-cover-motion .game-cover` 和 `.game-player-list .game-cover-motion .game-cover` 影响。
  - 列表小封面受 `.game-library-row .game-cover-compact` 影响。
- 主页大标题上移/下移：
  - `.game-home-panel { padding-bottom: ... }`
  - 数值增大通常会让主页标题区域上移。
- 列表页内容整体上移/下移：
  - `.game-mode-panel { padding-top: ... }`
  - 列表单独调整可新增或修改 `.game-list-panel { padding-top: ... }`
- 列表标题“继续游玩”位置：
  - `.game-mode-chips { margin-bottom: ... }`
  - `.game-list-heading { margin-top: ... }`
  - 两者相邻时只改 `.game-list-heading` 可能不明显。
- 列表可见高度、底部模糊遮罩：
  - `.game-library-list`
  - `--library-visible-rows`
  - `--library-bottom-fade`
  - `height`
  - `mask-image`
- 列表封面和字体：
  - `.game-library-list { --library-row-size: ... }`
  - `.game-library-text strong`
  - `.game-library-text small`
- 播放键/上一首/下一首图标：
  - `.apple-icon-pause`
  - `.apple-icon-previous`
  - `.apple-icon-next`
- 时长条：
  - `.game-progress-area`
  - `.game-slider`
  - `.game-time-row`
- 音量条：
  - `.game-volume-area`
  - `.game-volume-area .game-slider`
- 底部三个按钮位置：
  - `.game-bottom-nav`
  - `margin-top`
  - `transform: translateY(...)`

## 未解决问题和风险

- 项目当前不是 Git 仓库，无法可靠区分哪些变更是用户改的、哪些是 Codex 改的。
- `src/data/games.ts` 中中文字符串在 PowerShell 输出里显示为 mojibake，但 TypeScript 构建可通过。后续如果编辑中文文案，应确认文件编码和浏览器显示。
- 很多游戏数据仍是占位：
  - `platform: undefined`
  - `rating: 0`
  - `playtimeHours: 0`
  - `likeLevel: 0`
  - `comment: "暂无评价"` 或编码显示异常的占位文本
- 列表排序已经实现，但多数游戏时长和评分都是 0，因此视觉上可能仍像按标题排序；需要补真实时长和评分后才能明显体现排序效果。
- 列表拖动和点击逻辑已修，但未进行浏览器自动化点击/拖动测试；只能通过构建和代码检查确认。
- Playwright 截图验证此前不可用，原因是本环境缺少 `playwright-core`，所以视觉还原主要依赖手动截图反馈。
- 动态背景使用 `color-mix()` 和 CSS mask，现代浏览器可用；如需兼容旧浏览器，需要额外 fallback。
- Apple 图标资源来自本地图片，若文件被重命名或删除，对应 CSS mask 会失效。

## 接下来要做的任务

1. 在浏览器中手动验证列表页：
   - 点击列表行是否切换游戏。
   - 拖动列表是否顺滑。
   - 拖出列表区域后是否仍可继续拖动。
   - 正在播放的游戏是否不出现在列表内。
2. 补全 `src/data/games.ts` 中每个游戏的真实数据：
   - `platform`
   - `rating`
   - `playtimeHours`
   - `likeLevel`
   - `comment`
3. 补真实数据后再次确认列表排序是否符合：
   - 游戏时长降序
   - 时长一致按评分降序
4. 继续按截图微调视觉比例：
   - 手机外框高度和宽度
   - 侧边按键贴合度和圆角
   - 状态栏图标大小和间距
   - 封面大小
   - 标题区位置
   - 播放控制区和音量条位置
   - 底部三个按钮位置
5. 检查鲜艳封面的背景可读性，必要时继续加强 `backgroundSafeColor()` 的暗化/降饱和。
6. 如果需要更稳定的视觉验收，安装或启用 Playwright，再做桌面/移动 viewport 截图对比。
7. 后续每次完成一轮重要调整后，更新本文件的状态、未解决问题和调节位置。

## 验证命令

当前可用的验证命令：

```powershell
& 'C:\Users\vo1d\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\typescript\bin\tsc -b
```

```powershell
& 'C:\Users\vo1d\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vite\bin\vite.js build
```

也可使用项目脚本：

```powershell
pnpm build
pnpm lint
pnpm dev
```

