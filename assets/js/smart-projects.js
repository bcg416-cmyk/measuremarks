
(() => {
'use strict';
const $=s=>document.querySelector(s);
const tool=document.body.dataset.tool;
const state={units:'imperial',data:null,fieldIndex:0};

function gcd(a,b){while(b){[a,b]=[b,a%b]}return a}
function frac(v,d=16){const s=v<0?'-':'';v=Math.abs(v);let w=Math.floor(v+1e-9),n=Math.round((v-w)*d);if(n===d){w++;n=0}if(!n)return s+w+'"';const g=gcd(n,d);return s+(w?w+' ':'')+(n/g)+'/'+(d/g)+'"'}
function fmt(v,long=false){const p=Number($('#precision')?.value||16);if(state.units==='metric')return(Math.round(v*10)/10).toLocaleString()+' mm';if(!long||Math.abs(v)<12)return frac(v,p);const s=v<0?'-':'';v=Math.abs(v);const ft=Math.floor(v/12),inch=v-ft*12;return s+ft+"' "+frac(inch,p)}
function roundMark(v){const p=Number($('#precision')?.value||16);return state.units==='metric'?Math.round(v*10)/10:Math.round(v*p)/p}
function unitWord(){return state.units==='metric'?'mm':'inches'}
function setLabel(id,text){const el=$('#'+id);const lab=el?.closest('label');if(lab&&lab.firstChild)lab.firstChild.nodeValue=text+' '}
function updateUnitLabels(){
  const u=unitWord();
  const spanNames={fence:'Fence opening',balusters:'Clear opening',batten:'Wall width',wainscot:'Wall width',slats:'Wall width',pictures:'Wall width',lights:'Room length'};
  if(spanNames[tool])setLabel('span',spanNames[tool]+' ('+u+')');
  const maps={
    fence:[['itemWidth','Picket width'],['maxGap','Maximum desired gap']],
    balusters:[['itemWidth','Baluster width'],['maxGap','Maximum clear gap']],
    batten:[['itemWidth','Batten width'],['desired','Target panel opening']],
    wainscot:[['itemWidth','Stile width'],['desired','Target panel opening']],
    slats:[['itemWidth','Slat width'],['desired','Target gap']],
    pictures:[['frameWidth','Frame width'],['frameHeight','Frame height'],['gap','Desired gap between frames'],['centerHeight','Frame center height above floor'],['hookOffset','Hook offset down from frame top']],
    hardware:[['partWidth','Part width'],['partHeight','Part height'],['holeSpacing','Pull hole spacing'],['edgeOffsetX','Horizontal edge offset'],['edgeOffsetY','Vertical edge offset']],
    lights:[['roomWidth','Room width'],['fixture','Fixture diameter'],['wallOffset','Fixed wall offset']]
  };
  (maps[tool]||[]).forEach(([id,t])=>setLabel(id,t+' ('+u+')'));
  document.querySelectorAll('.custom-frame-row').forEach(row=>{
    row.querySelectorAll('label').forEach(l=>{
      const kind=l.dataset.kind;
      if(kind==='width')l.firstChild.nodeValue='Width ('+u+') ';
      if(kind==='height')l.firstChild.nodeValue='Height ('+u+') ';
      if(kind==='hook')l.firstChild.nodeValue='Hook offset ('+u+') ';
    });
  });
}
function span(){if(state.units==='imperial'&&$('#spanMode')?.value==='feet')return(Number($('#spanFeet')?.value)||0)*12+(Number($('#spanInches')?.value)||0);return Number($('#span')?.value)||0}
function setSpan(v){if($('#span'))$('#span').value=v;if(state.units==='imperial'&&$('#spanFeet')&&$('#spanInches')){$('#spanFeet').value=Math.floor(v/12);$('#spanInches').value=(v%12).toFixed(3).replace(/\.000$/,'')}}
function syncSpanMode(){if(!$('#spanMode'))return;const feet=state.units==='imperial'&&$('#spanMode').value==='feet';$('#spanDecimalWrap')?.classList.toggle('hidden',feet);$('#spanFeetWrap')?.classList.toggle('hidden',!feet);$('#spanMode').disabled=state.units!=='imperial'}
function svgEl(tag,a={},text=''){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));if(text)n.textContent=text;return n}
function addDefs(svg){const defs=svgEl('defs');const m=svgEl('marker',{id:'dimArrow',viewBox:'0 0 10 10',refX:5,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});m.appendChild(svgEl('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#405047'}));defs.appendChild(m);svg.appendChild(defs)}
function baseSvg(svg,title){if(!svg)return;svg.innerHTML='';svg.appendChild(svgEl('rect',{x:0,y:0,width:980,height:410,rx:14,fill:'#fbfcfa'}));addDefs(svg);svg.appendChild(svgEl('text',{x:38,y:30,'font-size':18,'font-weight':850,fill:'#18211a'},title))}
function dimText(svg,x,y,label){const w=Math.max(54,label.length*6.2+12);svg.appendChild(svgEl('rect',{x:x-w/2,y:y-13,width:w,height:18,rx:4,fill:'#fbfcfa',opacity:.96}));svg.appendChild(svgEl('text',{x,y,'text-anchor':'middle','font-size':11,'font-weight':750,fill:'#26342b'},label))}
function dimH(svg,x1,x2,y,label,ey1,ey2){if(Math.abs(x2-x1)<5)return;svg.appendChild(svgEl('line',{x1,y1:ey1??y-15,x2:x1,y2:y+5,stroke:'#829087','stroke-width':1}));svg.appendChild(svgEl('line',{x1:x2,y1:ey2??y-15,x2:x2,y2:y+5,stroke:'#829087','stroke-width':1}));svg.appendChild(svgEl('line',{x1,y1:y,x2,y2:y,stroke:'#405047','stroke-width':1.2,'marker-start':'url(#dimArrow)','marker-end':'url(#dimArrow)'}));dimText(svg,(x1+x2)/2,y-5,label)}
function dimV(svg,y1,y2,x,label,ex1,ex2){if(Math.abs(y2-y1)<5)return;svg.appendChild(svgEl('line',{x1:ex1??x+15,y1,x2:x-5,y2:y1,stroke:'#829087','stroke-width':1}));svg.appendChild(svgEl('line',{x1:ex2??x+15,y1:y2,x2:x-5,y2:y2,stroke:'#829087','stroke-width':1}));svg.appendChild(svgEl('line',{x1:x,y1,x2:x,y2,stroke:'#405047','stroke-width':1.2,'marker-start':'url(#dimArrow)','marker-end':'url(#dimArrow)'}));const mid=(y1+y2)/2;const t=svgEl('text',{x:x-9,y:mid,'text-anchor':'middle','font-size':11,'font-weight':750,fill:'#26342b',transform:'rotate(-90 '+(x-9)+' '+mid+')'},label);svg.appendChild(t)}
function clearSmartResult(message){
  state.data=null;
  const note=$('#resultNote');if(note)note.textContent=message;
  ['#statA','#statB','#statC'].forEach(s=>{const el=$(s);if(el)el.textContent='—'});
  const marks=$('#marks');if(marks)marks.innerHTML='';
  const pm=$('#printMarks');if(pm)pm.innerHTML='';
  ['#diagram','#printDiagram'].forEach(s=>{const svg=$(s);if(svg)svg.innerHTML=''});
}
function setResults({title,note,a,b,c,marksTitle,marks,dimensions,layout}){$('#resultTitle').textContent=title;$('#resultNote').innerHTML=note;$('#statA').textContent=a;$('#statB').textContent=b;$('#statC').textContent=c;$('#marksTitle').textContent=marksTitle;$('#marks').innerHTML=marks.map(m=>'<div class="mark"><small>'+m.label+'</small><strong>'+m.main+'</strong>'+(m.sub?'<small>'+m.sub+'</small>':'')+'</div>').join('');$('#planDimensions').textContent=dimensions;$('#planLayout').textContent=layout;$('#printMarks').innerHTML=marks.map(m=>'<li>'+m.label+': <strong>'+m.main+'</strong>'+(m.sub?' · '+m.sub:'')+'</li>').join('')}
function renderField(){if(!state.data?.field?.length)return;const f=state.data.field[state.fieldIndex];$('#fieldCounter').textContent=f.counter||('MARK '+(state.fieldIndex+1)+' OF '+state.data.field.length);$('#fieldValue').textContent=f.value;$('#fieldLabel').textContent=f.label}
function stepField(d){if(!state.data?.field?.length)return;state.fieldIndex=(state.fieldIndex+d+state.data.field.length)%state.data.field.length;renderField()}
function commonEvents(calc,defaults){document.querySelectorAll('.seg').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.units=b.dataset.units;defaults();syncSpanMode();updateUnitLabels();calc()}));$('#spanMode')?.addEventListener('change',()=>{syncSpanMode();calc()});document.querySelectorAll('.controls input,.controls select').forEach(x=>{x.addEventListener('input',calc);x.addEventListener('change',calc)});$('#calculate')?.addEventListener('click',calc);document.querySelectorAll('.print-button').forEach(b=>b.addEventListener('click',()=>window.print()));$('#openField')?.addEventListener('click',()=>{if(state.data){$('#fieldOverlay').hidden=false;state.fieldIndex=0;renderField()}});$('#closeField')?.addEventListener('click',()=>$('#fieldOverlay').hidden=true);$('#prevMark')?.addEventListener('click',()=>stepField(-1));$('#nextMark')?.addEventListener('click',()=>stepField(1));$('#mobileField')?.addEventListener('click',()=>$('#openField')?.click());$('#mobilePrint')?.addEventListener('click',()=>window.print())}
/* Installation marks use inches, even past 12; overall imperial dimensions use feet and inches. */
function markFmt(v){return state.units==='metric'?fmt(roundMark(v)):frac(roundMark(v),Number($('#precision')?.value||16))}
function blueprintMarkSchedule(svg,title,marks){
 if(!svg||!marks.length)return;
 const columns=4,rowHeight=25,rows=Math.ceil(marks.length/columns),totalHeight=468+rows*rowHeight;
 svg.setAttribute('viewBox','0 0 980 '+totalHeight);
 svg.appendChild(svgEl('rect',{x:22,y:413,width:936,height:totalHeight-425,rx:10,fill:'#f5f8f5',stroke:'#d9e2dc'}));
 svg.appendChild(svgEl('text',{x:40,y:438,'font-size':15,'font-weight':800,fill:'#18211a'},title));
 marks.forEach((mark,i)=>{const x=42+(i%columns)*231,y=466+Math.floor(i/columns)*rowHeight;
  svg.appendChild(svgEl('text',{x,y,'font-size':12,'font-weight':700,fill:'#26342b'},mark));
 });
}

