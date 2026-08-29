/* CloudStatus service module: DMIT */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "dmit",
  "name": "DMIT",
  "desc": "全球高階網路與雲端服務",
  "category": "hosting",
  "page": "https://www.dmit.io/serverstatus.php",
  "parser": "dmit",
  "sources": [
    {
      "type": "reader",
      "url": "https://www.dmit.io/serverstatus.php",
      "label": "官方 Server Status",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    },
    {
      "type": "reader",
      "url": "https://dmit-abuse-team-temp-security-response.dmit.com/",
      "label": "官方 Security Response",
      "tier": 55,
      "kind": "official-announcement",
      "priority": 55
    },
    {
      "type": "reader",
      "url": "https://t.me/s/DMIT_INC",
      "label": "官方 Telegram 公告",
      "tier": 60,
      "kind": "official-announcement",
      "priority": 60
    }
  ]
});
})();
