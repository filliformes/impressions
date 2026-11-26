// L'intérieur d'un instrument : haut-parleurs démontés ou en coupe, caisson, filtres, ampli, alimentations.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, rod, loft, dots } from './util.js';
import { HP } from './data.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z), PI=Math.PI;
// Fosi Audio TB10A, d'après son manuel : 130 × 100 × 35 mm hors tout (boutons et bornes compris), 650 g, 24 V 4,5 A, entrée RCA seulement
export const AMPLI={ nom:'Fosi TB10A', w:.1, h:.035, d:.112, kg:.65, volt:24, amp:4.5 };
// puissance propre par canal dans 8 Ω sous 24 V (écrêtage, ponts de 0,24 Ω) et niveau à 1 m
export const ampliW=z=>(AMPLI.volt/(z+.24))**2*z/2;
export const niveau=hp=>HP[hp].db+10*Math.log10(ampliW(8));

// révolution d'un profil fermé (r, x) autour de x ; cut : on ne garde que la moitié arrière, avec ses tranches
export function rev(g,pts,mat,cut,seg=72){
  const P=pts.map(p=>new THREE.Vector2(p[0],p[1])); P.push(P[0].clone());
  const m=mesh(new THREE.LatheGeometry(P,seg,cut?PI/2:0,cut?PI:PI*2).rotateZ(-PI/2),mat); g.add(m);
  if(cut){ const cm=CUT(mat); for(const s of [1,-1]){ const sh=new THREE.Shape(); pts.forEach(([r,x],i)=>i?sh.lineTo(x,s*r):sh.moveTo(x,s*r)); sh.closePath(); const f=mesh(new THREE.ShapeGeometry(sh),cm,false); f.position.z=.0004; g.add(f); } }
  return m;
}
const CC=new Map(); const CUT=m=>{ if(!CC.has(m)){ const c=m.clone(); c.side=THREE.DoubleSide; c.color=c.color.clone().lerp(new THREE.Color('#ffffff'),.3); c.metalness=Math.min(c.metalness,.3); CC.set(m,c); } return CC.get(m); };
// bande mince suivant une courbe (r, x), d'épaisseur t
export const bande=(c,t)=>[...c,...[...c].reverse().map(([r,x])=>[r,x-t])];

// haut-parleur coaxial démonté, dessiné en 10 po puis mis à l'échelle. Face vers +x. Rend des pièces avec leur écart (userData.ex, m)
export function hpDetail(hp,{cut=false}={}){
  const H=HP[hp], g=new THREE.Group(), L=[]; g.scale.set(H.depth/129,H.d/261,H.d/261);
  const part=(nom,ex)=>{ const p=new THREE.Group(); p.userData={ ex,nom }; g.add(p); L.push(p); return p; };
  let p=part('Guide d’onde de l’aigu',.36); rev(p,bande([[.0335,-.03],[.026,-.036],[.018,-.048],[.013,-.07]],-.0014),M.black,cut); rev(p,[[.0335,-.031],[.0335,-.028],[.0365,-.028],[.0365,-.031]],M.black,cut);
  p=part('Suspension',.285); rev(p,bande([[.118,.0045],[.1165,.0075],[.112,.0105],[.107,.0112],[.102,.0085],[.0985,.003],[.0965,.0015]],.0012),M.surround,cut);
  p=part('Cône',.205); rev(p,bande([[.0985,.0012],[.088,-.009],[.074,-.022],[.06,-.034],[.047,-.044],[.0345,-.0525]],.0016),M.cone,cut);
  p=part('Bobine',.14); rev(p,[[.0318,-.092],[.0318,-.05],[.0326,-.05],[.0326,-.092]],M.kapton,cut); rev(p,[[.0327,-.091],[.0327,-.077],[.0342,-.077],[.0342,-.091]],M.copper,cut);
  p=part('Spider',.078); { const c=[]; for(let i=0;i<=36;i++){ const r=.0345+i/36*.039; c.push([r,-.058+.0021*Math.sin(i/36*PI*9)*(i>1&&i<35?1:0)]); } rev(p,bande(c,.0009),M.spider,cut); }
  p=part('Saladier',0);
  rev(p,[[.1165,-.004],[.1305,-.004],[.1305,.006],[.127,.009],[.1165,.0045]],M.dark,cut); rev(p,[[.066,-.0735],[.079,-.0735],[.079,-.066],[.0735,-.0605],[.072,-.0605],[.072,-.0665],[.066,-.0675]],M.dark,cut);
  for(let i=0;i<8;i++){ const a=i*PI/4+PI/8; if(cut&&Math.cos(a)>.01) continue; const y=Math.sin(a), z=Math.cos(a); rod(p,[-.005,y*.1205,z*.1205],[-.036,y*.112,z*.112],.0052,M.dark,.0052); rod(p,[-.036,y*.112,z*.112],[-.07,y*.0745,z*.0745],.0052,M.dark,.0058); ccyl(p,.0032,.003,[.0085,y*.1235,z*.1235],M.steel,'x',null,12); }
  p=part('Plaque de champ',-.045); rev(p,[[.0355,-.0835],[.066,-.0835],[.066,-.0745],[.0355,-.0745]],M.steel,cut);
  p=part('Aimant néodyme',-.075); rev(p,[[.043,-.0945],[.064,-.0945],[.064,-.084],[.043,-.084]],M.magnet,cut);
  p=part('Culasse',-.1); rev(p,[[.013,-.105],[.066,-.105],[.066,-.095],[.0305,-.095],[.0305,-.0745],[.013,-.0745]],M.grey,cut);
  p=part('Moteur d’aigu',-.14); rev(p,[[.004,-.129],[.046,-.129],[.05,-.126],[.05,-.1055],[.013,-.1055],[.013,-.112],[.004,-.114]],M.black,cut); rev(p,bande([[.021,-.1135],[.014,-.117],[.004,-.1185]],.0008),M.gold,cut);
  g.userData.parts=L; g.userData.setE=e=>L.forEach(q=>{ q.position.x=q.userData.ex*e; }); return g;
}

