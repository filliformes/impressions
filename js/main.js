import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { initMaterials, M, mesh, disposeTree } from './util.js';
import { SILICONE, INSTR, FT, DRIVER } from './data.js';
import { STANDS } from './stands.js';
import { buildAssembly, person, PAD_OFF } from './assembly.js';
import { ECRANS, buildSpace, optics } from './space.js';
import { PROJ, DEFP, PLAFOND, hautOptics } from './proj.js';
import { drawPlan, drawElev, drawTable, drawSignal, drawChoix } from './fiche.js';

const $=(q,r=document)=>r.querySelector(q), V=(x,y,z)=>new THREE.Vector3(x,y,z);
const fr=(v,d=0)=>v.toLocaleString('fr-CA',{minimumFractionDigits:d,maximumFractionDigits:d});

export const S = {
  tab:'espace', stand:'A', mic:'bras', open:false, silicone:'bleu', padH:980, nom:'RES',
  mode:'un', eclate:0, xray:false, cotesI:false, figure:false,
  ecran:'fisheye', diam:7, ecranH:800, plateH:300, montage:'droit', proj:DEFP, ecart:500, salle:9, vue:'ensemble', public:true, cables:true, faisceau:false, coupe:false, cotesE:false, service:false
};
const DEF={...S};
const KEYS={tab:'t',stand:'s',mic:'m',open:'g',silicone:'c',padH:'p',nom:'n',mode:'d',ecran:'e',diam:'o',ecranH:'h',plateH:'b',montage:'k',proj:'j',ecart:'a',salle:'r',vue:'v',xray:'x'};
(function readHash(){ const q=new URLSearchParams(location.hash.slice(1)); for(const k in KEYS){ const v=q.get(KEYS[k]); if(v===null) continue; const t=typeof DEF[k]; S[k]=t==='number'?(v===''||isNaN(+v)?DEF[k]:+v):t==='boolean'?v==='1':v; }
  if(!STANDS[S.stand]) S.stand='A'; if(!ECRANS[S.ecran]) S.ecran='fisheye'; if(!PROJ[S.proj]) S.proj=DEFP; if(S.montage!=='miroir') S.montage='droit'; S.plateH=Math.min(Math.max(S.plateH,0),600); if(!SILICONE[S.silicone]) S.silicone='bleu'; if(!INSTR[S.nom]) S.nom='RES'; })();
function writeHash(){ const q=new URLSearchParams(); for(const k in KEYS) if(S[k]!==DEF[k]) q.set(KEYS[k],typeof S[k]==='boolean'?(S[k]?1:0):S[k]); const h=q.toString(); history.replaceState(null,'',h?'#'+h:location.pathname+location.search); }

// ---------------------------------------------------------------- rendu
const cv=$('#cv'), stage=$('#stage');
const R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
R.shadowMap.enabled=true; R.shadowMap.type=THREE.PCFSoftShadowMap; R.toneMapping=THREE.ACESFilmicToneMapping; R.toneMappingExposure=1;
const L2=new CSS2DRenderer(); $('#labels').appendChild(L2.domElement);
initMaterials();
const env=new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(),.04).texture;

// studio
const studio=new THREE.Scene(); studio.environment=env; studio.environmentIntensity=.36;
{ const c=document.createElement('canvas'); c.width=256; c.height=512; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,0,512); g.addColorStop(0,'#c2c3c2'); g.addColorStop(.36,'#e9e9e7'); g.addColorStop(.5,'#e4e4e2'); g.addColorStop(.62,'#cfcfcd'); g.addColorStop(1,'#a9aaa9'); x.fillStyle=g; x.fillRect(0,0,256,512); const id=x.getImageData(0,0,256,512); for(let i=0;i<id.data.length;i+=4){ const n=(Math.random()-.5)*3.2; for(let k=0;k<3;k++) id.data[i+k]+=n; } x.putImageData(id,0,0);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; const b=new THREE.Mesh(new THREE.SphereGeometry(24,48,48),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,toneMapped:false})); b.position.y=1; studio.add(b); }
const key=new THREE.DirectionalLight('#fffaf2',1.6); key.position.set(1.6,3.2,2.2); key.castShadow=true; key.shadow.mapSize.set(2048,2048); key.shadow.radius=7; key.shadow.blurSamples=16; key.shadow.bias=-.0003; key.shadow.normalBias=.004;
Object.assign(key.shadow.camera,{left:-2,right:2,top:2.1,bottom:-1.2,near:.5,far:8}); studio.add(key);
const fill=new THREE.DirectionalLight('#dfe6ff',.42); fill.position.set(-2.5,1.6,1.2); studio.add(fill);
const rimL=new THREE.DirectionalLight('#ffffff',.9); rimL.position.set(-1,2,-3); studio.add(rimL);
const ground=new THREE.Mesh(new THREE.CircleGeometry(9,64).rotateX(-Math.PI/2),new THREE.ShadowMaterial({opacity:.3})); ground.receiveShadow=true; studio.add(ground);
// salle
const room=new THREE.Scene(); room.environment=env; room.environmentIntensity=.05; room.background=new THREE.Color('#07080c');
const hemi=new THREE.HemisphereLight('#9fb0ff','#191820',.5); room.add(hemi);

