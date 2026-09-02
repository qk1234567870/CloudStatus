/* CloudStatus service module: China Unicom AS9929 */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "as9929",
    "name": "China Unicom AS9929",
    "desc": "China Unicom · AS9929",
    "category": "crossborder",
    "page": "https://bgp.tools/as/9929",
    "parser": "bgp-upstream",
    "asn": "AS9929",
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
