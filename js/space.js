// L'espace : la galerie EISODE, l'écran choisi, trois instruments, régie, public.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, rod, tube } from './util.js';
import { INSTR } from './data.js';
import { buildAssembly, person } from './assembly.js';
import { buildScreen } from './screen.js';
import { buildEisode, EIS } from './eisode.js';
import { buildLieu, LIEU } from './lieu.js';
import { optics } from './optics.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z), TAU=Math.PI*2;
// centre du disque dans le plan du lieu. Accroché au rail 2, sa position suit le rail.
export function centre(s){ if(s.sys==='sol') return [LIEU.W/2,LIEU.D/2]; let cx=s.px/100, cy=s.py/100; if(s.sys==='mat'&&s.accroche==='rail'){ const m=optics(s).m; cx=Math.min(Math.max(cx,EIS.rx[0]+.3),EIS.rx[1]-.3); cy=EIS.rails[1]+.0127-m.xm-.06; } return [cx,cy]; }
export const lieuOf=s=>s.sys==='sol'?LIEU:EIS;
// prise de courant la plus proche, à l'écart des joueur·euse·s
export function priseOf(s){ const [cx,cy]=centre(s); let best=null; for(const [x,y,n] of lieuOf(s).prises){ const X=x-cx, Z=y-cy, a=Math.atan2(X,Z), d=Math.hypot(X,Z), da=Math.min(...[0,1,2].map(k=>Math.abs(Math.atan2(Math.sin(a-k*TAU/3),Math.cos(a-k*TAU/3))))); if(da>.3&&(!best||d<best.d)) best={ x:X,z:Z,d,n }; } return best; }
// plus petite distance entre le dos d'un·e joueur·euse et un mur (m) ; négative si elle est dedans
export function degagement(s){ const [cx,cy]=centre(s), E=lieuOf(s), r=optics(s).Rb+s.ecart/1000+.16+.6; let m=9; for(let k=0;k<3;k++){ const a=k*TAU/3, x=cx+Math.sin(a)*r, y=cy+Math.cos(a)*r; m=Math.min(m,x,y,E.W-x,E.D-y); (E.murs||[]).forEach(q=>{ const dx=Math.max(q[0]-x,0,x-q[2]), dy=Math.max(q[1]-y,0,y-q[3]); m=Math.min(m,Math.hypot(dx,dy)||-.01); }); if(E.murs&&x>1.83&&y>6.9) m=Math.min(m,-.01); } return m; }
// enceintes sur pied, entre les instruments
export function satPos(s,Rr){ const [cx,cy]=centre(s), E=lieuOf(s); return [0,1,2].map(k=>{ const a=TAU/6+k*TAU/3, r=Rr+.55, c=(v,m)=>Math.min(Math.max(v,.35),m-.35); return [c(cx+Math.sin(a)*r,E.W)-cx,c(cy+Math.cos(a)*r,E.D)-cy]; }); }

