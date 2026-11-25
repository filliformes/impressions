// Le case (Pandore + PCB FLOU) et la base molle, d'après les fichiers de François Auclair.
import * as THREE from 'three';
import { M, mesh, cbox, ccyl, extrudeX, polyShape, rrect, circ, silicone, siliconeClair, tube } from './util.js';
import { CASE as C, HOLES, PCB, BACK, RIGHT, BASE_H, LED } from './data.js';

const MM = .001;
// groupe en mm, z vers le haut, centré sur le case -> mètres, y vers le haut
export function cad(){
  const g = new THREE.Group(), inner = new THREE.Group();
  g.rotation.x = -Math.PI/2; g.scale.setScalar(MM);
  inner.position.set(-C.cx, -C.cy, 0); g.add(inner);
  return { g, in: inner };
}

function lettering(){
  const c=document.createElement('canvas'); c.width=1024; c.height=176; const x=c.getContext('2d');
  x.fillStyle='#c4232c'; x.font='bold 176px Arial, Helvetica, sans-serif'; x.textBaseline='alphabetic';
  x.textAlign='left'; const w=x.measureText('PANDORE').width; x.setTransform(1000/w,0,0,1,12,0); x.fillText('PANDORE',0,152);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; t.userData.keep=true; return t;
}
let LETTER=null;

export function oledCanvas(){
  const c=document.createElement('canvas'); c.width=256; c.height=128;
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
  return { c, t, draw(name,time,tilt=[0,0]){
    const x=c.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,256,128);
    x.fillStyle=x.strokeStyle='#cfe9ff'; x.font='600 25px Arial'; x.textBaseline='top'; x.fillText(name,8,8);
    x.lineWidth=2;
    if(name==='RES'){ for(let k=0;k<5;k++){ x.globalAlpha=1-k*.17; x.beginPath(); const r=12+k*8; x.arc(190,66,r,time*.8+k,time*.8+k+4.6-k*.5); x.stroke(); } }
    else if(name==='PHASMA'){ for(let k=0;k<8;k++){ const h=8+52*Math.pow(Math.abs(Math.sin(time*(1.1+k*.37)+k*1.7)),6); x.fillRect(116+k*16,118-h,10,h); } }
    else { for(let k=0;k<32;k++){ const a=k*2.4+time*(.2+.02*k), r=8+1.4*k; x.globalAlpha=.4+.6*((k*7%10)/10); x.fillRect(186+Math.cos(a)*r,66+Math.sin(a*1.1)*r,4,4); } }
    x.globalAlpha=1; x.font='15px Arial'; x.fillText('IMU',8,62);
    x.strokeRect(8,82,64,36); x.fillRect(38+THREE.MathUtils.clamp(tilt[0]*160,-27,27),98+THREE.MathUtils.clamp(tilt[1]*100,-13,13),5,5);
    t.needsUpdate=true;
  }};
}

