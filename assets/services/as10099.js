/* CloudStatus service module: China Unicom AS10099 */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "as10099",
    "name": "China Unicom AS10099",
    "nameZh": "中國聯通國際網",
    "desc": "China Unicom Global · AS10099",
    "category": "crossborder",
    "carrier": "unicom",
    "carrierLabel": "中國聯通",
    "routeClass": "international",
    "routeClassLabel": "國際網",
    "page": "https://radar.cloudflare.com/routing/as10099",
    "parser": "cloudflare-radar-bgp",
    "asn": "AS10099",
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
