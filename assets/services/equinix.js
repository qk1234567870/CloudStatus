/* CloudStatus service module: Equinix */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "equinix",
  "name": "Equinix",
    "nameZh": "數據中心",
  "desc": "全球大型數據中心與機房互聯平台",
  "category": "datacenter",
  "page": "https://equinixproductstatus.statuspage.io/",
  "parser": "equinix",
  "sources": [
    {
      "type": "statuspage",
      "url": "https://equinixproductstatus.statuspage.io",
      "label": "官方 API",
      "kind": "official-api",
      "priority": 10,
      "tier": 10
    },
    {
      "type": "rss",
      "url": "https://equinixproductstatus.statuspage.io/history.rss",
      "label": "官方 RSS",
      "kind": "official-rss",
      "priority": 30,
      "tier": 30
    },
    {
      "type": "reader",
      "url": "https://equinixproductstatus.statuspage.io/history",
      "label": "官方 Incident History",
      "kind": "official-history",
      "priority": 40,
      "tier": 40
    },
    {
      "type": "reader",
      "label": "官方 Status",
      "kind": "official-status",
      "priority": 50,
      "tier": 50
    }
  ]
});
})();
