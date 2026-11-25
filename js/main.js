import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { initMaterials, M, disposeTree } from './util.js';
import { SILICONE, INSTR, FT, HP, PELICAN } from './data.js';
import { STANDS } from './stands.js';
import { buildAssembly, person } from './assembly.js';
import { buildSpace, degagement } from './space.js';
import { buildScreen } from './screen.js';
import { SYS, PA, PB, PC, PS, VINYLE, optics, diamMax, diamMin, projOf } from './optics.js';
import { SOUTE, colOf, resume, buildTransport } from './transport.js';
import { drawFab, drawCoupe } from './fab.js';
import { drawPlan, drawElev, drawTable, drawSignal, drawChoix } from './fiche.js';

const $=(q,r=document)=>r.querySelector(q), V=(x,y,z)=>new THREE.Vector3(x,y,z);
const fr=(v,d=0)=>v.toLocaleString('fr-CA',{minimumFractionDigits:d,maximumFractionDigits:d});

export const S = {
  tab:'espace', stand:'A', hp:'hp10', mic:'bras', open:false, silicone:'bleu', padH:980, nom:'RES',
  mode:'un', eclate:0, xray:false, cotesI:false, figure:false,
  sys:'dessous', projA:'ls560', projB:'lk953', projC:'lk953', projS:'lieu', gril:5000, miroir:'papier', sub:false, regieE:false, sat:false, montage:'miroir', accroche:'rail', diam:5.5, ecranH:950, plateH:100, plafond:2570, px:495, py:340, sol:'bois', rideaux:true,
  ecart:450, lum:55, vue:'ensemble', public:true, cables:true, faisceau:false, coupe:false, cotesE:false, eclE:0, cotesS:false, figS:false, faiS:true, coupeS:false,
  tCase:'a1637', tN:2, tCol:'tole', tBase:'creuse', tProj:true, tMic:false, tCab:true, tSub:false, eclT:0
};
const DEF={...S}, TABS=['espace','instrument','ecran','fab','transport','cotes','signal','choix'], MODES=['un','trois','tailles'], VUES=['ensemble','coin','maquette','joueur','instrument','coupe','plan','regie'], T3=['espace','instrument','ecran','transport'];
const KEYS={tab:'t',stand:'s',mic:'m',open:'g',silicone:'c',padH:'p',nom:'n',mode:'d',sys:'e',projA:'ja',projB:'jb',projC:'jc',montage:'k',accroche:'q',diam:'o',ecranH:'h',plateH:'b',plafond:'f',px:'x',py:'y',sol:'w',rideaux:'u',ecart:'a',lum:'l',vue:'v',xray:'z',hp:'hp',projS:'js',gril:'gr',miroir:'mi',sub:'sb',regieE:'rg',sat:'st',tCase:'tc',tN:'tn',tCol:'tl',tBase:'tb',tProj:'tp',tMic:'tm',tSub:'ts',tCab:'tk'};
(function readHash(){ const q=new URLSearchParams(location.hash.slice(1)); for(const k in KEYS){ const v=q.get(KEYS[k]); if(v===null) continue; const t=typeof DEF[k]; S[k]=t==='number'?(v===''||isNaN(+v)?DEF[k]:+v):t==='boolean'?v==='1':v; }
  const ok=(L,k,d)=>{ if(!Object.hasOwn(L,S[k])) S[k]=d; }; ok(STANDS,'stand','A'); ok(SYS,'sys','dessous'); ok(PA,'projA','ls560'); ok(PB,'projB','lk953'); ok(PC,'projC','lk953'); if(S.montage!=='droit') S.montage='miroir'; if(S.accroche!=='mat') S.accroche='rail'; ok(SILICONE,'silicone','bleu'); ok(INSTR,'nom','RES'); ok(HP,'hp','hp10'); ok(PS,'projS','lieu'); ok(PELICAN,'tCase','a1637'); if(S.regieE&&S.vue==='regie') S.vue='ensemble'; if(S.tCol!=='tissu') S.tCol='tole'; if(S.tBase!=='pleine') S.tBase='creuse';
  if(!TABS.includes(S.tab)) S.tab='espace'; if(!MODES.includes(S.mode)) S.mode='un'; if(!VUES.includes(S.vue)) S.vue='ensemble'; if(S.mic!=='pied') S.mic='bras'; if(S.sol!=='blanc') S.sol='bois'; if(S.miroir!=='verre') S.miroir='papier';
  const L={ padH:[820,1120],ecranH:[500,1100],plateH:[0,1100],plafond:[2400,3600],gril:[3000,8000],px:[380,620],py:[260,480],ecart:[250,900],lum:[0,100],tN:[1,4],diam:[2,8] }; for(const k in L) S[k]=Math.min(Math.max(S[k],L[k][0]),L[k][1]); S.tN=Math.round(S.tN); if(S.plateH/1000<VINYLE) S.plateH=0; S.diamV=S.diam; })();
addEventListener('hashchange',()=>location.reload());          // un lien collé dans l'onglet ouvert ; replaceState ne le déclenche pas
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
const room=new THREE.Scene(); room.environment=env; room.environmentIntensity=.05; room.background=new THREE.Color('#0a0a0c');
const hemi=new THREE.HemisphereLight('#ffffff','#e2e2df',1); room.add(hemi);
const sky=new THREE.DirectionalLight('#ffffff',1); sky.position.set(1.2,5,1.6); sky.castShadow=true; sky.shadow.mapSize.set(2048,2048); sky.shadow.radius=9; sky.shadow.bias=-.0004; sky.shadow.normalBias=.012; Object.assign(sky.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.5,far:9}); room.add(sky);

