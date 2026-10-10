import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
const config=JSON.parse(await readFile(new URL('./supabase.config.json',import.meta.url),'utf8'));
const url=process.env.SUPABASE_URL||config.url||'',key=process.env.SUPABASE_PUBLISHABLE_KEY||config.publishableKey||'';
if(key.startsWith('sb_secret_'))throw new Error('Never publish a Supabase secret key');
if(key.startsWith('eyJ')){let payload;try{payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString())}catch{throw new Error('Invalid key')}if(payload.role!=='anon')throw new Error('Only anon/publishable keys are allowed')}
if(url&&!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw new Error('Invalid Supabase project URL');
if(process.env.REQUIRE_CONFIG==='1'&&(!url||!key))throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY repository variables');
await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'esm',target:'es2022',outfile:'dist/app.js',define:{SUPABASE_URL:JSON.stringify(url),SUPABASE_KEY:JSON.stringify(key)}});
console.log(url&&key?'Built with Supabase configuration':'Built unconfigured preview');

const hash=createHash('sha256').update(await readFile('dist/app.js')).digest('hex').slice(0,12);
const html=await readFile('dist/index.html','utf8');
await writeFile('dist/index.html',html.replace('./app.js','./app.js?v='+hash).replace('./style.css','./style.css?v='+hash));
