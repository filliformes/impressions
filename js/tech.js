// Place le sub et le plateau technique sous le dessus, hors du faisceau. Repère du calcul : x dans l'axe optique (z du monde), y en travers (x du monde).
export const SUB = { nom:'Sub actif 8 po', w:.28, d:.28, h:.302, kg:8.3, src:'https://www.kantoaudio.com/product/sub8/' };
export const TRAY = { nom:'Plateau technique', w:.36, d:.24, h:.11, kg:3.2 };
export const SOL_TECH = .006;

const seg=(a,b,B)=>{ let t0=0,t1=1; for(let i=0;i<3;i++){ const d=b[i]-a[i]; if(Math.abs(d)<1e-9){ if(a[i]<B[0][i]||a[i]>B[1][i]) return false; continue; } let u=(B[0][i]-a[i])/d, v=(B[1][i]-a[i])/d; if(u>v)[u,v]=[v,u]; t0=Math.max(t0,u); t1=Math.min(t1,v); if(t0>t1) return false; } return true; };
const box=(x,y,w,d,z0,z1,m=0)=>[[x-w/2-m,y-d/2-m,z0-m],[x+w/2+m,y+d/2+m,z1+m]], over=(A,B)=>A[0].every((v,i)=>v<B[1][i]&&B[0][i]<A[1][i]);
// hexagone des traverses basses, sommets dans l'axe
export const apoth=O=>(O.Rf-.012)*Math.cos(Math.PI/6)-.02;
const inHex=(B,ap)=>[[0,0],[0,1],[1,0],[1,1]].every(([i,j])=>{ const x=B[i][0], y=B[j][1]; for(let k=0;k<6;k++){ const a=(k+.5)*Math.PI/3; if(x*Math.cos(a)+y*Math.sin(a)>ap) return false; } return true; });
// obstacles de la table : rayons, projecteur et ses pattes, miroir, banc
export function obstacles(O,banc){
  const rays=[], boxes=[], F=O.f, P=O.P, R=O.R; if(O.sys!=='dessous'||!F) return { rays,boxes };
  for(let i=0;i<=26;i++) for(let j=0;j<=26;j++){ const X=-R+2*R*i/26, Y=-R+2*R*j/26; if(X*X+Y*Y>R*R*1.01) continue; const m=F.M(X), M=[m[0],m[2]*Y,m[1]]; rays.push([[F.L[0],0,F.L[1]],M],[M,[X,Y,O.H]]); }
  for(let i=0;i<72;i++){ const a=i/72*2*Math.PI, X=Math.cos(a)*R, Y=Math.sin(a)*R, m=F.M(X), M=[m[0],m[2]*Y,m[1]]; rays.push([[F.L[0],0,F.L[1]],M],[M,[X,Y,O.H]]); }
  boxes.push([[F.x0-.02,-(P.w-P.wl)-.02,.02],[F.x1+.02,P.wl+.02,F.z1+.02]]);
  const ends=[-1,1].map(q=>{ const p=F.disc.pt(0,(O.rond?F.disc.t0:0)+q*O.mr); return [p[0],p[2]]; }), lo=ends[0][1]<ends[1][1]?ends[0]:ends[1], hi=lo===ends[0]?ends[1]:ends[0], N=10; for(let i=0;i<N;i++){ const a=i/N,b=(i+1)/N, p=[lo[0]+(hi[0]-lo[0])*a,lo[1]+(hi[1]-lo[1])*a], q=[lo[0]+(hi[0]-lo[0])*b,lo[1]+(hi[1]-lo[1])*b]; boxes.push([[Math.min(p[0],q[0])-.03,-O.mr-.01,Math.min(p[1],q[1])-.03],[Math.max(p[0],q[0])+.03,O.mr+.01,Math.max(p[1],q[1])+.03]]); }
  if(banc) boxes.push([[banc.x0-.01,-banc.w/2-.01,0],[banc.x1+.01,banc.w/2+.01,.05]]);
  return { rays,boxes };
}
export function placeTech(O,{ sub,tray },banc){
  const out={}, ob=obstacles(O,banc), ap=O.vinyle?0:apoth(O), taken=[];
  const find=T=>{ if(O.vinyle||T.h+.012>O.H-.045) return null; let best=null;
    for(const r of [0,1]) for(let x=-ap;x<=ap;x+=.02) for(let y=-ap;y<=ap;y+=.02){ const w=r?T.d:T.w, d=r?T.w:T.d, B=box(x,y,w,d,SOL_TECH,SOL_TECH+T.h,.012); if(!inHex(B,ap)) continue; if(taken.some(q=>over(B,q))||ob.boxes.some(q=>over(B,q))) continue; if(ob.rays.some(([a,b])=>seg(a,b,B))) continue;
      const c=O.f?Math.hypot(x-(O.f.x0+O.f.x1)/2,y):Math.hypot(x+ap*.4,y-(T===SUB?.2:-.2)); if(!best||c<best.c-1e-6) best={ c,x,y,w,d,h:T.h }; }
    if(best) taken.push(box(best.x,best.y,best.w,best.d,0,SOL_TECH+T.h,.012)); return best; };
  // à côté : au bord du dessus, entre deux instruments (direction -x du calcul, côté technique)
  const side=(T,k)=>({ x:-(O.Rb+.1+T.w/2),y:k,w:T.w,d:T.d,h:T.h,cote:true });
  if(sub) out.sub=find(SUB)||side(SUB,O.sys==='sol'?.22:.62); if(tray) out.tray=find(TRAY)||side(TRAY,O.sys==='sol'?-.24:-.62);
  return out;
}
