// Stand C : colonne mince et tête stéréo imprimée. Deux large bande de 4 po en V, tournés vers l'écran (-z), chacun dans son caisson clos.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, rod, loft, dots } from './util.js';
import { LB } from './data.js';
import { ampli, trappe, brique, rev, bande } from './interieur.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z), PI=Math.PI, SEAT_W=.2704, SEAT_D=.1829, OUV=PI/6;      // ouverture du V : ±30°

// cotes : tête de la largeur du case, proue en V vers l'écran, colonne de 90 mm, plaque de 400 mm
export function dimsTete(Hs){
  const H=LB.f4, W=SEAT_W, D=SEAT_D, Lf=(W/2)/Math.cos(OUV), pd=Lf*Math.sin(OUV), hh=.2, yh=Hs-hh, col=.06, F=.4, zc=-D/2+.055, ep=.004;
  const o={ kind:'C',hp:'f4',H,d:H.d/1000,k:H.d/261,Hs,W,D,pd,Lf,hh,yh,sh:Hs,ys:Hs-hh/2,y0:.01,col,zc,ep,F:[F,F],
    plaque:`Plaque d’acier ${F*1000} × ${F*1000} × 10 mm, lest de 10 kg dans le socle`,plateKg:F*F*.01*7850,
    sec:[{y:.01,w:col,d:col,c:.012},{y:yh-.001,w:col,d:col,c:.012},{y:yh,w:W,d:D,c:.008},{y:Hs,w:SEAT_W,d:SEAT_D,c:.005}] };
  o.at=y=>{ const S=o.sec; for(let i=0;i<S.length-1;i++) if(y<=S[i+1].y||i===S.length-2){ const t=Math.min(Math.max((y-S[i].y)/(S[i+1].y-S[i].y),0),1); return [(S[i].w+(S[i+1].w-S[i].w)*t)/2,(S[i].d+(S[i+1].d-S[i].d)*t)/2]; } };
  // volume clos de chaque haut-parleur : demi-proue et bande jusqu'à la cloison, moins parois et moteur
  const aire=(W/2-ep)*(pd-ep)/2+(W/2-ep)*(zc+D/2-ep); o.vol=2*Math.max(aire*(hh-2*ep)*1000-.12,.5);
  const tete=1.5, colKg=4*col*(yh-o.y0)*.0015*2700;
  o.kg=o.plateKg+colKg+tete+2*H.kg+.65+.6+.4+10; o.appui=F/2; o.colKg=colKg; o.teteKg=tete+2*H.kg+.65+.2;
  // faces du V : centre, normale (vers l'extérieur), angle de rotation autour de y pour un haut-parleur dessiné face à +x
  o.faces=[1,-1].map(s=>({ s,c:V(s*W/4,o.ys,-D/2-pd/2),n:V(s*Math.sin(OUV),0,-Math.cos(OUV)),ry:s>0?PI/2-OUV:PI/2+OUV }));
  return o;
}

