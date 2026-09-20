# 许毕胜 × 李小哲官宣网页

线上地址：https://zhuyan621.github.io/xu-lixiao-love/

## 替换真实素材

1. 将 4–9 张照片处理后放入 `assets/photos/`，并使用 `photo-01.webp` 至 `photo-09.webp` 命名。
2. 如果要增删照片，请同步修改 `index.html` 中的照片卡片，以及 `app.js` 顶部 `CONFIG` 区域的配置。
3. 将合法来源的《特别的人》音频命名为 `te-bie-de-ren.mp3`，放入 `assets/music/`。
4. 修改 `app.js` 顶部的 `togetherSince` 即可调整在一起的时间；不要删除 `+08:00`，它代表中国标准时间。
5. 推送修改到 GitHub `main` 分支后，GitHub Pages 会自动更新网页。

## 本地预览

在当前目录运行：

```powershell
python -m http.server 8080
```

然后打开 `http://localhost:8080/`。二维码和分享海报位于上一级 `outputs` 目录。
