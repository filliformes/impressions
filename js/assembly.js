// Assemblage d'un instrument complet, personnages d'échelle.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, rod, tube } from './util.js';
import { CASE as C, PCB, BACK, BASE_H, SILICONE } from './data.js';
import { buildCase, buildSoft, oledCanvas } from './instrument.js';
import { buildStand, buildMic } from './stands.js';

export const PAD_OFF = (BASE_H - C.zBottom + C.zPad)/1000;      // dessus du stand -> dessus des pads XY
const V=(x,y,z)=>new THREE.Vector3(x,y,z);

export function buildAssembly(o){
  const Hs = o.padH/1000 - PAD_OFF, g = new THREE.Group();
  const oled = oledCanvas(); oled.draw(o.nom||'RES',0);
  const { group:stand, info } = buildStand(o.stand,Hs,{open:o.open,xray:o.xray,color:SILICONE[o.silicone]});
  g.add(stand);
  const y0 = Hs + (BASE_H-C.zBottom)/1000;
  const soft = buildSoft(SILICONE[o.silicone]); g.add(soft);
  const tilt = new THREE.Group(), cs = buildCase(oled); tilt.add(cs); g.add(tilt);
  const mic = buildMic(o.mic,Hs,o.stand); g.add(mic);
  const cables = new THREE.Group(); g.add(cables); buildCables(cables,Hs,y0,o.stand);
  const P = cs.userData.parts, pivot = 25/1000;
  const set = { e:0, rx:0, rz:0 };
  function apply(){
    const e=set.e;
    soft.position.y = y0 + e*.05;
    tilt.position.y = y0 - pivot + e*.16; cs.position.y = pivot;
    tilt.rotation.set(set.rx,0,set.rz,'XZY');
    soft.userData.uni.uTilt.value.set(-set.rz,-set.rx);
    P.bottom.position.z=0; P.pandore.position.z=e*55; P.body.position.z=e*120; P.flou.position.z=e*170; P.cover.position.z=e*215; P.controls.position.z=e*265;
    P.flou.visible=e>.02; cables.visible=e<.02; mic.visible=e<.12;
  }
  apply();
  // masse totale : stand + HP + ampli + instrument + base molle (+ bras)
  info.kg += 3.2 + 4.3 + (o.mic==='bras'?1.6:0);
  info.Hs=Hs; info.bascule = info.kg*9.81*info.appui/(o.padH/1000);
  return { g, info, oled, set, apply, tilt, soft, cs, mic, nom:o.nom||'RES', Hs, y0 };
}

function buildCables(g,Hs,y0,stand){
  const at=n=>{ const o=BACK.find(b=>b[0]===n); return { x:(PCB.x+o[1]-C.cx)/1000, y:y0+(PCB.zTop+o[5])/1000, z:-(C.y1+o[6]-C.cy)/1000 }; };
  const inY=Hs-.17, inZ=stand==='A'?-.15:-.145;
  const run=(p,len,rp,rc,mat,ix)=>{
    const b=mesh(new THREE.CylinderGeometry(rp,rp*.85,len,24).rotateX(-Math.PI/2),mat); b.position.set(p.x,p.y,p.z-len/2); g.add(b);
    const e=V(p.x,p.y,p.z-len);
    tube(g,[e.clone().add(V(0,0,.01)),e,e.clone().add(V(0,-.012,-.03)),V(p.x*.8+ix*.2,Hs+.03,p.z-len-.028),V(ix+.3*(p.x-ix),Hs-.06,inZ-.075),V(ix,inY,inZ-.03),V(ix,inY,inZ+.03)],rc,M.cable,90);
  };
  run(at('IN1'),.062,.0098,.0032,M.dark,.0);                         // XLR micro
  const out=at('OUT'); run({...out,y:out.y+.0084},.05,.0072,.003,M.dark,-.03); run({...out,y:out.y-.0084},.05,.0072,.003,M.dark,-.015); // TRS vers l'ampli
  run(at('ETH1'),.036,.0072,.003,M.pcb,.02);                         // réseau
  run(at('DC'),.03,.005,.0025,M.cable,.035);                         // alimentation
  { const c=mesh(new THREE.CylinderGeometry(.055,.055,.006,32).rotateX(Math.PI/2).scale(1.1,.36,1),M.black); c.position.set(0,inY,inZ); if(stand==='B') c.rotation.x=.35; g.add(c); }
}

// --- silhouettes d'échelle
function limb(g,a,b,r1,r2,m){ rod(g,a,b,r1,m,r2); [[a,r1],[b,r2]].forEach(([p,r])=>{ const s=mesh(new THREE.SphereGeometry(r,18,14),m); s.position.copy(p); g.add(s); }); }
export function person({h=1.7,pose='debout',mat=M.fig,handY=1.0,seed=0}={}){
  const g=new THREE.Group(), k=h/1.7, m=mat;
  const tor=mesh(new THREE.LatheGeometry([[0,.765],[.07,.77],[.125,.805],[.155,.87],[.157,.94],[.135,1.06],[.155,1.22],[.17,1.34],[.14,1.415],[.06,1.45],[.048,1.5],[0,1.51]].map(p=>new THREE.Vector2(...p)),32),m);
  tor.scale.set(1.12,1,.68); g.add(tor);
  const pel=mesh(new THREE.SphereGeometry(.15,28,20),m); pel.scale.set(1.14,.92,.78); pel.position.y=.86; g.add(pel);
  const head=mesh(new THREE.SphereGeometry(.098,28,22),m); head.scale.set(.88,1.18,1); head.position.set(0,1.6,-.012); g.add(head);
  const step = pose==='marche'?.17:.03;
  [1,-1].forEach(s=>{
    const hip=V(s*.08,.84,0), knee=V(s*.092,.47,-s*step*.6-.015), foot=V(s*.1,.07,s*-step+(pose==='marche'&&s<0?.06:.01));
    limb(g,hip,knee,.082,.058,m); limb(g,knee,foot,.058,.04,m);
    const f=mesh(new THREE.SphereGeometry(.05,18,12),m); f.scale.set(.85,.6,2); f.position.set(foot.x,.032,foot.z-.045); g.add(f);
    const sh=V(s*.185,1.375,0); let el,ha;
    if(pose==='joue'){ el=V(s*.235,1.1,-.07); ha=V(s*.085,handY+.03,-.36); }
    else if(pose==='marche'){ el=V(s*.225,1.1,s*.07); ha=V(s*.23,.86,s*.06-.1); }
    else if(pose==='regie'){ el=V(s*.22,1.12,-.05); ha=V(s*.16,1.0,-.28); }
    else { el=V(s*.225,1.1,.03); ha=V(s*.21,.84,-.03); }
    limb(g,sh,el,.05,.04,m); limb(g,el,ha,.038,.028,m);
    const hd=mesh(new THREE.SphereGeometry(.037,16,12),m); hd.scale.set(.8,.65,1.5); hd.position.copy(ha).add(V(0,0,-.03)); g.add(hd);
  });
  g.scale.setScalar(k); return g;
}
