/* CloudStatus service module: Telegram Data Centers */
(function () {
  "use strict";

  var DCS = [
    { id:1, name:"Pluto",  host:"pluto.web.telegram.org"  },
    { id:2, name:"Venus",  host:"venus.web.telegram.org"  },
    { id:3, name:"Aurora", host:"aurora.web.telegram.org" },
    { id:4, name:"Vesta",  host:"vesta.web.telegram.org"  },
    { id:5, name:"Flora",  host:"flora.web.telegram.org"  }
  ];

  var GLOBAL_MONITORS = [
    {
      id:"isdown",
      name:"IsDown",
      url:"https://isdown.app/status/telegram"
    },
    {
      id:"statusgator",
      name:"StatusGator",
      url:"https://statusgator.com/services/telegram"
    }
  ];

  function parseIsDown(text) {
    var raw=String(text||"");

    if(/Telegram is working normally/i.test(raw)){
      return {state:"normal",detail:"Telegram is working normally"};
    }
    if(/Confirmed Outage/i.test(raw)){
      return {state:"incident",detail:"Confirmed Outage"};
    }
    if(/Telegram is down/i.test(raw)){
      return {state:"incident",detail:"Telegram is down"};
    }
    if(/Possible Incident/i.test(raw)){
      return {state:"warning",detail:"Possible Incident"};
    }
    if(/Possible Outage/i.test(raw)){
      return {state:"warning",detail:"Possible Outage"};
    }

    return {state:"unknown",detail:"Current status not identified"};
  }

  function parseStatusGator(text) {
    var raw=String(text||"");

    // Specific "possible" wording wins over generic outage prose elsewhere on the page.
    if(/Possible Telegram outage/i.test(raw)){
      return {state:"warning",detail:"Possible Telegram outage"};
    }
    if(/Likely outage/i.test(raw)){
      return {state:"incident",detail:"Likely outage"};
    }
    if(/Telegram is down/i.test(raw)){
      return {state:"incident",detail:"Telegram is down"};
    }
    if(/Telegram is up/i.test(raw)){
      return {state:"normal",detail:"Telegram is up"};
    }
    if(/Telegram is working normally/i.test(raw)){
      return {state:"normal",detail:"Telegram is working normally"};
    }

    return {state:"unknown",detail:"Current status not identified"};
  }

  async function fetchGlobalMonitor(monitor,fetchReader) {
    try {
      var text=await fetchReader(monitor.url);
      var parsed=monitor.id==="isdown" ? parseIsDown(text) : parseStatusGator(text);
      return {
        id:monitor.id,
        name:monitor.name,
        state:parsed.state,
        detail:parsed.detail,
        url:monitor.url
      };
    } catch(e) {
      return {
        id:monitor.id,
        name:monitor.name,
        state:"unknown",
        detail:"Monitor temporarily unavailable",
        url:monitor.url
      };
    }
  }

  function probeUrl(url, timeoutMs) {
    return new Promise(function (resolve) {
      var ws=null;
      var done=false;
      var timer=null;

      function finish(state) {
        if(done) return;
        done=true;
        if(timer) clearTimeout(timer);

        if(ws) {
          try {
            ws.onopen=null;
            ws.onerror=null;
            ws.onclose=null;
            if(ws.readyState===WebSocket.OPEN || ws.readyState===WebSocket.CONNECTING) ws.close();
          } catch(e) {}
        }
        resolve(state);
      }

      try {
        // Telegram MTProto WebSocket endpoint uses the "binary" subprotocol.
        ws=new WebSocket(url,"binary");
        ws.binaryType="arraybuffer";
        timer=setTimeout(function(){ finish("timeout"); },timeoutMs);

        // 101 Switching Protocols / WebSocket OPEN is the only success condition.
        ws.onopen=function(){ finish("ok"); };
        ws.onerror=function(){ finish("fail"); };
        ws.onclose=function(){ if(!done) finish("fail"); };
      } catch(e) {
        finish("fail");
      }
    });
  }

  async function probeDc(dc) {
    var primary="wss://"+dc.host+"/apiws";
    var backupHost=dc.host.replace(".web.telegram.org","-1.web.telegram.org");
    var backup="wss://"+backupHost+"/apiws";

    var primaryState=await probeUrl(primary,4500);
    if(primaryState==="ok") {
      return {
        id:"dc"+dc.id,
        name:"DC"+dc.id+" · "+dc.name,
        host:dc.host,
        state:"ok",
        endpoint:"primary",
        url:"https://"+dc.host+"/"
      };
    }

    // 官方文件允許 -1 hostname；主端點失敗時才測備援，避免無謂連線。
    var backupState=await probeUrl(backup,4500);
    if(backupState==="ok") {
      return {
        id:"dc"+dc.id,
        name:"DC"+dc.id+" · "+dc.name,
        host:dc.host,
        state:"ok",
        endpoint:"backup",
        url:"https://"+backupHost+"/"
      };
    }

    return {
      id:"dc"+dc.id,
      name:"DC"+dc.id+" · "+dc.name,
      host:dc.host,
      state:(primaryState==="timeout" && backupState==="timeout") ? "timeout" : "fail",
      endpoint:null,
      url:"https://"+dc.host+"/"
    };
  }

  window.CloudStatusServices.register({
    id:"telegram-dc",
    name:"Telegram Data Centers",
    nameZh:"Telegram 資料中心",
    desc:"MTProto · DC1–DC5",
    category:"platform",
    page:"https://core.telegram.org/mtproto/transports",
    parser:"telegram-dc",
    sources:[
      {
        type:"telegram-dc",
        url:"https://core.telegram.org/mtproto/transports",
        label:"多來源監控",
        kind:"official-direct",
        priority:10,
        tier:10
      }
    ]
  });

  window.CloudStatusServices.registerParser("telegram-dc",{
    runSource:async function(source,service,tools){
      var localPromise;

      if(!window.WebSocket) {
        localPromise=Promise.resolve(DCS.map(function(dc){
          return {
            id:"dc"+dc.id,
            name:"DC"+dc.id+" · "+dc.name,
            host:dc.host,
            state:"unknown",
            endpoint:null,
            url:"https://"+dc.host+"/"
          };
        }));
      } else {
        localPromise=Promise.all(DCS.map(probeDc));
      }

      var globalPromise=Promise.all(GLOBAL_MONITORS.map(function(monitor){
        return fetchGlobalMonitor(monitor,tools.fetchReader);
      }));

      var settled=await Promise.all([localPromise,globalPromise]);
      var checks=settled[0];
      var globalChecks=settled[1];

      var okCount=checks.filter(function(item){ return item.state==="ok"; }).length;
      var knownLocal=checks.some(function(item){ return item.state!=="unknown"; });

      return {
        events:[],
        checks:checks,
        globalChecks:globalChecks,
        health:knownLocal ? (okCount===5 ? "normal" : "incident") : null,
        healthText:knownLocal
          ? "DC WebSocket："+okCount+"/5 可連線（目前網路）"
          : "目前網路無法執行 WebSocket 檢查"
      };
    }
  });
})();
