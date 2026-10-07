
(() => {
'use strict';
const $ = s => document.querySelector(s);
const tool = document.body.dataset.tool;
const state = {units:'imperial', data:null, fieldIndex:0};

function gcd(a,b){while(b){[a,b]=[b,a%b]}return a}
function frac(v,d=16){
  const s=v<0?'-':''; v=Math.abs(v); let w=Math.floor(v+1e-9), n=Math.round((v-w)*d);
  if(n===d){w++;n=0} if(!n)return s+w+'"'; const g=gcd(n,d);
  return s+(w?w+' ':'')+(n/g)+'/'+(d/g)+'"';
}
function fmt(v,long=false){
  const p=Number($('#precision')?.value||16);
  if(state.units==='metric') return (Math.round(v*10)/10).toLocaleString()+' mm';
  if(!long || Math.abs(v)<12) return frac(v,p);
  const s=v<0?'-':''; v=Math.abs(v); const ft=Math.floor(v/12), inch=v-ft*12;
  return s+ft+"' "+frac(inch,p);
}
function roundMark(v){
  const p=Number($('#precision')?.value||16);
  return state.units==='metric'?Math.round(v*10)/10:Math.round(v*p)/p;
}
function span(){
  if(state.units==='imperial' && $('#spanMode')?.value==='feet')
    return (Number($('#spanFeet')?.value)||0)*12+(Number($('#spanInches')?.value)||0);
  return Number($('#span')?.value)||0;
}
function setSpan(v){
  if($('#span')) $('#span').value=v;
  if(state.units==='imperial' && $('#spanFeet') && $('#spanInches')){
    $('#spanFeet').value=Math.floor(v/12);
    $('#spanInches').value=(v%12).toFixed(3).replace(/\.000$/,'');
  }
}
function syncSpanMode(){
  if(!$('#spanMode')) return;
  const feet=state.units==='imperial' && $('#spanMode').value==='feet';
  $('#spanDecimalWrap')?.classList.toggle('hidden',feet);
  $('#spanFeetWrap')?.classList.toggle('hidden',!feet);
  $('#spanMode').disabled=state.units!=='imperial';
}
function svgEl(tag,a={},text=''){
  const n=document.createElementNS('http://www.w3.org/2000/svg',tag);
  Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v)); if(text)n.textContent=text; return n;
}
function baseSvg(svg,title){
  svg.innerHTML=''; svg.appendChild(svgEl('rect',{x:0,y:0,width:980,height:410,rx:14,fill:'#fbfcfa'}));
  svg.appendChild(svgEl('text',{x:58,y:34,'font-size':18,'font-weight':850,fill:'#18211a'},title));
}
function finishLine(svg,label){
  svg.appendChild(svgEl('line',{x1:70,y1:377,x2:910,y2:377,stroke:'#344039','stroke-width':1.4}));
  svg.appendChild(svgEl('text',{x:490,y:367,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'#18211a'},label));
}
function setResults({title,note,a,b,c,marksTitle,marks,dimensions,layout}){
  $('#resultTitle').textContent=title;
  $('#resultNote').innerHTML=note;
  $('#statA').textContent=a; $('#statB').textContent=b; $('#statC').textContent=c;
  $('#marksTitle').textContent=marksTitle;
  $('#marks').innerHTML=marks.map((m,i)=>'<div class="mark"><small>'+m.label+'</small><strong>'+m.main+'</strong>'+(m.sub?'<small>'+m.sub+'</small>':'')+'</div>').join('');
  $('#planDimensions').textContent=dimensions;
  $('#planLayout').textContent=layout;
  $('#printMarks').innerHTML=marks.map(m=>'<li>'+m.label+': <strong>'+m.main+'</strong>'+(m.sub?' · '+m.sub:'')+'</li>').join('');
}
function renderField(){
  if(!state.data || !state.data.field?.length) return;
  const f=state.data.field[state.fieldIndex];
  $('#fieldCounter').textContent=f.counter || ('MARK '+(state.fieldIndex+1)+' OF '+state.data.field.length);
  $('#fieldValue').textContent=f.value;
  $('#fieldLabel').textContent=f.label;
}
function stepField(d){
  if(!state.data?.field?.length)return;
  state.fieldIndex=(state.fieldIndex+d+state.data.field.length)%state.data.field.length; renderField();
}
function commonEvents(calc,defaults){
  document.querySelectorAll('.seg').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.seg').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    state.units=b.dataset.units; defaults(); syncSpanMode(); calc();
  }));
  $('#spanMode')?.addEventListener('change',()=>{syncSpanMode();calc()});
  document.querySelectorAll('.controls input,.controls select').forEach(x=>{
    x.addEventListener('input',calc); x.addEventListener('change',calc);
  });
  $('#calculate')?.addEventListener('click',calc);
  document.querySelectorAll('.print-button').forEach(b=>b.addEventListener('click',()=>window.print()));
  $('#openField')?.addEventListener('click',()=>{if(state.data){$('#fieldOverlay').hidden=false;state.fieldIndex=0;renderField()}});
  $('#closeField')?.addEventListener('click',()=>$('#fieldOverlay').hidden=true);
  $('#prevMark')?.addEventListener('click',()=>stepField(-1)); $('#nextMark')?.addEventListener('click',()=>stepField(1));
  $('#mobileField')?.addEventListener('click',()=>$('#openField')?.click()); $('#mobilePrint')?.addEventListener('click',()=>window.print());
}
function drawLinear(type,d,svg){
  baseSvg(svg,d.title); const left=70,right=910,scale=(right-left)/d.span;
  if(type==='fence'){
    [140,265].forEach(y=>svg.appendChild(svgEl('rect',{x:left-10,y,width:right-left+20,height:16,rx:4,fill:'#af8b61'})));
  } else if(type==='balusters'){
    [122,275].forEach(y=>svg.appendChild(svgEl('rect',{x:left-12,y,width:right-left+24,height:22,rx:4,fill:'#8d673f'})));
  } else {
    svg.appendChild(svgEl('rect',{x:left,y:116,width:right-left,height:190,fill:type==='slats'?'#252c29':'#f4f1e9',stroke:'#cfc8ba'}));
    if(type==='wainscot'){
      svg.appendChild(svgEl('rect',{x:left,y:116,width:right-left,height:16,fill:'#c9baa1'}));
      svg.appendChild(svgEl('rect',{x:left,y:290,width:right-left,height:16,fill:'#c9baa1'}));
    }
  }
  d.centers.forEach((c,i)=>{
    const x=left+(c-d.width/2)*scale,w=Math.max(5,d.width*scale);
    const fill=type==='fence'?'#d8b17a':type==='balusters'?'#d6dade':type==='slats'?'#b98350':type==='wainscot'?'#ddd5c7':'#d8d1c1';
    const y=type==='fence'?112:type==='balusters'?144:132, h=type==='fence'?190:type==='balusters'?131:158;
    svg.appendChild(svgEl('rect',{x,y,width:w,height:h,rx:3,fill,stroke:type==='slats'?'none':'#9d9588'}));
    svg.appendChild(svgEl('line',{x1:x+w/2,y1:310,x2:x+w/2,y2:329,stroke:'#176b43','stroke-width':1.4}));
    if(i<24) svg.appendChild(svgEl('text',{x:x+w/2,y:347,'text-anchor':'middle','font-size':10,fill:'#667067'},String(i+1)));
  });
  finishLine(svg,'Total span: '+fmt(d.span,true));
}

