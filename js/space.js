// L'espace : la galerie EISODE, l'écran choisi, trois instruments, régie, public.
import * as THREE from 'three';
import { M, mesh, cbox, tube } from './util.js';
import { INSTR } from './data.js';
import { buildAssembly, person } from './assembly.js';
import { buildScreen } from './screen.js';
import { buildEisode, EIS } from './eisode.js';
import { optics } from './optics.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z), TAU=Math.PI*2;
// centre du disque dans le plan d'EISODE. Accroché au rail 2, sa position suit le rail.
export function centre(s){ const cx=s.px/100; let cy=s.py/100; if(s.sys==='mat'&&s.accroche==='rail'){ const m=optics(s).m; cy=EIS.rails[1]+.0127-m.xm-.06; } return [cx,cy]; }

export function buildSpace(s){
  const g=new THREE.Group(), out={ g, inst:[], lights:[], glow:[] }, [cx,cy]=centre(s), ei=buildEisode(s,cx,cy), RH=s.plafond/1000; g.add(ei.g); out.ei=ei; out.cx=cx; out.cy=cy;
  const sc=buildScreen(s); g.add(sc.g); out.sc=sc; out.screenMat=sc.mat; const R=sc.R, Rb=sc.Rb, H=sc.H;
  out.setCut=v=>{ sc.setCut(v); out.inst.forEach((a,i)=>a.g.visible=!(v&&i===1)); out.players.children[1].visible=!v; };
  out.setBeams=sc.setBeams;
  // --- instruments
  const Rr=Rb+s.ecart/1000+.16; out.Rr=Rr;
  const cables=new THREE.Group(), pub=new THREE.Group(), players=new THREE.Group(); g.add(cables,pub,players); out.cables=cables; out.visitors=pub; out.players=players;
  const under=s.sys==='dessous'||H>.08;                      // les câbles passent sous la table ou sous la plateforme
  Object.keys(INSTR).forEach((n,i)=>{
    const a=i*TAU/3, S=Math.sin(a), C=Math.cos(a), as=buildAssembly({stand:s.stand,mic:s.mic,open:s.open,xray:false,silicone:s.silicone,padH:s.padH,nom:n});
    as.g.position.set(S*Rr,0,C*Rr); as.g.rotation.y=a; g.add(as.g); as.angle=a; out.inst.push(as);
    const pl=person({h:[1.72,1.62,1.8][i],pose:'joue',handY:s.padH/1000,mat:M.fig}), pr=Rr+.41; pl.position.set(S*pr,0,C*pr); pl.rotation.y=a; players.add(pl);
    const tg=V(C,0,-S), rd=V(S,0,C), p=(r,o,y)=>rd.clone().multiplyScalar(r).addScaledVector(tg,o).setY(y);
    [.02,-.02].forEach((o,k)=>tube(cables,[p(Rr-.14,o,.22),p(Rr-.21,o,.03),p((Rr+Rb)/2-.08,o*1.6,.008),p(Rb-.04,o,.008),under?p(Rb*.6,o,.012):p(Rb-.02,o,.008)],k?.0045:.0035,k?M.cable:M.pcb,60));
    const ramp=mesh(new THREE.BoxGeometry(.14,.012,Math.max(Rr-Rb-.18,.05)),M.ramp); ramp.position.copy(rd.clone().multiplyScalar((Rr-.18+Rb)/2)).setY(.007); ramp.rotation.y=a; cables.add(ramp);
    const sp=new THREE.SpotLight('#fff6ec',8,0,.3,.85,2); sp.position.set(S*(Rr-.45),RH-.04,C*(Rr-.45)); sp.target.position.set(S*(Rr+.02),1,C*(Rr+.02)); sp.castShadow=true; sp.shadow.mapSize.set(1024,1024); sp.shadow.bias=-.0004; sp.shadow.normalBias=.01; sp.shadow.camera.near=.3; sp.shadow.camera.far=5; g.add(sp,sp.target); out.lights.push(sp);
    const gl=new THREE.PointLight(['#5f8dff','#ff5a3c','#ffc47a'][i],2.4,6,1.7), gr=R*.62; gl.position.set(S*gr,H+.22,C*gr); g.add(gl); out.glow.push(gl);
  });
  // --- public, dans le repère du plan
  [[5.0,6.4,'debout',1.68,0],[.95,5.1,'marche',1.6,1.2],[2.5,.95,'debout',1.76,0],[7.4,.85,'debout',1.58,0]].forEach(([x,y,p,h,r])=>{ const X=x-cx, Z=y-cy, o=person({h,pose:p,mat:M.figDark}); o.position.set(X,0,Z); o.rotation.y=p==='marche'?r:Math.atan2(X,Z); pub.add(o); });
  // --- régie
  const rg=new THREE.Group(); g.add(rg); rg.position.set(EIS.regie[0]-cx,0,EIS.regie[1]-cy); rg.rotation.y=Math.atan2(-rg.position.x,-rg.position.z); out.regie=rg;
  cbox(rg,[-.6,.72,-.3],[.6,.745,.3],M.table,.004); [[-.55,-.25],[.55,-.25],[-.55,.25],[.55,.25]].forEach(p=>cbox(rg,[p[0]-.02,0,p[1]-.02],[p[0]+.02,.72,p[1]+.02],M.black));
  const ui=document.createElement('canvas'); ui.width=512; ui.height=320; const x=ui.getContext('2d'); x.fillStyle='#0e0f12'; x.fillRect(0,0,512,320);
  ['#1d2c66','#3a5bd0','#b8383a','#d8b56a'].forEach((c,i)=>{ x.fillStyle=c; x.fillRect(16+i*122,18,112,66); x.fillStyle='#2a2d35'; for(let k=0;k<6;k++) x.fillRect(16+i*122,96+k*14,112*(.4+((i*3+k*5)%6)/10),8); });
  const gr=x.createRadialGradient(370,245,5,370,245,62); gr.addColorStop(0,'#ffd9a0'); gr.addColorStop(.4,'#3d62d8'); gr.addColorStop(1,'#0a0d24'); x.fillStyle=gr; x.beginPath(); x.arc(370,245,60,0,TAU); x.fill(); x.fillStyle='#39d0d8'; for(let k=0;k<40;k++) x.fillRect(20+k*6,300-40*Math.abs(Math.sin(k*.5)*Math.cos(k*.13)),4,40*Math.abs(Math.sin(k*.5)*Math.cos(k*.13)));
  const ut=new THREE.CanvasTexture(ui); ut.colorSpace=THREE.SRGBColorSpace;
  cbox(rg,[-.3,.86,.04],[.3,1.22,.06],M.black,.006); const ms=new THREE.Mesh(new THREE.PlaneGeometry(.575,.335),new THREE.MeshBasicMaterial({map:ut})); ms.position.set(0,1.04,.038); ms.rotation.y=Math.PI; rg.add(ms);
  cbox(rg,[-.04,.745,.04],[.04,.87,.06],M.black); cbox(rg,[-.22,.745,-.24],[.22,.757,-.08],M.dark,.003); cbox(rg,[.34,.745,-.12],[.56,.8,.12],M.steel,.01);
  const op=person({h:1.72,pose:'regie',mat:M.figDark}); op.position.set(0,0,-.56); op.rotation.y=Math.PI; rg.add(op); out.op=op;
  // tronc : image, réseau et courant, de l'écran à la régie
  const A=rg.position.clone().setY(.01), dA=A.clone().setY(0).normalize(), end=A.length()-.35;
  [-.03,0,.03].forEach((o,k)=>{ const n=V(dA.z,0,-dA.x).multiplyScalar(o); tube(cables,[dA.clone().multiplyScalar(under?Rb*.5:Rb+.02).add(n).setY(.012),dA.clone().multiplyScalar(Rb+.06).add(n).setY(.01),dA.clone().multiplyScalar(end).add(n).setY(.01)],[.0035,.004,.005][k],[M.pcb,M.red,M.cable][k],40); });
  const tl=end-Rb-.1; if(tl>.1){ const tr=mesh(new THREE.BoxGeometry(.2,.016,tl),M.ramp); tr.position.copy(dA.clone().multiplyScalar(Rb+.08+tl/2)).setY(.007); tr.rotation.y=Math.atan2(dA.x,dA.z); cables.add(tr); }
  out.info={ R,Rb,H,Rr,RH,dist:2*Rr*Math.sin(Math.PI/3) };
  return out;
}