// haut-parleur large bande démonté : 4FE42 (Ø 130, profondeur 54). Face vers +x
export function largeBande({cut=false}={}){
  const g=new THREE.Group(), L=[], part=(nom,ex)=>{ const p=new THREE.Group(); p.userData={ ex,nom }; g.add(p); L.push(p); return p; };
  let p=part('Cache-noyau',.17); rev(p,bande([[.0165,-.0175],[.013,-.0128],[.007,-.0108],[0,-.0104]],.001),M.cone,cut);
  p=part('Suspension',.135); rev(p,bande([[.0475,.0015],[.0462,.0042],[.0438,.0056],[.0414,.0044],[.0402,.001]],.0009),M.surround,cut);
  p=part('Cône',.1); rev(p,bande([[.0402,.0006],[.033,-.0055],[.025,-.0115],[.0165,-.0185],[.0132,-.021]],.0012),M.cone,cut);
  p=part('Bobine',.068); rev(p,[[.0126,-.046],[.0126,-.019],[.0131,-.019],[.0131,-.046]],M.kapton,cut); rev(p,[[.0132,-.0455],[.0132,-.0375],[.0141,-.0375],[.0141,-.0455]],M.copper,cut);
  p=part('Spider',.042); { const c=[]; for(let i=0;i<=24;i++){ const r=.0145+i/24*.0215; c.push([r,-.028+.0012*Math.sin(i/24*PI*7)*(i>1&&i<23?1:0)]); } rev(p,bande(c,.0007),M.spider,cut); }
  p=part('Saladier',0); rev(p,[[.0465,-.0025],[.0649,-.0025],[.0649,.0012],[.0625,.0028],[.0465,.0018]],M.dark,cut); rev(p,[[.0255,-.0345],[.0335,-.0345],[.0335,-.0315],[.0255,-.031]],M.dark,cut);
  for(let i=0;i<4;i++){ const a=i*PI/2+PI/4; if(cut&&Math.cos(a)>.01) continue; const y=Math.sin(a), z=Math.cos(a); rod(p,[-.003,y*.049,z*.049],[-.032,y*.031,z*.031],.0034,M.dark,.0034); }
  p=part('Plaque de champ',-.028); rev(p,[[.0144,-.0395],[.0285,-.0395],[.0285,-.0355],[.0144,-.0355]],M.steel,cut);
  p=part('Aimant néodyme',-.048); rev(p,[[.0145,-.0465],[.0275,-.0465],[.0275,-.0395],[.0145,-.0395]],M.magnet,cut);
  p=part('Culasse',-.07); rev(p,[[.004,-.0541],[.0285,-.0541],[.0285,-.0465],[.0118,-.0465],[.0118,-.034],[.004,-.034]],M.grey,cut);
  g.userData.parts=L; g.userData.setE=e=>L.forEach(q=>{ q.position.x=q.userData.ex*e; }); return g;
}

// plan de la tête, dans (x, z) ; moitie : 1 droite, -1 gauche, 0 entière
function plan(m,moitie=0){ const { W,D,pd }=m, P=[[-W/2,D/2],[W/2,D/2],[W/2,-D/2],[0,-D/2-pd],[-W/2,-D/2]];
  const Q=moitie>0?[[0,D/2],[W/2,D/2],[W/2,-D/2],[0,-D/2-pd]]:moitie<0?[[0,-D/2-pd],[-W/2,-D/2],[-W/2,D/2],[0,D/2]]:P; const s=new THREE.Shape(); Q.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z)); s.closePath(); return s; }
function coque(m,moitie,mat){ const b=.004, g=new THREE.ExtrudeGeometry(plan(m,moitie),{depth:m.hh-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelOffset:-b,bevelSegments:2}); g.rotateX(-PI/2); g.translate(0,m.yh+b,0); return mesh(g,mat); }
// grille perforée posée sur une face du V
function grille(m,f,mat){ const g=new THREE.Group(); g.position.copy(f.c); g.rotation.y=f.ry; const L=m.Lf-.026, h=m.hh-.03; cbox(g,[.0045,-h/2,-L/2],[.006,h/2,L/2],mat,.002);
  const P=[], p=.0075, r0=m.H.cut/2000; for(let y=-h/2+.006;y<=h/2-.006;y+=p) for(let z=-L/2+.006;z<=L/2-.006;z+=p){ const d=Math.hypot(y,z), w=.5+.5*Math.cos(z*40+y*12), q=d<r0?.0028-.0006*(d/r0)**2:.0019*Math.exp(-(d-r0)/.03)*(.5+.5*w); if(q>.0004) P.push([V(.0062,y,z),V(1,0,0),q]); } g.add(dots(P,M.hole)); return g; }