// Fence pickets / balusters
if(tool==='fence' || tool==='balusters'){
  const item=tool==='fence'?'Picket':'Baluster';
  const type=tool;
  function defaults(){
    if(state.units==='imperial'){setSpan(tool==='fence'?96:36); $('#itemWidth').value=tool==='fence'?3.5:1.5; $('#maxGap').value=tool==='fence'?3:4; $('#spanMode').value='feet';}
    else{$('#span').value=tool==='fence'?2438:914; $('#itemWidth').value=tool==='fence'?89:38; $('#maxGap').value=tool==='fence'?76:102; $('#spanMode').value='inches';}
  }
  function calc(){
    const s=span(),w=Number($('#itemWidth').value)||0,maxGap=Number($('#maxGap').value)||0,mode=$('#edgeMode').value;
    if(!(s>0)||!(w>0)||maxGap<0||s<=w){$('#resultNote').textContent='Check the dimensions and maximum gap.';return}
    let n=2,gap;
    while(n<500){gap=mode==='flush'?(s-n*w)/(n-1):(s-n*w)/(n+1);if(gap>=0&&gap<=maxGap+1e-8)break;n++}
    gap=mode==='flush'?(s-n*w)/(n-1):(s-n*w)/(n+1);
    const first=mode==='flush'?w/2:gap+w/2,step=w+gap,centers=Array.from({length:n},(_,i)=>first+i*step);
    const list=centers.map((v,i)=>({label:item+' '+(i+1),main:fmt(roundMark(v),true)}));
    state.data={field:list.map((m,i)=>({counter:item.toUpperCase()+' '+(i+1)+' OF '+n,value:m.main,label:item.toUpperCase()+' CENTER'}))};
    setResults({title:item+' layout',note:'Use <strong>'+n+' '+item.toLowerCase()+'s</strong> to keep the finished clear gap at or below <strong>'+fmt(maxGap,true)+'</strong>.',a:n,b:fmt(gap,true),c:fmt(step,true),marksTitle:item+' center marks',marks:list,dimensions:fmt(s,true)+' opening · '+fmt(w,true)+' '+item.toLowerCase()+' width',layout:n+' '+item.toLowerCase()+'s · '+fmt(gap,true)+' actual gap'});
    const d={span:s,width:w,centers,title:item+' layout'}; drawLinear(type,d,$('#diagram')); drawLinear(type,d,$('#printDiagram'));
  }
  commonEvents(calc,defaults); defaults(); syncSpanMode(); calc();
}

