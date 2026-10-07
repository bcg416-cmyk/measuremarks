(() => {
'use strict';
const $=s=>document.querySelector(s);
const NS='http://www.w3.org/2000/svg';
let units='imperial', data=null, fieldIndex=0;

const E={
 span:$('#span'),feet:$('#spanFeet'),inches:$('#spanInches'),mode:$('#spanMode'),
 decimalWrap:$('#spanDecimalWrap'),feetWrap:$('#spanFeetWrap'),
 width:$('#postWidth'),max:$('#maxSpacing'),ends:$('#endMode'),precision:$('#precision'),
 posts:$('#postCount'),spacing:$('#actualSpacing'),gap:$('#clearGap'),
 note:$('#resultNote'),marks:$('#marks'),diagram:$('#diagram'),printDiagram:$('#printDiagram'),
 planDimensions:$('#planDimensions'),planSpacing:$('#planSpacing'),printMarks:$('#printMarks'),
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
 const inchText=frac(inch,d).replace(/^0"$/,'0"');
 return sign+ft+"' "+inchText;
}
function roundMark(v){
 return units==='metric'?Math.round(v*10)/10:Math.round(v*Number(E.precision.value||16))/Number(E.precision.value||16);
}
function getRun(){
 if(units==='imperial'&&E.mode.value==='feet') return (Number(E.feet.value)||0)*12+(Number(E.inches.value)||0);
 return Number(E.span.value)||0;
}
function setRun(v){
 E.span.value=v;
 if(units==='imperial'){
   E.feet.value=Math.floor(v/12);E.inches.value=v%12;
 }
}
function syncMode(){
 const feetMode=units==='imperial'&&E.mode.value==='feet';
 E.decimalWrap.classList.toggle('hidden',feetMode);
 E.feetWrap.classList.toggle('hidden',!feetMode);
 E.mode.disabled=units!=='imperial';
}
function defaults(){
 if(units==='imperial'){
   setRun(572); E.width.value=3.5; E.max.value=96; E.mode.value='feet';
 }else{
   E.span.value=14529; E.width.value=89; E.max.value=2438; E.mode.value='inches';
 }
 syncMode();
}
function calculate(){
 const run=getRun(), width=Number(E.width.value)||0, max=Number(E.max.value)||0;
 if(!(run>0)||!(width>0)||!(max>0)||run<=width){
   E.note.textContent='Check the project dimensions. The run, post width, and maximum spacing must all be greater than zero.';
   E.marks.innerHTML=''; return;
 }
 const flush=E.ends.value==='flush';
 const usable=flush?run-width:run;
 const intervals=Math.max(1,Math.ceil(usable/max));
 const posts=intervals+1;
 const spacing=usable/intervals;
 const clear=Math.max(0,spacing-width);
 const first=flush?width/2:0;
 const centers=Array.from({length:posts},(_,i)=>first+i*spacing);
 const marks=centers.map(roundMark);
 data={run,width,max,flush,intervals,posts,spacing,clear,centers,marks};

 E.posts.textContent=posts;
 E.spacing.textContent=fmt(spacing,true);
 E.gap.textContent=fmt(clear,true);
 E.note.innerHTML='Use <strong>'+posts+' posts</strong> to keep every post at or below your '+fmt(max,true)+' maximum. Actual center-to-center spacing is <strong>'+fmt(spacing,true)+'</strong>.';
 E.marks.innerHTML=marks.map((m,i)=>'<div class="mark"><small>Post '+(i+1)+'</small><strong>'+fmt(m,true)+'</strong></div>').join('');
 E.planDimensions.textContent=fmt(run,true)+' total run · '+fmt(width)+' post width · '+fmt(max,true)+' maximum spacing';
 E.planSpacing.textContent=posts+' posts · '+fmt(spacing,true)+' center-to-center';
 E.printMarks.innerHTML=marks.map((m,i)=>'<li>Post '+(i+1)+' center: <strong>'+fmt(m,true)+'</strong></li>').join('');
 draw(E.diagram);draw(E.printDiagram);fieldIndex=0;renderField();
}
function mk(tag,a={},text=''){const n=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));if(text)n.textContent=text;return n}
function draw(svg){
 if(!svg||!data)return; svg.innerHTML='';
 svg.appendChild(mk('rect',{x:0,y:0,width:980,height:410,rx:14,fill:'#fbfcfa'}));
 svg.appendChild(mk('text',{x:52,y:34,'font-size':18,'font-weight':850,fill:'#18211a'},'Fence post layout'));
 const left=70,right=910,y=230,scale=(right-left)/data.run;
 svg.appendChild(mk('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#af8b61','stroke-width':16,'stroke-linecap':'round'}));
 data.centers.forEach((c,i)=>{
   const x=left+c*scale,w=Math.max(8,data.width*scale);
   svg.appendChild(mk('rect',{x:x-w/2,y:105,width:w,height:185,rx:3,fill:'#8a6543',stroke:'#694b31'}));
   svg.appendChild(mk('line',{x1:x,y1:300,x2:x,y2:322,stroke:'#176b43','stroke-width':1.6}));
   svg.appendChild(mk('text',{x,y:341,'text-anchor':'middle','font-size':11,fill:'#667067'},String(i+1)));
 });
 svg.appendChild(mk('line',{x1:left,y1:377,x2:right,y2:377,stroke:'#344039','stroke-width':1.4}));
 svg.appendChild(mk('line',{x1:left,y1:369,x2:left,y2:385,stroke:'#344039','stroke-width':1.4}));
 svg.appendChild(mk('line',{x1:right,y1:369,x2:right,y2:385,stroke:'#344039','stroke-width':1.4}));
 svg.appendChild(mk('text',{x:490,y:367,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'#18211a'},'Total run: '+fmt(data.run,true)));
 if(data.centers.length>1){
   const x1=left+data.centers[0]*scale,x2=left+data.centers[1]*scale;
   svg.appendChild(mk('line',{x1,y1:78,x2,y2:78,stroke:'#344039','stroke-width':1.2}));
   svg.appendChild(mk('text',{x:(x1+x2)/2,y:67,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'#18211a'},'Typical spacing: '+fmt(data.spacing,true)));
 }
}
function renderField(){
 if(!data)return;
 E.fieldCounter.textContent='POST '+(fieldIndex+1)+' OF '+data.marks.length;
 E.fieldValue.textContent=fmt(data.marks[fieldIndex],true);
 E.fieldLabel.textContent='POST CENTER';
}
function next(d){if(!data)return;fieldIndex=(fieldIndex+d+data.marks.length)%data.marks.length;renderField()}

$('#calculate').addEventListener('click',calculate);
[E.span,E.feet,E.inches,E.width,E.max,E.ends,E.precision].forEach(x=>x&&['input','change'].forEach(ev=>x.addEventListener(ev,calculate)));
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