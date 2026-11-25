// Les systèmes d'écran, en pièces démontables. Le dessus (anneau, nœuds, toile) est le même partout. Origine au centre du disque, au sol ; côté technique vers -z.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, rod, tube, dots } from './util.js';
import { optics, GAP, rpOf, secteurs } from './optics.js';
import { placeTech, TRAY, SOL_TECH } from './tech.js';
import { EIS } from './eisode.js';
import { MIRROR_GAP } from './proj.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z), TAU=Math.PI*2;
const FRAG=`
varying vec3 vP; uniform float uT,uA,uGain,uAmb,uFront,uTex,uSec; uniform vec3 uE;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*ns(p);p=mat2(1.6,1.2,-1.2,1.6)*p+7.3;a*=.5;}return s;}
vec2 dirA(float a){return vec2(sin(a),cos(a));}
void main(){
  vec2 p=vP.xz/uA; float seam=0., grain=1.;
  if(uTex>0.){ // papier miroir : chaque secteur décale un peu l'image, la surface l'ondule
    float an=atan(p.x,p.y)/6.28318*uSec, id=floor(an); seam=1.-smoothstep(.002,.008,(.5-abs(fract(an)-.5))/uSec*6.28318*length(p));
    p+=uTex*.028*(vec2(h21(vec2(id,3.)),h21(vec2(id,8.)))-.5);
    vec2 a=vec2(fbm(p*3.4),fbm(p*3.4+11.))-.5, b=vec2(ns(p*24.),ns(p*24.+5.))-.5; p+=uTex*(.11*a+.016*b);
    grain=1.+uTex*(1.25*(fbm(p*8.+2.)-.5)+.35*(ns(p*40.)-.5)); }
  float t=uT;
  vec2 s0=dirA(0.)*.72, s1=dirA(2.0944)*.72, s2=dirA(4.18879)*.72;
  vec2 w=vec2(fbm(p*1.6+t*.045),fbm(p*1.6-t*.04+9.));
  vec2 q=p+(w-.5)*.75; vec2 w2=vec2(fbm(q*2.7+w*2.+t*.05),fbm(q*2.7-w*2.-t*.04+4.)); q+=.3*(w2-.5);
  float r0=length(q-s0), r1=length(q-s1), r2=length(q-s2);
  float k0=exp(-r0*1.7), k1=exp(-r1*1.9), k2=exp(-r2*1.9);
  float rd=1.-abs(2.*fbm(q*2.2+w2+t*.02)-1.); float fi=pow(rd,9.); float rd2=1.-abs(2.*fbm(q*5.5-w+t*.03)-1.); float fi2=pow(rd2,10.);
  float bg=fbm(q*1.8-t*.02);
  vec3 c=mix(vec3(.004,.006,.022),vec3(.05,.075,.26),smoothstep(.3,.75,bg));
  c+=vec3(.12,.2,.62)*fi*(.35+k0*1.6)+vec3(.65,.16,.1)*fi*k1*1.6+vec3(.62,.36,.12)*fi*k2*1.3;
  c+=(vec3(.3,.55,.95)*k0+vec3(.9,.28,.18)*k1+vec3(.8,.5,.2)*k2+vec3(.03,.05,.12))*fi2*.7;
  float l=0.; for(int i=0;i<4;i++){ float fl=float(i); float x=abs(fract(r0*(7.+fl*2.3)-t*(.09+.03*fl)+w.x*1.4)-.5); l+=smoothstep(.06+.02*fl,.0,x)*(1.-fl*.2); }
  c+=mix(vec3(.2,.5,1.),vec3(.9,.96,1.),k0)*l*k0*.5*(.6+uE.x);
  for(int i=0;i<4;i++){ float fl=float(i), ph=fract(t*(.31+.05*fl)+fl*.27); float rr=abs(r1-ph*(1.1+.2*fl)); c+=vec3(1.,.25,.16)*smoothstep(.03,.0,rr)*pow(1.-ph,2.)*1.15*(.5+uE.y); }
  c+=vec3(1.,.4,.25)*exp(-r1*7.)*(.35+.4*pow(1.-fract(t*.31),5.));
  float g=0.; for(int i=0;i<3;i++){ float fl=float(i); float an=t*.05*(fl+1.); vec2 u=mat2(cos(an),sin(an),-sin(an),cos(an))*(q-s2)*(17.+fl*9.); vec2 id=floor(u); float n=h21(id+fl*17.); vec2 o=fract(u)-.5-.32*vec2(sin(t*(.6+n)+n*40.),cos(t*(.5+n)+n*70.)); g+=smoothstep(.13+.1*n,.0,length(o))*step(.42,n)*(.35+.65*sin(t*1.3+n*30.)*sin(t*.7+n*11.)); }
  c+=vec3(1.,.83,.55)*max(g,0.)*(k2*1.5+.05)*(.5+uE.z);
  c*=grain*(1.-.4*seam*uTex); c=pow(max(c,0.),vec3(1.22))*.86; c=c/(1.+.18*c);
  float e = smoothstep(1.,.985,length(vP.xz)/uA);
  gl_FragColor=vec4(c*e*uGain+mix(mix(vec3(.165,.167,.175),vec3(.115,.117,.125),e),mix(vec3(.6,.6,.595),vec3(.2,.2,.198),e),uFront)*uAmb,uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function screenMaterial(R){
  return new THREE.ShaderMaterial({ side:THREE.DoubleSide, transparent:true, uniforms:{uT:{value:0},uA:{value:R},uGain:{value:1},uAmb:{value:0},uFront:{value:0},uTex:{value:0},uSec:{value:6},uAlpha:{value:1},uE:{value:new THREE.Vector3()}},
    vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader:'uniform float uAlpha;\n'+FRAG });
}
const MIR=()=>new THREE.MeshStandardMaterial({color:'#e8edf2',metalness:1,roughness:.03});

export function buildScreen(s){
  const O=optics(s), g=new THREE.Group(), o={ g,O,sys:s.sys,parts:[],cut:[],labels:[],dims:[],beams:new THREE.Group(),R:O.R,H:O.H,Rb:O.Rb };
  g.add(o.beams); o.mat=screenMaterial(O.R); o.mat.uniforms.uFront.value=s.sys==='dessous'?0:1; if(s.sys==='dessous'&&s.miroir==='papier'&&O.f){ o.mat.uniforms.uTex.value=1; o.mat.uniforms.uSec.value=secteurs(O.mr,s); }
  // pièce : groupe qui se déplace en vue éclatée
  o.part=(nom,ex,parent=g)=>{ const p=new THREE.Group(); p.userData.ex=ex; parent.add(p); o.parts.push(p); if(nom) p.name=nom; return p; };
  o.white=M.white;
  if(s.sys==='dessous') buildTable(s,o); else { bas(s,o); if(s.sys==='mat') buildMat(s,o); else if(s.sys==='sol') buildSol(s,o); else buildPortique(s,o); }
  buildTech(s,o);
  o.setExplode=e=>o.parts.forEach(p=>{ p.userData.base??=p.position.clone(); p.position.copy(p.userData.base).addScaledVector(p.userData.ex,e); });
  o.setCut=v=>{ o.cut.forEach(m=>m.visible=!v); o.mat.uniforms.uAlpha.value=v&&s.sys==='dessous'?.6:1; };
  o.setBeams=v=>{ o.beams.visible=v; };
  o.setHaut=v=>{ if(s.sys!=='dessous') g.children.forEach(c=>{ if(/^(Projecteur|Accroche|Caisson|Miroir|Suspente|Profilé|Mât, haut|Traverse|Pied, haut)$/.test(c.name)&&!(c.name==='Traverse'&&s.sys!=='portique')) c.visible=v; }); };
  return o;
}
function beam(o,cols,apex,mids,ends){ // apex -> mids -> ends
  const bm=new THREE.MeshBasicMaterial({color:cols[0],transparent:true,opacity:.1,side:THREE.DoubleSide,depthWrite:false}), ed=new THREE.LineBasicMaterial({color:cols[1],transparent:true,opacity:.75}), N=ends.length, t=[];
  for(let n=0;n<N;n++){ const k=(n+1)%N; t.push(apex,mids[n],mids[k],mids[n],ends[n],ends[k],mids[n],ends[k],mids[k]); }
  o.beams.add(new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(t),bm)); for(let n=0;n<N;n+=6) o.beams.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([apex,mids[n],ends[n]]),ed));
}
const lathe=(pts,m)=>mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(...p)),160),m);
function grid(R,n=72){ return Array.from({length:n},(_,i)=>{ const a=i/n*TAU; return [Math.sin(a)*R,Math.cos(a)*R]; }); }

// ================================================================ Le dessus : anneau en douze arcs, six nœuds, six manchons, toile
export const TUBE=.038, PIED=6, ARCS=12, BANC_MAX=.55;
function dessus(s,o,ex=.36){
  const { O }=o, H=O.H, Rt=O.Rt, Rf=O.Rf, zt=H-.022;
  const tl=o.part('Toile',V(0,ex+.26,0)); const disc=new THREE.Mesh(new THREE.CircleGeometry(Rt+.012,160).rotateX(-Math.PI/2),o.mat); disc.position.y=H+.001; tl.add(disc); o.disc=disc;
  tl.add(lathe([[Rt+.024,H-.032],[Rt+.0265,H-.012],[Rt+.018,H+.0005],[Rt+.011,H+.0015]],M.whiteIn));
  for(let i=0;i<ARCS;i++){ const am=(i+.5)*TAU/ARCS, p=o.part('Arc',V(Math.sin(am)*.2,ex,Math.cos(am)*.2)), arc=TAU/ARCS-.004, t=mesh(new THREE.TorusGeometry(Rt,TUBE/2,16,24,arc).rotateX(-Math.PI/2),M.white); t.rotation.y=am-Math.PI/2-arc/2; t.position.y=zt; p.add(t); }
  for(let i=0;i<PIED;i++){ const a=(i+.5)*TAU/PIED, n=o.part('Manchon',V(Math.sin(a)*.12,ex,Math.cos(a)*.12)), w=new THREE.Group(), c=mesh(new THREE.CylinderGeometry(TUBE/2-.003,TUBE/2-.003,.1,20),M.grey); c.rotation.z=Math.PI/2; w.rotation.y=a; w.position.set(Math.sin(a)*Rt,zt,Math.cos(a)*Rt); w.add(c); n.add(w); }
  const k=Math.min(1,(zt-.006)/.09), at=y=>Rf+(Rt-Rf)*(y-.02)/Math.max(zt-.02,.01);           // rayon de l'axe du pied à la hauteur y
  for(let i=0;i<PIED;i++){ const a=i*TAU/PIED, S=Math.sin(a), C=Math.cos(a), n=o.part('Noeud',V(S*.1,ex*.55,C*.1)), w=new THREE.Group(), c=mesh(new THREE.CylinderGeometry(.0215,.0215,.1,24),M.grey); c.rotation.z=Math.PI/2; w.rotation.y=a; w.position.set(S*Rt,zt,C*Rt); w.add(c); n.add(w);
    const y1=Math.max(zt-.09,.012); rod(n,[S*Rt,zt,C*Rt],[S*at(y1),y1,C*at(y1)],.022,M.grey);
    const l=o.part('Pied',V(S*.1,0,C*.1)), y2=Math.max(zt-.04,.016); if(y2>.03) rod(l,[S*at(y2),y2,C*at(y2)],[S*Rf,.018,C*Rf],TUBE/2,M.white); const f=mesh(new THREE.CylinderGeometry(.034,.038,.02,28),M.black); f.position.set(S*Rf,.01,C*Rf); l.add(f); }
  return { zt,at };
}
function traverses(o){ const { O }=o; for(let i=0;i<PIED;i++){ const a=i*TAU/PIED, a2=a+TAU/PIED, r=O.Rf-.012, e=o.part('Traverse',V(Math.sin(a+TAU/12)*.22,0,Math.cos(a+TAU/12)*.22)); rod(e,[Math.sin(a)*r,.09,Math.cos(a)*r],[Math.sin(a2)*r,.09,Math.cos(a2)*r],.011,M.white); } }
// jupe : cône de tissu, blanc dehors, noir dedans, en deux moitiés
function jupe(o){ const { O }=o, H=O.H, Rt=O.Rt, Rf=O.Rf, h=H-.07, nj=Math.max(Math.min(6,Math.floor((h-.06)/.021)),0);
  [0,1].forEach(k=>{ const p=o.part('Jupe',V(2.5,0,0)), geo=d=>new THREE.CylinderGeometry(Rt+.026-d,Rf+.028-d,h,96,1,true,k?0:Math.PI,Math.PI), a=mesh(geo(0),M.white), b=mesh(geo(.004),M.skirt,false); [a,b].forEach(m=>{ m.position.y=.04+h/2; p.add(m); });
    const L=[]; for(let j=0;j<nj;j++) for(let i=0;i<200;i++){ const an=(k?0:Math.PI)+(i+.5)/200*Math.PI, w=.5+.5*Math.cos(an*6+j*.5), y=.1+j*.021, rr=Rf+.028+(Rt-Rf-.002)*(y-.04)/h, r=.0016+.0046*w*(1-j/7); L.push([V(Math.sin(an)*(rr+.001),y,Math.cos(an)*(rr+.001)),V(Math.sin(an),-.2,Math.cos(an)).normalize(),r]); } if(L.length) p.add(dots(L,M.hole)); if(k) o.cut.push(p); }); }
// dessus bas, pour la projection par le haut : toile blanche, pieds courts ; ou vinyle posé au sol
function bas(s,o){
  const { O }=o;
  if(O.vinyle){ const tl=o.part('Vinyle',V(0,0,0)), d=new THREE.Mesh(new THREE.CircleGeometry(O.R,160).rotateX(-Math.PI/2),o.mat); d.position.y=.003; tl.add(d); o.disc=d; }
  else { dessus(s,o,.24); if(O.H>.2) traverses(o); if(O.H>=.16) jupe(o); else o.part('Bandeau',V(0,.12,0)).add(lathe([[O.Rt+.0262,Math.max(O.H-.055,.008)],[O.Rt+.0262,O.H-.012]],M.whiteIn)); }
}
// technique : sub et plateau (ordinateur, commutateur, courant)
function buildTech(s,o){
  const { O }=o; o.tech=placeTech(O,{ sub:s.sub,tray:s.regieE },o.banc); const T=o.tech, at=q=>V(q.y,0,q.x);
  if(T.sub){ const q=T.sub, p=o.part('Sub',q.cote?V(0,0,-.3):V(Math.sign(q.y)*.55,0,0)), g=new THREE.Group(); g.position.copy(at(q)); p.add(g); const w=q.d/2, d=q.w/2, h=q.h;
    for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) ccyl(g,.016,SOL_TECH+.008,[x*(w-.03),(SOL_TECH+.008)/2,z*(d-.03)],M.black,'y');
    cbox(g,[-w,SOL_TECH+.008,-d],[w,h,d],M.black,.012); const r=.1, f=-1; ccyl(g,r,.006,[0,h/2+.004,f*(d+.001)],M.surround,'z'); ccyl(g,r*.78,.008,[0,h/2+.004,f*(d+.002)],M.cone,'z'); ccyl(g,r*.3,.012,[0,h/2+.004,f*(d+.003)],M.black,'z');
    o.labels.push([q.cote?'Sub, à côté':'Sub 8 po',at(q).setY(h+.06)]); }
  if(T.tray){ const q=T.tray, p=o.part('Plateau technique',q.cote?V(0,0,-.3):V(Math.sign(q.y)*.55,0,0)), g=new THREE.Group(); g.position.copy(at(q)); p.add(g); const sw=q.w<q.d; if(!sw) g.rotation.y=Math.PI/2; const w=TRAY.w/2, d=TRAY.d/2;
    cbox(g,[-w,SOL_TECH,-d],[w,SOL_TECH+.012,d],M.ply,.002); [[-w+.02,-d+.02],[w-.02,-d+.02],[-w+.02,d-.02],[w-.02,d-.02]].forEach(([x,z])=>ccyl(g,.008,SOL_TECH,[x,SOL_TECH/2,z],M.black,'y'));
    cbox(g,[-w+.02,.018,-d+.02],[-w+.147,.068,-d+.147],M.steel,.018); cbox(g,[-w+.17,.018,-d+.025],[w-.02,.05,-d+.125],M.dark,.004); for(let i=0;i<5;i++) cbox(g,[-w+.18+i*.027,.026,-d+.0245],[-w+.196+i*.027,.04,-d+.0255],M.hole); cbox(g,[-w+.02,.018,d-.07],[w-.02,.056,d-.02],M.black,.004); for(let i=0;i<5;i++) ccyl(g,.016,.003,[-w+.06+i*.06,.057,d-.045],M.grey,'y');
    o.labels.push([q.cote?'Technique, à côté':'Ordinateur, réseau, courant',at(q).setY(q.h+.06)]); }
}

// ================================================================ A. Table rétroprojetée
function buildTable(s,o){
  const { O }=o, F=O.f, P=O.P, R=O.R, H=O.H, Rt=O.Rt, Rf=O.Rf;
  dessus(s,o); traverses(o); jupe(o);
  if(!F) return;
  // banc optique : projecteur, miroir
  const W3=(x,y,z)=>V(y,z,x), bk=o.part('Banc optique',V(0,0,0)), lo=F.m1[1]<F.m2[1]?F.m1:F.m2, hi=F.m1[1]<F.m2[1]?F.m2:F.m1, bw=Math.max(.18,Math.max(P.wl,P.w-P.wl)-.005), bl=Rf-.012-bw*Math.tan(Math.PI/6)-.015, cl=(v,a,b)=>Math.min(Math.max(v,a),b);
  const u=hi[0]===lo[0]?.6:cl((cl(lo[0]+(hi[0]-lo[0])*.6,-bl+.06,bl-.06)-lo[0])/(hi[0]-lo[0]),.15,.6), sx=lo[0]+(hi[0]-lo[0])*u, sz=lo[1]+(hi[1]-lo[1])*u-.02, xA=cl(Math.min(F.x0,lo[0])-.04,-bl,bl), xB=cl(Math.max(sx,F.x1)+.05,-bl,bl), xm=(xA+xB)/2, pose=v=>cl(v,xA+.02,xB-.02);
  const nb=Math.max(2,Math.ceil((xB-xA)/BANC_MAX)), lb=(xB-xA)/nb; o.banc={ x0:xA,x1:xB,l:xB-xA,w:2*bw,n:nb };
  for(let i=0;i<nb;i++){ cbox(bk,[-bw,.006,xA+i*lb+(i?.003:0)],[bw,.024,xA+(i+1)*lb-(i<nb-1?.003:0)],M.ply,.003); if(i) [-.12,.12].forEach(x=>ccyl(bk,.006,.06,[x,.027,xA+i*lb],M.steel,'x')); }
  // miroir
  const mx=(F.m1[0]+F.m2[0])/2, mz=(F.m1[1]+F.m2[1])/2, mg=new THREE.Group(); mg.position.copy(W3(mx,0,mz)); mg.rotation.x=-F.fa; bk.add(mg); const ct=Math.cos(F.fa), st=Math.sin(F.fa), G=grid(R,96);
  o.mirOut=k=>O.mir(k); const papier=s.miroir==='papier', nS=papier?secteurs(O.mr,s):1, c0=[0,O.rond?F.disc.t0:0]; o.nS=nS;
  const poly=p=>{ const q=new THREE.Shape(); p.forEach(([a,b],i)=>i?q.lineTo(a,-b):q.moveTo(a,-b)); q.closePath(); return q; }, sect=(k,i)=>{ const L=O.mir(k), m=L.length/nS, a=L.slice(Math.round(i*m),Math.round((i+1)*m)+1); if(i===nS-1) a.push(L[0]); return nS>1?[c0,...a]:L; };
  const film=MIR(); if(papier){ film.roughness=.16; film.color.set('#e2e6ea'); }
  for(let i=0;i<nS;i++){ const L=sect(.006,i), gx=nS>1?L.reduce((a,p)=>a+p[0],0)/L.length:0, gt=nS>1?L.reduce((a,p)=>a+p[1],0)/L.length-c0[1]:0, pz=o.part(nS>1?'Secteur de miroir':'Miroir',V(gx*.55,.0,gt*.55),mg);
    const back=mesh(new THREE.ExtrudeGeometry(poly(L),{depth:.008,bevelEnabled:false}).rotateX(-Math.PI/2),M.dark); back.position.y=-.0095; pz.add(back); const mf=mesh(new THREE.ShapeGeometry(poly(sect(.002,i))).rotateX(-Math.PI/2),film,false); pz.add(mf);
    if(nS>1){ const e=L[1], ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(c0[0],.0012,c0[1]),V(e[0],.0012,e[1])]),new THREE.LineBasicMaterial({color:'#6d7178'})); pz.add(ln); } }
  if(nS>1){ const hb=mesh(new THREE.CylinderGeometry(.11,.11,.006,40),M.grey); hb.position.set(0,-.0135,c0[1]); mg.add(hb); }
  [-1,1].forEach(k=>{ const x=k*Math.min(F.mw*.3,.155), p1=pose(sx+.03), p0=pose(lo[0]+.02); rod(bk,[x,.024,p1],[x,sz,sx],.009,M.dark); rod(bk,[x,.024,p0],[x,lo[1],lo[0]+.01],.009,M.dark); rod(bk,[x,.03,p0],[x,.03,p1],.007,M.dark); });
  // projecteur incliné
  const pj=o.part('Projecteur',V(0,.0,-.35)), pg=new THREE.Group(), ax=V(0,F.ax[1],F.ax[0]), up=V(0,F.up[1],F.up[0]), lat=up.clone().cross(ax); pg.matrixAutoUpdate=false; pg.matrix.makeBasis(lat,up,ax).setPosition(W3(F.L[0],0,F.L[1])); pj.add(pg);
  cbox(pg,[-P.wl,-P.dn,-P.lens-P.dep],[P.w-P.wl,P.up,-P.lens],M.white,.014); ccyl(pg,.042,Math.max(P.lens,.012)+.02,[0,0,-Math.max(P.lens,.012)/2-.006],M.black,'z'); ccyl(pg,.033,.004,[0,0,.004],M.pad,'z');
  for(let i=0;i<8;i++) cbox(pg,[P.w-P.wl-.002,-P.dn*.6,-P.lens-P.dep+.04+i*.018],[P.w-P.wl+.002,P.up*.6,-P.lens-P.dep+.05+i*.018],M.hole);
  // berceau : plaque sous le projecteur, quatre pattes réglables
  const low=F.up[1]<0?1:-1, yy=low>0?P.up+.004:-P.dn-.004; cbox(pg,[-P.wl+.01,Math.min(yy,yy+low*.006),-P.lens-P.dep+.01],[P.w-P.wl-.01,Math.max(yy,yy+low*.006),-P.lens-.01],M.dark,.002);
  const bot=[[-P.wl+.03],[P.w-P.wl-.03]]; [P.lens+.03,P.lens+P.dep-.03].forEach(d=>bot.forEach(([x])=>{ const c=W3(F.L[0],0,F.L[1]).addScaledVector(ax,-d).addScaledVector(up,yy).addScaledVector(lat,x); rod(bk,[cl(c.x,-bw+.015,bw-.015),.024,pose(c.z)],c,.006,M.dark); }));
  beam(o,['#5f7fe8','#3653c4'],W3(F.L[0],0,F.L[1]),G.map(([X,y])=>{ const m=F.M(X); return W3(m[0],m[2]*y,m[1]); }),G.map(([X,y])=>W3(X,y,H)));
  if(!s.regieE) cbox(bk,[.0,.026,xA+.02],[.17,.07,xA+.12],M.dark,.004);                                     // commutateur
  o.labels.push([P.court,V(0,F.z1+.08,(F.x0+F.x1)/2)],[`${papier?'Papier miroir':'Miroir'} ${O.rond?'Ø ':'≈ '}${Math.round(O.mr*200)} cm`,V(0,hi[1]+.05,hi[0])],['Banc optique pliant',V(.3,.06,xm)]);
  o.dims.push([V(-R,H+.03,0),V(R,H+.03,0),`image ${Math.round(R*2000)}`,V(0,0,.04)],[V(-Rf,.03,Rt+.14),V(Rf,.03,Rt+.14),`au sol ${Math.round(Rf*2000)}`,V(0,0,.04)],[V(Rt+.16,0,0),V(Rt+.16,H,0),`${Math.round(H*1000)}`,V(.04,0,0)]);
}

// ================================================================ B. Projecteur au rail 80/20 d'EISODE ou au bout d'un mât
export const MAT_D=.07;
function buildMat(s,o){
  const { O }=o, m=O.m, P=O.P, R=O.R, H=O.H, pl=s.plafond/1000, rail=s.accroche==='rail', yb=m.yA-P.h/2, Rb=O.Rb;
  const zm=-(m.xa), zl=zm+GAP, zb=zl+P.dep, w=P.w/2+.035, y0=yb-.02, y1=m.top, za=m.xm;                          // miroir, objectif, dos, mât
  // caisson
  const cs=o.part('Caisson',V(0,rail?.0:.62,0)); const T=.003;
  cbox(cs,[-w,y1-T,za-.05],[w,y1,zb+.07],M.white); const sideL=cbox(cs,[-w,y0,za-.05],[-w+T,y1,zb+.07],M.white), sideR=cbox(cs,[w-T,y0,za-.05],[w,y1,zb+.07],M.white); cbox(cs,[-w,y0,zb+.067],[w,y1,zb+.07],M.white); cbox(cs,[-w,y0,za-.05],[w,y1,za-.047],M.white); o.cut.push(sideR);
  cbox(cs,[-w,y0-T,zl+.03],[w,y0,zb+.07],M.white);                                                             // plancher sous le projecteur, ouvert devant le miroir
  const L=[]; for(const k of [1,-1]) for(let j=0;j<7;j++) for(let i=0;i<30;i++){ const z=zl+.02+i*(P.dep/30), q=.5+.5*Math.cos(i*.42+j*.6); L.push([V(k*(w+.0006),y0+.05+j*.017,z),V(k,0,0),.0016+.0042*q*(1-j/8)]); } const dl=dots(L.filter(d=>d[0].x<0),M.hole), dr=dots(L.filter(d=>d[0].x>0),M.hole); cs.add(dl,dr); o.cut.push(dr);
  // projecteur
  const pj=o.part('Projecteur',V(0,rail?-.35:.36,0)); cbox(pj,[-P.w/2,yb,zl+.012],[P.w/2,yb+P.h,zb],P.lm>4000?M.white:M.whiteIn,.018); ccyl(pj,.05,.04,[0,m.yA,zl+.006],M.black,'z'); ccyl(pj,.04,.004,[0,m.yA,zl-.015],M.pad,'z');
  // miroir : objectif vers -z, réfléchi vers le bas
  const mg=o.part('Miroir',V(0,rail?-.6:.2,0)), a=m.a, b=m.b, G=grid(R,96), c=[(a[0]+b[0])/2,(a[2]+b[2])/2], mk=new THREE.Group(); mk.position.set(0,c[1],c[0]); mk.rotation.x=-Math.PI/4; mg.add(mk);
  o.mirOut=k=>G.map(([X,y])=>{ const q=m.M(X,y), t=((q[0]-c[0])+(q[2]-c[1]))*Math.SQRT1_2, f=1+k/Math.max(Math.hypot(t,q[1]),.03); return [q[1]*f,t*f]; });
  const shp=k=>{ const q=new THREE.Shape(); o.mirOut(k).forEach(([u,v],i)=>i?q.lineTo(u,-v):q.moveTo(u,-v)); return q; };
  const back=mesh(new THREE.ExtrudeGeometry(shp(.02),{depth:.006,bevelEnabled:false}).rotateX(-Math.PI/2),M.dark); back.position.y=.002; mk.add(back); const mf=mesh(new THREE.ShapeGeometry(shp(.014)).rotateX(Math.PI/2).scale(1,1,-1),MIR(),false); mf.material.side=THREE.DoubleSide; mk.add(mf);
  // mât ou rail
  if(rail){ const h=pl-.0254; [-.12,.12].forEach(x=>{ const t=o.part('Suspente',V(0,.0,0)); rod(t,[x,y1,za+.06],[x,h,za+.06],.01,M.steel); cbox(t,[x-.03,h-.006,za+.035],[x+.03,h,za+.085],M.dark,.002); rod(t,[x,y1,zb-.02],[x,h-.0508,zb-.02],.004,M.steel); }); const tr=o.part('Profilé',V(0,0,0)); cbox(tr,[-.0127,h-.0254,za+.02],[.0127,h,za+.06+EIS.rails[2]-EIS.rails[1]+.04],M.steel,.002); cbox(tr,[-.14,h-.0508,zb-.0327],[.14,h-.0254,zb-.0073],M.steel,.002); o.labels.push(['Rail 80/20 d’EISODE',V(0,h+.02,za)]); }
  else {
    const lo=o.part('Mât, bas',V(0,0,0)), hi=o.part('Mât, haut',V(0,.16,0)), ym=1.2, base=o.part('Platine',V(0,0,-.3)); ccyl(lo,MAT_D/2,ym-.01,[0,.01+(ym-.01)/2,za],M.white,'y'); ccyl(hi,MAT_D/2,y0+.04-ym,[0,ym+(y0+.04-ym)/2,za],M.white,'y'); ccyl(lo,MAT_D/2+.006,.05,[0,ym,za],M.dark,'y');
    const x0=-Rb-.004; cbox(base,[-.3,0,x0-.6],[.3,.01,x0],M.white,.003); [[-.2,x0-.5],[.2,x0-.5]].forEach(([x,z])=>{ const w2=mesh(new THREE.CylinderGeometry(.11,.11,.03,40),M.black); w2.position.set(x,.027,z); base.add(w2); }); [-1,1].forEach(k=>rod(lo,[k*.2,.012,za],[0,.22,za],.011,M.white)); rod(lo,[0,.012,za-.22],[0,.22,za],.011,M.white);
    cbox(hi,[-.05,y0-.02,za-.04],[.05,y0+.0,za+.2],M.white,.004); tube(hi,[[.02,y0,za-.045],[.03,1.4,za-.05],[.02,.3,za-.05],[.1,.02,za-.2]],.004,M.cable,30); }
  beam(o,['#5f7fe8','#3653c4'],V(0,m.yA,zl),G.map(([X,y])=>{ const q=m.M(X,y); return V(q[1],q[2],q[0]); }),G.map(([X,y])=>V(y,H+.004,X)));
  // cadre complet de l'image (noir du projecteur)
  const fw=m.w/2, n0=-m.xa+(m.off-.5)*m.h, n1=n0+m.h, ln=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(-fw,H+.006,n0),V(fw,H+.006,n0),V(fw,H+.006,n1),V(-fw,H+.006,n1)]),new THREE.LineBasicMaterial({color:'#c4232c',transparent:true,opacity:.6})); o.beams.add(ln);
  o.labels.push([P.court,V(0,y1+.06,(zl+zb)/2)],[`Miroir ${Math.round(m.ml*100)} × ${Math.round(m.mw*100)} cm`,V(0,m.yA-.02,za-.12)]);
  o.dims.push([V(-R,H+.03,0),V(R,H+.03,0),`image ${Math.round(R*2000)}`,V(0,0,.04)],[V(R+.35,0,za),V(R+.35,y1,za),`${Math.round(y1*1000)}`,V(.04,0,0)],[V(R+.15,0,0),V(R+.15,pl,0),`plafond ${Math.round(pl*1000)}`,V(.04,0,0)],[V(.5,.02,0),V(.5,.02,za),`${Math.round(-za*1000)} du centre`,V(.04,0,0)]);
}

// ================================================================ C. Dessus seul, projecteur du lieu au gril
function buildSol(s,o){
  const { O }=o, q=O.s, P=O.P, R=O.R, H=O.H, G=s.gril/1000, pj=o.part('Projecteur',V(0,.25,0));
  cbox(pj,[-P.w/2,q.lensY+.02,-P.h/2],[P.w/2,q.rear,P.h/2],M.whiteIn,.02); ccyl(pj,.055,.05,[0,q.lensY+.02,0],M.black,'y'); ccyl(pj,.043,.004,[0,q.lensY-.006,0],M.pad,'y');
  const cg=o.part('Accroche',V(0,.5,0)), w=P.w/2+.03; [-1,1].forEach(k=>cbox(cg,[k*w-.006,q.lensY+P.dep*.4,-.02],[k*w+.006,q.rear+.06,.02],M.dark,.002)); cbox(cg,[-w,q.rear+.05,-.02],[w,q.rear+.062,.02],M.dark,.002);
  if(G>q.rear+.07) rod(cg,[0,q.rear+.06,0],[0,G-.02,0],.02,M.dark); rod(cg,[.1,G-.02,.03],[.1,q.rear+.06,0],.003,M.steel); cbox(cg,[-.05,G-.045,-.045],[.05,G+.02,.045],M.dark,.006);
  const gr=o.part('Gril',V(0,.5,0)); [-1.2,0,1.2].forEach(z=>rod(gr,[-2.2,G,z],[2.2,G,z],.024,M.grey)); [-1.8,1.8].forEach(x=>rod(gr,[x,G+.05,-1.8],[x,G+.05,1.8],.024,M.grey)); o.gril=gr;
  const src=V(0,q.lensY,0), N=grid(R,96); beam(o,['#5f7fe8','#3653c4'],src,N.map(()=>src),N.map(([a,b])=>V(a,H+.004,b)));
  const fw=q.w/2, fh=q.h/2; o.beams.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-fw,-fh],[fw,-fh],[fw,fh],[-fw,fh]].map(([x,z])=>V(x,H+.006,z))),new THREE.LineBasicMaterial({color:'#c4232c',transparent:true,opacity:.6})));
  o.labels.push([P.court,V(.3,q.rear,0)],['Gril du lieu',V(1.5,G+.1,0)]);
  o.dims.push([V(-R,H+.03,0),V(R,H+.03,0),`image ${Math.round(R*2000)}`,V(0,0,.04)],[V(R+.5,0,0),V(R+.5,G,0),`gril ${Math.round(G*1000)}`,V(.04,0,0)],[V(R+.25,H,0),V(R+.25,q.lensY,0),`trajet ${Math.round(q.T*1000)}`,V(.04,0,0)]);
}

// ================================================================ D. Portique (session du 25 novembre 2026)
function buildPortique(s,o){
  const { O }=o, p=O.p, P=p.P, R=O.R, H=O.H, Rp=rpOf(s,O), top=p.top, bs=.08, ps=.07;
  for(let k=0;k<3;k++){ const a=TAU/6+k*TAU/3, S=Math.sin(a), C=Math.cos(a), x=S*Rp, z=C*Rp;
    const lo=o.part('Pied, bas',V(S*.18,0,C*.18)), hi=o.part('Pied, haut',V(S*.18,.16,C*.18)), be=o.part('Traverse',V(S*.1,.32,C*.1)); const c=(g,y0,y1)=>{ const b=cbox(g,[-ps/2,y0,-ps/2],[ps/2,y1,ps/2],M.white,.006); b.position.x=x; b.position.z=z; b.rotation.y=a; return b; };
    const b1=c(lo,0,1.2), b2=c(hi,1.2,top); const pl=cbox(lo,[-.17,0,-.17],[.17,.014,.17],M.white,.004); pl.position.x=x; pl.position.z=z; pl.rotation.y=a; const bg=new THREE.Group(); bg.position.set(0,top-bs/2,0); bg.rotation.y=a; be.add(bg); cbox(bg,[-bs/2,-bs/2,0],[bs/2,bs/2,Rp+ps/2],M.white,.006); if(k===0) o.cut.push(lo,hi,be); }
  const cs=o.part('Caisson',V(0,.66,0)), body=o.part('Projecteur',V(0,.1,0)), W=P.dim[0], Dp=P.dim[1], Hp=P.dim[2]; cs.position.z=body.position.z=-p.off;
  if(!p.mir){ cbox(body,[-W/2,p.lensY+.03,-Hp/2],[W/2,p.rear,Hp/2],M.whiteIn,.02); ccyl(body,.055,.05,[0,p.lensY+.025,0],M.black,'y',.05); const rc=Math.max(.3,Math.hypot(W,Hp)/2+.07), y0=p.lensY-.05, sh=[[rc-.01,y0],[rc,y0+.01],[rc,top],[0,top]].map(q=>new THREE.Vector2(...q)); [0,1].forEach(k=>{ const m=mesh(new THREE.LatheGeometry(sh,96,k?0:Math.PI,Math.PI),M.white); m.material=m.material.clone(); m.material.side=THREE.DoubleSide; cs.add(m); if(k) o.cut.push(m); }); const ring=mesh(new THREE.RingGeometry(.075,rc,96).rotateX(Math.PI/2),M.white); ring.position.y=y0; cs.add(ring); }
  else { const z0=MIRROR_GAP+.01, y=p.axisY; cbox(body,[-W/2,y-Hp/2,-(z0+Dp)],[W/2,y+Hp/2,-(z0+.03)],M.whiteIn,.02); ccyl(body,.055,.04,[0,y,-(z0+.01)],M.black,'z'); const mi=mesh(new THREE.PlaneGeometry(p.mirW,p.mirH),MIR()); mi.material.side=THREE.DoubleSide; mi.position.set(0,y,0); mi.rotation.x=Math.PI*.75; body.add(mi);
    const mz=p.mirH/2*Math.SQRT1_2, zA=mz+.05, zB=-(z0+Dp+.06), yA=y-Math.max(Hp/2,mz)-.05, wb=Math.max(W,p.mirW)/2+.06; [[[-wb,yA,zA-.012],[wb,top,zA]],[[-wb,yA,zB],[wb,top,zB+.012]],[[-wb,yA,zB],[-wb+.012,top,zA]],[[wb-.012,yA,zB],[wb,top,zA]],[[-wb,top-.012,zB],[wb,top,zA]],[[-wb,yA,zB],[wb,yA+.012,-mz-.03]]].forEach((c,i)=>{ const m=cbox(cs,c[0],c[1],M.white,.004); if(i===3||i===5) o.cut.push(m); }); }
  const src=V(0,p.mir?p.axisY:p.lensY,-p.off), rI=Math.min(R,p.circ/2), G=grid(rI,96); beam(o,['#5f7fe8','#3653c4'],src,G.map(()=>src),G.map(([a,b])=>V(a,H+.004,b)));
  const k=1, fw=p.fw*k/2, fh=p.fh*k/2; o.beams.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-fw,-fh],[fw,-fh],[fw,fh],[-fw,fh]].map(([x,z])=>V(x,H+.006,z))),new THREE.LineBasicMaterial({color:'#c4232c',transparent:true,opacity:.6})));
  o.labels.push([P.court+(p.mir?', couché, miroir à 45°':', pointé vers le bas'),V(0,top+.06,-p.off)]);
  o.dims.push([V(-R,H+.03,0),V(R,H+.03,0),`image ${Math.round(R*2000)}`,V(0,0,.04)],[V(Rp+.3,0,0),V(Rp+.3,top,0),`${Math.round(top*1000)}`,V(.04,0,0)]);
}
