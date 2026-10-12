export function createImageViewer(loadOriginal,onDownload){
 const dialog=document.createElement('dialog');dialog.className='image-viewer';dialog.setAttribute('aria-label','图片放大预览');
 const toolbar=document.createElement('div');toolbar.className='image-viewer-toolbar';
 const message=document.createElement('span');message.setAttribute('role','status');
 const download=document.createElement('button');download.type='button';download.textContent='下载原图';
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','关闭图片预览');
 const image=document.createElement('img');image.alt='图片预览';
 toolbar.append(message,download,close);dialog.append(toolbar,image);document.body.append(dialog);
 let generation=0,objectUrl=null,current=null,previousOverflow='';
 function clear(){generation++;current=null;image.removeAttribute('src');image.onload=null;image.onerror=null;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;document.body.style.overflow=previousOverflow}
 function dismiss(){if(!dialog.open)return;dialog.close();clear()}
 close.onclick=dismiss;dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss()});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dismiss()});
 download.onclick=async()=>{if(!current)return;const row=current,token=generation;download.disabled=true;try{await onDownload(row)}catch(e){if(token===generation)message.textContent=e.message||'下载失败，请重试'}finally{if(token===generation)download.disabled=false}};
 async function open(row,preview){
  dismiss();const token=++generation;current=row;download.disabled=false;image.alt=row.image_name||'记录图片';message.textContent='正在加载原图…';
  if(preview)image.src=preview;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();close.focus();
  try{const blob=await loadOriginal(row);if(token!==generation||!dialog.open)return;objectUrl=URL.createObjectURL(blob);image.onload=()=>{if(token===generation)message.textContent='原图'};image.onerror=()=>{if(token===generation)message.textContent='图片无法预览，可下载原图'};image.src=objectUrl}
  catch{if(token===generation)message.textContent='原图加载失败，请关闭后重试'}
 }
 return {open,close:dismiss};
}
