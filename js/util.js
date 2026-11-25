import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function noiseTex(size, lo, hi, rep){
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'), im = x.createImageData(size,size);
  let s = 7; const rnd = () => (s = (s*16807)%2147483647)/2147483647;
  for(let i=0;i<size*size;i++){ const v = lo + (hi-lo)*rnd(); im.data.set([v,v,v,255], i*4); }
  x.putImageData(im,0,0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep,rep); t.anisotropy = 4;
  return t;
}
export const M = {};
export function initMaterials(){
  const std = o => new THREE.MeshStandardMaterial(o), phy = o => new THREE.MeshPhysicalMaterial(o);
  M.white  = phy({ color:'#dcdcd9', roughness:.52, metalness:0, clearcoat:.18, clearcoatRoughness:.55 });
  M.whiteIn= std({ color:'#d9d9d6', roughness:.7 });
  M.black  = std({ color:'#17181b', roughness:.55 });
  M.knob   = std({ color:'#1f2024', roughness:.42 });
  M.pad    = phy({ color:'#222327', roughness:.4, clearcoat:.35, clearcoatRoughness:.35 });
  M.red    = std({ color:'#c4232c', roughness:.5 });
  M.btn    = phy({ color:'#c3c5c8', roughness:.38, clearcoat:.3 });
  M.steel  = std({ color:'#9a9da2', roughness:.35, metalness:.9 });
  M.dark   = std({ color:'#34373d', roughness:.45, metalness:.7 });
  M.grey   = std({ color:'#8e9196', roughness:.5, metalness:.6 });
  M.pcb    = std({ color:'#12314a', roughness:.5 });
  M.pcb2   = std({ color:'#16181c', roughness:.5 });
  M.gold   = std({ color:'#c9a552', roughness:.35, metalness:.9 });
  M.cone   = std({ color:'#3c3f45', roughness:.9, side:THREE.DoubleSide });
  M.surround=std({ color:'#101113', roughness:.6 });
  M.cable  = std({ color:'#141518', roughness:.65 });
  M.hole   = new THREE.MeshBasicMaterial({ color:'#0c0d0f' });
  M.led    = new THREE.MeshBasicMaterial({ color:'#ff5a4a' });
  M.magnet = std({ color:'#d7d9dc', roughness:.22, metalness:1 });
  M.fig    = std({ color:'#8d8f97', roughness:.95 });
  M.figDark= std({ color:'#5a5c64', roughness:.95 });
  M.table  = std({ color:'#26272b', roughness:.8 });
  M.ply    = std({ color:'#cdb78f', roughness:.75 });
  M.ramp   = std({ color:'#4a4540', roughness:.9 });
  M.skirt  = std({ color:'#1b1d24', roughness:.95, side:THREE.DoubleSide });
  M.copper = std({ color:'#b5723c', roughness:.35, metalness:.85, side:THREE.DoubleSide });
  M.kapton = std({ color:'#a8742c', roughness:.5, side:THREE.DoubleSide });
  M.spider = std({ color:'#c9a545', roughness:.9, side:THREE.DoubleSide });
  M.plyG   = std({ color:'#cdb78f', roughness:.75, transparent:true, opacity:.28, depthWrite:false, side:THREE.DoubleSide });
  const t = noiseTex(128,120,136,18); M.white.bumpMap = t; M.white.bumpScale = .12;
  M.whiteD = M.white.clone(); M.whiteD.side = THREE.DoubleSide;
  const g = document.createElement('canvas'); g.width=g.height=64; const x=g.getContext('2d');
  x.fillStyle='#fff'; x.fillRect(0,0,64,64); x.fillStyle='#2a2a2a';
  for(let i=0;i<8;i++) for(let j=0;j<8;j++) x.fillRect(i*8+2,j*8+2,5,5);
  const gt=new THREE.CanvasTexture(g); gt.wrapS=gt.wrapT=THREE.RepeatWrapping; gt.repeat.set(9,6);
  M.grille = std({ color:'#c3c6ca', roughness:.35, metalness:.9, map:gt });
}
export function silicone(hex){
  return new THREE.MeshPhysicalMaterial({ color:hex, roughness:.66, sheen:.16, sheenRoughness:.5, sheenColor:new THREE.Color(hex).offsetHSL(0,0,.12), clearcoat:.06, clearcoatRoughness:.6 });
}
export function mesh(geo, mat, shadow=true){ const m = new THREE.Mesh(geo,mat); m.castShadow = shadow; m.receiveShadow = true; return m; }