export function buildCase(oled){
  const { g, in: r } = cad();
  const parts = { cover:new THREE.Group(), controls:new THREE.Group(), flou:new THREE.Group(), body:new THREE.Group(), pandore:new THREE.Group(), bottom:new THREE.Group(), led:new THREE.Group() };
  Object.values(parts).forEach(p=>r.add(p));
  const b=parts.body;
  // --- dessous + jupe
  const bt=parts.bottom;
  cbox(bt,[0,C.y0,C.zBottom],[C.w,C.y1,C.zPlate],M.white,.8);
  const [a0,a1,a2,a3]=C.skirtOuter,[i0,i1,i2,i3]=C.skirtInner;
  const sk=rrect(a0,a1,a2,a3,2); sk.holes.push(rrect(i0,i1,i2,i3,2,THREE.Path));
  bt.add(mesh(new THREE.ExtrudeGeometry(sk,{depth:C.zBottom,bevelEnabled:false}),M.white));
  const pk=ccyl(bt,C.puck.d/2,C.puck.z1-C.puck.z0,[C.puck.x,C.puck.y,(C.puck.z0+C.puck.z1)/2],M.dark);
  [[30,30.9],[236.4,30.9],[30,149.8],[236.4,149.8]].forEach(p=>ccyl(bt,7,4,[p[0],p[1],1.6],M.magnet));
  // --- bande LED collée sur la tranche de la jupe, fil vers J26
  const ld=parts.led, zl=LED.z, hl=LED.h/2, eb=1.2; [[a0-eb,a1-eb,a2+eb,a1],[a0-eb,a3,a2+eb,a3+eb],[a0-eb,a1,a0,a3],[a2,a1,a2+eb,a3]].forEach(([x0,y0,x1,y1])=>cbox(ld,[x0,y0,zl-hl],[x1,y1,zl+hl],M.btn));
  const bl=new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}), Lp=[], w=a2-a0, h=a3-a1, per=2*(w+h), nl=Math.floor(per/LED.pas); for(let i=0;i<nl;i++){ let t=(i+.5)*per/nl; if(t<w) Lp.push([a0+t,a1-eb-.8,0]); else if((t-=w)<h) Lp.push([a2+eb+.8,a1+t,1]); else if((t-=h)<w) Lp.push([a2-t,a3+eb+.8,0]); else Lp.push([a0-eb-.8,a3-(t-w),1]); }
  const li=new THREE.InstancedMesh(new THREE.BoxGeometry(5,5,1.6),bl,nl), lm=new THREE.Matrix4(); Lp.forEach(([x,y,r],i)=>{ lm.makeRotationFromEuler(r?new THREE.Euler(0,Math.PI/2,0):new THREE.Euler(Math.PI/2,0,0)); lm.setPosition(x,y,zl); li.setMatrixAt(i,lm); }); ld.add(li); parts.ledMat=bl; parts.ledN=nl;
  const jx=PCB.x+LED.j26[0], jy=PCB.y+LED.j26[1]; [['#c4232c',-1.6],['#2f8f4e',0],['#17181b',1.6]].forEach(([c,q])=>{ const t=tube(ld,[[jx+q,jy,PCB.zTop+4],[jx+q+1,jy-3,28],[a2+6+q,jy-6,21],[a2+5+q,jy-7,14],[a2+eb+.6,jy-8+q,zl]],.55,new THREE.MeshStandardMaterial({color:c,roughness:.6}),30); t.castShadow=false; });
  cbox(parts.pandore,[jx-4,jy-1.5,PCB.zTop],[jx+4,jy+1.5,PCB.zTop+7],M.black,.2);
  // --- parois : avant, arrière (tôle), gauche perforée, dessus du deck
  cbox(b,[0,C.y0,C.zPlate],[C.w,C.y0+6.4,C.zDeck-3.5],M.white,.8);
  const ws=polyShape([[C.y0,C.zPlate],[C.y1,C.zPlate],[C.y1,C.zDeck-3.5],[C.y0,C.zDeck-3.5]]);
  HOLES.forEach((row,j)=>row.forEach((d,i)=>ws.holes.push(circ(10.8+7*i,34.7+7*j,d/2))));
  b.add(mesh(extrudeX(ws,6.3,{curveSegments:7}),M.white));
  // côté droit plein et rigide, posé contre la tranche
  cbox(b,[C.w,C.y0,C.zBottom],[C.w+C.side,C.y1,C.zDeck],M.white,.8);
  // noir derrière les perforations
  cbox(b,[6.5,10,24],[7.2,176,70],M.black);
  const dk=polyShape([[0,C.y0],[C.w,C.y0],[C.w,C.y1],[0,C.y1]]);
  dk.holes.push(polyShape([[6.3,69.6],[6.3,171.7],[201.5,171.7],[201.5,69.6]],THREE.Path));
  const [o0,o1,o2,o3]=C.oled; dk.holes.push(polyShape([[o0,o1],[o0,o3],[o2,o3],[o2,o1]],THREE.Path));
  dk.holes.push(circ(C.enc[0],C.enc[1],4.6));
  const dm=mesh(new THREE.ExtrudeGeometry(dk,{depth:3.5,bevelEnabled:false}),M.white); dm.position.z=C.zDeck-3.5; b.add(dm);
  // panneau arrière percé
  const bp=polyShape([[0,C.zPlate],[C.w,C.zPlate],[C.w,C.zDeck-3.5],[0,C.zDeck-3.5]]);
  BACK.forEach(o=>{ const u=PCB.x+o[1], z=PCB.zTop+o[5]; bp.holes.push(o[2]==='c'?circ(u,z,o[3]/2+.5):polyShape([[u-o[3]/2-.5,z-o[4]/2-.5],[u-o[3]/2-.5,z+o[4]/2+.5],[u+o[3]/2+.5,z+o[4]/2+.5],[u+o[3]/2+.5,z-o[4]/2-.5]],THREE.Path)); });
  const bpg=new THREE.ExtrudeGeometry(bp,{depth:2,bevelEnabled:false,curveSegments:24}); bpg.rotateX(Math.PI/2);
  const bpm=mesh(bpg,M.grey); bpm.position.y=C.y1; b.add(bpm);
  // lettrage
  LETTER ??= lettering();
  const [t0,tz0,t1,tz1]=C.text;
  const lt=new THREE.Mesh(new THREE.PlaneGeometry(t1-t0,tz1-tz0+1.6),new THREE.MeshStandardMaterial({map:LETTER,transparent:true,roughness:.5,polygonOffset:true,polygonOffsetFactor:-2}));
  lt.rotation.x=Math.PI/2; lt.position.set((t0+t1)/2,C.y0-.15,(tz0+tz1)/2-.2); b.add(lt);

  // --- capot FLOU
  const cv=parts.cover, prof=polyShape(C.coverProfile);
  cv.add(mesh(extrudeX(prof,C.coverW,{bevelEnabled:true,bevelSize:.7,bevelOffset:-.7,bevelThickness:.7,bevelSegments:2,depth:C.coverW-1.4}).translate(.7,0,0),M.white));
  // --- contrôles
  const k=parts.controls;
  C.knobs.forEach(([x,y,z])=>{
    const pts=[[0,0],[7.6,0],[8,.6],[8,5.2],[7.4,6.1],[6.6,6.3],[0,6.3]].map(p=>new THREE.Vector2(...p));
    const m=mesh(new THREE.LatheGeometry(pts,48).rotateX(Math.PI/2),M.knob); m.position.set(x,y,z+.1); k.add(m);
    const ind=mesh(new THREE.BoxGeometry(.9,4.6,.25),M.btn,false); ind.position.set(x,y+4.4,z+6.45); k.add(ind);
  });
  C.leds.forEach(([x,y,z],i)=>{ const m=new THREE.Mesh(new THREE.CircleGeometry(1.05,16),M.led); m.position.set(x,y,z+.05); k.add(m); m.userData.led=i; });
  C.pads.forEach(([x,y])=>{ cbox(k,[x,y,88.6],[x+C.padSize,y+C.padSize,90.1],M.pad,.5); });
  C.buttons.forEach(([x,y])=>{ cbox(k,[x-5,y-5,87],[x+5,y+5,91.6],M.btn,1.2); cbox(k,[x-5.8,y-5.8,87],[x+5.8,y+5.8,88.95],M.grey,.4); });
  // écran
  cbox(k,[o0,o1,72.4],[o2,o3,75.1],M.pad,.4);
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(35.1,17.5),new THREE.MeshBasicMaterial({map:oled?oled.t:null,color:oled?0xffffff:0x05070a,toneMapped:false}));
  sc.position.set((o0+o2)/2,163.9,75.25); k.add(sc); sc.name='oled';
  // encodeur
  const ep=[[0,0],[5.1,0],[5.35,.5],[5.35,4],[4.8,4.8],[0,4.8]].map(p=>new THREE.Vector2(...p));
  const em=mesh(new THREE.LatheGeometry(ep,40).rotateX(Math.PI/2),M.btn); em.position.set(C.enc[0],C.enc[1],C.zDeck+.2); k.add(em);
  // slider
  const [s0,s1,s2,s3]=C.slider;
  const sl=rrect(s0,s1,s2,s3,1); sl.holes.push(polyShape([[238.7,s1+5],[238.7,s3-5],[242,s3-5],[242,s1+5]],THREE.Path));
  const sm=mesh(new THREE.ExtrudeGeometry(sl,{depth:.8,bevelEnabled:false}),M.black); sm.position.z=C.zDeck-.1; k.add(sm);
  cbox(k,[238.7,s1+5,C.zDeck-.2],[242,s3-5,C.zDeck+.15],M.btn);
  cbox(k,[239.2,73.3,C.zDeck],[241.6,79,83.4],M.dark,.6);
  [s1+2.4,s3-2.4].forEach(y=>ccyl(k,1.2,.5,[240.35,y,C.zDeck+.85],M.btn));

  // --- PCB FLOU (contour à confirmer : pas encore dessiné dans KiCad)
  const f=parts.flou;
  cbox(f,[8,10,79.2],[193,172,80.8],M.pcb2,.2);
  C.knobs.forEach(([x,y])=>cbox(f,[x-6,y-6,80.8],[x+6,y+6,85.4],M.grey,.4));
  C.buttons.forEach(([x,y])=>cbox(f,[x-5,y-5,80.8],[x+5,y+5,86],M.btn,.4));
  cbox(f,[96,108,80.8],[118,126,83.4],M.pcb,.3); cbox(f,[24,96,80.8],[46,108,82],M.gold,.2);
  [[60,100],[60,114],[130,104],[150,104],[150,118],[130,118]].forEach(p=>cbox(f,[p[0],p[1],80.8],[p[0]+12,p[1]+6,87],M.btn,.4));
  f.visible=false;
  // --- Pandore
  const p=parts.pandore, zt=PCB.zTop;
  cbox(p,[PCB.x,PCB.y,zt-PCB.t],[PCB.x+PCB.w,PCB.y+PCB.d,zt],M.pcb,.3);
  BACK.forEach(o=>{
    const u=PCB.x+o[1], z=zt+o[5], y1=PCB.y+PCB.d, mat=/ETH|USB|HDMI/.test(o[0])?M.steel:M.black;
    if(o[2]==='c'){ ccyl(p,o[3]/2,o[6]+12,[u,y1+o[6]-(o[6]+12)/2,z],mat,'y');
      if(/IN\d/.test(o[0])){ ccyl(p,9.6,.4,[u,y1+o[6]+.1,z],M.surround,'y'); [0,1,2].forEach(q=>ccyl(p,1.5,.6,[u+5*Math.cos(q*2.09+1.57),y1+o[6]+.3,z+5*Math.sin(q*2.09+1.57)],M.gold,'y')); ccyl(p,3.2,.7,[u,y1+o[6]+.3,z],M.hole,'y'); } }
    else { cbox(p,[u-o[3]/2,y1-16,z-o[4]/2],[u+o[3]/2,y1+o[6],z+o[4]/2],mat,.4);
      cbox(p,[u-o[3]*.36,y1+o[6]-.2,z-o[4]*.34],[u+o[3]*.36,y1+o[6]+.15,z+o[4]*.34],M.hole);
      if(o[0]==='OUT') [8.4,-8.4].forEach(dz=>ccyl(p,4.4,.6,[u,y1+o[6]+.2,z+dz],M.gold,'y')); }
  });
  RIGHT.forEach(o=>{ const y=PCB.y+o[1], z=zt+o[4]; cbox(p,[PCB.x+PCB.w-9,y-o[2]/2,z-o[3]/2],[PCB.x+PCB.w-.1,y+o[2]/2,z+o[3]/2],/GROVE/.test(o[0])?M.btn:M.black,.3); });
  cbox(p,[118.8,75.8,zt+1],[167.1,145,zt+9],M.pcb2,.3); cbox(p,[121,80,zt+9],[165,140,zt+20],M.grey,.6); ccyl(p,19,2.5,[143,110.6,zt+21],M.black);
  cbox(p,[20,90,zt],[70,130,zt+2],M.gold,.2); cbox(p,[185,90,zt],[215,110,zt+3],M.black,.3); cbox(p,[208,73,zt],[218,81,zt+15],M.btn,.4);
  const inside=mesh(new THREE.BoxGeometry(C.w-14,60,45),M.black,false); inside.position.set(C.cx-3,40,47); b.add(inside);
  g.userData.parts=parts;
  return g;
}

