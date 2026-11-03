# CodeYears 官网与隐私 URL 上线记录

日期：2026-11-03。只在现有个人网站登记产品、支持和政策页面，不建设独立贡献数据应用，也不代表 Chrome 商店已发布。

## 交付与授权

- [网站 PR #51](https://github.com/wxy/xingyu.wang/pull/51)：最终功能提交 `54bb16d07898f0c93d7874394fbd192f9c14959f`。产品登记、双语 FAQ、专属隐私政策、正式图标及首页五个扩展完整展示。
- 用户明确授权“合入网站 PR #51 并上线”。2026-11-03 11:10:07 UTC 保留历史合入 `1a59a7e512f792d45343f04acad17323f76e2991`。
- Vercel Production 部署 `7517092834` 对应上述合并提交，11:10:41 UTC 状态 success；不是将预览当作正式发布。
- 自动审查的首页固定四个展示位意见属实，已先复现中英文首页缺失 SilentFeed，再修复、完整复验并解决原审核线程。

## 正式链接与实际检查

| 用途 | 正式链接 |
| --- | --- |
| 官网 | https://xingyu.wang/extensions/codeyears |
| 支持 | https://xingyu.wang/extensions/codeyears/about |
| 隐私政策 | https://xingyu.wang/extensions/codeyears/privacy |

以上三个路径及其 `/zh` 版本均已直接请求：HTTP 200、正文含 CodeYears、canonical 对应路径；隐私正文含更新时间、访问者作用域、缓存失效不自动删除以及网站 Vercel Web Analytics 的单独说明。中英文首页均包含五个扩展，没有因新增产品丢失旧产品。独立 Chrome 窗口已打开正式中文隐私页，确认实际可读。

网站本地构建、TypeScript、全部62项GEO检查通过；最终预览构建成功并复核首页及产品页。定向ESLint零错误、两条原有图片优化建议。具体环境和本地复现记录见网站仓库 `docs/verification/2026-11-03-codeyears-product-privacy.md`。

可重复执行的生产链接检查（Node.js，无需凭证，不读取登录会话）：

```sh
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
for (const prefix of ['', '/zh']) {
  for (const suffix of ['', '/about', '/privacy']) {
    const url = `https://xingyu.wang${prefix}/extensions/codeyears${suffix}`;
    const response = await fetch(url);
    assert.equal(response.status, 200, url);
    const body = await response.text();
    assert.ok(body.includes('CodeYears'), url);
    assert.ok(body.includes(url), `${url}: canonical`);
    if (suffix === '/privacy') {
      for (const text of ['2026-11-03', 'Vercel Web Analytics', prefix ? '不自动删除' : 'does not automatically delete']) {
        assert.ok(body.includes(text), `${url}: ${text}`);
      }
    }
    console.log('PASS', url);
  }
}
JS
```

## 留存与未执行范围

仅保留源码、产品图标及正式报告。网站独立工作树的构建、依赖和临时PR文本已清理，未提交截图或完整日志；原网站工作区保持不变。CodeYears 发行 ZIP 未修改，仍为0.1.0、79文件、112526864 bytes，SHA-256 `b0f004a227a68d8acce314343cf91cc053121a35ca09f009aa48106a99208018`。

Chrome商店项目由用户自行创建。本次没有上传发行包、填写商店表单、接受条款、付款、提交审核或发布扩展；网站链接上线不等于这些步骤完成。新商店URL尚未取得，官网明确“尚未上架”，不展示虚假安装按钮。
