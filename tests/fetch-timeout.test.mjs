import assert from 'node:assert/strict';
import {fetchWithTimeout} from '../src/fetch-timeout.js';
const timeout=AbortSignal.timeout,any=AbortSignal.any;
AbortSignal.timeout=undefined;AbortSignal.any=undefined;
try{
 const result=await fetchWithTimeout('/status',{},100,async(_url,{signal})=>{assert.equal(signal.aborted,false);return 'ok'});
 assert.equal(result,'ok');
 const waitForAbort=async(_url,{signal})=>new Promise((resolve,reject)=>{
  if(signal.aborted)return reject(signal.reason);
  signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
 });
 await assert.rejects(fetchWithTimeout('/slow',{},5,waitForAbort),{name:'TimeoutError'});
 const parent=new AbortController();
 const pending=fetchWithTimeout('/cancel',{signal:parent.signal},1000,waitForAbort);
 parent.abort();await assert.rejects(pending,{name:'AbortError'});
 await assert.rejects(fetchWithTimeout('/already-cancelled',{signal:parent.signal},1000,waitForAbort),{name:'AbortError'});
 await assert.rejects(fetchWithTimeout('/offline',{},1000,async()=>{throw new TypeError('Failed to fetch')}),/Failed to fetch/);
 // Also exercise actual SDK logout with both static APIs absent.
 await import('./session-client.test.mjs');
 await import('./login.test.mjs');
 console.log('Legacy AbortSignal: status/login/logout, timeout, cancellation and errors passed');
}finally{AbortSignal.timeout=timeout;AbortSignal.any=any}
