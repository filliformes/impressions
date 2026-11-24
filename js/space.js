// L'espace : écran de rétroprojection, trois instruments, régie, public.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, rod, tube, dots, disposeTree } from './util.js';
import { FT, INSTR, PROJ } from './data.js';
import { buildAssembly, person } from './assembly.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z), TAU=Math.PI*2;
const FRAG=`
varying vec2 vUv; varying vec3 vP; uniform float uT,uCyl,uA,uGain,uAmb; uniform vec3 uE;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*ns(p);p=mat2(1.6,1.2,-1.2,1.6)*p+7.3;a*=.5;}return s;}
vec2 dirA(float a){return vec2(sin(a),cos(a));}
void main(){
  vec2 p; if(uCyl>.5){ float a=atan(vP.x,vP.z); float r=1.-.75*vUv.y; p=dirA(a)*r; } else p=vP.xz/uA;
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
  float e = uCyl>.5 ? smoothstep(0.,.05,vUv.y)*smoothstep(1.,.95,vUv.y) : smoothstep(1.,.985,length(vP.xz)/uA);
  gl_FragColor=vec4(c*e*uGain+vec3(.115,.117,.125)*uAmb,uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function screenMaterial(R,cyl){
  return new THREE.ShaderMaterial({ side:THREE.DoubleSide, transparent:true, uniforms:{uT:{value:0},uCyl:{value:cyl?1:0},uA:{value:R},uGain:{value:1},uAmb:{value:0},uAlpha:{value:1},uE:{value:new THREE.Vector3()}},
    vertexShader:'varying vec2 vUv;varying vec3 vP;void main(){vUv=uv;vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float uAlpha;\n'+FRAG });
}

// Projecteur à plat dans le socle, miroir à 45°, image vers le haut.
// Plan (x,z) : disque de -R à R à z = H ; miroir z = x - c ; objectif en (-x0, z0), axe vers +x.
// Cherche le plus petit socle rond sans que le boîtier fasse ombre.
export function solve(P,R,H){
  const Di=2*R*1.02, T=P.tr*P.aspect*Di, A=T-H; let best=null;
  for(let si=0;si<=40;si++){ const sh=(P.s[0]+(P.s[1]-P.s[0])*si/40)*Di;
    for(let z0=P.bot+.03;z0<.8;z0+=.01){
      const c=sh-z0, xl=-(A-c), mir=X=>{ const den=T-X+sh; if(den<=0) return null; const u=(A+z0)/den, z=-A+u*T; return [z+c,z,u]; }, m1=mir(-R), m2=mir(R);
      if(!m1||!m2||m1[1]<.025||m2[1]>H-.06||m1[0]<xl+.04||m1[2]<=0||m1[2]>=1||m2[2]>=1) continue;
      const ray=x=>x>=m1[0]?-1:x<=-R?9:m1[1]+(H-m1[1])*(x-m1[0])/(-R-m1[0]), bx1=xl-P.lens, bx0=bx1-P.dep;
      if(ray(xl)<z0+(P.lens>0?.075:P.top)+.015||ray(bx1)<z0+P.top+.015||z0+P.top>H-.08) continue;
      const Rb=Math.max(Math.hypot(bx0,P.w/2),Math.abs(m2[0]),R)+.03; if(best&&Rb>=best.Rb) continue;
      best={ Rb,sh,Di,T,A,z0,c,xl,bx0,bx1,m1,m2,mir };
    } }
  if(best){ let wy=0; for(let i=-40;i<=40;i++){ const X=R*i/40; wy=Math.max(wy,best.mir(X)[2]*Math.sqrt(Math.max(R*R-X*X,0))); } best.mw=2*wy+.06; best.ml=(best.m2[1]-best.m1[1])*Math.SQRT2+.05; }
  return best;
}
const CACHE=new Map();
export function optics(s){
  const k=[s.proj,s.diam,s.ecranH].join(); if(CACHE.has(k)) return CACHE.get(k);
  const P=PROJ[s.proj], R=s.diam*FT/2, H=s.ecranH/1000, f=solve(P,R,H), o={ P,R,H,f,Rb:f?f.Rb:R+.1 };
  o.px=2*R*1.02/P.px*1000; o.lux=P.lm*.9*(Math.PI/4/P.aspect)/1.02/1.02/(Math.PI*R*R);
  if(f){ o.inc=Math.atan2(R+Math.abs(f.sh),f.T)*180/Math.PI; o.rim=f.Rb-R; }
  CACHE.set(k,o); return o;
}
export function diamMax(s){ let m=0; for(let d=3;d<=7.001;d+=.25) if(solve(PROJ[s.proj],d*FT/2,s.ecranH/1000)) m=d; return m; }

export function buildSpace(s,lists){
  const g=new THREE.Group(), R=s.diam*FT/2, H=s.ecranH/1000, RW=s.salle, RH=3.8, out={ g, inst:[], lights:[] };
  // --- galerie blanche : sol, murs, plafond
  const flat=(w,h,m)=>mesh(new THREE.PlaneGeometry(w,h),m,false);
  const floor=flat(RW,RW,new THREE.MeshStandardMaterial({color:'#dedede',roughness:.6})); floor.rotation.x=-Math.PI/2; g.add(floor);
  const wm=new THREE.MeshStandardMaterial({color:'#f7f7f5',roughness:.95}), walls=new THREE.Group(); g.add(walls); out.walls=walls;
  [[0,-1,0],[0,1,Math.PI],[-1,0,Math.PI/2],[1,0,-Math.PI/2]].forEach(([x,z,r])=>{ const w=flat(RW,RH,wm); w.position.set(x*RW/2,RH/2,z*RW/2); w.rotation.y=r; walls.add(w); });
  const ceil=flat(RW,RW,wm); ceil.rotation.x=Math.PI/2; ceil.position.y=RH; g.add(ceil); out.ceil=ceil;
  const tl0=new THREE.MeshBasicMaterial({color:'#ffffff'}); out.tubes=tl0; out.tubeG=new THREE.Group(); g.add(out.tubeG);
  [-1,0,1].forEach(k=>{ const t=new THREE.Mesh(new THREE.BoxGeometry(RW*.62,.03,.06),tl0); t.position.set(0,RH-.05,k*RW*.27); out.tubeG.add(t); });
  // --- écran : un disque dans un socle rond
  const scr=new THREE.Group(); g.add(scr);
  const O=optics(s), F=O.f, P=O.P, Rb=O.Rb, mat=screenMaterial(R,false); out.screenMat=mat; out.O=O;
  const disc=new THREE.Mesh(new THREE.CircleGeometry(R-.006,160).rotateX(-Math.PI/2),mat); disc.position.y=H+.002; scr.add(disc); out.disc=disc;
  const lathe=(pts,m)=>{ const o=mesh(new THREE.LatheGeometry([...pts].reverse().map(p=>new THREE.Vector2(...p)),180),m); scr.add(o); return o; };
  lathe([[R-.006,H-.004],[R-.006,H+.004],[Rb-.004,H+.004],[Rb,H],[Rb,H-.06],[Rb-.012,H-.06]],M.white);          // dessus + jante
  lathe([[Rb-.05,0],[Rb-.012,0],[Rb-.012,.05],[Rb-.05,.05],[Rb-.05,0]],M.white);                                    // pied
  // paroi blanche en deux moitiés (la moitié +x s'ouvre en coupe), noire à l'intérieur
  const half=[[],[]], inM=M.skirt; [0,1].forEach(k=>{ const geo=r=>new THREE.CylinderGeometry(r,r,H-.1,120,1,true,k?0:Math.PI,Math.PI); const a=mesh(geo(Rb-.006),M.white), c=mesh(geo(Rb-.012),inM,false); [a,c].forEach(m=>{ m.position.y=.045+(H-.1)/2; scr.add(m); half[k].push(m); }); });
  for(let i=0;i<12;i++){ const a=i*TAU/12+TAU/24, d=Math.abs(((a-Math.PI+3*Math.PI)%TAU)-Math.PI); rod(scr,[Math.sin(a)*(Rb-.03),.04,Math.cos(a)*(Rb-.03)],[Math.sin(a)*(Rb-.03),H-.06,Math.cos(a)*(Rb-.03)],.011,M.grey); }
  // prises d'air : même trame que le case
  const L=[[],[]]; for(let j=0;j<6;j++) for(let i=0;i<360;i++){ const a=i/360*TAU, w=.5+.5*Math.cos(a*6+j*.5), r=.0016+.0046*w*(1-j/7); L[Math.sin(a)>0?1:0].push([V(Math.sin(a)*(Rb-.0052),.085+j*.02,Math.cos(a)*(Rb-.0052)),V(Math.sin(a),0,Math.cos(a)),r]); }
  L.forEach((l,k)=>{ const d=dots(l,M.hole); scr.add(d); half[k].push(d); });
  // --- projecteur, miroir, faisceau. Repère du calcul : x -> z du monde
  const pj=new THREE.Group(); scr.add(pj); out.proj=pj; const beams=new THREE.Group(); scr.add(beams); out.beams=beams;
  if(F){
    const W3=(x,y,z)=>V(y,z,x), bx=(x0,y0,z0,x1,y1,z1,m,r)=>cbox(pj,[y0,z0,x0],[y1,z1,x1],m,r);
    bx(F.bx0,-P.w/2,F.z0-P.bot,F.bx1,P.w/2,F.z0+P.top,P.lens?M.white:M.black,.02);
    for(let i=0;i<12;i++) bx(F.bx0+.05+i*.03,P.w/2-.002,F.z0-P.bot*.5,F.bx0+.062+i*.03,P.w/2+.002,F.z0+P.top*.6,M.hole);
    const lr=P.lens?.07:.035, ln=ccyl(pj,lr,Math.max(P.lens,.02)+.02,[0,F.z0,F.xl-Math.max(P.lens,.02)/2],M.black,'z'); ccyl(pj,lr*.78,.004,[0,F.z0,F.xl+.011],M.pad,'z');
    const yb=F.z0-P.bot; if(yb>.06){ [-1,1].forEach(k=>[F.bx0+.06,F.bx1-.06].forEach(x=>rod(pj,[k*P.w*.4,0,x],[k*P.w*.4,yb,x],.012,M.dark))); bx(F.bx0+.02,-P.w/2,yb-.012,F.bx1-.02,P.w/2,yb,M.dark,.003); }
    if(P.inverse){ const yt=F.z0+P.top; bx(F.bx0+.03,-P.w/2,yt,F.bx1-.03,P.w/2,yt+.01,M.dark,.003); }
    // miroir
    const dx=F.ml/2/Math.SQRT2, mx=(F.m1[0]+F.m2[0])/2, mz=(F.m1[1]+F.m2[1])/2, mg=new THREE.Group(); mg.position.copy(W3(mx,0,mz)); mg.rotation.x=-Math.PI/4; pj.add(mg);
    const sh=k=>{ const q=new THREE.Shape(); for(let n=0;n<64;n++){ const a=n/64*TAU, X=Math.sin(a)*R, m=F.mir(X), tt=((m[0]-mx)+(m[1]-mz))/Math.SQRT2, yy=m[2]*Math.cos(a)*R; const f=1+k/Math.max(Math.hypot(tt,yy),.05); n?q.lineTo(yy*f,-tt*f):q.moveTo(yy*f,-tt*f); } return q; };
    const back=mesh(new THREE.ExtrudeGeometry(sh(.02),{depth:.006,bevelEnabled:false}).rotateX(-Math.PI/2),M.dark); back.position.y=-.008; mg.add(back);
    mg.add(mesh(new THREE.ShapeGeometry(sh(.015)).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:'#e8edf2',metalness:1,roughness:.03}),false));
    [-1,1].forEach(k=>{ const x=k*F.mw*.2, zt=mx+dx*.75, yt=mz+dx*.75-.02; rod(pj,[x,0,zt],[x,yt,zt],.01,M.dark); rod(pj,[x,.01,mx-dx+.02],[x,.01,zt],.01,M.dark); });
    // faisceau
    const bm=new THREE.MeshBasicMaterial({color:'#7f9dff',transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false}), ed=new THREE.LineBasicMaterial({color:'#4565d8',transparent:true,opacity:.8});
    const lens=W3(F.xl,0,F.z0), ma=[], di=[]; for(let n=0;n<=72;n++){ const a=n/72*TAU, X=Math.sin(a)*R, Yy=Math.cos(a)*R, m=F.mir(X); ma.push(W3(m[0],m[2]*Yy,m[1])); di.push(W3(X,Yy,H)); }
    const t1=[],t2=[]; for(let n=0;n<72;n++){ t1.push(lens,ma[n],ma[n+1]); t2.push(ma[n],di[n],di[n+1],ma[n],di[n+1],ma[n+1]); }
    [t1,t2].forEach(t=>beams.add(new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(t),bm)));
    for(let n=0;n<72;n+=6) beams.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([lens,ma[n],di[n]]),ed));
  }
  // moyeu : commutateur + alimentation
  cbox(scr,[-Rb*.62-.1,.02,.02],[-Rb*.62+.1,.14,.3],M.dark,.006);
  out.setCut=v=>{ half[1].forEach(m=>m.visible=!v); mat.uniforms.uAlpha.value=v?.6:1; out.inst.forEach((a,i)=>a.g.visible=!(v&&i===1)); out.players.children[1].visible=!v; };
  out.setBeams=v=>{ beams.visible=v; };
  const cyl=false;

  // --- instruments
  const Rr=Rb+s.ecart/1000+.16; out.Rr=Rr;
  const cables=new THREE.Group(); g.add(cables); out.cables=cables;
  const pub=new THREE.Group(), players=new THREE.Group(); g.add(pub,players); out.visitors=pub; out.players=players;
  Object.keys(INSTR).forEach((n,i)=>{
    const a=i*TAU/3, as=buildAssembly({stand:s.stand,mic:s.mic,open:s.open,xray:false,silicone:s.silicone,padH:s.padH,nom:n});
    as.g.position.set(Math.sin(a)*Rr,0,Math.cos(a)*Rr); as.g.rotation.y=a; g.add(as.g); as.angle=a; out.inst.push(as);
    const pl=person({h:[1.72,1.62,1.8][i],pose:'joue',handY:s.padH/1000,mat:M.fig}); const pr=Rr+.41; pl.position.set(Math.sin(a)*pr,0,Math.cos(a)*pr); pl.rotation.y=a; players.add(pl);
    // rayon : réseau + courant, de l'instrument au moyeu
    const tg=V(Math.cos(a),0,-Math.sin(a)), rd=V(Math.sin(a),0,Math.cos(a));
    [.02,-.02].forEach((o,k)=>tube(cables,[rd.clone().multiplyScalar(Rr-.14).addScaledVector(tg,o).setY(.22),rd.clone().multiplyScalar(Rr-.21).addScaledVector(tg,o).setY(.03),rd.clone().multiplyScalar((Rr+Rb)/2-.1).addScaledVector(tg,o*1.6).setY(.008),rd.clone().multiplyScalar(Rb-.1).addScaledVector(tg,o).setY(.008),rd.clone().multiplyScalar(Rb*.6).addScaledVector(tg,o).setY(.02)],k?.0045:.0035,k?M.cable:M.pcb,60));
    const ramp=mesh(new THREE.BoxGeometry(.16,.014,Math.max(Rr-Rb-.16,.05)),M.whiteIn); ramp.position.copy(rd.clone().multiplyScalar((Rr-.16+Rb)/2)).setY(.008); ramp.rotation.y=a; cables.add(ramp);
    // douche étroite sur l'instrument
    const sp=new THREE.SpotLight('#fff6ec',14,0,.25,.85,2); sp.position.set(Math.sin(a)*(Rr-.5),RH-.15,Math.cos(a)*(Rr-.5)); sp.target.position.set(Math.sin(a)*(Rr+.02),1,Math.cos(a)*(Rr+.02)); sp.castShadow=true; sp.shadow.mapSize.set(1024,1024); sp.shadow.bias=-.0004; sp.shadow.normalBias=.01; sp.shadow.camera.near=.5; sp.shadow.camera.far=6; g.add(sp,sp.target); out.lights.push(sp);
    ccyl(g,.045,.14,[sp.position.x,RH-.09,sp.position.z],M.white,'y').castShadow=false;
    // lueur de l'écran, teintée par l'instrument
    const gl=new THREE.PointLight([ '#5f8dff','#ff5a3c','#ffc47a' ][i],cyl?1.6:2.6,6,1.7); const gr=R*.62; gl.position.set(Math.sin(a)*gr,cyl?.8:H+.22,Math.cos(a)*gr); g.add(gl); (out.glow??=[]).push(gl);
  });
  // --- public
  [[3.2,1.1,'debout',1.68],[2.75,2.75,'marche',1.6],[3.3,3.2,'debout',1.76],[2.9,5.25,'marche',1.7],[3.35,4.85,'debout',1.58]].forEach(([d,a,p,h],i)=>{
    const rr=Math.min(Math.max(Rb+d-1.05,Rb+.8),RW/2-.5), o=person({h,pose:p,mat:M.figDark}); o.position.set(Math.sin(a)*rr,0,Math.cos(a)*rr); o.rotation.y=p==='marche'?a+1.8:a; pub.add(o); });
  // --- régie
  const rg=new THREE.Group(); g.add(rg); rg.position.set(-RW/2+1.35,0,-RW/2+1.35); rg.rotation.y=Math.PI/4; out.regie=rg;
  cbox(rg,[-.8,.72,-.35],[.8,.745,.35],M.table,.004); [[-.75,-.3],[.75,-.3],[-.75,.3],[.75,.3]].forEach(p=>cbox(rg,[p[0]-.02,0,p[1]-.02],[p[0]+.02,.72,p[1]+.02],M.black));
  const ui=document.createElement('canvas'); ui.width=512; ui.height=320; const x=ui.getContext('2d'); x.fillStyle='#0e0f12'; x.fillRect(0,0,512,320);
  ['#1d2c66','#3a5bd0','#b8383a','#d8b56a'].forEach((c,i)=>{ x.fillStyle=c; x.fillRect(16+i*122,18,112,66); x.fillStyle='#2a2d35'; for(let k=0;k<6;k++) x.fillRect(16+i*122,96+k*14,112*(.4+((i*3+k*5)%6)/10),8); });
  const gr=x.createRadialGradient(370,245,5,370,245,62); gr.addColorStop(0,'#ffd9a0'); gr.addColorStop(.4,'#3d62d8'); gr.addColorStop(1,'#0a0d24'); x.fillStyle=gr; x.beginPath(); x.arc(370,245,60,0,TAU); x.fill(); x.fillStyle='#39d0d8'; for(let k=0;k<40;k++) x.fillRect(20+k*6,300-40*Math.abs(Math.sin(k*.5)*Math.cos(k*.13)),4,40*Math.abs(Math.sin(k*.5)*Math.cos(k*.13)));
  const ut=new THREE.CanvasTexture(ui); ut.colorSpace=THREE.SRGBColorSpace;
  const mon=cbox(rg,[-.3,.86,.04],[.3,1.22,.06],M.black,.006); const ms=new THREE.Mesh(new THREE.PlaneGeometry(.575,.335),new THREE.MeshBasicMaterial({map:ut})); ms.position.set(0,1.04,.038); ms.rotation.y=Math.PI; rg.add(ms);
  cbox(rg,[-.04,.745,.04],[.04,.87,.06],M.black); cbox(rg,[-.22,.745,-.26],[.22,.757,-.1],M.dark,.003); cbox(rg,[.42,.745,-.12],[.66,.8,.12],M.steel,.01); cbox(rg,[-.7,.745,-.12],[-.45,.785,.06],M.black,.004);
  const op=person({h:1.72,pose:'regie',mat:M.figDark}); op.position.set(0,0,-.62); op.rotation.y=Math.PI; rg.add(op); out.op=op;
  const pl=new THREE.PointLight('#7fa4ff',.5,2.2,2); pl.position.set(0,1.05,-.2); rg.add(pl);
  // tronc : image, réseau et courant, du moyeu à la régie
  const A=V(-RW/2+1.6,.01,-RW/2+1.6), dA=A.clone().setY(0).normalize();
  [-.03,0,.03].forEach((o,k)=>{ const n=V(dA.z,0,-dA.x).multiplyScalar(o); tube(cables,[dA.clone().multiplyScalar(Rb*.5).add(n).setY(.02),dA.clone().multiplyScalar(Rb-.06).add(n).setY(.01),dA.clone().multiplyScalar(Rb+.8).add(n).setY(.012),A.clone().add(n)],[.0035,.004,.005][k],[M.pcb,M.red,M.cable][k],40); });
  const tl=A.length()-Rb-.1, tr=mesh(new THREE.BoxGeometry(.24,.02,tl),M.whiteIn); tr.position.copy(dA.clone().multiplyScalar(Rb+.05+tl/2)).setY(.008); tr.rotation.y=Math.atan2(dA.x,dA.z); cables.add(tr);
  out.info={ R,Rb,H,Rr,RW,RH,dist:2*Rr*Math.sin(Math.PI/3) };
  return out;
}
