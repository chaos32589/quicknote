import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
const headers={'Access-Control-Allow-Origin':'https://chaos32589.github.io','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'仅支持 POST'},405);
 // Custom authentication: high-entropy one-time activation code, hash checked on the server.
 // Public frontend keys alone never authorize account creation.
 try{
 const {username,password,code}=await req.json();
 if(typeof username!=='string'||! /^[a-zA-Z0-9_]{3,24}$/.test(username)||typeof password!=='string'||password.length<10||password.length>128||typeof code!=='string'||code.length!==32)return reply({error:'用户名需为 3–24 位字母、数字或下划线；密码至少 10 位；请填写初始化码。'},400);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:claim,error:claimError}=await admin.from('quicknote_bootstrap').update({claimed:true}).eq('id',1).eq('claimed',false).eq('token_hash',hash).select('id').maybeSingle();
 if(claimError)return reply({error:'初始化暂不可用，请稍后重试'},503);
 if(!claim)return reply({error:'初始化码无效，或私人账号已经创建。'},403);
 const {data,error}=await admin.auth.admin.createUser({email:username.toLowerCase()+'@quicknote.invalid',password,email_confirm:true,app_metadata:{quicknote_owner:true}});
 if(error){await admin.from('quicknote_bootstrap').update({claimed:false}).eq('id',1);return reply({error:'账号创建失败，请更换用户名或稍后重试。'},400)}
 // claimed remains true even if this audit write fails: never reopen a completed registration.
 await admin.from('quicknote_bootstrap').update({user_id:data.user.id,token_hash:'consumed'}).eq('id',1);
 return reply({ok:true});
 }catch{return reply({error:'无法完成初始化，请稍后重试'},400)}
});
