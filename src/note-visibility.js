// Render cloud state; never report a successful toggle before persistence succeeds.
export function visibilityButton(row,card,save,onError=()=>{}){
 const button=document.createElement('button');button.type='button';button.className='icon-button visibility-button';
 const eye='<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
 let hidden=!!row.is_hidden,pending=false;
 function paint(){card.classList.toggle('is-concealed',hidden);button.title=hidden?'显示信息':'隐藏信息';button.setAttribute('aria-label',button.title);button.setAttribute('aria-expanded',String(!hidden));button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+eye+(hidden?'<path d="m3 3 18 18"/>':'')+'</svg>'}
 button.onclick=async()=>{if(pending)return;pending=true;button.disabled=true;try{await save(!hidden);hidden=!hidden;paint()}catch(e){onError(e)}finally{pending=false;button.disabled=false}};paint();return button;
}
