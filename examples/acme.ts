// 用法: CF_TOKEN=xxx npx tsx examples/acme.ts
import { AcmeClient, getProvider, CA_SERVERS } from '@stvy/acme'
import { writeFileSync } from 'node:fs'

const token = process.env.CF_TOKEN
if (!token) throw new Error('请设置环境变量 CF_TOKEN (Cloudflare API Token)')

// 1. 创建客户端
const client = new AcmeClient({

  directoryUrl: CA_SERVERS.letsencrypt,

  // directoryUrl: CA_SERVERS.zerossl,
  // accountContact: ['a@a.cn'], // auto eab
  // eab: { kid: process.env.ZEROSLS_KID || '', hmacKey: process.env.ZEROSLS_HMACKEY || '' },

  // 单域名
  // directoryUrl: CA_SERVERS.actalis,
  // eab: { kid: process.env.ACTALIS_KID || '', hmacKey: process.env.ACTALIS_HMACKEY || '' },
  
  // sslcom 单域名
  // directoryUrl: CA_SERVERS.sslcom,
  // accountContact: [process.env.SSLCOM_EMAIL || ''],
  // // https://secure.ssl.com/api_credentials
  // eab: { kid: process.env.SSLCOM_KID || '', hmacKey: process.env.SSLCOM_HMACKEY || '' },

  logger: 'debug',
})

// 2. 签发证书（DNS 提供商在签发时传入）
const cert = await client.issue({
  dnsSettleMs: 2000,
  propagationIntervalMs: 2000,
  domains: ['ae2.stvcf.ggff.net'],
  dns: getProvider('cf', { token }),
  keyType: 'ec-256', // 可选，默认 ec-256，也支持 rsa-2048
})

// 3. 保存证书文件
writeFileSync('examples/fullchain.pem', cert.fullchain)
writeFileSync('examples/privkey.pem', cert.privateKey)
writeFileSync('examples/cert.pem', cert.certificate)

console.log('证书已保存到当前目录: fullchain.pem, privkey.pem, cert.pem')


// // 第一次运行：自动注册，获取账号信息持久化
// const client = new AcmeClient({ directoryUrl: 'letsencrypt', accountContact: ['a@b.com'] })
// const { kid, keyPair } = await client.ensureAccount()
// // 保存 kid + keyPair 到数据库/文件

// // 后续运行：传入已保存的账号，跳过注册
// const client2 = new AcmeClient({
//   directoryUrl: 'letsencrypt',
//   accountKey: savedKeyPair,
//   accountUrl: savedKid,
// })
// await client2.issue({ domains: ['example.com'], dns: provider })