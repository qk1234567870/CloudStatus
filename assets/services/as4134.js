/* CloudStatus service module: China Telecom 163 */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "as4134",
    "name": "China Telecom 163",
    "nameZh": "中國電信 163 骨幹網",
    "desc": "China Telecom · AS4134",
    "category": "crossborder",
    "carrier": "telecom",
    "carrierLabel": "中國電信",
    "routeClass": "public",
    "routeClassLabel": "普通公網",
    "page": "https://radar.cloudflare.com/routing/as4134",
    "parser": "cloudflare-radar-bgp",
    "asn": "AS4134",
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
