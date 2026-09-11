import { readFile, writeFile } from "node:fs/promises";

const SITE="https://does.dmit.fail";
const API=SITE+"/api/v1/services?locale=en";
const PAGE=SITE+"/services";
const READER="https://r.jina.ai/https://does.dmit.fail/services";
const OUT=new URL("../data/dmit-services.json",import.meta.url);

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function readPrevious(){
  try{return JSON.parse(await readFile(OUT,"utf8"));}catch{return null;}
}

async function fetchText(url,{attempts=4,timeout=15000}={}){
  let last=null;
  for(let i=0;i<attempts;i++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const response=await fetch(url,{
        cache:"no-store",
        signal:controller.signal,
        headers:{
          "Accept":"application/json,text/plain,text/html;q=0.9,*/*;q=0.8",
          "User-Agent":"CloudStatus-DMIT-Services/1.0"
        }
      });
      if(response.ok) return await response.text();
      last=new Error(`HTTP ${response.status} ${url}`);
      if(i===attempts-1) throw last;
    }catch(error){
      last=error;
      if(i===attempts-1) throw error;
    }finally{
      clearTimeout(timer);
    }
    await sleep(1500*Math.pow(2,i));
  }
  throw last || new Error(`Fetch failed ${url}`);
}

function scalar(v){
  if(v==null) return "";
  if(typeof v==="string" || typeof v==="number" || typeof v==="boolean") return String(v);
  if(typeof v==="object") return scalar(v.en ?? v.name ?? v.title ?? v.label ?? v.status ?? v.value ?? "");
  return "";
}

function text(v){
  return scalar(v).replace(/\s+/g," ").trim();
}

function token(v){
  if(v===true) return "ok";
  if(v===false) return "fail";
  const s=text(v).toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ").trim();
  if(!s) return "unknown";
  if(/^(operational|available|healthy|normal|up|ok|okay|all systems operational)$/.test(s)) return "ok";
  if(/\b(outage|degraded|critical|unavailable|maintenance|incident|issue|down|failed)\b/.test(s)) return "fail";
  return "unknown";
}

function pathNames(path){return path.map(entry=>entry.name||"");}

function detectLocation(path,value,name){
  const explicit=text(value.location||value.region||value.city||value.datacenter||value.datacentre);
  const joined=[explicit,name,...pathNames(path)].join(" ");
  if(/\bLAX\b|Los Angeles/i.test(joined)) return "Los Angeles";
  if(/\bTYO\b|Tokyo/i.test(joined)) return "Tokyo";
  if(/\bHKG\b|Hong Kong/i.test(joined)) return "Hong Kong";
  if(/Applications?/i.test(joined)) return "Applications";
  return explicit;
}

function detectGroup(path,value,name){
  const explicit=text(value.group||value.product_line||value.productLine||value.product||value.service_group);
  const candidates=[explicit,name,...pathNames(path)];
  for(const candidate of candidates){
    const m=text(candidate).match(/\b((?:LAX|TYO|HKG)\s+(?:Pro|EB|T1))\b/i);
    if(m){
      return m[1].replace(/\s+/g," ")
        .replace(/\bpro\b/i,"Pro")
        .replace(/\beb\b/i,"EB")
        .replace(/\bt1\b/i,"T1");
    }
  }
  if(candidates.some(v=>/^Applications?$/i.test(text(v)))) return "Applications";
  if(explicit && explicit!==name) return explicit;
  for(let i=path.length-1;i>=0;i--){
    const fallback=path[i]?.name||"";
    if(fallback && fallback!==name && !/^(Services?|Routes?|Datacenter|Application)$/i.test(fallback)) return fallback;
  }
  return "";
}

function detectKind(path,value,location){
  const explicit=text(value.kind||value.type||value.category||"");
  if(/application/i.test(explicit)||location==="Applications") return "application";
  if(/datacenter|datacentre/i.test(explicit)) return "datacenter";
  if(/Application/i.test(pathNames(path).join(" "))) return "application";
  return "datacenter";
}

function detectRoute(value,name){
  const explicit=text(value.route||value.network||value.provider||value.carrier);
  if(explicit && explicit!==name) return explicit;
  if(/CN2 GIA/i.test(name)) return "China Telecom CN2 GIA";
  if(/China Unicom Premium/i.test(name)) return "China Unicom Premium";
  if(/CMIN2/i.test(name)) return "China Mobile CMIN2";
  if(/\bCMI\b/i.test(name)) return "China Mobile CMI";
  if(/DMIT Backbone/i.test(name)) return "DMIT Backbone";
  if(/Arelion/i.test(name)) return "Arelion";
  if(/Cogent/i.test(name)) return "Cogent";
  if(/\bNTT\b/i.test(name)) return "NTT";
  if(/Global Secure Layer/i.test(name)) return "Global Secure Layer";
  return "";
}

