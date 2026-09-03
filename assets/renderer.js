/* CloudStatus Template Renderer */
(function () {
  "use strict";

  window.CloudStatusRenderer = {
    renderService: function (service, ctx) {
      if (!window.CloudStatusTemplates || !window.CloudStatusTemplates.serviceCard) {
        throw new Error("CloudStatus service card template is not loaded");
      }
      return window.CloudStatusTemplates.serviceCard(service, ctx);
    },

    renderServices: function (services, ctx) {
      return (services || []).map(function (service) {
        return window.CloudStatusTemplates.serviceCard(service, ctx);
      }).join("");
    }
  };
})();
