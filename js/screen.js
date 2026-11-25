// Les trois systèmes d'écran, en pièces démontables. Origine au centre du disque, au sol ; côté technique vers -z.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, rod, tube, dots } from './util.js';
import { optics, GAP, SYS } from './optics.js';
import { MIRROR_GAP } from './proj.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z), TAU=Math.PI*2;
const FRAG=`
varying vec3 vP; uniform float uT,uA,uGain,uAmb; uniform vec3 uE;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*ns(p);p=mat2(1.6,1.2,-1.2,1.6)*p+7.3;a*=.5;}return s;}
vec2 dirA(float a){return vec2(sin(a),cos(a));}
void main(){
  vec2 p=vP.xz/uA;
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
  c=pow(max(c,0.),vec3(1.22))*.86; c=c/(1.+.18*c);
  float e = smoothstep(1.,.985,length(vP.xz)/uA);
  gl_FragColor=vec4(c*e*uGain+mix(vec3(.34,.34,.345),vec3(.115,.117,.125),e)*uAmb,uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function screenMaterial(R){
  return new THREE.ShaderMaterial({ side:THREE.DoubleSide, transparent:true, uniforms:{uT:{value:0},uA:{value:R},uGain:{value:1},uAmb:{value:0},uAlpha:{value:1},uE:{value:new THREE.Vector3()}},
    vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader:'uniform float uAlpha;\n'+FRAG });
}
const MIR=()=>new THREE.MeshStandardMaterial({color:'#e8edf2',metalness:1,roughness:.03});

export function buildScreen(s){
  const O=optics(s), g=new THREE.Group(), o={ g,O,sys:s.sys,parts:[],cut:[],labels:[],dims:[],beams:new THREE.Group(),R:O.R,H:O.H,Rb:O.Rb };
  g.add(o.beams); o.mat=screenMaterial(O.R);
  // pièce : groupe qui se déplace en vue éclatée
  o.part=(nom,ex,parent=g)=>{ const p=new THREE.Group(); p.userData.ex=ex; parent.add(p); o.parts.push(p); if(nom) p.name=nom; return p; };
  o.white=M.white;
  if(s.sys==='dessous') buildTable(s,o); else if(s.sys==='mat') buildMat(s,o); else buildPortique(s,o);
  o.setExplode=e=>o.parts.forEach(p=>{ p.userData.base??=p.position.clone(); p.position.copy(p.userData.base).addScaledVector(p.userData.ex,e); });
  o.setCut=v=>{ o.cut.forEach(m=>m.visible=!v); o.mat.uniforms.uAlpha.value=v&&s.sys==='dessous'?.6:1; };
  o.setBeams=v=>{ o.beams.visible=v; };
  return o;
}
function beam(o,cols,apex,mids,ends){ // apex -> mids -> ends
  const bm=new THREE.MeshBasicMaterial({color:cols[0],transparent:true,opacity:.1,side:THREE.DoubleSide,depthWrite:false}), ed=new THREE.LineBasicMaterial({color:cols[1],transparent:true,opacity:.75}), N=ends.length, t=[];
  for(let n=0;n<N;n++){ const k=(n+1)%N; t.push(apex,mids[n],mids[k],mids[n],ends[n],ends[k],mids[n],ends[k],mids[k]); }
  o.beams.add(new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(t),bm)); for(let n=0;n<N;n+=6) o.beams.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([apex,mids[n],ends[n]]),ed));
}
const lathe=(pts,m)=>mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(...p)),160),m);
function grid(R,n=72){ return Array.from({length:n},(_,i)=>{ const a=i/n*TAU; return [Math.sin(a)*R,Math.cos(a)*R]; }); }

// ================================================================ A. Table rétroprojetée
export const TUBE=.038, PIED=6;
function buildTable(s,o){
  const { O }=o, F=O.f, P=O.P, R=O.R, H=O.H, Rt=O.Rt, Rf=O.Rf, zt=H-.022;
  // toile
  const tl=o.part('Toile',V(0,.62,0)); const disc=new THREE.Mesh(new THREE.CircleGeometry(Rt+.012,160).rotateX(-Math.PI/2),o.mat); disc.position.y=H+.001; tl.add(disc); o.disc=disc;
  tl.add(lathe([[Rt+.021,H-.03],[Rt+.023,H-.012],[Rt+.015,H+.002],[Rt+.01,H+.003]],M.whiteIn));
  // anneau : six arcs, six noeuds
  for(let i=0;i<PIED;i++){ const a0=(i+.5)*TAU/PIED, am=a0+TAU/PIED/2, p=o.part('Arc',V(Math.sin(am)*.14,.36,Math.cos(am)*.14));
    const arc=TAU/PIED-.03, t=mesh(new THREE.TorusGeometry(Rt,TUBE/2,16,36,arc).rotateX(-Math.PI/2),M.white); t.rotation.y=am-Math.PI/2-arc/2; t.position.y=zt; p.add(t); }
  for(let i=0;i<PIED;i++){ const a=(i+.5)*TAU/PIED, S=Math.sin(a), C=Math.cos(a), n=o.part('Noeud',V(S*.1,.2,C*.1)); const c=mesh(new THREE.CylinderGeometry(.0235,.0235,.11,24),M.grey); c.rotation.z=Math.PI/2; const w=new THREE.Group(); w.rotation.y=a; w.position.set(S*Rt,zt,C*Rt); w.add(c); n.add(w); rod(n,[S*Rt,zt,C*Rt],[S*(Rt+(Rf-Rt)*.09),zt-.09,C*(Rt+(Rf-Rt)*.09)],.022,M.grey);
    const l=o.part('Pied',V(S*.1,0,C*.1)); rod(l,[S*(Rt+(Rf-Rt)*.04),zt-.04,C*(Rt+(Rf-Rt)*.04)],[S*Rf,.02,C*Rf],TUBE/2,M.white); const f=mesh(new THREE.CylinderGeometry(.034,.038,.02,28),M.black); f.position.set(S*Rf,.01,C*Rf); l.add(f);
    const a2=a+TAU/PIED, e=o.part('Traverse',V(Math.sin(a+TAU/12)*.22,0,Math.cos(a+TAU/12)*.22)); rod(e,[S*(Rf-.012),.09,C*(Rf-.012)],[Math.sin(a2)*(Rf-.012),.09,Math.cos(a2)*(Rf-.012)],.011,M.white); }
  // jupe : cône de tissu, blanc dehors, noir dedans, en deux moitiés
  [0,1].forEach(k=>{ const p=o.part('Jupe',V(k?2.5:2.5,0,0)), geo=d=>new THREE.CylinderGeometry(Rt+.026-d,Rf+.028-d,H-.07,96,1,true,k?0:Math.PI,Math.PI); const a=mesh(geo(0),M.white), b=mesh(geo(.004),M.skirt,false); [a,b].forEach(m=>{ m.position.y=.04+(H-.07)/2; p.add(m); });
    const L=[]; for(let j=0;j<6;j++) for(let i=0;i<200;i++){ const an=(k?0:Math.PI)+(i+.5)/200*Math.PI, w=.5+.5*Math.cos(an*6+j*.5), y=.1+j*.021, rr=Rf+.028+(Rt-Rf-.002)*(y-.04)/(H-.07), r=.0016+.0046*w*(1-j/7); L.push([V(Math.sin(an)*(rr+.001),y,Math.cos(an)*(rr+.001)),V(Math.sin(an),-.2,Math.cos(an)).normalize(),r]); } p.add(dots(L,M.hole)); if(k) o.cut.push(p); });
  if(!F) return;
  // banc optique : projecteur, miroir
  const W3=(x,y,z)=>V(y,z,x), bk=o.part('Banc optique',V(0,0,0)), lo=F.m1[1]<F.m2[1]?F.m1:F.m2, hi=F.m1[1]<F.m2[1]?F.m2:F.m1, sx=lo[0]+(hi[0]-lo[0])*.6, sz=lo[1]+(hi[1]-lo[1])*.6-.02, bl=Math.sqrt((Rf-.02)**2-.18**2), xA=Math.max(Math.min(F.x0,lo[0])-.04,-bl), xB=Math.min(Math.max(sx,F.x1)+.05,bl), xm=(xA+xB)/2;
  o.banc={ x0:xA,x1:xB,l:xB-xA,w:.36 };
  cbox(bk,[-.18,.006,xA],[.18,.024,xm-.003],M.ply,.003); cbox(bk,[-.18,.006,xm+.003],[.18,.024,xB],M.ply,.003); [-.12,.12].forEach(x=>ccyl(bk,.006,.06,[x,.027,xm],M.steel,'x'));
  // miroir
  const mx=(F.m1[0]+F.m2[0])/2, mz=(F.m1[1]+F.m2[1])/2, mg=new THREE.Group(); mg.position.copy(W3(mx,0,mz)); mg.rotation.x=-F.fa; bk.add(mg); const ct=Math.cos(F.fa), st=Math.sin(F.fa), G=grid(R,96);
  o.mirOut=k=>G.map(([X,y])=>{ const m=F.M(X), t=(m[0]-mx)*ct+(m[1]-mz)*st, yy=m[2]*y, f=1+k/Math.max(Math.hypot(t,yy),.06); return [yy*f,t*f]; });
  const shp=k=>{ const q=new THREE.Shape(); o.mirOut(k).forEach(([a,b],i)=>i?q.lineTo(a,-b):q.moveTo(a,-b)); return q; };
  const back=mesh(new THREE.ExtrudeGeometry(shp(.024),{depth:.01,bevelEnabled:false}).rotateX(-Math.PI/2),M.dark); back.position.y=-.012; mg.add(back); mg.add(mesh(new THREE.ShapeGeometry(shp(.018)).rotateX(-Math.PI/2),MIR(),false));
  [-1,1].forEach(k=>{ const x=k*Math.min(F.mw*.3,.155); rod(bk,[x,.024,sx+.03],[x,sz,sx],.009,M.dark); rod(bk,[x,.024,lo[0]+.02],[x,lo[1],lo[0]+.01],.009,M.dark); rod(bk,[x,.03,lo[0]+.02],[x,.03,sx+.03],.007,M.dark); });
  // projecteur incliné
  const pj=o.part('Projecteur',V(0,.0,-.35)), pg=new THREE.Group(), ax=V(0,F.ax[1],F.ax[0]), up=V(0,F.up[1],F.up[0]), lat=up.clone().cross(ax); pg.matrixAutoUpdate=false; pg.matrix.makeBasis(lat,up,ax).setPosition(W3(F.L[0],0,F.L[1])); pj.add(pg);
  cbox(pg,[-P.wl,-P.dn,-P.lens-P.dep],[P.w-P.wl,P.up,-P.lens],M.white,.014); ccyl(pg,.042,Math.max(P.lens,.012)+.02,[0,0,-Math.max(P.lens,.012)/2-.006],M.black,'z'); ccyl(pg,.033,.004,[0,0,.004],M.pad,'z');
  for(let i=0;i<8;i++) cbox(pg,[P.w-P.wl-.002,-P.dn*.6,-P.lens-P.dep+.04+i*.018],[P.w-P.wl+.002,P.up*.6,-P.lens-P.dep+.05+i*.018],M.hole);
  // berceau : plaque sous le projecteur, quatre pattes réglables
  const low=F.up[1]<0?1:-1, yy=low>0?P.up+.004:-P.dn-.004; cbox(pg,[-P.wl+.01,Math.min(yy,yy+low*.006),-P.lens-P.dep+.01],[P.w-P.wl-.01,Math.max(yy,yy+low*.006),-P.lens-.01],M.dark,.002);
  const bot=[[-P.wl+.03],[P.w-P.wl-.03]]; [P.lens+.03,P.lens+P.dep-.03].forEach(d=>bot.forEach(([x])=>{ const c=W3(F.L[0],0,F.L[1]).addScaledVector(ax,-d).addScaledVector(up,yy).addScaledVector(lat,x); rod(bk,[c.x,.024,c.z],c,.006,M.dark); }));
  beam(o,['#5f7fe8','#3653c4'],W3(F.L[0],0,F.L[1]),G.map(([X,y])=>{ const m=F.M(X); return W3(m[0],m[2]*y,m[1]); }),G.map(([X,y])=>W3(X,y,H)));
  // commutateur et prise
  cbox(bk,[.0,.026,xA+.02],[.18,.07,xA+.12],M.dark,.004);
  o.labels.push([P.court,V(0,F.z1+.08,(F.x0+F.x1)/2)],[`Miroir ${Math.round(F.ml*100)} × ${Math.round(F.mw*100)} cm`,V(0,hi[1]+.05,hi[0])],['Banc optique pliant',V(.3,.06,xm)]);
  o.dims.push([V(-R,H+.03,0),V(R,H+.03,0),`image ${Math.round(R*2000)}`,V(0,0,.04)],[V(-Rf,.03,Rt+.14),V(Rf,.03,Rt+.14),`au sol ${Math.round(Rf*2000)}`,V(0,0,.04)],[V(Rt+.16,0,0),V(Rt+.16,H,0),`${Math.round(H*1000)}`,V(.04,0,0)]);
}

// ================================================================ B. Plateforme et mât (ou rail 80/20)
export const MAT_D=.07;
function plateforme(s,o,Rp){
  const { O }=o, H=O.H, R=O.R, y=H>.02?H:.004;
  const tl=o.part('Surface',V(0,.0,0)); o.mat.uniforms.uA.value=Rp;
  if(H<.03){ const d=new THREE.Mesh(new THREE.CircleGeometry(R,160).rotateX(-Math.PI/2),o.mat); d.position.y=.003; tl.add(d); o.disc=d; }
  else { const n=6; for(let i=0;i<n;i++){ const a=i*TAU/n+TAU/12, am=a+TAU/n/2, p=o.part('Segment',V(Math.sin(am)*.34,0,Math.cos(am)*.34)); const sh=new THREE.Shape(); sh.moveTo(0,0); sh.lineTo(Math.cos(a-Math.PI/2+.0015)*R,Math.sin(a-Math.PI/2+.0015)*R); sh.absarc(0,0,R,a-Math.PI/2+.0015,a+TAU/n-Math.PI/2-.0015,false); sh.closePath();
      const b=mesh(new THREE.ExtrudeGeometry(sh,{depth:.018,bevelEnabled:false,curveSegments:40}).rotateX(-Math.PI/2),M.ply); b.position.y=H-.019; p.add(b);
      const d=new THREE.Mesh(new THREE.ShapeGeometry(sh,40).rotateX(-Math.PI/2),o.mat); d.position.y=H+.0005; p.add(d);
      [[R-.1,am-.38],[R-.1,am+.38],[.22,am]].forEach(([r,t])=>{ const f=mesh(new THREE.CylinderGeometry(.022,.026,Math.max(H-.02,.01),20),M.black); f.position.set(Math.sin(t)*r,(H-.02)/2,Math.cos(t)*r); p.add(f); });
      if(i===0) o.disc=d; }
    const rm=o.part('Chant',V(0,.22,0)); rm.add(lathe([[R+.004,H-.06>0?H-.06:.005],[R+.004,H+.001],[R,H+.001]],M.white)); }
}
function buildMat(s,o){
  const { O }=o, m=O.m, P=O.P, R=O.R, H=O.H, pl=s.plafond/1000, rail=s.accroche==='rail', yb=m.yA-P.h/2, zx=x=>x;       // x du calcul -> z du monde
  plateforme(s,o,R);
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
  if(rail){ const h=pl-.0254; [-.12,.12].forEach(x=>{ const t=o.part('Suspente',V(0,.0,0)); rod(t,[x,y1,za+.06],[x,h,za+.06],.01,M.steel); cbox(t,[x-.03,h-.006,za+.035],[x+.03,h,za+.085],M.dark,.002); rod(t,[x,y1,zb-.02],[x,h,zb-.02],.004,M.steel); }); const tr=o.part('Profilé',V(0,0,0)); cbox(tr,[-.0127,h-.0254,za-.02],[.0127,h,zb+.05],M.steel,.002); o.labels.push(['Rail 80/20 d’EISODE',V(0,h+.02,za)]); }
  else {
    const lo=o.part('Mât, bas',V(0,0,0)), hi=o.part('Mât, haut',V(0,.16,0)), ym=1.2, base=o.part('Platine',V(0,0,-.3)); ccyl(lo,MAT_D/2,ym-.01,[0,.01+(ym-.01)/2,za],M.white,'y'); ccyl(hi,MAT_D/2,y0+.04-ym,[0,ym+(y0+.04-ym)/2,za],M.white,'y'); ccyl(lo,MAT_D/2+.006,.05,[0,ym,za],M.dark,'y');
    const x0=-R-.012; cbox(base,[-.3,0,x0-.6],[.3,.01,x0],M.white,.003); [[-.2,x0-.5],[.2,x0-.5]].forEach(([x,z])=>{ const w2=mesh(new THREE.CylinderGeometry(.11,.11,.03,40),M.black); w2.position.set(x,.027,z); base.add(w2); }); [-1,1].forEach(k=>rod(lo,[k*.2,.012,za],[0,.22,za],.011,M.white)); rod(lo,[0,.012,za-.22],[0,.22,za],.011,M.white);
    cbox(hi,[-.05,y0-.02,za-.04],[.05,y0+.0,za+.2],M.white,.004); tube(hi,[[.02,y0,za-.045],[.03,1.4,za-.05],[.02,.3,za-.05],[.1,.02,za-.2]],.004,M.cable,30); }
  beam(o,['#5f7fe8','#3653c4'],V(0,m.yA,zl),G.map(([X,y])=>{ const q=m.M(X,y); return V(q[1],q[2],q[0]); }),G.map(([X,y])=>V(y,H+.004,X)));
  // cadre complet de l'image (noir du projecteur)
  const fw=m.w/2, n0=-m.xa+(m.off-.5)*m.h, n1=n0+m.h, ln=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(-fw,H+.006,n0),V(fw,H+.006,n0),V(fw,H+.006,n1),V(-fw,H+.006,n1)]),new THREE.LineBasicMaterial({color:'#c4232c',transparent:true,opacity:.6})); o.beams.add(ln);
  o.labels.push([P.court,V(0,y1+.06,(zl+zb)/2)],[`Miroir ${Math.round(m.ml*100)} × ${Math.round(m.mw*100)} cm`,V(0,m.yA-.02,za-.12)]);
  o.dims.push([V(-R,H+.03,0),V(R,H+.03,0),`image ${Math.round(R*2000)}`,V(0,0,.04)],[V(R+.35,0,za),V(R+.35,y1,za),`${Math.round(y1*1000)}`,V(.04,0,0)],[V(R+.15,0,0),V(R+.15,pl,0),`plafond ${Math.round(pl*1000)}`,V(.04,0,0)],[V(.5,.02,0),V(.5,.02,za),`${Math.round(-za*1000)} du centre`,V(.04,0,0)]);
}

// ================================================================ C. Plateforme et portique (session du 25 novembre 2026)
function buildPortique(s,o){
  const { O }=o, p=O.p, P=p.P, R=O.R, H=O.H, Rp=R+Math.max(.24,s.ecart/1000*.62), top=p.top, bs=.08, ps=.07; p.Rp=Rp;
  plateforme(s,o,Math.min(R,p.circ/2));
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
  o.dims.push([V(-R,H+.03,0),V(R,H+.03,0),`plateforme ${Math.round(R*2000)}`,V(0,0,.04)],[V(Rp+.3,0,0),V(Rp+.3,top,0),`${Math.round(top*1000)}`,V(.04,0,0)]);
}
