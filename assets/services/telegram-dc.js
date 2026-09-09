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
        label:"Telegram 官方 WebSocket",
        kind:"official-direct",
        priority:10,
        tier:10
      }
    ]
  });

  window.CloudStatusServices.registerParser("telegram-dc",{
    runSource:async function(source,service){
      if(!window.WebSocket) {
        return {
          events:[],
          checks:DCS.map(function(dc){
            return {
              id:"dc"+dc.id,
              name:"DC"+dc.id+" · "+dc.name,
              host:dc.host,
              state:"unknown",
              url:"https://"+dc.host+"/"
            };
          }),
          health:null,
          healthText:"此瀏覽器不支援 WebSocket，無法直接檢查"
        };
      }

      var checks=await Promise.all(DCS.map(probeDc));
      var okCount=checks.filter(function(item){ return item.state==="ok"; }).length;

      return {
        events:[],
        checks:checks,
        health:okCount===5 ? "normal" : "incident",
        healthText:"DC WebSocket："+okCount+"/5 可連線（此瀏覽器）"
      };
    }
  });
})();
