// Tournée : ce qui voyage, et comment ça entre dans des cases Pelican en soute.
import * as THREE from 'three';
import { cbox, rod } from './util.js';
import { HP, PELICAN } from './data.js';
import { standDims } from './stands.js';
import { PAD_OFF } from './assembly.js';
import { optics, GAP, secteurs } from './optics.js';
import { buildScreen, TUBE, MAT_D } from './screen.js';
import { SUB, TRAY } from './tech.js';
import { AMPLI } from './interieur.js';

export const SOUTE = { kg:23, max:32, tol:.3, somme:158, src:'https://www.aircanada.com/ca/en/aco/home/plan/baggage/checked.html' };
const COL = { inst:'#3a4190', son:'#26272b', stand:'#b9bbbf', ecran:'#e9e8e4', optique:'#c4232c', tech:'#d2a62c' };
export const colOf = g => COL[g];

// kg/m d'un tube d'alu
const kt=(d,e)=>Math.PI*(d*d-(d-2*e)*(d-2*e))/4*2700;
// coupe une longueur en morceaux qui entrent dans la case
const parts=(L,max)=>Math.max(1,Math.ceil(L/max-1e-6));

// Les objets à emporter, en mm (mousse de 5 mm comprise), avec leur groupe
export function items(s){
  const out=[], add=(g,nom,n,l,w,h,kg,note)=>{ for(let i=0;i<n;i++) out.push({ g,nom,l:l*1000+10,w:w*1000+10,h:h*1000+10,kg,note }); }, sur=[], cab=[];
  const O=optics(s), H=HP[s.hp], Hs=s.padH/1000-PAD_OFF, m=standDims(s.stand,Hs,s.hp), max=Math.max(...PELICAN[s.tCase].int)/100-.035;
  add('inst','Instrument (case, FLOU, Pandore)',3,.2664,.1789,.105,3.2);
  add('inst',s.tBase==='creuse'?'Base molle creuse':'Base molle pleine',3,.2664,.1789,.08,s.tBase==='creuse'?1.9:4.3);
  const hb=(s.stand==='A'?Hs:m.sh)-m.yh, wood=2*(m.W*m.D+m.W*hb+m.D*hb)*.009*700;
  add('son',`Caisson ${H.po}, ampli et filtres compris`,3,m.W,m.D,hb,wood+2*H.kg+AMPLI.kg+.3);
  const hc=m.yh-m.y0, hc2=s.stand==='B'?Hs-m.sh:0, L=hc+hc2, p=parts(L,max);
  add('stand',`Mât du stand, en ${p>1?p+' bouts':'un bout'}`,3,L/p,.042*p,.042,L*kt(.038,.003)+.15);
  if(s.tCol==='tole'){ const q=parts(Math.max(hc,hc2),max); add('stand','Tôles d’alu à plat (1,5 mm)',3,Math.max(m.W,m.D),Math.max(hc,hc2)/q,(hc2?8:4)*q*.002,2*(m.W+m.D)*L*.0015*2700*(hc2?.8:1)); }
  else add('stand','Housse de tissu tendu',3,.26,.2,.025,.35);
  add('stand','Pied en croix pliante',3,Math.max(...m.F)*1.12,.06,.045,1.1);
  if(s.mic==='bras'&&s.tMic) add('stand','Bras de micro plié',3,.42,.06,.045,.9); else sur.push('Pieds de micro');
  if(s.tCab) cab.push('Trois micros'); else add('stand','Micro',3,.19,.07,.06,.35);
  // écran : le dessus
  if(O.vinyle){ add('ecran','Vinyle roulé en bandes',1,max,.12,.12,Math.PI*O.R**2*.6+.4); }
  else {
    const ch=2*O.Rt*Math.sin(Math.PI/12), sag=O.Rt*(1-Math.cos(Math.PI/12));
    add('ecran','Anneau : six arcs emboîtés',2,ch,sag+6*TUBE,TUBE,Math.PI*O.Rt*kt(TUBE,.003)+.45);
    add('ecran','Nœuds, pieds courts et manchons',1,.25,.19,.07,1.9);
    add('ecran',s.sys==='dessous'?'Toile grise pliée':'Toile blanche pliée',1,.4,.28,.05,Math.PI*(O.Rt+.08)**2*.45+.9);
    const leg=Math.hypot(O.Rt-O.Rf,Math.max(O.H-.06,0)); if(leg>.03){ const q=parts(leg,max), n=6*q, c=Math.ceil(n/3); add('ecran',`Pieds${q>1?`, en ${q} bouts`:''}`,1,leg/q+.02,c*.04,.12,6*leg*kt(TUBE,.003)+.05*n); }
    if(s.sys==='dessous'||O.H>.2){ const tr=O.Rf-.012, q=parts(tr,max), n=6*q, c=Math.ceil(n/3); add('ecran',`Traverses${q>1?`, en ${q} bouts`:''}`,1,tr/q+.02,c*.024,.072,6*tr*kt(.022,.002)+.02*n); }
    if(O.H>=.16) add('ecran','Jupe pliée',1,.4,.28,.07,Math.PI*(O.Rt+O.Rf)*(O.H-.07)*.35);
  }
  // image
  const P=O.P, proj=(w,d,h,kg)=>{ if(P.lieu) sur.push('Projecteur du lieu'); else if(s.tProj) add('optique',`Projecteur ${P.court}`,1,w+.03,d+.03,h+.03,kg); else sur.push(`Projecteur ${P.court}`); };
  if(s.sys==='dessous'&&O.f){ const F=O.f, b=buildScreen(s).banc, q=b.n; proj(P.w,P.dep,P.up+P.dn,P.kg); add('optique',`Banc optique, ${q} panneaux`,1,b.l/q,b.w,q*.014+.006,b.l*b.w*8.4+.5); add('optique','Berceau et jambes',1,.4,.2,.07,2.4); if(s.miroir==='papier'){ const n=secteurs(O.mr,s); add('optique',`Disque miroir, ${n} secteurs`,1,Math.max(O.mr,2*O.mr*Math.sin(Math.PI/n)),O.mr*Math.sin(Math.min(2*Math.PI/n,Math.PI/2)),n*.005,Math.PI*O.mr**2*3.8+.6); } else add('optique','Miroir de verre',1,2*O.mr,2*O.mr,.03,Math.PI*O.mr**2*10,'trop grand : à acheter sur place ou à expédier à plat'); }
  else if(s.sys==='mat'){ const k=O.m, cl=(-k.xa+GAP+P.dep+.07)-(k.xm-.05), cw=P.w+.07, ch=k.top-(k.yA-P.h/2-.02); proj(P.w,P.dep,P.h,P.kg); add('optique','Caisson, tôles à plat',1,cl/2,cw,.04,(2*(cl*cw+cl*ch+cw*ch))*.8*.0015*2700); add('optique','Miroir',1,k.ml,k.mw,.02,k.ml*k.mw*7.5+.3); if(s.accroche==='rail') add('optique','Accroche 80/20, profilé en trois bouts',1,.44,.09,.06,2.4); else { add('optique','Mât, deux sections',2,1.19,MAT_D,MAT_D,1.19*kt(MAT_D,.004),'1,2 m : hors case'); sur.push('Platine de 28 kg et poids'); } }
  else if(s.sys==='sol'){ proj(P.w,P.dep,P.h,P.kg); if(!P.lieu) add('optique','Crochet et élingue',1,.2,.1,.08,1.2); }
  else if(s.sys==='portique'){ const k=O.p; proj(P.dim[0],P.dim[1],P.dim[2],P.kg); add('optique','Pied de portique',6,1.2,.07,.07,1.2*kt(.07,.004)+.5,'1,2 m : hors case'); if(k.mir) add('optique','Miroir du portique',1,k.mirH,k.mirW,.02,k.mirH*k.mirW*10); sur.push('Platines et traverses'); }
  // technique
  if(s.tCab) cab.push('Ordinateur, commutateur'); else add('tech','Ordinateur, commutateur, courant',1,TRAY.w,TRAY.d,TRAY.h,TRAY.kg); add('tech','Câbles et blocs d’alimentation',1,.3,.22,.1,4.2); add('tech','Outils, goupilles, rechanges',1,.22,.16,.07,1.4);
  if(s.sub&&s.tSub) add('tech',SUB.nom,1,SUB.w,SUB.d,SUB.h,SUB.kg); else if(s.sub) sur.push('Sub'); if(s.sat) sur.push('Trois enceintes sur pied');
  sur.push('Lest des stands (3 × 10 kg)');
  return { list:out, sur, cab };
}