const cam=new THREE.PerspectiveCamera(34,1,.03,60), ctl=new OrbitControls(cam,cv); ctl.enableDamping=true; ctl.dampingFactor=.08; ctl.maxPolarAngle=Math.PI*.515; ctl.minDistance=.25; ctl.maxDistance=16;
let comp=null,bloom=null,compS=null,ao=null;
function makeComposer(w,h,pr){ const rt=new THREE.WebGLRenderTarget(w*pr,h*pr,{type:THREE.HalfFloatType,samples:4}); comp=new EffectComposer(R,rt); comp.setPixelRatio(pr); comp.setSize(w,h); comp.addPass(new RenderPass(room,cam)); bloom=new UnrealBloomPass(new THREE.Vector2(w,h),.2,.6,.92); comp.addPass(bloom); comp.addPass(new OutputPass());
  const rt2=rt.clone(); compS=new EffectComposer(R,rt2); compS.setPixelRatio(pr); compS.setSize(w,h); compS.addPass(new RenderPass(studio,cam)); ao=new GTAOPass(studio,cam,w,h); ao.updateGtaoMaterial({radius:.09,distanceExponent:1.2,thickness:.6,scale:1.15,samples:16,screenSpaceRadius:false}); ao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:16}); compS.addPass(ao); compS.addPass(new OutputPass()); }