// boîte entre deux coins (dans le repère courant)
export function cbox(g,a,b,mat,r=0){
  const s=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], lim=Math.min(...s)/2*.98;
  const geo = r>0 ? new RoundedBoxGeometry(s[0],s[1],s[2],3,Math.min(r,lim)) : new THREE.BoxGeometry(...s);
  const m = mesh(geo,mat); m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2); g.add(m); return m;
}
// cylindre centré le long de l'axe donné ; r2 = rayon au bout +
export function ccyl(g,r,h,pos,mat,axis='z',r2=null,seg=40){
  const geo = new THREE.CylinderGeometry(r2??r, r, h, seg);
  if(axis==='z') geo.rotateX(Math.PI/2); else if(axis==='x') geo.rotateZ(-Math.PI/2);
  const m = mesh(geo,mat); m.position.set(...pos); g.add(m); return m;
}
const X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
// extrusion d'un profil (y,z) le long de x
export function extrudeX(shape, depth, opt={}){
  const geo = new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:20,...opt});
  geo.applyMatrix4(new THREE.Matrix4().makeBasis(Y,Z,X)); return geo;
}
export function polyShape(pts,P=THREE.Shape){ const s=new P(); pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); s.closePath(); return s; }
export function rrect(x0,y0,x1,y1,r,P=THREE.Shape){
  const s=new P(); s.moveTo(x0+r,y0); s.lineTo(x1-r,y0); s.absarc(x1-r,y0+r,r,-Math.PI/2,0); s.lineTo(x1,y1-r); s.absarc(x1-r,y1-r,r,0,Math.PI/2);
  s.lineTo(x0+r,y1); s.absarc(x0+r,y1-r,r,Math.PI/2,Math.PI); s.lineTo(x0,y0+r); s.absarc(x0+r,y0+r,r,Math.PI,Math.PI*1.5); return s;
}
export function circ(x,y,r){ const p=new THREE.Path(); p.absarc(x,y,r,0,Math.PI*2,true); return p; }
// tube lissé entre points (mètres)
export function tube(g,pts,r,mat,seg=80,tension=.5){
  const c=new THREE.CatmullRomCurve3(pts.map(p=>p.isVector3?p:new THREE.Vector3(...p)),false,'catmullrom',tension);
  const m=mesh(new THREE.TubeGeometry(c,seg,r,10,false),mat); g.add(m); return m;
}
export function rod(g,a,b,r,mat,r2){
  a=a.isVector3?a:new THREE.Vector3(...a); b=b.isVector3?b:new THREE.Vector3(...b);
  const l=a.distanceTo(b), m=mesh(new THREE.CylinderGeometry(r2??r,r,l,20),mat);
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(Y,b.clone().sub(a).normalize()); g.add(m); return m;
}
// loft : sections {y,w,d,c} (rectangles à coins coupés), faces planes.
// hole : {band,r,y} perce les faces gauche et droite de la bande donnée. faces : ne garde que ces pans (0 droite, 2 avant, 4 gauche, 6 arrière, impairs : coins)
export function loft(secs,{hole=null,faces=null,capTop=!faces,capBottom=!faces}={}){
  const ring = s => { const a=s.w/2,b=s.d/2,c=s.c||.001,y=s.y;
    return [[a,y,-b+c],[a,y,b-c],[a-c,y,b],[-a+c,y,b],[-a,y,b-c],[-a,y,-b+c],[-a+c,y,-b],[a-c,y,-b]]; };
  const pos=[]; const tri=(p,q,r)=>pos.push(...p,...q,...r);
  const R=secs.map(ring);
  for(let k=0;k<secs.length-1;k++) for(let i=0;i<8;i++){
    if(faces&&!faces.includes(i)) continue;
    const j=(i+1)%8, a=R[k][i],b=R[k][j],c=R[k+1][j],d=R[k+1][i];
    if(hole && hole.band===k && (i===0||i===4)){
      const xs=a[0], s=polyShape([[a[2],a[1]],[b[2],b[1]],[c[2],c[1]],[d[2],d[1]]]);
      s.holes.push(circ(0,hole.y,hole.r));
      const g=new THREE.ShapeGeometry(s,48).toNonIndexed(), P=g.attributes.position;
      for(let t=0;t<P.count;t+=3){
        const v=[0,1,2].map(n=>[xs,P.getY(t+n),P.getX(t+n)]);
        const nx=(v[1][1]-v[0][1])*(v[2][2]-v[0][2])-(v[1][2]-v[0][2])*(v[2][1]-v[0][1]);
        if(Math.sign(nx)===Math.sign(xs)) tri(v[0],v[1],v[2]); else tri(v[0],v[2],v[1]);
      }
      continue;
    }
    // l'anneau tourne de -z vers +z sur +x : (a, d, c) pointe vers l'extérieur
    tri(a,c,b); tri(a,d,c);
  }
  const n=secs.length-1;
  if(capTop) for(let i=1;i<7;i++) tri(R[n][0],R[n][i+1],R[n][i]);
  if(capBottom) for(let i=1;i<7;i++) tri(R[0][0],R[0][i],R[0][i+1]);
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const uv=[]; for(let i=0;i<pos.length;i+=3) uv.push(pos[i]*2+pos[i+2]*2,pos[i+1]*2);
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.computeVertexNormals(); return g;
}
export function dots(list,mat){ // list : [position, normale, rayon]
  const im=new THREE.InstancedMesh(new THREE.CircleGeometry(1,14),mat,list.length), m=new THREE.Matrix4(), q=new THREE.Quaternion();
  list.forEach((d,i)=>{ q.setFromUnitVectors(Z,d[1]); m.compose(d[0],q,new THREE.Vector3(d[2],d[2],1)); im.setMatrixAt(i,m); });
  return im;
}
// silicone clair : translucide, éclairé de l'intérieur (la lueur est ajoutée dans buildSoft)
export function siliconeClair(){
  return new THREE.MeshPhysicalMaterial({ color:'#e9eef0', roughness:.38, transparent:true, opacity:.5, clearcoat:.35, clearcoatRoughness:.35, sheen:.3, sheenRoughness:.4, sheenColor:new THREE.Color('#ffffff'), depthWrite:false });
}
// libère géométries, textures propres, ombres et instances. Les matériaux sont laissés : leurs programmes resservent à la reconstruction.
export function disposeTree(o){ o.traverse(n=>{ n.geometry?.dispose(); if(n.isLight||n.isInstancedMesh) n.dispose?.(); for(const m of [n.material].flat()) if(m?.map&&!m.map.userData.keep&&!Object.values(M).includes(m)) m.map.dispose(); }); o.removeFromParent(); }
