
import {equalSpacing,roundedMarks,formatValue,feetInchesToInches,inchesToFeetParts} from './common.js';
import {draw} from './drawings.js';
const tool=document.body.dataset.tool||'equal';
const C={
equal:{name:'Equal Spacing',type:'equal',item:'Item',span:96,width:2.5,count:7,desc:'Use this for shelves, trim pieces, holes, brackets, hooks, or anything else that needs even spacing.'},
fence:{name:'Fence Pickets',type:'fence',item:'Picket',span:96,width:3.5,count:11,desc:'Lay out fence pickets evenly across a fixed opening and get the center mark for every picket.'},
balusters:{name:'Balusters',type:'balusters',item:'Baluster',span:36,width:1.5,count:11,desc:'Lay out balusters evenly between posts or rails with a visual spacing plan.'},
batten:{name:'Board & Batten',type:'batten',item:'Batten',span:144,width:2.5,count:8,desc:'Plan decorative battens across a wall and generate practical center marks.'},
slats:{name:'Wall Slats',type:'slats',item:'Slat',span:120,width:1.5,count:12,desc:'Lay out decorative wood slats with consistent spacing across a wall.'},
tile:{name:'Tile Layout',type:'tile',item:'Tile',span:96,width:12,count:7,desc:'Center a tile run across a span and preview the border balance before setting tile.'},
pictures:{name:'Picture Hanging',type:'pictures',item:'Frame',span:96,width:16,count:4,desc:'Space multiple frames evenly and get a center mark for each picture.'},
posts:{name:'Fence Posts',type:'posts',item:'Post',span:192,width:3.5,count:5,desc:'Lay out fence or deck posts across a long run and get a center mark for every post.'},
hardware:{name:'Cabinet Hardware',type:'hardware',item:'Door/Drawer',span:72,width:14,count:4,desc:'Space cabinet doors, drawer fronts, or repeated pull locations evenly across a run.'},
lights:{name:'Recessed Lights',type:'lights',item:'Fixture',span:144,width:6,count:5,desc:'Plan a straight run of recessed lights with even centers and a visual ceiling layout.'},
wainscot:{name:'Wainscoting',type:'wainscot',item:'Stile',span:144,width:2.5,count:7,desc:'Lay out wainscoting stiles or picture-frame molding evenly across a wall.'}}[tool];
const $=s=>document.querySelector(s), E={span:$('#span'),spanFeet:$('#spanFeet'),spanInches:$('#spanInches'),spanMode:$('#spanMode'),spanDecimalWrap:$('#spanDecimalWrap'),spanFeetWrap:$('#spanFeetWrap'),width:$('#itemWidth'),count:$('#count'),edge:$('#edgeMode'),precision:$('#precision'),exact:$('#exactGap'),gap:$('#roundedGap'),center:$('#centerSpacing'),title:$('#resultTitle'),desc:$('#toolDescription'),marks:$('#marks'),marksTitle:$('#marksTitle'),precLabel:$('#precisionLabel'),diagram:$('#diagram'),printDiagram:$('#printDiagram'),planProject:$('#planProject'),planDimensions:$('#planDimensions'),planGap:$('#planGap'),printMarks:$('#printMarks'),overlay:$('#fieldOverlay'),fieldCounter:$('#fieldCounter'),fieldValue:$('#fieldValue'),fieldLabel:$('#fieldLabel')};
let units='imperial',data=null,fieldIndex=0;
const fmt=(v,x=false)=>formatValue(v,units,Number(E.precision.value),x);
function preset(){
  if(units==='imperial'){
    E.span.value=C.span;E.width.value=C.width;
    if(E.spanFeet&&E.spanInches){const p=inchesToFeetParts(C.span);E.spanFeet.value=p.feet;E.spanInches.value=p.inches}
  }else{
    E.span.value=Math.round(C.span*25.4);E.width.value=Math.round(C.width*25.4)
  }
  E.count.value=C.count
}
function getSpan(){
  if(units==='imperial'&&E.spanMode&&E.spanMode.value==='feet'){
    return feetInchesToInches(E.spanFeet.value,E.spanInches.value)
  }
  return +E.span.value
}
function syncSpanMode(){
  if(!E.spanMode)return;
  const feetMode=units==='imperial'&&E.spanMode.value==='feet';
  E.spanDecimalWrap.classList.toggle('hidden',feetMode);
  E.spanFeetWrap.classList.toggle('hidden',!feetMode);
  E.spanMode.disabled=units!=='imperial';
}
function calc(){const span=getSpan(),width=+E.width.value,count=Math.max(2,Math.floor(+E.count.value)),precision=+E.precision.value;if(!(span>0)||!(width>0)||count*width>span){E.marks.innerHTML='<div class="mark"><strong>Check dimensions</strong><small>Total item width cannot exceed the span.</small></div>';return}const r=equalSpacing(span,width,count,E.edge.value),marks=roundedMarks(r.centers,units,precision),gapRounded=units==='metric'?Math.round(r.gap*10)/10:Math.round(r.gap*precision)/precision;data={...r,marks,gapRounded,span,width,count,precision,units};E.title.textContent=`${C.name} layout`;E.desc.textContent=C.desc;E.exact.textContent=fmt(r.gap,true);E.gap.textContent=fmt(gapRounded);E.center.textContent=fmt(r.centerStep);E.marksTitle.textContent=`${C.item} center marks`;E.precLabel.textContent=units==='metric'?'Rounded to nearest 0.1 mm':`Rounded to nearest 1/${precision}"`;E.marks.innerHTML=marks.map((v,i)=>`<div class="mark"><small>Mark ${i+1}</small><strong>${fmt(v)}</strong></div>`).join('');E.planProject.textContent=C.name;E.planDimensions.textContent=`${fmt(span)} span · ${count} ${C.item.toLowerCase()}${count===1?'':'s'} · ${fmt(width)} width`;E.planGap.textContent=fmt(gapRounded);E.printMarks.innerHTML=marks.map((v,i)=>`<li>Mark ${i+1}: <strong>${fmt(v)}</strong></li>`).join('');draw(E.diagram,C.type,data);draw(E.printDiagram,C.type,data);fieldIndex=0;renderField()}
function renderField(){if(!data)return;E.fieldCounter.textContent=`MARK ${fieldIndex+1} OF ${data.marks.length}`;E.fieldValue.textContent=fmt(data.marks[fieldIndex]);E.fieldLabel.textContent=`${C.item.toUpperCase()} CENTER`}
[E.span,E.spanFeet,E.spanInches,E.width,E.count,E.edge,E.precision].filter(Boolean).forEach(x=>{x.addEventListener('input',calc);x.addEventListener('change',calc)});
if(E.spanMode)E.spanMode.addEventListener('change',()=>{syncSpanMode();calc()});
document.querySelectorAll('.seg').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));b.classList.add('active');units=b.dataset.units;E.span.step=units==='metric'?1:.0625;E.width.step=units==='metric'?1:.0625;preset();syncSpanMode();calc()}));
$('#calculate').addEventListener('click',calc);document.querySelectorAll('.print-button').forEach(b=>b.addEventListener('click',()=>window.print()));$('#openField').addEventListener('click',()=>{E.overlay.hidden=false;fieldIndex=0;renderField()});$('#closeField').addEventListener('click',()=>E.overlay.hidden=true);$('#prevMark').addEventListener('click',()=>{fieldIndex=(fieldIndex-1+data.marks.length)%data.marks.length;renderField()});$('#nextMark').addEventListener('click',()=>{fieldIndex=(fieldIndex+1)%data.marks.length;renderField()});document.addEventListener('keydown',e=>{if(E.overlay.hidden||!data)return;if(e.key==='Escape')E.overlay.hidden=true;if(e.key==='ArrowRight'){fieldIndex=(fieldIndex+1)%data.marks.length;renderField()}if(e.key==='ArrowLeft'){fieldIndex=(fieldIndex-1+data.marks.length)%data.marks.length;renderField()}});preset();syncSpanMode();calc();

const mobileField=document.querySelector('#mobileField');
const mobilePrint=document.querySelector('#mobilePrint');
if(mobileField)mobileField.addEventListener('click',()=>document.querySelector('#openField')?.click());
if(mobilePrint)mobilePrint.addEventListener('click',()=>window.print());
