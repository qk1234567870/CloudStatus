/* CloudStatus service module: Microsoft Azure */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "azure",
  "name": "Microsoft Azure",
  "desc": "Microsoft 企業級雲端平台",
  "category": "cloud",
  "page": "https://azure.status.microsoft/status",
  "parser": "azure",
  "sources": [
    {
      "type": "reader",
      "url": "https://azure.status.microsoft/status",
      "label": "官方 Status",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    },
    {
      "type": "reader",
      "url": "https://backup.azure.status.microsoft/",
      "label": "官方 Backup Status",
      "tier": 70,
      "kind": "official-backup",
      "priority": 70
    }
  ]
});
})();
