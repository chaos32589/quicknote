# 随记 Quicknote

私人跨设备文字与图片便签，GitHub Pages + Supabase。

## 使用

首次打开页面，设置并重复输入 6 位数字访问码，填写私下提供的一次性初始化码。设置后不再注册或使用邮箱。所有设备使用相同访问码。刷新或重新打开页面需要重新解锁；不将登录会话持久化到浏览器。

初始化码不包含在此仓库中。前端配置只包含可公开的 Supabase publishable key。

## 功能

文字/链接、单张图片（JPG、PNG、WebP、GIF；20MB），通用文件（当前免费套餐50MB；100MB需要升级后调整桶限制及 FILE_LIMIT）、复制文字、下载原图、兼容浏览器复制图片、搜索、分页、删除和 60 秒自动同步及手动刷新；输入文字或有未保存内容时暂停自动同步。

## 安全模型

initialize-owner 函数接收 status/setup/login 请求。setup 需要 128 位随机初始化码，并且全局仅能成功一次。login 接受 6 位 PIN，服务端将 PIN 与服务端密钥进行 HMAC 后交给 Supabase Auth 验证；前端无法直接推导内部密码绕过限制。15 分钟窗口最多 5 次尝试，登录成功清零。限制是全局的，外人连续尝试也可能造成临时锁定。PIN 不保存在数据库中。轮换服务端 service_role 密钥后需重新设置访问码。

便签和私有图片桶同时检查用户归属及不可由客户端修改的 quicknote_owner 标记。bootstrap、pin_limit 表对浏览器不开放。原始 Supabase 注册接口即使开放，也不能授予该标记或使用便签/图片。

## 开发与部署

Node 22+，npm ci，npm run check，npm run build。GitHub Actions 自动构建并部署到 Pages。public 为页面，src/app.js 为逻辑，supabase/functions/initialize-owner 为服务端函数。

当前项目数据库已初始化，勿重新执行 setup.sql。后续迁移项目需要一并迁移私人账号限制和 PIN 限流函数（在 Supabase migration history 中），配置新的初始化码哈希。不要公开 service_role 或初始化码。

## 边界

不支持离线队列、忘记访问码自助恢复；输入未保存时刷新可能丢失。图片上传和记录写入不是跨服务事务，中断时可能存在未引用图片。网页地址公开，便签内容和图片须通过访问码验证后才可访问。

新增图片在浏览器生成最长边 960px、质量 0.72 的 WebP 预览（不支持 WebP 编码的浏览器回退 PNG）；原图独立保留，下载原图使用私有短期签名链接。已有图片保留原来的展示方式，未自动迁移。GIF 列表预览为静态，下载保留原 GIF。