// Board & batten / wainscot / slats
if(['batten','wainscot','slats'].includes(tool)){
  const cfg={
    batten:{name:'Board & Batten',item:'Batten',desired:'panel opening',span:144,width:2.5,target:18,count:8},
    wainscot:{name:'Wainscoting',item:'Stile',desired:'panel opening',span:144,width:2.5,target:20,count:7},
    slats:{name:'Wall Slats',item:'Slat',desired:'gap',span:120,width:1.5,target:1.5,count:12}
  }[tool];
  function syncMode(){const count=$('#calcMode').value==='count';$('#countWrap').classList.toggle('hidden',!count);$('#desiredWrap').classList.toggle('hidden',count)}
  function defaults(){
    if(state.units==='imperial'){setSpan(cfg.span);$('#itemWidth').value=cfg.width;$('#desired').value=cfg.target;$('#count').value=cfg.count;$('#spanMode').value='feet';}
    else{$('#span').value=Math.round(cfg.span*25.4);$('#itemWidth').value=Math.round(cfg.width*25.4);$('#desired').value=Math.round(cfg.target*25.4);$('#count').value=cfg.count;$('#spanMode').value='inches';}
    syncMode();
  }
  function calc(){
    syncMode(); const s=span(),w=Number($('#itemWidth').value)||0,useCount=$('#calcMode').value==='count',target=Number($('#desired').value)||0;
    let n=useCount?Math.max(2,Math.floor(Number($('#count').value)||2)):Math.max(2,Math.round((s+target)/(w+target)));
    const equalEdges=$('#edgeMode').value==='edge'; let gaps=equalEdges?n+1:n-1, gap=(s-n*w)/gaps;
    while(gap<0&&n>2){n--;gaps=equalEdges?n+1:n-1;gap=(s-n*w)/gaps}
    const first=equalEdges?gap+w/2:w/2,step=w+gap,centers=Array.from({length:n},(_,i)=>first+i*step);
    const list=centers.map((v,i)=>({label:cfg.item+' '+(i+1),main:fmt(roundMark(v),true)}));
    state.data={field:list.map((m,i)=>({counter:cfg.item.toUpperCase()+' '+(i+1)+' OF '+n,value:m.main,label:cfg.item.toUpperCase()+' CENTER'}))};
    setResults({title:cfg.name+' layout',note:'Use <strong>'+n+' '+cfg.item.toLowerCase()+'s</strong> with an actual '+cfg.desired+' of <strong>'+fmt(gap,true)+'</strong>.',a:n,b:fmt(gap,true),c:fmt(step,true),marksTitle:cfg.item+' center marks',marks:list,dimensions:fmt(s,true)+' wall · '+fmt(w,true)+' '+cfg.item.toLowerCase()+' width',layout:n+' '+cfg.item.toLowerCase()+'s · '+fmt(gap,true)+' '+cfg.desired});
    const d={span:s,width:w,centers,title:cfg.name+' layout'}; drawLinear(tool,d,$('#diagram')); drawLinear(tool,d,$('#printDiagram'));
  }
  commonEvents(calc,defaults); defaults(); syncSpanMode(); calc();
}

