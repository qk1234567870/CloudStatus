/* CloudStatus service module: Google Cloud */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "google-cloud",
  "name": "Google Cloud",
  "desc": "Google 雲端運算與數據分析平台",
  "category": "cloud",
  "page": "https://status.cloud.google.com",
  "parser": "google-cloud",
  "sources": [
    {
      "type": "gcp",
      "url": "https://status.cloud.google.com/incidents.json",
      "label": "官方 JSON",
      "tier": 20,
      "kind": "official-json",
      "priority": 20
    },
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
