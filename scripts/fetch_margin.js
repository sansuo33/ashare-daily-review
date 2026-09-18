#!/usr/bin/env node
/**
 * 东方财富「融资融券交易总量」实时抓取（纯 Node.js · 无加密 · 无浏览器依赖）
 *
 * 数据源：东方财富数据中心公开 API
 *   https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPTA_RZRQ_LSHJ&...
 * 字段口径（单位：元，脚本内统一换算为「亿元 / 万亿」）：
 *   DIM_DATE   交易日
 *   RZYE       融资余额
 *   RQYE       融券余额
 *   RZRQYE     融资融券余额（合计）
 *   RQMCL      融券卖出量（股）— 本页不用
 *   RZMRE      融资买入额
 *   RZCHE      融资偿还额
 *   RZJME      融资净买入 = 融资买入额 - 融资偿还额（负值=净偿还/去杠杆）
 *   RQJMG      融券净卖空
 *   RZYEZB     融资余额占流通市值比(%)
 *
 * 用法：
 *   node fetch_margin.js          输出最新一行（JSON）
 *   node fetch_margin.js --last 5 输出最近 N 日（默认 5）
 *
 * 说明：融资融券数据为 T+1 披露（当日收盘后次交易日早间发布），
 *       因此「最新可得」通常比报告交易日晚 1 个交易日，属正常现象。
 */
'use strict';
const https = require('https');

const API =
  'https://datacenter-web.eastmoney.com/api/data/v1/get' +
  '?reportName=RPTA_RZRQ_LSHJ&columns=ALL&source=WEB' +
  '&sortColumns=DIM_DATE&sortTypes=-1&pageNumber=1&pageSize=240&filter=';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://data.eastmoney.com/rzrq/total.html',
          Accept: 'application/json',
        },
        timeout: 15000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('JSON 解析失败: ' + e.message + ' | body=' + body.slice(0, 200)));
          }
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('请求超时')));
    req.on('error', reject);
  });
}

// 亿元（保留2位）/ 万亿（保留3位）
const yi = (v) => (v == null ? null : +(v / 1e8).toFixed(2));
const wanYi = (v) => (v == null ? null : +(v / 1e12).toFixed(3));

function shapeRow(r) {
  return {
    date: (r.DIM_DATE || '').slice(0, 10),
    融资余额_亿: yi(r.RZYE),
    融券余额_亿: yi(r.RQYE),
    融资融券余额_亿: yi(r.RZRQYE),
    融资融券余额_万亿: wanYi(r.RZRQYE),
    融资买入额_亿: yi(r.RZMRE),
    融资偿还额_亿: yi(r.RZCHE),
    融资净买入_亿: yi(r.RZJME),
    融券净卖空_亿: yi(r.RQJMG),
    融资余额占流通市值比_百分: r.RZYEZB,
  };
}

(async () => {
  const lastN = (process.argv.includes('--last')
    ? parseInt(process.argv[process.argv.indexOf('--last') + 1], 10)
    : 1) || 1;
  let json;
  try {
    json = await getJSON(API);
  } catch (e) {
    console.error('[ERROR] 抓取失败:', e.message);
    process.exit(1);
  }
  const rows = (json && json.result && json.result.data) || [];
  if (!rows.length) {
    console.error('[ERROR] 接口返回空数据');
    process.exit(1);
  }
  const out = rows.slice(0, lastN).map(shapeRow);
  console.log(JSON.stringify(out, null, 2));
})();
