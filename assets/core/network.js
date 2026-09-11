/* Network transport helpers */
import {CONFIG} from "./config.js?v=98.0.0";

const FETCH_TIMEOUT=CONFIG.fetchTimeout;
const READER_TIMEOUT=CONFIG.readerTimeout;

export async function fetchJson(url) {
    var r = await fetch(url,{cache:"no-store"});
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  }

export async function fetchText(url, timeoutMs) {
    timeoutMs=timeoutMs || FETCH_TIMEOUT;
    var controller = typeof AbortController!=="undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function(){ controller.abort(); }, timeoutMs) : null;

    try {
      var options={cache:"no-store"};
      if(controller) options.signal=controller.signal;
      var r = await fetch(url,options);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } finally {
      if(timer) clearTimeout(timer);
    }
  }

export async function fetchReader(url) {
    return await fetchText("https://r.jina.ai/" + url, READER_TIMEOUT);
  }
