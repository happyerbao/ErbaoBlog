# Erbao's Blog

个人博客，基于 Next.js 15 搭建，支持 Markdown 编辑、评论审核、访客追踪。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: PostgreSQL (Neon)
- **ORM**: Prisma
- **认证**: iron-session
- **部署**: Vercel

## 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入真实值
# DATABASE_URL、ADMIN_USERNAME、ADMIN_PASSWORD_HASH、SESSION_SECRET

# 同步数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

浏览器打开 http://localhost:3000。

## 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接串 |
| `ADMIN_USERNAME` | 后台登录用户名 |
| `ADMIN_PASSWORD_HASH` | 密码的 bcrypt 哈希，用 `node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('你的密码', 10));"` 生成 |
| `SESSION_SECRET` | 会话加密密钥，随机字符串（32 位以上） |

## 部署

1. 创建 [Neon](https://neon.tech) 免费数据库，获取连接串
2. 在 [Vercel](https://vercel.com) 导入 GitHub 仓库
3. 在 Vercel 项目设置中添加上方 4 个环境变量
4. Vercel Build Command 设为：`npx prisma db push --accept-data-loss && next build`
5. 部署

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 首页（ISR）
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # 全局样式
│   ├── login/                # 登录页
│   ├── posts/[slug]/         # 文章详情（ISR）
│   ├── admin/                # 后台管理
│   │   ├── page.tsx          # 仪表盘
│   │   ├── posts/            # 文章管理
│   │   ├── comments/         # 评论审核
│   │   ├── visitors/         # 访客记录
│   │   └── settings/         # 设置
│   └── api/                  # API 路由
│       ├── auth/             # 登录/登出
│       ├── posts/            # 文章、评论、点赞、阅读
│       └── admin/            # 后台 CRUD
├── components/               # UI 组件
├── lib/                      # 核心库
│   ├── prisma.ts             # 数据库客户端
│   ├── auth.ts               # 会话管理
│   ├── validators.ts         # 输入校验
│   ├── rate-limit.ts         # 速率限制
│   ├── ip-geo.ts             # IP 定位
│   └── sanitize.ts           # XSS 过滤
├── middleware.ts              # 路由守卫
└── prisma/
    └── schema.prisma         # 数据模型
```

## 功能

- Markdown 编辑 + 实时预览
- 文章草稿 / 发布
- 评论提交 + 管理员审核
- 点赞
- 阅读量统计
- 访客 IP + 地理位置记录
- 速率限制
- 响应式布局
