// Deux propositions de stand, deux porte-micros.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, loft, dots, rod, tube, silicone } from './util.js';
import { HP } from './data.js';
import { trappe, placeAmpli, buildInterieur, buildEclate } from './interieur.js';
import { dimsTete, buildTete } from './tete.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export const STANDS = {
  A:{ nom:'Monolithe', court:'Bloc de tôle pliée, épaulement à 45° repris du capot, perforations reprises du case.' },
  B:{ nom:'Losange',   court:'Volume à facettes, large aux haut-parleurs, qui se resserre vers l’instrument et vers le pied.' },
  C:{ nom:'Tête stéréo', court:'Colonne mince et tête imprimée en deux moitiés : deux large bande de 4 po en V, tournés vers l’écran, chacun dans un caisson clos de 2 L. L’ampli est dans la tête.' }
};

// haut-parleur coaxial dessiné en 10 po puis mis à l'échelle, face vers +x, plan de montage à x = 0
export function driver(hp){
  const g=new THREE.Group(), R=.1305, H=HP[hp]; g.scale.set(H.depth/129,H.d/261,H.d/261);
  const lathe=(pts,mat)=>{ const m=mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),64).rotateZ(-Math.PI/2),mat); g.add(m); return m; };
  lathe([[.1165,-.004],[R,-.004],[R,.006],[R-.003,.009],[.117,.009],[.1165,.004]],M.dark);
  lathe([[.116,.004],[.112,.009],[.106,.010],[.1,.006],[.097,.001]],M.surround);
  lathe([[.097,.001],[.075,-.022],[.05,-.042],[.036,-.052]],M.cone);
  lathe([[.037,-.052],[.035,-.028],[.026,-.034],[.016,-.048],[.012,-.065]],M.black);
  lathe([[0,-.063],[.012,-.063]],M.hole);
  // saladier + aimant
  lathe([[.114,-.004],[.108,-.03],[.075,-.07],[.07,-.074]],M.dark);
  ccyl(g,.074,.04,[-.092,0,0],M.grey,'x'); ccyl(g,.05,.017,[-.1205,0,0],M.black,'x');
  for(let i=0;i<8;i++){ const a=i*Math.PI/4+.2; ccyl(g,.0035,.003,[.0095,Math.cos(a)*.1235,Math.sin(a)*.1235],M.steel,'x',null,12); }
  return g;
}
function pair(x,y,hp){ const g=new THREE.Group(); const r=driver(hp); r.position.set(x,y,0); const l=driver(hp); l.rotation.y=Math.PI; l.position.set(-x,y,0); g.add(r,l); return g; }
// trame de points, même principe que la paroi gauche du case : pas de 7 mm, diamètres modulés
function halftone(x,y,hz,y0,y1,rc,s,pitch=.0085){
  const L=[], k=rc/.116;
  for(let yy=y0;yy<=y1;yy+=pitch) for(let z=-hz;z<=hz+1e-6;z+=pitch){
    const r=Math.hypot(yy-y,z), w=.5+.5*Math.cos(z*38+(yy-y)*9);
    let d = r<rc ? .0034-.0009*(r/rc)*(r/rc)*(.4+.6*w) : .0024*Math.exp(-Math.pow((r-rc)/(.07*k),1.2))*(.45+.55*w);
    if(d>.00042) L.push([V(s*(x+.0004),yy,z),V(s,0,0),d]);
  }
  return dots(L,M.hole);
}
// cotes d'un stand selon le haut-parleur (m). sec : profil de bas en haut {y,w,d,c}
const SEAT_W=.2704, SEAT_D=.1829;
export function standDims(kind,Hs,hp){
  if(kind==='C') return dimsTete(Hs);
  const H=HP[hp], d=H.d/1000, dp=H.depth/1000, k=d/.261, lit=2*(dp+.012)+.018, o={ kind,hp,H,d,k,Hs };
  if(kind==='A'){
    const W=Math.max(SEAT_W+.006,lit), D=Math.max(SEAT_D+.006,d+.04), e=Math.max((W-SEAT_W)/2,(D-SEAT_D)/2)+.0015, sh=Hs-e, ys=sh-.035-d/2, yh=ys-d/2-.045, F=Math.min(.46,Math.max(.36,D+.16));
    Object.assign(o,{ W,D,sh,ys,yh,y0:.03,F:[F,F],plaque:`Plaque d’acier ${Math.round(F*1000)} × ${Math.round(F*1000)} × 8 mm`,plateKg:F*F*.008*7850,
      sec:[{y:.03,w:W,d:D,c:.012},{y:yh,w:W,d:D,c:.012},{y:sh,w:W,d:D,c:.012},{y:Hs,w:SEAT_W,d:SEAT_D,c:.005}] });
  } else {
    const ys=Math.min(Hs*.545,Hs-.07-d/2-.02), hb=d/2+.02, W=Math.max(SEAT_W+.016,lit+.016), c=.03*k, D=Math.max(SEAT_D+.03,d+2*c+.014), F=[Math.max(.38,W+.135),Math.max(.36,D+.12)];
    Object.assign(o,{ W,D,ys,hb,c,yh:ys-hb,sh:ys+hb,y0:.0105,F,cut:.1*k+.02,plaque:`Plaque d’acier ${Math.round(F[0]*1000)} × ${Math.round(F[1]*1000)} × 10 mm, coins coupés`,plateKg:(F[0]*F[1]-2*(.1*k+.02)**2)*.0105*7850,
      sec:[{y:.0105,w:.2,d:Math.min(.19,D-.03),c:.03},{y:ys-hb,w:W,d:D,c},{y:ys+hb,w:W,d:D,c},{y:Hs,w:SEAT_W,d:SEAT_D,c:.005}] });
  }
  // demi-largeur et demi-profondeur à la hauteur y
  o.at=y=>{ const S=o.sec; for(let i=0;i<S.length-1;i++) if(y<=S[i+1].y||i===S.length-2){ const t=Math.min(Math.max((y-S[i].y)/(S[i+1].y-S[i].y),0),1); return [(S[i].w+(S[i+1].w-S[i].w)*t)/2,(S[i].d+(S[i+1].d-S[i].d)*t)/2]; } };
  const inner=(o.W-.024)*(o.D-.024)*(o.sh-o.yh)*1000, drv=2*Math.PI*(d*.38)**2*dp*.5*1000;
  o.vol=Math.max(inner-drv,1);
  const per=2*(o.W+o.D)*(o.sh-o.y0)*(kind==='A'?1:.82)+.12;
  o.kg=per*.0015*7850+o.plateKg+(2*(o.W+o.D)*(o.sh-o.yh)+2*o.W*o.D)*.012*700+2*H.kg+1.6;
  o.appui=Math.min(...o.F)/2; return o;
}
// rend { group, info }
export function buildStand(kind,Hs,{open=false,xray=false,hp='hp10'}={}){
  if(kind==='C') return buildTete(Hs,{open,xray});
  const g=new THREE.Group(), shell=new THREE.Group(), inside=new THREE.Group(), m=standDims(kind,Hs,hp), { W,D,ys,sh,yh,k }=m; g.add(shell,inside);
  const skin = xray ? M.white.clone() : M.white;
  if(xray){ skin.transparent=true; skin.opacity=.16; skin.depthWrite=false; skin.side=THREE.DoubleSide; }
  const add=q=>{ if(xray) q.castShadow=false; shell.add(q); return q; }, rc=m.H.cut/2000, trame=()=>[1,-1].map(s=>kind==='A'?halftone(W/2,ys,D/2-.014,Math.max(yh-.14*k,.06),sh-.006,rc,s):halftone(W/2,ys,D/2-m.c-.004,ys-m.hb+.006,ys+m.hb-.006,rc,s));
  const body=[]; body.push(add(mesh(loft(m.sec,{hole:open?{band:1,r:m.d/2+.001,y:ys}:null}),skin)));
  if(xray) inside.add(buildInterieur(m).g); else inside.add(pair(W/2-(open?.0085:.011)*m.H.depth/129,ys,hp));
  { const pa=placeAmpli(m), t=trappe(); t.position.set(0,pa.y,pa.z); t.rotation.x=pa.rx; shell.add(t); body.push(t); }
  if(kind==='A'){
    cbox(shell,[-W*.38,.008,-D*.36],[W*.38,.03,D*.36],M.black); const F=m.F[0]; shell.add(mesh(loft([{y:0,w:F,d:F,c:.012},{y:.007,w:F,d:F,c:.012},{y:.008,w:F-.002,d:F-.002,c:.012}]),M.white));
    if(!xray){ if(!open) { const h=trame(); shell.add(...h); body.push(...h); }
      const j=mesh(loft([{y:yh-.002,w:W+.0008,d:D+.0008,c:.012},{y:yh,w:W+.0008,d:D+.0008,c:.012}]),M.hole,false); shell.add(j); body.push(j); }
  } else {
    const [fw,fd]=m.F, c=m.cut; shell.add(mesh(loft([{y:0,w:fw,d:fd,c},{y:.009,w:fw,d:fd,c},{y:.0105,w:fw-.003,d:fd-.003,c}]),M.white));
    if(!xray&&!open) { const h=trame(); shell.add(...h); body.push(...h); }
  }
  { const r=.0015, y0=Hs-.0005, y1=Hs+.004; cbox(shell,[-.1352,y0,-.0915],[.1352,y1,-.0915+r],M.white); cbox(shell,[-.1352,y0,.0915-r],[.1352,y1,.0915],M.white); cbox(shell,[-.1352,y0,-.0915],[-.1352+r,y1,.0915],M.white); cbox(shell,[.1352-r,y0,-.0915],[.1352,y1,.0915],M.white); }
  // vue éclatée du stand, construite à la demande
  const eclate=e=>{ if(e>.01&&!g.userData.ecl){ const q=g.userData.ecl=buildEclate(m,{halftone:trame}); g.add(q); } const q=g.userData.ecl; if(q){ q.visible=e>.01; q.userData.setE(e); inside.visible=e<=.01; body.forEach(b=>b.visible=e<=.01); } };
  const info={ kind,dims:m,encombrement:m.F.map(v=>Math.round(v*1000)),corps:[Math.round(W*1000),Math.round(D*1000)],vol:m.vol,kg:m.kg,appui:m.appui,plaque:m.plaque,hp:ys };
  return { group:g, info, eclate };
}