function drawLinear(type,d,svg){
  baseSvg(svg,d.title);const left=86,right=920,scale=(right-left)/d.span;
  if(type==='fence'){[145,255].forEach(y=>svg.appendChild(svgEl('rect',{x:left-8,y,width:right-left+16,height:14,rx:4,fill:'#af8b61'})))}
  else if(type==='balusters'){[130,270].forEach(y=>svg.appendChild(svgEl('rect',{x:left-8,y,width:right-left+16,height:19,rx:4,fill:'#8d673f'})))}
  else{svg.appendChild(svgEl('rect',{x:left,y:118,width:right-left,height:175,fill:type==='slats'?'#252c29':'#f4f1e9',stroke:'#cfc8ba'}));if(type==='wainscot'){svg.appendChild(svgEl('rect',{x:left,y:118,width:right-left,height:15,fill:'#c9baa1'}));svg.appendChild(svgEl('rect',{x:left,y:278,width:right-left,height:15,fill:'#c9baa1'}))}}
  d.centers.forEach((c,i)=>{const x=left+(c-d.width/2)*scale,w=Math.max(5,d.width*scale);const fill=type==='fence'?'#d8b17a':type==='balusters'?'#d6dade':type==='slats'?'#b98350':type==='wainscot'?'#ddd5c7':'#d8d1c1';const y=type==='fence'?112:type==='balusters'?148:133,h=type==='fence'?175:type==='balusters'?122:145;svg.appendChild(svgEl('rect',{x,y,width:w,height:h,rx:3,fill,stroke:type==='slats'?'none':'#9d9588'}));if(i<20)svg.appendChild(svgEl('text',{x:x+w/2,y:315,'text-anchor':'middle','font-size':10,fill:'#667067'},String(i+1)))});
  dimH(svg,left,right,375,'TOTAL '+fmt(d.span,true),300,300);
  if(d.centers.length>1){
    const c1=left+d.centers[0]*scale,c2=left+d.centers[1]*scale;
    dimH(svg,c1,c2,72,'C/C '+fmt(d.step,true),95,95);
    const edge1=c1+d.width*scale/2,edge2=c2-d.width*scale/2;
    if(d.gap>0)dimH(svg,edge1,edge2,101,(type==='batten'||type==='wainscot'?'PANEL ':'GAP ')+fmt(d.gap,true),120,120);
    const firstLeft=c1-d.width*scale/2;
    if(firstLeft-left>7)dimH(svg,left,firstLeft,340,'EDGE '+fmt(d.edgeGap,true),300,300);
  }
  if(d.width*scale>18){const c=left+d.centers[0]*scale;dimH(svg,c-d.width*scale/2,c+d.width*scale/2,325,'WIDTH '+fmt(d.width,true),290,290)}
  blueprintMarkSchedule(svg,(type==='fence'?'PICKET':type==='balusters'?'BALUSTER':type==='batten'?'BATTEN':type==='wainscot'?'STILE':'SLAT')+' CENTER MARKS FROM LEFT EDGE',d.centers.map((v,i)=>'#'+(i+1)+'  '+markFmt(v)));
}

