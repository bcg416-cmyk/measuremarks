
export function gcd(a,b){while(b){[a,b]=[b,a%b]}return a}
export function toFraction(v,d=16){const s=v<0?'-':'';v=Math.abs(v);let w=Math.floor(v+1e-10),n=Math.round((v-w)*d);if(n===d){w++;n=0}if(n===0)return `${s}${w}"`;const g=gcd(n,d);return `${s}${w?w+' ':''}${n/g}/${d/g}"`}
export function formatValue(v,u='imperial',d=16,exact=false){if(u==='metric')return exact?`${v.toFixed(2)} mm`:`${v.toFixed(1)} mm`;return exact?`${v.toFixed(4).replace(/0+$/,'').replace(/\.$/,'')}"`:toFraction(v,d)}
export function equalSpacing(span,width,count,edge='equal'){let gap,firstCenter,centerStep;if(edge==='equal'){gap=(span-count*width)/(count+1);firstCenter=gap+width/2;centerStep=width+gap}else{gap=(span-count*width)/(count-1);firstCenter=width/2;centerStep=width+gap}return{gap,firstCenter,centerStep,centers:Array.from({length:count},(_,i)=>firstCenter+i*centerStep)}}
export function roundedMarks(vals,u='imperial',d=16){return vals.map(v=>u==='metric'?Math.round(v*10)/10:Math.round(v*d)/d)}


export function feetInchesToInches(feet=0,inches=0){
  return (Number(feet)||0)*12 + (Number(inches)||0);
}
export function inchesToFeetParts(totalInches=0){
  const sign=totalInches<0?-1:1;
  const abs=Math.abs(totalInches);
  const feet=Math.floor(abs/12);
  const inches=(abs-feet*12)*sign;
  return {feet:feet*sign,inches};
}
