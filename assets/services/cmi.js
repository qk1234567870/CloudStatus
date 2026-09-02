/* CloudStatus service module: CMI
 * Cross-border route reference card.
 * No live health/event source is declared until a reliable route-specific source exists.
 */
(function () {
  "use strict";
  window.CloudStatusServices.register({
    "id": "cmi",
    "name": "CMI",
    "desc": "China Mobile International",
    "category": "crossborder",
    "page": "https://www.cmi.chinamobile.com/",
    "parser": "crossborder",
    "sources": []
  });
})();
