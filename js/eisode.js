// Galerie EISODE (Artificiel), d'après le plan coté du 20 novembre 2025 et les photos. Mètres, origine au coin intérieur nord-ouest du plan,
// x vers la droite, y vers le bas du plan. Les cotes écrites priment sur le dessin, qui n'est pas partout à l'échelle.
import * as THREE from 'three';
import { M, mesh } from './util.js';

export const EIS = {
  W:8.06, D:9.27, H:2.57, rails:[.95,2.14,3.33,4.52,5.71], rx:[4.12,6.56], rs:.0254,
  murs:[[0,3.5,1.83,3.6],[1.73,3.6,1.83,4.33],[3.94,6.80,6.91,6.90],[6.81,6.9,6.91,7.44],[5,6.9,5.1,7.9],[5.1,7.44,8.06,7.54],[3.94,7.9,5,8],[3.94,8,4.04,9.27]],
  haut:[[1.11,1.87],[2.14,2.90],[5.29,6.83]], gauche:[[.59,2.49,1],[4.92,5.85,1],[6.54,7.26],[7.5,8.27]], bas:[[.92,2.45]],
  prises:[[.45,.12,'2'],[4.22,.12,'2'],[4.56,.12,'8'],[7.5,.12,'6'],[7.94,.84,'6'],[7.94,3.45,'6'],[7.94,6,'6'],[.12,3.27,'4'],[1.67,3.4,'4']],
  cat6:[[3.48,.12,'19'],[3.8,.12,'20'],[.12,2.82,'18'],[7.94,3.05,'21'],[1.93,3.75,'17']],
  lx:[[2.08,1.67],[6.09,1.67],[6.09,5.03]], regie:[1.0,2.72]
};
function boisTex(){
  const c=document.createElement('canvas'); c.width=1024; c.height=1024; const x=c.getContext('2d'); let s=11; const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  const n=24, w=1024/n; for(let i=0;i<n;i++){ let y=-rnd()*400; while(y<1024){ const l=260+rnd()*380, v=rnd(); x.fillStyle=`rgb(${128+v*26},${97+v*22},${70+v*18})`; x.fillRect(i*w,y,w,l); x.globalAlpha=.16; for(let k=0;k<9;k++){ x.fillStyle=rnd()>.5?'#4c3826':'#b59a7c'; x.fillRect(i*w+rnd()*w,y,1+rnd()*1.6,l); } x.globalAlpha=.5; x.fillStyle='#3c2c1e'; x.fillRect(i*w,y,w,1.6); x.fillRect(i*w,y,1.2,l); x.globalAlpha=1; y+=l; } }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
let BOIS=null;
// cx, cy : centre du disque dans le plan. Rend un groupe dont l'origine est le centre du disque.
export function buildEisode(s,cx,cy){
  const E=EIS, g=new THREE.Group(), o={ g }, H=s.plafond/1000, w=new THREE.Group(); w.position.set(-cx,0,-cy); g.add(w);
  BOIS??=boisTex();
  const wm=new THREE.MeshStandardMaterial({color:'#f5f4f1',roughness:.95}), fm=s.sol==='blanc'?new THREE.MeshStandardMaterial({color:'#dcdcda',roughness:.6}):new THREE.MeshStandardMaterial({map:BOIS,roughness:.42});
  if(fm.map) fm.map.repeat.set(E.W/2,E.D/2);
  const pl=(a,b,x,y,z,rx,ry,m)=>{ const p=mesh(new THREE.PlaneGeometry(a,b),m,false); p.position.set(x,y,z); p.rotation.set(rx,ry,0); w.add(p); return p; };
  pl(E.W,E.D,E.W/2,0,E.D/2,-Math.PI/2,0,fm); o.ceil=pl(E.W,E.D,E.W/2,H,E.D/2,Math.PI/2,0,wm);
  pl(E.W,H,E.W/2,H/2,0,0,0,wm); pl(E.D,H,0,H/2,E.D/2,0,Math.PI/2,wm); pl(7.5,H,E.W,H/2,3.75,0,-Math.PI/2,wm); pl(4.04,H,2.02,H/2,E.D,0,Math.PI,wm);
  const box=(x0,y0,z0,x1,y1,z1,m)=>{ const b=mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),m); b.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2); w.add(b); return b; };
  E.murs.forEach(m=>box(m[0],0,m[1],m[2],H,m[3],wm));
  // plinthes
  const pm=new THREE.MeshStandardMaterial({color:'#e9e8e4',roughness:.8}); box(0,0,0,E.W,.1,.012,pm); box(E.W-.012,0,0,E.W,.1,7.44,pm); box(0,0,0,.012,.1,.59,pm); box(0,0,2.49,.012,.1,4.92,pm);
  // fenêtres et portes : jour ou occultées
  o.pane=new THREE.MeshBasicMaterial({color:'#ffffff'}); const fr=new THREE.MeshStandardMaterial({color:'#f2f1ee',roughness:.6});
  const win=(a,b,z0,z1,side)=>{ const L=b-a, y=(z0+z1)/2, h=z1-z0, t=.03; if(side==='h'){ box(a-.04,z0-.04,0,b+.04,z1+.04,t,fr); pl(L,h,(a+b)/2,y,t+.004,0,0,o.pane); } else if(side==='g'){ box(0,z0-.04,a-.04,t,z1+.04,b+.04,fr); pl(L,h,t+.004,y,(a+b)/2,0,Math.PI/2,o.pane); } else { box(a-.04,z0-.04,E.D-t,b+.04,z1+.04,E.D,fr); pl(L,h,(a+b)/2,y,E.D-t-.004,0,Math.PI,o.pane); } };
  E.haut.forEach(([a,b])=>win(a,b,1.35,2.0,'h')); E.gauche.forEach(([a,b,p])=>win(a,b,p?.02:.95,2.08,'g')); E.bas.forEach(([a,b])=>win(a,b,.95,2.05,'b'));
  // rails 80/20, ampoules, climatiseur, prises
  o.plaf=new THREE.Group(); w.add(o.plaf); const al=new THREE.MeshStandardMaterial({color:'#c3c6ca',roughness:.35,metalness:.85});
  E.rails.forEach((y,i)=>{ const b=box(E.rx[0],H-E.rs,y,E.rx[1],H,y+E.rs,al); o.plaf.add(b); });
  E.lx.forEach(([x,y])=>{ const r=box(x-.06,H-.02,y-.06,x+.06,H,y+.06,wm); const a=mesh(new THREE.SphereGeometry(.03,16,12),o.bulb??=new THREE.MeshBasicMaterial({color:'#fff3dc'}),false); a.position.set(x,H-.09,y); w.add(a); o.plaf.add(r,a); });
  box(3.55,2.08,0,4.35,2.36,.22,new THREE.MeshStandardMaterial({color:'#f7f7f6',roughness:.5}));
  const pr=new THREE.MeshStandardMaterial({color:'#e2e1dd',roughness:.6}); [...E.prises,...E.cat6].forEach(([x,y])=>{ const v=x<.2?[0,.012,y-.035,y+.035]:x>E.W-.3?[E.W-.012,E.W,y-.035,y+.035]:y<.2?[x-.035,x+.035,0,.012]:null; if(v) box(v[0],.36,v[2],v[1],.48,v[3],pr); });
  o.w=w; return o;
}
