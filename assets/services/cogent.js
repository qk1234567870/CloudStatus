/* CloudStatus service module: Cogent */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "cogent",
  "name": "Cogent（國際骨幹網）",
  "desc": "全球大型 IP Transit 與頻寬批發網路",
  "category": "backbone",
  "page": "https://ecogent.cogentco.com/network-status",
  "parser": "cogent",
  "sources": [
    {
      "type": "reader",
      "label": "官方 Network Status",
      "kind": "official-status",
      "priority": 50,
      "tier": 50
    },
    {
      "type": "reader",
      "url": "https://www.cogentco.com/en/sprint-portal",
      "label": "官方 Maintenance 資訊",
      "kind": "official-status",
      "priority": 55,
      "tier": 55
    }
  ]
});
})();
