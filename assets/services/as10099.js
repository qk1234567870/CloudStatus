/* CloudStatus service module: China Unicom AS10099 */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "as10099",
    "name": "China Unicom AS10099",
    "desc": "China Unicom Global · AS10099",
    "category": "crossborder",
    "page": "https://bgp.tools/as/10099",
    "parser": "bgp-upstream",
    "asn": "AS10099",
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