// SM58 : 162 x 51 mm. Capsule vers +y, origine au milieu du manche
export function sm58(){
  const g=new THREE.Group();
  const L=(p,m)=>{ const o=mesh(new THREE.LatheGeometry(p.map(q=>new THREE.Vector2(q[0],q[1])),48),m); g.add(o); };
  L([[0,-.081],[.0095,-.081],[.0115,-.079],[.0118,-.07],[.0185,.022],[.0186,.03],[.021,.034]],M.dark);
  L([[.0215,.033],[.0252,.038],[.0252,.044],[.0215,.048]],M.steel);
  L([[.0225,.046],[.0252,.053],[.0254,.062],[.0235,.071],[.018,.0775],[.009,.0805],[0,.081]],M.grille);
  return g;
}
function aim(o,pos,dir){ o.position.copy(pos); o.quaternion.setFromUnitVectors(V(0,1,0),dir.clone().normalize()); }

// la capsule vise la bouche d'une personne debout devant l'instrument
export function buildMic(type,Hs,m){
  const g=new THREE.Group(), tip=V(.13,1.4,.17), dir=V(-.28,.28,.9).normalize();
  const mid=tip.clone().addScaledVector(dir,-.081), tail=tip.clone().addScaledVector(dir,-.16), grip=tip.clone().addScaledVector(dir,-.115);
  const mic=sm58(); aim(mic,mid,dir); g.add(mic);
  const clip=mesh(new THREE.CylinderGeometry(.0185,.0165,.036,24,1,false),M.black); aim(clip,grip,dir); g.add(clip);
  if(type==='pied'){
    const bx=.43,bz=-.06;
    const base=mesh(new THREE.CylinderGeometry(.125,.13,.016,64),M.black); base.position.set(bx,.008,bz); g.add(base);
    rod(g,[bx,.016,bz],[bx,.86,bz],.0125,M.black); rod(g,[bx,.84,bz],[bx,1.26,bz],.009,M.steel); rod(g,[bx,.83,bz],[bx,.89,bz],.017,M.black);
    const J=V(bx,1.27,bz); const j=mesh(new THREE.SphereGeometry(.02,24,16),M.black); j.position.copy(J); g.add(j);
    const d=grip.clone().add(V(0,-.02,0)).sub(J), end=J.clone().add(d), back=J.clone().addScaledVector(d.clone().normalize(),-.18);
    rod(g,back,end,.007,M.black); const cw=mesh(new THREE.CylinderGeometry(.018,.018,.06,24),M.black); aim(cw,back,d); g.add(cw);
    tube(g,[tail,tail.clone().addScaledVector(dir,-.05).add(V(0,-.04,0)),J.clone().add(V(.01,-.03,.02)),V(bx+.02,.9,bz+.01),V(bx+.018,.3,bz),V(bx-.05,.02,bz-.12),V(.15,.012,-.34),V(.05,.02,-.26),V(.03,.12,-.22)],.0033,M.cable,120);
  } else {
    // bras articulé en tube d'acier blanc, fixé au coin arrière droit du stand
    const C=m.kind==='C', yP=m.kind==='B'?Hs-.13:C?Hs-.08:m.sh-.04, [hw,hd]=m.at(yP), P0=C?V(m.W/2+.006,yP,.02):V(hw-.028,yP,-hd+.02);
    const T=grip.clone().add(V(.0,-.022,0));
    const fl=mesh(new THREE.CylinderGeometry(.02,.02,.05,32),M.dark); fl.position.copy(P0).add(V(.01,0,C?0:-.03)); g.add(fl); if(C) cbox(g,[m.W/2-.001,yP-.03,-.005],[m.W/2+.008,yP+.03,.045],M.dark,.003);
    const P0b=V(P0.x+.01,P0.y,P0.z-(C?0:.03)), Pt=V(P0b.x,Hs+.26,P0b.z);
    rod(g,P0b,Pt,.0085,M.white);
    const l1=.36,l2=.33, dd=T.clone().sub(Pt), L=Math.min(dd.length(),l1+l2-.01), u=dd.clone().normalize();
    const a=(l1*l1-l2*l2+L*L)/(2*L), h=Math.sqrt(Math.max(l1*l1-a*a,0)), up=V(0,1,0).addScaledVector(u,-u.y).normalize().addScaledVector(V(1,0,0),.35).normalize();
    const E=Pt.clone().addScaledVector(u,a).addScaledVector(up,h);
    [.011,-.011].forEach(o=>{ const s=V(o,0,0); rod(g,Pt.clone().add(s),E.clone().add(s),.005,M.white); });
    rod(g,E,T,.0065,M.white);
    [Pt,E].forEach(p=>{ const k=mesh(new THREE.CylinderGeometry(.015,.015,.042,32).rotateZ(Math.PI/2),silicone('#333a7c')); k.position.copy(p); g.add(k); });
    const k=mesh(new THREE.SphereGeometry(.011,20,14),M.dark); k.position.copy(T); g.add(k);
    tube(g,[tail,tail.clone().addScaledVector(dir,-.04).add(V(0,-.02,-.01)),T.clone().lerp(E,.3).add(V(.012,-.016,0)),E.clone().add(V(.012,-.02,-.01)),E.clone().lerp(Pt,.5).add(V(0,-.02,0)),Pt.clone().add(V(.012,-.04,-.012)),V(P0b.x+.012,Hs+.06,P0b.z-.012),V(P0b.x+.01,Hs-.05,P0b.z-.02)],.0033,M.cable,120);
  }
  return g;
}
