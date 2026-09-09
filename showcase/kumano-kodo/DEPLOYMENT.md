# 熊野路书发布

2026-09-08：GitHub → Cloudflare Pages 已完成首发与真实自动更新验证。

- 正式网址：https://kumano-roadbook.pages.dev
- 生产分支：`main`，自动部署开启；非生产分支自动预览设为 None。
- Cloudflare Pages 项目 `kumano-roadbook`（账号标识不在此记录）。
- GitHub 应用仅授权 `kumano-roadbook`；用户已确认权限并完成手机验证。

## 构建设置

框架 None；根目录为仓库根；构建命令 `sh 熊野/制作/deploy-build.sh`；输出目录 `熊野/交付/网页`。

脚本安装锁定依赖、运行核心测试、重建 story.js，再执行 `build.py --public-only --package`。仅读取制作目录内可分享 JSON；输出使用 build.py 显式白名单，不能上传整个仓库或制作目录。后续有新资源时由主任务更新白名单，字体许可同步发布。

## 验证记录

- 基线 `c01deca`，部署 `b0375f7f-5120-4fab-b972-b700c94e29b4`：GitHub Cloudflare Pages 检查 success，正式网址 HTTP 200，21 文件核验一致。
- 自动更新 `f473795708084bdc07a5b98c6c917119c47f5b94`，部署 `7f175a07-b07c-4a71-a9fe-4573998190a5`：由 main 推送触发，检查 success；原网址 HTML 已为 `20260908-live6`。
- 从该提交独立重建，线上 25 文件逐一下载后 SHA-256 全部一致，含 `kumano-title-vertical.png`、`LXGWWenKai-Regular.woff2` 与 OFL。HTML 下载需跟随 Pages 的规范路径重定向。
- Chrome 已打开正式网页并启动拉环首页。首发版交通与往返航班展开已验证。
- 手机微信尚未实测；个人清单仅在各自浏览器保存，不跨设备同步。

## 后续标准操作流程（SOP）

主任务合并已完成修改 → 检查公开数据与发布白名单 → 本地构建测试 → 提交并推送 main → 查看 Cloudflare 对应提交成功 → 回读原网址与资源 → 手机微信检查。

官方流程：https://developers.cloudflare.com/pages/get-started/git-integration/
