/* CloudStatus service module: CN2 GIA */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "cn2-gia",
    "name": "CN2 GIA",
    "desc": "China Telecom · AS4809",
    "category": "crossborder",
    "carrier": "telecom",
    "carrierLabel": "中國電信",
    "routeClass": "premium",
    "routeClassLabel": "精品網",
    "page": "https://radar.cloudflare.com/routing/as4809",
    "parser": "cloudflare-radar-bgp",
    "asn": "AS4809",
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
