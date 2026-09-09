// Telegram global machine probe generator
// Source: Check-Host public machine nodes.
// Measures TCP/443 reachability to Telegram official Web DC hostnames.
// This is NOT user-report data and does NOT infer Telegram's official outage state.

const DCS = [
  { id: 1, name: "Pluto",  nameZh: "冥王星", host: "pluto.web.telegram.org"  },
  { id: 2, name: "Venus",  nameZh: "金星",   host: "venus.web.telegram.org"  },
  { id: 3, name: "Aurora", nameZh: "歐若拉", host: "aurora.web.telegram.org" },
  { id: 4, name: "Vesta",  nameZh: "灶神星", host: "vesta.web.telegram.org"  },
  { id: 5, name: "Flora",  nameZh: "花神星", host: "flora.web.telegram.org"  }
];

const REGIONS = [
  {
    id:"asia", label:"亞洲", dcGroup:"DC5",
    preferred:["sg","jp","hk","tw","kr","my","th","ph","id","vn","in","ae"],
    countries:new Set([
      "af","am","az","bh","bd","bt","bn","kh","cn","cy","ge","hk","in","id","ir","iq",
      "il","jp","jo","kz","kw","kg","la","lb","mo","my","mv","mn","mm","np","kp","om",
      "pk","ps","ph","qa","sa","sg","kr","lk","sy","tw","tj","th","tl","tm","ae","uz","vn","ye"
    ])
  },
  {
    id:"europe", label:"歐洲", dcGroup:"DC2 / DC4",
    preferred:["de","nl","ch","fr","gb","se","pl","fi","no","dk","it","es","at","be"],
    countries:new Set([
      "al","ad","at","by","be","ba","bg","hr","cz","dk","ee","fi","fr","de","gr","hu",
      "is","ie","it","lv","li","lt","lu","mt","md","mc","me","nl","mk","no","pl","pt",
      "ro","ru","sm","rs","sk","si","es","se","ch","tr","ua","gb","va","xk"
    ])
  },
  {
    id:"north-america", label:"北美", dcGroup:"DC1 / DC3",
    preferred:["us","ca","mx","cr","pa","do","pr"],
    countries:new Set([
      "ag","bs","bb","bz","ca","cr","cu","dm","do","sv","gd","gt","ht","hn","jm","mx",
      "ni","pa","kn","lc","vc","tt","us","pr","bm","gl","pm","aw","cw","sx","bq","ky",
      "tc","vg","vi","mq","gp","bl","mf"
    ])
  },
  {
    id:"south-america", label:"南美", dcGroup:"無主 DC",
    preferred:["br","cl","ar","co","pe","uy"],
    countries:new Set(["ar","bo","br","cl","co","ec","fk","gf","gy","py","pe","sr","uy","ve"])
  },
  {
    id:"oceania", label:"大洋洲", dcGroup:"無主 DC",
    preferred:["au","nz","fj","pg"],
    countries:new Set(["au","nz","fj","pg","sb","vu","ws","to","tv","nr","ki","fm","mh","pw","nc","pf","gu","mp","as","ck","nu","tk","wf","nf"])
  },
  {
    id:"africa", label:"非洲", dcGroup:"無主 DC",
    preferred:["za","ng","ke","eg","ma","tn","gh","mu"],
    countries:new Set([
      "dz","ao","bj","bw","bf","bi","cv","cm","cf","td","km","cg","cd","ci","dj","eg",
      "gq","er","sz","et","ga","gm","gh","gn","gw","ke","ls","lr","ly","mg","mw","ml",
      "mr","mu","ma","mz","na","ne","ng","rw","st","sn","sc","sl","so","za","ss","sd",
      "tz","tg","tn","ug","zm","zw","re","yt","sh"
    ])
  }
];

const API="https://check-host.net";
const OUT=new URL("../data/telegram-global.json", import.meta.url);
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