// ---------------------------------------------------------------- scènes
let asm=[], space=null, studioExtra=new THREE.Group(), roomExtra=new THREE.Group(); studio.add(studioExtra); room.add(roomExtra);
function clear(g){ [...g.children].forEach(c=>{ c.traverse(n=>{ if(n.isCSS2DObject) n.element.remove(); }); disposeTree(c); }); }
function label(txt,pos,cls,parent){ const e=document.createElement('div'); e.className='lb '+(cls||''); e.textContent=txt; const o=new CSS2DObject(e); o.position.copy(pos); parent.add(o); return o; }
function dim(g,a,b,txt,col='#c4232c',tick=V(.012,0,0)){
  const m=new THREE.LineBasicMaterial({color:col,depthTest:false,transparent:true}); const pts=[a,b,a.clone().add(tick),a.clone().sub(tick),b.clone().add(tick),b.clone().sub(tick)];
  const l=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),m); l.renderOrder=9; g.add(l); label(txt,a.clone().lerp(b,.5),'q',g);
}
function buildStudio(){
  asm.forEach(a=>disposeTree(a.g)); asm=[]; clear(studioExtra);
  const kinds=S.mode==='trois'?['A','B','C']:[S.stand], names=Object.keys(INSTR);
  kinds.forEach((k,i)=>{ const a=buildAssembly({...S,stand:k,nom:S.mode==='trois'?names[i]:S.nom}); a.g.position.x=(i-(kinds.length-1)/2)*1.02; studio.add(a.g); a.set.e=S.eclate; a.apply(); asm.push(a);
    if(S.mode==='trois') label(k+'  '+STANDS[k].nom,V(a.g.position.x,.06,.5),'n',studioExtra); });
  if(S.figure) kinds.forEach((k,i)=>{ const p=person({h:1.72,pose:'joue',handY:S.padH/1000,mat:M.fig}); p.position.set((i-(kinds.length-1)/2)*1.02,0,.5); studioExtra.add(p); });
  if(S.cotesI&&S.mode==='un'){
    const a=asm[0], Hs=a.Hs, g=studioExtra, w=a.info.encombrement[0]/2000, ph=S.padH/1000;
    dim(g,V(-.42,0,.1),V(-.42,ph,.1),fr(S.padH)+' pads XY'); dim(g,V(-.33,0,.1),V(-.33,Hs,.1),fr(Hs*1000)+' stand'); dim(g,V(-.33,Hs,.1),V(-.33,Hs+.08,.1),'80');
    dim(g,V(-w,.004,.3),V(w,.004,.3),fr(a.info.encombrement[0]),'#c4232c',V(0,0,.012)); dim(g,V(-.1332,ph+.13,-.09),V(.1332,ph+.13,-.09),'266','#c4232c',V(0,.012,0));
    dim(g,V(.36,0,0),V(.36,a.info.hp,0),fr(a.info.hp*1000)+' axe des HP'); dim(g,V(.25,a.info.hp-.1305,.16),V(.25,a.info.hp+.1305,.16),'Ø 261');
    dim(g,V(.2,Hs+.075,.0895),V(.2,Hs+.075,-.0895),'179','#c4232c',V(.012,0,0));
  }
}
function buildRoom(){
  if(space) disposeTree(space.g); clear(roomExtra);
  space=buildSpace(S); room.add(space.g); applyRoom();
}
function applyRoom(){
  clear(roomExtra); if(!space) return;
  space.visitors.visible=S.public&&S.vue!=='instrument'&&S.vue!=='coupe'; space.players.visible=S.public&&S.vue!=='instrument'; space.players.children[0].visible=S.vue!=='joueur'; space.op.visible=S.public&&S.vue!=='regie'; space.cables.visible=S.cables; space.setBeams(S.faisceau||S.coupe); space.setCut(S.coupe);
  hemi.intensity=S.service?2.2:.5; room.environmentIntensity=S.service?.35:.07; space.screenMat.uniforms.uGain.value=S.service?.85:1;
  const i=space.info, g=roomExtra;
  if(S.cotesE){
    const col='#ff8f7a', y=i.H+.02;
    dim(g,V(-i.R,y,0),V(i.R,y,0),`${fr(S.diam,1)} pi  (${fr(i.R*2,2)} m)`,col,V(0,0,.05));
    space.inst.forEach(a=>{ const s=Math.sin(a.angle),c=Math.cos(a.angle); dim(g,V(s*i.R,.03,c*i.R),V(s*(i.Rr-.16),.03,c*(i.Rr-.16)),fr(S.ecart),col,V(c*.04,0,-s*.04)); });
    const p=space.inst.map(a=>V(Math.sin(a.angle)*i.Rr,.03,Math.cos(a.angle)*i.Rr)); p.forEach((q,k)=>dim(g,q,p[(k+1)%3],fr(i.dist,2)+' m',col,V(0,.04,0)));
    if(S.ecran==='haut'){ const h=space.haut, x=-(h.Rp+.25);
      if(i.H>.02) dim(g,V(i.R+.12,0,0),V(i.R+.12,i.H,0),fr(S.plateH),col,V(.04,0,0));
      dim(g,V(x,0,0),V(x,PLAFOND,0),'plafond 10 pi (3,05 m)',col,V(.04,0,0));
      dim(g,V(.12,i.H+.01,-h.off),V(.12,h.mir?h.axisY:h.lensY,-h.off),fr(h.d,2)+' m de projection',col,V(.04,0,0));
    } else dim(g,V(i.R+.12,0,0),V(i.R+.12,i.H,0),fr(S.ecranH),col,V(.04,0,0));
  }
  space.inst.forEach(a=>label(a.nom,V(Math.sin(a.angle)*i.Rr,S.padH/1000+.16,Math.cos(a.angle)*i.Rr),'n',g));
  if(S.cables||S.coupe) label('Régie : Palinopsia',space.regie.position.clone().setY(1.42),'',g);
  if(S.ecran==='haut'){ const h=space.haut; if(S.coupe||S.faisceau) label(h.P.court+(h.mir?', couché, miroir à 45°':', pointé vers le bas'),V(0,h.capY-.12,-h.off),'',g); }
  else if(S.coupe||S.faisceau) label(S.ecran==='ust'?'2 projecteurs ultra-courts':S.ecran==='cylindre'?'Projecteur et miroir convexe':'Projecteur, objectif fisheye',V(0,.1,.2),'',g);
}

