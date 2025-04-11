# picgo-plugin-imageflow

picgo 的 imageflow 图床上传工具

## 上游接口说明

### API 密钥认证

图片上传功能需要 API 密钥认证。您可以：

1. 在请求 `header` 中添加`Authorization`，值为`Bearer <token>`

### API 参考

| 接口 | 方法 | 描述 | 参数 | 认证 |
|----------|---------|-------------|------------|-------------|
| `/api/upload` | POST | 上传新图片 | Form 数据，字段名 `images[]`,存放照片数组 <br>可选参数：`expiryMinutes`（过期时间，分钟）<br>可选参数：`tags`（标签数组） | 需要 API 密钥 |

## 参考文档

- [插件开发 | PicGo-Core](https://picgo.github.io/PicGo-Core-Doc/zh/dev-guide/cli.html)