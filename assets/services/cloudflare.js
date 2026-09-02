/* CloudStatus service module: Cloudflare */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "cloudflare",
  "name": "Cloudflare",
    "nameZh": "雲端網路",
  "desc": "全球最大 CDN、DNS 與網路安全平台",
  "category": "cloud",
  "page": "https://www.cloudflarestatus.com",
  "parser": "statuspage",
  "sources": [
    {
      "type": "statuspage",
      "url": "https://www.cloudflarestatus.com/api/v2/incidents.json",
      "label": "官方 API",
      "tier": 10,
      "kind": "official-api",
      "priority": 10
    },
    {
      "type": "reader",
      "label": "官方頁 Reader",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    }
  ]
});
})();