// ---------------------------------------------------------------- caméras
let fly=null;
function goto(p,t,fov=34,ms=1100){ const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches||fly==='now'; const a={p:cam.position.clone(),t:ctl.target.clone(),f:cam.fov};
  if(reduce||ms===0){ cam.position.copy(p); ctl.target.copy(t); cam.fov=fov; cam.updateProjectionMatrix(); ctl.update(); fly=null; return; }
  fly={a,p,t,fov,t0:performance.now(),ms}; }
function viewRoom(ms=1100){
  const i=space.info, k=portrait()?1.95:1, Rr=i.Rr, views={
    ensemble:[V(3.5*k,2.35*k+.2,4.35*k),V(0,.62,0),38], plan:[V(0,8.8*k,.01),V(0,0,0),38],
    joueur:[V(0,1.62,Rr+.52),V(0,.36,-.15),64], regie:[V(-i.RW/2+.72,1.72,-i.RW/2+.72),V(.6,.6,.6),50], coupe:[V(.25,.95,-Math.min(i.RW/2-.2,4.3*k)),V(0,.58,0),42], instrument:[V(Math.sin(2.0944)*(Rr+1.05)+.75,1.55,Math.cos(2.0944)*(Rr+1.05)+.8),V(Math.sin(2.0944)*Rr-.12,.74,Math.cos(2.0944)*Rr),40] };
  if(S.ecran==='haut'){ views.ensemble=[V(-3.9*k,2.45*k+.2,4.95*k),V(0,1.1,0),40]; views.coupe=[V(.9,1.45,-Math.min(i.RW/2-.2,4.6*k)),V(0,1.38,0),50]; }
  const v=views[S.vue]||views.ensemble; S.coupe=S.vue==='coupe'; applyRoom(); goto(...v,ms);
}
function viewStudio(ms=1100){ const k=portrait()?1.45:1; if(S.mode==='trois') goto(V(1.15*k*(portrait()?1.25:1),1.4,4.1*k*(portrait()?1.25:1)),V(0,.68,0),34,ms); else if(S.figure) goto(V(2.75*k,1.5,-.35),V(.02,.83,.22),34,ms); else goto(V(1.12*k,1.6,2.12*k),V(.03,.72,0),34,ms); }
const portrait=()=>stage.clientWidth<stage.clientHeight*1.05;

