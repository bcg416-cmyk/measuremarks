
/* MeasureMarks shared site bootstrap + calculator fallback.
   The fallback only starts when the ES-module calculator did not initialize. */
if ('serviceWorker' in navigator) {
  const isDevHost = location.hostname.includes('measuremarks-dev') || location.hostname.startsWith('dev.');
  if (isDevHost) {
    window.addEventListener('load', async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter(k => k.startsWith('measuremarks-')).map(k => caches.delete(k)));
        }
      } catch {}
    });
  } else {
    window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}));
  }
}

(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);

  function startFallbackIfNeeded() {
    const calculateButton = $('#calculate');
    const exactGap = $('#exactGap');
    if (!calculateButton || !exactGap || exactGap.textContent.trim() !== '—') return;

    const tool = document.body.dataset.tool || 'equal';
    const config = {
      equal:     { name:'Equal Spacing', item:'Item', span:96, width:2.5, count:7 },
      fence:     { name:'Fence Pickets', item:'Picket', span:96, width:3.5, count:11 },
      posts:     { name:'Fence Posts', item:'Post', span:192, width:3.5, count:5 },
      balusters: { name:'Balusters', item:'Baluster', span:36, width:1.5, count:11 },
      batten:    { name:'Board & Batten', item:'Batten', span:144, width:2.5, count:8 },
      wainscot:  { name:'Wainscoting', item:'Stile', span:144, width:2.5, count:7 },
      slats:     { name:'Wall Slats', item:'Slat', span:120, width:1.5, count:12 },
      tile:      { name:'Tile Layout', item:'Tile', span:96, width:12, count:7 },
      pictures:  { name:'Picture Hanging', item:'Frame', span:96, width:16, count:4 },
      hardware:  { name:'Cabinet Hardware', item:'Door/Drawer', span:72, width:14, count:4 },
      lights:    { name:'Recessed Lights', item:'Fixture', span:144, width:6, count:5 }
    }[tool];

    if (!config) return;

    const E = {
      span: $('#span'), spanFeet: $('#spanFeet'), spanInches: $('#spanInches'),
      spanMode: $('#spanMode'), spanDecimalWrap: $('#spanDecimalWrap'), spanFeetWrap: $('#spanFeetWrap'),
      width: $('#itemWidth'), count: $('#count'), edge: $('#edgeMode'), precision: $('#precision'),
      exact: $('#exactGap'), gap: $('#roundedGap'), center: $('#centerSpacing'),
      title: $('#resultTitle'), marks: $('#marks'), marksTitle: $('#marksTitle'),
      precLabel: $('#precisionLabel'), diagram: $('#diagram'), printDiagram: $('#printDiagram'),
      planProject: $('#planProject'), planDimensions: $('#planDimensions'), planGap: $('#planGap'),
      printMarks: $('#printMarks'), overlay: $('#fieldOverlay'), fieldCounter: $('#fieldCounter'),
      fieldValue: $('#fieldValue'), fieldLabel: $('#fieldLabel')
    };

    let units = 'imperial';
    let data = null;
    let fieldIndex = 0;

    function gcd(a,b){ while (b) [a,b] = [b,a%b]; return a; }
    function fraction(v, d=16){
      const sign = v < 0 ? '-' : '';
      v = Math.abs(v);
      let whole = Math.floor(v + 1e-10);
      let num = Math.round((v-whole)*d);
      if (num === d) { whole++; num = 0; }
      if (!num) return sign + whole + '"';
      const g = gcd(num,d);
      return sign + (whole ? whole + ' ' : '') + (num/g) + '/' + (d/g) + '"';
    }
    function fmt(v, exact=false){
      const d = Number(E.precision.value || 16);
      if (units === 'metric') return exact ? v.toFixed(2) + ' mm' : v.toFixed(1) + ' mm';
      return exact ? v.toFixed(4).replace(/0+$/,'').replace(/\.$/,'') + '"' : fraction(v,d);
    }
    function getSpan(){
      if (units === 'imperial' && E.spanMode && E.spanMode.value === 'feet') {
        return (Number(E.spanFeet.value)||0)*12 + (Number(E.spanInches.value)||0);
      }
      return Number(E.span.value);
    }
    function syncSpanMode(){
      if (!E.spanMode) return;
      const feetMode = units === 'imperial' && E.spanMode.value === 'feet';
      E.spanDecimalWrap?.classList.toggle('hidden', feetMode);
      E.spanFeetWrap?.classList.toggle('hidden', !feetMode);
      E.spanMode.disabled = units !== 'imperial';
    }
    function preset(){
      if (units === 'imperial') {
        E.span.value = config.span;
        E.width.value = config.width;
        if (E.spanFeet && E.spanInches) {
          E.spanFeet.value = Math.floor(config.span/12);
          E.spanInches.value = config.span % 12;
        }
      } else {
        E.span.value = Math.round(config.span*25.4);
        E.width.value = Math.round(config.width*25.4);
      }
      E.count.value = config.count;
    }
    function draw(svg, d){
      if (!svg) return;
      const NS='http://www.w3.org/2000/svg';
      const mk=(tag,attrs,text='')=>{
        const n=document.createElementNS(NS,tag);
        Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));
        if(text) n.textContent=text;
        return n;
      };
      svg.innerHTML='';
      svg.appendChild(mk('rect',{x:0,y:0,width:980,height:410,rx:14,fill:'#fbfcfa'}));
      const left=72,right=908,scale=(right-left)/d.span;
      const title = config.name + ' layout';
      svg.appendChild(mk('text',{x:58,y:34,'font-size':18,'font-weight':850,fill:'#18211a'},title));

      if (tool==='fence') {
        [140,265].forEach(y=>svg.appendChild(mk('rect',{x:left-10,y,width:right-left+20,height:16,rx:4,fill:'#af8b61'})));
      } else if (tool==='balusters') {
        [122,275].forEach(y=>svg.appendChild(mk('rect',{x:left-12,y,width:right-left+24,height:22,rx:4,fill:'#8d673f'})));
      } else {
        svg.appendChild(mk('rect',{x:left,y:150,width:right-left,height:130,rx:5,fill:'#eef2ed',stroke:'#cbd4cb'}));
      }

      d.centers.forEach((c,i)=>{
        const cx=left+c*scale;
        const w=Math.max(5,d.width*scale);
        let y=125,h=160,fill='#176b43';
        if(tool==='fence'){y=112;h=190;fill='#d8b17a';}
        else if(tool==='balusters'){y=144;h=131;fill='#d6dade';}
        else if(tool==='slats'){y=150;h=130;fill='#b98350';}
        else if(tool==='batten'||tool==='wainscot'){y=150;h=130;fill='#d8d1c1';}
        else if(tool==='posts'){y=120;h=165;fill='#8a6543';}
        else if(tool==='lights'){
          svg.appendChild(mk('circle',{cx,cy:214,r:18,fill:'#fff9d8',stroke:'#9a9787','stroke-width':2}));
          return;
        } else if(tool==='pictures'){
          svg.appendChild(mk('rect',{x:cx-Math.max(20,w)/2,y:165,width:Math.max(40,w),height:95,fill:'#fff',stroke:'#5d5549','stroke-width':4}));
          return;
        } else if(tool==='hardware'){
          svg.appendChild(mk('circle',{cx,cy:214,r:6,fill:'#5d5549'}));
          return;
        } else if(tool==='tile'){y=150;h=130;fill=i%2?'#ddd7ca':'#ebe5d9';}
        svg.appendChild(mk('rect',{x:cx-w/2,y,width:w,height:h,rx:3,fill}));
      });

      d.centers.forEach((c,i)=>{
        const x=left+c*scale;
        svg.appendChild(mk('line',{x1:x,y1:310,x2:x,y2:330,stroke:'#176b43','stroke-width':1.5}));
        svg.appendChild(mk('text',{x,y:348,'text-anchor':'middle','font-size':11,fill:'#667067'},String(i+1)));
      });
      svg.appendChild(mk('line',{x1:left,y1:382,x2:right,y2:382,stroke:'#344039','stroke-width':1.4}));
      svg.appendChild(mk('text',{x:(left+right)/2,y:374,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'#18211a'},'Total span: '+fmt(d.span)));
    }

    function calculate(){
      const span=getSpan(), width=Number(E.width.value), count=Math.max(2,Math.floor(Number(E.count.value)||0));
      const precision=Number(E.precision.value||16);
      if (!(span>0) || !(width>0) || count<2 || count*width>span) {
        E.marks.innerHTML='<div class="mark"><strong>Check dimensions</strong><small>Total item width cannot exceed the span.</small></div>';
        return;
      }
      let gap,firstCenter,centerStep;
      if (E.edge.value === 'equal') {
        gap=(span-count*width)/(count+1);
        firstCenter=gap+width/2;
        centerStep=width+gap;
      } else {
        gap=(span-count*width)/(count-1);
        firstCenter=width/2;
        centerStep=width+gap;
      }
      const centers=Array.from({length:count},(_,i)=>firstCenter+i*centerStep);
      const marks=centers.map(v=>units==='metric'?Math.round(v*10)/10:Math.round(v*precision)/precision);
      const practicalGap=units==='metric'?Math.round(gap*10)/10:Math.round(gap*precision)/precision;
      data={span,width,count,gap,centerStep,centers,marks,practicalGap};

      E.title.textContent=config.name+' layout';
      E.exact.textContent=fmt(gap,true);
      E.gap.textContent=fmt(practicalGap);
      E.center.textContent=fmt(centerStep);
      E.marksTitle.textContent=config.item+' center marks';
      E.precLabel.textContent=units==='metric'?'Rounded to nearest 0.1 mm':'Rounded to nearest 1/'+precision+'"';
      E.marks.innerHTML=marks.map((v,i)=>'<div class="mark"><small>Mark '+(i+1)+'</small><strong>'+fmt(v)+'</strong></div>').join('');
      E.planProject.textContent=config.name;
      E.planDimensions.textContent=fmt(span)+' span · '+count+' '+config.item.toLowerCase()+(count===1?'':'s')+' · '+fmt(width)+' width';
      E.planGap.textContent=fmt(practicalGap);
      E.printMarks.innerHTML=marks.map((v,i)=>'<li>Mark '+(i+1)+': <strong>'+fmt(v)+'</strong></li>').join('');
      draw(E.diagram,data); draw(E.printDiagram,data);
      fieldIndex=0; renderField();
    }
    function renderField(){
      if(!data) return;
      E.fieldCounter.textContent='MARK '+(fieldIndex+1)+' OF '+data.marks.length;
      E.fieldValue.textContent=fmt(data.marks[fieldIndex]);
      E.fieldLabel.textContent=config.item.toUpperCase()+' CENTER';
    }

    calculateButton.addEventListener('click',calculate);
    [E.span,E.spanFeet,E.spanInches,E.width,E.count,E.edge,E.precision].filter(Boolean).forEach(x=>{
      x.addEventListener('input',calculate); x.addEventListener('change',calculate);
    });
    E.spanMode?.addEventListener('change',()=>{syncSpanMode();calculate();});
    document.querySelectorAll('.seg').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); units=b.dataset.units;
      E.span.step=units==='metric'?1:.0625; E.width.step=units==='metric'?1:.0625;
      preset(); syncSpanMode(); calculate();
    }));
    $('#openField')?.addEventListener('click',()=>{ if(data){E.overlay.hidden=false;fieldIndex=0;renderField();} });
    $('#closeField')?.addEventListener('click',()=>E.overlay.hidden=true);
    $('#prevMark')?.addEventListener('click',()=>{if(data){fieldIndex=(fieldIndex-1+data.marks.length)%data.marks.length;renderField();}});
    $('#nextMark')?.addEventListener('click',()=>{if(data){fieldIndex=(fieldIndex+1)%data.marks.length;renderField();}});
    document.querySelectorAll('.print-button').forEach(b=>b.addEventListener('click',()=>window.print()));
    $('#mobileField')?.addEventListener('click',()=>$('#openField')?.click());
    $('#mobilePrint')?.addEventListener('click',()=>window.print());

    preset(); syncSpanMode(); calculate();
    console.warn('MeasureMarks: module calculator did not initialize; classic fallback loaded.');
  }

  window.addEventListener('load', () => setTimeout(startFallbackIfNeeded, 250));
})();


