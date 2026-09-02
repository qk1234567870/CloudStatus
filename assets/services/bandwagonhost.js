/* CloudStatus service module: BandwagonHost */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "bandwagonhost",
  "name": "BandwagonHost（搬瓦工）",
  "desc": "VPS 與網路基礎設施",
  "category": "hosting",
  "page": "https://bwhstatus.com/",
  "parser": "bandwagon",
  "sources": [
    {
      "type": "reader",
      "label": "官方狀態頁",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    }
  ]
});
})();
