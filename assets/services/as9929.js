/* CloudStatus service module: China Unicom AS9929 */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "as9929",
    "name": "China Unicom AS9929（中國聯通精品網）",
    "desc": "China Unicom · AS9929",
    "category": "crossborder",
    "carrier": "unicom",
    "carrierLabel": "中國聯通",
    "routeClass": "premium",
    "routeClassLabel": "精品網",
    "page": "https://radar.cloudflare.com/routing/as9929",
    "parser": "cloudflare-radar-bgp",
    "asn": "AS9929",
    "sources": [
      {
        "type": "reader",
        "label": "Cloudflare Radar",
        "tier": 80,
        "kind": "trusted-third-party",
        "priority": 80
      }
    ]
  });
})();
