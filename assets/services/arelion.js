/* CloudStatus service module: Arelion (Telia) */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "arelion",
  "name": "Arelion",
    "nameZh": "國際骨幹網",
  "desc": "全球 Tier-1 國際 IP 骨幹網",
  "category": "backbone",
  "page": "https://www.arelion.com/",
  "parser": "arelion",
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