// filtre passif deux voies : bobine, condensateurs, résistance
export function filtre(){ const g=new THREE.Group(); cbox(g,[-.045,0,-.032],[.045,.0016,.032],M.pcb); for(const [x,z,r,h] of [[-.023,-.008,.017,.016],[.02,.014,.012,.012]]){ ccyl(g,r,h,[x,.002+h/2,z],M.copper,'y'); ccyl(g,r*.42,h+.0006,[x,.002+h/2,z],M.black,'y'); } for(const [x,z,l] of [[.022,-.017,.03],[.022,-.004,.024]]) ccyl(g,.006,l,[x,.0085,z],M.red,'x'); cbox(g,[-.04,.002,.018],[-.018,.008,.026],M.btn,.001); for(let i=0;i<3;i++) cbox(g,[-.012+i*.009,.002,.022],[-.005+i*.009,.011,.031],M.grey,.0006); return g; }

// façade du TB10A, dans le plan z = 0, boutons vers -z. De gauche à droite, vu de face (donc de +x vers -x) : interrupteur, témoin, aigu, grave, volume
export function facade(g){
  const { w,h }=AMPLI; cbox(g,[-w/2,-h/2,-.003],[w/2,h/2,0],M.black,.0012); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([x,y])=>ccyl(g,.0028,.0015,[x*(w/2-.0055),y*(h/2-.0055),-.0033],M.steel,'z',null,18));
  [.0126,-.0112,-.035].forEach(x=>{ const r=.0089; ccyl(g,r,.013,[x,-.0028,-.0095],M.dark,'z',r*1.03); cbox(g,[x-.0005,-.0023,-.0163],[x+.0005,r*.82-.0028,-.0158],M.btn); });
  ccyl(g,.0036,.006,[.0368,-.0055,-.005],M.steel,'z'); ccyl(g,.0011,.001,[.0272,-.0052,-.0034],M.led,'z',null,12);
}
// l'ampli complet, façade vers -z, en pièces
export function ampli(){
  const g=new THREE.Group(), { w,h,d }=AMPLI, L=[], part=(ex,nom)=>{ const p=new THREE.Group(); p.userData={ ex,nom }; g.add(p); L.push(p); return p; };
  const f=part(V(0,0,-.05),'Façade'); facade(f);
  const b=part(V(0,0,0),'Châssis'); cbox(b,[-w/2,-h/2,0],[w/2,-h/2+.002,d],M.dark,.0005); for(const s of [-1,1]) cbox(b,[s>0?w/2-.002:-w/2,-h/2,0],[s>0?w/2:-w/2+.002,-.004,d],M.dark);
  cbox(b,[-w/2,-h/2,d-.002],[w/2,h/2,d],M.dark); for(const x of [-.0356,-.0197]) { ccyl(b,.0055,.009,[x,-.001,d+.004],M.black,'z'); ccyl(b,.0025,.0095,[x,-.001,d+.0045],M.gold,'z'); }
  for(const [x,y,m] of [[-.0023,.008,M.red],[-.0023,-.009,M.black],[.0186,.008,M.red],[.0186,-.009,M.black]]) ccyl(b,.0048,.012,[x,y,d+.006],m,'z'); cbox(b,[.0292,-.0085,d],[.0412,.0035,d+.003],M.black,.001); ccyl(b,.0022,.0035,[.0352,-.0025,d+.0018],M.hole,'z');
  const c=part(V(0,.05,0),'Carte'); cbox(c,[-w/2+.004,-.0115,.004],[w/2-.004,-.0099,d-.004],M.pcb); for(const x of [-.02,.02]){ cbox(c,[x-.006,-.0099,.052],[x+.006,-.0085,.063],M.hole); for(let i=0;i<6;i++) cbox(c,[x-.011+i*.004,-.0084,.046],[x-.009+i*.004,.008,.069],M.grey); cbox(c,[x-.012,-.0086,.045],[x+.012,-.0064,.07],M.grey); }
  for(const x of [-.034,-.013,.013,.034]) cbox(c,[x-.0065,-.0099,.077],[x+.0065,.0005,.09],M.dark,.001); for(const [x,z] of [[-.036,.028],[-.036,.044],[.037,.03]]) { ccyl(c,.0062,.02,[x,.0005,z],M.black,'y'); ccyl(c,.0056,.0008,[x,.0108,z],M.steel,'y'); } for(let i=0;i<4;i++) ccyl(c,.003,.009,[-.016+i*.011,-.005,.026],M.gold,'y');
  const t=part(V(0,.105,0),'Capot'); cbox(t,[-w/2,h/2-.002,0],[w/2,h/2,d-.0005],M.black,.0005); for(const s of [-1,1]) cbox(t,[s>0?w/2-.0015:-w/2-.0005,-.003,0],[s>0?w/2+.0005:-w/2+.0015,h/2-.001,d-.0005],M.black); for(let i=0;i<7;i++) cbox(t,[-.032,h/2-.0005,.03+i*.009],[.032,h/2+.0003,.034+i*.009],M.hole);
  g.userData.parts=L; g.userData.setE=e=>L.forEach(q=>q.position.copy(q.userData.ex).multiplyScalar(e)); return g;
}
export const brique=(l,h,w)=>{ const g=new THREE.Group(); cbox(g,[-l/2,0,-w/2],[l/2,h,w/2],M.black,.005); cbox(g,[-l*.3,h,-w*.25],[l*.3,h+.0004,w*.25],M.grey); ccyl(g,.004,.02,[l/2+.008,h/2,0],M.cable,'x'); return g; };

