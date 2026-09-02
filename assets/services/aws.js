/* CloudStatus service module: AWS */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "aws",
  "name": "AWS",
    "nameZh": "亞馬遜雲端",
  "desc": "Amazon Web Services",
  "category": "cloud",
  "page": "https://health.aws.amazon.com/health/status",
  "parser": "aws",
  "sources": [
    {
      "type": "rss",
      "url": "https://status.aws.amazon.com/rss/all.rss",
      "label": "官方 RSS",
      "tier": 30,
      "kind": "official-rss",
      "priority": 30
    },
    {
      "type": "reader",
      "label": "官方 Health Dashboard",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    }
  ]
});
})();
