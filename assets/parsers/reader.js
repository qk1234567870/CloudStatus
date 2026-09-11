/* Reader dispatcher */
import {normalizeResult} from "../core/events.js?v=103.0.0";
import {PARSER_UTILS} from "./utils.js?v=103.0.0";
import {parseGooglePage} from "./google.js?v=103.0.0";
import {parseAzure} from "./azure.js?v=103.0.0";
import {parseApple,parseAppleBackup} from "./apple.js?v=103.0.0";
import {parseDMIT} from "./hosting.js?v=103.0.0";
import {parseInfrastructure,parseCloudflareRadarBGP} from "./network.js?v=103.0.0";

export function parseReader(text, service, source) {
    var moduleParser=(window.CloudStatusServiceParsers||{})[service.id];
    if (moduleParser && typeof moduleParser.parseReader === "function") {
      return normalizeResult(moduleParser.parseReader(text,service,source,PARSER_UTILS),service,source);
    }

    switch(service.parser) {
      case "google-cloud": return normalizeResult(parseGooglePage(text,service,source),service,source);
      case "azure": return normalizeResult(parseAzure(text,service,source),service,source);
      case "apple": return normalizeResult(parseApple(text,service,source),service,source);
      case "apple-backup": return normalizeResult(parseAppleBackup(text,service,source),service,source);
      case "dmit": return normalizeResult(parseDMIT(text,service,source),service,source);
      case "equinix":
      case "digital-realty":
      case "ntt-gdc":
      case "arelion":
      case "ntt-global":
      case "cogent": return normalizeResult(parseInfrastructure(text,service,source),service,source);
      case "cloudflare-radar-bgp": return normalizeResult(parseCloudflareRadarBGP(text,service,source),service,source);
      default: return normalizeResult(parseInfrastructure(text,service,source),service,source);
    }
  }
