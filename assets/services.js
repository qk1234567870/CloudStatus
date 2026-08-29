/* CloudStatus service registry
 * Individual service definitions live in ./services/*.js
 * Keep this file small: it only owns registration and ordering.
 */
(function () {
  "use strict";

  var list = [];
  var ids = Object.create(null);

  function registerService(service) {
    if (!service || !service.id) {
      throw new Error("CloudStatus service module requires an id");
    }
    if (ids[service.id]) {
      throw new Error("Duplicate CloudStatus service id: " + service.id);
    }
    ids[service.id] = true;
    list.push(service);
  }

  window.CloudStatusServices = {
    register: registerService,
    list: list
  };

  // app.js continues to consume the same public array.
  window.CLOUDSTATUS_SERVICES = list;
})();
