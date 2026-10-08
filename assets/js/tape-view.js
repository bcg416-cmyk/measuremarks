/* MeasureMarks Tape View pilot: imperial Field Mode, Board & Batten only.
   Uses the rounded field mark, never an independently calculated position. */
(() => {
  'use strict';
  if (document.body.dataset.tool !== 'batten') return;
  const field=document.getElementById('fieldOverlay'),value=document.getElementById('fieldValue');
  const card=field?.querySelector('.field-card');
  if(!card||!value)return;
  const panel=document.createElement('section');
  panel.className='tape-view';
  panel.setAttribute('aria-label','Tape measure guide');
  panel.style.cssText='margin:14px 0 18px;padding:12px;border-radius:14px;background:#f7f4df;color:#1d2922;text-align:left;max-width:100%;box-sizing:border-box';
  panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong style="font-size:15px">Tape View</strong><button type="button" class="tape-toggle" aria-pressed="true" style="border:1px solid #52695c;border-radius:9px;padding:7px 12px;background:white;color:#18211a;font-weight:700;cursor:pointer">Hide tape</button></div><div class="tape-body"><p class="tape-instruction" style="font-size:13px;margin:9px 0">Find the red mark on your tape measure.</p><svg class="tape-svg" viewBox="0 0 640 168" style="width:100%;height:auto;display:block" role="img"></svg><p style="font-size:11px;margin:6px 0 0">Zoomed illustration, not actual physical scale. Use the number on your tape to find the correct inch.</p></div>';
  const tip=card.querySelector('.field-tip');
  if(tip)card.insertBefore(panel,tip);else card.appendChild(panel);
  const svg=panel.querySelector('.tape-svg'),body=panel.querySelector('.tape-body'),toggle=panel.querySelector('.tape-toggle'),instruction=panel.querySelector('.tape-instruction');
  let showing=true;
  const NS='http://www.w3.org/2000/svg';
  function node(tag,attrs={},text){
    const n=document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));
    if(text!==undefined)n.textContent=text;
    svg.appendChild(n);
    return n;
  }
  function parseMark(s){
    // Field Mode imperial marks are inch values such as 54 1/2" or 3/16".
    const match=s.trim().replace(/[″”]/g,'"').match(/^(\d+)(?:\s+(\d+)\/(\d+))?\s*"$/)
      ||s.trim().replace(/[″”]/g,'"').match(/^(\d+)\/(\d+)\s*"$/);
    if(!match)return null;
    if(match.length===3)return Number(match[1])/Number(match[2]);
    return Number(match[1])+(match[2]?Number(match[2])/Number(match[3]):0);
  }
  function render(){
    const metric=document.querySelector('.seg[data-units="metric"].active');
    panel.hidden=Boolean(metric);
    if(metric)return;
    const raw=value.textContent.trim(),measurement=parseMark(raw);
    if(measurement===null||!Number.isFinite(measurement)){instruction.textContent='Tape View cannot read this mark.';svg.replaceChildren();return;}
    const precision=Number(document.getElementById('precision')?.value)||16;
    // Use the exact rounded display value, aligned to the selected precision.
    const target=Math.round(measurement*precision)/precision;
    const whole=Math.floor(target),fraction=Math.round((target-whole)*precision)/precision;
    const x0=28,x1=612,unit=(x1-x0)/2,markX=x0+(1+fraction)*unit;
    svg.replaceChildren();
    node('rect',{x:12,y:27,width:616,height:116,rx:9,fill:'#f3d75a',stroke:'#a78a31','stroke-width':2});
    // One preceding inch, the current inch, and the following inch.
    for(let inch=-1;inch<=1;inch++){
      for(let tick=0;tick<precision;tick++){
        const u=inch+1+tick/precision;
        if(u<0||u>2)continue;
        const x=x0+u*unit;
        const isWhole=tick===0,major=tick%(precision/2)===0,quarter=tick%(precision/4)===0,eighth=tick%(precision/8)===0;
        const len=isWhole?69:major?53:quarter?39:eighth?28:18;
        node('line',{x1:x,y1:28,x2:x,y2:28+len,stroke:'#2d2d22','stroke-width':isWhole?2.7:1.6});
        if(isWhole && whole+inch>=0)node('text',{x:x+5,y:122,'font-size':21,'font-weight':800,fill:'#292b1b'},whole+inch);
      }
    }
    node('line',{x1:markX,y1:8,x2:markX,y2:139,stroke:'#d52131','stroke-width':4});
    node('path',{d:'M '+(markX-11)+' 4 L '+(markX+11)+' 4 L '+markX+' 24 Z',fill:'#d52131'});
    node('rect',{x:markX-65,y:145,width:130,height:19,rx:6,fill:'#fff8e5'});
    node('text',{x:markX,y:159,'text-anchor':'middle','font-size':14,'font-weight':850,fill:'#a61525'},'MARK '+raw);
    const readable='Tape measure showing '+raw+', with the exact graduation highlighted in red between '+whole+' and '+(whole+1)+' inches.';
    svg.setAttribute('aria-label',readable);
    instruction.textContent='Make your mark at '+raw+'. The red line identifies the exact tick.';
  }
  toggle.addEventListener('click',()=>{
    showing=!showing;body.hidden=!showing;toggle.textContent=showing?'Hide tape':'Show tape';toggle.setAttribute('aria-pressed',String(showing));
    if(showing)render();
  });
  new MutationObserver(()=>{if(showing)render();}).observe(value,{subtree:true,characterData:true,childList:true});
  document.getElementById('precision')?.addEventListener('change',render);
  document.querySelectorAll('.seg[data-units]').forEach(b=>b.addEventListener('click',()=>queueMicrotask(render)));
  render();
})();
