/* Reader dispatcher */
import {normalizeResult} from "../core/events.js";
import {PARSER_UTILS} from "./utils.js";
import {parseGooglePage} from "./google.js";
import {parseAzure} from "./azure.js";
import {parseApple,parseAppleBackup} from "./apple.js";
import {parseOracle,parseBandwagon,parseDMIT} from "./hosting.js";
import {parseInfrastructure,parseCloudflareRadarBGP} from "./network.js";

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
      case "oracle": return normalizeResult(parseOracle(text,service,source),service,source);
      case "bandwagon": return normalizeResult(parseBandwagon(text,service,source),service,source);
      case "dmit": return normalizeResult(parseDMIT(text,service,source),service,source);
      case "equinix":
      case "digital-realty":
      case "ntt-gdc":
      case "arelion":
      case "ntt-global":
      case "cogent": return normalizeResult(parseInfrastructure(text,service,source),service,source);
      case "aws": return normalizeResult(parseInfrastructure(text,service,source),service,source);
      case "cloudflare-radar-bgp": return normalizeResult(parseCloudflareRadarBGP(text,service,source),service,source);
      default: return normalizeResult(parseInfrastructure(text,service,source),service,source);
    }
  }
