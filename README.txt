日本女优气质原型匹配系统 · Cloudflare Pages 部署说明

目录结构：
- index.html：授权码入口、五代选择、每代30题（六维各5题）、评分与海报
- admin.html：管理员统一密码入口、生成/单码查询/全部查询
- gen1.html—gen5.html：五代候选池与五方面介绍
- functions/api/check.js：授权码验证
- functions/api/generate.js：管理员批量生成
- functions/api/query.js：管理员单码/全部查询
- functions/api/list.js：管理员列表接口
- functions/api/save.js：保存测试结果

Cloudflare Pages 设置：
1. 绑定 KV Namespace，绑定变量名 MY_KV。
2. 在 Settings -> Variables and Secrets 中新增 Secret：ADMIN_PASSWORD。
3. 部署整个项目目录（必须保留 functions/api 子目录）。
4. admin.html 顶部统一输入 ADMIN_PASSWORD；此密码不会硬编码在前端。

测试结构：颜值、身材、演技、崩坏反差、公众形象、陪伴感六维；每代30题，每维5题。每题四个选项按该题所属维度计分，维度分别归一化为0—100分。

候选人维度向量、文案和分代是娱乐性编辑设定，不是客观评测、行业官方代际标准或对真人私生活的断言。部署前请人工核对候选名单、出道年份及公众资料。