// ------------------------------------------------ emballage
const PERM=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
function packOnce(list,C,n,rnd){
  const K=Array.from({length:n},()=>({ put:[],ep:[[0,0,0]],kg:0 })), left=[];
  const ord=list.map((it,i)=>({ it,i,v:it.l*it.w*it.h*(1+rnd()*.7)*(Math.max(it.l,it.w,it.h)>C[0]*.8?2:1) })).sort((a,b)=>b.v-a.v);
  for(const { it,i } of ord){
    const D=[it.l,it.w,it.h]; let best=null;
    const ks=K.map((k,j)=>[k.kg+(rnd()-.5)*4,j]).sort((a,b)=>a[0]-b[0]);
    for(const [,j] of ks){ const k=K[j];
      for(const e of k.ep) for(const p of PERM){ const d=[D[p[0]],D[p[1]],D[p[2]]]; if(e[0]+d[0]>C[0]+.01||e[1]+d[1]>C[1]+.01||e[2]+d[2]>C[2]+.01) continue;
        if(k.put.some(q=>e[0]<q.p[0]+q.d[0]-.01&&q.p[0]<e[0]+d[0]-.01&&e[1]<q.p[1]+q.d[1]-.01&&q.p[1]<e[1]+d[1]-.01&&e[2]<q.p[2]+q.d[2]-.01&&q.p[2]<e[2]+d[2]-.01)) continue;
        const sc=e[2]+d[2]*.6+(e[0]+e[1])*.05; if(!best||sc<best.sc) best={ sc,j,e,d }; }
      if(best) break; }
    if(!best){ left.push(i); continue; }
    const k=K[best.j]; k.put.push({ i,p:best.e,d:best.d }); k.kg+=it.kg; k.ep=k.ep.filter(e=>e!==best.e);
    const [x,y,z]=best.e,[a,b,c]=best.d; let zz; const drop=(X,Y)=>{ zz=0; k.put.forEach(q=>{ if(X>=q.p[0]&&X<q.p[0]+q.d[0]-.01&&Y>=q.p[1]&&Y<q.p[1]+q.d[1]-.01) zz=Math.max(zz,q.p[2]+q.d[2]); }); return zz; };
    k.ep.push([x+a,y,z],[x,y+b,z],[x,y,z+c]); if(x+a<C[0]) k.ep.push([x+a,y,drop(x+a,y)]); if(y+b<C[1]) k.ep.push([x,y+b,drop(x,y+b)]);
  }
  return { K,left };
}
const PK=new Map();
export function pack(s,essais=420){
  const { list,sur,cab }=items(s), cs=PELICAN[s.tCase], C=cs.int.map(v=>v*10), fits=it=>{ const a=[it.l,it.w,it.h].sort((x,y)=>y-x); return a.every((v,i)=>v<=C[i]+.01); };
  const key=JSON.stringify([s.tCase,s.tN,essais,list.map(i=>[i.nom,Math.round(i.l),Math.round(i.w),Math.round(i.h),+i.kg.toFixed(2)])]); if(PK.has(key)) return { ...PK.get(key),sur,cab };
  const ok=list.filter(fits), hors=list.filter(i=>!fits(i)); let sd=5; const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647; let best=null;
  for(let t=0;t<essais;t++){ const r=packOnce(ok,C,s.tN,t?rnd:()=>.5), vl=r.left.reduce((a,i)=>a+ok[i].l*ok[i].w*ok[i].h,0)/1e6, mx=Math.max(...r.K.map(k=>k.kg)), sc=vl*1000+mx; if(!best||sc<best.sc) best={ ...r,sc }; if(!r.left.length&&mx+cs.kg<=SOUTE.kg) break; }
  const out={ cs,C,ok,hors,sur,cab,cases:best.K.map(k=>({ put:k.put,net:k.kg,kg:k.kg+cs.kg,fill:k.put.reduce((a,q)=>a+q.d[0]*q.d[1]*q.d[2],0)/(C[0]*C[1]*C[2]) })),left:best.left.map(i=>ok[i]),somme:cs.ext.reduce((a,b)=>a+b,0),total:list.reduce((a,i)=>a+i.kg,0) };
  PK.set(key,out); return out;
}
// regroupe une liste d'objets par nom
export const resume=L=>{ const m=new Map(); L.forEach(i=>{ const q=m.get(i.nom)||{ ...i,n:0,tot:0 }; q.n++; q.tot+=i.kg; m.set(i.nom,q); }); return [...m.values()]; };