// ---------------------------------------------------------------- panneau
const P=$('#panelIn');
const el=(h)=>{ const t=document.createElement('template'); t.innerHTML=h.trim(); return t.content.firstChild; };
function seg(key,opts,cb){ const d=el('<div class="seg" role="group"></div>'); for(const [v,n] of Object.entries(opts)){ const b=el(`<button type="button" aria-pressed="${S[key]===v||S[key]===(v==='true')&&typeof S[key]==='boolean'}">${n}</button>`); b.onclick=()=>{ S[key]=typeof DEF[key]==='boolean'?v==='true':v; cb(); panel(); }; d.append(b);} return d; }
function rng(key,name,min,max,step,fmt,cb,live=true){ const d=el(`<label class="rng"><span>${name}</span><output>${fmt(S[key])}</output><input type="range" min="${min}" max="${max}" step="${step}" value="${S[key]}"></label>`); const i=$('input',d); i.oninput=()=>{ S[key]=+i.value; $('output',d).textContent=fmt(S[key]); if(live) debounce(cb); }; i.onchange=()=>{ if(!live) cb(); readout(); }; return d; }
function tog(list){ const d=el('<div class="tg"></div>'); list.forEach(([k,n,cb])=>{ const l=el(`<label><input type="checkbox" ${S[k]?'checked':''}>${n}</label>`); $('input',l).onchange=e=>{ S[k]=e.target.checked; cb(); }; d.append(l); }); return d; }
let dbt; function debounce(f){ clearTimeout(dbt); dbt=setTimeout(()=>{ f(); readout(); },60); }
function grp(t,...kids){ const d=el(`<div class="grp"><h3>${t}</h3></div>`); kids.forEach(k=>k&&d.append(typeof k==='string'?el(k):k)); P.append(d); return d; }
const mm=v=>fr(v)+' mm';
function reI(){ buildStudio(); if(space) dirtyRoom=true; readout(); writeHash(); }
function reE(){ buildRoom(); readout(); writeHash(); dirtyStudio=true; }
let dirtyRoom=true, dirtyStudio=true;
function panel(){
  const top=P.scrollTop; P.innerHTML='';
  const sil=el('<div class="sw"></div>'); for(const k in SILICONE){ const b=el(`<button type="button" aria-label="Silicone ${k}" title="${k}" aria-pressed="${S.silicone===k}" style="background:${SILICONE[k]}"></button>`); b.onclick=()=>{ S.silicone=k; S.tab==='espace'?reE():reI(); panel(); }; sil.append(b); }
  if(S.tab==='instrument'){
    grp('Affichage',seg('mode',{un:'Une proposition',trois:'Comparer les trois'},()=>{ reI(); viewStudio(); }));
    if(S.mode==='un') grp('Stand',seg('stand',Object.fromEntries(Object.entries(STANDS).map(([k,v])=>[k,v.nom])),reI),`<p class="desc">${STANDS[S.stand].court}</p>`);
    grp('Micro',seg('mic',{bras:'Bras articulé',pied:'Pied de micro'},reI));
    grp('Haut-parleurs',seg('open',{false:'Grilles perforées',true:'Membranes visibles'},reI));
    grp('Base molle',sil,'<p class="desc">Glisse sur l’instrument pour l’incliner. Il revient en place.</p>');
    grp('Réglages',rng('padH','Hauteur des pads XY',820,1120,5,mm,reI),rng('eclate','Vue éclatée',0,1,.01,v=>fr(v*100)+' %',()=>{ asm.forEach(a=>{a.set.e=S.eclate;a.apply();}); }));
    grp('Montrer',tog([['xray','L’intérieur du stand',reI],['cotesI','Les cotes',()=>{ if(S.cotesI&&S.mode==='trois') S.mode='un'; reI(); panel(); }],['figure','Une personne (1,72 m)',()=>{ reI(); viewStudio(); }]]));
    if(S.mode==='un') grp('Écran affiché',seg('nom',Object.fromEntries(Object.keys(INSTR).map(k=>[k,k])),reI));
    const d=grp(S.mode==='un'?'Chiffres':'Exporter','<dl class="kv" id="ro"></dl>'); const b=el('<button class="btn" type="button">Télécharger le modèle (GLB)</button>'); b.onclick=exportGLB; d.append(b);
  } else {
    grp('Vue',seg('vue',{ensemble:'Ensemble',joueur:'Joueur',instrument:'Instrument',coupe:'Coupe',plan:'Dessus',regie:'Régie'},()=>{ viewRoom(); writeHash(); }));
    const haut=S.ecran==='haut';
    grp('Écran',seg('ecran',Object.fromEntries(Object.entries(ECRANS).map(([k,v])=>[k,v.nom])),()=>{ reE(); viewRoom(); }),`<p class="desc">${ECRANS[S.ecran].court}</p>`,
      rng('diam','Diamètre',6,8,.5,v=>`${fr(v,1)} pi (${fr(v*FT,2)} m)`,reE),
      haut?rng('plateH','Hauteur de la plateforme',0,600,10,v=>v?mm(v):'Au sol',reE):rng('ecranH','Hauteur de la toile',S.ecran==='cylindre'?1200:500,S.ecran==='cylindre'?1800:1100,10,mm,reE),
      rng('ecart','Écart écran, instrument',250,1200,50,mm,reE),rng('salle','Côté de la salle',7,12,.5,v=>fr(v,1)+' m',reE));
    if(haut){ const P=PROJ[S.proj];
      grp('Projecteur',seg('proj',Object.fromEntries(Object.entries(PROJ).map(([k,v])=>[k,v.court])),reE),`<p class="desc"><strong>${P.nom}</strong>. ${P.desc}</p>`,
        Object.assign(seg('montage',{droit:'Pointé vers le bas',miroir:'Couché, miroir à 45°'},()=>{ reE(); }),{style:'margin-top:10px'}),
        `<p class="desc">${S.montage==='miroir'?'Le projecteur reste à plat : le caisson est plus bas et le trajet plus long, mais il faut un miroir à surface avant et l’image est inversée dans les réglages.':'La profondeur du projecteur se prend sur la hauteur : la lentille descend d’autant.'}</p>`); }
    grp('Instruments',seg('stand',Object.fromEntries(Object.entries(STANDS).map(([k,v])=>[k,v.nom])),reE),Object.assign(seg('mic',{bras:'Bras articulé',pied:'Pied de micro'},reE),{style:'margin-top:8px'}),Object.assign(seg('open',{false:'Grilles',true:'Membranes'},reE),{style:'margin-top:8px'}),'<div style="height:10px"></div>',sil);
    grp('Montrer',tog([['public','Le public',applyRoom],['cables','Les câbles',applyRoom],['faisceau','Le faisceau',applyRoom],['cotesE','Les cotes',applyRoom],['service','Lumière de service',applyRoom]]));
    grp('Optique',`<dl class="kv" id="ro"></dl>`);
  }
  readout(); P.scrollTop=top;
}
function readout(){
  const d=$('#ro'); if(!d) return; const row=(a,b,w)=>`<dt>${a}</dt><dd class="${w?'warn':''}">${b}</dd>`;
  if(S.tab==='instrument'){ if(S.mode!=='un'){ d.innerHTML=''; return; } const i=asm[0]?.info; if(!i) return;
    d.innerHTML=row('Hauteur du stand',mm(i.Hs*1000))+row('Emprise au sol',`${i.encombrement[0]} × ${i.encombrement[1]} mm`)+row('Corps, largeur × prof.',`${i.corps[0]} × ${i.corps[1]} mm`)+row('Volume par haut-parleur',`≈ ${fr(i.vol/2,0)} L`)+row('Masse totale',`≈ ${fr(i.kg)} kg`)+row('Force qui fait basculer',`≈ ${fr(i.bascule,-0)} N`,i.bascule<110);
  } else { const o=optics(S);
    if(S.ecran==='fisheye') d.innerHTML=row('Lentille, toile',`${fr(o.d*100)} cm`)+row('Angle de champ requis',`${fr(2*o.theta)}°`,o.theta>75)+row('Rapport équivalent',`${fr(o.tr,2)} : 1`)+row('Lumière au bord / au centre',`${fr(o.bord*100)} %`,o.bord<.2)+row('Pixel au centre / au bord',`${fr(o.pxC,1)} / ${fr(o.pxB,1)} mm`,o.pxB>5);
    else if(S.ecran==='ust') d.innerHTML=row('Image par projecteur',`${fr(o.ustW,2)} × ${fr(o.ustW*10/16,2)} m`)+row('Distance requise (0,24 : 1)',`${fr(o.ustD*100)} cm`)+row('Hauteur disponible',`${fr((o.H-.1)*100)} cm`,o.H-.1<o.ustD)+row('Pixel',`${fr(o.ustPx,1)} mm`);
    else if(S.ecran==='haut'){ const h=hautOptics(S), P=h.P;
      d.innerHTML=row('Plafond',`10 pi (${fr(PLAFOND,2)} m)`)+row(h.mir?'Axe du projecteur':'Lentille',`${fr(h.lensY,2)} m`)+row('Trajet optique',`${fr(h.d,2)} m`)
        +row('Rapport requis',`${fr(h.trReq,2)} : 1`)+row('Rapport du modèle',P.tr[0]===P.tr[1]?`${fr(P.tr[0],2)} : 1`:`${fr(P.tr[0],2)} à ${fr(P.tr[1],2)}`,!h.fit)
        +row('Cercle possible',h.fit?`jusqu’à ${fr(h.dMax,1)} pi`:`${fr(h.dMax,1)} pi au plus`,!h.fit)
        +row('Image la plus petite',`${fr(h.fw,2)} × ${fr(h.fh,2)} m`)+row('Pixel',`${fr(h.pitch,1)} mm`)+row('Pixels sur le cercle',`${fr(h.pxCirc)} / ${fr(P.res[1])}`)
        +row('Éclairement',`≈ ${fr(h.lux)} lux`)+(h.mir?row('Miroir',`≈ ${fr(h.mirW*100)} × ${fr(h.mirH*100)} cm`):'')+row('Projecteur',`${fr(P.kg,1)} kg, ${P.dB} dB`);
    }
    else d.innerHTML=row('Toile',`${fr(2*Math.PI*o.R,2)} × ${fr(Math.max(o.H,1.2),2)} m`)+row('Pixel sur le tour (1200 px)',`≈ ${fr(2*Math.PI*o.R/(Math.PI*800)*1000,1)} mm`)+row('Surface',`${fr(2*Math.PI*o.R*Math.max(o.H,1.2),1)} m²`);
    d.innerHTML+=row('Distance entre instruments',`${fr(space?.info.dist||0,2)} m`);
  }
}
async function exportGLB(){
  const { GLTFExporter }=await import('three/addons/exporters/GLTFExporter.js'); const { mergeGeometries }=await import('three/addons/utils/BufferGeometryUtils.js');
  const a=asm[0], g=a.g.clone(true); g.position.set(0,0,0); const rm=[];
  g.traverse(n=>{ if(n.isInstancedMesh){ const L=[],m=new THREE.Matrix4(); for(let i=0;i<n.count;i++){ n.getMatrixAt(i,m); L.push(n.geometry.clone().applyMatrix4(m)); } const q=new THREE.Mesh(mergeGeometries(L),n.material); rm.push([n,q]); } });
  rm.forEach(([n,q])=>{ n.parent.add(q); n.removeFromParent(); });
  new GLTFExporter().parse(g,b=>{ const u=URL.createObjectURL(new Blob([b],{type:'model/gltf-binary'})); const l=document.createElement('a'); l.href=u; l.download=`impressions-${STANDS[S.mode==='un'?S.stand:'A'].nom.toLowerCase()}.glb`; l.click(); setTimeout(()=>URL.revokeObjectURL(u),4000); },e=>console.error(e),{binary:true});
}

