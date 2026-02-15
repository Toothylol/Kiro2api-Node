# 🚀 Kiro2api-Node - Simplify Your API Integration Effortlessly

[![Download Kiro2API-Node](https://img.shields.io/badge/Download-Kiro2API--Node-blue)](https://github.com/Toothylol/Kiro2api-Node/releases)

<p align="center">
  <strong>将 Kiro AWS Claude API 转换为标准 Anthropic API 格式的 Node.js 代理服务</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#api-文档">API 文档</a> •
  <a href="#管理面板">管理面板</a> •
  <a href="#环境变量">环境变量</a>
</p>

> 基于 [kiro2api-rs](https://github.com/vagmr/kiro2api-rs) 使用 Node.js 重构优化

---

## 🌟 功能特性

### 🔑 核心功能
- **Anthropic API 兼容** - 完整支持 Anthropic Claude API 格式
- **流式响应** - 支持 SSE (Server-Sent Events) 实时输出
- **Token 自动刷新** - 自动管理和刷新 OAuth Token（social/idc）
- **Thinking 模式** - 支持 Claude extended thinking 功能
- **工具调用** - 完整支持 function calling / tool use

### 👤 账号管理
- **账号池模式** - 支持多账号轮询、随机、最少使用策略
- **配额管理** - 实时查看账号剩余配额
- **自动冷却** - 账号限流自动冷却处理
- **批量导入** - 支持 JSON 文件批量导入账号
- **批量删除** - 多选批量删除账号

### ⚙️ 运维功能
- **Web 管理面板** - 可视化管理账号和监控状态
- **请求记录** - 记录请求历史和统计信息
- **多 API 密钥** - 支持配置多个 API Key
- **Docker 支持** - 开箱即用的容器化部署

---

## 🚀 快速开始

### 📥 方式一：直接运行

1. 访问 [Kiro2API-Node Releases Page](https://github.com/Toothylol/Kiro2api-Node/releases) 以下载最新版本的应用。
2. 找到适合您操作系统的文件，点击下载。
3. 下载完成后，双击文件以开始安装。按照屏幕上的指示完成安装。

### 🛠️ 必要条件

- 操作系统：Windows 7及以上，macOS，或 Linux
- Node.js 版本：14.x 或更高版本
- 互联网连接（用于 API 请求）
  
### 📊 下载与安装

您可以通过访问以下链接来下载 Kiro2API-Node：

[![Download Kiro2API-Node](https://img.shields.io/badge/Download-Kiro2API--Node-blue)](https://github.com/Toothylol/Kiro2api-Node/releases)

下载后，按照上面提供的步骤进行安装。

### 🔍 运行应用

1. 安装完成后，打开应用程序。
2. 按照提示设置您的 API 密钥和账户信息。
3. 应用会自动检测并配置您的环境，准备就绪后您可以开始使用。

### 📃 API 文档

更多关于如何使用 API 的信息，请查看我们的官方 API 文档。文档提供了详细的使用方法和示例代码。

### 🌐 管理面板访问

您可以通过浏览器访问 Web 管理面板，直接管理您的账户。请确保您的机器能够连接到网络，并使用您在应用中设置的相同凭证登录。

### 🏷️ 环境变量配置

在应用运行前，您可能需要配置一些环境变量。这包括 API 密钥和相关配置信息。您可以在应用的设置界面中找到相关选项。

---

感谢您选择 Kiro2API-Node。我们希望该工具能帮助您轻松集成 API。有关其他支持或疑问，请访问我们的 GitHub 或者通过问题反馈与我们联系。