/* Google Privacy & Messaging hooks. These become active when the Google CMP/API is loaded. */
(() => {
  function privacyFallback(message) {
    let box = document.querySelector('.privacy-unavailable');
    if (!box) {
      box = document.createElement('div');
      box.className = 'privacy-unavailable';
      box.setAttribute('role','status');
      const host = document.querySelector('.legal-content') || document.querySelector('main') || document.body;
      host.appendChild(box);
    }
    box.textContent = message;
    box.scrollIntoView({behavior:'smooth',block:'center'});
  }

  document.querySelectorAll('[data-privacy-action]').forEach(control => {
    control.addEventListener('click', e => {
      e.preventDefault();
      const action = control.dataset.privacyAction;
      if (action === 'eu') {
        if (window.googlefc && typeof window.googlefc.showRevocationMessage === 'function') {
          window.googlefc.showRevocationMessage();
        } else {
          privacyFallback('Privacy and cookie controls will be available here once Google consent messaging is active for MeasureMarks.');
        }
      }
      if (action === 'us') {
        const api = window.googlefc && window.googlefc.usstatesoptout;
        if (api && typeof api.openConfirmationDialog === 'function') {
          api.openConfirmationDialog(() => {});
        } else {
          privacyFallback('The U.S. state opt-out control will become active here once Google Privacy & messaging is published for MeasureMarks.');
        }
      }
    });
  });
})();

