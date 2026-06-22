import { getProvider } from '@stvy/acme'


// 1. 创建 Cloudflare 服务商实例（二选一）
// 方式 A：使用 API Token（推荐）
const cf = getProvider('cf', { token: process.env.CF_TOKEN })

// 方式 B：使用 Global API Key + Email
// const cf = getProvider('cf', { key: 'CF_GLOBAL_KEY', email: 'you@example.com' })

// 2. 设置上下文（需要 logger）
cf.setContext({ logger: console })

// 3. 添加 TXT 记录（例如 ACME DNS-01 验证）
await cf.createTxtRecord({
  fulldomain: 'abc.stvcf.ggff.net',
  txtvalue: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
})

console.info(`TXT 记录已添加`)

// 4. 验证完成后可删除
await cf.deleteTxtRecord({
  fulldomain: 'abc.stvcf.ggff.net',
  txtvalue: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
})

console.info(`TXT 记录已删除`)