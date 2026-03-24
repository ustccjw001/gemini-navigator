# Gemini Chat Navigator

这是一个为 Google Gemini (gemini.google.com) 设计的 Chrome 浏览器扩展。它在页面右侧提供一个极简的锚点导航栏，帮助你快速跳转到聊天记录中的各个问题。

## 功能特点

- **自动提取问题**：自动识别并提取聊天界面中的用户提问。
- **快速跳转**：点击导航项即可平滑滚动到对应的问题位置，并伴有短暂的高亮提示。
- **极简设计**：默认处于收起状态，不占用过多的屏幕空间；鼠标悬停或点击即可展开。
- **实时更新**：基于 MutationObserver 实时监听对话变化，自动更新导航列表。
- **自动收起**：当鼠标离开导航栏时会自动收起，保持界面清爽。

## 安装方法

由于目前尚未发布到 Chrome Web Store，你可以通过以下步骤手动安装：

1. 下载本项目代码到本地。
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`。
3. 开启右上角的“开发者模式 (Developer mode)”。
4. 点击“加载已解压的扩展程序 (Load unpacked)”，选择本项目文件夹即可。

## 使用说明

1. 访问 [gemini.google.com](https://gemini.google.com/app)。
2. 在页面右侧你会看到一个极简的切换按钮。
3. 点击或悬停即可展开当前对话的所有问题列表。
4. 点击列表中的任何一项，页面将自动定位到该问题。

## 项目结构

- `manifest.json`: 扩展配置文件（MV3）。
- `content.js`: 核心逻辑代码，负责提取问题、创建 UI 及处理滚动跳转。
- `styles.css`: 导航栏的样式定义，包含动画和布局。
- `icons/`: 扩展图标资源。

## 技术栈

- 纯原生 JavaScript (ES6+)
- CSS3 (Flexbox, Transitions)
- Chrome Extension API (Manifest V3)

## 许可证

[MIT License](LICENSE)
