# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 本地博客与后端

在本目录切换至 Node.js 24 后执行 `pnpm install --frozen-lockfile`、`pnpm dev --host localhost --port 5173 --strictPort`。后端需先启动在 3100；其他地址通过 `.env` 的 `VITE_API_BASE_URL` 配置。构建用 `pnpm build`，静态检查用 `pnpm lint`。

技能、导航与页脚社交链接、游戏已读取后端；相同 Steam App ID 汇总多个账号时长。文章列表、分类标签、详情与相关文章、书籍、照片、站点资料现已全部读取公共接口，详见 [完整联动与验收](../vo1d-blog-admin/docs/full-integration.md)。技能与社交图标由后台媒体管理，原文件已归档到桌面，位置与检查命令见下方“原始资源归档”。三项目完整启动与迁移清单见 [使用说明](../vo1d-blog-admin/docs/usage-guide.md)，新增功能见 [图标与多账号说明](../vo1d-blog-admin/docs/icons-multi-steam.md)。

.node-version 固定 24.20.0；进入目录后同时检查 `node --version` 和 `pnpm exec node --version`。全部请求复用 `src/lib/public-content.ts`，访客不带管理员 Cookie。文章保留 `/blog/数字ID`，同时支持 slug；生产部署需将这类前端路径回退到 index.html。


## 原始资源归档

2026-09-07，按要求将已经由后端提供的 110 个本地媒体原件移出项目，保存于本机桌面的 `博客已迁移资源-2026-09-07` 文件夹（不随仓库发布）。内含 `归档内容` 文件夹、`原始资源.zip`、说明和 SHA-256 校验清单；归档保留原相对目录，以及 8 个迁移数据文件副本。

移出范围：文章封面 6 张、书籍封面 3 张、游戏封面 47 张、照片和缩略图 20 张、技能与社交图标 34 个，共 55,170,160 字节。书籍资源只有封面，没有电子书正文。原 `src/data` 和 `src/lib/blog.ts` 保留；前端装饰 `apple-icons`、`footer`、`models` 及 5 个未纳入迁移的图标继续留在项目。后台后续上传的图片保存在 MinIO，不在这份历史原图归档内。

普通启动不需要该归档。以下两个命令在后端目录运行，仅读取归档，不写入业务数据：

```powershell
$archiveRoot = Join-Path ([Environment]::GetFolderPath('Desktop')) '博客已迁移资源-2026-09-07\归档内容\vo1d-blog'
pnpm import:frontend -- --source "$archiveRoot" --check
pnpm import:icons -- --source "$archiveRoot" --check
```

原项目路径现已不包含完整迁移媒体，旧文档中针对该路径的导入示例需改用上述归档路径。不要去掉 `--check` 做日常同步，以免覆盖后台编辑。后端依赖历史原图的隔离测试需先执行上述 `$archiveRoot` 定义，再设置 `$env:FRONTEND_SOURCE_PATH = $archiveRoot`，然后运行 `pnpm test:e2e`。移动归档目录后相应调整路径；恢复原图时按归档中的相对目录复制回项目，不需要覆盖源代码。

上传仓库与首次上线请先阅读 [发布准备说明](../vo1d-blog-admin/docs/release-guide.md)。源码副本不包含本地环境变量、数据库、媒体数据卷或旧 Git 历史。