// Picture hanging
if(tool==='pictures'){
  function defaults(){
    if(state.units==='imperial'){setSpan(120);$('#frameWidth').value=16;$('#frameHeight').value=20;$('#count').value=3;$('#gap').value=4;$('#centerHeight').value=57;$('#hookOffset').value=3;$('#spanMode').value='feet';}
    else{$('#span').value=3048;$('#frameWidth').value=406;$('#frameHeight').value=508;$('#count').value=3;$('#gap').value=102;$('#centerHeight').value=1448;$('#hookOffset').value=76;$('#spanMode').value='inches';}
  }
  function draw(d,svg){
    baseSvg(svg,'Picture hanging layout');const left=70,right=910,scale=(right-left)/d.wall;
    svg.appendChild(svgEl('rect',{x:left,y:105,width:right-left,height:200,fill:'#f2efe8',stroke:'#d4cec1'}));
    d.centers.forEach((c,i)=>{const fw=Math.max(34,d.w*scale),x=left+c*scale-fw/2,h=100;
      svg.appendChild(svgEl('rect',{x,y:160,width:fw,height:h,fill:'#fff',stroke:'#5d5549','stroke-width':4}));
      svg.appendChild(svgEl('circle',{cx:left+c*scale,cy:145,r:5,fill:'#176b43'}));
      svg.appendChild(svgEl('text',{x:left+c*scale,y:337,'text-anchor':'middle','font-size':10,fill:'#667067'},String(i+1)));
    }); finishLine(svg,'Wall width: '+fmt(d.wall,true));
  }
  function calc(){
    const wall=span(),w=Number($('#frameWidth').value)||0,h=Number($('#frameHeight').value)||0,n=Math.max(1,Math.floor(Number($('#count').value)||1)),gap=Number($('#gap').value)||0,centerH=Number($('#centerHeight').value)||0,hookOff=Number($('#hookOffset').value)||0;
    const total=n*w+(n-1)*gap;if(!(wall>0)||!(w>0)||!(h>0)||total>wall){$('#resultNote').textContent='The selected frames and gaps do not fit on the wall.';return}
    const outside=(wall-total)/2,centers=Array.from({length:n},(_,i)=>outside+w/2+i*(w+gap)),hookH=centerH+h/2-hookOff;
    const list=centers.map((v,i)=>({label:'Hook '+(i+1),main:fmt(roundMark(v),true),sub:'Height '+fmt(hookH,true)}));
    state.data={field:list.map((m,i)=>({counter:'HOOK '+(i+1)+' OF '+n,value:m.main,label:'HOOK X · '+m.sub.toUpperCase()}))};
    setResults({title:'Picture hanging layout',note:'Frame centers are <strong>'+fmt(centerH,true)+'</strong> above the floor; hook height is <strong>'+fmt(hookH,true)+'</strong>.',a:fmt(outside,true),b:fmt(hookH,true),c:fmt(centerH,true),marksTitle:'Hook marks from left wall edge',marks:list,dimensions:fmt(wall,true)+' wall · '+n+' frames · '+fmt(w,true)+' × '+fmt(h,true),layout:fmt(gap,true)+' between frames · '+fmt(hookH,true)+' hook height'});
    const d={wall,w,h,centers};draw(d,$('#diagram'));draw(d,$('#printDiagram'));
  }
  commonEvents(calc,defaults);defaults();syncSpanMode();calc();
}

