/* CloudStatus service module: GitHub */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "github",
  "name": "GitHub（程式碼託管）",
  "desc": "全球最大的程式碼託管與開發者平台",
  "category": "developer",
  "page": "https://www.githubstatus.com",
  "parser": "statuspage",
  "sources": [
    {
      "type": "statuspage",
      "url": "https://www.githubstatus.com/api/v2/incidents.json",
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
