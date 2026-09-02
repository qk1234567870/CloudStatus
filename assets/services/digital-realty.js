/* CloudStatus service module: Digital Realty */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "digital-realty",
  "name": "Digital Realty",
    "nameZh": "數據中心",
  "desc": "全球大型數據中心與互聯基礎設施",
  "category": "datacenter",
  "page": "https://status.digitalrealty.com/",
  "parser": "digital-realty",
  "sources": [
    {
      "type": "reader",
      "label": "官方 System Status",
      "kind": "official-status",
      "priority": 50,
      "tier": 50
    },
    {
      "type": "reader",
      "url": "https://developer.digitalrealty.com/docs/status-maintenance",
      "label": "官方 Status & Maintenance",
      "kind": "official-status",
      "priority": 51,
      "tier": 51
    }
  ]
});
})();
