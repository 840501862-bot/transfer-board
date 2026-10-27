// 币安钱包划转 · Vercel 云端转发（替代 Cloudflare Worker / 本地中继）
// 作用：把币安 API 请求转发到币安服务器并加上浏览器允许的跨域响应头。
// 部署后地址固定为 https://<项目名>.vercel.app，页面把「中继地址」设为该地址即可。
// 手机开 VPN 打开即用：电脑不用开机、地址固定不变、不需要本地中继和隧道。
export default async function handler(req, res) {
  // 浏览器跨域响应头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Max-Age", "86400");

  // 跨域预检：直接放行
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const u = new URL(req.url, "http://relay.local");
  const p = u.pathname;
  // 按路径前缀分流：/fapi/ → 合约，其余 → 现货/划转
  const host = p.startsWith("/fapi/") ? "https://fapi.binance.com" : "https://api.binance.com";
  const target = host + p + u.search;

  const headers = {};
  const key = req.headers["x-mbx-apikey"];
  if (key) headers["X-MBX-APIKEY"] = key;
  const ct = req.headers["content-type"];
  if (ct) headers["Content-Type"] = ct;

  let body;
  if (req.method === "POST") body = JSON.stringify(req.body ?? {});

  const resp = await fetch(target, { method: req.method, headers, body });
  const text = await resp.text();
  res.status(resp.status);
  res.setHeader("Content-Type", "application/json");
  res.send(text);
}