/* MeasureMarks blueprint viewer + Save/PDF actions */
(() => {
  const diagram = document.querySelector('#diagram');
  if (!diagram) return;

  const shell = diagram.closest('.diagram-shell');
  if (!shell) return;

  shell.classList.add('blueprint-preview');
  shell.setAttribute('tabindex','0');
  shell.setAttribute('role','button');
  shell.setAttribute('aria-label','Open enlarged blueprint');

  if (!shell.nextElementSibling?.classList.contains('blueprint-preview-help')) {
    const help = document.createElement('div');
    help.className = 'blueprint-preview-help';
    help.innerHTML = '<button type="button" class="blueprint-expand-link">Tap blueprint to enlarge</button>';
    shell.insertAdjacentElement('afterend', help);
  }

  const viewer = document.createElement('div');
  viewer.className = 'blueprint-viewer';
  viewer.hidden = true;
  viewer.setAttribute('role','dialog');
  viewer.setAttribute('aria-modal','true');
  viewer.setAttribute('aria-label','Enlarged project blueprint');
  viewer.innerHTML = '<div class="blueprint-viewer-toolbar"><strong>Blueprint</strong><div><button type="button" class="blueprint-pdf">Save / PDF</button><button type="button" class="blueprint-close" aria-label="Close enlarged blueprint">×</button></div></div><div class="blueprint-viewer-stage"></div><p class="blueprint-viewer-tip">Turn your phone sideways for the largest view. You can also scroll the drawing if needed.</p>';
  document.body.appendChild(viewer);

  const stage = viewer.querySelector('.blueprint-viewer-stage');
  const close = viewer.querySelector('.blueprint-close');

  function openViewer() {
    const live = document.querySelector('#diagram');
    if (!live) return;
    stage.innerHTML = '';
    const clone = live.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('blueprint-expanded-svg');
    clone.setAttribute('aria-label','Enlarged project blueprint');
    stage.appendChild(clone);
    viewer.hidden = false;
    document.body.classList.add('blueprint-viewer-open');
    close.focus();
  }
  function closeViewer() {
    viewer.hidden = true;
    document.body.classList.remove('blueprint-viewer-open');
    shell.focus();
  }

  shell.addEventListener('click', openViewer);
  shell.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openViewer(); }
  });
  document.querySelector('.blueprint-expand-link')?.addEventListener('click', openViewer);
  close.addEventListener('click', closeViewer);
  viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !viewer.hidden) closeViewer(); });

  viewer.querySelector('.blueprint-pdf').addEventListener('click', () => window.print());

  const resultActions = document.querySelector('.result-head .inline-actions');
  if (resultActions && !resultActions.querySelector('.pdf-button')) {
    const pdf = document.createElement('button');
    pdf.type = 'button';
    pdf.className = 'small-btn pdf-button';
    pdf.textContent = 'Save / PDF';
    pdf.addEventListener('click', () => window.print());
    resultActions.appendChild(pdf);
  }

  const mobileBar = document.querySelector('.mobile-bar');
  if (mobileBar && !mobileBar.querySelector('.mobile-pdf')) {
    const pdf = document.createElement('button');
    pdf.type = 'button';
    pdf.className = 'mobile-pdf';
    pdf.textContent = 'Save / PDF';
    pdf.addEventListener('click', () => window.print());
    mobileBar.appendChild(pdf);
  }
})();