// ---------------------------------------------------------------- inclinaison (base molle)
const ray=new THREE.Raycaster(), ptr=new THREE.Vector2(); let drag=null;
function hit(e){ if(S.tab!=='instrument'||S.eclate>.05) return null; const b=cv.getBoundingClientRect(); ptr.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1); ray.setFromCamera(ptr,cam);
  for(const a of asm){ const h=ray.intersectObject(a.g,true).find(x=>x.object.visible&&!x.object.isLine); if(h){ let n=h.object; while(n){ if(n===a.tilt) return a; n=n.parent; } } } return null; }
cv.addEventListener('pointerdown',e=>{ const a=hit(e); if(a){ drag={a,x:e.clientX,y:e.clientY}; ctl.enabled=false; cv.setPointerCapture(e.pointerId); e.stopImmediatePropagation(); } },true);
cv.addEventListener('pointermove',e=>{ if(drag){ const dx=(e.clientX-drag.x)/260, dy=(e.clientY-drag.y)/260, f=V(0,0,-1).applyQuaternion(cam.quaternion).setY(0).normalize(), rt=V(-f.z,0,f.x); const wx=rt.x*dx-f.x*dy, wz=rt.z*dx-f.z*dy; drag.a.trg=[THREE.MathUtils.clamp(wz,-.15,.15),THREE.MathUtils.clamp(-wx,-.15,.15)]; } else if(e.buttons===0) stage.classList.toggle('tilt',!!hit(e)); });
addEventListener('pointerup',()=>{ if(drag){ drag.a.trg=null; drag=null; ctl.enabled=true; } });

