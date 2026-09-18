#!/usr/bin/env node
/**
 * 恐贪指数自动抓取脚本 v4（Node.js + crypto-js · 直接调用API+解密）
 *
 * 原理：
 *   1. 从 etfpro.cn 抓取页面 HTML，提取动态 chunk 文件名
 *   2. 直接调用 API: https://pre.jiucaishuo.com/v2/kjtl/getbasedata
 *   3. 用逆向出的密钥材料复现 AES-CBC 解密
 *
 * 逆向结论（from app.js）：
 *   - API: https://pre.jiucaishuo.com/v2/kjtl/getbasedata (GET, is_jm=true)
 *   - 密钥 = H.e() = k.b = "eveqocftukbotqjcequcnkrqlw1oi"
 *   - AES.decrypt 重写: key += "ll", iv += "ll"
 *   - Utf8.parse 重写: arg += "1"
 *   - 最终: key_str = "eveqocftukbotqjcequcnkrqlw1oi" + "ll1" = 31字节
 *   - IV: 由 H.a() 递归链条生成（复杂，尝试多种可能）
 *   - mode: CBC, padding: Pkcs7
 */

const CryptoJS = require('crypto-js');
const https = require('https');
const http = require('http');

// ==== 密钥材料（from app.js 逆向） ====
const k_a = 'bvroqevdjqibsdkq'; // 16字节
const k_b = 'eveqocftukbotqjcequcnkrqlw1oi'; // 28字节
const H_i_v = 'rekjdlareivdlk'; // 14字节
const H_i_vv = 'gfslibvjklrnvfdkw'; // 17字节

// H.e() = 密钥
function H_e() {
  return (H_i_v + H_i_vv + k_b)
    .replace('rek', '')
    .replace('jdlareivdlkgfslibvjklrnvfdkw', '');
}

// H.a() = IV（递归链条，尝试简化版）
// 从代码分析：t.substr(17,2)="" + e.substr(34,5)="" + k.a.substr(0,1)="b" + E.a()
// E.a() 依赖 q.a()，q.a() 依赖 P.a()...每个取 k.a 的2-6字符片段
// k.a = "bvroqevdjqibsdkq" (16字符)
// 假设链条最终拼接出完整的 k.a = "bvroqevdjqibsdkq"
function H_a_simple() {
  // 简化：直接返回 k.a
  return k_a;
}

// 完整解密（模拟浏览器中的重写逻辑）
function decrypt(encryptedBase64, keyStr, ivStr) {
  // AES.decrypt 重写: key += "ll", iv += "ll"
  // Utf8.parse 重写: arg += "1"
  // 所以: 实际key = Utf8.parse(keyStr + "ll" + "1"), 实际iv = Utf8.parse(ivStr + "ll" + "1")
  const finalKey = keyStr + 'll1';
  const finalIv = ivStr + 'll1';

  const key = CryptoJS.enc.Utf8.parse(finalKey);
  const iv = CryptoJS.enc.Utf8.parse(finalIv);

  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedBase64, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return null;
  }
}

// 调用 API
function fetchApi(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'pre.jiucaishuo.com',
      path: '/v2/kjtl/getbasedata',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://etfpro.cn/tool/fear',
        'Origin': 'https://etfpro.cn',
        'Accept': 'application/json, text/plain, */*',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

(async () => {
  try {
    console.error('[info] 调用 API: https://pre.jiucaishuo.com/v2/kjtl/getbasedata');
    const raw = await fetchApi();
    console.error(`[info] API响应长度: ${raw.length} 字符`);
    console.error(`[info] 响应前100字符: ${raw.substring(0, 100)}`);

    // API 返回的是 JSON 包裹的加密字符串，或者直接是加密字符串
    let encrypted = raw;
    // 去掉 JSON 引号
    if (encrypted.startsWith('"')) encrypted = encrypted.slice(1);
    if (encrypted.endsWith('"')) encrypted = encrypted.slice(0, -1);
    // 转义反转
    encrypted = encrypted.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\"/g, '"');

    console.error(`[info] 加密数据长度: ${encrypted.length}`);

    // 密钥
    const keyStr = H_e();
    console.error(`[info] 密钥字符串: "${keyStr}" (${keyStr.length}字节)`);

    // 尝试多种 IV 组合
    const ivCandidates = [
      { name: 'k.a (bvroqevdjqibsdkq)', iv: k_a },
      { name: 'H.e() (k.b)', iv: H_e() },
      { name: 'k.b', iv: k_b },
      { name: 'i_v+i_vv 前16字符', iv: (H_i_v + H_i_vv).substring(0, 16) },
      { name: 'k.a 前16', iv: k_a.substring(0, 16) },
    ];

    for (const { name, iv } of ivCandidates) {
      console.error(`\n[try] IV方案: ${name} = "${iv}"`);
      const result = decrypt(encrypted, keyStr, iv);
      if (result && result.length > 0) {
        console.error(`[OK!] 解密成功 (${result.length}字符)`);
        try {
          const json = JSON.parse(result);
          console.log(JSON.stringify(json, null, 2));
          return;
        } catch (e) {
          console.error(`[warn] JSON解析失败，原始文本前500字符:`);
          console.log(result.substring(0, 500));
          return;
        }
      } else {
        console.error(`[fail] 解密失败（空结果）`);
      }
    }

    // 如果所有方案都失败，尝试不同的密钥
    console.error('\n[info] 尝试不同密钥组合...');
    const keyCandidates = [
      { name: 'k.a', key: k_a },
      { name: 'k.b', key: k_b },
      { name: 'H.e()', key: H_e() },
      { name: 'i_v+i_vv', key: H_i_v + H_i_vv },
    ];

    for (const { name: kname, key: k } of keyCandidates) {
      for (const { name: iname, iv } of ivCandidates.slice(0, 2)) {
        console.error(`[try] 密钥=${kname}, IV=${iname}`);
        const result = decrypt(encrypted, k, iv);
        if (result && result.length > 0 && result.includes('{')) {
          console.error(`[OK!] 解密成功!`);
          console.log(result.substring(0, 1000));
          return;
        }
      }
    }

    console.error('[fail] 所有密钥/IV组合均失败');
    console.log(JSON.stringify({ error: '所有解密方案失败', raw_length: raw.length }));
  } catch (err) {
    console.error(`[error] ${err.message}`);
    console.log(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
})();
