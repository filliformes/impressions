// Un lieu générique avec un gril au plafond : salle blanche de 10 × 10 m, tubes au pas de 1,5 m.
import * as THREE from 'three';
import { M, mesh, rod } from './util.js';

export const LIEU = { W:10, D:10, pas:1.5, regie:[1.7,1.9], prises:[[5,.12,'gril'],[.12,5,'mur'],[9.88,5,'mur']] };
export function buildLieu(s,cx,cy){
  const E=LIEU, g=new THREE.Group(), w=new THREE.Group(), G=s.gril/1000, H=G+.55, o={ g,w,pane:new THREE.MeshBasicMaterial({color:'#ffffff'}),bulb:new THREE.MeshBasicMaterial({color:'#fff3dc'}),plaf:new THREE.Group(),H };
  w.position.set(-cx,0,-cy); g.add(w); w.add(o.plaf);
  o.vue=()=>{};
  const wm=new THREE.MeshStandardMaterial({color:'#efeeea',roughness:.95}), fm=new THREE.MeshStandardMaterial({color:s.sol==='blanc'?'#dcdcda':'#8f8d89',roughness:.75});
  const pl=(a,b,x,y,z,rx,ry,m)=>{ const p=mesh(new THREE.PlaneGeometry(a,b),m,false); p.position.set(x,y,z); p.rotation.set(rx,ry,0); w.add(p); return p; };
  pl(E.W,E.D,E.W/2,0,E.D/2,-Math.PI/2,0,fm); o.ceil=pl(E.W,E.D,E.W/2,H,E.D/2,Math.PI/2,0,wm);
  pl(E.W,H,E.W/2,H/2,0,0,0,wm); pl(E.D,H,0,H/2,E.D/2,0,Math.PI/2,wm); pl(E.D,H,E.W,H/2,E.D/2,0,-Math.PI/2,wm); pl(E.W,H,E.W/2,H/2,E.D,0,Math.PI,wm);
  const n=3; for(let i=-n;i<=n;i++){ const q=cx+i*E.pas, r=cy+i*E.pas; rod(o.plaf,[q,G+.05,.15],[q,G+.05,E.D-.15],.024,M.grey); rod(o.plaf,[.15,G,r],[E.W-.15,G,r],.024,M.grey); }
  o.plaf.traverse(m=>{ m.castShadow=false; });
  return o;
}
