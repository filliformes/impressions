// Calculs d'optique des trois systèmes d'écran. Un seul projecteur dans tous les cas.
import { FT } from './data.js';
import { PROJ as PC, PLAFOND, hautOptics } from './proj.js';
export { PLAFOND, PC };

export const SYS = {
  dessous:{ nom:'Par-dessous', titre:'Table rétroprojetée', court:'Anneau démontable, toile tendue, six pieds rentrants. Un projecteur et un miroir sur un banc pliant, sous la toile.' },
  mat:{ nom:'Par-dessus, mât', titre:'Plateforme et mât', court:'Plateforme basse en six segments et un seul mât au bord. Le décentrement du projecteur évite tout portique au-dessus du disque.' },
  portique:{ nom:'Par-dessus, portique', titre:'Plateforme et portique', court:'Plateforme basse et trois pieds entre les instruments. Le projecteur est au centre, dans un caisson.' }
};
// Par-dessous. s : axe de l'objectif au centre de l'image, en fraction de la hauteur. up/dn : boîtier de chaque côté de l'axe (m).
// wl : axe au flanc gauche, w : largeur. phi : inclinaisons de miroir permises (degrés).
export const PA = {
  ls560:{ court:'ViewSonic LS560WH', nom:'ViewSonic LS560WH', aspect:1.6, px:800, lm:2000, tr:.4884, s:[.6], dep:.221, lens:.015, up:.052, dn:.063, w:.293, wl:.09, kg:2.85, phi:[0,62], dB:'non trouvé', prix:'≈ 900 à 1 000 $ CA', W:229,
    desc:'LED, 2 000 lm, 1280 × 800. La page du produit le dit installable à n’importe quel angle. Trajet et décalage tirés du manuel.',
    src:['https://www.viewsonic.com/us/ls560wh.html','https://www.projectorcentral.com/ViewSonic-LS560WH.htm'] },
  gt2000:{ court:'Optoma GT2000HDR', nom:'Optoma GT2000HDR', aspect:16/9, px:1080, lm:3500, tr:.496, s:[.66], dep:.216, lens:.01, up:.04, dn:.075, w:.274, wl:.09, kg:3, phi:[0,62], dB:'27 à 34 dB', prix:'≈ 1 550 à 1 750 $ CA', W:139,
    desc:'Laser, 3 500 lm, 1920 × 1080, 360°. Plus clair et plus fin, mais au-dessus de 1 000 $. Place de l’objectif estimée.',
    src:['https://www.optomausa.com/product/gt2000hdr'] },
  ht2150:{ court:'BenQ HT2150ST', nom:'BenQ HT2150ST', aspect:16/9, px:1080, lm:2200, tr:.69, s:[.525,.55], dep:.277, lens:0, up:.04, dn:.085, w:.379, wl:.12, kg:3.6, phi:[45,45], dB:'27 à 29 dB', prix:'liste de prêt', W:353, pret:true,
    desc:'Lampe, 2 200 lm, 1920 × 1080. Gratuit, à plat et à l’envers, mais l’image plafonne vers 4 pi. Place de l’objectif estimée.',
    src:['https://www.projectorcentral.com/BenQ-HT2150ST.htm'] }
};
// Par-dessus, au bout d'un mât. off : décentrement possible (fraction de la hauteur d'image)
export const PB = {
  lk953:{ court:'BenQ LK953ST', nom:'BenQ LK953ST', aspect:16/9, px:2160, lm:5000, tr:[.81,.89], off:[0,.6], w:.49, dep:.38, h:.159, kg:9.1, dB:'38 à 40 dB', prix:'liste de prêt', W:450, pret:true,
    desc:'Laser, 5 000 lm, 4K, décentrement vertical de ± 60 %, installation 360°. Le plus clair de la liste de prêt.',
    src:['https://www.benq.com/en-us/business/projector/lk953st/specifications.html','https://www.projectorcentral.com/BenQ-LK953ST.htm'] },
  ht2150:{ court:'BenQ HT2150ST', nom:'BenQ HT2150ST', aspect:16/9, px:1080, lm:2200, tr:[.69,.83], off:[.525,.55], w:.379, dep:.277, h:.122, kg:3.6, dB:'27 à 29 dB', prix:'liste de prêt', W:353, pret:true,
    desc:'Lampe, 2 200 lm, 1920 × 1080, 3,6 kg. Le plus léger et le plus discret, pour une salle assombrie. À plat, à l’endroit.',
    src:['https://www.projectorcentral.com/BenQ-HT2150ST.htm'] },
  tk700:{ court:'BenQ TK700STi', nom:'BenQ TK700STi', aspect:16/9, px:2160, lm:3000, tr:[.9,1.08], off:[.6,.6], w:.312, dep:.246, h:.11, kg:3.1, dB:'29 à 35 dB', prix:'liste de prêt', W:310, pret:true,
    desc:'Lampe, 3 000 lm, 4K, 3,1 kg. Demande plus de hauteur : environ 5 pi d’image au plus à EISODE.',
    src:['https://www.benq.com/en-us/projector/gaming/tk700sti/spec.html','https://www.projectorcentral.com/BenQ-TK700STi.htm'] }
};
export const projOf = s => s.sys==='dessous'?PA[s.projA]:s.sys==='mat'?PB[s.projB]:PC[s.projC];

