// Deux propositions de stand, deux porte-micros.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, loft, dots, rod, tube, polyShape, circ, silicone } from './util.js';
import { DRIVER } from './data.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export const STANDS = {
  A:{ nom:'Monolithe', court:'Bloc de tôle pliée, épaulement à 45° repris du capot, perforations reprises du case.' },
  B:{ nom:'Losange',   court:'Volume à facettes, large aux haut-parleurs, qui se resserre vers l’instrument et vers le pied.' }
};

// haut-parleur coaxial 10 po, face vers +x, plan de montage à x = 0
export function driver(){
  const g=new THREE.Group(), R=DRIVER.d/2000;
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
function pair(x,y){ const g=new THREE.Group(); const r=driver(); r.position.set(x,y,0); const l=driver(); l.rotation.y=Math.PI; l.position.set(-x,y,0); g.add(r,l); return g; }
// trame de points, même principe que la paroi gauche du case : pas de 7 mm, diamètres modulés
function halftone(x,y,hz,y0,y1,pitch=.0085){
  const L=[];
  for(const s of [1,-1]) for(let yy=y0;yy<=y1;yy+=pitch) for(let z=-hz;z<=hz+1e-6;z+=pitch){
    const r=Math.hypot(yy-y,z), w=.5+.5*Math.cos(z*38+(yy-y)*9);
    let d = r<.116 ? .0034-.0009*(r/.116)*(r/.116)*(.4+.6*w) : .0024*Math.exp(-Math.pow((r-.116)/.07,1.2))*(.45+.55*w);
    if(d>.00042) L.push([V(s*(x+.0004),yy,z),V(s,0,0),d]);
  }
  return dots(L,M.hole);
}
function amp(g,x,y,z){
  cbox(g,[x-.1,y-.06,z-.02],[x+.1,y+.06,z],M.black,.003);
  ccyl(g,.011,.006,[x-.07,y+.02,z-.022],M.steel,'z'); ccyl(g,.011,.006,[x-.035,y+.02,z-.022],M.steel,'z');
  cbox(g,[x+.02,y+.005,z-.024],[x+.05,y+.035,z-.019],M.pcb,.001); cbox(g,[x+.062,y+.008,z-.023],[x+.085,y+.032,z-.019],M.red,.001);
  for(let i=0;i<9;i++) cbox(g,[x-.088+i*.02,y-.045,z-.0215],[x-.08+i*.02,y-.015,z-.0195],M.hole);
}
const STEEL=7850;

// rend { group, shell[], inside, info }
export function buildStand(kind,Hs,{open=false,xray=false,color='#333a7c'}={}){
  const g=new THREE.Group(), shell=new THREE.Group(), inside=new THREE.Group(); g.add(shell,inside);
  const skin = xray ? M.white.clone() : M.white;
  if(xray){ skin.transparent=true; skin.opacity=.16; skin.depthWrite=false; skin.side=THREE.DoubleSide; }
  const add=m=>{ if(xray) m.castShadow=false; shell.add(m); return m; };
  const info={ kind };
  if(kind==='A'){
    const W=.32,D=.30,ys=Hs-.265,sh=Hs-.062,y0=.03,c=.012;
    add(mesh(loft([{y:y0,w:W,d:D,c},{y:sh-.36,w:W,d:D,c},{y:sh,w:W,d:D,c},{y:Hs,w:.2704,d:.1829,c:.005}],{hole:open?{band:1,r:.1315,y:ys}:null}),skin));
    cbox(shell,[-.12,.008,-.11],[.12,y0,.11],M.black); shell.add(mesh(loft([{y:0,w:.46,d:.46,c:.012},{y:.007,w:.46,d:.46,c:.012},{y:.008,w:.458,d:.458,c:.012}]),M.white));
    if(!xray){ if(!open) shell.add(halftone(W/2,ys,.136,ys-.28,ys+.19));
      // joint creux
      shell.add(mesh(loft([{y:sh-.3635,w:W+.0008,d:D+.0008,c},{y:sh-.3615,w:W+.0008,d:D+.0008,c}]),M.hole,false)); }
    inside.add(pair(open?.1515:.149,ys));
    if(xray){ cbox(inside,[-.135,ys-.18,-.125],[.135,ys-.176,.125],M.black); cbox(inside,[-.003,ys-.176,-.125],[.003,ys+.17,.125],M.black); cbox(inside,[-.13,.06,-.12],[.13,.16,.12],M.dark,.006); }
    amp(shell,0,.3,-D/2-.0005);
    const shellKg=((2*(W+D)*(sh-y0))+.14)*.0015*STEEL, plate=.46*.46*.008*STEEL;
    Object.assign(info,{ encombrement:[460,460], corps:[320,300], vol:2*(.142-.018)*(.264)*.36*1000-4, kg:shellKg+plate+9+18, appui:.23, plaque:'Plaque d’acier 460 × 460 × 8 mm', hp:ys });
  }
  if(kind==='B'){
    const ys=Hs*.545,hb=.15,cB=.045;
    add(mesh(loft([{y:.0105,w:.2,d:.19,c:.03},{y:ys-hb,w:.335,d:.33,c:cB},{y:ys+hb,w:.335,d:.33,c:cB},{y:Hs,w:.2704,d:.1829,c:.005}],{hole:open?{band:1,r:.1315,y:ys}:null}),skin));
    shell.add(mesh(loft([{y:0,w:.47,d:.45,c:.1},{y:.009,w:.47,d:.45,c:.1},{y:.0105,w:.467,d:.447,c:.1}]),M.white));
    if(!xray&&!open) shell.add(halftone(.1675,ys,.116,ys-hb+.006,ys+hb-.006));
    inside.add(pair(open?.159:.156,ys));
    if(xray){ cbox(inside,[-.003,ys-hb,-.12],[.003,ys+hb,.12],M.black); cbox(inside,[-.07,.02,-.06],[.07,.12,.06],M.dark,.006); }
    amp(shell,0,ys,-.1655);
    const plate=(.47*.45-2*.1*.1)*.0105*STEEL;
    Object.assign(info,{ encombrement:[470,450], corps:[335,330], vol:(.30*.295*.30-2*.045*.045*.3)*1000+5-4, kg:1.05*.0015*STEEL+plate+10+18, appui:.222, plaque:'Plaque d’acier 470 × 450 × 10 mm, coins coupés', hp:ys });
  }
  { const r=.0015; cbox(shell,[-.1352,Hs-.0005,-.0915],[.1352,Hs+.004,-.0915+r],M.white); cbox(shell,[-.1352,Hs-.0005,.0915-r],[.1352,Hs+.004,.0915],M.white); cbox(shell,[-.1352,Hs-.0005,-.0915],[-.1352+r,Hs+.004,.0915],M.white); cbox(shell,[.1352-r,Hs-.0005,-.0915],[.1352,Hs+.004,.0915],M.white); }
  return { group:g, info };
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
export function buildMic(type,Hs,stand){
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
    const P0= stand==='B'?V(.118,Hs-.16,-.135):V(.135,Hs-.1,-.125);
    const P1=V(P0.x+.03,Hs+.3,P0.z-.055); const T=grip.clone().add(V(.0,-.022,0));
    const fl=mesh(new THREE.CylinderGeometry(.02,.02,.05,32),M.dark); fl.position.copy(P0).add(V(.01,0,-.03)); g.add(fl);
    const P0b=V(P0.x+.01,P0.y,P0.z-.03), Pt=V(P0b.x,Hs+.26,P0b.z);
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