// base molle : même contour que le case, gorge de 20 mm pour la jupe, îlot central
export function buildSoft(color,clair=false){
  const { g, in: r } = cad(); g.name='soft';
  const mat=clair?siliconeClair():silicone(color), top=C.zBottom, bot=top-BASE_H, gap=1.6, gx=LED.jeu, zc=-1.5;
  const uni={ uTilt:{value:new THREE.Vector2()}, uLed:{value:0}, uCol:{value:new THREE.Color('#4f7dff')} }, k=C.skirtOuter, kx=(k[0]+k[2])/2, ky=(k[1]+k[3])/2, hx=(k[2]-k[0])/2, hy=(k[3]-k[1])/2, f=v=>v.toFixed(2);
  mat.onBeforeCompile=s=>{ Object.assign(s.uniforms,uni);
    // lueur : distance à la bande LED (un rectangle à la hauteur z de la bande), avec les points lumineux qui se fondent en s'éloignant
    s.fragmentShader='uniform float uLed; uniform vec3 uCol; varying vec3 vLp;\n'+s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      { vec2 q=abs(vLp.xy-vec2(${f(kx)},${f(ky)}))-vec2(${f(hx)},${f(hy)}); float sd=length(max(q,0.))+min(max(q.x,q.y),0.), dz=vLp.z-${f(LED.z)}, d=length(vec2(sd,dz));
        float a=q.x>q.y?vLp.y:vLp.x, pt=.5+.5*cos(a*${f(Math.PI*2/LED.pas)}); float g=1.3*exp(-d*.055)+.5*exp(-d*.016)+.5*pt*exp(-d*.1);
        totalEmissiveRadiance+=uCol*g*uLed*${clair?'.75':'1.'}; ${clair?'diffuseColor.rgb=mix(diffuseColor.rgb,uCol,clamp(g*uLed*.75,0.,.88)); diffuseColor.a=clamp(diffuseColor.a+.38*g*uLed,0.,.95);':''} }`);
    s.vertexShader='uniform vec2 uTilt; varying vec3 vLp;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vLp=position;
      { float h=clamp((position.z-(${bot.toFixed(1)}))/${BASE_H.toFixed(1)},0.,1.); h=h*h*(3.-2.*h);
        vec2 q=position.xy-vec2(${C.cx.toFixed(1)},${C.cy.toFixed(1)});
        transformed.z += h*(-q.x*uTilt.x - q.y*uTilt.y)*.92; transformed.x += h*uTilt.x*${(BASE_H*.45).toFixed(1)}; transformed.y += h*uTilt.y*${(BASE_H*.45).toFixed(1)}; }`); };
  const out=()=>rrect(0,C.y0,C.w,C.y1,5);
  const [a0,a1,a2,a3]=C.skirtOuter,[i0,i1,i2,i3]=C.skirtInner;
  const lo=mesh(new THREE.ExtrudeGeometry(out(),{depth:zc-bot-1.2,steps:14,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.2,bevelOffset:-1.2,bevelSegments:2,curveSegments:10}),mat); lo.position.z=bot+1.2;
  lo.geometry.translate(0,0,bot+1.2); lo.position.z=0; r.add(lo);
  const ring=out(); ring.holes.push(rrect(a0-gx,a1-gx,a2+gx,a3+gx,3,THREE.Path));
  const rg=new THREE.ExtrudeGeometry(ring,{depth:top-zc-1.2,steps:4,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.2,bevelOffset:-1.2,bevelSegments:2,curveSegments:10}); rg.translate(0,0,zc); r.add(mesh(rg,mat));
  const isl=rrect(i0+gap,i1+gap,i2-gap,i3-gap,3); isl.holes.push(circ(C.puck.x,C.puck.y,C.puck.d/2+2));
  const ig=new THREE.ExtrudeGeometry(isl,{depth:top-zc-1.4,steps:4,bevelEnabled:true,bevelThickness:1,bevelSize:1,bevelOffset:-1,bevelSegments:2,curveSegments:16}); ig.translate(0,0,zc); r.add(mesh(ig,mat));
  const mg=new THREE.Group(); r.add(mg);
  [[30,30.9],[236.4,30.9],[30,149.8],[236.4,149.8]].forEach(p=>ccyl(mg,7,4,[p[0],p[1],zc+1.4],M.magnet));
  if(clair) g.traverse(n=>{ if(n.material===mat){ n.castShadow=false; n.renderOrder=2; } });
  g.userData.uni=uni; return g;
}
