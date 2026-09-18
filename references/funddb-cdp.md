# 韭圈儿恐贪指数（funddb.cn）· CDP 渲染取数经验

> 更新：2026-08-14 实测验证。这是目前**唯一可靠**的取数路径。

## 为什么静态层全失效

- 页面 `https://www.funddb.cn/tool/fear` 是 **Vue SPA**，服务端预渲染空壳，数据全靠前端 JS 接口加载（`WebFetch` 只能拿到骨架文本）。
- 数据接口 `https://api.jiucaishuo.com/v2/kjtl/kjtlconnect`（POST，payload 含 `gu_code`/`act_time`）返回**加密字符串**，需 akshare 的 `cninfo.js::my_decode` 解密（py_mini_racer 跑该 JS）。
- 已试且失败：WebFetch / curl 静态 SPA / 逆向前端 chunk 接口路径（数据接口在另一域名且路径动态拼装）/ 直连加密接口（密文）/ pip 装 akshare 取 cninfo.js / PyPI+GitHub 下载 akshare wheel（沙箱网络受限均失败）。
- **结论**：只要真实 DOM 渲染，数据就在「恐惧贪婪指数表」里明文显示。

## 取数步骤（Web Access CDP）

前置：用户在浏览器地址栏打开 `edge://inspect/#remote-debugging`（或 chrome 对应页），**勾选 "Allow remote debugging for this browser instance"**。

```bash
# 1. 启动/确认 CDP Proxy（chrome；首次需用户点「允许」授权弹窗）
node "${SKILL_DIR}/scripts/check-deps.mjs" --browser chrome

# 2. 创建后台 tab 打开恐贪页（URL 走 POST body）
TGT=$(curl -s -X POST --data-raw 'https://www.funddb.cn/tool/fear' http://localhost:3456/new | sed -E 's/.*"targetId":"([^"]+)".*/\1/')
echo "targetId=$TGT"

# 3. 等待渲染（SPA 接口慢，至少等 5 秒）
sleep 5

# 4. 提取「恐惧贪婪指数表」明文（更新时间 + 当前指数 + 标签）
curl -s -X POST "http://localhost:3456/eval?target=$TGT" \
  -d 'JSON.stringify({title:document.title, bodyText: (document.body? document.body.innerText.slice(0,1500):"")})' \
  | head -c 2000
# 关键字段：更新时间2026-08-13 / 当前指数 33 / 当前指数属性 中立

# 5. 用完关闭自己创建的 tab（保留用户原有 tab）
curl -s "http://localhost:3456/close?target=$TGT"
```

## 实测结果（2026-08-14）

- 更新时间：**2026-08-13**（该页更新慢，8/14 盘前最新可得值）
- 当前指数：**33**，韭圈儿标注「中立」
- 分位解读（韭圈儿标尺）：0–20 极度恐惧 / 20–40 恐惧 / 40–70 中立 / 70–90 贪婪 / 90+ 极度贪婪 → 33 处于**恐惧区下沿、偏谨慎**

## 写入报告的位置

- 第 6 节情绪温度维度行：`恐慌指数（韭圈儿·funddb.cn·更新YYYY-MM-DD） | 33 · 中立（恐惧区下沿·偏谨慎）`，黄色中性色。
- 同步修正：第 6 节 note、隔夜判断列表、免责声明中的"恐慌指数未接入/留白"措辞 → "已接入/33·中立"。
- 若取不到真实值：该行标「待补·接口加密渲染受阻」并注明来源网址，**不编造**；待用户开调试端口立即补。

## 复用提示

- 每次只需用户重开调试端口（浏览器重启后授权失效），Proxy 长驻无需反复启。
- 沙箱若网络受限无法 pip/下载解密脚本，勿在静态层死磕 —— 直接走 CDP 渲染读 DOM。
