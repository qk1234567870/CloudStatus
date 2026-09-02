/* CloudStatus service module: CN2 GIA */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "cn2-gia",
    "name": "CN2 GIA",
    "desc": "China Telecom · AS4809",
    "category": "crossborder",
    "page": "https://bgp.tools/as/4809",
    "parser": "bgp-upstream",
    "asn": "AS4809",
    "sources": [
      {
        "type": "reader",
        "label": "BGP 上游",
        "tier": 80,
        "kind": "trusted-third-party",
        "priority": 80
      }
    ]
  });
})();
