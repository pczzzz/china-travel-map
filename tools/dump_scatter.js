// 从 data.js 导出 scatter 挂载点清单 -> tools/scatter_pois.json
const fs = require("fs"), vm = require("vm");
const s = {}; s.window = s; vm.createContext(s);
vm.runInContext(fs.readFileSync("assets/js/data.js", "utf8"), s);
const RD = s.ROAD_DATA;
const nodes = {};
(RD.nodes || []).forEach(n => { nodes[n.id] = n; });
const out = (RD.pois || []).filter(p => p.scatter).map(p => {
  const n = nodes[p.node] || {};
  return { name: p.name, node: p.node, nodeName: n.name || p.nodeName || "", prov: n.prov || p.prov || "", lat: n.lat, lng: n.lng };
});
fs.writeFileSync("tools/scatter_pois.json", JSON.stringify(out, null, 1));
console.log("scatter pois:", out.length, "unique names:", new Set(out.map(o => o.name + "@" + o.nodeName)).size);
