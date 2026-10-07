(() => {
'use strict';
const $=s=>document.querySelector(s);
const NS='http://www.w3.org/2000/svg';
let units='imperial', data=null, fieldIndex=0;

const E={
 span:$('#span'),feet:$('#spanFeet'),inches:$('#spanInches'),mode:$('#spanMode'),
 decimalWrap:$('#spanDecimalWrap'),feetWrap:$('#spanFeetWrap'),
 tile:$('#tileWidth'),grout:$('#groutWidth'),minCut:$('#minCut'),precision:$('#precision'),
 recommendation:$('#recommendation'),edgeCut:$('#edgeCut'),fullTiles:$('#fullTiles'),layoutRef:$('#layoutRef'),
 altNote:$('#altNote'),marks:$('#marks'),diagram:$('#diagram'),printDiagram:$('#printDiagram'),
 planDimensions:$('#planDimensions'),planLayout:$('#planLayout'),printMarks:$('#printMarks'),
 overlay:$('#fieldOverlay'),fieldCounter:$('#fieldCounter'),fieldValue:$('#fieldValue'),fieldLabel:$('#fieldLabel')
};

function gcd(a,b){while(b)[a,b]=[b,a%b];return a}
function frac(v,d=16){
 const s=v<0?'-':'';v=Math.abs(v);let w=Math.floor(v+1e-9),n=Math.round((v-w)*d);
 if(n===d){w++;n=0} if(!n)return s+w+'"'; const g=gcd(n,d);
 return s+(w?w+' ':'')+(n/g)+'/'+(d/g)+'"';
}
function fmt(v,long=false){
 if(units==='metric') return (Math.round(v*10)/10).toLocaleString()+' mm';
 const d=Number(E.precision.value||16);
 if(!long || Math.abs(v)<12) return frac(v,d);
 const sign=v<0?'-':'';v=Math.abs(v);const ft=Math.floor(v/12),inch=v-ft*12;
 return sign+ft+"' "+frac(inch,d);
}
function roundMark(v){
 return units==='metric'?Math.round(v*10)/10:Math.round(v*Number(E.precision.value||16))/Number(E.precision.value||16);
}
function getSpan(){
 if(units==='imperial'&&E.mode.value==='feet') return (Number(E.feet.value)||0)*12+(Number(E.inches.value)||0);
 return Number(E.span.value)||0;
}
function setSpan(v){
 E.span.value=v;
 if(units==='imperial'){E.feet.value=Math.floor(v/12);E.inches.value=v%12;}
}
function syncMode(){
 const feetMode=units==='imperial'&&E.mode.value==='feet';
 E.decimalWrap.classList.toggle('hidden',feetMode);
 E.feetWrap.classList.toggle('hidden',!feetMode);
 E.mode.disabled=units!=='imperial';
}
function defaults(){
 if(units==='imperial'){
   setSpan(96);E.tile.value=12;E.grout.value=.125;E.minCut.value=3;E.mode.value='feet';
   E.feet.value=8;E.inches.value=0;
 }else{
   E.span.value=2438;E.tile.value=305;E.grout.value=3;E.minCut.value=76;E.mode.value='inches';
 }
 syncMode();
}

function buildCandidate(span,tile,grout,mode){
 const module=tile+grout, center=span/2;
 let baseStart;
 if(mode==='tile'){
   baseStart=center-tile/2;
 }else{
   // grout joint centered in the span; first tile to the right begins after half the joint
   baseStart=center+grout/2;
 }
 const intervals=[];
 const kMin=Math.floor((0-baseStart)/module)-2;
 const kMax=Math.ceil((span-baseStart)/module)+2;
 for(let k=kMin;k<=kMax;k++){
   const a=baseStart+k*module,b=a+tile;
   const ca=Math.max(0,a),cb=Math.min(span,b);
   if(cb-ca>1e-7) intervals.push({start:a,end:b,clipStart:ca,clipEnd:cb,visible:cb-ca,full:a>=-1e-7&&b<=span+1e-7});
 }
 intervals.sort((a,b)=>a.clipStart-b.clipStart);
 const first=intervals[0],last=intervals[intervals.length-1];
 const leftCut=first.visible,rightCut=last.visible;
 const fullCount=intervals.filter(x=>x.full).length;
 const jointCenters=[];
 for(let i=0;i<intervals.length-1;i++){
   const jc=(intervals[i].end+intervals[i+1].start)/2;
   if(jc>0&&jc<span) jointCenters.push(jc);
 }
 return {mode,intervals,leftCut,rightCut,minEdge:Math.min(leftCut,rightCut),fullCount,jointCenters,module};
}

function choose(a,b,minCut,tile){
 const eps=1e-6;
 const aOK=a.minEdge+eps>=minCut,bOK=b.minEdge+eps>=minCut;
 if(aOK!==bOK) return aOK?a:b;
 if(Math.abs(a.minEdge-b.minEdge)>eps) return a.minEdge>b.minEdge?a:b;
 // Tie-breaker: prefer a tile-centered layout because it gives a strong center reference.
 return a.mode==='tile'?a:b;
}

function calculate(){
 const span=getSpan(),tile=Number(E.tile.value)||0,grout=Number(E.grout.value)||0,minCut=Number(E.minCut.value)||0;
 if(!(span>0)||!(tile>0)||grout<0||span<=tile/4){
   E.recommendation.textContent='Check the project dimensions.';
   E.marks.innerHTML='';return;
 }
 const tileCentered=buildCandidate(span,tile,grout,'tile');
 const jointCentered=buildCandidate(span,tile,grout,'joint');
 const best=choose(tileCentered,jointCentered,minCut,tile);
 const alt=best===tileCentered?jointCentered:tileCentered;
 const meets=best.minEdge>=minCut-1e-6;
 data={span,tile,grout,minCut,best,alt};

 E.recommendation.innerHTML='<strong>'+(best.mode==='tile'?'Center on a tile':'Center on a grout joint')+'</strong>'+(meets?'':' · edge cut below your preferred minimum');
 E.edgeCut.textContent=fmt(best.minEdge);
 E.fullTiles.textContent=best.fullCount;
 E.layoutRef.textContent=best.mode==='tile'?'Tile centered on room/span centerline':'Grout joint centered on room/span centerline';
 E.altNote.innerHTML='Recommended border cut: <strong>'+fmt(best.minEdge)+'</strong>. The alternate '+(alt.mode==='tile'?'tile-centered':'joint-centered')+' layout produces about <strong>'+fmt(alt.minEdge)+'</strong> at each edge.'+(meets?'':' Consider shifting the layout, changing tile size, or accepting a smaller border cut.');
 const marks=best.jointCenters.map(roundMark);
 E.marks.innerHTML=marks.length?marks.map((m,i)=>'<div class="mark"><small>Grout joint '+(i+1)+'</small><strong>'+fmt(m,true)+'</strong></div>').join(''):'<div class="mark"><small>No interior grout joints</small><strong>Single tile/cut spans the layout</strong></div>';
 E.planDimensions.textContent=fmt(span,true)+' span · '+fmt(tile)+' tile · '+fmt(grout)+' grout joint';
 E.planLayout.textContent=(best.mode==='tile'?'Center on tile':'Center on grout joint')+' · '+fmt(best.minEdge)+' balanced edge cut';
 E.printMarks.innerHTML=marks.map((m,i)=>'<li>Grout joint '+(i+1)+' center: <strong>'+fmt(m,true)+'</strong></li>').join('');
 draw(E.diagram);draw(E.printDiagram);fieldIndex=0;renderField();
}

function mk(tag,a={},text=''){const n=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));if(text)n.textContent=text;return n}
function draw(svg){
 if(!svg||!data)return;svg.innerHTML='';
 const {span,tile,grout,best}=data;
 svg.appendChild(mk('rect',{x:0,y:0,width:980,height:410,rx:14,fill:'#fbfcfa'}));
 svg.appendChild(mk('text',{x:52,y:34,'font-size':18,'font-weight':850,fill:'#18211a'},'Balanced tile layout'));
 const left=70,right=910,top=118,bottom=292,scale=(right-left)/span;
 svg.appendChild(mk('rect',{x:left,y:top,width:right-left,height:bottom-top,fill:'#e5e1d7',stroke:'#aaa293'}));
 best.intervals.forEach((it,i)=>{
   const x=left+it.clipStart*scale,w=Math.max(1,(it.clipEnd-it.clipStart)*scale);
   svg.appendChild(mk('rect',{x,y:top,width:w,height:bottom-top,fill:i%2?'#ddd7ca':'#ebe5d9',stroke:'#9f9789','stroke-width':1}));
 });
 const cx=left+(span/2)*scale;
 svg.appendChild(mk('line',{x1:cx,y1:82,x2:cx,y2:322,stroke:'#176b43','stroke-width':2,'stroke-dasharray':'7 6'}));
 svg.appendChild(mk('text',{x:cx,y:72,'text-anchor':'middle','font-size':12,'font-weight':800,fill:'#176b43'},best.mode==='tile'?'CENTER OF TILE':'CENTER OF GROUT JOINT'));
 best.jointCenters.forEach((j,i)=>{
   const x=left+j*scale;
   svg.appendChild(mk('line',{x1:x,y1:302,x2:x,y2:322,stroke:'#667067','stroke-width':1.2}));
   if(i<14) svg.appendChild(mk('text',{x,y:340,'text-anchor':'middle','font-size':10,fill:'#667067'},String(i+1)));
 });
 svg.appendChild(mk('line',{x1:left,y1:377,x2:right,y2:377,stroke:'#344039','stroke-width':1.4}));
 svg.appendChild(mk('line',{x1:left,y1:369,x2:left,y2:385,stroke:'#344039','stroke-width':1.4}));
 svg.appendChild(mk('line',{x1:right,y1:369,x2:right,y2:385,stroke:'#344039','stroke-width':1.4}));
 svg.appendChild(mk('text',{x:490,y:367,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'#18211a'},'Total span: '+fmt(span,true)));
 svg.appendChild(mk('text',{x:left+Math.max(34,best.leftCut*scale/2),y:105,'text-anchor':'middle','font-size':11,'font-weight':700,fill:'#18211a'},'Edge cut '+fmt(best.leftCut)));
}