// Fence pickets / balusters
if(tool==='fence'||tool==='balusters'){
 const item=tool==='fence'?'Picket':'Baluster';
 function defaults(){if(state.units==='imperial'){setSpan(tool==='fence'?96:36);$('#itemWidth').value=tool==='fence'?3.5:1.5;$('#maxGap').value=tool==='fence'?3:4;$('#spanMode').value='feet'}else{$('#span').value=tool==='fence'?2438:914;$('#itemWidth').value=tool==='fence'?89:38;$('#maxGap').value=tool==='fence'?76:102;$('#spanMode').value='inches'}updateUnitLabels()}
 function calc(){const s=span(),w=Number($('#itemWidth').value)||0,maxGap=Number($('#maxGap').value)||0,mode=$('#edgeMode').value;if(!(s>0)||!(w>0)||maxGap<0||s<=w){$('#resultNote').textContent='Check the dimensions and maximum gap.';return}let n=2,gap;while(n<500){gap=mode==='flush'?(s-n*w)/(n-1):(s-n*w)/(n+1);if(gap>=0&&gap<=maxGap+1e-8)break;n++}gap=mode==='flush'?(s-n*w)/(n-1):(s-n*w)/(n+1);const edgeGap=mode==='flush'?0:gap,first=mode==='flush'?w/2:gap+w/2,step=w+gap,centers=Array.from({length:n},(_,i)=>first+i*step);const list=centers.map((v,i)=>({label:item+' '+(i+1),main:fmt(roundMark(v),true)}));state.data={field:list.map((m,i)=>({counter:item.toUpperCase()+' '+(i+1)+' OF '+n,value:m.main,label:item.toUpperCase()+' CENTER'}))};setResults({title:item+' layout',note:'Use <strong>'+n+' '+item.toLowerCase()+'s</strong> to keep the finished clear gap at or below <strong>'+fmt(maxGap,true)+'</strong>.',a:n,b:fmt(gap,true),c:fmt(step,true),marksTitle:item+' center marks',marks:list,dimensions:fmt(s,true)+' opening · '+fmt(w,true)+' '+item.toLowerCase()+' width',layout:n+' '+item.toLowerCase()+'s · '+fmt(gap,true)+' actual gap'});const d={span:s,width:w,centers,step,gap,edgeGap,title:item+' layout'};drawLinear(tool,d,$('#diagram'));drawLinear(tool,d,$('#printDiagram'))}
 commonEvents(calc,defaults);defaults();syncSpanMode();updateUnitLabels();calc()
}

