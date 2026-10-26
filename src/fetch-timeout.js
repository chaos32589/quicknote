// Avoid newer AbortSignal.timeout/any APIs in embedded and older browsers.
export async function fetchWithTimeout(input,init={},milliseconds=20000,fetcher=globalThis.fetch.bind(globalThis)){
 const controller=new AbortController();
 const upstream=init.signal||(typeof input==='object'?input?.signal:null);
 const abort=()=>controller.abort(upstream?.reason);
 if(upstream?.aborted)abort();
 else upstream?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>controller.abort(new DOMException('连接超时，请重试','TimeoutError')),milliseconds);
 try{return await fetcher(input,{...init,signal:controller.signal})}
 finally{clearTimeout(timer);upstream?.removeEventListener('abort',abort)}
}