function renderField(){
 if(!data)return;
 const marks=data.best.jointCenters.map(roundMark);
 if(!marks.length){E.fieldCounter.textContent='LAYOUT REFERENCE';E.fieldValue.textContent=fmt(data.span/2,true);E.fieldLabel.textContent=data.best.mode==='tile'?'TILE CENTERLINE':'GROUT CENTERLINE';return;}
 fieldIndex=Math.max(0,Math.min(fieldIndex,marks.length-1));
 E.fieldCounter.textContent='GROUT JOINT '+(fieldIndex+1)+' OF '+marks.length;
 E.fieldValue.textContent=fmt(marks[fieldIndex],true);
 E.fieldLabel.textContent='JOINT CENTER FROM STARTING EDGE';
}
function next(d){
 if(!data)return;const n=data.best.jointCenters.length;if(!n)return;
 fieldIndex=(fieldIndex+d+n)%n;renderField();
}

$('#calculate').addEventListener('click',calculate);
[E.span,E.feet,E.inches,E.tile,E.grout,E.minCut,E.precision].forEach(x=>x&&['input','change'].forEach(ev=>x.addEventListener(ev,calculate)));
E.mode.addEventListener('change',()=>{syncMode();calculate()});
document.querySelectorAll('.seg').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));b.classList.add('active');units=b.dataset.units;
 defaults();calculate();
}));
document.querySelectorAll('.print-button').forEach(b=>b.addEventListener('click',()=>window.print()));
$('#openField').addEventListener('click',()=>{if(data){E.overlay.hidden=false;fieldIndex=0;renderField()}});
$('#closeField').addEventListener('click',()=>E.overlay.hidden=true);
$('#prevMark').addEventListener('click',()=>next(-1));$('#nextMark').addEventListener('click',()=>next(1));
$('#mobileField')?.addEventListener('click',()=>$('#openField').click());$('#mobilePrint')?.addEventListener('click',()=>window.print());
document.addEventListener('keydown',e=>{if(E.overlay.hidden)return;if(e.key==='Escape')E.overlay.hidden=true;if(e.key==='ArrowRight')next(1);if(e.key==='ArrowLeft')next(-1)});
defaults();calculate();
})();