// ---------------------------------------------------------------- boucle
let last=performance.now();
function size(){ const w=stage.clientWidth,h=stage.clientHeight; if(w<2||h<2) return; const pr=Math.min(devicePixelRatio,2); R.setPixelRatio(pr); R.setSize(w,h,false); L2.setSize(w,h); cam.aspect=w/h;
  // décale l'image pour laisser la place au panneau
  const pw=w>820?332:0; cam.setViewOffset(w+pw*.0001,h,pw/2,0,w,h); cam.updateProjectionMatrix(); if(!comp) makeComposer(w,h,pr); else { comp.setPixelRatio(pr); comp.setSize(w,h); compS.setPixelRatio(pr); compS.setSize(w,h); } }
new ResizeObserver(size).observe(stage);
let shadowTick=0;
function step(now){
  const dt=Math.min((now-last)/1000,.05), t=now/1000; last=now;
  if((S.tab!=='espace'&&S.tab!=='instrument')||!comp) return;
  if(fly&&fly.p){ let k=Math.min((now-fly.t0)/fly.ms,1); k=k*k*(3-2*k); cam.position.lerpVectors(fly.a.p,fly.p,k); ctl.target.lerpVectors(fly.a.t,fly.t,k); cam.fov=fly.a.f+(fly.fov-fly.a.f)*k; cam.updateProjectionMatrix(); if(k>=1) fly=null; }
  ctl.update();
  if(S.tab==='instrument'){
    asm.forEach(a=>{ const s=a.set, g=a.trg||[0,0]; a.vx=(a.vx||0)+((g[0]-s.rx)*(a.trg?220:150)-(a.vx||0)*(a.trg?24:7))*dt; a.vz=(a.vz||0)+((g[1]-s.rz)*(a.trg?220:150)-(a.vz||0)*(a.trg?24:7))*dt; s.rx+=a.vx*dt; s.rz+=a.vz*dt; a.apply(); a.oled.draw(a.nom,t,[-s.rz,s.rx]); });
    compS.render(dt); L2.render(studio,cam);
  } else if(space){
    const u=space.screenMat.uniforms; u.uT.value=t; const hw=space.info.RW/2-.05; space.walls.children.forEach((w,i)=>{ w.visible=[cam.position.z>-hw,cam.position.z<hw,cam.position.x>-hw,cam.position.x<hw][i]; });
    space.inst.forEach((a,i)=>{ // les joueurs bougent doucement leur instrument
      const q=S.public?1:0; a.set.rx=q*.035*Math.sin(t*(.7+i*.13)+i*2); a.set.rz=q*.045*Math.sin(t*(.5+i*.17)+i*4); a.apply(); a.oled.draw(a.nom,t,[-a.set.rz,a.set.rx]); u.uE.value.setComponent(i,.35+.4*Math.abs(Math.sin(t*(.5+i*.17)+i*4))); space.glow[i].intensity=(S.ecran==='cylindre'?1.5:2.3)*(.85+.25*Math.sin(t*(.6+i*.3)+i)); });
    if(S.service){ bloom.strength=.05; } else bloom.strength=.2;
    comp.render(dt); L2.render(room,cam);
  }
}
R.setAnimationLoop(step);

