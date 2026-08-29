/* CloudStatus service module: Arelion (Telia) */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "arelion",
  "name": "Arelion (Telia)",
  "desc": "全球 Tier-1 國際 IP 骨幹網",
  "category": "backbone",
  "page": "https://www.arelion.com/",
  "parser": "arelion",
  "sources": [
    {
      "type": "reader",
      "url": "https://www.arelion.com/",
      "label": "官方頁",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    }
  ],
  "publicStructuredFeed": false
});
})();
