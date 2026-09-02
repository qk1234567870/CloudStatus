/* CloudStatus service module: CMI */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "cmi",
    "name": "CMI",
    "desc": "China Mobile International · AS58453",
    "category": "crossborder",
    "page": "https://bgp.tools/as/58453",
    "parser": "bgp-upstream",
    "asn": "AS58453",
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
