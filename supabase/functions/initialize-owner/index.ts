import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
const baseHeaders={'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const allowed=['https://chaos32589.github.io','https://xzc.app','https://www.xzc.app'];
 const headers={...baseHeaders,'Access-Control-Allow-Origin':allowed.includes(origin)?origin:'https://xzc.app','Vary':'Origin'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'仅支持 POST'},405);
 try{
 const {pin,code,action}=await req.json();
 const url=Deno.env.get('SUPABASE_URL')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:state,error:stateError}=await admin.from('quicknote_bootstrap').select('claimed,user_id').eq('id',1).single();
 if(stateError)return reply({error:'服务暂不可用'},503);
 if(action==='status')return reply({initialized:state.claimed});
 if(typeof pin!=='string'||!/^\d{6}$/.test(pin))return reply({error:'请输入 6 位数字访问码'},400);
 // The PIN is never persisted. A server-secret HMAC becomes the internal Auth password.
 // Knowledge of the public anon key does not permit bypassing the attempt limit.
 const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const password=hex(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode('quicknote-pin-v1:'+pin)));
 const email='private-owner@quicknote.invalid';
 if(action==='setup'){
 if(typeof code!=='string'||code.length!==32)return reply({error:'请输入一次性初始化码'},400);
 const hash=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code)));
 const {data:claim,error}=await admin.from('quicknote_bootstrap').update({claimed:true}).eq('id',1).eq('claimed',false).eq('token_hash',hash).select('id').maybeSingle();
 if(error)return reply({error:'初始化暂不可用'},503);
 if(!claim)return reply({error:'初始化码无效，或访问码已经设置'},403);
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{quicknote_owner:true}});
 if(created.error){await admin.from('quicknote_bootstrap').update({claimed:false}).eq('id',1);return reply({error:'设置失败，请稍后重试'},400)}
 await admin.from('quicknote_bootstrap').update({user_id:created.data.user.id,token_hash:'consumed'}).eq('id',1);
 }else if(action==='login'){
 if(!state.user_id)return reply({error:'请先设置访问码'},400);
 const allowed=await admin.rpc('quicknote_allow_pin_attempt');
 if(allowed.error)return reply({error:'服务暂不可用'},503);
 if(!allowed.data)return reply({error:'尝试次数过多，请 15 分钟后再试'},429);
 }else return reply({error:'无效请求'},400);
 const auth=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await auth.auth.signInWithPassword({email,password});
 if(error)return reply({error:'访问码不正确'},401);
 await admin.from('quicknote_pin_limit').update({attempts:0,window_start:new Date().toISOString()}).eq('id',1);
 return reply({session:data.session});
 }catch{return reply({error:'服务暂不可用，请稍后重试'},400)}
});
