/* CloudStatus service module: NTT Global Network */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "ntt-global-network",
  "name": "NTT Global Network（NTT 全球骨幹網）",
  "desc": "全球 Tier-1 IP 骨幹與跨洋網路",
  "category": "backbone",
  "page": "https://www.nttdata.com/global/en/services/connectivity/global-ip-network",
  "parser": "ntt-global",
  "sources": [
    {
      "type": "reader",
      "label": "官方頁",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    }
  ]
});
})();
