# @openeagle/wechat-webview

小程序 webview 页面通信组件，支持以下通信方式：

- H5 =》小程序：从 H5 页面向前一个小程序页面发送信息
- 小程序 =》 h5：小程序向前一个 H5 页面发送信息
- H5 =》H5：H5 向前一个 H5 页面发送信息

## 实现原理

核心是基于 H5 hash 实现的通信，从当前页面返回到前一个 H5 页面的时候，`@openeagle/wechat-webview` 会向 webview 的 URL 后面追加一段 hash 信息，H5 通过监听 hash 变化来获取通信信息。

## API

### H5

```js
const oew = require('@openeagle/wechat-webview')

oew.config(); // 配置 JSSDK

oew.getLaunchOptions(); // 获取冷启动参数
oew.getEnterOptions(); // 获取热启动参数

oew.onAppHide(function () {}) // 监听应用切到后台
oew.offAppHide(function () {}) // 取消监听应用切到后台

oew.onAppShow(function () {}) // 监听应用切到前台
oew.offAppShow(function () {}) // 取消监听应用切到前台

oew.onPageHide(function () {}) // 监听应用切到后台
oew.offPageHide(function () {}) // 取消监听应用切到后台

oew.offPageShow(function () {}) // 监听应用切到前台
oew.onPageShow(function () {}) // 取消监听应用切到前台
```

### 小程序

```js
<openeagle-wechat-webview url="{{url}" />
```