// trappe arrière : façade de l'ampli, prise de courant, interrupteur, fentes. Plan z = 0, dehors vers -z
export function trappe(){
  const g=new THREE.Group(); cbox(g,[-.1,-.062,-.003],[.1,.062,0],M.black,.002); const f=new THREE.Group(); f.position.set(0,.028,-.002); facade(f); g.add(f);
  cbox(g,[-.086,-.048,-.006],[-.056,-.022,-.001],M.hole,.001); cbox(g,[-.084,-.046,-.0062],[-.058,-.024,-.0055],M.dark,.001); cbox(g,[-.044,-.046,-.006],[-.026,-.024,-.001],M.red,.0015); for(let i=0;i<9;i++) cbox(g,[-.004+i*.0105,-.05,-.0036],[.001+i*.0105,-.02,-.0025],M.hole);
  return g;
}
// place de la trappe et de l'ampli dans le stand
export function placeAmpli(m){
  if(m.kind==='A') return { y:Math.max(Math.min(m.yh-.12,.34),.16),z:-m.D/2-.0005,rx:0 };
  const a=m.sec[0], b=m.sec[1], y=a.y+(b.y-a.y)*.56; return { y,z:-m.at(y)[1]-.0005,rx:-Math.atan2((b.d-a.d)/2,b.y-a.y) };
}