const cam=new THREE.PerspectiveCamera(34,1,.03,60), ctl=new OrbitControls(cam,cv); ctl.enableDamping=true; ctl.dampingFactor=.08; ctl.maxPolarAngle=Math.PI*.515; ctl.minDistance=.25; ctl.maxDistance=24;
let comp=null,bloom=null,compS=null,ao=null,aoR=null;
function makeComposer(w,h,pr){ const rt=new THREE.WebGLRenderTarget(w*pr,h*pr,{type:THREE.HalfFloatType,samples:4}); comp=new EffectComposer(R,rt); comp.setPixelRatio(pr); comp.setSize(w,h); comp.addPass(new RenderPass(room,cam)); aoR=new GTAOPass(room,cam,w,h); aoR.updateGtaoMaterial({radius:.3,distanceExponent:1.3,thickness:.8,scale:1.1,samples:16,screenSpaceRadius:false}); aoR.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:7,rings:2,samples:16}); comp.addPass(aoR); bloom=new UnrealBloomPass(new THREE.Vector2(w,h),.2,.6,.92); comp.addPass(bloom); comp.addPass(new OutputPass());
  const rt2=rt.clone(); compS=new EffectComposer(R,rt2); compS.setPixelRatio(pr); compS.setSize(w,h); compS.addPass(new RenderPass(studio,cam)); ao=new GTAOPass(studio,cam,w,h); ao.updateGtaoMaterial({radius:.09,distanceExponent:1.2,thickness:.6,scale:1.15,samples:16,screenSpaceRadius:false}); ao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:16}); compS.addPass(ao); compS.addPass(new OutputPass()); }

// ---------------------------------------------------------------- scènes
let asm=[], space=null, trp=null, studioExtra=new THREE.Group(), roomExtra=new THREE.Group(); studio.add(studioExtra); room.add(roomExtra);
function clear(g){ [...g.children].forEach(c=>{ c.traverse(n=>{ if(n.isCSS2DObject) n.element.remove(); }); disposeTree(c); }); }
function label(txt,pos,cls,parent){ const e=document.createElement('div'); e.className='lb '+(cls||''); e.textContent=txt; const o=new CSS2DObject(e); o.position.copy(pos); parent.add(o); return o; }
function dim(g,a,b,txt,col='#c4232c',tick=V(.012,0,0)){
  const m=new THREE.LineBasicMaterial({color:col,depthTest:false,transparent:true}); const pts=[a,b,a.clone().add(tick),a.clone().sub(tick),b.clone().add(tick),b.clone().sub(tick)];
  const l=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),m); l.renderOrder=9; g.add(l); label(txt,a.clone().lerp(b,.5),'q',g);
}
function videStudio(){ if(scr){ disposeTree(scr.g); scr=null; } if(trp){ disposeTree(trp.g); trp=null; } asm.forEach(a=>disposeTree(a.g)); asm=[]; clear(studioExtra); }
function buildStudio(){
  videStudio();
  const un=S.mode==='un', tl=S.mode==='tailles', L=un?[S]:tl?Object.keys(HP).map(hp=>({...S,hp})):['A','B'].map(stand=>({...S,stand})), names=Object.keys(INSTR), X=i=>(i-(L.length-1)/2)*PAS();
  L.forEach((c,i)=>{ const a=buildAssembly({...c,nom:un?S.nom:names[i%3]}); a.g.position.x=X(i); studio.add(a.g); a.set.e=S.eclate; a.apply(); asm.push(a);
    if(!un) label(tl?HP[c.hp].po:c.stand+'  '+STANDS[c.stand].nom,V(X(i),.06,.5),'n',studioExtra); });
  if(S.figure) L.forEach((c,i)=>{ const p=person({h:1.72,pose:'joue',handY:S.padH/1000,mat:M.fig}); p.position.set(X(i),0,.5); studioExtra.add(p); });
  if(S.cotesI&&un){
    const a=asm[0], Hs=a.Hs, g=studioExtra, m=a.info.dims, w=m.F[0]/2, ph=S.padH/1000, xl=-w-.14, xr=m.W/2+.09, r=m.d/2;
    dim(g,V(xl-.09,0,.1),V(xl-.09,ph,.1),fr(S.padH)+' pads XY'); dim(g,V(xl,0,.1),V(xl,Hs,.1),fr(Hs*1000)+' stand'); dim(g,V(xl,Hs,.1),V(xl,Hs+.08,.1),'80');
    dim(g,V(-w,.004,m.F[1]/2+.05),V(w,.004,m.F[1]/2+.05),fr(m.F[0]*1000),'#c4232c',V(0,0,.012)); dim(g,V(-.1332,ph+.13,-.09),V(.1332,ph+.13,-.09),'266','#c4232c',V(0,.012,0));
    dim(g,V(xr+.1,0,0),V(xr+.1,m.ys,0),fr(m.ys*1000)+' axe des HP'); dim(g,V(xr,m.ys-r,.02),V(xr,m.ys+r,.02),'Ø '+fr(m.H.d));
    dim(g,V(.2,Hs+.075,.0895),V(.2,Hs+.075,-.0895),'179','#c4232c',V(.012,0,0));
  }
}
const PAS=()=>S.mode==='tailles'?.78:1.02;
function buildTrp(){ videStudio(); trp=buildTransport(S); studio.add(trp.g); trp.setExplode(S.eclT); trp.labels.forEach(l=>label(l[0],l[1],'n',studioExtra)); }
let scr=null;
function buildEcran(){
  videStudio(); fit();
  scr=buildScreen(S); studio.add(scr.g); scr.setExplode(S.eclE); scr.setBeams(S.faiS&&S.eclE<.02); scr.setCut(S.coupeS); scr.mat.uniforms.uAmb.value=.55; scr.mat.uniforms.uGain.value=1.05;
  if(S.figS){ const p=person({h:1.72,pose:'joue',handY:S.padH/1000,mat:M.fig}); p.position.set(-scr.Rb-.75,0,0); p.rotation.y=-Math.PI/2; studioExtra.add(p); }
  if(S.cotesS&&S.eclE<.02) scr.dims.forEach(d=>dim(studioExtra,d[0],d[1],d[2],'#c4232c',d[3])); if(S.faiS&&S.eclE<.02) scr.labels.forEach(l=>label(l[0],l[1],'',studioExtra));
}
// l'écran ne dépasse pas les instruments, l'image ne dépasse pas ce que le projecteur permet
function fit(){ const h=S.padH-20; S.ecranH=Math.min(S.ecranH,h); S.plateH=Math.min(S.plateH,h); S.diam=Math.max(Math.min(S.diamV,diamMax(S)),diamMin(S)); }
function buildRoom(){
  if(space) disposeTree(space.g); clear(roomExtra); fit();
  space=buildSpace(S); room.add(space.g); applyRoom();
}
function applyRoom(){
  clear(roomExtra); if(!space) return;
  space.visitors.visible=S.public&&S.vue!=='instrument'&&S.vue!=='coupe'; space.players.visible=S.public&&S.vue!=='instrument'; space.players.children[0].visible=S.vue!=='joueur'; space.op.visible=S.public&&S.vue!=='regie'; space.sats.forEach(q=>q.visible=true); space.cables.visible=S.cables; space.setBeams(S.faisceau||S.coupe); space.sc.setHaut(true); space.setCut(S.coupe); if(S.vue==='plan') space.sc.setHaut(false);
  const oc=S.rideaux||S.sys==='sol', l=oc?S.lum/100:Math.max(S.lum/100,.75); hemi.intensity=.1+l*.9; room.environmentIntensity=.04+l*.24; sky.intensity=l*1.6; sky.castShadow=l>.02; space.lights.forEach(p=>p.intensity=8*(p.userData.k||1)*(1-l*.7)); room.background.setScalar(.03+l*.8); space.ei.pane.color.set(oc?'#b9b6ae':'#ffffff').multiplyScalar(oc?.25+l*.6:1.35); space.ei.bulb.color.setScalar(.2+l*1.1); space.screenMat.uniforms.uGain.value=1.05; space.screenMat.uniforms.uAmb.value=l*(S.sys==='dessous'?1:1.9); space.lumGlow=1.1-.85*l;
  const i=space.info, g=roomExtra;
  if(S.cotesE){
    const col='#c4232c', y=i.H+.02;
    space.sc.dims.forEach(d=>dim(g,d[0],d[1],d[2],col,d[3]));
    space.inst.forEach(a=>{ const s=Math.sin(a.angle),c=Math.cos(a.angle); dim(g,V(s*i.Rb,.03,c*i.Rb),V(s*(i.Rr-.16),.03,c*(i.Rr-.16)),fr(S.ecart),col,V(c*.04,0,-s*.04)); });
    const p=space.inst.map(a=>V(Math.sin(a.angle)*i.Rr,.03,Math.cos(a.angle)*i.Rr)); p.forEach((q,k)=>dim(g,q,p[(k+1)%3],fr(i.dist,2)+' m',col,V(0,.04,0)));
  }
  space.inst.filter((a,k)=>!(S.coupe&&k===1)).forEach(a=>label(a.nom,V(Math.sin(a.angle)*i.Rr,S.padH/1000+.16,Math.cos(a.angle)*i.Rr),'n',g));
  if(!S.regieE&&(S.cables||S.coupe)) label('Régie : Palinopsia',space.regie.position.clone().setY(1.42),'',g);
  if(S.coupe||S.faisceau) space.sc.labels.forEach(l=>{ if(l[0]!=='Gril du lieu') label(l[0],l[1],'',g); });
}

