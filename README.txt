部署说明
1. 将此目录作为 Cloudflare Pages 项目根目录部署。
2. 在 Pages 项目绑定 KV Namespace，绑定变量名必须是 MY_KV。
3. 在 Pages Settings > Variables and Secrets 设置 ADMIN_PASSWORD（管理员密码）；不要把密码写进前端或源码。
4. functions/api 下的文件对应 /api/check、/api/generate、/api/query、/api/save、/api/list。
5. 授权码默认有效期30天；如需更改 generate.js 的 expirationTtl。
6. 每代20道题，五代题目场景分别编写；六个维度分别计算，综合匹配采用加权欧氏距离，每维度另算冠军。
7. 人物原型向量和人物描述是娱乐性编辑设定，不是对真人性格的事实判断。分代是按首次正式出道的大致时间范围，跨代知名人物可能仅作为传播影响参考。
安全注意：Cloudflare KV 不提供事务或原子 compare-and-swap。当前 save.js 适用于一般低并发娱乐项目；若同一授权码可能被多人同时提交，需要用 Durable Objects 或具备事务能力的数据库实现原子扣次。