// contenu du stand. ecl : pièces écartées (vue éclatée), sinon en place (vue de l'intérieur)
export function buildInterieur(m,{ ecl=false }={}){
  const g=new THREE.Group(), P=[], S=[], { W,D,ys }=m, hp=m.hp, k=m.k, y0=m.yh+.003, y1=(m.kind==='A'?m.sh:m.sh)-.003, o={ g,labels:[] }, t=.012;
  const part=(ex,nom,at)=>{ const p=new THREE.Group(); p.userData={ ex,nom,at }; g.add(p); P.push(p); return p; };
  // caisson : fond, dessus, cloison, deux baffles percés, avant et arrière
  const w=W/2-.004, d=D/2-.004-(m.kind==='B'?m.c*.5:0), ply=ecl?M.ply:M.plyG;
  { const c=part(V(0,0,0),'Caisson de bouleau',V(-w*.4,y1+.03,0)); cbox(c,[-w,y0,-d],[w,y0+t,d],ply); cbox(c,[-w,y1-t,-d],[w,y1,d],ply); cbox(c,[-t/2,y0+t,-d+t],[t/2,y1-t,d-t],ply); cbox(c,[-w+t,y0+t,-d],[w-t,y1-t,-d+t],ply); }
  if(!ecl){ const c=part(V(0,0,0),null); cbox(c,[-w+t,y0+t,d-t],[w-t,y1-t,d],ply); }          // en vue éclatée, l'avant est retiré
  for(const s of [1,-1]){ const c=part(V(s*.07,0,0),null), sh=new THREE.Shape(); sh.moveTo(-d,y0); sh.lineTo(d,y0); sh.lineTo(d,y1); sh.lineTo(-d,y1); sh.closePath(); const h=new THREE.Path(); h.absarc(0,ys,m.H.cut/2000,0,PI*2,true); sh.holes.push(h); const b=mesh(new THREE.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false,curveSegments:40}).rotateY(-PI/2),ply); b.position.x=s>0?w:-w+t; c.add(b); }
  // haut-parleurs : le droit démonté, le gauche en coupe
  const x0=W/2-.011*m.H.depth/129;
  if(ecl){
    const sp=spread(m), r=hpDetail(hp); r.userData.ex=V(sp,0,0); r.userData.base=V(x0,ys,0); g.add(r); S.push(r); o.hpR=r;
    const l=hpDetail(hp,{cut:true}); l.rotation.y=PI; l.userData.ex=V(-.24-.04*k,0,0); l.userData.base=V(-x0,ys,0); g.add(l); S.push(l); l.userData.setE=()=>{}; o.hpL=l;
    // la coupe doit s'ouvrir vers l'avant, même retournée
    l.scale.z*=-1; l.traverse(n=>{ if(n.isMesh&&n.material.side!==THREE.DoubleSide) n.material=MIRR(n.material); });
  }
  // filtres
  for(const s of [1,-1]){ const f=filtre(), c=part(V(s*.03,-.01,.27),s>0?'Filtre passif, un par haut-parleur':null,V(s*.2,y0+t+.02,d*.2)); f.position.set(s*(w*.5),y0+t,d*.2); f.rotation.y=PI/2; f.scale.setScalar(Math.min(1,(d*1.2)/.1)); c.add(f); }
  // ampli et alimentations, dans le bas
  const pa=placeAmpli(m), am=part(V(0,-.03,m.kind==='A'?.42:.46),AMPLI.nom,V(.0,0,0)), a=ampli(); am.add(a); am.position.set(0,0,0); a.position.set(0,pa.y+.028*Math.cos(pa.rx),pa.z+.0035+(m.kind==='B'?.006:0)); a.rotation.x=pa.rx; o.ampli=a; am.userData.at=V(-.17,pa.y+.02,pa.z+.06);
  const bz=m.kind==='A'?0:-.004, bl=part(V(0,0,.3),'Bloc 24 V, 4,5 A',V(-.2,m.y0+.03,bz-.045)), br=brique(.125,.033,.055); br.position.set(m.kind==='A'?-.02:-.006,m.y0+.008,bz-.045); bl.add(br);
  const pb=part(V(0,0,.34),'Bloc 12 V du Pandore',V(-.2,m.y0+.03,bz+.035)), b2=brique(.1,.03,.045); b2.position.set(m.kind==='A'?.02:0,m.y0+.008,bz+.035); pb.add(b2);
  if(!ecl) for(const s of [1,-1]) { const r=hpDetail(hp); r.position.set(s*x0,ys,0); if(s<0) r.rotation.y=PI; g.add(r); }
  o.setE=e=>{ P.forEach(p=>p.position.copy(p.userData.ex).multiplyScalar(e)); S.forEach(q=>{ q.position.copy(q.userData.base).addScaledVector(q.userData.ex,e); q.userData.setE(e); }); a.userData.setE(Math.max(e-.25,0)/.75); };
  o.setE(0); o.parts=P; o.hps=S;
  // noms et places, dans le repère du stand
  o.noms=e=>{ const L=[]; P.forEach(p=>{ if(p.userData.nom) L.push([p.userData.nom,p.userData.at.clone().addScaledVector(p.userData.ex,e)]); }); if(o.hpR){ const r=o.hpR, sx=r.scale.x, sy=r.scale.y; r.userData.parts.forEach((q,i)=>{ const x=r.position.x+(q.userData.ex*e+CTR[i])*sx, up=i%2===0; L.push([q.userData.nom,V(x,r.position.y+(up?1:-1)*(RAD[i]*sy+.035+(i===2||i===6||i===3||i===9?.05:0)),0)]); }); L.push(['Même haut-parleur, en coupe',V(o.hpL.position.x,ys+.15*sy+.05,0)]); } return L; };
  return o;
}
// écart du haut-parleur démonté : son moteur sort du baffle
const spread=m=>(.129+.14)*m.H.depth/129+.11;
const CTR=[-.048,.006,-.026,-.07,-.058,-.035,-.079,-.089,-.09,-.117], RAD=[.036,.118,.098,.034,.074,.13,.066,.064,.066,.05];
const MM=new Map(); const MIRR=m=>{ if(!MM.has(m)){ const c=m.clone(); c.side=THREE.DoubleSide; MM.set(m,c); } return MM.get(m); };

