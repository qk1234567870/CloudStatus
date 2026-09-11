/* Shared text, DOM and date utilities */

export function $(q) { return document.querySelector(q); }

export function cleanText(v) { return String(v == null ? "" : v).replace(/\s+/g, " ").trim(); }

export function escapeHtml(v) {
    return String(v == null ? "" : v).replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

export function timeValue(v) {
    if (!v) return 0;
    var d = new Date(v);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

export function formatDate(v) {
    if (!v) return "";
    var d = new Date(v);
    if (isNaN(d.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("zh-TW", {
        year:"numeric", month:"numeric", day:"numeric",
        hour:"2-digit", minute:"2-digit", hour12:false
      }).format(d);
    } catch (e) { return ""; }
  }

export function formatRange(a,b) {
    var x = formatDate(a);
    if (!x) return "";
    if (!b) return x;

    var da = new Date(a);
    var db = new Date(b);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) {
      var y0 = formatDate(b);
      return y0 ? x + "-" + y0 : x;
    }

    var sameDay =
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate();

    if (sameDay) {
      try {
        var endTime = new Intl.DateTimeFormat("zh-TW", {
          hour:"2-digit",
          minute:"2-digit",
          hour12:false
        }).format(db);
        return x + "-" + endTime;
      } catch (e) {
        return x;
      }
    }

    var y = formatDate(b);
    return y ? x + "-" + y : x;
  }

export function lines(text) {
    return String(text||"").split(/\n+/).map(cleanText).filter(Boolean);
  }

export function findDate(text) {
    var m = String(text||"").match(
      /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}(?:\s+(?:at\s+)?)?\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*\([^)]+\)|\s+[A-Z]{2,5})?/i
    );
    if (!m) return null;
    var d = new Date(m[0].replace(/\([^)]+\)/g,""));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

export function findAnyDate(text) {
    var raw=String(text||"");

    // ISO / Telegram / common machine-readable forms.
    var patterns=[
      /\b\d{4}-\d{2}-\d{2}[T\s]\d{1,2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?\b/,
      /\b\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}\b/,
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}(?:\s+(?:at\s+)?)?\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s+[A-Z]{2,5})?\b/i
    ];

    for(var i=0;i<patterns.length;i++){
      var m=raw.match(patterns[i]);
      if(!m) continue;
      var d=new Date(m[0]);
      if(!isNaN(d.getTime())) return d.toISOString();
    }

    return findDate(raw);
  }

export function findDateRange(text) {
    var ds = [];
    var re = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\s+\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*\([^)]+\)|\s+[A-Z]{2,5})?/gi;
    var m;
    while ((m=re.exec(String(text||""))) !== null) {
      var d=new Date(m[0].replace(/\([^)]+\)/g,""));
      if (!isNaN(d.getTime())) ds.push(d.toISOString());
    }
    return { start: ds[0] || null, end: ds[1] || null };
  }