// ---------------------------------------------------------------- caméras
let fly=null;
function goto(p,t,fov=34,ms=1100){ const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches; const a={p:cam.position.clone(),t:ctl.target.clone(),f:cam.fov};
  if(reduce||ms===0){ cam.position.copy(p); ctl.target.copy(t); cam.fov=fov; cam.updateProjectionMatrix(); ctl.update(); fly=null; return; }
  fly={a,p,t,fov,t0:performance.now(),ms}; }
function viewRoom(ms=1100){
  const i=space.info, k=portrait()?1.95:1, Rr=i.Rr, views={
    ensemble:S.sys==='sol'?[V(-3.7,2.3,4.5),V(.2,1.25,-.1),portrait()?76:56]:[V(1.0-space.cx,2.05,7.5-space.cy),V(.25,S.sys==='dessous'?.95:1.05,-.1),portrait()?66:46], maquette:S.sys==='sol'?[V(-6.2*k,7.4*k+1.5,8.4*k),V(-.4,1.2,.6),40]:[V(-7.4*k,7.3*k,10.2*k),V(-.6,.1,1.2),37], coin:S.sys==='sol'?[V(4.5,2.2,4.5),V(-.1,1.1,-.1),portrait()?84:64]:[V(7.6-space.cx,2.15,6.5-space.cy),V(-.2,.8,-.1),portrait()?80:62], plan:[V(0,10.2*k,.9),V(0,0,.9),44],
    joueur:[V(0,1.62,Rr+.52),V(0,.36,-.15),64], regie:[space.regie.position.clone().add(V(-.55,1.75,-.12)),V(.4,.5,.1),56], coupe:S.sys==='dessous'?[V(3.0*k,.98,0),V(0,.5,0),46]:S.sys==='sol'?[V(4.3*k,1.9,0),V(0,space.sc.O.s.rear*.46,0),Math.min(40+space.sc.O.s.rear*7,84)]:[V(3.0*k,1.35,-.25),V(0,1.2,-.25),56], instrument:[V(Math.sin(2.0944)*(Rr+1.05)+.75,1.55,Math.cos(2.0944)*(Rr+1.05)+.8),V(Math.sin(2.0944)*Rr-.12,.74,Math.cos(2.0944)*Rr),40] };
  const v=views[S.vue]||views.ensemble; S.coupe=S.vue==='coupe'; applyRoom(); goto(...v,ms);
}
function viewEcran(ms=1100){ const k=portrait()?1.6:1, hi=S.sys!=='dessous', so=S.sys==='sol', top=so?scr.O.s.rear+.3:2.6, f=so?Math.max(top/2.4,1):1;
  if(so) goto(S.eclE>.02?V(3.6*k*f,2*f,3.9*k*f):V(2.7*k*f,1.5*f,3.1*k*f),V(0,top*.49,0),38,ms);
  else if(S.eclE>.02) goto(hi?V(5*k,2.7*k,5.2*k):V(4.4*k,2.6*k,4.9*k),V(hi?0:.9,hi?1.4:.75,0),38,ms); else goto(hi?V(3.9*k,2.2,3.9*k):V(2.9*k,1.9,3.0*k),V(0,hi?1.05:.5,hi?-.2:0),38,ms); }