// Board & batten / wainscot / slats
if(['batten','wainscot','slats'].includes(tool)){
 const cfg={batten:{name:'Board & Batten',item:'Batten',desired:'panel opening',span:144,width:2.5,target:18,count:8},wainscot:{name:'Wainscoting',item:'Stile',desired:'panel opening',span:144,width:2.5,target:20,count:7},slats:{name:'Slatwall',item:'Slat',desired:'gap',span:120,width:1.5,target:1.5,count:12}}[tool];
 function syncMode(){const count=$('#calcMode').value==='count';$('#countWrap').classList.toggle('hidden',!count);$('#desiredWrap').classList.toggle('hidden',count)}
 function defaults(){if(state.units==='imperial'){setSpan(cfg.span);$('#itemWidth').value=cfg.width;$('#desired').value=cfg.target;$('#count').value=cfg.count;$('#spanMode').value='feet'}else{$('#span').value=Math.round(cfg.span*25.4);$('#itemWidth').value=Math.round(cfg.width*25.4);$('#desired').value=Math.round(cfg.target*25.4);$('#count').value=cfg.count;$('#spanMode').value='inches'}syncMode();updateUnitLabels()}
 function calc(){syncMode();const s=span(),w=Number($('#itemWidth').value)||0,useCount=$('#calcMode').value==='count',target=Number($('#desired').value)||0;let n=useCount?Math.max(2,Math.floor(Number($('#count').value)||2)):Math.max(2,Math.round((s+target)/(w+target)));const equalEdges=$('#edgeMode').value==='edge';let gaps=equalEdges?n+1:n-1,gap=(s-n*w)/gaps;while(gap<0&&n>2){n--;gaps=equalEdges?n+1:n-1;gap=(s-n*w)/gaps}const edgeGap=equalEdges?gap:0,first=equalEdges?gap+w/2:w/2,step=w+gap,centers=Array.from({length:n},(_,i)=>first+i*step);const list=centers.map((v,i)=>({label:cfg.item+' '+(i+1),main:fmt(roundMark(v),true)}));state.data={field:list.map((m,i)=>({counter:cfg.item.toUpperCase()+' '+(i+1)+' OF '+n,value:m.main,label:cfg.item.toUpperCase()+' CENTER'}))};setResults({title:cfg.name+' layout',note:'Use <strong>'+n+' '+cfg.item.toLowerCase()+'s</strong> with an actual '+cfg.desired+' of <strong>'+fmt(gap,true)+'</strong>.',a:n,b:fmt(gap,true),c:fmt(step,true),marksTitle:cfg.item+' center marks',marks:list,dimensions:fmt(s,true)+' wall · '+fmt(w,true)+' '+cfg.item.toLowerCase()+' width',layout:n+' '+cfg.item.toLowerCase()+'s · '+fmt(gap,true)+' '+cfg.desired});const d={span:s,width:w,centers,step,gap,edgeGap,title:cfg.name+' layout'};drawLinear(tool,d,$('#diagram'));drawLinear(tool,d,$('#printDiagram'))}
 commonEvents(calc,defaults);defaults();syncSpanMode();updateUnitLabels();calc()
}

