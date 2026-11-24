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

// Projecteurs à plat dans le socle, miroirs à 45°, image vers le haut. Plan (x,z), disque de -R à R à z = H.
// Cherche le plus petit socle rond où rien ne fait ombre. Pour deux projecteurs, le second est le symétrique (x -> -x).
const inP=(x,z,Q)=>{ let c=false; for(let i=0,n=Q.length;i<n;i++){ const [x1,z1]=Q[i],[x2,z2]=Q[(i+1)%n]; if((z1>z)!==(z2>z)&&x<(x2-x1)*(z-z1)/(z2-z1)+x1) c=!c; } return c; };
const ori=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
const hits=(A,B)=>{ for(let i=0;i<A.length;i++) for(let j=0;j<B.length;j++){ const a=A[i],b=A[(i+1)%A.length],c=B[j],d=B[(j+1)%B.length]; if(ori(a,b,c)*ori(a,b,d)<0&&ori(c,d,a)*ori(c,d,b)<0) return true; } return inP(...A[0],B)||inP(...B[0],A); };
const flip=Q=>Q.map(([x,z])=>[-x,z]);
export const OV=.12;
export function solve(P,R,H){
  const duo=P.n===2, Xa=-R, Xb=duo?OV/2:R, need=Xb-Xa, w=Math.max(2*R*1.02,need*1.02*P.aspect), h=w/P.aspect, T=P.tr*w; let best=null;
  for(const fr of duo?[0,.5,1]:[.5]) for(const lean of [1,-1]) for(const sv of P.s) for(const sg of [1,-1]){
    const Xc=(Xa+Xb)/2+(fr-.5)*(h-need)*.9, pv=[Xc+sv*h*lean,H-T], n=[-Math.SQRT1_2*sg,Math.SQRT1_2];
    const refl=v=>{ const d=v[0]*n[0]+v[1]*n[1]; return [v[0]-2*d*n[0],v[1]-2*d*n[1]]; }, ax=refl([0,1]), up=refl([-lean,0]);
    for(let q=-R-.4;q<=R+.4;q+=.02){
      const m0=[q,.03], off=(pv[0]-q)*n[0]+(pv[1]-.03)*n[1]; if(off>=-.02) continue;
      const M=X=>{ const d=[X-pv[0],T], k=-off/(d[0]*n[0]+d[1]*n[1]); return [pv[0]+k*d[0],pv[1]+k*d[1],k]; }, m1=M(Xa), m2=M(Xb);
      if(!(m1[2]>0&&m1[2]<.97&&m2[2]>0&&m2[2]<.97)||Math.min(m1[1],m2[1])<.025||Math.max(m1[1],m2[1])>H-.08) continue;
      const r=refl([pv[0]-q,pv[1]-.03]), L=[q+r[0],.03+r[1]], at=(d,e)=>[L[0]-ax[0]*d+up[0]*e,L[1]-ax[1]*d+up[1]*e], mk=d=>[at(d,P.up),at(d,-P.dn),at(P.dep,-P.dn),at(P.dep,P.up)], bd=mk(0);
      const zs=bd.map(p=>p[1]); if(Math.min(...zs)<.03||Math.max(...zs)>H-.05) continue;
      let Rb=Math.max(...bd.map(p=>Math.hypot(p[0],P.w/2)),R)+.03; if(best&&Rb>=best.Rb-1e-4) continue;
      const p2=m=>[m[0],m[1]], beam=[p2(m1),p2(m2),[Xb,H],[Xa,H]], inc=[[L[0]+ax[0]*.004,L[1]+ax[1]*.004],p2(m1),p2(m2)], back=[p2(m1),p2(m2),[m2[0]-n[0]*.02,m2[1]-n[1]*.02],[m1[0]-n[0]*.02,m1[1]-n[1]*.02]];
      if(hits(bd,beam)||hits(mk(.006),inc)||hits(back,bd)||bd.some(p=>inP(p[0]+.015,p[1],beam)||inP(p[0]-.015,p[1],beam))) continue;
      if(duo&&([beam,inc,bd].some(Q=>hits(bd,flip(Q)))||[beam,inc,bd,back].some(Q=>hits(back,flip(Q))))) continue;
      let mw=0; for(let i=0;i<=30;i++){ const X=Xa+(Xb-Xa)*i/30, m=M(X), y=m[2]*Math.sqrt(Math.max(R*R-X*X,0)); mw=Math.max(mw,y); Rb=Math.max(Rb,Math.hypot(m[0],y)+.04); }
      if(best&&Rb>=best.Rb-1e-4) continue;
      best={ Rb,T,w,h,pv,L,ax:ax[0],up:up[1],sg,m1,m2,M,Xa,Xb,x0:Math.min(...bd.map(p=>p[0])),x1:Math.max(...bd.map(p=>p[0])),z0:Math.min(...zs),z1:Math.max(...zs),ml:Math.hypot(m2[0]-m1[0],m2[1]-m1[1])+.05,mw:2*mw+.05,sv };
    } }
  return best;
}
const CACHE=new Map();
export function optics(s){
  const k=[s.proj,s.diam,s.ecranH].join(); if(CACHE.has(k)) return CACHE.get(k);
  const P=PROJ[s.proj], R=s.diam*FT/2, H=s.ecranH/1000, f=solve(P,R,H), o={ P,R,H,f,Rb:f?f.Rb:R+.1 };
  if(f){ o.px=f.h/P.px*1000; o.lux=P.lm*.9/(f.w*f.h); o.rim=f.Rb-R; let t=0; for(let i=0;i<=60;i++){ const X=f.Xa+(f.Xb-f.Xa)*i/60; t=Math.max(t,Math.hypot(X-f.pv[0],Math.sqrt(Math.max(R*R-X*X,0)))); } o.inc=Math.atan2(t,f.T)*180/Math.PI; }
  CACHE.set(k,o); return o;
}
export function diamMax(s){ let m=3; for(let d=3;d<=7.001;d+=.25){ const f=solve(PROJ[s.proj],d*FT/2,s.ecranH/1000); if(f&&f.Rb-d*FT/2<.2) m=d; } return m; }

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
  // --- projecteurs, miroirs, faisceaux. Repère du calcul : x -> z du monde
  const pj=new THREE.Group(); scr.add(pj); out.proj=pj; const beams=new THREE.Group(); scr.add(beams); out.beams=beams;
  if(F) for(let u=0;u<P.n;u++){
    const G=new THREE.Group(), B=new THREE.Group(); G.rotation.y=B.rotation.y=u*Math.PI; pj.add(G); beams.add(B);
    const W3=(x,y,z)=>V(y,z,x), bx=(x0,y0,z0,x1,y1,z1,m,r)=>cbox(G,[y0,z0,x0],[y1,z1,x1],m,r);
    bx(F.x0,-P.w/2,F.z0,F.x1,P.w/2,F.z1,M.white,.02);
    for(let i=0;i<9;i++) bx(F.x0+.05+i*.02,P.w/2-.002,F.z0+.03,F.x0+.06+i*.02,P.w/2+.002,F.z1-.03,M.hole);
    ccyl(G,.036,.03,[-.06,F.L[1],F.L[0]-F.ax*.006],M.black,'z'); ccyl(G,.028,.004,[-.06,F.L[1],F.L[0]+F.ax*.011],M.pad,'z');
    // support : plaque et quatre pattes
    bx(F.x0+.015,-P.w/2+.02,F.z0-.012,F.x1-.015,P.w/2-.02,F.z0-.002,M.dark,.003);
    [-1,1].forEach(k=>[F.x0+.04,F.x1-.04].forEach(x=>rod(G,[k*P.w*.4,0,x],[k*P.w*.4,F.z0-.01,x],.009,M.dark)));
    // miroir
    const mx=(F.m1[0]+F.m2[0])/2, mz=(F.m1[1]+F.m2[1])/2, mg=new THREE.Group(); mg.position.copy(W3(mx,0,mz)); mg.rotation.x=-F.sg*Math.PI/4; G.add(mg);
    const rim=[]; for(let n=0;n<=48;n++){ const X=F.Xa+(F.Xb-F.Xa)*n/48; rim.push([X,Math.sqrt(Math.max(R*R-X*X,0))]); } const full=[...rim,...[...rim].reverse().map(([X,y])=>[X,-y])];
    const plate=k=>{ const q=new THREE.Shape(); full.forEach(([X,y],i)=>{ const m=F.M(X), t=((m[0]-mx)+F.sg*(m[1]-mz))*Math.SQRT1_2, yy=m[2]*y, f=1+k/Math.max(Math.hypot(t,yy),.06); i?q.lineTo(yy*f,-t*f):q.moveTo(yy*f,-t*f); }); return q; };
    const bk=mesh(new THREE.ExtrudeGeometry(plate(.022),{depth:.006,bevelEnabled:false}).rotateX(-Math.PI/2),M.dark); bk.position.y=-.008; mg.add(bk);
    mg.add(mesh(new THREE.ShapeGeometry(plate(.016)).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:'#e8edf2',metalness:1,roughness:.03}),false));
    const hi=F.m1[1]>F.m2[1]?F.m1:F.m2, lo=F.m1[1]>F.m2[1]?F.m2:F.m1, hx=lo[0]+(hi[0]-lo[0])*.8, hz=lo[1]+(hi[1]-lo[1])*.8-.02; [-1,1].forEach(k=>{ const x=k*F.mw*.16; rod(G,[x,0,hx],[x,hz,hx],.008,M.dark); rod(G,[x,.01,lo[0]],[x,.01,hx],.008,M.dark); });
    // faisceau
    const bm=new THREE.MeshBasicMaterial({color:u?'#e0604a':'#5f7fe8',transparent:true,opacity:.085,side:THREE.DoubleSide,depthWrite:false}), ed=new THREE.LineBasicMaterial({color:u?'#c4232c':'#3653c4',transparent:true,opacity:.75});
    const lens=W3(F.L[0],0,F.L[1]), ma=full.map(([X,y])=>{ const m=F.M(X); return W3(m[0],m[2]*y,m[1]); }), di=full.map(([X,y])=>W3(X,y,H)), N=full.length, t1=[],t2=[];
    for(let n=0;n<N;n++){ const k=(n+1)%N; t1.push(lens,ma[n],ma[k]); t2.push(ma[n],di[n],di[k],ma[n],di[k],ma[k]); }
    [t1,t2].forEach(t=>B.add(new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(t),bm)));
    for(let n=0;n<N;n+=8) B.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([lens,ma[n],di[n]]),ed));
  }
  // moyeu : commutateur + alimentation
  cbox(scr,[-Rb*.7-.08,.02,-.14],[-Rb*.7+.08,.14,.14],M.dark,.006);
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