function normalizeApi(data){
  const out=[];
  const seen=new Set();

  function walk(value,path=[],depth=0,keyHint=""){
    if(depth>10||value==null) return;
    if(Array.isArray(value)){
      value.forEach(v=>walk(v,path,depth+1,""));
      return;
    }
    if(typeof value!=="object") return;

    const name=text(value.name||value.title||value.label||value.service||value.product||keyHint||"");
    const raw=value.status??value.state??value.indicator??value.health??null;
    const rawStatus=text(raw);

    if(name&&raw!=null&&rawStatus){
      let group=detectGroup(path,value,name);
      const location=detectLocation(path,value,name);
      if(location==="Applications"&&!group) group="Applications";
      const kind=detectKind(path,value,location);
      const category=text(value.category||value.type||value.kind||"")||(kind==="application"?"Application":"Datacenter");
      const route=detectRoute(value,name);
      const id=text(value.id||value.slug||"")||[location,group,name].filter(Boolean).join("/").toLowerCase().replace(/\s+/g,"-");
      const key=id.toLowerCase();
      if(!seen.has(key)){
        seen.add(key);
        out.push({id,name,status:rawStatus,state:token(raw),location,category,kind,group,route});
      }
    }

    const nextPath=name?[...path,{name,type:text(value.type||value.category||"")}]:path;
    for(const [key,child] of Object.entries(value)){
      if(["translations","locale","description","updates","metadata"].includes(key)) continue;
      if(child&&typeof child==="object") walk(child,nextPath,depth+1,key);
    }
  }

  walk(data);
  return out;
}

function stripMarkdown(value){
  return text(value)
    .replace(/^#{1,6}\s*/,"")
    .replace(/^\s*[-*+]\s+/,"")
    .replace(/\[([^\]]+)\]\([^)]+\)/g,"$1")
    .replace(/[`*_]+/g,"")
    .trim();
}

function normalizeReader(markdown){
  const lines=String(markdown||"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const out=[];
  let location="",group="",category="";

  for(const rawLine of lines){
    const h3=rawLine.match(/^###\s+(.+)$/);
    if(h3){
      const heading=stripMarkdown(h3[1]);
      if(["Los Angeles","Tokyo","Hong Kong","Applications"].includes(heading)){
        location=heading;
        group=location==="Applications"?"Applications":"";
        category=location==="Applications"?"Application":"Datacenter";
      }
      continue;
    }

    const clean=stripMarkdown(rawLine);
    if(/^(Datacenter|Application)$/i.test(clean)){
      category=clean;
      continue;
    }
    if(/^(?:LAX|TYO|HKG)\s+(?:Pro|EB|T1)$/i.test(clean)){
      group=clean.replace(/\bpro\b/i,"Pro").replace(/\beb\b/i,"EB").replace(/\bt1\b/i,"T1");
      continue;
    }

    if(!/^\s*[-*+]\s+/.test(rawLine)||!location) continue;

    const statusMatch=clean.match(/\s+(All Systems Operational|Operational|Degraded Performance|Partial Outage|Major Outage|Maintenance|Under Maintenance|Unavailable|Down)$/i);
    if(!statusMatch) continue;

    const rawStatus=statusMatch[1];
    let left=clean.slice(0,statusMatch.index).trim();
    const routes=[];
    for(const match of left.matchAll(/\b(Outbound|Inbound|Interconnect|Internet|System)\b/gi)) routes.push(match[1]);

    const name=left
      .replace(/\s+(?:Outbound|Inbound)(?:\s*·\s*(?:Outbound|Inbound))*\s*$/i,"")
      .replace(/\s+(?:Interconnect|Internet|System)\s*$/i,"")
      .trim();

    out.push({
      id:[location,group,name].filter(Boolean).join("/").toLowerCase().replace(/\s+/g,"-"),
      name,
      status:rawStatus,
      state:token(rawStatus),
      location,
      category:category||(location==="Applications"?"Application":"Datacenter"),
      kind:location==="Applications"?"application":"datacenter",
      group:group||(location==="Applications"?"Applications":"其他"),
      route:[...new Set(routes)].join(" · ")
    });
  }
  return out;
}

function isUsable(details){
  if(!Array.isArray(details)||details.length<20) return false;
  const locations=new Set(details.map(x=>x.location));
  const groups=new Set(details.map(x=>x.group));
  return locations.has("Los Angeles")&&locations.has("Tokyo")&&locations.has("Hong Kong")&&
    groups.has("LAX Pro")&&groups.has("TYO Pro")&&groups.has("HKG Pro");
}

async function main(){
  const generatedAt=new Date().toISOString();
  const previous=await readPrevious();

  try{
    let details=[];
    let sourceType="api";

    try{
      const apiText=await fetchText(API);
      details=normalizeApi(JSON.parse(apiText));
    }catch(error){
      console.warn("DMIT services API failed:",error.message);
    }

    if(!isUsable(details)){
      const markdown=await fetchText(READER);
      details=normalizeReader(markdown);
      sourceType="services-page-reader";
    }

    if(!isUsable(details)){
      throw new Error(`DMIT services normalized result is incomplete (${details.length} items)`);
    }

    const payload={
      runStatus:"success",
      generatedAt,
      source:{name:"Services · DOES DMIT FAIL?",url:PAGE,api:API,type:sourceType},
      details
    };
    await writeFile(OUT,JSON.stringify(payload,null,2)+"\n","utf8");
    console.log(`DMIT services: ${details.length} items via ${sourceType}`);
  }catch(error){
    const previousGood=previous&&Array.isArray(previous.details)&&previous.details.length>=20;
    if(previousGood){
      const kept={
        ...previous,
        runStatus:"stale",
        lastAttemptAt:generatedAt,
        error:String(error?.message||error)
      };
      await writeFile(OUT,JSON.stringify(kept,null,2)+"\n","utf8");
      console.error("DMIT services refresh failed; preserved previous data:",error);
      return;
    }

    const failed={
      runStatus:"failed",
      generatedAt,
      source:{name:"Services · DOES DMIT FAIL?",url:PAGE,api:API},
      error:String(error?.message||error),
      details:[]
    };
    await writeFile(OUT,JSON.stringify(failed,null,2)+"\n","utf8");
    throw error;
  }
}

main();