// cloisons des caissons clos et compartiment de l'ampli
function cloisons(m,g,mat){ const { W,D,pd,zc,ep,hh,yh }=m; cbox(g,[-W/2+ep,yh+ep,zc-ep/2],[W/2-ep,yh+hh-ep,zc+ep/2],mat); cbox(g,[-ep/2,yh+ep,-D/2-pd+.01],[ep/2,yh+hh-ep,zc],mat); }

export function buildTete(Hs,{open=false,xray=false}={}){
  const g=new THREE.Group(), shell=new THREE.Group(), inside=new THREE.Group(), m=dimsTete(Hs), body=[]; g.add(shell,inside);
  const skin=xray?M.white.clone():M.white; if(xray){ skin.transparent=true; skin.opacity=.18; skin.depthWrite=false; skin.side=THREE.DoubleSide; }
  const add=q=>{ if(xray) q.castShadow=false; shell.add(q); body.push(q); return q; };
  add(coque(m,0,skin));
  add(mesh(loft(m.sec.slice(0,2)),skin));
  { const F=m.F[0]; shell.add(mesh(loft([{y:0,w:F,d:F,c:.012},{y:.009,w:F,d:F,c:.012},{y:.01,w:F-.002,d:F-.002,c:.012}]),M.white)); cbox(shell,[-.11,.01,-.1],[.11,.09,.1],M.white,.008); for(let i=0;i<7;i++) cbox(shell,[-.06+i*.02,.03,-.1005],[-.052+i*.02,.07,-.0995],M.hole); }
  // haut-parleurs sur les faces du V, grilles devant
  for(const f of m.faces){ const d=largeBande(), q=new THREE.Group(); q.position.copy(f.c); q.rotation.y=f.ry; q.add(d); add(q); if(!open&&!xray) add(grille(m,f,M.white)); }
  // trappe de l'ampli, côté joueur·euse (+z)
  { const t=trappe(); t.position.set(0,m.ys,m.D/2+.0005); t.rotation.y=PI; add(t); }
  if(xray){ cloisons(m,inside,M.plyG); const a=ampli(); a.rotation.y=PI; a.position.set(0,m.ys+.028,m.D/2-.0035); inside.add(a); const b1=brique(.125,.033,.055), b2=brique(.1,.03,.045); b1.position.set(-.02,.012,-.035); b2.position.set(.02,.012,.04); inside.add(b1,b2); }
  { const r=.0015, y0=Hs-.0005, y1=Hs+.004; cbox(shell,[-.1352,y0,-.0915],[.1352,y1,-.0915+r],M.white); cbox(shell,[-.1352,y0,.0915-r],[.1352,y1,.0915],M.white); cbox(shell,[-.1352,y0,-.0915],[-.1352+r,y1,.0915],M.white); cbox(shell,[.1352-r,y0,-.0915],[.1352,y1,.0915],M.white); }
  const eclate=e=>{ if(e>.01&&!g.userData.ecl){ const q=g.userData.ecl=buildEclateTete(m); g.add(q); } const q=g.userData.ecl; if(q){ q.visible=e>.01; q.userData.setE(e); inside.visible=e<=.01; body.forEach(b=>b.visible=e<=.01); } };
  const info={ kind:'C',dims:m,encombrement:m.F.map(v=>Math.round(v*1000)),corps:[Math.round(m.W*1000),Math.round((m.D+m.pd)*1000)],vol:m.vol,kg:m.kg,appui:m.appui,plaque:m.plaque,hp:m.ys };
  return { group:g, info, eclate };
}