// ------------------------------------------------ vue 3D
export function buildTransport(s){
  const g=new THREE.Group(), p=pack(s), E=p.cs.ext.map(v=>v/100), I=p.cs.int.map(v=>v/100), o={ g,p,boxes:[],labels:[] }, n=p.cases.length, pas=E[0]+.22, cols=Math.min(n,2), tr=(E[0]-I[0])/2, td=(E[1]-I[1])/2, bas=.035;
  const shell=new THREE.MeshPhysicalMaterial({color:'#23252a',roughness:.6,transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide}), solid=new THREE.MeshStandardMaterial({color:'#23252a',roughness:.65});
  p.cases.forEach((c,k)=>{
    const q=new THREE.Group(); q.position.set((k%cols-(cols-1)/2)*pas,0,Math.floor(k/2)*(E[1]+.5)-(n>2?.45:0)); g.add(q); const W=E[0]/2, D=E[1]/2, hB=E[2]*.68;
    cbox(q,[-W+.02,0,-D+.02],[W-.02,bas,D-.02],solid,.012);
    [[[-W,bas-.01,-D],[W,hB,-D+td*.6]],[[-W,bas-.01,D-td*.6],[W,hB,D]],[[-W,bas-.01,-D],[-W+tr*.6,hB,D]],[[W-tr*.6,bas-.01,-D],[W,hB,D]]].forEach(b=>{ const m=cbox(q,b[0],b[1],shell,.006); m.castShadow=false; m.renderOrder=3; });
    for(const x of [-W*.55,W*.55]) cbox(q,[x-.035,hB-.09,D],[x+.035,hB-.01,D+.018],solid,.006); cbox(q,[-.11,hB-.1,D],[.11,hB-.07,D+.03],solid,.008); [-W+.05,W-.05].forEach(x=>rod(q,[x-.02,.035,-D-.005],[x+.02,.035,-D-.005],.035,solid));
    // couvercle ouvert
    const lid=new THREE.Group(); lid.position.set(0,hB,-D); lid.rotation.x=-1.75; q.add(lid); const lh=E[2]-hB; cbox(lid,[-W,lh-.02,0],[W,lh,E[1]],solid,.012); [[[-W,0,0],[W,lh,.014]],[[-W,0,E[1]-.014],[W,lh,E[1]]],[[-W,0,0],[-W+.014,lh,E[1]]],[[W-.014,0,0],[W,lh,E[1]]]].forEach(b=>cbox(lid,b[0],b[1],solid,.004));
    c.put.forEach(b=>{ const it=p.ok[b.i], m=MAT(it.g), a=b.p.map(v=>v/1000), d=b.d.map(v=>v/1000), e=.003, box=cbox(q,[-I[0]/2+a[0]+e,bas+a[2]+e,-I[1]/2+a[1]+e],[-I[0]/2+a[0]+d[0]-e,bas+a[2]+d[2]-e,-I[1]/2+a[1]+d[1]-e],m,.008); box.userData.y=box.position.y; box.userData.it=it; o.boxes.push(box); });
    o.labels.push([`Case ${k+1} : ${c.kg.toLocaleString('fr-CA',{maximumFractionDigits:1,minimumFractionDigits:1})} kg`,new THREE.Vector3(q.position.x,.04,q.position.z+D+.14)]);
  });
  o.setExplode=e=>o.boxes.forEach(b=>{ b.position.y=b.userData.y+(b.userData.y-bas)*e*2.4+e*.12; });
  return o;
}
const MC={}; const MAT=g=>MC[g]??=new THREE.MeshStandardMaterial({color:COL[g],roughness:.6});
