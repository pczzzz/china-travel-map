/* gen_prov_pts.js — 汇总各省 prov_*.js 的城市/景点为轻量索引 assets/js/prov_pts.js
   用法: node tools/gen_prov_pts.js   （供行程规划 all / prov:* 范围使用） */
"use strict";
global.window = global;
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const JS = path.join(ROOT, "assets", "js");

const files = fs.readdirSync(JS).filter((f) => /^prov_[a-z]+\.js$/.test(f)).sort();
files.forEach((f) => {
  try { eval(fs.readFileSync(path.join(JS, f), "utf8")); }
  catch (e) { console.log("FAIL", f, e.message); }
});
const PD = global.PROV_DATA || {};
const pts = [];
let nc = 0, ns = 0;
Object.keys(PD).forEach((pid) => {
  const d = PD[pid];
  if (!d || !d.meta) return;
  (d.cities || []).forEach((c) => {
    pts.push({ id: pid + ":" + c.id, pid, prov: d.meta.name, name: c.name, lat: c.lat, lng: c.lng, alt: 0, cat: "city", catName: "城市", key: !!c.cap, role: c.role || "" });
    nc++;
  });
  (d.spots || []).forEach((s) => {
    const o = { id: pid + ":" + s.id, pid, prov: d.meta.name, name: s.name, lat: s.lat, lng: s.lng, alt: s.alt || 0, cat: s.cat || "scenery", catName: s.catName || "景色", key: !!s.key, ticket: s.ticket || "", season: s.season || "" };
    if (s.img) o.img = s.img;
    pts.push(o);
    ns++;
  });
});
const out = "/* prov_pts.js — 各省停靠点轻量索引（城市+景点，供行程规划 all / prov:* 范围）\n" +
  "   重新生成: node tools/gen_prov_pts.js */\nwindow.PROV_PTS = " + JSON.stringify(pts) + ";\n";
fs.writeFileSync(path.join(JS, "prov_pts.js"), out);
console.log("provs", Object.keys(PD).length, "cities", nc, "spots", ns, "total", pts.length, "bytes", out.length);
