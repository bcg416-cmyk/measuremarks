(() => {
'use strict';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
let units='imperial',data=null,fieldIndex=0;
const E={span:$('#span'),feet:$('#spanFeet'),inches:$('#spanInches'),mode:$('#spanMode'),decimalWrap:$('#spanDecimalWrap'),feetWrap:$('#spanFeetWrap'),board:$('#boardWidth'),gap:$('#boardGap'),edge:$('#edgeMode'),minEdge:$('#minEdge'),precision:$('#precision'),note:$('#resultNote'),a:$('#statA'),b:$('#statB'),c:$('#statC'),marks:$('#marks'),diagram:$('#diagram'),printDiagram:$('#printDiagram'),planDimensions:$('#planDimensions'),planLayout:$('#planLayout'),printMarks:$('#printMarks'),overlay:$('#fieldOverlay'),fieldCounter:$('#fieldCounter'),fieldValue:$('#fieldValue'),fieldLabel:$('#fieldLabel')};

function gcd(a,b){while(b)[a,b]=[b,a%b];return a}
function frac(v,d=16){const s=v<0?'-':'';v=Math.abs(v);let w=Math.floor(v+1e-9),n=Math.round((v-w)*d);if(n===d){w++;n=0}if(!n)return s+w+'"';const g=gcd(n,d);return s+(w?w+' ':'')+(n/g)+'/'+(d/g)+'"'}
function fmt(v,long=false){if(units==='metric')return(Math.round(v*10)/10).toLocaleString()+' mm';const d=Number(E.precision.value||16);if(!long||Math.abs(v)<12)return frac(v,d);const sign=v<0?'-':'';v=Math.abs(v);const ft=Math.floor(v/12),inch=v-ft*12;return sign+ft+"' "+frac(inch,d)}
function roundMark(v){const d=Number(E.precision.value||16);return units==='metric'?Math.round(v*10)/10:Math.round(v*d)/d}
function setLabel(el,text){const l=el?.closest('label');if(l?.firstChild)l.firstChild.nodeValue=text+' '}
function updateUnitLabels(){const u=units==='metric'?'mm':'inches';setLabel(E.span,'Deck width ('+u+')');setLabel(E.board,'Board face width ('+u+')');setLabel(E.gap,'Installed gap between boards ('+u+')');setLabel(E.minEdge,'Preferred minimum edge-board width ('+u+')')}
function getSpan(){if(units==='imperial'&&E.mode.value==='feet')return(Number(E.feet.value)||0)*12+(Number(E.inches.value)||0);return Number(E.span.value)||0}
function setSpan(v){E.span.value=v;if(units==='imperial'){E.feet.value=Math.floor(v/12);E.inches.value=v%12}}
function syncMode(){const feetMode=units==='imperial'&&E.mode.value==='feet';E.decimalWrap.classList.toggle('hidden',feetMode);E.feetWrap.classList.toggle('hidden',!feetMode);E.mode.disabled=units!=='imperial'}
function defaults(){if(units==='imperial'){setSpan(144);E.board.value=5.5;E.gap.value=.25;E.minEdge.value=2.5;E.mode.value='feet'}else{E.span.value=3658;E.board.value=140;E.gap.value=6;E.minEdge.value=64;E.mode.value='inches'}E.edge.value='balanced';syncMode();updateUnitLabels()}

function solveBalanced(span,board,gap){
  let n=Math.max(2,Math.ceil((span+gap)/(board+gap)));
  while(n>1){
    const edge=(span-gap*(n-1)-board*(n-2))/2;
    if(edge>0&&edge<=board+1e-9)return{count:n,edgeStart:edge,edgeEnd:edge,fullMiddle:Math.max(0,n-2)};
    n--;
  }
  return{count:1,edgeStart:span,edgeEnd:0,fullMiddle:0};
}
function solveFullStart(span,board,gap){
  const full=Math.floor((span+gap)/(board+gap));
  const used=full*board+Math.max(0,full-1)*gap;
  const rem=span-used;
  if(rem<=1e-9)return{count:full,edgeStart:board,edgeEnd:board,fullMiddle:Math.max(0,full-2),lastFull:true};
  return{count:full+1,edgeStart:board,edgeEnd:Math.max(0,rem-gap),fullMiddle:Math.max(0,full-1),lastFull:false};
}
function layout(){
  const span=getSpan(),board=Number(E.board.value)||0,gap=Number(E.gap.value)||0,minEdge=Number(E.minEdge.value)||0,mode=E.edge.value;
  if(!(span>0)||!(board>0)||gap<0||span<board/2){E.note.textContent='Check the deck width, board width, and gap.';return null}
  const r=mode==='balanced'?solveBalanced(span,board,gap):solveFullStart(span,board,gap);
  const widths=[];
  if(r.count===1)widths.push(span);
  else{
    widths.push(r.edgeStart);
    for(let i=0;i<r.fullMiddle;i++)widths.push(board);
    widths.push(r.edgeEnd);
  }
  const starts=[];let x=0;
  widths.forEach((w,i)=>{starts.push(x);x+=w;if(i<widths.length-1)x+=gap});
  const minActual=Math.min(...widths);
  return{span,board,gap,minEdge,mode,widths,starts,count:widths.length,minActual};
}

function mk(tag,a={},text=''){const n=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));if(text)n.textContent=text;return n}
function defs(svg){const d=mk('defs'),m=mk('marker',{id:'deckArrow',viewBox:'0 0 10 10',refX:5,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});m.appendChild(mk('path',{d:'M0 0L10 5L0 10z',fill:'#405047'}));d.appendChild(m);svg.appendChild(d)}
function dimLabel(svg,x,y,t){const w=Math.max(54,t.length*6.2+12);svg.appendChild(mk('rect',{x:x-w/2,y:y-13,width:w,height:18,rx:4,fill:'#fbfcfa'}));svg.appendChild(mk('text',{x,y,'text-anchor':'middle','font-size':11,'font-weight':750,fill:'#26342b'},t))}
function dimH(svg,x1,x2,y,t,extY){if(Math.abs(x2-x1)<5)return;[x1,x2].forEach(x=>svg.appendChild(mk('line',{x1:x,y1:extY,x2:x,y2:y+5,stroke:'#829087'})));svg.appendChild(mk('line',{x1,y1:y,x2,y2:y,stroke:'#405047','stroke-width':1.2,'marker-start':'url(#deckArrow)','marker-end':'url(#deckArrow)'}));dimLabel(svg,(x1+x2)/2,y-5,t)}
function draw(svg){
  if(!svg||!data)return;svg.innerHTML='';svg.appendChild(mk('rect',{x:0,y:0,width:980,height:410,rx:14,fill:'#fbfcfa'}));defs(svg);svg.appendChild(mk('text',{x:38,y:30,'font-size':18,'font-weight':850,fill:'#18211a'},'Deck board layout blueprint'));
  const left=82,right=920,top=112,bottom=292,scale=(right-left)/data.span;
  svg.appendChild(mk('rect',{x:left,y:top,width:right-left,height:bottom-top,fill:'#ede8dc',stroke:'#b8ad9b'}));
  data.widths.forEach((w,i)=>{const x=left+data.starts[i]*scale,pw=Math.max(2,w*scale);svg.appendChild(mk('rect',{x,y:top,width:pw,height:bottom-top,fill:i%2?'#c9a36c':'#d7b47e',stroke:'#8c704c','stroke-width':1}));if(i<18)svg.appendChild(mk('text',{x:x+pw/2,y:top+92,'text-anchor':'middle','font-size':9,'font-weight':800,fill:'#4c3b28'},String(i+1)))});
  dimH(svg,left,right,382,'TOTAL DECK WIDTH '+fmt(data.span,true),bottom);
  if(data.widths.length){const w0=data.widths[0]*scale;dimH(svg,left,left+w0,84,'EDGE BOARD '+fmt(data.widths[0],true),top)}
  if(data.widths.length>2){const i=1,x=left+data.starts[i]*scale,w=data.widths[i]*scale;dimH(svg,x,x+w,64,'FULL BOARD '+fmt(data.widths[i],true),top)}
  if(data.widths.length>1){const x1=left+(data.starts[0]+data.widths[0])*scale,x2=left+data.starts[1]*scale;dimH(svg,x1,x2,322,'GAP '+fmt(data.gap,true),bottom)}
  if(data.widths.length>1){const last=data.widths.length-1,x=left+data.starts[last]*scale,w=data.widths[last]*scale;dimH(svg,x,x+w,350,'END BOARD '+fmt(data.widths[last],true),bottom)}
}
function renderField(){if(!data)return;fieldIndex=Math.max(0,Math.min(fieldIndex,data.starts.length-1));E.fieldCounter.textContent='BOARD '+(fieldIndex+1)+' OF '+data.starts.length;E.fieldValue.textContent=fmt(roundMark(data.starts[fieldIndex]),true);E.fieldLabel.textContent='BOARD START FROM DECK EDGE'}
function next(d){if(!data)return;fieldIndex=(fieldIndex+d+data.starts.length)%data.starts.length;renderField()}
function calculate(){
  const r=layout();if(!r)return;data=r;
  const warn=r.minActual+1e-9<r.minEdge;
  E.note.innerHTML=(r.mode==='balanced'?'Balanced edge layout':'Full-board start layout')+' uses <strong>'+r.count+' board pieces</strong>. '+(warn?'<strong>Note:</strong> the narrowest edge board is below your preferred minimum.':'The edge-board width meets your preferred minimum.');
  E.a.textContent=r.count;E.b.textContent=fmt(r.mode==='balanced'?r.widths[0]:r.widths[r.widths.length-1],true);E.c.textContent=fmt(r.gap,true);
  const marks=r.starts.map((v,i)=>({label:'Board '+(i+1),value:fmt(roundMark(v),true),width:r.widths[i]}));
  E.marks.innerHTML=marks.map(m=>'<div class="mark"><small>'+m.label+' start</small><strong>'+m.value+'</strong><small>Board width '+fmt(m.width,true)+'</small></div>').join('');
  E.planDimensions.textContent=fmt(r.span,true)+' deck width · '+fmt(r.board,true)+' full board · '+fmt(r.gap,true)+' installed gap';
  E.planLayout.textContent=(r.mode==='balanced'?'Balanced edges':'Full board at start')+' · '+r.count+' board pieces · narrowest edge '+fmt(r.minActual,true);
  E.printMarks.innerHTML=marks.map(m=>'<li>'+m.label+' start: <strong>'+m.value+'</strong> · width '+fmt(m.width,true)+'</li>').join('');
  draw(E.diagram);draw(E.printDiagram);fieldIndex=0;renderField();
}

$('#calculate').addEventListener('click',calculate);
[E.span,E.feet,E.inches,E.board,E.gap,E.edge,E.minEdge,E.precision].forEach(x=>x&&['input','change'].forEach(ev=>x.addEventListener(ev,calculate)));
E.mode.addEventListener('change',()=>{syncMode();calculate()});
document.querySelectorAll('.seg').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));b.classList.add('active');units=b.dataset.units;defaults();calculate()}));
document.querySelectorAll('.print-button').forEach(b=>b.addEventListener('click',()=>window.print()));
$('#openField').addEventListener('click',()=>{if(data){E.overlay.hidden=false;fieldIndex=0;renderField()}});
$('#closeField').addEventListener('click',()=>E.overlay.hidden=true);
$('#prevMark').addEventListener('click',()=>next(-1));$('#nextMark').addEventListener('click',()=>next(1));
$('#mobileField')?.addEventListener('click',()=>$('#openField').click());$('#mobilePrint')?.addEventListener('click',()=>window.print());
defaults();calculate();
})();