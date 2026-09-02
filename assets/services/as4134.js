/* CloudStatus service module: China Telecom 163 */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "as4134",
    "name": "China Telecom 163",
    "desc": "China Telecom · AS4134",
    "category": "crossborder",
    "page": "https://bgp.tools/as/4134",
    "parser": "bgp-upstream",
    "asn": "AS4134",
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