// Cabinet hardware
if(tool==='hardware'){
  function defaults(){
    if(state.units==='imperial'){$('#partWidth').value=18;$('#partHeight').value=28;$('#holeSpacing').value=5;$('#edgeOffset').value=2.5;}
    else{$('#partWidth').value=457;$('#partHeight').value=711;$('#holeSpacing').value=128;$('#edgeOffset').value=64;}
    $('#style').value='pull';$('#placement').value='upper-right';$('#orientation').value='vertical';
  }
  function draw(d,svg){
    baseSvg(svg,'Cabinet hardware layout');const x=290,y=60,w=400,h=290;
    svg.appendChild(svgEl('rect',{x,y,width:w,height:h,rx:6,fill:'#f4f0e8',stroke:'#a99d89','stroke-width':2}));
    d.holes.forEach((p,i)=>{const cx=x+p.x/d.width*w,cy=y+p.y/d.height*h;svg.appendChild(svgEl('circle',{cx,cy,r:8,fill:'#176b43'}));svg.appendChild(svgEl('text',{x:cx,y:cy-14,'text-anchor':'middle','font-size':11,fill:'#667067'},String(i+1)))});
  }
  function calc(){
    const width=Number($('#partWidth').value)||0,height=Number($('#partHeight').value)||0,style=$('#style').value,holeSpace=Number($('#holeSpacing').value)||0,place=$('#placement').value,orient=$('#orientation').value,off=Number($('#edgeOffset').value)||0;
    if(!(width>0)||!(height>0)){return}
    let cx=width/2,cy=height/2;
    if(place.includes('right'))cx=width-off;if(place.includes('left'))cx=off;if(place.includes('upper'))cy=off;if(place.includes('lower'))cy=height-off;
    const holes=[];if(style==='knob')holes.push({x:cx,y:cy});else{const h=holeSpace/2;if(orient==='vertical')holes.push({x:cx,y:cy-h},{x:cx,y:cy+h});else holes.push({x:cx-h,y:cy},{x:cx+h,y:cy})}
    const list=holes.map((p,i)=>({label:style==='knob'?'Knob point':'Hole '+(i+1),main:'X '+fmt(roundMark(p.x),true),sub:'Y '+fmt(roundMark(p.y),true)}));
    state.data={field:list.map((m,i)=>({counter:(style==='knob'?'POINT ':'HOLE ')+(i+1)+' OF '+list.length,value:m.main,label:m.sub}))};
    setResults({title:'Cabinet hardware layout',note:'Coordinates are measured from the <strong>left edge</strong> and <strong>top edge</strong>.',a:style==='knob'?'Single point':place,b:list[0]?.main+' / '+list[0]?.sub,c:list[1]?(list[1].main+' / '+list[1].sub):'N/A',marksTitle:'Drill coordinates',marks:list,dimensions:fmt(width,true)+' wide × '+fmt(height,true)+' high',layout:style==='knob'?'Single knob':'Two-hole pull · '+fmt(holeSpace,true)+' spacing'});
    draw({width,height,holes},$('#diagram'));draw({width,height,holes},$('#printDiagram'));
  }
  commonEvents(calc,defaults);defaults();calc();
}

