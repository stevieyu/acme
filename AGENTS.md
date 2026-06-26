# AGENTS.md — AI 代理开发指南

本文件面向 AI 代理（Cursor、Qoder 等），帮助理解项目结构与开发规范。

## 项目定位

`@stvy/acme` 是纯 TypeScript 的 ACME v2 客户端 SDK，专注 DNS-01 挑战验证，对标 [acme.sh](https://github.com/acmesh-official/acme.sh) 的 CA 行为与命名规范。

## 技术栈

- **运行时**：Node.js ≥ 24
- **语言**：TypeScript（`isolatedDeclarations`，`allowImportingTsExtensions`）
- **构建**：`tsdown`（输出 `.mjs`，声明文件 `.d.cts`）
- **加密**：Web Crypto API（`crypto.subtle`）+ `@peculiar/x509`
- **HTTP**：原生 `fetch`
- **测试**：Node.js 内置测试运行器（`node --test`），无框架
- **包管理**：pnpm

## 目录结构

```
src/
├── acme/         # ACME 协议核心：账号、订单、挑战、目录、nonce、错误
│   ├── client.ts     # AcmeClient 主类，对外 API 入口
│   ├── account.ts    # 账号注册/复用，EAB 处理
│   ├── order.ts      # 订单创建与状态轮询
│   ├── directory.ts  # CA 目录 URL 映射（CaName → URL）
│   ├── nonce.ts      # Replay-Nonce 管理
│   ├── http.ts       # ACME HTTP 请求封装（JWS 签名）
│   ├── errors.ts     # AcmeError 错误类
│   └── types.ts      # ACME 协议类型定义
├── crypto/       # 密钥/签名/摘要工具
│   ├── keys.ts       # EC/RSA 密钥生成（_createkey）
│   ├── csr.ts        # CSR 生成（_createcsr）
│   ├── jwk.ts        # JWK 序列化（字段顺序敏感，ACME 规范要求）
│   ├── jws.ts        # JWS 签名（flattened JSON）
│   ├── digest.ts     # SHA-256 摘要
│   └── challenge.ts  # DNS-01 keyAuthorization 计算
├── dns/          # DNS 传播检测
│   ├── resolver.ts   # resolveDns01Challenge：轮询 TXT 记录直到传播完成
│   └── doh.ts        # DNS-over-HTTPS 查询（多 DoH 服务商）
├── dnsapi/       # DNS 提供商适配器（167 个）
│   ├── types.ts      # DnsProvider 接口
│   ├── errors.ts     # DnsProviderError 错误类
│   ├── base-http.ts  # HTTP Bearer Token 基类
│   ├── base-hmac.ts  # HMAC 签名基类（腾讯云、阿里云等）
│   ├── base-xml.ts   # XML API 基类
│   ├── dns_cf.ts     # Cloudflare（独立实现，最完整参考）
│   ├── dns_dp.ts     # DNSPod
│   ├── dns_ali.ts    # 阿里云
│   ├── dns_aws.ts    # AWS Route53
│   ├── dns_hetzner.ts # Hetzner
│   ├── dns_pleskxml.ts # Plesk XML API
│   └── dns_*.ts      # 其他提供商（一文件一 provider）
└── util/         # 工具
    ├── logger.ts     # 分级日志
    ├── retry.ts      # 带退避的重试
    └── http.ts       # HTTP 辅助
```

## 开发规范

### 通用原则（ponytail 规则）

项目遵循"懒惰的高级开发者"原则，详见 `.qoder/rules/ponytail.md`：

- 优先使用标准库/已安装依赖，避免引入新依赖
- 最少代码实现功能，不写未被请求的抽象
- 有意简化处标注 `// ponytail:` 注释，说明上限与升级路径
- 输入验证、错误处理、安全不能偷懒

### 导入规范

- 所有内部导入必须带 `.ts` 扩展名（ESM + `allowImportingTsExtensions`）
- 不使用 `.js` 后缀，`tsdown` 构建时自动处理

```ts
// ✅ 正确
import { AcmeClient } from './acme/client.ts'
// ❌ 错误
import { AcmeClient } from './acme/client'
import { AcmeClient } from './acme/client.js'
```

### 命名规范

- CA 名称与 acme.sh 保持一致（`letsencrypt`、`zerossl`、`sslcom` 等）
- DNS 提供商 ID 使用短名（`cf`、`dp`、`ali`、`aws`）
- 常量使用 `UPPER_SNAKE_CASE`，类型使用 PascalCase，函数使用 camelCase
- 内部导出函数可用 `_` 前缀（如 `_createkey`、`_initAPI`）
- `_`/`__` 前缀函数（如 `_send_signed_request`、`__trigger_validation`）刻意镜像 acme.sh 源码命名，注释 `// acme.sh Lxxxx` 一一对应行号。**不重命名为 camelCase**，以保持与 acme.sh 的对照关系

### 类型规范

- 常量映射对象使用 `as const` 或显式 `Record` 类型，避免 `satisfies` 导致的类型推断问题
- 公开 API 类型全部从 `src/index.ts` re-export

### ACME 协议注意事项

- **JWK 字段顺序**：ACME 规范要求 JWK JSON 字段按字典序排列（`crv`, `kty`, `x`, `y`），顺序错误会导致 thumbprint 计算失败
- **contact 字段**：注册时 `contact` 数组不能为空，否则部分 CA 返回 403；邮箱自动补 `mailto:` 前缀
- **EAB**：ZeroSSL、SSL.com、Actalis 等 CA 强制要求 EAB（`kid` + `hmacKey`），不可省略
- **sslcom vs sslcom-ecc**：SSL.com RSA 端点只支持 RSA 密钥，ECC 端点只支持 EC 密钥，混用会失败

## 添加 DNS 提供商

### 独立实现（复杂 API）

参考 `src/dnsapi/dns_cf.ts`（Cloudflare）：

1. 定义 `XxxOptions` 接口
2. 继承 `HttpProviderBase` / `HmacProviderBase` / `XmlProviderBase`
3. 实现 `createTxtRecord()` 和 `deleteTxtRecord()`
4. 在 `src/dnsapi/index.ts` 注册（import 类 + 在 `PROVIDERS` map 添加一行 + 在 re-exports 区段导出）

## 测试

```bash
pnpm test              # 运行所有测试
node --test test/crypto/keys.test.ts   # 运行单个测试文件
```

测试使用 Node.js 内置 `node:test`，不引入 Jest/Vitest 等框架。

## 构建

```bash
pnpm build   # tsdown 构建 → dist/
pnpm lint    # tsc --noEmit 类型检查
```

## 关键文件索引

| 需要了解的内容 | 查看文件 |
|---|---|
| 公开 API | `src/index.ts` |
| 客户端主逻辑 | `src/acme/client.ts` |
| CA 列表与 URL | `src/acme/directory.ts` |
| DNS 传播检测 | `src/dns/resolver.ts` |
| Cloudflare 参考实现 | `src/dnsapi/dns_cf.ts` |
| 使用示例 | `examples/acme.ts` |
| 项目规则 | `.qoder/rules/ponytail.md` |
