export const MAX_PHOTOS=20;
export const photoList=row=>Array.isArray(row.images)?row.images:row.image_path?[{image_path:row.image_path,image_name:row.image_name,thumbnail_path:row.thumbnail_path}]:[];
export const photoPaths=images=>images.flatMap(p=>[p.image_path,...(p.thumbnail_path?[p.thumbnail_path]:[])]);
export function createPhotoPicker(initial=[],previewUrl=async()=>'',notify=()=>{}){
 let items=initial.map(p=>({...p})),disabled=false,disposed=false;
 const element=document.createElement('div');element.className='photo-picker';
 function draw(){element.replaceChildren();for(const item of items){const box=document.createElement('div');box.className='photo-choice';const img=document.createElement('img');img.alt=item.file?.name||item.image_name||'图片';
  if(item.url)img.src=item.url;else previewUrl(item).then(url=>{if(!disposed&&items.includes(item)&&url)img.src=url}).catch(()=>{img.alt='预览不可用'});
  const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.disabled=disabled;remove.setAttribute('aria-label','移除这张图片');remove.onclick=()=>{if(disabled)return;if(item.url)URL.revokeObjectURL(item.url);items=items.filter(p=>p!==item);draw()};box.append(img,remove);element.append(box);
 }}
 function clear(){for(const p of items)if(p.url)URL.revokeObjectURL(p.url);items=[];draw()}
 draw();return {element,get items(){return items.slice()},add(files){if(disabled||disposed)return;for(const file of files){if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)){notify('仅支持 JPG、PNG、WebP、GIF 图片');continue}if(file.size>20*1024*1024){notify('每张图片不能超过 20 MB');continue}if(items.length>=MAX_PHOTOS){notify('每条记录最多 20 张图片');break}items.push({file,url:URL.createObjectURL(file)})}draw()},setDisabled(value){disabled=value;draw()},clear,destroy(){disposed=true;clear()},isDirty:()=>items.some(p=>p.file)||items.length!==initial.length};
}
export async function uploadPhotos(client,owner,noteId,items,thumbnail,progress=()=>{}){
 const uploaded=[],images=[];try{for(let i=0;i<items.length;i++){const item=items[i];if(!item.file){images.push({image_path:item.image_path,image_name:item.image_name,thumbnail_path:item.thumbnail_path});continue}
  progress(`正在上传图片 ${i+1} / ${items.length}…`);const path=`${owner}/${noteId}/${crypto.randomUUID()}`,preview=path+'-preview';const thumb=await thumbnail(item.file);
  for(const [name,blob] of [[path,item.file],[preview,thumb]]){const {error}=await client.storage.from('quicknote-images').upload(name,blob,{contentType:blob.type,upsert:false});if(error)throw error;uploaded.push(name)}
  images.push({image_path:path,image_name:item.file.name,thumbnail_path:preview});
 }return {images,uploaded}}catch(e){if(uploaded.length)await client.storage.from('quicknote-images').remove(uploaded).catch(()=>{});throw e}
}
