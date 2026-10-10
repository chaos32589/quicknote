# 随记 Quicknote

当前数据库已在新加坡 quicknote 项目初始化。前端公开连接参数已写入 supabase.config.json；无需设置 GitHub Variables。此文件仅包含 publishable key，数据由 RLS 与私有图片桶保护。

## GitHub Pages 开通

仓库 Settings → Pages → Source 选 GitHub Actions，然后在 Actions 运行 Deploy Quicknote to GitHub Pages。部署成功后以工作流给出的地址为准。

无需真实邮箱或邮件验证。首次点击“首次设置”，输入用户名（3–24 位字母、数字或下划线）、至少 10 位密码和一次性初始化码。初始化码不在仓库中；它由服务端哈希验证，成功后失效。其他账号没有便签和图片使用权限。登录底层使用内部标识，不发送邮件。


手机与电脑之间的私人文字、图片便签。静态网页 + Supabase Auth/Postgres/Storage，支持 GitHub Pages 子路径部署。

## 功能

- 用户名密码登录；一次性初始化码开通唯一私人账号。
- 保存文字/链接和单张原图（JPG、PNG、WebP、GIF，最大 10 MB）。
- 图片选择、拖拽、截图粘贴；文字复制；原图下载；兼容浏览器支持复制 PNG。
- 每 10 秒同步，重新进入页面/网络恢复时同步；搜索全库文字；分页加载；删除。
- RLS 账号隔离、私有图片桶、短时签名预览地址。
- 上传失败保留当前输入；尚未保存时离开页面提醒。

## 部署

1. 当前项目已初始化，请勿重复执行 setup.sql。仅迁移至新项目时运行一次。
2. 保留 Auth Email/password provider 供内部标识登录，私人账号由 initialize-owner 函数自动确认。
3. 将源码放入 GitHub 仓库 main 分支。
4. 已提供默认配置。若迁移项目，可修改 supabase.config.json，或用以下 Variables 覆盖：
   - `SUPABASE_URL`：项目 URL。
   - `SUPABASE_PUBLISHABLE_KEY`：前端 publishable key（也兼容 legacy anon key）。
   **绝不能填 service_role 或 sb_secret key。** 前端 key 可以公开，数据权限由 RLS 保护。
5. Settings → Pages → Source 选 GitHub Actions。手动运行 Deploy Quicknote 工作流，或推送 main。
6. 打开部署地址，在两个设备登录同一账号验证。

私人使用可先创建自己的账号，再在 Supabase Auth 关闭新用户注册。网页入口本身公开，便签内容与图片仍需要登录。

## 本地构建

需要 Node 22+。

```sh
npm ci
npm run check
cp .env.example .env
# 编辑 .env 中两个公开配置项
node --env-file=.env build.mjs
python3 -m http.server 8080 --directory dist
```

未提供配置时构建为明确提示“等待连接”的页面，不会假装已同步。CI 强制要求配置。

## 验收清单

- 设备 A 保存文字，设备 B 最迟约 10 秒出现，刷新后仍存在。
- 图片上传后另一端可预览、下载原图、在支持的浏览器里复制。
- 搜索历史文字；超过 40 条时加载更多。
- 删除后另一端同步消失。
- 用两个不同账号确认文字和图片互相不可见；未登录不能读写。
- 断网保存必须失败且保留输入；恢复网络后可重试。

## 已知边界

不做离线队列和富文本；刷新前未保存的输入不是云端记录。图片采用单张上传，无精确百分比进度。上传与数据库插入非跨服务事务：网络中断时可能留下未引用图片；不确定写入结果时先核对记录再重试。删除会先清理图片再删除记录，第二步失败可再次删除。轮询不会后台读取系统剪贴板。

## 当前验证状态

源码语法与打包需通过；Supabase 项目和 GitHub 仓库归属确认前，不会更改现有项目。真实账号登录、RLS 双账号隔离、跨端同步及 GitHub Pages 部署需要配置后完成验收。

## 私人模式

initialize-owner 使用一次性高熵初始化码验证身份，因此不要求现有登录 JWT。只能创建一个带服务端 quicknote_owner 标记的账号；RLS 对便签和图片强制检查该标记。quicknote_bootstrap 对浏览器完全不可访问。Supabase 原始 signup 接口即使仍开放，其账号也不能使用本应用数据或图片存储。不要把初始化码或 service_role 放入仓库。
