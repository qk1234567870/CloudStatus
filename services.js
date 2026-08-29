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

  var parsers = Object.create(null);

  function registerParser(id, parser) {
    if (!id || !parser) {
      throw new Error("CloudStatus parser module requires id and parser");
    }
    parsers[id] = parser;
  }

  window.CloudStatusServices = {
    register: registerService,
    registerParser: registerParser,
    list: list,
    parsers: parsers
  };

  window.CloudStatusServiceParsers = parsers;

  // app.js continues to consume the same public array.
  window.CLOUDSTATUS_SERVICES = list;
})();
