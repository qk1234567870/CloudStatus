/* CloudStatus service module: China Unicom 169 */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "as4837",
    "name": "China Unicom 169",
    "nameZh": "中國聯通 169 骨幹網",
    "desc": "China Unicom · AS4837",
    "category": "crossborder",
    "carrier": "unicom",
    "carrierLabel": "中國聯通",
    "routeClass": "public",
    "routeClassLabel": "普通公網",
    "page": "https://radar.cloudflare.com/routing/as4837",
    "parser": "cloudflare-radar-bgp",
    "asn": "AS4837",
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
