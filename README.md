# @stvy/acme

纯 TypeScript 实现的 ACME v2 客户端 SDK，专注 DNS-01 挑战验证，支持 167 个 DNS 提供商，用于自动化申请和管理 SSL/TLS 证书。

## 特性

- 纯 TypeScript，零外部 HTTP 框架依赖（使用原生 `fetch`）
- 基于 Web Crypto API（`crypto.subtle`），兼容 Node.js ≥ 24
- 支持 8 个 CA 端点（Let's Encrypt、ZeroSSL、Google、SSL.com、Actalis）
- 内置 167 个 DNS 提供商（Cloudflare、Aliyun、DNSPod、Route53、Hetzner 等）
- 账号复用机制，避免重复注册
- DNS 传播检测，可配置等待/轮询参数
- 支持 EC（P-256）和 RSA（2048）密钥类型

## 安装

```bash
pnpm add @stvy/acme
```

## 快速开始

```ts
import { AcmeClient, getProvider, CA_SERVERS } from '@stvy/acme'
import { writeFileSync } from 'node:fs'

const client = new AcmeClient({
  directoryUrl: CA_SERVERS.letsencrypt,
  accountContact: ['you@example.com'],
})

const cert = await client.issue({
  domains: ['example.com', '*.example.com'],
  dns: getProvider('cf', { token: process.env.CF_TOKEN! }),
  keyType: 'ec-256',
})

writeFileSync('fullchain.pem', cert.fullchain)
writeFileSync('privkey.pem', cert.privateKey)
```

运行示例：

```bash
CF_TOKEN=xxx pnpm example
```

## 支持的 CA

| CA 名称 | `CA_SERVERS` key | 备注 |
|---|---|---|
| Let's Encrypt | `letsencrypt` | 生产环境 |
| Let's Encrypt (Staging) | `letsencrypt_test` | 测试环境 |
| ZeroSSL | `zerossl` | 需要 EAB 凭证 |
| Google | `google` | 生产环境 |
| Google (Test) | `google_test` | 测试环境 |
| SSL.com (RSA) | `sslcom` | 需要 EAB 凭证 |
| SSL.com (ECC) | `sslcom-ecc` | 需要 EAB 凭证 |
| Actalis | `actalis` | 需要 EAB 凭证 |

ZeroSSL、SSL.com、Actalis 等 CA 需要 [EAB（External Account Binding）](https://datatracker.ietf.org/doc/html/rfc8555#section-7.3.4) 凭证，在创建客户端时通过 `eab` 参数传入：

```ts
const client = new AcmeClient({
  directoryUrl: CA_SERVERS.zerossl,
  eab: { kid: 'YOUR_KID', hmacKey: 'YOUR_HMAC_KEY' },
})
```

## API 概览

### `AcmeClient`

```ts
new AcmeClient(options: AcmeClientOptions)
```

| 选项 | 类型 | 说明 |
|---|---|---|
| `directoryUrl` | `CaName \| string` | CA 名称或自定义目录 URL |
| `accountContact` | `string[]` | 联系邮箱（自动补 `mailto:` 前缀）|
| `eab` | `{ kid, hmacKey }` | EAB 凭证（部分 CA 必须）|
| `accountKey` | `JsonWebKey` | 已有账号密钥（复用账号）|
| `accountUrl` | `string` | 已有账号 URL（复用账号）|
| `logger` | `'debug' \| 'info' \| ...` | 日志级别 |

### `client.issue(options)`

| 选项 | 类型 | 说明 |
|---|---|---|
| `domains` | `string[]` | 域名列表（支持通配符）|
| `dns` | `DnsProvider` | DNS 提供商实例 |
| `keyType` | `'ec-256' \| 'rsa-2048'` | 密钥类型，默认 `ec-256` |
| `dnsSettleMs` | `number` | DNS 首次检查等待时间（ms）|
| `propagationIntervalMs` | `number` | DNS 传播轮询间隔（ms）|

### `getProvider(id, options)`

根据提供商 ID 创建 DNS 提供商实例，如 `'cf'`、`'ali'`、`'dp'`、`'aws'`、`'hetzner'` 等。

### 账号复用

```ts
// 首次：注册并保存账号
const client = new AcmeClient({ directoryUrl: 'letsencrypt', accountContact: ['a@b.com'] })
const { kid, keyPair } = await client.ensureAccount()
// 持久化 kid + keyPair

// 后续：跳过注册
const client2 = new AcmeClient({
  directoryUrl: 'letsencrypt',
  accountKey: savedKeyPair,
  accountUrl: savedKid,
})
```

## 开发

```bash
pnpm install     # 安装依赖
pnpm build       # 构建（tsdown）
pnpm lint        # 类型检查（tsc --noEmit）
pnpm test        # 运行测试（node --test）
```

## 许可证

MIT

---

> AI 代理贡献者请参阅 [AGENTS.md](./AGENTS.md)
