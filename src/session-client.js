import {createClient} from '@supabase/supabase-js';
import {fetchWithTimeout} from './fetch-timeout.js';

// Seed only the complete session returned by our successful server-side PIN check.
// This storage lives in this client instance; no tokens survive reload or locking.
export function createSessionClient(url,key,session,fetcher=globalThis.fetch.bind(globalThis)){
 if(!session?.access_token||!session.refresh_token||!session.user?.id||!session.expires_at)throw new Error('登录响应不完整，请重试');
 const storageKey='quicknote-session-'+crypto.randomUUID();
 const memory=new Map([[storageKey,JSON.stringify(session)]]);
 const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>{memory.set(k,v)},removeItem:k=>{memory.delete(k)}};
 return createClient(url,key,{auth:{storageKey,storage,persistSession:true,detectSessionInUrl:false},global:{fetch:(input,init={})=>{
  if(String(input).includes('/auth/v1/'))return fetchWithTimeout(input,init,10000,fetcher);
  return fetcher(input,init);
 }}});
}
