/* CloudStatus service module: Apple Services */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "apple",
  "name": "Apple Services（蘋果服務）",
  "desc": "Apple 系統與雲端服務",
  "category": "platform",
  "page": "https://www.apple.com/support/systemstatus/",
  "parser": "apple",
  "sources": [
    {
      "type": "apple-json",
      "url": "https://www.apple.com/support/systemstatus/data/system_status_en_US.js",
      "label": "官方 JSON",
      "tier": 20,
      "kind": "official-json",
      "priority": 20
    },
    {
      "type": "reader",
      "url": "https://www.apple.com/support/systemstatus/?viewlocale=en_US",
      "label": "官方 System Status",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    },
    {
      "type": "apple-backup",
      "url": "https://pingoru.io/providers/apple/outage-history",
      "label": "Pingoru 備援",
      "tier": 80,
      "kind": "trusted-third-party",
      "priority": 80
    }
  ]
});
})();
