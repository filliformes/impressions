// L'espace : écran de rétroprojection, trois instruments, régie, public.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, rod, tube, dots, disposeTree } from './util.js';
import { FT, INSTR } from './data.js';
import { buildAssembly, person } from './assembly.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z), TAU=Math.PI*2;
export const ECRANS = {
  fisheye:{ nom:'Disque, un fisheye', court:'Toile horizontale. Un projecteur au centre, objectif fisheye vers le haut.' },
  ust:{ nom:'Disque, deux ultra-courts', court:'Toile horizontale. Deux projecteurs ultra-courte focale au centre, un par demi-cercle, raccord par fondu.' },
  cylindre:{ nom:'Cylindre 360°', court:'Toile tendue sur le tour. Projecteur au centre vers un miroir convexe.' }
};
export const LENS_H=.32, WALL=.05;

const FRAG=`
varying vec2 vUv; varying vec3 vP; uniform float uT,uCyl,uA,uGain; uniform vec3 uE;
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
  gl_FragColor=vec4(c*e*uGain,uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function screenMaterial(R,cyl){
  return new THREE.ShaderMaterial({ side:THREE.DoubleSide, transparent:true, uniforms:{uT:{value:0},uCyl:{value:cyl?1:0},uA:{value:R},uGain:{value:1},uAlpha:{value:1},uE:{value:new THREE.Vector3()}},
    vertexShader:'varying vec2 vUv;varying vec3 vP;void main(){vUv=uv;vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float uAlpha;\n'+FRAG });
}

// calculs d'optique pour l'affichage
export function optics(s){
  const R=s.diam*FT/2, H=s.ecranH/1000, d=H-LENS_H, th=Math.atan2(R,d);
  const o={ R,H,d,theta:th*180/Math.PI };
  o.bord=(th/Math.sin(th))*Math.pow(Math.cos(th),3);           // éclairement au bord / au centre, fisheye équidistant
  o.tr=d/(2*R*16/10);                                          // rapport de projection équivalent (objectif droit)
  o.pxC=d/(600/th)*1000; o.pxB=o.pxC/Math.pow(Math.cos(th),2); // 1200 px de haut, cercle plein cadre
  const w=2*R*1.04; o.ustW=w; o.ustD=w*.24; o.ustPx=w/1920*1000;  // UST 1920 x 1200, rapport 0,24
  o.surface=Math.PI*R*R;
  return o;
}

export function buildSpace(s,lists){
  const g=new THREE.Group(), R=s.diam*FT/2, H=s.ecranH/1000, RW=s.salle, RH=4.2, out={ g, inst:[], lights:[] };
  // --- sol et murs
  const floor=mesh(new THREE.PlaneGeometry(RW,RW),new THREE.MeshStandardMaterial({color:'#2c2e36',roughness:.6,metalness:.05}),false); floor.rotation.x=-Math.PI/2; g.add(floor);
  const wm=new THREE.MeshStandardMaterial({color:'#2b2e39',roughness:1,side:THREE.FrontSide});
  const walls=new THREE.Group(); g.add(walls); out.walls=walls;
  [[0,-1,0],[0,1,Math.PI],[-1,0,Math.PI/2],[1,0,-Math.PI/2]].forEach(([x,z,r])=>{ const w=mesh(new THREE.PlaneGeometry(RW,RH),wm,false); w.position.set(x*RW/2,RH/2,z*RW/2); w.rotation.y=r; walls.add(w);
    // plis du rideau
    for(let i=0;i<Math.round(RW*2.4);i++){ const f=mesh(new THREE.CylinderGeometry(.07,.07,RH,8,1,true,0,Math.PI),wm,false); f.scale.z=.35; f.rotation.y=-Math.PI/2; const h=new THREE.Group(); h.add(f); h.position.set(-RW/2+.2+i/2.4,0,0); w.add(h); f.rotation.set(0,-Math.PI/2,0); }
  });
  // --- écran
  const scr=new THREE.Group(); g.add(scr);
  const cyl=s.ecran==='cylindre', ch=cyl?Math.max(H,1.2):0;
  const mat=screenMaterial(R,cyl); out.screenMat=mat;
  const halfSkirt=[];
  if(!cyl){
    const disc=new THREE.Mesh(new THREE.CircleGeometry(R-.012,128).rotateX(-Math.PI/2),mat); disc.position.y=H+.002; scr.add(disc); out.disc=disc;
    // jante et pied en tôle blanche
    const rim=[[R-.03,H-.05],[R,H-.05],[R,H+.004],[R-.012,H+.004]].map(p=>new THREE.Vector2(...p)); scr.add(mesh(new THREE.LatheGeometry(rim,160),M.white));
    const foot=[[R-.05,0],[R,0],[R,.045],[R-.05,.045],[R-.05,0]].map(p=>new THREE.Vector2(...p)); scr.add(mesh(new THREE.LatheGeometry(foot,160),M.white));
    // jupe noire en deux moitiés (la moitié avant s'ouvre en vue de coupe)
    [0,1].forEach(k=>{ const sk=mesh(new THREE.CylinderGeometry(R-.02,R-.02,H-.095,96,1,true,k?Math.PI/2:-Math.PI/2,Math.PI),M.skirt,false); sk.position.y=(H-.005)/2; scr.add(sk); halfSkirt.push(sk); });
    for(let i=0;i<12;i++){ const a=i/12*TAU+TAU/24; rod(scr,[Math.sin(a)*(R-.035),.04,Math.cos(a)*(R-.035)],[Math.sin(a)*(R-.035),H-.04,Math.cos(a)*(R-.035)],.0125,M.white); }
    // prises d'air : même trame que le case
    const L=[]; for(let j=0;j<6;j++) for(let i=0;i<360;i++){ const a=i/360*TAU, w=.5+.5*Math.cos(a*6+j*.5), r=.0016+.0042*w*(1-j/7); L.push([V(Math.sin(a)*(R+.0006-.02),.075+j*.018,Math.cos(a)*(R+.0006-.02)),V(Math.sin(a),0,Math.cos(a)),r]); }
    const dm=new THREE.MeshBasicMaterial({color:'#3a4468'}); const air=dots(L,dm); scr.add(air); out.air=air;
  } else {
    const c=new THREE.Mesh(new THREE.CylinderGeometry(R,R,ch,160,1,true),mat); c.position.y=.18+ch/2; scr.add(c); out.disc=c;
    [.16,.18+ch].forEach((y,i)=>{ const p=[[R-.03,y-.02],[R+.004,y-.02],[R+.004,y+.02],[R-.03,y+.02],[R-.03,y-.02]].map(q=>new THREE.Vector2(...q)); scr.add(mesh(new THREE.LatheGeometry(p,160),M.white)); });
    const sk=mesh(new THREE.CylinderGeometry(R-.02,R-.02,.15,96,1,true),M.skirt,false); sk.position.y=.075; scr.add(sk);
    for(let i=0;i<8;i++){ const a=i/8*TAU+TAU/16; rod(scr,[Math.sin(a)*(R-.03),0,Math.cos(a)*(R-.03)],[Math.sin(a)*(R-.03),.18+ch,Math.cos(a)*(R-.03)],.011,M.white); }
  }
  // --- projecteur(s)
  const pj=new THREE.Group(); scr.add(pj); out.proj=pj;
  const beamMat=new THREE.MeshBasicMaterial({color:'#9fb8ff',transparent:true,opacity:.09,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const edge=new THREE.LineBasicMaterial({color:'#b9c9ff',transparent:true,opacity:.75});
  const beams=new THREE.Group(); scr.add(beams); out.beams=beams;
  const line=pts=>beams.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),edge));
  const floorBox=(x,z,w,d,h)=>cbox(pj,[x-w/2,.02,z-d/2],[x+w/2,h,z+d/2],M.white,.015);
  if(s.ecran==='ust'){
    const o=optics(s), yl=Math.max(H-o.ustD,.12);
    [1,-1].forEach(k=>{ const x=k*.24, zc=-k*.16; floorBox(x,zc,.42,.2,Math.max(yl-.02,.2)); cbox(pj,[x-.1,yl-.03,zc-.05],[x+.1,yl,zc+.05],M.pad,.004);
      const l=V(x,yl,zc), w=R-.02, q=[]; for(let n=0;n<=36;n++){ const a=-.04+(Math.PI+.08)*n/36; q.push(V(Math.cos(a)*w,H,k*Math.sin(a)*w)); }
      const tri=[]; q.forEach((p,n)=>tri.push(l,p,q[(n+1)%q.length])); beams.add(new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(tri),beamMat)); q.forEach((p,n)=>{ if(n%6===0) line([l,p]); }); line([...q,q[0]]); });
  } else {
    floorBox(0,0,.36,.36,.22); ccyl(pj,.075,.05,[0,.24,0],M.black,'y'); const dome=mesh(new THREE.SphereGeometry(.06,32,16,0,TAU,0,Math.PI/2),M.pad); dome.position.y=.262; pj.add(dome);
    const ly=LENS_H-.02;
    if(!cyl){ const co=new THREE.Mesh(new THREE.CylinderGeometry(R-.02,.04,H-ly,96,1,true),beamMat); co.position.y=(H+ly)/2; beams.add(co);
      for(let i=0;i<12;i++){ const a=i/12*TAU; line([V(0,ly,0),V(Math.sin(a)*(R-.02),H,Math.cos(a)*(R-.02))]); } }
    else { const my=Math.max(.18+ch+.1,1.35); const mir=mesh(new THREE.SphereGeometry(.2,48,24,0,TAU,Math.PI/2,Math.PI/2),M.magnet); mir.position.y=my; mir.scale.y=.8; pj.add(mir); ccyl(pj,.2,.02,[0,my+.01,0],M.white,'y');
      [0,1,2].forEach(i=>{ const a=i/3*TAU; rod(pj,[Math.sin(a)*.19,my,Math.cos(a)*.19],[Math.sin(a)*(R-.03),.18+ch,Math.cos(a)*(R-.03)],.006,M.white); });
      for(let i=0;i<12;i++){ const a=i/12*TAU,S=Math.sin(a),K=Math.cos(a); line([V(0,ly,0),V(S*.14,my-.12,K*.14),V(S*R,.2,K*R)]); line([V(0,ly,0),V(S*.06,my-.15,K*.06),V(S*R,.16+ch,K*R)]); } }
  }
  // moyeu : commutateur + alimentation
  if(!cyl||true){ const hx=R*.55, a=Math.PI/3; const hub=cbox(pj,[-.16,.02,-.1],[.16,.14,.1],M.dark,.006); hub.position.set(Math.sin(a+Math.PI)*hx,.08,Math.cos(a+Math.PI)*hx); hub.rotation.y=a; }
  out.setCut=v=>{ if(halfSkirt[1]) halfSkirt[1].visible=!v; mat.uniforms.uAlpha.value=v?.55:1; if(out.air) out.air.visible=!v; };
  out.setBeams=v=>{ beams.visible=v; };

  // --- instruments
  const Rr=R+s.ecart/1000+.16; out.Rr=Rr;
  const cables=new THREE.Group(); g.add(cables); out.cables=cables;
  const pub=new THREE.Group(), players=new THREE.Group(); g.add(pub,players); out.visitors=pub; out.players=players;
  Object.keys(INSTR).forEach((n,i)=>{
    const a=i*TAU/3, as=buildAssembly({stand:s.stand,mic:s.mic,open:s.open,xray:false,silicone:s.silicone,padH:s.padH,nom:n});
    as.g.position.set(Math.sin(a)*Rr,0,Math.cos(a)*Rr); as.g.rotation.y=a; g.add(as.g); as.angle=a; out.inst.push(as);
    const pl=person({h:[1.72,1.62,1.8][i],pose:'joue',handY:s.padH/1000,mat:M.fig}); const pr=Rr+.41; pl.position.set(Math.sin(a)*pr,0,Math.cos(a)*pr); pl.rotation.y=a; players.add(pl);
    // rayon : réseau + courant, de l'instrument au moyeu
    const tg=V(Math.cos(a),0,-Math.sin(a)), rd=V(Math.sin(a),0,Math.cos(a));
    [.02,-.02].forEach((o,k)=>tube(cables,[rd.clone().multiplyScalar(Rr-.14).addScaledVector(tg,o).setY(.22),rd.clone().multiplyScalar(Rr-.21).addScaledVector(tg,o).setY(.03),rd.clone().multiplyScalar((Rr+R)/2-.1).addScaledVector(tg,o*1.6).setY(.008),rd.clone().multiplyScalar(R-.1).addScaledVector(tg,o).setY(.008),rd.clone().multiplyScalar(R*.6).addScaledVector(tg,o).setY(.02)],k?.0045:.0035,k?M.cable:M.pcb,60));
    const ramp=mesh(new THREE.BoxGeometry(.16,.014,Math.max(Rr-R-.16,.05)),M.table); ramp.position.copy(rd.clone().multiplyScalar((Rr-.16+R)/2)).setY(.008); ramp.rotation.y=a; cables.add(ramp);
    // douche étroite sur l'instrument
    const sp=new THREE.SpotLight('#fff1de',20,0,.25,.85,2); sp.position.set(Math.sin(a)*(Rr-.5),RH-.15,Math.cos(a)*(Rr-.5)); sp.target.position.set(Math.sin(a)*(Rr+.02),1,Math.cos(a)*(Rr+.02)); sp.castShadow=true; sp.shadow.mapSize.set(1024,1024); sp.shadow.bias=-.0004; sp.shadow.normalBias=.01; sp.shadow.camera.near=.5; sp.shadow.camera.far=6; g.add(sp,sp.target); out.lights.push(sp);
    ccyl(g,.05,.16,[sp.position.x,RH-.1,sp.position.z],M.black,'y');
    // lueur de l'écran, teintée par l'instrument
    const gl=new THREE.PointLight([ '#5f8dff','#ff5a3c','#ffc47a' ][i],cyl?1.6:2.6,6,1.7); const gr=cyl?R+.25:R*.62; gl.position.set(Math.sin(a)*gr,cyl?.8:H+.22,Math.cos(a)*gr); g.add(gl); (out.glow??=[]).push(gl);
  });
  // --- public
  [[3.2,1.1,'debout',1.68],[2.75,2.75,'marche',1.6],[3.3,3.2,'debout',1.76],[2.9,5.25,'marche',1.7],[3.35,4.85,'debout',1.58]].forEach(([d,a,p,h],i)=>{
    const rr=Math.min(Math.max(R+d-1.05,R+.8),RW/2-.5), o=person({h,pose:p,mat:M.figDark}); o.position.set(Math.sin(a)*rr,0,Math.cos(a)*rr); o.rotation.y=p==='marche'?a+1.8:a; pub.add(o); });
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
  [-.03,0,.03].forEach((o,k)=>{ const n=V(dA.z,0,-dA.x).multiplyScalar(o); tube(cables,[dA.clone().multiplyScalar(R*.5).add(n).setY(.02),dA.clone().multiplyScalar(R-.06).add(n).setY(.01),dA.clone().multiplyScalar(R+.8).add(n).setY(.012),A.clone().add(n)],[.0035,.004,.005][k],[M.pcb,M.red,M.cable][k],40); });
  const tl=A.length()-R-.1, tr=mesh(new THREE.BoxGeometry(.24,.02,tl),M.table); tr.position.copy(dA.clone().multiplyScalar(R+.05+tl/2)).setY(.008); tr.rotation.y=Math.atan2(dA.x,dA.z); cables.add(tr);
  out.info={ R,H,Rr,RW,RH,dist:2*Rr*Math.sin(Math.PI/3) };
  return out;
}