// Picture hanging
if(tool==='pictures'){
 let customCache=[];
 function syncFrameMode(){
   const custom=$('#frameMode').value==='custom';
   $('#uniformFrameWrap').classList.toggle('hidden',custom);
   $('#customFramesWrap').classList.toggle('hidden',!custom);
   if(custom)renderCustomRows();
 }
 function renderCustomRows(){
   const n=Math.max(1,Math.min(12,Math.floor(Number($('#count').value)||1)));
   document.querySelectorAll('.custom-frame-row').forEach((row,i)=>{customCache[i]={w:Number(row.querySelector('[data-f="w"]')?.value),h:Number(row.querySelector('[data-f="h"]')?.value),hook:Number(row.querySelector('[data-f="hook"]')?.value)}});
   let html='';
   for(let i=0;i<n;i++){const old=customCache[i]||{},w=old.w||Number($('#frameWidth').value)||16,h=old.h||Number($('#frameHeight').value)||20,hook=old.hook||Number($('#hookOffset').value)||3;html+='<div class="custom-frame-row"><strong>Frame '+(i+1)+'</strong><div class="custom-frame-grid"><label data-kind="width">Width<input data-f="w" type="number" min="0" step=".0625" value="'+w+'"></label><label data-kind="height">Height<input data-f="h" type="number" min="0" step=".0625" value="'+h+'"></label><label data-kind="hook">Hook offset<input data-f="hook" type="number" min="0" step=".0625" value="'+hook+'"></label></div></div>'}
   $('#customFrames').innerHTML=html;updateUnitLabels();
   $('#customFrames').querySelectorAll('input').forEach(x=>{x.addEventListener('input',calc);x.addEventListener('change',calc)});
 }
 function defaults(){if(state.units==='imperial'){setSpan(120);$('#frameWidth').value=16;$('#frameHeight').value=20;$('#count').value=3;$('#gap').value=4;$('#centerHeight').value=57;$('#hookOffset').value=3;$('#spanMode').value='feet'}else{$('#span').value=3048;$('#frameWidth').value=406;$('#frameHeight').value=508;$('#count').value=3;$('#gap').value=102;$('#centerHeight').value=1448;$('#hookOffset').value=76;$('#spanMode').value='inches'}syncFrameMode();updateUnitLabels()}
 function frames(){
   const n=Math.max(1,Math.min(12,Math.floor(Number($('#count').value)||1)));
   if($('#frameMode').value!=='custom'){const w=Number($('#frameWidth').value)||0,h=Number($('#frameHeight').value)||0,hook=Number($('#hookOffset').value)||0;return Array.from({length:n},()=>({w,h,hook}))}
   const rows=[...document.querySelectorAll('.custom-frame-row')];return Array.from({length:n},(_,i)=>{const r=rows[i];return{w:Number(r?.querySelector('[data-f="w"]')?.value)||0,h:Number(r?.querySelector('[data-f="h"]')?.value)||0,hook:Number(r?.querySelector('[data-f="hook"]')?.value)||0}})
 }
 function draw(d,svg){
   baseSvg(svg,'Picture hanging blueprint');const left=100,right=920,bottom=320,wallH=Math.max(84,...d.frames.map(fr=>d.centerH+fr.h/2+12));const xS=(right-left)/d.wall,yS=245/wallH,top=bottom-wallH*yS;
   svg.appendChild(svgEl('rect',{x:left,y:top,width:right-left,height:bottom-top,fill:'#f5f1e8',stroke:'#d4cec1'}));
   d.frames.forEach((fr,i)=>{const cx=left+d.centers[i]*xS,fw=Math.max(20,fr.w*xS),fh=Math.max(20,fr.h*yS),cy=bottom-d.centerH*yS,x=cx-fw/2,y=cy-fh/2,hy=bottom-d.hookHeights[i]*yS;svg.appendChild(svgEl('rect',{x,y,width:fw,height:fh,fill:'#fff',stroke:'#5d5549','stroke-width':3}));svg.appendChild(svgEl('circle',{cx,cy:hy,r:4.5,fill:'#176b43'}));svg.appendChild(svgEl('text',{x:cx,y:y+14,'text-anchor':'middle','font-size':10,'font-weight':800,fill:'#4d554f'},'#'+(i+1)+' '+fmt(fr.w,true)+' × '+fmt(fr.h,true)));svg.appendChild(svgEl('text',{x:cx,y:hy-8,'text-anchor':'middle','font-size':9,fill:'#176b43'},'HOOK'))});
   dimH(svg,left,right,382,'WALL '+fmt(d.wall,true),bottom,bottom);
   if(d.frames.length>1){const r1=left+(d.centers[0]+d.frames[0].w/2)*xS,r2=left+(d.centers[1]-d.frames[1].w/2)*xS;dimH(svg,r1,r2,92,'GAP '+fmt(d.gap,true),top,top)}
   const firstLeft=left+(d.centers[0]-d.frames[0].w/2)*xS;if(firstLeft-left>5)dimH(svg,left,firstLeft,350,'MARGIN '+fmt(d.outside,true),bottom,bottom);
   dimV(svg,bottom,bottom-d.centerH*yS,70,'CENTER '+fmt(d.centerH,true),left,left);
   dimV(svg,bottom,bottom-d.hookHeights[0]*yS,42,'HOOK '+fmt(d.hookHeights[0],true),left,left);
    blueprintMarkSchedule(svg,'PICTURE HOOK MARKS (X FROM LEFT · Y FROM FLOOR)',d.centers.map((x,i)=>'#'+(i+1)+'  X '+markFmt(x)+' / Y '+markFmt(d.hookHeights[i])));
 }
 function calc(){
   if($('#frameMode')?.value==='custom'&&document.querySelectorAll('.custom-frame-row').length!==Math.max(1,Math.min(12,Math.floor(Number($('#count').value)||1))))renderCustomRows();
   const wall=span(),fr=frames(),gap=Number($('#gap').value)||0,centerH=Number($('#centerHeight').value)||0,total=fr.reduce((a,x)=>a+x.w,0)+gap*(fr.length-1);
   if(!(wall>0)||fr.some(x=>!(x.w>0)||!(x.h>0))||total>wall){$('#resultNote').textContent='Check the wall and frame dimensions. The arrangement must fit on the wall.';return}
   const outside=(wall-total)/2,centers=[];let cursor=outside;fr.forEach((x,i)=>{centers.push(cursor+x.w/2);cursor+=x.w+(i<fr.length-1?gap:0)});
   const hookHeights=fr.map(x=>centerH+x.h/2-x.hook),list=centers.map((v,i)=>({label:'Frame '+(i+1)+' hook',main:'X '+fmt(roundMark(v),true),sub:'Y '+fmt(roundMark(hookHeights[i]),true)}));
   state.data={field:list.map((m,i)=>({counter:'FRAME '+(i+1)+' OF '+fr.length,value:m.main,label:m.sub}))};
   setResults({title:'Picture hanging layout',note:'The group is centered on the wall with <strong>'+fmt(outside,true)+'</strong> outside margins. Each frame can have its own size and hook offset.',a:fmt(outside,true),b:fr.length===1?fmt(hookHeights[0],true):'Varies by frame',c:fmt(centerH,true),marksTitle:'Hook coordinates from left wall / floor',marks:list,dimensions:fmt(wall,true)+' wall · '+fr.length+' frame'+(fr.length===1?'':'s'),layout:fmt(gap,true)+' gap · '+fmt(centerH,true)+' common frame-center height'});
   const d={wall,frames:fr,gap,centerH,outside,centers,hookHeights};draw(d,$('#diagram'));draw(d,$('#printDiagram'))
 }
 $('#frameMode')?.addEventListener('change',()=>{syncFrameMode();calc()});$('#count')?.addEventListener('change',()=>{if($('#frameMode').value==='custom')renderCustomRows();calc()});
 commonEvents(calc,defaults);defaults();syncSpanMode();updateUnitLabels();calc()
}

