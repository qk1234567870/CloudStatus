/* CloudStatus service module: OpenAI */
(function () {
  "use strict";
  window.CloudStatusServices.register({
  "id": "openai",
  "name": "OpenAI",
  "desc": "ChatGPT 與大語言模型 API 服務商",
  "category": "ai",
  "page": "https://status.openai.com",
  "parser": "statuspage",
  "sources": [
    {
      "type": "statuspage",
      "url": "https://status.openai.com/api/v2/incidents.json",
      "label": "官方 API",
      "tier": 10,
      "kind": "official-api",
      "priority": 10
    },
    {
      "type": "reader",
      "label": "官方頁 Reader",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    }
  ]
});
})();
