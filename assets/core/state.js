/* Shared application state. Mutable data is isolated here. */
export const state={services:[],filter:"all",search:"",activeOnly:false};
export const runtime={lastRefresh:0,refreshInFlight:false};
export const catalog={services:[],order:Object.create(null)};

export function initializeCatalog(services){
  catalog.services=Array.isArray(services)?services:[];
  catalog.order=Object.create(null);
  catalog.services.forEach(function(service,index){catalog.order[service.id]=index;});
}
