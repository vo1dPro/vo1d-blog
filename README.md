# vo1d-blog

React、TypeScript、Vite 博客展示端。目录 vo1d-blog，后端与管理后台在同级目录。

## 数据与实现

业务请求放在 src/services/<业务>/index.ts，接口响应及展示模型放在同目录 model.ts。共用请求、分页和媒体类型位于 services/client.ts、services/model.ts。取消、加载、成功、空列表、失败与重试状态由 hooks/usePublicQuery.ts 和 QueryContent 处理。

已接入站点资料、文章列表/详情/相关文章、分类标签、书籍、游戏、照片、技能和社交链接。需要完整列表时遍历所有接口页；任何后续页失败或数量不一致都显示错误。文章保留原卡片和标签筛选布局，不增加分页控件。

公开请求使用 VITE_API_BASE_URL（默认 http://localhost:3100）、根路径、cache: no-store，不携带管理员 Cookie。刷新页面读取后台最新公开内容；没有静态业务数据回退。站点资料和社交查询共享；切换文章时取消旧请求。

文章兼容 /blog/数字ID 与 /blog/slug。正文使用服务端清理的 contentHtml，封面、阅读时间和目录使用接口字段。未使用的 Finder 保留组件和演示文件已清理。

桌面模型在游戏区域接近视口时才加载；离屏或标签页隐藏时暂停渲染，重新可见时继续。布局、动画、主题、模型、Apple 装饰图标、页脚手势、分类图标映射及临时状态保留前端。书架 author / progress 等现有文案与样式保持不变。

游戏时长由后端统一计算：自定义时长大于 0 时覆盖 Steam，填 0 使用 Steam 按分钟汇总后向下取整的小时数；没有快照且自定义为 0 时显示 0。博客只使用最终 playtimeHours 排序和累计总时长，每款游戏计一次，不额外叠加 Steam 或自定义值。

## 本地运行

在本目录的 PowerShell 中，先执行 fnm env --shell powershell | Out-String | Invoke-Expression，再执行 fnm use 24.20.0。检查 node --version、pnpm --version、pnpm exec node --version；两个 Node.js 版本都应是 24.20.0，pnpm 为 10.23.0。

安装锁定依赖：pnpm install --frozen-lockfile。启动：pnpm dev。端口固定 5173，统一使用 localhost。先启动同级后端。按 .env.example 配置自定义地址，已有 .env 不要覆盖。

Vite 出现 504 Outdated Optimize Dep 时，先停止旧服务，再运行 pnpm dev --force 重新生成依赖缓存。

验证命令：pnpm lint、pnpm build。浏览器验收由管理后台 tests/e2e 承载，见 [当前验收](../vo1d-blog-admin/docs/current-integration.md)。

## 静态资源归档

已移除 src/data 下六个静态文件和 115 个业务/冗余图片图标文件。原组件内业务文案也已存档。

归档目录：系统桌面目录下的 `博客联动备份-20260908-001721`。

static-data-before.zip 保存原目录结构；static-manifest.json 保存源文件大小及 SHA-256；removed-media.json 列出删除的媒体。压缩包中的 134 个数据/图片文件已逐项校验，装饰图标和页脚图片仍保留在前端。source-before.zip 另保存实施前的三项目源码。

归档用于恢复及显式迁移，博客运行不依赖它。后端导入检查与迁移测试必须显式指定解压源，不能使用当前博客的 src/data。