export function buildSpace(s){
  const g=new THREE.Group(), out={ g, inst:[], lights:[], glow:[] }, [cx,cy]=centre(s), gril=s.sys==='sol', ei=gril?buildLieu(s,cx,cy):buildEisode(s,cx,cy), RH=gril?ei.H:s.plafond/1000, E=lieuOf(s); g.add(ei.g); out.ei=ei; out.cx=cx; out.cy=cy;
  const sc=buildScreen(s); g.add(sc.g); out.sc=sc; if(sc.gril) sc.gril.visible=false; out.screenMat=sc.mat; const R=sc.R, Rb=sc.Rb, H=sc.H;
  out.setCut=v=>{ sc.setCut(v); out.inst.forEach((a,i)=>a.g.visible=!(v&&i===1)); out.players.children[1].visible=!v; out.cabI.forEach((c,i)=>c.visible=!(v&&i===1)); out.sats.forEach(q=>q.visible=!v||q.position.x<.2); };
  out.setBeams=sc.setBeams;
  // --- instruments
  const Rr=Rb+s.ecart/1000+.16; out.Rr=Rr;
  const cables=new THREE.Group(), pub=new THREE.Group(), players=new THREE.Group(); g.add(cables,pub,players); out.cables=cables; out.cabI=[]; out.sats=[]; out.visitors=pub; out.players=players;
  const under=H>.05;                                         // les câbles passent sous le dessus
  Object.keys(INSTR).forEach((n,i)=>{
    const a=i*TAU/3, S=Math.sin(a), C=Math.cos(a), as=buildAssembly({stand:s.stand,mic:s.mic,open:s.open,xray:false,silicone:s.silicone,led:s.led,padH:s.padH,nom:n,hp:s.hp});
    as.g.position.set(S*Rr,0,C*Rr); as.g.rotation.y=a; g.add(as.g); as.angle=a; out.inst.push(as);
    const pl=person({h:[1.72,1.62,1.8][i],pose:'joue',handY:s.padH/1000,mat:M.fig}), pr=Rr+.41; pl.position.set(S*pr,0,C*pr); pl.rotation.y=a; players.add(pl);
    const tg=V(C,0,-S), rd=V(S,0,C), p=(r,o,y)=>rd.clone().multiplyScalar(r).addScaledVector(tg,o).setY(y), cb=new THREE.Group(); cables.add(cb); out.cabI.push(cb);
    [.02,-.02].forEach((o,k)=>tube(cb,[p(Rr-.14,o,.22),p(Rr-.21,o,.03),p((Rr+Rb)/2-.08,o*1.6,.008),p(Rb-.04,o,.008),under?p(Rb*.6,o,.012):p(Rb-.02,o,.008)],k?.0045:.0035,k?M.cable:M.pcb,60));
    const ramp=mesh(new THREE.BoxGeometry(.14,.012,Math.max(Rr-Rb-.18,.05)),M.ramp); ramp.position.copy(rd.clone().multiplyScalar((Rr-.18+Rb)/2)).setY(.007); ramp.rotation.y=a; cb.add(ramp);
    const sp=new THREE.SpotLight('#fff6ec',8,0,.3,.85,2); const ly=gril?Math.min(s.gril/1000,4.2):RH-.04; sp.userData.k=(ly/2.53)**2; sp.position.set(S*(Rr-.45),ly,C*(Rr-.45)); sp.target.position.set(S*(Rr+.02),1,C*(Rr+.02)); sp.castShadow=true; sp.shadow.mapSize.set(1024,1024); sp.shadow.bias=-.0004; sp.shadow.normalBias=.01; sp.shadow.camera.near=.3; sp.shadow.camera.far=ly+1.2; g.add(sp,sp.target); out.lights.push(sp);
    const gl=new THREE.PointLight(['#5f8dff','#ff5a3c','#ffc47a'][i],2.4,6,1.7), gr=R*.62; gl.position.set(S*gr,H+.22,C*gr); g.add(gl); out.glow.push(gl);
  });
  // --- public, dans le repère du plan
  (gril?[[2.6,6.6,'debout',1.68,0],[1.2,4.2,'marche',1.6,1.2],[3.6,2.2,'debout',1.76,0],[7.7,3.3,'debout',1.58,0]]:[[5.0,6.4,'debout',1.68,0],[.95,5.1,'marche',1.6,1.2],[2.5,.95,'debout',1.76,0],[7.4,.85,'debout',1.58,0]]).forEach(([x,y,p,h,r])=>{ const X=x-cx, Z=y-cy, o=person({h,pose:p,mat:M.figDark}); o.position.set(X,0,Z); o.rotation.y=p==='marche'?r:Math.atan2(X,Z); pub.add(o); });
  // --- régie
  const rg=new THREE.Group(); g.add(rg); rg.position.set(E.regie[0]-cx,0,E.regie[1]-cy); rg.visible=!s.regieE; rg.rotation.y=Math.atan2(-rg.position.x,-rg.position.z); out.regie=rg;
  cbox(rg,[-.6,.72,-.3],[.6,.745,.3],M.table,.004); [[-.55,-.25],[.55,-.25],[-.55,.25],[.55,.25]].forEach(p=>cbox(rg,[p[0]-.02,0,p[1]-.02],[p[0]+.02,.72,p[1]+.02],M.black));
  const ui=document.createElement('canvas'); ui.width=512; ui.height=320; const x=ui.getContext('2d'); x.fillStyle='#0e0f12'; x.fillRect(0,0,512,320);
  ['#1d2c66','#3a5bd0','#b8383a','#d8b56a'].forEach((c,i)=>{ x.fillStyle=c; x.fillRect(16+i*122,18,112,66); x.fillStyle='#2a2d35'; for(let k=0;k<6;k++) x.fillRect(16+i*122,96+k*14,112*(.4+((i*3+k*5)%6)/10),8); });
  const gr=x.createRadialGradient(370,245,5,370,245,62); gr.addColorStop(0,'#ffd9a0'); gr.addColorStop(.4,'#3d62d8'); gr.addColorStop(1,'#0a0d24'); x.fillStyle=gr; x.beginPath(); x.arc(370,245,60,0,TAU); x.fill(); x.fillStyle='#39d0d8'; for(let k=0;k<40;k++) x.fillRect(20+k*6,300-40*Math.abs(Math.sin(k*.5)*Math.cos(k*.13)),4,40*Math.abs(Math.sin(k*.5)*Math.cos(k*.13)));
  const ut=new THREE.CanvasTexture(ui); ut.colorSpace=THREE.SRGBColorSpace;
  cbox(rg,[-.3,.86,.04],[.3,1.22,.06],M.black,.006); const ms=new THREE.Mesh(new THREE.PlaneGeometry(.575,.335),new THREE.MeshBasicMaterial({map:ut})); ms.position.set(0,1.04,.038); ms.rotation.y=Math.PI; rg.add(ms);
  cbox(rg,[-.04,.745,.04],[.04,.87,.06],M.black); cbox(rg,[-.22,.745,-.24],[.22,.757,-.08],M.dark,.003); cbox(rg,[.34,.745,-.12],[.56,.8,.12],M.steel,.01);
  const op=person({h:1.72,pose:'regie',mat:M.figDark}); op.position.set(0,0,-.56); op.rotation.y=Math.PI; rg.add(op); out.op=op;
  // tronc au sol : vers la régie (image, réseau, courant), ou vers une seule prise si la technique est dans l'écran
  const pz=s.regieE?priseOf(s):null, A=pz?V(pz.x,.01,pz.z):rg.position.clone().setY(.01), dA=A.clone().setY(0).normalize(), end=A.length()-(pz?.02:.35), L=pz?[[0,.005,M.cable]]:[[-.03,.0035,M.pcb],[0,.004,M.red],[.03,.005,M.cable]];
  L.forEach(([o,r,m])=>{ const n=V(dA.z,0,-dA.x).multiplyScalar(o); tube(cables,[dA.clone().multiplyScalar(under?Rb*.5:Rb+.02).add(n).setY(.012),dA.clone().multiplyScalar(Rb+.06).add(n).setY(.01),dA.clone().multiplyScalar(end).add(n).setY(.01)],r,m,40); });
  const tl=end-Rb-.1; if(tl>.1){ const tr=mesh(new THREE.BoxGeometry(pz?.1:.2,.016,tl),M.ramp); tr.position.copy(dA.clone().multiplyScalar(Rb+.08+tl/2)).setY(.007); tr.rotation.y=Math.atan2(dA.x,dA.z); cables.add(tr); }
  // enceintes sur pied
  if(s.sat) satPos(s,Rr).forEach(([x,z])=>{ const q=new THREE.Group(); q.position.set(x,0,z); q.rotation.y=Math.atan2(x,z); g.add(q); out.sats.push(q); sat(q); });
  out.info={ R,Rb,H,Rr,RH,dist:2*Rr*Math.sin(Math.PI/3) };
  return out;
}
// petite enceinte active sur trépied, tournée vers le centre (-z local)
export const SAT = { w:.19, h:.29, d:.18, axe:1.45, kg:5 };
function sat(g){
  const y0=SAT.axe-SAT.h/2, w=SAT.w/2, d=SAT.d/2; cbox(g,[-w,y0,-d],[w,y0+SAT.h,d],M.black,.018); ccyl(g,.064,.006,[0,y0+.105,-d-.001],M.surround,'z'); ccyl(g,.05,.008,[0,y0+.105,-d-.002],M.cone,'z'); ccyl(g,.03,.006,[0,y0+.225,-d-.001],M.dark,'z'); ccyl(g,.012,.008,[0,y0+.225,-d-.002],M.grey,'z');
  rod(g,[0,.32,0],[0,y0,0],.0125,M.dark); ccyl(g,.022,.09,[0,.42,0],M.black,'y'); for(let k=0;k<3;k++){ const a=k*TAU/3+Math.PI, S=Math.sin(a), C=Math.cos(a); rod(g,[0,.44,0],[S*.36,.012,C*.36],.009,M.dark); }
}
