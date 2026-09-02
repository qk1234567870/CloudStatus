/* CloudStatus service module: China Unicom 169 */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "as4837",
    "name": "China Unicom 169",
    "desc": "China Unicom · AS4837",
    "category": "crossborder",
    "page": "https://bgp.tools/as/4837",
    "parser": "bgp-upstream",
    "asn": "AS4837",
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
