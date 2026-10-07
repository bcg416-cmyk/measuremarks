
(() => {
'use strict';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
let units='imperial',data=null,fieldIndex=0;
const E={span:$('#span'),feet:$('#spanFeet'),inches:$('#spanInches'),mode:$('#spanMode'),decimalWrap:$('#spanDecimalWrap'),feetWrap:$('#spanFeetWrap'),width:$('#postWidth'),max:$('#maxSpacing'),ends:$('#endMode'),precision:$('#precision'),posts:$('#postCount'),spacing:$('#actualSpacing'),gap:$('#clearGap'),note:$('#resultNote'),marks:$('#marks'),diagram:$('#diagram'),printDiagram:$('#printDiagram'),planDimensions:$('#planDimensions'),planSpacing:$('#planSpacing'),printMarks:$('#printMarks'),overlay:$('#fieldOverlay'),fieldCounter:$('#fieldCounter'),fieldValue:$('#fieldValue'),fieldLabel:$('#fieldLabel')};
function gcd(a,b){while(b)[a,b]=[b,a%b];return a}
function frac(v,d=16){const s=v<0?'-':'';v=Math.abs(v);let w=Math.floor(v+1e-9),n=Math.round((v-w)*d);if(n===d){w++;n=0}if(!n)return s+w+'"';const g=gcd(n,d);return s+(w?w+' ':'')+(n/g)+'/'+(d/g)+'"'}
function fmt(v,long=false){if(units==='metric')return(Math.round(v*10)/10).toLocaleString()+' mm';const d=Number(E.precision.value||16);if(!long||Math.abs(v)<12)return frac(v,d);const sign=v<0?'-':'';v=Math.abs(v);const ft=Math.floor(v/12),inch=v-ft*12;return sign+ft+"' "+frac(inch,d)}
function roundMark(v){const d=Number(E.precision.value||16);return units==='metric'?Math.round(v*10)/10:Math.round(v*d)/d}
function setLabel(el,text){const l=el?.closest('label');if(l?.firstChild)l.firstChild.nodeValue=text+' '}
function updateUnitLabels(){const u=units==='metric'?'mm':'inches';setLabel(E.span,'Total fence run ('+u+')');setLabel(E.width,'Post width ('+u+')');setLabel(E.max,'Maximum center-to-center spacing ('+u+')')}
function getRun(){if(units==='imperial'&&E.mode.value==='feet')return(Number(E.feet.value)||0)*12+(Number(E.inches.value)||0);return Number(E.span.value)||0}
function setRun(v){E.span.value=v;if(units==='imperial'){E.feet.value=Math.floor(v/12);E.inches.value=v%12}}
function syncMode(){const feetMode=units==='imperial'&&E.mode.value==='feet';E.decimalWrap.classList.toggle('hidden',feetMode);E.feetWrap.classList.toggle('hidden',!feetMode);E.mode.disabled=units!=='imperial'}
function defaults(){if(units==='imperial'){setRun(572);E.width.value=3.5;E.max.value=96;E.mode.value='feet'}else{E.span.value=14529;E.width.value=89;E.max.value=2438;E.mode.value='inches'}syncMode();updateUnitLabels()}
function mk(tag,a={},text=''){const n=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));if(text)n.textContent=text;return n}
function defs(svg){const d=mk('defs'),m=mk('marker',{id:'postArrow',viewBox:'0 0 10 10',refX:5,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});m.appendChild(mk('path',{d:'M0 0L10 5L0 10z',fill:'#405047'}));d.appendChild(m);svg.appendChild(d)}
function label(svg,x,y,t){const w=Math.max(54,t.length*6.2+12);svg.appendChild(mk('rect',{x:x-w/2,y:y-13,width:w,height:18,rx:4,fill:'#fbfcfa'}));svg.appendChild(mk('text',{x,y,'text-anchor':'middle','font-size':11,'font-weight':750,fill:'#26342b'},t))}
function dimH(svg,x1,x2,y,t,extY){if(Math.abs(x2-x1)<5)return;[x1,x2].forEach(x=>svg.appendChild(mk('line',{x1:x,y1:extY,x2:x,y2:y+5,stroke:'#829087'})));svg.appendChild(mk('line',{x1,y1:y,x2,y2:y,stroke:'#405047','stroke-width':1.2,'marker-start':'url(#postArrow)','marker-end':'url(#postArrow)'}));label(svg,(x1+x2)/2,y-5,t)}
function calculate(){
 const run=getRun(),width=Number(E.width.value)||0,max=Number(E.max.value)||0;
 if(!(run>0)||!(width>0)||!(max>0)||run<=width){E.note.textContent='Check the project dimensions. The run, post width, and maximum spacing must all be greater than zero.';E.marks.innerHTML='';return}
 const flush=E.ends.value==='flush',usable=flush?run-width:run,intervals=Math.max(1,Math.ceil(usable/max)),posts=intervals+1,spacing=usable/intervals,clear=Math.max(0,spacing-width),first=flush?width/2:0,centers=Array.from({length:posts},(_,i)=>first+i*spacing),marks=centers.map(roundMark);
 data={run,width,max,flush,intervals,posts,spacing,clear,centers,marks};
 E.posts.textContent=posts;E.spacing.textContent=fmt(spacing,true);E.gap.textContent=fmt(clear,true);E.note.innerHTML='Use <strong>'+posts+' posts</strong> to keep every post at or below your '+fmt(max,true)+' maximum. Actual center-to-center spacing is <strong>'+fmt(spacing,true)+'</strong>.';E.marks.innerHTML=marks.map((m,i)=>'<div class="mark"><small>Post '+(i+1)+'</small><strong>'+fmt(m,true)+'</strong></div>').join('');E.planDimensions.textContent=fmt(run,true)+' total run · '+fmt(width,true)+' post width · '+fmt(max,true)+' maximum spacing';E.planSpacing.textContent=posts+' posts · '+fmt(spacing,true)+' center-to-center';E.printMarks.innerHTML=marks.map((m,i)=>'<li>Post '+(i+1)+' center: <strong>'+fmt(m,true)+'</strong></li>').join('');draw(E.diagram);draw(E.printDiagram);fieldIndex=0;renderField()
}
function draw(svg){
 if(!svg||!data)return;svg.innerHTML='';svg.appendChild(mk('rect',{x:0,y:0,width:980,height:410,rx:14,fill:'#fbfcfa'}));defs(svg);svg.appendChild(mk('text',{x:38,y:30,'font-size':18,'font-weight':850,fill:'#18211a'},'Fence post blueprint'));
 const left=88,right=920,y=230,scale=(right-left)/data.run;
 svg.appendChild(mk('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#af8b61','stroke-width':16,'stroke-linecap':'round'}));
 data.centers.forEach((c,i)=>{const x=left+c*scale,w=Math.max(8,data.width*scale);svg.appendChild(mk('rect',{x:x-w/2,y:105,width:w,height:185,rx:3,fill:'#8a6543',stroke:'#694b31'}));svg.appendChild(mk('text',{x,y:314,'text-anchor':'middle','font-size':10,'font-weight':800,fill:'#667067'},'#'+(i+1)));if(i<10)svg.appendChild(mk('text',{x,y:331,'text-anchor':'middle','font-size':9,fill:'#405047'},fmt(data.marks[i],true)))});
 dimH(svg,left,right,380,'TOTAL '+fmt(data.run,true),300);
 if(data.centers.length>1){const x1=left+data.centers[0]*scale,x2=left+data.centers[1]*scale;dimH(svg,x1,x2,72,'C/C '+fmt(data.spacing,true),100);const e1=x1+data.width*scale/2,e2=x2-data.width*scale/2;dimH(svg,e1,e2,96,'CLEAR '+fmt(data.clear,true),110)}
 if(data.flush){const x=left+data.centers[0]*scale,w=data.width*scale;dimH(svg,x-w/2,x+w/2,350,'POST '+fmt(data.width,true),292)}
}
function renderField(){if(!data)return;E.fieldCounter.textContent='POST '+(fieldIndex+1)+' OF '+data.marks.length;E.fieldValue.textContent=fmt(data.marks[fieldIndex],true);E.fieldLabel.textContent='POST CENTER'}
function next(d){if(!data)return;fieldIndex=(fieldIndex+d+data.marks.length)%data.marks.length;renderField()}
$('#calculate').addEventListener('click',calculate);[E.span,E.feet,E.inches,E.width,E.max,E.ends,E.precision].forEach(x=>x&&['input','change'].forEach(ev=>x.addEventListener(ev,calculate)));E.mode.addEventListener('change',()=>{syncMode();calculate()});document.querySelectorAll('.seg').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));b.classList.add('active');units=b.dataset.units;defaults();calculate()}));document.querySelectorAll('.print-button').forEach(b=>b.addEventListener('click',()=>window.print()));$('#openField').addEventListener('click',()=>{if(data){E.overlay.hidden=false;fieldIndex=0;renderField()}});$('#closeField').addEventListener('click',()=>E.overlay.hidden=true);$('#prevMark').addEventListener('click',()=>next(-1));$('#nextMark').addEventListener('click',()=>next(1));$('#mobileField')?.addEventListener('click',()=>$('#openField').click());$('#mobilePrint')?.addEventListener('click',()=>window.print());defaults();calculate()
})();