/* Shared calculator accessibility: semantic installation marks, status,
   SVG summaries and modal keyboard support. Visual layouts are unchanged. */
(() => {
  const marks = document.getElementById('marks');
  if (!marks) return;
  const heading = document.getElementById('marksTitle');
  marks.setAttribute('role','list');
  if (heading) {
    if (!heading.id) heading.id='marksTitle';
    marks.setAttribute('aria-labelledby',heading.id);
  } else marks.setAttribute('aria-label','Installation marks');
  function updateMarks() {
    for (const el of marks.querySelectorAll('.mark')) {
      el.setAttribute('role','listitem');
      const parts=[...el.children].map(node=>node.textContent.trim()).filter(Boolean);
      const description=parts.join('. ');
      if (description && el.getAttribute('aria-label')!==description) el.setAttribute('aria-label',description);
    }
  }
  updateMarks();
  new MutationObserver(updateMarks).observe(marks,{childList:true,subtree:true,characterData:true});
  const note=document.getElementById('resultNote');
  if(note){note.setAttribute('role','status');note.setAttribute('aria-live','polite');note.setAttribute('aria-atomic','true');}
  const unitButtons=document.querySelectorAll('.seg[data-units]');
  function syncUnitButtons(){unitButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))));}
  syncUnitButtons();
  unitButtons.forEach(b=>b.addEventListener('click',syncUnitButtons));
  const field=document.getElementById('fieldOverlay');
  if(field){
    let previousFocus=null;
    const opener=document.getElementById('openField'),mobile=document.getElementById('mobileField'),closer=document.getElementById('closeField');
    for(const button of [opener,mobile])button?.addEventListener('click',()=>{
      previousFocus=button;
      queueMicrotask(()=>{if(!field.hidden)closer?.focus();});
    });
    closer?.addEventListener('click',()=>queueMicrotask(()=>previousFocus?.focus()));
    const value=document.getElementById('fieldValue'),counter=document.getElementById('fieldCounter'),label=document.getElementById('fieldLabel');
    const announced=document.createElement('div');
    announced.setAttribute('role','status');announced.setAttribute('aria-live','polite');announced.setAttribute('aria-atomic','true');
    announced.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';
    field.appendChild(announced);
    const announce=()=>{if(!field.hidden)announced.textContent=[counter?.textContent,value?.textContent,label?.textContent].filter(Boolean).join('. ');};
    if(value)new MutationObserver(announce).observe(value,{childList:true,characterData:true,subtree:true});
    for(const b of [opener,mobile])b?.addEventListener('click',()=>queueMicrotask(announce));
    field.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();closer?.click();}
      if(e.key==='Tab'){
        const focusables=[...field.querySelectorAll('button:not([disabled])')].filter(n=>n.getClientRects().length);
        if(!focusables.length)return;
        const first=focusables[0],last=focusables[focusables.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
  }
  const svg=document.getElementById('diagram');
  if(svg){
    const headingText=document.querySelector('h1')?.textContent?.trim()||'Project';
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',headingText+' blueprint. Exact installation marks are listed below the diagram.');
    const print=document.getElementById('printDiagram');
    if(print){print.setAttribute('role','img');print.setAttribute('aria-label',headingText+' printable blueprint. Coordinates are also included in the print mark list.');}
  }
})();
