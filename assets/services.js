/* CloudStatus service registry + loader */
(function () {
  "use strict";

  var version = "64.0.0";
  var expectedServiceCount = 23;

  var manifest = [
  "cloudflare",
  "aws",
  "azure",
  "google-cloud",
  "github",
  "openai",
  "apple",
  "oracle",
  "bandwagonhost",
  "dmit",
  "equinix",
  "digital-realty",
  "ntt-gdc",
  "arelion",
  "ntt-global-network",
  "cogent",
  "cn2-gia",
  "cn2-gt",
  "as9929",
  "as10099",
  "cmi",
  "as4134",
  "as4837"
];
  var list = [];
  var ids = Object.create(null);
  var parsers = Object.create(null);

  function normalizeSources(service) {
    if (!Array.isArray(service.sources)) return service;

    service.sources = service.sources.map(function (source) {
      if (!source) return source;
      if (source.url) return source;

      var inherited = Object.assign({}, source);
      inherited.url = service.page || null;
      return inherited;
    });

    return service;
  }

  function registerService(service) {
    if (!service || !service.id) {
      throw new Error("CloudStatus service module requires an id");
    }
    if (ids[service.id]) {
      throw new Error("Duplicate CloudStatus service id: " + service.id);
    }

    ids[service.id] = true;
    list.push(normalizeSources(service));
  }

  function registerParser(id, parser) {
    if (!id || !parser) {
      throw new Error("CloudStatus parser module requires id and parser");
    }
    parsers[id] = parser;
  }

  function loadScript(id) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "./assets/services/" + encodeURIComponent(id) + ".js?v=" + encodeURIComponent(version);
      script.async = true;
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error("Failed to load service module: " + id));
      };
      document.head.appendChild(script);
    });
  }

  function finalizeOrder() {
    var order = Object.create(null);
    manifest.forEach(function (id, index) { order[id] = index; });

    list.sort(function (a, b) {
      var ai = order[a.id];
      var bi = order[b.id];
      return (ai == null ? 999 : ai) - (bi == null ? 999 : bi);
    });

    if (list.length !== expectedServiceCount) {
      console.warn(
        "CloudStatus service modules loaded:",
        list.length,
        "/",
        expectedServiceCount
      );
    }

    return list;
  }

  window.CloudStatusServices = {
    register: registerService,
    registerParser: registerParser,
    list: list,
    parsers: parsers,
    manifest: manifest.slice()
  };

  window.CloudStatusServiceParsers = parsers;
  window.CLOUDSTATUS_SERVICES = list;

  // Modules download in parallel, then registry order is normalized once.
  window.CloudStatusServices.ready = Promise.all(
    manifest.map(loadScript)
  ).then(finalizeOrder);
})();