function viewStudio(ms=1100){ const k=portrait()?1.45:1; if(S.mode!=='un'){ const t=S.mode==='tailles', q=k*(portrait()?(t?1.7:1.25):1); goto(t?V(2.5*q,1.45,3.75*q):V(1.15*q,1.4,4.1*q),V(0,.68,0),34,ms); } else if(S.figure) goto(V(2.75*k,1.5,-.35),V(.02,.83,.22),34,ms); else goto(V(1.12*k,1.6,2.12*k),V(.03,.72,0),34,ms); }
function viewTrp(ms=1100){ const k=(portrait()?(S.tN===1?1.5:2.1):1)*(S.tN>2?1.35:S.tN===1?.8:1); goto(V(.55*k,1.75*k,2.15*k),V(0,.2,.02),36,ms); }
const portrait=()=>stage.clientWidth<stage.clientHeight*1.05;

// ---------------------------------------------------------------- panneau
const P=$('#panelIn');
const el=(h)=>{ const t=document.createElement('template'); t.innerHTML=h.trim(); return t.content.firstChild; };
function seg(key,opts,cb){ const d=el('<div class="seg" role="group"></div>'); for(const [v,n] of Object.entries(opts)){ const b=el(`<button type="button" data-f="${key}:${v}" aria-pressed="${S[key]===v||S[key]===(v==='true')&&typeof S[key]==='boolean'}">${n}</button>`); b.onclick=()=>{ S[key]=typeof DEF[key]==='boolean'?v==='true':v; cb(); panel(); }; d.append(b);} return d; }
function rng(key,name,min,max,step,fmt,cb,live=true){ const d=el(`<label class="rng"><span>${name}</span><output>${fmt(S[key])}</output><input type="range" min="${min}" max="${max}" step="${step}" value="${S[key]}" data-f="${key}" aria-label="${name}"></label>`); const i=$('input',d); i.oninput=()=>{ S[key]=+i.value; $('output',d).textContent=fmt(S[key]); if(live) debounce(cb); }; i.onchange=()=>{ if(!live){ cb(); readout(); } }; return d; }
const sync=key=>{ const q=SYNC[key]; if(q&&q.isConnected){ const i=$('input',q); i.min=diamMin(S); i.max=Math.max(+i.min+.25,diamMax(S)); i.value=S[key]; $('output',q).textContent=q.fmt(S[key]); } }, SYNC={};
function tog(list){ const d=el('<div class="tg"></div>'); list.forEach(([k,n,cb])=>{ const l=el(`<label><input type="checkbox" data-f="${k}" ${S[k]?'checked':''}>${n}</label>`); $('input',l).onchange=e=>{ S[k]=e.target.checked; cb(); }; d.append(l); }); return d; }
let dbt; function debounce(f){ clearTimeout(dbt); dbt=setTimeout(()=>{ f(); readout(); },60); }
function grp(t,...kids){ const d=el(`<div class="grp"><h3>${t}</h3></div>`); kids.forEach(k=>k&&d.append(typeof k==='string'?el(k):k)); P.append(d); return d; }
const mm=v=>fr(v)+' mm';
function reI(){ buildStudio(); if(space) dirtyRoom=true; readout(); writeHash(); }
function reS(){ buildEcran(); readout(); writeHash(); dirtyRoom=true; }
function reE(){ buildRoom(); readout(); writeHash(); }
let dirtyRoom=true;
function panel(){
  const top=P.scrollTop, foc=P.contains(document.activeElement)?document.activeElement.dataset.f:null; P.innerHTML='';
  const sil=el('<div class="sw"></div>'); for(const k in SILICONE){ const b=el(`<button type="button" data-f="sil:${k}" aria-label="Silicone ${k}" title="${k}" aria-pressed="${S.silicone===k}" style="background:${SILICONE[k]}"></button>`); b.onclick=()=>{ S.silicone=k; S.tab==='espace'?reE():reI(); panel(); }; sil.append(b); }
  if(S.tab==='instrument'){
    grp('Affichage',seg('mode',{un:'Un instrument',trois:'Les deux stands',tailles:'Les quatre tailles'},()=>{ reI(); viewStudio(); }));
    if(S.mode!=='trois') grp('Stand',seg('stand',Object.fromEntries(Object.entries(STANDS).map(([k,v])=>[k,v.nom])),reI),`<p class="desc">${STANDS[S.stand].court}</p>`);
    grp('Micro',seg('mic',{bras:'Bras articulé',pied:'Pied de micro'},reI));
    grp('Haut-parleurs',S.mode==='tailles'?null:hpSeg(reI),S.mode==='tailles'?null:hpDesc(),Object.assign(seg('open',{false:'Grilles perforées',true:'Membranes visibles'},reI),{style:'margin-top:10px'}));
    grp('Base molle',sil,'<p class="desc">Glisse sur l’instrument pour l’incliner. Il revient en place.</p>');
    grp('Réglages',rng('padH','Hauteur des pads XY',820,1120,5,mm,reI),rng('eclate','Vue éclatée',0,1,.01,v=>fr(v*100)+' %',()=>{ asm.forEach(a=>{a.set.e=S.eclate;a.apply();}); }));
    grp('Montrer',tog([['xray','L’intérieur du stand',reI],['cotesI','Les cotes',()=>{ if(S.cotesI&&S.mode!=='un'){ S.mode='un'; reI(); viewStudio(); } else reI(); panel(); }],['figure','Une personne (1,72 m)',()=>{ reI(); viewStudio(); }]]));
    if(S.mode==='un') grp('Écran affiché',seg('nom',Object.fromEntries(Object.keys(INSTR).map(k=>[k,k])),reI));
    const d=grp(S.mode==='un'?'Chiffres':'Exporter','<dl class="kv" id="ro"></dl>'); const b=el('<button class="btn" type="button">Télécharger le modèle (GLB)</button>'); b.onclick=()=>exportGLB(); d.append(b);
  } else if(S.tab==='ecran'){
    sysPanel(reS,()=>viewEcran()); techPanel(reS);
    grp('Vue éclatée',rng('eclE','Écartement',0,1,.01,v=>fr(v*100)+' %',buildEcran));
    grp('Montrer',tog([['coupeS','La coupe',reS],['faiS','Le faisceau et les noms',reS],['cotesS','Les cotes',reS],['figS','Une personne (1,72 m)',reS]]));
    const d=grp('Optique','<dl class="kv" id="ro"></dl>'); const b=el('<button class="btn" type="button">Télécharger le modèle (GLB)</button>'); b.onclick=()=>exportGLB(scr.g,`ecran-${S.sys}`); d.append(b);
    const b2=el('<button class="btn" type="button">Fiche de fabrication</button>'); b2.onclick=()=>tab('fab'); d.append(b2);
  } else if(S.tab==='transport'){
    trpPanel();
  } else {
    grp('Vue',seg('vue',{ensemble:'Ensemble',coin:'Coin',maquette:'Maquette',joueur:'Joueur',instrument:'Instrument',coupe:'Coupe',plan:'Dessus',...(S.regieE?{}:{regie:'Régie'})},()=>{ viewRoom(); writeHash(); }));
    sysPanel(reE,()=>viewRoom()); techPanel(reE);
    const sol=S.sys==='sol'; grp(sol?'Le lieu':'EISODE',sol?'<p class="desc">Lieu générique : salle blanche de 10 × 10 m avec un gril.</p>':rng('px','Position du disque, est-ouest',...(S.sys==='mat'&&S.accroche==='rail'?[445,625]:[380,620]),5,v=>`${fr(v/100,2)} m`,reE),sol?null:S.sys==='mat'&&S.accroche==='rail'?'<p class="desc">Nord-sud : fixée par le rail 2 du plafond.</p>':rng('py','Position du disque, nord-sud',260,480,5,v=>`${fr(v/100,2)} m`,reE),rng('lum','Lumière de la salle',0,100,5,v=>v+' %',()=>{ applyRoom(); writeHash(); }),
      sol?null:Object.assign(tog([['rideaux','Fenêtres occultées',()=>{ applyRoom(); writeHash(); }]]),{style:'margin-top:12px'}),Object.assign(seg('sol',sol?{bois:'Plancher gris',blanc:'Plancher blanc'}:{bois:'Plancher de bois',blanc:'Plancher blanc'},reE),{style:'margin-top:12px'}),rng('ecart','Écart écran, instrument',250,900,50,mm,reE));
    grp('Instruments',hpSeg(reE),hpDesc(),Object.assign(seg('stand',Object.fromEntries(Object.entries(STANDS).map(([k,v])=>[k,v.nom])),reE),{style:'margin-top:10px'}),Object.assign(seg('mic',{bras:'Bras articulé',pied:'Pied de micro'},reE),{style:'margin-top:8px'}),Object.assign(seg('open',{false:'Grilles',true:'Membranes'},reE),{style:'margin-top:8px'}),'<div style="height:10px"></div>',sil);
    grp('Montrer',tog([['public','Le public',applyRoom],['cables','Les câbles',applyRoom],['faisceau','Le faisceau',applyRoom],['cotesE','Les cotes',applyRoom]]));
    grp('Optique',`<dl class="kv" id="ro"></dl>`);
  }
  readout(); P.scrollTop=top; if(foc) P.querySelector(`[data-f="${foc}"]`)?.focus({preventScroll:true});
}
const hpSeg=re=>seg('hp',Object.fromEntries(Object.entries(HP).map(([k,v])=>[k,v.po])),re);
const hpDesc=()=>{ const h=HP[S.hp]; return `<p class="desc">${h.nom}, coaxial : ${h.hz} Hz à 18 kHz, ${h.db} dB à 1 W et 1 m, ${fr(h.kg,1)} kg. ${h.hz>=90?'Le bas du grave demande un sub.':'Assez de grave sans sub dans une petite salle.'}</p>`; };
function techPanel(re){
  grp('Technique et son',tog([['regieE','L’ordinateur et le réseau dans l’écran',()=>{ const v=S.regieE&&S.vue==='regie'; if(v) S.vue='ensemble'; re(); panel(); if(v&&S.tab==='espace') viewRoom(); }],['sub','Un sub de 8 po dans l’écran',()=>{ re(); panel(); }],...(S.tab==='espace'?[['sat','Trois enceintes sur pied',()=>{ re(); panel(); }]]:[])]),techNote());
}
function techNote(){ const t=(S.tab==='ecran'?scr:space?.sc)?.tech||{}, L=[]; if(S.sub) L.push(t.sub?.cote?(S.sys==='dessous'?'Le sub est à côté : il n’entre pas dessous sans couper le faisceau ou toucher la toile.':'Le sub est à côté : il faut environ 36 cm sous la toile.'):'Le sub est sous la toile, hors du faisceau.'); if(S.regieE) L.push(t.tray?.cote?(S.sys==='dessous'?'La technique est à côté : il n’y a pas la place dessous.':'La technique est à côté : il faut environ 17 cm sous la toile.'):'La technique est sous la toile. Il ne sort de l’écran qu’un câble de courant, et un vers chaque instrument.'); return L.length?`<p class="desc" id="tn">${L.join(' ')}</p>`:null; }
function sysPanel(re,view){
  const P=projOf(S), [key,L]={ dessous:['projA',PA],mat:['projB',PB],sol:['projS',PS],portique:['projC',PC] }[S.sys], go=()=>{ fit(); re(); view(); }, live=()=>{ fit(); re(); sync('diam'); };
  grp('Système',seg('sys',Object.fromEntries(Object.entries(SYS).map(([k,v])=>[k,v.nom])),go),`<p class="desc">${SYS[S.sys].court}</p>`,S.sys==='mat'?Object.assign(seg('accroche',{rail:'Rail 80/20 d’EISODE',mat:'Mât portatif'},go),{style:'margin-top:10px'}):null);
  const diam=rng('diam','Image',diamMin(S),Math.max(diamMax(S),diamMin(S)+.25),.25,v=>`${fr(v,2)} pi (${fr(v*FT,2)} m)`,()=>{ S.diamV=S.diam; re(); }); diam.fmt=v=>`${fr(v,2)} pi (${fr(v*FT,2)} m)`; SYNC.diam=diam;
  const haut=S.sys==='dessous'?rng('ecranH','Hauteur de l’écran',500,S.padH-20,10,mm,live):hautBas(live);
  grp('Hauteur et taille',haut,diam,`<p class="desc">${S.sys==='dessous'?'Plus la toile est basse, plus le trajet est court, et plus l’image rapetisse.':'Plus l’écran est haut, plus il est près du projecteur, et plus l’image rapetisse.'}</p>`,S.sys==='sol'?rng('gril','Hauteur du gril',3000,8000,50,mm,live):rng('plafond','Plafond',2400,3600,10,v=>v===2570?'2 570 mm (EISODE)':mm(v),live));
  grp('Projecteur',seg(key,Object.fromEntries(Object.entries(L).map(([k,v])=>[k,v.court])),()=>{ fit(); re(); }),`<p class="desc">${P.desc} <strong>${prixDe(P)}</strong></p>`,S.sys==='dessous'?Object.assign(seg('miroir',{papier:'Papier miroir',verre:'Miroir de verre'},()=>{ re(); }),{style:'margin-top:10px'}):null,S.sys==='dessous'?`<p class="desc">${S.miroir==='papier'?'Papier miroir collé sur un disque en secteurs : léger, démontable, et l’image prend une texture.':'Verre à première surface : image nette, mais le miroir ne se démonte pas.'}</p>`:null,S.sys==='portique'?Object.assign(seg('montage',{miroir:'Couché, miroir',droit:'Pointé vers le bas'},()=>{ fit(); re(); }),{style:'margin-top:10px'}):null);
}
const O2=o=>{ const q=o.mir(0), e=i=>(Math.max(...q.map(p=>p[i]))-Math.min(...q.map(p=>p[i])))*100; return o.rond?`disque Ø ${fr(o.mr*200)} cm`:`ovale ${fr(e(1))} × ${fr(e(0))} cm`; };
const prixDe=P=>/^liste/.test(P.prix)?'Liste de prêt, gratuit.':P.lieu?'Fourni par le lieu.':P.prix+(/\$/.test(P.prix)?'.':' $ US.');
// hauteur du dessus bas : sous 50 mm, c'est un vinyle au sol
function hautBas(cb){ S.hB=Math.max(S.plateH,40); const f=v=>v<50?'Au sol (vinyle)':mm(v); return rng('hB','Hauteur de l’écran',40,S.padH-20,10,f,()=>{ S.plateH=S.hB<50?0:S.hB; cb(); }); }
function reT(){ buildTrp(); readout(); writeHash(); dirtyRoom=true; }
function trpPanel(){
  const st=re=>Object.assign(seg('stand',Object.fromEntries(Object.entries(STANDS).map(([k,v])=>[k,v.nom])),re),{style:'margin-top:10px'});
  grp('Configuration',seg('sys',Object.fromEntries(Object.entries(SYS).map(([k,v])=>[k,v.nom])),()=>{ fit(); reT(); }),hpSeg2(),st(reT));
  grp('Pour alléger',seg('tCol',{tole:'Tôles d’alu à plat',tissu:'Housse de tissu'},reT),Object.assign(seg('tBase',{pleine:'Base molle pleine',creuse:'Base molle creuse'},reT),{style:'margin-top:8px'}),Object.assign(tog([...(projOf(S).lieu?[]:[['tProj','Emporter le projecteur',()=>{ reT(); }]]),...(S.mic==='bras'?[['tMic','Emporter les bras de micro',()=>{ reT(); }]]:[]),['tCab','Ordinateur et micros en cabine',()=>{ reT(); }],['sub','Prévoir un sub',()=>{ reT(); panel(); }],...(S.sub?[['tSub','Emporter le sub',()=>{ reT(); }]]:[])]),{style:'margin-top:10px'}));
  grp('Cases Pelican',seg('tCase',Object.fromEntries(Object.entries(PELICAN).map(([k,v])=>[k,v.nom])),()=>{ reT(); viewTrp(); }),Object.assign(rng('tN','Nombre de cases',1,4,1,v=>fr(v),()=>{ reT(); viewTrp(); }),{style:'margin-top:10px'}),rng('eclT','Soulever le contenu',0,1,.01,v=>fr(v*100)+' %',()=>trp&&trp.setExplode(S.eclT)));
  const d=grp('Résultat','<dl class="kv" id="ro"></dl>'); d.append(el('<div id="tl"></div>'));
}
const hpSeg2=()=>Object.assign(hpSeg(reT),{style:'margin-top:10px'});
function readout(){
  const d=$('#ro'); if(!d) return; const row=(a,b,w)=>`<dt>${a}</dt><dd class="${w?'warn':''}">${b}</dd>`;
  if(S.tab==='transport'){ const p=trp?.p; if(!p) return; const ko=[...p.left,...p.hors];
    d.innerHTML=p.cases.map((c,k)=>row(`Case ${k+1}`,`${fr(c.kg,1)} kg, ${fr(c.fill*100)} % pleine`,c.kg>SOUTE.max)).join('')+row('Somme des côtés',`${fr(p.somme,1)} cm (max. ${SOUTE.somme})`,p.somme>SOUTE.somme+.05)+row('Poids permis',`${SOUTE.kg} kg (${SOUTE.max} avec frais)`)+row('Contenu',`${fr(p.total,1)} kg`)+row('Verdict',ko.length?`${ko.length} objet${ko.length>1?'s':''} dehors`:p.cases.some(c=>c.kg>SOUTE.max)?'trop lourd':p.somme>SOUTE.somme+.05?'entre, case hors format':p.cases.some(c=>c.kg>SOUTE.kg)?'entre, avec supplément':'entre',ko.length||p.somme>SOUTE.somme+.05||p.cases.some(c=>c.kg>SOUTE.max));
    const li=(t,L,w)=>L.length?`<h4 class="${w?'warn':''}">${t}</h4><ul class="it">${L.map(i=>`<li><i style="background:${colOf(i.g)}"></i>${i.n>1?i.n+' × ':''}${i.nom}<b>${fr(i.tot,1)} kg</b>${i.note?`<small>${i.note}</small>`:''}</li>`).join('')}</ul>`:'';
    $('#tl').innerHTML=li('N’entre dans aucune case',resume(p.hors),1)+li('Plus de place',resume(p.left),1)+li('Dans les cases',resume(p.ok.filter(i=>!p.left.includes(i))))+(p.cab.length?`<h4>En cabine</h4><ul class="it">${p.cab.map(t=>`<li>${t}</li>`).join('')}</ul>`:'')+(p.sur.length?`<h4>Sur place</h4><ul class="it">${p.sur.map(t=>`<li>${t}</li>`).join('')}</ul>`:''); return; }
  if(S.tab==='instrument'){ if(S.mode!=='un'){ d.innerHTML=''; return; } const i=asm[0]?.info; if(!i) return;
    d.innerHTML=row('Hauteur du stand',mm(i.Hs*1000))+row('Emprise au sol',`${i.encombrement[0]} × ${i.encombrement[1]} mm`)+row('Corps, largeur × prof.',`${i.corps[0]} × ${i.corps[1]} mm`)+row('Haut-parleurs',`2 × ${HP[S.hp].po}, dès ${HP[S.hp].hz} Hz`)+row('Volume par haut-parleur',`≈ ${fr(i.vol/2,1)} L`)+row('Masse totale',`≈ ${fr(i.kg)} kg`)+row('Force qui fait basculer',`≈ ${fr(i.bascule,-0)} N`,i.bascule<110);
  } else { const o=optics(S);
    const lx=v=>`≈ ${fr(Math.round(v/10)*10)} lx`, P=o.P; let h='';
    if(S.sys==='dessous'){ const f=o.f; h=f?row('Image la plus grande',`${fr(diamMax(S),2)} pi`)+row('Anneau, extérieur',`Ø ${fr((o.Rt+.02)*2,2)} m`)+row('Au sol',`Ø ${fr(o.Rf*2,2)} m`)+row('Jeu dans la jupe',`${fr(o.jeu*1000)} mm`,o.jeu<.008)+row('Trajet optique',`${fr(f.T*100)} cm`)+row('Miroir',O2(o))+row('Angle du miroir',`${fr(Math.abs(f.ph),1)}°`)+row('Inclinaison du projecteur',`${fr(Math.abs(f.tilt))}°`,Math.abs(f.tilt)>15):''; }
    else if(S.sys==='mat'){ const k=o.m; h=row('Image la plus grande',`${fr(diamMax(S),2)} pi`)+row('Axe du projecteur',`${fr(k.yA*100)} cm`)+row('Dessus du caisson',`${fr(k.top*100)} cm`,!k.ok)+row('Miroir',`${fr(k.ml*100)} × ${fr(k.mw*100)} cm`)+row('Décentrement',`${fr(k.off*100)} %`)+row(S.accroche==='rail'?'Accroche au centre':'Mât au centre',`${fr(-k.xm*100)} cm`); }
    else if(S.sys==='sol'){ const k=o.s; h=row('Image la plus grande',`${fr(diamMax(S),2)} pi`)+row('Objectif au-dessus du sol',`${fr(k.lensY,2)} m`)+(k.drop>.05?row('Descendre le projecteur de',`${fr(k.drop,2)} m`):'')+row('Rapport requis',`${fr(k.zoom,2)} : 1`,!k.ok)+row('Gril possible',`${fr(k.idealMin,1)} à ${fr(k.idealMax,1)} m`); }
    else { const k=o.p; h=row('Image la plus grande',`${fr(diamMax(S),2)} pi`)+row('Dessus du portique',`${fr(k.top*100)} cm`)+row('Trajet optique',`${fr(k.d*100)} cm`)+row('Rapport requis',`${fr(k.trReq,2)} : 1`,!k.fit); }
    if(!o.ok) h=row('Montage',S.sys==='dessous'?'impossible à cette hauteur':'l’image ne remplit pas le disque',true)+h; if(!o.px){ d.innerHTML=h; return; }
    d.innerHTML=h+row('Pixel',`${fr(o.px,1)} mm`)+row('Éclairement',lx(o.lux),o.lux<450)+row('Incidence maximale',`${fr(o.inc)}°`);
    { const n=$('#tn'), h2=n&&techNote(); if(h2) n.outerHTML=h2; }
    if(S.tab==='ecran') return;
    const dg=degagement(S); d.innerHTML+=row('Distance entre instruments',`${fr(space?.info.dist||0,2)} m`)+row('Derrière les joueur·euse·s',dg<0?'dans un mur':`${fr(dg*100)} cm`,dg<.5);
  }
}
async function exportGLB(src,nom){
  const { GLTFExporter }=await import('three/addons/exporters/GLTFExporter.js'); const { mergeGeometries }=await import('three/addons/utils/BufferGeometryUtils.js');
  const g=src?.isObject3D?src.clone(true):asm.reduce((q,a)=>(q.add(a.g.clone(true)),q),new THREE.Group()); if(src?.isObject3D) g.traverse(n=>{ if(n.isLine||n.material?.opacity<.2) n.visible=false; }); else if(asm.length===1) g.children[0].position.set(0,0,0); const rm=[];
  g.traverse(n=>{ if(n.isInstancedMesh){ const L=[],m=new THREE.Matrix4(); for(let i=0;i<n.count;i++){ n.getMatrixAt(i,m); L.push(n.geometry.clone().applyMatrix4(m)); } const q=new THREE.Mesh(mergeGeometries(L),n.material); rm.push([n,q]); } });
  rm.forEach(([n,q])=>{ n.parent.add(q); n.removeFromParent(); });
  new GLTFExporter().parse(g,b=>{ const u=URL.createObjectURL(new Blob([b],{type:'model/gltf-binary'})); const l=document.createElement('a'); l.href=u; l.download=`impressions-${nom||(S.mode==='trois'?'stands':`${STANDS[S.stand].nom.toLowerCase()}-${S.mode==='tailles'?'tailles':S.hp}`)}.glb`; l.click(); setTimeout(()=>URL.revokeObjectURL(u),4000); },e=>console.error(e),{binary:true,onlyVisible:true});
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
  const pw=w>820?332:0, ph=w<=820&&!$('#panel').hidden&&!$('#panel').classList.contains('off')?$('#panelIn').offsetHeight:0; cam.setViewOffset(w+pw*.0001,h,pw/2,ph/2,w,h); cam.updateProjectionMatrix(); if(!comp) makeComposer(w,h,pr); else { comp.setPixelRatio(pr); comp.setSize(w,h); compS.setPixelRatio(pr); compS.setSize(w,h); } }
