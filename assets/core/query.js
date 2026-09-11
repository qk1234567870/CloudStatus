/* Service filtering, searching and ordering */
export function isActive(service) {
    if (service.health==="incident") return true;
    return (service.events||[]).some(function(e){
      return e.status && ["resolved","postmortem","completed","closed"].indexOf(e.status)===-1;
    });
  }

export function visibleServices(state,catalogOrder) {
    var n=state.search.trim().toLowerCase();
    var list=state.services.filter(function(s){
      if (state.filter!=="all" && s.category!==state.filter) return false;
      if (state.activeOnly && !isActive(s)) return false;
      if (n) {
        var h=[s.name,s.nameZh,s.desc,s.carrierLabel,s.routeClassLabel,s.globalProbeLabel]
          .concat((s.events||[]).map(function(e){return e.title;}))
          .concat((s.checks||[]).map(function(c){return [c.name,c.host,c.location,c.continent].join(" ");})).concat((s.details||[]).map(function(d){return [d.name,d.status,d.location,d.category,d.group,d.route].join(" ");}))
          .concat((s.globalProbe && s.globalProbe.regions || []).map(function(r){
            return [r.label,r.dcGroup,r.node&&r.node.country,r.node&&r.node.city,r.node&&r.node.asn].join(" ");
          }))
          .join(" ").toLowerCase();
        if (h.indexOf(n)===-1) return false;
      }
      return true;
    });

    // 「跨境線路」固定按運營商 → 線路級別排序，避免註冊順序造成混排。
    if(state.filter==="crossborder"){
      var carrierOrder={telecom:0,unicom:1,mobile:2};
      var classOrder={premium:0,international:1,public:2};
      var serviceOrder={
        "cn2-gia":0,
        "cn2-gt":1,
        "as4134":2,
        "as9929":3,
        "as10099":4,
        "as4837":5,
        "cmi":6
      };
      list.sort(function(a,b){
        var ca=carrierOrder[a.carrier]!=null?carrierOrder[a.carrier]:99;
        var cb=carrierOrder[b.carrier]!=null?carrierOrder[b.carrier]:99;
        if(ca!==cb) return ca-cb;

        var ra=classOrder[a.routeClass]!=null?classOrder[a.routeClass]:99;
        var rb=classOrder[b.routeClass]!=null?classOrder[b.routeClass]:99;
        if(ra!==rb) return ra-rb;

        return (serviceOrder[a.id]!=null?serviceOrder[a.id]:99)-
               (serviceOrder[b.id]!=null?serviceOrder[b.id]:99);
      });
    }else{
      list.sort(function(a,b){
        var ai=catalogOrder[a.id], bi=catalogOrder[b.id];
        return (ai==null?9999:ai)-(bi==null?9999:bi);
      });
    }
    return list;
  }