// Recessed lights
if(tool==='lights'){
  function syncOffset(){$('#fixedOffsetWrap').classList.toggle('hidden',$('#edgeMode').value!=='fixed')}
  function defaults(){
    if(state.units==='imperial'){setSpan(192);$('#roomWidth').value=144;$('#rows').value=2;$('#cols').value=4;$('#fixture').value=6;$('#wallOffset').value=24;$('#spanMode').value='feet';}
    else{$('#span').value=4877;$('#roomWidth').value=3658;$('#rows').value=2;$('#cols').value=4;$('#fixture').value=152;$('#wallOffset').value=610;$('#spanMode').value='inches';}
    syncOffset();
  }
  function draw(d,svg){
    baseSvg(svg,'Recessed light ceiling plan');const left=110,right=870,top=70,bottom=340,xS=(right-left)/d.length,yS=(bottom-top)/d.width;
    svg.appendChild(svgEl('rect',{x:left,y:top,width:right-left,height:bottom-top,rx:6,fill:'#eef0ef',stroke:'#c8cdca','stroke-width':2}));
    d.points.forEach((p,i)=>{const x=left+p.x*xS,y=top+p.y*yS;svg.appendChild(svgEl('circle',{cx:x,cy:y,r:12,fill:'#fff9d8',stroke:'#9a9787','stroke-width':2}));svg.appendChild(svgEl('circle',{cx:x,cy:y,r:4,fill:'#f3dd79'}));svg.appendChild(svgEl('text',{x,y:y-16,'text-anchor':'middle','font-size':10,fill:'#667067'},String(i+1)))});
  }
  function calc(){
    syncOffset();const length=span(),width=Number($('#roomWidth').value)||0,rows=Math.max(1,Math.floor(Number($('#rows').value)||1)),cols=Math.max(1,Math.floor(Number($('#cols').value)||1)),mode=$('#edgeMode').value,fixed=Number($('#wallOffset').value)||0;
    if(!(length>0)||!(width>0))return;
    let xMargin,yMargin,xStep,yStep;
    if(mode==='balanced'){xMargin=length/(cols+1);xStep=xMargin;yMargin=width/(rows+1);yStep=yMargin}else{xMargin=fixed;yMargin=fixed;xStep=cols>1?(length-2*xMargin)/(cols-1):0;yStep=rows>1?(width-2*yMargin)/(rows-1):0}
    if(xStep<0||yStep<0){$('#resultNote').textContent='The fixed wall offset is too large for the selected grid.';return}
    const points=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)points.push({x:cols===1?length/2:xMargin+c*xStep,y:rows===1?width/2:yMargin+r*yStep});
    const list=points.map((p,i)=>({label:'Light '+(i+1),main:'X '+fmt(roundMark(p.x),true),sub:'Y '+fmt(roundMark(p.y),true)}));
    state.data={field:list.map((m,i)=>({counter:'LIGHT '+(i+1)+' OF '+list.length,value:m.main,label:m.sub}))};
    setResults({title:'Recessed light layout',note:'This creates a <strong>'+rows+' × '+cols+'</strong> grid with <strong>'+points.length+' total lights</strong>.',a:points.length,b:fmt(rows===1?0:yStep,true),c:fmt(cols===1?0:xStep,true),marksTitle:'Light center coordinates',marks:list,dimensions:fmt(length,true)+' × '+fmt(width,true)+' room',layout:rows+' rows · '+cols+' per row · '+points.length+' lights'});
    draw({length,width,points},$('#diagram'));draw({length,width,points},$('#printDiagram'));
  }
  commonEvents(calc,defaults);defaults();syncSpanMode();calc();
}
})();