// ------------------------------------------------ par-dessous : plan (x,z), disque de -R à R à z = H, miroir incliné
const inP=(x,z,Q)=>{ let c=false; for(let i=0,n=Q.length;i<n;i++){ const [x1,z1]=Q[i],[x2,z2]=Q[(i+1)%n]; if((z1>z)!==(z2>z)&&x<(x2-x1)*(z-z1)/(z2-z1)+x1) c=!c; } return c; };
const ori=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
const hits=(A,B)=>{ for(let i=0;i<A.length;i++) for(let j=0;j<B.length;j++){ const a=A[i],b=A[(i+1)%A.length],c=B[j],d=B[(j+1)%B.length]; if(ori(a,b,c)*ori(a,b,d)<0&&ori(c,d,a)*ori(c,d,b)<0) return true; } return inP(...A[0],B)||inP(...B[0],A); };
export function solveA(P,R,H){
  const h=2*R*1.02, w=h*P.aspect, T=P.tr*w, wy=Math.max(P.wl,P.w-P.wl); let best=null;
  for(const sv of P.s) for(let ph=P.phi[0];ph<=P.phi[1]+.1;ph+=2.5) for(const sg of ph>0?[1,-1]:[1]){
    const pv=[sv*h,H-T], fa=ph*sg*Math.PI/180, n=[-Math.sin(fa),Math.cos(fa)], refl=v=>{ const d=v[0]*n[0]+v[1]*n[1]; return [v[0]-2*d*n[0],v[1]-2*d*n[1]]; }, ax=refl([0,1]), up=refl([-1,0]);
    for(let q=-.9;q<.9;q+=.02){
      const off=(pv[0]-q)*n[0]+(pv[1]-.03)*n[1]; if(off>=-.02) continue;
      const M=X=>{ const d=[X-pv[0],T], k=-off/(d[0]*n[0]+d[1]*n[1]); return [pv[0]+k*d[0],pv[1]+k*d[1],k]; }, m1=M(-R), m2=M(R);
      if(!(m1[2]>0&&m1[2]<.97&&m2[2]>0&&m2[2]<.97)||Math.min(m1[1],m2[1])<.04||Math.max(m1[1],m2[1])>H-.08) continue;
      const r=refl([pv[0]-q,pv[1]-.03]), L=[q+r[0],.03+r[1]], at=(d,e)=>[L[0]-ax[0]*d+up[0]*e,L[1]-ax[1]*d+up[1]*e], mk=d=>[at(d+P.lens,P.up),at(d+P.lens,-P.dn),at(P.lens+P.dep,-P.dn),at(P.lens+P.dep,P.up)], bd=mk(0), zs=bd.map(p=>p[1]);
      if(Math.min(...zs)<.05||Math.max(...zs)>H-.05) continue;
      const p2=m=>[m[0],m[1]], beam=[p2(m1),p2(m2),[R,H],[-R,H]], inc=[[L[0]+ax[0]*.004,L[1]+ax[1]*.004],p2(m1),p2(m2)];
      if(hits(bd,beam)||hits(mk(.006),inc)||bd.some(p=>inP(p[0]+.015,p[1],beam)||inP(p[0]-.015,p[1],beam))) continue;
      let Rb=Math.max(...bd.map(p=>Math.hypot(p[0],wy)),R)+.03, mw=0;
      for(let i=0;i<=30;i++){ const X=-R+2*R*i/30, m=M(X), y=m[2]*Math.sqrt(Math.max(R*R-X*X,0)); mw=Math.max(mw,y); Rb=Math.max(Rb,Math.hypot(m[0],y)+.045); }
      const tilt=Math.abs(2*ph*sg-90), sc=Rb+.0006*tilt; if(best&&sc>=best.sc-1e-4) continue;
      best={ sc,Rb,T,w,h,pv,L,ax,up,fa,ph:ph*sg,tilt:Math.atan2(ax[1],Math.abs(ax[0]))*180/Math.PI,m1,m2,M,body:bd,x0:Math.min(...bd.map(p=>p[0])),x1:Math.max(...bd.map(p=>p[0])),z0:Math.min(...zs),z1:Math.max(...zs),ml:Math.hypot(m2[0]-m1[0],m2[1]-m1[1])+.05,mw:2*mw+.05 };
    } }
  return best;
}
// ------------------------------------------------ par-dessus, mât
export const GAP = .28;      // objectif au centre du miroir
export function solveM(P,R,plate,pl=PLAFOND){
  const h=2*R*1.03, w=h*P.aspect, off=Math.max(P.off[0],Math.min(P.off[1],(R+.08)/h)), xa=off*h, T0=pl-.22+GAP-plate;
  const T=Math.min(Math.max(T0,P.tr[0]*w),P.tr[1]*w), yA=T-GAP+plate, top=yA+.17, ok=xa>=R+.035&&top<=pl-.04;
  const M=(X,Y)=>{ const k=GAP/(T+X+xa); return [-xa+k*(X+xa),k*Y,yA+GAP-k*T]; };       // miroir à 45°, x le long du rayon
  const a=M(-R,0), b=M(R,0); let mw=0; for(let i=0;i<=30;i++){ const X=-R+2*R*i/30; mw=Math.max(mw,M(X,Math.sqrt(Math.max(R*R-X*X,0)))[1]); }
  return { h,w,off,xa,T,yA,top,ok,M,a,b,ml:Math.hypot(b[0]-a[0],b[2]-a[2])+.06,mw:2*mw+.06,xm:-(xa+.17),zoom:T/w };
}
// ------------------------------------------------ point d'entrée
// jeu minimal entre le miroir, le projecteur et la jupe (la coupe rétrécit vers le sol)
function jeu(o,f,P){ const r=z=>o.Rf+(o.Rt-o.Rf)*z/o.H, wy=Math.max(P.wl,P.w-P.wl); let m=9; for(let i=0;i<72;i++){ const a=i/72*2*Math.PI, X=Math.sin(a)*o.R, Y=Math.cos(a)*o.R, q=f.M(X); m=Math.min(m,r(q[1])-Math.hypot(q[0],q[2]*Y)-.024); } f.body.forEach(b=>{ m=Math.min(m,r(b[1])-Math.hypot(b[0],wy)); }); return m; }
const CACHE=new Map();
export function optics(s){
  const k=[s.sys,s.projA,s.projB,s.projC,s.diam,s.ecranH,s.plateH,s.montage,s.plafond].join(); if(CACHE.has(k)) return CACHE.get(k);
  const R=s.diam*FT/2, P=projOf(s), o={ sys:s.sys,P,R };
  if(s.sys==='dessous'){ o.H=s.ecranH/1000; const f=o.f=solveA(P,R,o.H); o.Rt=R+.04; const C=()=>{ o.Rf=o.Rt-.13; return jeu(o,f,P); }; if(f){ const d=.012-C(); if(d>0) o.Rt+=d; o.jeu=C(); } else o.Rf=o.Rt-.13; o.Rb=o.Rt+.03;
    if(f){ o.px=f.h/P.px*1000; o.lux=P.lm*.9/(f.w*f.h); let t=0; for(let i=0;i<=60;i++){ const X=-R+2*R*i/60; t=Math.max(t,Math.hypot(X-f.pv[0],Math.sqrt(Math.max(R*R-X*X,0)))); } o.inc=Math.atan2(t,f.T)*180/Math.PI; o.ok=true; } }
  else if(s.sys==='mat'){ o.H=s.plateH/1000; const m=o.m=solveM(P,R,o.H,s.plafond/1000); o.Rb=R; o.px=m.h/P.px*1000; o.lux=P.lm*.95/(m.w*m.h); o.inc=Math.atan2(m.xa+R,m.T)*180/Math.PI; o.ok=m.ok; }
  else { o.H=s.plateH/1000; const h=o.p=hautOptics({...s,proj:s.projC}); o.Rb=R; o.px=h.pitch; o.lux=h.lux; o.inc=Math.atan2(R,h.d)*180/Math.PI; o.ok=h.fit; }
  CACHE.set(k,o); return o;
}
export function diamMax(s){
  if(s.sys==='dessous'){ let m=3; for(let d=3;d<=6.5;d+=.25){ const f=solveA(PA[s.projA],d*FT/2,s.ecranH/1000); if(f&&f.Rb-d*FT/2<.18) m=d; } return m; }
  if(s.sys==='mat'){ let m=4; for(let d=4;d<=8;d+=.25) if(solveM(PB[s.projB],d*FT/2,s.plateH/1000,s.plafond/1000).ok) m=d; return m; }
  { let m=4; for(let d=4;d<=8;d+=.25) if(hautOptics({...s,diam:d,proj:s.projC}).fit) m=d; return m; }
}
