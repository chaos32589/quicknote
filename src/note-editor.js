import {createPhotoPicker,photoList} from './photos.js';
export function createNoteEditor(row,save,onClose,previewUrl){
 const form=document.createElement('form');form.className='note-editor';
 const input=document.createElement('textarea');input.value=row.content||'';input.maxLength=20000;input.setAttribute('aria-label','编辑记录文字');input.rows=6;
 const counter=document.createElement('small');const updateCount=()=>{counter.textContent=input.value.length+' / 20000'};input.oninput=updateCount;updateCount();
 const message=document.createElement('p');message.setAttribute('role','status');
 const buttons=document.createElement('div');buttons.className='actions';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='取消';
 const submit=document.createElement('button');submit.type='submit';submit.className='primary';submit.textContent='保存修改';
 buttons.append(cancel,submit);form.append(input,counter,message);
 let pending=false,disposed=false;
 const picker=createPhotoPicker(photoList(row),previewUrl,text=>{message.textContent=text});
 const add=document.createElement('input');add.type='file';add.accept='image/jpeg,image/png,image/webp,image/gif';add.multiple=true;add.setAttribute('aria-label','添加图片');
 add.onchange=()=>{picker.add([...add.files]);add.value=''};
 const label=document.createElement('label');label.className='edit-photo-add';label.textContent='＋ 添加图片（每张 20 MB，最多 20 张）';label.append(add);
 form.append(picker.element,label,buttons);
 cancel.onclick=()=>{if(!pending)onClose()};
 form.onsubmit=async e=>{e.preventDefault();if(pending||disposed)return;const content=input.value.trim();
  if(!content&&!picker.items.length&&!row.file_path){message.textContent='纯文字记录不能为空';return}
  if(content.length>20000){message.textContent='文字不能超过 20000 字';return}
  pending=true;picker.setDisabled(true);add.disabled=true;input.disabled=cancel.disabled=submit.disabled=true;submit.textContent='保存中…';message.textContent='';
  try{await save(content,picker.items);if(!disposed)onClose()}catch(e){if(!disposed)message.textContent=e.message||'保存失败，修改已保留，请重试'}
  finally{pending=false;if(!disposed){picker.setDisabled(false);add.disabled=false;input.disabled=cancel.disabled=submit.disabled=false;submit.textContent='保存修改'}}
 };
 return {element:form,focus:()=>input.focus(),isDirty:()=>pending||picker.isDirty()||input.value!==(row.content||''),destroy:()=>{disposed=true;picker.destroy();input.value='';form.remove()}};
}
