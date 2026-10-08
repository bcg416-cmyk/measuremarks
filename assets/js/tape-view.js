/* MeasureMarks shared Tape View: imperial Field Mode across all calculators.
   Uses the rounded field mark, never an independently calculated position. */
(() => {
  'use strict';
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
  const fieldLabel=document.getElementById('fieldLabel');
  // Keep calculator-owned X/Y values untouched; mirror the selected coordinate
  // in the main Field Mode readout so Next/Previous still use the source data.
  const bigReadout=document.createElement('div');
  bigReadout.className='field-value';
  bigReadout.hidden=true;
  const readoutReference=document.createElement('div');
  readoutReference.className='field-label';
  readoutReference.hidden=true;
  value.before(bigReadout);
  fieldLabel?.after(readoutReference);
  function updatePrimaryReadout(choices){
    const hasAxes=choices.length>1;
    const chosen=choices[Math.min(selectedAxis,choices.length-1)];
    bigReadout.hidden=!hasAxes;
    readoutReference.hidden=!hasAxes;
    value.hidden=hasAxes;
    if(fieldLabel)fieldLabel.hidden=hasAxes;
    if(!hasAxes)return;
    bigReadout.textContent=chosen.axis+' '+chosen.raw;
    readoutReference.textContent=chosen.title;
  }

  const axis=document.createElement('div');
  axis.style.cssText='display:none;gap:8px;margin:8px 0;flex-wrap:wrap';
  axis.setAttribute('role','group');axis.setAttribute('aria-label','Choose measurement to show on tape');
  const horizontal=document.createElement('button'),vertical=document.createElement('button');
  [horizontal,vertical].forEach(b=>{b.type='button';b.style.cssText='border:1px solid #52695c;border-radius:8px;padding:7px 12px;background:white;color:#18211a;font-weight:700';axis.appendChild(b);});
  body.insertBefore(axis,instruction);
  let selectedAxis=0;
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
    // Parse only a complete imperial mark: inches/fractions or feet plus inches.
    const text=s.trim().replace(/[″”]/g,'"').replace(/[′’]/g,"'");
    const match=text.match(/^(?:(\d+)\s*'\s*)?(?:(\d+)(?:\s+(\d+)\/(\d+))?|(\d+)\/(\d+))\s*"$/);
    if(!match)return null;
    const feet=Number(match[1]||0),inches=Number(match[2]||0);
    const numerator=Number(match[3]||match[5]||0),denominator=Number(match[4]||match[6]||1);
    if(denominator<=0)return null;
    return feet*12+inches+numerator/denominator;
  }
  function candidates(){
    const tool=document.body.dataset.tool||'';
    const sources=[value.textContent.trim(),fieldLabel?.textContent.trim()||''];
    const descriptions={
      pictures:['From left wall','Height above floor'],
      lights:['From left wall','From top wall'],
      hardware:['Horizontal distance','Vertical distance']
    };
    const names=descriptions[tool]||['Horizontal distance','Vertical distance'];
    return sources.map((source,i)=>{
      const match=source.match(/^(?:([XY])\s+)?(.+?)\s*(?:from\s+(left|right|top|bottom)\s+edge)?$/i);
      if(!match)return null;
      const raw=match[2].trim();
      const measurement=parseMark(raw);
      if(measurement===null)return null;
      let title=names[i]||'Measurement';
      if(tool==='hardware'){
        const edge=match[3]?.toLowerCase();
        if(edge)title='From '+edge+' edge';
      }
      if(tool==='pictures')title=i===0?'From left wall':'Height above floor';
      if(tool==='lights')title=i===0?'From left wall':'From top wall';
      return {raw,measurement,title,axis:match[1]|| (i===0?'X':'Y')};
    }).filter(Boolean);
  }
  function render(){
    const metric=document.querySelector('.seg[data-units="metric"].active');
    panel.hidden=Boolean(metric);
    if(metric)return;
    const choices=candidates();
    updatePrimaryReadout(choices);
    axis.style.display=choices.length>1?'flex':'none';
    horizontal.textContent=choices[0]?.title||'Horizontal / X';vertical.textContent=choices[1]?.title||'Vertical / Y';
    horizontal.setAttribute('aria-pressed',String(selectedAxis===0));vertical.setAttribute('aria-pressed',String(selectedAxis===1));
    horizontal.style.background=selectedAxis===0?'#176b43':'white';horizontal.style.color=selectedAxis===0?'white':'#18211a';
    vertical.style.background=selectedAxis===1?'#176b43':'white';vertical.style.color=selectedAxis===1?'white':'#18211a';
    const chosen=choices[Math.min(selectedAxis,choices.length-1)];
    const raw=chosen?.raw||'',measurement=chosen?.measurement??null;
    const reference=chosen?.title||'Measurement';
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
    const readable=reference+'. Tape measure showing '+raw+', with the exact graduation highlighted in red between '+whole+' and '+(whole+1)+' inches.';
    svg.setAttribute('aria-label',readable);
    instruction.textContent=reference+': '+raw+'. The red line identifies the exact tick.';
  }
  horizontal.addEventListener('click',()=>{selectedAxis=0;render();});
  vertical.addEventListener('click',()=>{selectedAxis=1;render();});
  toggle.addEventListener('click',()=>{
    showing=!showing;body.hidden=!showing;toggle.textContent=showing?'Hide tape':'Show tape';toggle.setAttribute('aria-pressed',String(showing));
    if(showing)render();
  });
  new MutationObserver(()=>{if(showing)render();}).observe(value,{subtree:true,characterData:true,childList:true});
  if(fieldLabel)new MutationObserver(()=>{if(showing)render();}).observe(fieldLabel,{subtree:true,characterData:true,childList:true});
  document.getElementById('precision')?.addEventListener('change',render);
  document.querySelectorAll('.seg[data-units]').forEach(b=>b.addEventListener('click',()=>queueMicrotask(render)));
  render();
})();
