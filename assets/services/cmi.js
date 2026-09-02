/* CloudStatus service module: CMI */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "cmi",
    "name": "CMI（中國移動國際）",
    "desc": "China Mobile International · AS58453",
    "category": "crossborder",
    "carrier": "mobile",
    "carrierLabel": "中國移動",
    "routeClass": "international",
    "routeClassLabel": "國際網",
    "page": "https://radar.cloudflare.com/routing/as58453",
    "parser": "cloudflare-radar-bgp",
    "asn": "AS58453",
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