async function json(url){
  const res=await fetch(url,{
    headers:{
      "Accept":"application/json",
      "User-Agent":"CloudStatus-Telegram-Probe/2.0"
    }
  });
  if(!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return await res.json();
}

function nodeInfo(raw){
  const location=Array.isArray(raw && raw.location) ? raw.location : [];
  return {
    countryCode:String(location[0]||"").toLowerCase(),
    country:String(location[1]||""),
    city:String(location[2]||""),
    ip:String((raw && raw.ip)||""),
    asn:String((raw && raw.asn)||"")
  };
}

function chooseNodes(nodes){
  const entries=Object.entries(nodes||{})
    .map(([host,raw])=>({host,...nodeInfo(raw)}))
    .filter(node=>node.countryCode);

  return REGIONS.map(region=>{
    const regional=entries.filter(node=>region.countries.has(node.countryCode));

    regional.sort((a,b)=>{
      const ai=region.preferred.indexOf(a.countryCode);
      const bi=region.preferred.indexOf(b.countryCode);
      const ar=ai===-1 ? 9999 : ai;
      const br=bi===-1 ? 9999 : bi;
      if(ar!==br) return ar-br;
      if(a.countryCode!==b.countryCode) return a.countryCode.localeCompare(b.countryCode);
      return a.host.localeCompare(b.host);
    });

    return {
      id:region.id,
      label:region.label,
      dcGroup:region.dcGroup,
      preferred:region.preferred,
      availableNodes:regional.length,
      node:regional[0] || null
    };
  });
}

function flatten(value){
  if(!Array.isArray(value)) return [value];
  return value.flat(4);
}

function parseTcpResult(value){
  if(value==null) return {state:"pending",time:null,address:null,error:null};

  const items=flatten(value).filter(v=>v!=null);
  for(const item of items){
    if(item && typeof item==="object" && !Array.isArray(item)){
      if(typeof item.time==="number"){
        return {
          state:"ok",
          time:item.time,
          address:item.address ? String(item.address) : null,
          error:null
        };
      }
      if(item.error){
        return {state:"fail",time:null,address:null,error:String(item.error)};
      }
    }
  }
  return {state:"pending",time:null,address:null,error:null};
}

async function startTcpCheck(dc,selected){
  const u=new URL(API+"/check-tcp");
  u.searchParams.set("host",dc.host+":443");
  selected.forEach(region=>{
    if(region.node) u.searchParams.append("node",region.node.host);
  });

  const started=await json(u);
  if(!started || !started.request_id) throw new Error("Check-Host did not return request_id");

  return {
    requestId:String(started.request_id),
    report:started.permanent_link || null
  };
}

async function waitTcpResults(requestId,selected){
  let latest={};

  for(let attempt=0;attempt<9;attempt++){
    if(attempt) await sleep(1400);
    latest=await json(API+"/check-result/"+encodeURIComponent(requestId));

    const complete=selected.filter(r=>r.node).every(region=>{
      return parseTcpResult(latest && latest[region.node.host]).state!=="pending";
    });
    if(complete) break;
  }

  const result={};
  selected.forEach(region=>{
    if(!region.node) return;
    const parsed=parseTcpResult(latest && latest[region.node.host]);
    result[region.id]=parsed.state==="pending"
      ? {state:"unknown",time:null,address:null,error:"Probe result timeout"}
      : parsed;
  });
  return result;
}

async function main(){
  const generatedAt=new Date().toISOString();
  let selected=[];

  try{
    const nodePayload=await json(API+"/nodes/hosts");
    selected=chooseNodes(nodePayload && nodePayload.nodes);

    const usable=selected.filter(r=>r.node);
    if(!usable.length) throw new Error("No Check-Host machine nodes available");

    const perDc={};
    const reports=[];

    // One API job per Telegram DC, each job runs simultaneously from all selected regions.
    for(const dc of DCS){
      const started=await startTcpCheck(dc,selected);
      if(started.report) reports.push({dc:dc.id,url:started.report});
      perDc[dc.id]=await waitTcpResults(started.requestId,selected);
    }

    const regions=selected.map(region=>{
      if(!region.node){
        return {
          id:region.id,
          label:region.label,
          dcGroup:region.dcGroup,
          state:"unavailable",
          ok:0,
          total:0,
          availableNodes:region.availableNodes || 0,
          unavailableReason:"本輪 Check-Host 節點清單中沒有該洲可用機器節點",
          node:null,
          checks:[]
        };
      }

      const checks=DCS.map(dc=>{
        const r=(perDc[dc.id] && perDc[dc.id][region.id]) || {state:"unknown"};
        return {
          dc:dc.id,
          name:dc.name,
          nameZh:dc.nameZh,
          host:dc.host,
          state:r.state,
          time:typeof r.time==="number" ? r.time : null,
          address:r.address || null,
          error:r.error || null
        };
      });

      const known=checks.filter(c=>c.state==="ok" || c.state==="fail");
      const ok=checks.filter(c=>c.state==="ok").length;
      const fail=checks.filter(c=>c.state==="fail").length;
      let state="unknown";
      if(known.length===5 && ok===5) state="normal";
      else if(fail>0 && ok>0) state="partial";
      else if(fail===5) state="failed";
      else if(fail>0) state="partial";

      return {
        id:region.id,
        label:region.label,
        dcGroup:region.dcGroup,
        state,
        ok,
        total:5,
        availableNodes:region.availableNodes || 0,
        unavailableReason:null,
        node:{
          host:region.node.host,
          countryCode:region.node.countryCode,
          country:region.node.country,
          city:region.node.city,
          ip:region.node.ip,
          asn:region.node.asn
        },
        checks
      };
    });

    const measured=regions.filter(r=>r.total>0);
    const okCount=measured.reduce((n,r)=>n+r.ok,0);
    const totalCount=measured.reduce((n,r)=>n+r.total,0);
    const failedCount=measured.reduce((n,r)=>n+r.checks.filter(c=>c.state==="fail").length,0);
    const unknownCount=Math.max(0,totalCount-okCount-failedCount);

    let state="unknown";
    if(totalCount>0 && okCount===totalCount) state="normal";
    else if(failedCount>0 && okCount>0) state="partial";
    else if(totalCount>0 && failedCount===totalCount) state="failed";
    else if(totalCount>0 && failedCount>0) state="partial";

    const output={
      schema:1,
      runStatus:"success",
      generatedAt,
      source:{
        name:"Check-Host",
        url:"https://check-host.net/",
        api:"https://check-host.net/about/api",
        type:"machine-probe",
        method:"TCP 443"
      },
      target:{
        service:"Telegram",
        description:"Telegram official Web DC endpoints",
        port:443
      },
      summary:{
        state,
        ok:okCount,
        failed:failedCount,
        unknown:unknownCount,
        total:totalCount,
        regions:measured.length
      },
      regions,
      reports,
      note:"Machine probes only. Measures TCP/443 reachability from selected global nodes; does not use user reports and does not claim Telegram official outage status."
    };

    await BunLikeWrite(OUT,JSON.stringify(output,null,2)+"\n");
    console.log(`Telegram global probe: ${okCount}/${totalCount} reachable across ${measured.length} regions`);
  }catch(error){
    const output={
      schema:1,
      runStatus:"failed",
      generatedAt,
      source:{
        name:"Check-Host",
        url:"https://check-host.net/",
        api:"https://check-host.net/about/api",
        type:"machine-probe",
        method:"TCP 443"
      },
      target:{
        service:"Telegram",
        description:"Telegram official Web DC endpoints",
        port:443
      },
      summary:{state:"unknown",ok:0,failed:0,unknown:0,total:0,regions:0},
      regions:[],
      reports:[],
      error:String(error && error.message ? error.message : error),
      note:"Global machine probe generation failed. No user-report fallback is used."
    };
    await BunLikeWrite(OUT,JSON.stringify(output,null,2)+"\n");
    console.error(output.error);
  }
}

async function BunLikeWrite(url,text){
  const fs=await import("node:fs/promises");
  await fs.mkdir(new URL(".",url),{recursive:true});
  await fs.writeFile(url,text,"utf8");
}

await main();
