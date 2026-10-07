
import {formatValue} from './common.js';
const NS='http://www.w3.org/2000/svg';
const E=(t,a={},txt='')=>{const n=document.createElementNS(NS,t);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));if(txt)n.textContent=txt;return n};
const L=(s,x1,y1,x2,y2,c='#344039',w=1.4)=>s.appendChild(E('line',{x1,y1,x2,y2,stroke:c,'stroke-width':w}));
const T=(s,x,y,txt,size=13,weight=700,anchor='middle',fill='#18211a')=>s.appendChild(E('text',{x,y,'font-size':size,'font-weight':weight,'text-anchor':anchor,fill},txt));
function arrowDefs(s){if(s.querySelector('#drawArrow'))return;const defs=E('defs'),m=E('marker',{id:'drawArrow',viewBox:'0 0 10 10',refX:5,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});m.appendChild(E('path',{d:'M0 0L10 5L0 10z',fill:'#405047'}));defs.appendChild(m);s.appendChild(defs)}
function dim(s,x1,x2,y,label){arrowDefs(s);L(s,x1,y-18,x1,y+5,'#829087',1);L(s,x2,y-18,x2,y+5,'#829087',1);s.appendChild(E('line',{x1,y1:y,x2,y2:y,stroke:'#405047','stroke-width':1.2,'marker-start':'url(#drawArrow)','marker-end':'url(#drawArrow)'}));const w=Math.max(54,label.length*6.1+12);s.appendChild(E('rect',{x:(x1+x2)/2-w/2,y:y-24,width:w,height:18,rx:4,fill:'#fbfcfa'}));T(s,(x1+x2)/2,y-10,label,11,750)}
function setup(s,title){s.innerHTML='';s.appendChild(E('rect',{x:0,y:0,width:980,height:410,rx:14,fill:'#fbfcfa'}));arrowDefs(s);T(s,38,30,title+' blueprint',18,850,'start')}
function nums(s,d,left,scale,y=338){d.centers.forEach((c,i)=>{const x=left+c*scale;L(s,x,y-31,x,y-10,'#176b43',1.5);T(s,x,y,String(i+1),11,500,'middle','#667067')})}
function dims(s,d,left,right,scale,item){const f=v=>formatValue(v,d.units,d.precision);dim(s,left,right,386,`Total span: ${f(d.span)}`);if(d.centers.length){const c=d.centers[0];dim(s,left+(c-d.width/2)*scale,left+(c+d.width/2)*scale,68,`${item}: ${f(d.width)}`)}if(d.centers.length>1)dim(s,left+(d.centers[0]+d.width/2)*scale,left+(d.centers[1]-d.width/2)*scale,96,`Gap: ${f(d.gapRounded)}`)}
export function draw(s,type,d){const left=72,right=908,scale=(right-left)/d.span;setup(s,{
fence:'Fence picket layout',posts:'Fence post layout',balusters:'Baluster layout',batten:'Board & batten wall layout',wainscot:'Wainscoting panel layout',slats:'Decorative wall slat layout',tile:'Centered tile layout',pictures:'Picture hanging layout',hardware:'Cabinet hardware layout',lights:'Recessed lighting layout',equal:'Equal spacing layout'}[type]||'Layout');
if(type==='fence'){[140,265].forEach(y=>s.appendChild(E('rect',{x:left-10,y,width:right-left+20,height:16,rx:4,fill:'#af8b61'})));d.centers.forEach(c=>{const x=left+(c-d.width/2)*scale,w=Math.max(6,d.width*scale);s.appendChild(E('rect',{x,y:112,width:w,height:190,rx:6,fill:'#d8b17a',stroke:'#98724a','stroke-width':1.2}));s.appendChild(E('path',{d:`M ${x} 120 Q ${x+w/2} 92 ${x+w} 120`,fill:'none',stroke:'#98724a','stroke-width':1.2}))});nums(s,d,left,scale);dims(s,d,left,right,scale,'Picket')}
else if(type==='balusters'){[122,275].forEach(y=>s.appendChild(E('rect',{x:left-12,y,width:right-left+24,height:22,rx:4,fill:'#8d673f'})));d.centers.forEach(c=>s.appendChild(E('rect',{x:left+(c-d.width/2)*scale,y:144,width:Math.max(5,d.width*scale),height:131,rx:3,fill:'#d6dade',stroke:'#899198','stroke-width':1.2})));nums(s,d,left,scale);dims(s,d,left,right,scale,'Baluster')}
else if(type==='batten'||type==='slats'){s.appendChild(E('rect',{x:left,y:116,width:right-left,height:190,rx:4,fill:type==='slats'?'#252c29':'#f1eee6',stroke:'#d8d2c5'}));d.centers.forEach(c=>s.appendChild(E('rect',{x:left+(c-d.width/2)*scale,y:116,width:Math.max(4,d.width*scale),height:190,fill:type==='slats'?'#b98350':'#d8d1c1',stroke:type==='slats'?'none':'#a59b89'})));nums(s,d,left,scale,344);dims(s,d,left,right,scale,type==='slats'?'Slat':'Batten')}
else if(type==='posts'){
  s.appendChild(E('rect',{x:left,y:250,width:right-left,height:18,rx:4,fill:'#af8b61'}));
  d.centers.forEach(c=>{
    const x=left+(c-d.width/2)*scale;
    s.appendChild(E('rect',{x,y:120,width:Math.max(7,d.width*scale),height:165,rx:3,fill:'#8a6543',stroke:'#694b31'}));
  });
  nums(s,d,left,scale,344);dims(s,d,left,right,scale,'Post')
}
else if(type==='wainscot'){
  s.appendChild(E('rect',{x:left,y:118,width:right-left,height:188,fill:'#f6f3eb',stroke:'#cfc8ba'}));
  s.appendChild(E('rect',{x:left,y:118,width:right-left,height:16,fill:'#c9baa1'}));
  s.appendChild(E('rect',{x:left,y:288,width:right-left,height:18,fill:'#c9baa1'}));
  d.centers.forEach(c=>{
    const x=left+(c-d.width/2)*scale;
    s.appendChild(E('rect',{x,y:134,width:Math.max(5,d.width*scale),height:154,fill:'#ddd5c7',stroke:'#a99d89'}));
  });
  nums(s,d,left,scale,344);dims(s,d,left,right,scale,'Stile')
}
else if(type==='hardware'){
  s.appendChild(E('rect',{x:left,y:112,width:right-left,height:196,rx:5,fill:'#e8e2d7',stroke:'#bfb5a6'}));
  d.centers.forEach((c,i)=>{
    const x=left+c*scale;
    const doorW=Math.max(44,d.width*scale);
    s.appendChild(E('rect',{x:x-doorW/2,y:132,width:doorW,height:155,rx:3,fill:'#f4f0e8',stroke:'#a99d89'}));
    s.appendChild(E('circle',{cx:x,cy:210,r:6,fill:'#5d5549'}));
  });
  nums(s,d,left,scale,344);dims(s,d,left,right,scale,'Door/Drawer')
}
else if(type==='lights'){
  s.appendChild(E('rect',{x:left,y:120,width:right-left,height:178,rx:6,fill:'#eef0ef',stroke:'#c8cdca'}));
  d.centers.forEach(c=>{
    const x=left+c*scale;
    s.appendChild(E('circle',{cx:x,cy:208,r:18,fill:'#fff9d8',stroke:'#9a9787','stroke-width':2}));
    s.appendChild(E('circle',{cx:x,cy:208,r:7,fill:'#f3dd79'}));
  });
  nums(s,d,left,scale,344);dims(s,d,left,right,scale,'Fixture')
}
else if(type==='tile'){const top=120,h=180;s.appendChild(E('rect',{x:left,y:top,width:right-left,height:h,fill:'#f1eee7',stroke:'#cfc9bc'}));d.centers.forEach((c,i)=>{const x=left+(c-d.width/2)*scale,w=Math.max(8,d.width*scale);for(let r=0;r<3;r++)s.appendChild(E('rect',{x,y:top+r*h/3,width:w,height:h/3,fill:(i+r)%2?'#ddd7ca':'#ebe5d9',stroke:'#aaa293'}))});nums(s,d,left,scale,344);dims(s,d,left,right,scale,'Tile')}
else if(type==='pictures'){s.appendChild(E('rect',{x:left,y:112,width:right-left,height:196,rx:4,fill:'#f2efe8',stroke:'#d4cec1'}));d.centers.forEach((c,i)=>{const w=Math.max(28,d.width*scale),x=left+c*scale-w/2,h=i%2?90:116,y=210-h/2;s.appendChild(E('rect',{x,y,width:w,height:h,fill:'#fff',stroke:'#5d5549','stroke-width':5}));s.appendChild(E('rect',{x:x+9,y:y+9,width:Math.max(8,w-18),height:Math.max(8,h-18),fill:'#dbe5df'}))});nums(s,d,left,scale,344);dims(s,d,left,right,scale,'Frame')}
else{s.appendChild(E('rect',{x:left,y:174,width:right-left,height:54,rx:14,fill:'#eef2ed',stroke:'#cbd4cb'}));d.centers.forEach(c=>s.appendChild(E('rect',{x:left+(c-d.width/2)*scale,y:142,width:Math.max(12,d.width*scale),height:86,rx:9,fill:'#176b43'})));nums(s,d,left,scale,344);dims(s,d,left,right,scale,'Item')}}