// Cabinet hardware
if(tool==='hardware'){
 function defaults(){if(state.units==='imperial'){$('#partWidth').value=18;$('#partHeight').value=28;$('#holeSpacing').value=5;$('#edgeOffsetX').value=2.5;$('#edgeOffsetY').value=2.5}else{$('#partWidth').value=457;$('#partHeight').value=711;$('#holeSpacing').value=128;$('#edgeOffsetX').value=64;$('#edgeOffsetY').value=64}$('#style').value='pull';$('#placement').value='upper-right';$('#orientation').value='vertical';updateUnitLabels()}
 function draw(d,svg){
   baseSvg(svg,'Cabinet hardware drilling blueprint');
   const maxW=610,maxH=270,scale=Math.min(maxW/d.width,maxH/d.height);
   const w=Math.max(70,d.width*scale),h=Math.max(55,d.height*scale),left=500-w/2,top=190-h/2;
   svg.appendChild(svgEl('rect',{x:left,y:top,width:w,height:h,rx:5,fill:'#f4f0e8',stroke:'#a99d89','stroke-width':2}));
   svg.appendChild(svgEl('line',{x1:left+w/2,y1:top,x2:left+w/2,y2:top+h,stroke:'#c7cfc9','stroke-width':1,'stroke-dasharray':'5 5'}));
   svg.appendChild(svgEl('line',{x1:left,y1:top+h/2,x2:left+w,y2:top+h/2,stroke:'#c7cfc9','stroke-width':1,'stroke-dasharray':'5 5'}));
   const side=d.place.includes('right')?'right':'left', vertical=d.place.includes('lower')?'bottom':'top';
    d.holes.forEach((p,i)=>{
      const x=left+(p.x/d.width)*w,y=top+(p.y/d.height)*h;
      svg.appendChild(svgEl('circle',{cx:x,cy:y,r:7,fill:'#176b43'}));
      svg.appendChild(svgEl('text',{x:x+(side==='right'?-12:12),y:y-10,'text-anchor':side==='right'?'end':'start','font-size':11,'font-weight':800,fill:'#176b43'},'H'+(i+1)));
    });
    dimH(svg,left,left+w,382,'WIDTH '+fmt(d.width,true),top+h,top+h);
    dimV(svg,top,top+h,left-32,'HEIGHT '+fmt(d.height,true),left,left);
    if(d.holes.length===2){
      const a=d.holes[0],b=d.holes[1],x1=left+(a.x/d.width)*w,y1=top+(a.y/d.height)*h,x2=left+(b.x/d.width)*w,y2=top+(b.y/d.height)*h;
      if(Math.abs(x2-x1)>10)dimH(svg,x1,x2,Math.max(54,top-22),'HOLE SPACING '+fmt(d.holeSpace,true),y1,y2);
      else dimV(svg,y1,y2,Math.min(926,left+w+186),'HOLE SPACING '+fmt(d.holeSpace,true),x1,x2);
    }
    if(d.place!=='center'){
      const xEdge=side==='right'?left+w:left,xNear=side==='right'?Math.max(...d.holes.map(p=>p.x)):Math.min(...d.holes.map(p=>p.x));
      const xHole=left+xNear/d.width*w,xOffset=side==='right'?d.width-xNear:xNear;
      const yEdge=vertical==='bottom'?top+h:top,yNear=vertical==='bottom'?Math.max(...d.holes.map(p=>p.y)):Math.min(...d.holes.map(p=>p.y));
      const yHole=top+yNear/d.height*h,yOffset=vertical==='bottom'?d.height-yNear:yNear;
      if(Math.abs(xEdge-xHole)>5){
        const markY=top+h+24;
        dimH(svg,Math.min(xEdge,xHole),Math.max(xEdge,xHole),markY,fmt(xOffset,true),top+h,top+h);
        svg.appendChild(svgEl('text',{x:side==='right'?left+w+32:left-32,y:markY-5,'text-anchor':side==='right'?'start':'end','font-size':10,'font-weight':700,fill:'#405047'},side.toUpperCase()+' EDGE'));
      }
      // Independently locate every hole from the selected top/bottom edge.
      // Use separate dimension tracks so Hole 1, Hole 2 and their spacing remain legible.
      const sorted=d.holes.map((p,i)=>({y:top+p.y/d.height*h,value:vertical==='bottom'?d.height-p.y:p.y,index:i})).sort((a,b)=>a.value-b.value);
      sorted.forEach((hole,i)=>{
        if(Math.abs(hole.y-yEdge)<5)return;
        const dimensionX=Math.min(910,left+w+62+i*55);
        dimV(svg,Math.min(yEdge,hole.y),Math.max(yEdge,hole.y),dimensionX,'H'+(hole.index+1)+' '+fmt(hole.value,true),left+w,left+w);
      });
    }
    // Centered layouts must show each drill mark measured from an actual part edge.
     if(d.place==='center'){
       if(d.holes.length===2 && Math.abs(d.holes[0].x-d.holes[1].x)>1e-6){
         d.holes.forEach((p,i)=>{
           const hx=left+p.x/d.width*w,trackY=top+h+25+i*26;
           dimH(svg,left,hx,trackY,'H'+(i+1)+' '+fmt(p.x,true),top+h,top+h);
         });
         const hy=top+d.holes[0].y/d.height*h;
         if(hy-top>5)dimV(svg,top,hy,left-66,'TOP '+fmt(d.holes[0].y,true),left,left);
       }else{
         d.holes.forEach((p,i)=>{
           const hy=top+p.y/d.height*h;
           if(hy-top>5)dimV(svg,top,hy,Math.min(925,left+w+65+i*62),'H'+(i+1)+' '+fmt(p.y,true),left+w,left+w);
         });
         const hx=left+d.holes[0].x/d.width*w;
         if(hx-left>5)dimH(svg,left,hx,top+h+25,'LEFT '+fmt(d.holes[0].x,true),top+h,top+h);
       }
     }
     svg.appendChild(svgEl('text',{x:500,y:35,'text-anchor':'middle','font-size':10,'font-weight':700,fill:'#667067'},'DRAWING PROPORTIONAL TO '+fmt(d.width,true)+' × '+fmt(d.height,true)));
 }
 function showHardwareFitWarning(width,height,message){
   clearSmartResult(message);
   const svg=$('#diagram');
   if(!svg||!(width>0)||!(height>0))return;
   baseSvg(svg,'Cabinet hardware — layout does not fit');
   const scale=Math.min(500/width,230/height),w=Math.max(65,width*scale),h=Math.max(45,height*scale),left=490-w/2,top=186-h/2;
   svg.appendChild(svgEl('rect',{x:left,y:top,width:w,height:h,rx:5,fill:'#f4f0e8',stroke:'#ae7b67','stroke-width':2}));
   dimH(svg,left,left+w,366,'WIDTH '+fmt(width,true),top+h,top+h);
   dimV(svg,top,top+h,left-34,'HEIGHT '+fmt(height,true),left,left);
   svg.appendChild(svgEl('text',{x:490,y:47,'text-anchor':'middle','font-size':15,'font-weight':800,fill:'#a13d2f'},'NO VALID DRILL MARKS'));
   svg.appendChild(svgEl('text',{x:490,y:67,'text-anchor':'middle','font-size':11,fill:'#405047'},'Adjust placement, orientation, or spacing to fit this part.'));
 }
 function calc(){
   const width=Number($('#partWidth').value)||0,height=Number($('#partHeight').value)||0,style=$('#style').value,holeSpace=Number($('#holeSpacing').value)||0,place=$('#placement').value,orient=$('#orientation').value,offX=Number($('#edgeOffsetX').value)||0,offY=Number($('#edgeOffsetY').value)||0;
   if(!(width>0)||!(height>0)){clearSmartResult('Enter a part width and height greater than zero.');return}
   if(offX<0||offY<0||offX>width||offY>height){clearSmartResult('Edge offsets must stay within the cabinet part.');return}
   if(style==='pull'&&!(holeSpace>0)){clearSmartResult('Enter a pull hole spacing greater than zero.');return}
   // Offsets locate the nearest mounting hole; the other hole extends inward.
   const half=style==='pull'?holeSpace/2:0;
   let cx=width/2,cy=height/2;
   if(place.includes('right'))cx=width-offX-(style==='pull'&&orient==='horizontal'?half:0);
   if(place.includes('left'))cx=offX+(style==='pull'&&orient==='horizontal'?half:0);
   if(place.includes('upper'))cy=offY+(style==='pull'&&orient==='vertical'?half:0);
   if(place.includes('lower'))cy=height-offY-(style==='pull'&&orient==='vertical'?half:0);
   const holes=[];if(style==='knob')holes.push({x:cx,y:cy});else if(orient==='vertical')holes.push({x:cx,y:cy-half},{x:cx,y:cy+half});else holes.push({x:cx-half,y:cy},{x:cx+half,y:cy})
   const invalid=holes.some(p=>p.x<0||p.x>width||p.y<0||p.y>height);
   if(invalid){
     let message='That hardware position does not fit on this part.';
     if(style==='pull'&&orient==='vertical'&&(place.includes('upper')||place.includes('lower'))&&offY+holeSpace>height){
       message='A '+fmt(holeSpace,true)+' vertical pull with a '+fmt(offY,true)+' '+(place.includes('upper')?'top':'bottom')+' offset needs at least '+fmt(offY+holeSpace,true)+' of part height. Choose Horizontal or Centered, or reduce the offset / pull spacing.';
     }else if(style==='pull'&&orient==='horizontal'&&(place.includes('left')||place.includes('right'))&&offX+holeSpace>width){
       message='A '+fmt(holeSpace,true)+' horizontal pull with a '+fmt(offX,true)+' '+(place.includes('right')?'right':'left')+' offset needs at least '+fmt(offX+holeSpace,true)+' of part width. Choose Vertical or Centered, or reduce the offset / pull spacing.';
     }else{
       message+=' Try Centered placement, change the pull orientation, or reduce the offsets / hole spacing.';
     }
     showHardwareFitWarning(width,height,message);return
   }
   const side=place.includes('right')?'right':'left',vertical=place.includes('lower')?'bottom':'top';
    const list=holes.map((p,i)=>({label:style==='knob'?'Knob point':'Hole '+(i+1),main:fmt(roundMark(side==='right'?width-p.x:p.x),true)+' from '+side+' edge',sub:fmt(roundMark(vertical==='bottom'?height-p.y:p.y),true)+' from '+vertical+' edge'}));
    state.data={field:list.map((m,i)=>({counter:(style==='knob'?'POINT ':'HOLE ')+(i+1)+' OF '+list.length,value:m.main,label:m.sub}))};
    setResults({title:'Cabinet hardware layout',note:place==='center'?'Centered layout: measurements from left and top edges.':'Measure holes from the <strong>'+side+' edge</strong> and <strong>'+vertical+' edge</strong> of the part.',a:style==='knob'?'Single point':place,b:list[0]?.main+' / '+list[0]?.sub,c:list[1]?(list[1].main+' / '+list[1].sub):'N/A',marksTitle:'Installation marks',marks:list,dimensions:fmt(width,true)+' wide × '+fmt(height,true)+' high',layout:(style==='knob'?'Single knob':'Two-hole pull · '+fmt(holeSpace,true)+' spacing')+' · '+side+' / '+vertical+' edge reference'});
    draw({width,height,holes,holeSpace,place},$('#diagram'));draw({width,height,holes,holeSpace,place},$('#printDiagram'))
 }
 commonEvents(calc,defaults);defaults();updateUnitLabels();calc()
}