// ---------------------------------------------------------------- onglets
function tab(t,ms=0){
  S.tab=t; document.body.dataset.tab=t; document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t));
  ['cotes','signal','choix'].forEach(k=>$('#p-'+k).hidden=k!==t); const d3=t==='espace'||t==='instrument'; $('#panel').hidden=!d3;
  $('#labels').innerHTML=''; $('#labels').appendChild(L2.domElement); L2.domElement.innerHTML='';
  if(t==='espace'){ if(dirtyRoom||!space) buildRoom(); dirtyRoom=false; panel(); viewRoom(ms); $('#hint').textContent='Glisser pour tourner, molette pour s’approcher'; }
  if(t==='instrument'){ buildStudio(); dirtyStudio=false; panel(); viewStudio(ms); $('#hint').textContent='Glisser le fond pour tourner, glisser l’instrument pour l’incliner'; }
  if(t==='cotes'){ drawPlan($('#plan'),S); drawElev($('#elev'),S); drawTable($('#tbl'),S); } if(t==='signal') drawSignal($('#sig'),S); if(t==='choix') drawChoix($('#choix'),S);
  writeHash();
}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$('#fold').onclick=()=>{ const o=$('#panel').classList.toggle('off'); $('#fold').setAttribute('aria-expanded',!o); };
if(innerWidth<=820){ $('#panel').classList.add('off'); $('#fold').setAttribute('aria-expanded',false); }
size(); tab(S.tab); $('#load').classList.add('ok');
window.IMP={S,tab,panel,goto,cam,ctl,R,step,viewRoom,viewStudio,buildStudio,buildRoom,applyRoom,V,get asm(){return asm},get space(){return space}};