// vue éclatée : les deux moitiés imprimées s'écartent, les haut-parleurs sortent dans leur axe, l'ampli recule
function buildEclateTete(m){
  const g=new THREE.Group(), L=[], S=[], part=(ex,nom,at)=>{ const p=new THREE.Group(); p.userData={ ex,nom,at }; g.add(p); L.push(p); return p; }, { W,D,pd,ys,Hs }=m, fR=m.faces[0], fL=m.faces[1];
  const hr=part(V(.16,0,0),'Tête imprimée en deux moitiés',V(W/2,Hs+.03,0)), hl=part(V(-.16,0,0),null); hr.add(coque(m,1,M.whiteD)); hl.add(coque(m,-1,M.whiteD));
  { const c=new THREE.Group(); cloisons(m,c,M.plyG); const r=c.children[0]; hr.add(c); }
  hr.add(mesh(new THREE.BoxGeometry(.001,.001,.001),M.white));
  const lab=part(V(.16,0,0),'Caisson clos de 2 L, un par haut-parleur',V(W/4,m.yh+.02,-D/2-pd/3)); lab.add(new THREE.Group());
  // les haut-parleurs sortent sur les côtés et pivotent face à la caméra : le droit démonté, le gauche en coupe
  const r=largeBande(), qr=new THREE.Group(); qr.add(r); g.add(qr); const l=largeBande({cut:true}), ql=new THREE.Group(); ql.add(l); g.add(ql);
  const gq=new THREE.Group(); gq.add(grille(m,{c:V(0,0,0),ry:0},M.whiteD)); g.add(gq);
  const sort=(q,f,to,ry,e)=>{ q.position.copy(f.c).lerp(to,e); q.rotation.y=f.ry+(ry-f.ry)*Math.min(e*1.6,1); };
  const xs=W/2+.16, R0=V(xs+.13,ys,-D/2), L0=V(-xs-.1,ys,-D/2), G0=V(xs+.5,ys,-D/2);
  const gr=part(V(0,0,0),'Grille perforée',G0.clone().add(V(.02,-.1,0)));
  const a=ampli(), am=part(V(0,-.24,.3),'Fosi TB10A',V(-.15,ys,D/2+.06)); a.rotation.y=PI; a.position.set(0,ys+.028,D/2-.0035); am.add(a);
  const tp=part(V(0,-.24,.13),'Trappe de l’ampli',V(.15,ys-.07,D/2)); { const t=trappe(); t.position.set(0,ys,D/2+.0005); t.rotation.y=PI; tp.add(t); }
  const sc=part(V(0,0,.3),'Socle : blocs 24 V et 12 V, lest',V(-.2,.06,.12)); { const b1=brique(.125,.033,.055), b2=brique(.1,.03,.045); b1.position.set(-.02,.012,-.035); b2.position.set(.02,.012,.04); sc.add(b1,b2); }
  const co=part(V(0,0,0),'Colonne d’alu, 60 × 60 mm',V(.07,m.yh*.3,0));
  g.userData.setE=e=>{ L.forEach(p=>p.position.copy(p.userData.ex).multiplyScalar(e)); sort(qr,fR,R0,0,e); sort(ql,fL,L0,PI,e); sort(gq,fR,G0,0,e); gq.visible=e>.02; r.userData.setE(e); a.userData.setE(Math.max(e-.25,0)/.75); };
  g.userData.span=[-xs-.22,xs+.62];
  const CTR=[-.012,.002,-.01,-.03,-.028,-.015,-.037,-.043,-.044], RAD=[.017,.048,.04,.014,.036,.065,.028,.028,.029];
  g.userData.noms=e=>{ const N=L.filter(p=>p.userData.nom).map(p=>[p.userData.nom,p.userData.at.clone().addScaledVector(p.userData.ex,e)]);
    if(e>.3){ const ry=qr.rotation.y, n=V(Math.cos(ry),0,-Math.sin(ry)); r.userData.parts.forEach((q,i)=>{ const pos=qr.position.clone().addScaledVector(n,q.userData.ex*e+CTR[i]); pos.y+=(i%2?-1:1)*(RAD[i]+.03+(i===2||i===3?.04:0)); N.push([q.userData.nom,pos]); }); N.push(['FaitalPRO 4FE42, en coupe',ql.position.clone().add(V(0,.1,0))]); }
    return N; };
  g.userData.setE(0); return g;
}
