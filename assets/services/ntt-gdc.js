/* CloudStatus service module: NTT GDC */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "ntt-gdc",
  "name": "NTT GDC（NTT 數據中心）",
  "desc": "全球數據中心與園區基礎設施",
  "category": "datacenter",
  "page": "https://services.global.ntt/",
  "parser": "ntt-gdc",
  "sources": [
    {
      "type": "reader",
      "label": "官方頁",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    }
  ],
  "publicStructuredFeed": false
});
})();
