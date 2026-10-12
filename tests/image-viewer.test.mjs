import assert from 'node:assert/strict';
import {createImageViewer} from '../src/image-viewer.js';
function element(tag){return {tag,children:[],style:{},listeners:{},append(...items){this.children.push(...items)},setAttribute(){},removeAttribute(k){delete this[k]},addEventListener(k,v){this.listeners[k]=v},showModal(){this.open=true},close(){this.open=false},focus(){}}}
globalThis.document={body:element('body'),createElement:element};
let resolve,downloaded=null;
const viewer=createImageViewer(()=>new Promise(r=>resolve=r),async row=>{downloaded=row.id});
const dialog=document.body.children[0],toolbar=dialog.children[0],img=dialog.children[1];
const pending=viewer.open({id:'a',image_name:'test.png'},'preview');
assert.equal(dialog.open,true);assert.equal(img.src,'preview');
resolve(new Blob(['test'],{type:'image/png'}));await pending;
assert.match(img.src,/^blob:/);
await toolbar.children[1].onclick();assert.equal(downloaded,'a');
dialog.listeners.cancel({preventDefault(){}});assert.equal(dialog.open,false);assert.equal(img.src,undefined);
const late=viewer.open({id:'b'},'preview');viewer.close();resolve(new Blob(['late']));await late;
assert.equal(img.src,undefined);assert.equal(dialog.open,false);
const again=viewer.open({id:'c'},'preview');dialog.listeners.click({target:dialog});resolve(new Blob(['late']));await again;
assert.equal(dialog.open,false);
console.log('Image viewer: preview, original loading, download, Escape/backdrop close and late-response cleanup passed');
