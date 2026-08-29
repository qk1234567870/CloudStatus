/* CloudStatus service module: Oracle Cloud */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "oracle",
  "name": "Oracle Cloud",
  "desc": "Oracle Cloud Infrastructure",
  "category": "cloud",
  "page": "https://ocistatus.oraclecloud.com/",
  "parser": "oracle",
  "sources": [
    {
      "type": "reader",
      "url": "https://ocistatus.oraclecloud.com/incidents/",
      "label": "官方事件歷史",
      "tier": 40,
      "kind": "official-history",
      "priority": 40
    },
     {
      "type": "rss",
      "url": "https://ocistatus.oraclecloud.com/api/v2/incident-summary.rss",
      "label": "官方 RSS",
      "tier": 45,
      "kind": "official-history",
      "priority": 45
    },
    {
      "type": "reader",
      "url": "https://ocistatus.oraclecloud.com/",
      "label": "官方 Status",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    }
  ]
}});
})();
})();
