import assert from 'node:assert/strict';
import {createSessionClient} from '../src/session-client.js';
const session={access_token:'test-token',refresh_token:'test-refresh',user:{id:'owner'},expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer'};
const requests=[];
const client=createSessionClient('https://test.supabase.co','public',session,async(input,init)=>{
 requests.push({url:String(input),init});
 if(String(input).includes('/logout'))return new Response('{}',{status:200});
 return new Response('[]',{status:200,headers:{'Content-Type':'application/json'}});
});
try{
 const {data,error}=await client.auth.getSession();
 assert.equal(error,null);assert.equal(data.session.user.id,'owner');
 assert.equal(requests.length,0,'Initializing server-issued session must not call /user');
 await client.from('quicknote_notes').select('id');
 assert.equal(requests.length,1);
 assert.equal(new Headers(requests[0].init.headers).get('authorization'),'Bearer test-token');
 await client.auth.signOut({scope:'local'});
 assert.match(requests[1].url,/logout\?scope=local/);
 assert.equal((await client.auth.getSession()).data.session,null);
 assert.throws(()=>createSessionClient('https://test.supabase.co','public',{}),/响应不完整/);
 console.log('Actual SDK: zero extra login requests, authenticated query and local logout passed');
}finally{await client.auth.dispose()}