new ResizeObserver(size).observe(stage);
let shadowTick=0;
function step(now){
  const dt=Math.min((now-last)/1000,.05), t=now/1000; last=now;
  if(!T3.includes(S.tab)||!comp) return;
  if(fly&&fly.p){ let k=Math.min((now-fly.t0)/fly.ms,1); k=k*k*(3-2*k); cam.position.lerpVectors(fly.a.p,fly.p,k); ctl.target.lerpVectors(fly.a.t,fly.t,k); cam.fov=fly.a.f+(fly.fov-fly.a.f)*k; cam.updateProjectionMatrix(); if(k>=1) fly=null; }
  ctl.update();
  if(S.tab==='ecran'){ if(scr){ scr.mat.uniforms.uT.value=t; ao.enabled=!scr.beams.visible; } compS.render(dt); L2.render(studio,cam); }
  else if(S.tab==='transport'){ ao.enabled=true; compS.render(dt); L2.render(studio,cam); }
  else if(S.tab==='instrument'){ ao.enabled=true;
    asm.forEach(a=>{ const s=a.set, g=a.trg||[0,0]; a.vx=(a.vx||0)+((g[0]-s.rx)*(a.trg?220:150)-(a.vx||0)*(a.trg?24:7))*dt; a.vz=(a.vz||0)+((g[1]-s.rz)*(a.trg?220:150)-(a.vz||0)*(a.trg?24:7))*dt; s.rx+=a.vx*dt; s.rz+=a.vz*dt; a.apply(); a.oled.draw(a.nom,t,[-s.rz,s.rx]); });
    compS.render(dt); L2.render(studio,cam);
  } else if(space){
    const u=space.screenMat.uniforms; u.uT.value=t;
    space.inst.forEach((a,i)=>{ // les joueurs bougent doucement leur instrument
      const q=S.public?1:0; a.set.rx=q*.035*Math.sin(t*(.7+i*.13)+i*2); a.set.rz=q*.045*Math.sin(t*(.5+i*.17)+i*4); a.apply(); a.oled.draw(a.nom,t,[-a.set.rz,a.set.rx]); u.uE.value.setComponent(i,.35+.4*Math.abs(Math.sin(t*(.5+i*.17)+i*4))); space.glow[i].intensity=2.3*(space.lumGlow??1)*(.85+.25*Math.sin(t*(.6+i*.3)+i)); });
    bloom.strength=.2*(1-S.lum/100); aoR.enabled=!space.sc.beams.visible&&S.vue!=='coupe'; space.ei.plaf.visible=cam.position.y<space.info.RH; space.ei.vue(cam.position);
    comp.render(dt); L2.render(room,cam);
  }
}
R.setAnimationLoop(step);