// Recessed lights
if(tool==='lights'){
 function syncOffset(){$('#fixedOffsetWrap').classList.toggle('hidden',$('#edgeMode').value!=='fixed')}
 function defaults(){if(state.units==='imperial'){setSpan(192);$('#roomWidth').value=144;$('#rows').value=2;$('#cols').value=4;$('#fixture').value=6;$('#wallOffset').value=24;$('#spanMode').value='feet'}else{$('#span').value=4877;$('#roomWidth').value=3658;$('#rows').value=2;$('#cols').value=4;$('#fixture').value=152;$('#wallOffset').value=610;$('#spanMode').value='inches'}syncOffset();updateUnitLabels()}
 function draw(d,svg){
   baseSvg(svg,'Recessed lighting ceiling blueprint');const left=150,right=900,top=75,bottom=330,xS=(right-left)/d.length,yS=(bottom-top)/d.width;
   svg.appendChild(svgEl('rect',{x:left,y:top,width:right-left,height:bottom-top,rx:4,fill:'#eef0ef',stroke:'#aeb8b1','stroke-width':2}));
   const fixtureR=Math.max(3,Math.min(26,(d.fixture/2)*Math.min(xS,yS)));
   d.points.forEach((p,i)=>{const x=left+p.x*xS,y=top+p.y*yS;svg.appendChild(svgEl('circle',{cx:x,cy:y,r:fixtureR,fill:'#fff9d8',stroke:'#8e8b7e','stroke-width':2}));svg.appendChild(svgEl('circle',{cx:x,cy:y,r:Math.max(2,fixtureR*.32),fill:'#e2c95a'}));svg.appendChild(svgEl('text',{x,y:y-fixtureR-5,'text-anchor':'middle','font-size':9,'font-weight':850,fill:'#18211a'},'#'+(i+1)));svg.appendChild(svgEl('text',{x,y:y+fixtureR+12,'text-anchor':'middle','font-size':8.5,fill:'#405047'},'X '+fmt(p.x,true)));svg.appendChild(svgEl('text',{x,y:y+fixtureR+23,'text-anchor':'middle','font-size':8.5,fill:'#405047'},'Y '+fmt(p.y,true)))});
   dimH(svg,left,right,385,'ROOM LENGTH '+fmt(d.length,true),bottom,bottom);dimV(svg,top,bottom,112,'ROOM WIDTH '+fmt(d.width,true),left,left);
   if(d.cols>1){const p1=d.points[0],p2=d.points[1];dimH(svg,left+p1.x*xS,left+p2.x*xS,55,'COLUMN '+fmt(d.xStep,true),top,top)}
   if(d.rows>1){const p1=d.points[0],p2=d.points[d.cols];dimV(svg,top+p1.y*yS,top+p2.y*yS,935,'ROW '+fmt(d.yStep,true),left,left)}
   if(d.points.length){const p=d.points[0];dimH(svg,left,left+p.x*xS,347,'WALL '+fmt(p.x,true),bottom,bottom);dimV(svg,top,top+p.y*yS,132,'WALL '+fmt(p.y,true),left,left)}
   svg.appendChild(svgEl('text',{x:500,y:35,'text-anchor':'middle','font-size':10,'font-weight':700,fill:'#667067'},'FIXTURE DIAMETER '+fmt(d.fixture,true)+' · DRAWN TO ROOM SCALE'));
    blueprintMarkSchedule(svg,'LIGHT CENTER MARKS (X FROM LEFT · Y FROM TOP)',d.points.map((p,i)=>'#'+(i+1)+'  X '+markFmt(p.x)+' / Y '+markFmt(p.y)));
 }
 function calc(){
   syncOffset();const length=span(),width=Number($('#roomWidth').value)||0,fixture=Number($('#fixture').value)||0,rows=Math.max(1,Math.floor(Number($('#rows').value)||1)),cols=Math.max(1,Math.floor(Number($('#cols').value)||1)),mode=$('#edgeMode').value,fixed=Number($('#wallOffset').value)||0;
   if(!(length>0)||!(width>0)||!(fixture>0)){clearSmartResult('Enter valid room dimensions and a fixture diameter greater than zero.');return}
   if(fixture>Math.min(length,width)){clearSmartResult('Fixture diameter cannot exceed the room dimensions.');return}
   let xMargin,yMargin,xStep,yStep;
   if(mode==='balanced'){xMargin=length/(cols+1);xStep=xMargin;yMargin=width/(rows+1);yStep=yMargin}else{xMargin=fixed;yMargin=fixed;xStep=cols>1?(length-2*xMargin)/(cols-1):0;yStep=rows>1?(width-2*yMargin)/(rows-1):0}
   if(xStep<0||yStep<0){clearSmartResult('The fixed wall offset is too large for the selected grid.');return}
   const points=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)points.push({x:cols===1?length/2:xMargin+c*xStep,y:rows===1?width/2:yMargin+r*yStep});
   const list=points.map((p,i)=>({label:'Light '+(i+1),main:'X '+fmt(roundMark(p.x),true),sub:'Y '+fmt(roundMark(p.y),true)}));
   state.data={field:list.map((m,i)=>({counter:'LIGHT '+(i+1)+' OF '+list.length,value:m.main,label:m.sub}))};
   setResults({title:'Recessed light layout',note:'This creates a <strong>'+rows+' × '+cols+'</strong> grid with <strong>'+fmt(fixture,true)+'</strong> fixtures and exact X/Y center coordinates.',a:points.length,b:fmt(rows===1?0:yStep,true),c:fmt(cols===1?0:xStep,true),marksTitle:'Light center coordinates',marks:list,dimensions:fmt(length,true)+' × '+fmt(width,true)+' room · '+fmt(fixture,true)+' fixture diameter',layout:rows+' rows · '+cols+' per row · '+points.length+' lights'});
   const d={length,width,fixture,rows,cols,points,xStep,yStep};draw(d,$('#diagram'));draw(d,$('#printDiagram'))
 }
 commonEvents(calc,defaults);defaults();syncSpanMode();updateUnitLabels();calc()
}

})();