// le stand éclaté : tôles écartées, contenu visible
export function buildEclate(m,o){
  const g=new THREE.Group(), it=buildInterieur(m,{ecl:true}), L=[], { W,D,ys,yh,sh,k }=m, rc=m.H.cut/2000; g.add(it.g);
  const part=(ex,nom,at)=>{ const p=new THREE.Group(); p.userData={ ex,nom,at }; g.add(p); L.push(p); return p; };
  const pan=faces=>mesh(loft(m.sec,{faces}),M.whiteD);
  const xR=spread(m)+.37*m.H.depth/129+.1, xL=-.4-.04*k;
  const r=part(V(xR,0,0),'Tôle perforée',V(W/2,yh*.5+.1,0)), l=part(V(xL,0,0),null), b=part(V(0,0,-.3),'Trappe de l’ampli',V(.14,placeAmpli(m).y-.13,-D/2-.02));
  // les tôles de côté pivotent un peu pour montrer leurs perforations
  const gond=(p,x)=>{ const a=new THREE.Group(), b2=new THREE.Group(); a.position.x=x; b2.position.x=-x; a.add(b2); p.add(a); p.userData.gond=a; return b2; }, gr=gond(r,W/2), gl=gond(l,-W/2);
  gr.add(pan([0])); gl.add(pan([4])); b.add(pan([5,6,7]));
  const ht=o.halftone(); ht.forEach((q,i)=>(i?gl:gr).add(q)); g.userData.span=[xL-W/2-.06,xR+W/2+.06];
  const pa=placeAmpli(m), tr=trappe(); tr.position.set(0,pa.y,pa.z); tr.rotation.x=pa.rx; b.add(tr);
  g.userData.setE=e=>{ it.setE(e); L.forEach(p=>p.position.copy(p.userData.ex).multiplyScalar(e)); r.userData.gond.rotation.y=-.65*e; l.userData.gond.rotation.y=.65*e; };
  g.userData.noms=e=>[...it.noms(e),...L.filter(p=>p.userData.nom).map(p=>[p.userData.nom,p.userData.at.clone().addScaledVector(p.userData.ex,e)])];
  g.userData.setE(0); return g;
}