// ---------------------------------------------------------------- onglets
function tab(t,ms=0){
  S.tab=t; fit(); document.body.dataset.tab=t; document.querySelectorAll('nav button').forEach(b=>{ const on=b.dataset.tab===t; b.setAttribute('aria-selected',on); if(on){ const n=b.parentNode; n.scrollLeft=b.offsetLeft-n.offsetLeft-(n.clientWidth-b.offsetWidth)/2; } });
  ['fab','cotes','signal','choix'].forEach(k=>$('#p-'+k).hidden=k!==t); const d3=T3.includes(t); $('#panel').hidden=!d3;
  $('#labels').innerHTML=''; $('#labels').appendChild(L2.domElement); L2.domElement.innerHTML='';
  if(t==='espace'){ if(dirtyRoom||!space||space.sc.sys!==S.sys) buildRoom(); dirtyRoom=false; panel(); viewRoom(ms); $('#hint').textContent='Glisser pour tourner, molette pour s’approcher'; }
  if(t==='ecran'){ buildEcran(); panel(); viewEcran(ms); $('#hint').textContent='Glisser pour tourner, molette pour s’approcher'; }
  if(t==='transport'){ buildTrp(); panel(); viewTrp(ms); $('#hint').textContent='Glisser pour tourner, molette pour s’approcher'; }
  if(t==='fab') drawFab(S);
  if(t==='instrument'){ buildStudio(); panel(); viewStudio(ms); $('#hint').textContent='Glisser le fond pour tourner, glisser l’instrument pour l’incliner'; }
  if(t==='cotes'){ drawPlan($('#plan'),S); drawCoupe($('#coupe'),S); drawElev($('#elev'),S); drawTable($('#tbl'),S); } if(t==='signal') drawSignal($('#sig'),S); if(t==='choix') drawChoix($('#choix'),S);
  size(); writeHash();
}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$('#fold').onclick=()=>{ const o=$('#panel').classList.toggle('off'); $('#fold').setAttribute('aria-expanded',!o); size(); };
if(innerWidth<=820){ $('#panel').classList.add('off'); $('#fold').setAttribute('aria-expanded',false); }
size(); tab(S.tab); $('#load').classList.add('ok');
window.IMP={S,buildEcran,viewEcran,get scr(){return scr},tab,panel,goto,cam,ctl,R,step,viewRoom,viewStudio,buildStudio,buildRoom,applyRoom,V,get asm(){return asm},get space(){return space},get trp(){return trp},viewTrp,HP,SYS,optics};
