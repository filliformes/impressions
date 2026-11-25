// Plan, élévations, schéma du signal, points à trancher.
import { FT, INSTR, DRIVER } from './data.js';
import { STANDS, buildStand } from './stands.js';
import { PAD_OFF } from './assembly.js';
import { optics, diamMax, SYS, PA, PB, PC } from './optics.js';
import { centre } from './space.js';
import { EIS } from './eisode.js';

const fr=(v,d=0)=>v.toLocaleString('fr-CA',{minimumFractionDigits:d,maximumFractionDigits:d});
const INK='#191c34', BLUE='#333a7c', RED='#c4232c', GREY='#8a8c98', LINE='#c9c9c4';

export function drawPlan(box,S){
  const O=optics(S), R=O.R, Rb=O.Rb, Rr=Rb+S.ecart/1000+.16, [cx,cy]=centre(S), k=100, E=EIS, o=[], X=x=>x*k, Y=y=>y*k, dX=x=>(cx+x)*k, dY=z=>(cy+z)*k;
  o.push(`<rect x="0" y="0" width="${E.W*k}" height="${E.D*k}" fill="#fff"/>`); for(let i=1;i<9;i++) o.push(`<path d="M${i*k} 0V${E.D*k}M0 ${i*k}H${E.W*k}" stroke="${LINE}" stroke-width=".6"/>`); o.push(`<path d="M0 900H${E.W*k}" stroke="${LINE}" stroke-width=".6"/>`);
  o.push(`<path d="M${4.04*k} ${E.D*k}H0V0H${E.W*k}V${7.44*k}" fill="none" stroke="${INK}" stroke-width="7"/>`); E.murs.forEach(m=>o.push(`<rect x="${X(m[0])}" y="${Y(m[1])}" width="${(m[2]-m[0])*k}" height="${(m[3]-m[1])*k}" fill="${INK}"/>`));
  const win=(x0,y0,x1,y1)=>o.push(`<path d="M${X(x0)} ${Y(y0)}L${X(x1)} ${Y(y1)}" stroke="#7fb2e0" stroke-width="7"/>`); E.haut.forEach(([a,b])=>win(a,0,b,0)); E.gauche.forEach(([a,b])=>win(0,a,0,b)); E.bas.forEach(([a,b])=>win(a,E.D,b,E.D));
  E.rails.forEach((y,i)=>{ const on=S.sys==='mat'&&S.accroche==='rail'&&i===1; o.push(`<rect x="${X(E.rx[0])}" y="${Y(y)}" width="${(E.rx[1]-E.rx[0])*k}" height="4" fill="${on?RED:'#63c7dc'}"/><text x="${X(E.rx[1])+8}" y="${Y(y)+8}" font-size="15" style="fill:${on?RED:GREY}">rail ${i+1}</text>`); });
  E.prises.forEach(([x,y,n])=>o.push(`<circle cx="${X(x)}" cy="${Y(y)}" r="10" fill="#fff" stroke="${BLUE}" stroke-width="1.5"/><text x="${X(x)}" y="${Y(y)+5}" text-anchor="middle" font-size="13" style="fill:${BLUE}">${n}</text>`)); E.cat6.forEach(([x,y,n])=>o.push(`<path d="M${X(x)-11} ${Y(y)+8}L${X(x)+11} ${Y(y)+8}L${X(x)} ${Y(y)-11}z" fill="#fff" stroke="${RED}" stroke-width="1.5"/><text x="${X(x)+14}" y="${Y(y)+8}" font-size="13" style="fill:${RED}">${n}</text>`));
  o.push(`<path d="M${dX(0)} ${dY(0)}L${X(E.regie[0])} ${Y(E.regie[1])}" stroke="${RED}" stroke-width="3"/><circle cx="${dX(0)}" cy="${dY(0)}" r="${Rr*k}" fill="none" stroke="${GREY}" stroke-dasharray="6 6"/><circle cx="${dX(0)}" cy="${dY(0)}" r="${(Rr+.75)*k}" fill="none" stroke="${LINE}" stroke-dasharray="3 6"/>`);
  o.push(`<circle cx="${dX(0)}" cy="${dY(0)}" r="${Rb*k}" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${dX(0)}" cy="${dY(0)}" r="${R*k}" fill="${BLUE}" fill-opacity=".14" stroke="${BLUE}" stroke-width="3"/>`);
  const rc=(x0,x1,w,c)=>o.push(`<rect x="${dX(-w/2)}" y="${dY(Math.min(x0,x1))}" width="${w*k}" height="${Math.abs(x1-x0)*k}" fill="none" stroke="${c}" stroke-dasharray="5 4" stroke-width="1.6"/>`);
  if(S.sys==='dessous'&&O.f){ rc(O.f.x0,O.f.x1,O.P.w,INK); rc(O.f.m1[0],O.f.m2[0],O.f.mw,RED); }
  if(S.sys==='mat'){ const m=O.m; rc(m.xm-.05,-m.xa+.28+O.P.dep+.07,O.P.w+.07,INK); if(S.accroche!=='rail') o.push(`<rect x="${dX(-.3)}" y="${dY(-R-.612)}" width="60" height="60" fill="none" stroke="${INK}"/><circle cx="${dX(0)}" cy="${dY(m.xm)}" r="4" fill="${INK}"/>`); }
  if(S.sys==='portique') for(let i=0;i<3;i++){ const a=Math.PI/3+i*Math.PI*2/3, x=Math.sin(a)*O.p.Rp, z=Math.cos(a)*O.p.Rp; o.push(`<path d="M${dX(0)} ${dY(0)}L${dX(x)} ${dY(z)}" stroke="${INK}" stroke-width="8" stroke-opacity=".22"/><rect x="${dX(x)-17}" y="${dY(z)-17}" width="34" height="34" fill="#fff" stroke="${INK}"/>`); }
  Object.keys(INSTR).forEach((n,i)=>{ const a=i*Math.PI*2/3, s=Math.sin(a), c=Math.cos(a), deg=-a*180/Math.PI;
    o.push(`<path d="M${dX(s*Rb)} ${dY(c*Rb)}L${dX(s*(Rr-.15))} ${dY(c*(Rr-.15))}" stroke="${RED}" stroke-width="2"/><g transform="translate(${dX(s*Rr)} ${dY(c*Rr)}) rotate(${deg})"><rect x="-23" y="-23" width="46" height="46" fill="#fff" stroke="${INK}" stroke-width="1.5"/><rect x="-13.3" y="-9" width="26.6" height="18" fill="${BLUE}"/><path d="M16 -11l16 -8v38l-16 -8zM-16 -11l-16 -8v38l16 -8z" fill="${INK}"/><path d="M38 0h40m-9 -6l9 6l-9 6M-38 0h-40m9 -6l-9 6l9 6" fill="none" stroke="${GREY}" stroke-width="1.6"/><circle cx="0" cy="45" r="20" fill="none" stroke="${GREY}" stroke-width="2"/></g><text x="${dX(s*(Rr+1.22))}" y="${dY(c*(Rr+1.02))+7}" text-anchor="middle" font-size="22" font-weight="700">${n}</text>`); });
  const ra=Math.atan2(cx-E.regie[0],cy-E.regie[1]); o.push(`<g transform="translate(${X(E.regie[0])} ${Y(E.regie[1])}) rotate(${-ra*180/Math.PI})"><rect x="-60" y="-30" width="120" height="60" fill="#fff" stroke="${INK}" stroke-width="2"/></g><text x="${X(E.regie[0])}" y="${Y(E.regie[1])+6}" text-anchor="middle" font-size="18" font-weight="600">Régie</text>`);
  o.push(`<text x="${X(.95)}" y="${Y(3.98)}" text-anchor="middle" font-size="16" style="fill:#fff0"></text><text x="${X(2.0)}" y="${Y(7.6)}" text-anchor="middle" font-size="20" style="fill:${GREY}">Accueil</text><text x="${X(5.5)}" y="${Y(8.5)}" text-anchor="middle" font-size="18" style="fill:${GREY}">WC</text><text x="${X(-.25)}" y="${Y(1.55)}" text-anchor="middle" font-size="16" transform="rotate(-90 ${X(-.25)} ${Y(1.55)})" style="fill:${GREY}">porte de la terrasse</text>`);
  o.push(`<text x="${E.W*50}" y="${E.D*k+42}" text-anchor="middle" font-size="19">EISODE : 8,06 × 9,27 m, plafond ${fr(S.plafond/1000,2)} m, quadrillage de 1 m. ${SYS[S.sys].titre}, ${O.P.court}.</text><text x="${E.W*50}" y="${E.D*k+70}" text-anchor="middle" font-size="19">Image Ø ${fr(2*R,2)} m. Instruments à ${fr(2*Rr*Math.sin(Math.PI/3),2)} m l’un de l’autre. Mur de droite à ${fr(E.W-cx-(Rr+.75),2)} m du dos des joueur·euse·s.</text>`);
  box.innerHTML=`<svg viewBox="-50 -20 ${E.W*k+120} ${E.D*k+110}" style="max-width:860px;margin:auto" role="img" aria-label="Plan de la galerie EISODE">${o.join('')}</svg>`;
}

export function drawElev(box,S){
  const Hs=S.padH-PAD_OFF*1000, o=[], k=.5, gy=640; let x=60;
  const base=(cx,w)=>{ const y=gy-(Hs+80)*k; return `<rect x="${cx-w*k/2}" y="${y}" width="${w*k}" height="${80*k}" fill="${BLUE}"/>`; };
  const ci=(cx,front)=>{ const y=gy-(Hs+80)*k; if(front) return `<path d="M${cx-133.2*k} ${y}v${-83.2*k}h${201.5*k}v${24.4*k}h${64.9*k}v${58.8*k}z" fill="#fff" stroke="${INK}" stroke-width="1.4"/><path d="M${cx-133.2*k} ${y-73.2*k}h${201.5*k}" stroke="${LINE}"/>`;
    return `<path d="M${cx-89.4*k} ${y}v${-83.2*k}h${59.7*k}l${10*k} ${10*k}h${109.2*k}v${73.2*k}z" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`; };
  const prof={
    A:f=>{ const W=f?320:300, T=f?270.4:182.9; return [[-T/2,Hs],[-W/2,Hs-62],[-W/2,30],[W/2,30],[W/2,Hs-62],[T/2,Hs]]; },
    B:f=>{ const ys=Hs*.545, W=f?335:330, T=f?270.4:182.9, B=f?200:190; return [[-T/2,Hs],[-W/2,ys+150],[-W/2,ys-150],[-B/2,12],[B/2,12],[W/2,ys-150],[W/2,ys+150],[T/2,Hs]]; } };
  for(const K of ['A','B']){ const ys={A:Hs-265,B:Hs*.545,C:Hs*.5}[K], enc={A:460,B:470,C:420}[K];
    const cx1=x+enc*k/2, cx2=cx1+enc*k/2+60+(K==='C'?400:enc)*k/2;
    const poly=(cx,p,fill='#fff')=>`<path d="M${p.map(q=>`${cx+q[0]*k} ${gy-q[1]*k}`).join('L')}z" fill="${fill}" stroke="${INK}" stroke-width="1.4"/>`;
    o.push(`<rect x="${cx1-enc*k/2}" y="${gy-5}" width="${enc*k}" height="5" fill="${INK}"/>`,poly(cx1,prof[K](1)),K==='C'?`<rect x="${cx1-144*k}" y="${gy-(ys+165)*k}" width="${288*k}" height="${330*k}" fill="${BLUE}" fill-opacity=".85"/>`:'');
    [1,-1].forEach(s=>{ const e={A:160,B:167.5,C:150}[K]; const a=cx1+s*e*k, y=gy-ys*k; o.push(`<path d="M${a} ${y-130*k}L${a-s*22*k} ${y-120*k}L${a-s*75*k} ${y-74*k}V${y-70*k}H${a-s*118*k}V${y+70*k}H${a-s*75*k}V${y+74*k}L${a-s*22*k} ${y+120*k}L${a} ${y+130*k}z" fill="none" stroke="${RED}" stroke-width="1.2" stroke-dasharray="4 3"/>`); });
    o.push(base(cx1,266.4),ci(cx1,1));
    const e2=(K==='C'?400:enc); o.push(`<rect x="${cx2-e2*k/2}" y="${gy-5}" width="${e2*k}" height="5" fill="${INK}"/>`,poly(cx2,prof[K](0)),`<circle cx="${cx2}" cy="${gy-ys*k}" r="${130.5*k}" fill="none" stroke="${RED}" stroke-width="1.4"/><circle cx="${cx2}" cy="${gy-ys*k}" r="${97*k}" fill="none" stroke="${RED}" stroke-width="1"/>`,base(cx2,178.9),ci(cx2,0));
    const dx=x-22; o.push(`<path d="M${dx} ${gy}V${gy-S.padH*k}M${dx-6} ${gy}h12M${dx-6} ${gy-S.padH*k}h12" stroke="${RED}" stroke-width="1.2"/><text transform="translate(${dx-8} ${gy-S.padH*k/2}) rotate(-90)" text-anchor="middle" font-size="21">${fr(S.padH)}</text>`);
    o.push(`<text x="${cx1}" y="${gy+28}" text-anchor="middle" font-size="21">${enc}</text><text x="${cx2}" y="${gy+28}" text-anchor="middle" font-size="21">${e2}</text><text x="${(cx1+cx2)/2}" y="${gy+72}" text-anchor="middle" font-size="26" font-weight="700">${K}  ${STANDS[K].nom}</text>`);
    x=cx2+e2*k/2+80; }
  box.innerHTML=`<svg viewBox="0 90 ${x-30} ${gy+4}" style="min-width:640px" role="img" aria-label="Élévations des deux stands">${o.join('')}</svg>`;
}
export function drawTable(t,S){
  const Hs=S.padH/1000-PAD_OFF, rows=['A','B'].map(k=>{ const i=buildStand(k,Hs).info; i.kg+=3.2+4.3; i.b=i.kg*9.81*i.appui/(S.padH/1000); return [k,i]; });
  t.innerHTML='<tr><th>Stand</th><th>Emprise au sol</th><th>Corps</th><th>Volume par HP</th><th>Masse</th><th>Basculement</th><th>Pied</th></tr>'+rows.map(([k,i])=>`<tr><td><strong>${k} ${STANDS[k].nom}</strong></td><td>${i.encombrement.join(' × ')}</td><td>${i.corps.join(' × ')}</td><td>≈ ${fr(i.vol/2)} L</td><td>≈ ${fr(i.kg)} kg</td><td>≈ ${fr(i.b)} N</td><td>${i.plaque}</td></tr>`).join('');
}

export function drawSignal(box,S={}){
  const hp=S.sys!=='dessous';
  const bx=(x,y,w,h,t,s,f='#fff',c=INK)=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="${c}" stroke-width="1.6"/><text x="${x+w/2}" y="${y+(s?h/2-3:h/2+6)}" text-anchor="middle" font-size="17" font-weight="600" style="fill:${f==='#fff'?INK:'#fff'}">${t}</text>${s?`<text x="${x+w/2}" y="${y+h/2+17}" text-anchor="middle" font-size="13.5" style="fill:${f==='#fff'?'#5b5e70':'#dfe1f3'}">${s}</text>`:''}</g>`;
  const ar=(d,c,t,tx,ty)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" marker-end="url(#m${c.slice(1)})"/>${t?`<text x="${tx}" y="${ty}" font-size="13.5" text-anchor="middle">${t}</text>`:''}`;
  const mk=c=>`<marker id="m${c.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`;
  const A='#191c34', N='#333a7c', I='#c4232c';
  const o=[`<defs>${[A,N,I].map(mk).join('')}</defs>`,
   `<rect x="16" y="40" width="640" height="410" fill="none" stroke="${LINE}" stroke-width="2" stroke-dasharray="7 5"/><text x="30" y="66" font-size="15" font-weight="600">Un instrument (× 3 : RES, PHASMA, ESSAIM)</text>`,
   bx(36,96,180,66,'Micro','dynamique, type SM58'),bx(36,206,180,66,'PCB FLOU','pads, potentiomètres, écran'),bx(36,316,180,66,'Base molle','incline l’instrument'),
   bx(338,116,122,236,'Pandore','DSP, IMU, réseau',N,N),
   bx(526,96,112,66,'Ampli','2 canaux'),bx(526,200,112,58,'HP gauche','10 po'),bx(526,366,112,58,'HP droit','10 po'),
   ar('M216 129H276V150H336',A,'XLR',250,120),ar('M216 239H336',N,'USB ou Ethernet',276,230),ar('M216 349H276V320H336',N,'mouvement',252,366),
   ar('M460 150H492V129H524',A,'TRS',492,119),ar('M582 162V198',A),ar('M540 162V180H512V395H524',A),
   bx(740,110,170,66,'Deux autres','instruments'),bx(740,272,170,74,'Commutateur',hp?'au pied de l’écran':'sur le banc optique'),
   ar('M460 309H738',N,'OSC, dataFLOU',588,300),ar('M825 176V270',N,'Ethernet',858,226),
   bx(1010,264,170,90,'Régie','Palinopsia',N,N),ar('M910 309H1008',N,'Ethernet',959,300),
   bx(740,404,170,70,'Projecteur',S.sys==='mat'?(S.accroche==='rail'?'au plafond':'au bout du mât'):hp?'dans le portique':'sous la toile'),ar('M1095 354V439H912',I,'SDI ou HDBaseT',1003,430),
   bx(1010,110,170,66,hp?'Plateforme':'Toile',hp?'blanc mat':'rétroprojection'),ar('M825 474V504H1214V143H1182',I,'Lumière',1010,496),
   `<g font-size="14"><path d="M40 486h34" stroke="${A}" stroke-width="3"/><text x="82" y="491">Audio</text><path d="M160 486h34" stroke="${N}" stroke-width="3"/><text x="202" y="491">Données</text><path d="M300 486h34" stroke="${I}" stroke-width="3"/><text x="342" y="491">Image</text></g>`];
  box.innerHTML=`<svg viewBox="0 22 1230 500" style="min-width:900px" role="img" aria-label="Schéma du signal">${o.join('')}</svg>`;
}

export function drawChoix(box,S){
  const d0={ projA:'ls560',projB:'lk953',projC:'lk953',montage:'miroir',ecranH:950,plateH:100,plafond:2570 }, A=optics({...d0,sys:'dessous',diam:5.5}), B=optics({...d0,sys:'mat',diam:5.5}), A5=optics({...d0,sys:'dessous',diam:5}), lx=v=>fr(Math.round(v/10)*10), cm=v=>fr(v*100);
  const line=(nom,sys,key,L)=>Object.entries(L).map(([k,P])=>{ const s={...d0,...S,sys,[key]:k}, m=diamMax(s), o=optics({...s,diam:Math.min(S.diam,m)}), dd=Math.min(S.diam,m); return `<tr><td>${nom}</td><td><strong>${P.nom}</strong></td><td>${fr(m,2)} pi</td><td>${lx(o.lux)} lx à ${fr(dd,2)} pi</td><td>${fr(o.px,1)} mm</td><td>${fr(P.kg,1)} kg</td><td>${P.dB} ${/dB|non/.test(P.dB)?'':'dB'}</td><td>${/liste/.test(P.prix)?'<span class="ok">prêt, gratuit</span>':P.prix+(/\$/.test(P.prix)?'':' $ US')}</td></tr>`; }).join('');
  const src=[...Object.values(PA),...Object.values(PB),...Object.values(PC)].reduce((m,P)=>{ m[P.nom]=P.src; return m; },{});
  const Q=[
   ['Par-dessous ou par-dessus',[`Par-dessous, avec un seul projecteur : le ViewSonic LS560WH et un miroir donnent ${fr(5.5,1)} pi dans un anneau de ${fr(A.Rt*2+.04,2)} m, toile à 95 cm. C’est la version la plus pure, mais la toile ne reçoit que ${lx(A.lux)} lx.`,
     `Par-dessus : le BenQ LK953ST de la liste de prêt, au plafond ou au bout d’un mât, donne la même taille avec ${lx(B.lux)} lx, en 4K, gratuitement. Son miroir ne fait que ${cm(B.m.ml)} × ${cm(B.m.mw)} cm.`,
     `Recommandation : fabriquer d’abord l’accroche par le haut, qui marche avec du matériel déjà accessible, et essayer la toile par-dessous avec un projecteur emprunté avant d’acheter.`]],
   ['Occulter EISODE',[`Les fenêtres et la porte vitrée de la terrasse laissent entrer le soleil, et l’exposition est au début de juin. À quelques centaines de lux d’image, il faut des rideaux ou des panneaux opaques sur toutes les ouvertures, quel que soit le système.`]],
   ['Le plafond à 2,57 m',[`Le plafond d’EISODE est à 8 pi 5 po. Par le haut, l’image plafonne à ${fr(diamMax({...d0,sys:'mat'}),2)} pi avec le LK953ST et à ${fr(diamMax({...d0,sys:'mat',projB:'ht2150'}),2)} pi avec le HT2150ST, sur une plateforme de 100 mm. Au sol, sur un vinyle, on gagne un quart de pied.`,
     `Les cinq rails 80/20 du plafond évitent le mât à EISODE. Le caisson est le même dans les deux cas : le mât sert dans les autres lieux. La charge permise par rail est à demander à Artificiel.`]],
   ['Incliner le ViewSonic',[`La page du produit dit « à n’importe quel angle », mais le manuel contient une consigne générale de 15° au plus. Ici le projecteur est incliné de ${fr(Math.abs(A.f.tilt))}°. À faire confirmer par écrit. Sinon, l’Optoma GT2000HDR, vendu comme 360°, prend la même place.`]],
   ['Le cercle dans la galerie',[`Entre la penderie et le mur de droite, il y a 6,23 m. Avec une image de ${fr(S.diam,2)} pi, les joueur·euse·s forment un cercle d’environ 4,6 m : le public circule, mais à une seule personne de front du côté droit. Le plan de l’onglet Plan et cotes suit la position choisie.`]],
   ['La toile ou la plateforme',[`Par-dessous, l’incidence va jusqu’à ${fr(A.inc)}° : un creux de 5 mm déplace l’image d’environ ${fr(5*Math.tan(A.inc*Math.PI/180))} mm, donc la tension compte. Par-dessus, une surface peinte en blanc mat suffit ; elle supporte qu’on marche dessus si elle est renforcée.`]],
   ['Des 10 po dans un instrument de 179 mm',[`Un coaxial de 10 po fait ${DRIVER.d} mm de diamètre et ${DRIVER.depth} mm de profondeur de montage. Dos à dos, il faut au moins 290 mm de large et 290 mm de profond : le stand est forcément plus profond que le case (179 mm). Le Monolithe règle l’écart par un épaulement, le Losange par ses facettes.`]],
   ['Large bande ou grave',[`Un haut-parleur de 10 po seul ne monte pas dans l’aigu. La maquette suppose des coaxiaux (10 po et moteur d’aigu au centre). Une autre voie, à la Barefoot : 10 po latéraux pour le grave et un petit large bande vers le joueur.`]],
   ['Vibrations et IMU',[`Les deux haut-parleurs sont sous la base molle : leurs vibrations peuvent entrer dans l’IMU. Le montage dos à dos annule les forces seulement si les deux membranes jouent la même chose. D’où des graves sommés en mono, et un filtre passe-bas sur l’IMU.`]],
   ['Larsen',[`Le micro est à moins d’un mètre des haut-parleurs. Les faire tirer à gauche et à droite aide. Il faudra quand même un seuil et un filtre coupe-bande dans Pandore, ou en faire une matière.`]],
   ['Basculement',[`Le public va pousser l’instrument vers 1 m de haut. Sans lest, les stands basculent entre 100 et 140 N environ. Viser 200 N : lest dans le pied, plaque plus large ou fixation au sol.`]],
   ['La base molle',[`Le moule bleu n’est pas dans les fichiers reçus (3MF et STEP). Sa hauteur (80 mm) vient des rendus, sa gorge vient de la jupe du case. À recevoir : le fichier du moule, la dureté du silicone, la position et le diamètre des aimants.`,`Le cylindre Ø 44,8 × 13,9 mm sous le case n’est pas centré (126,9 ; 97,9). La maquette lui fait un logement dans l’îlot. À confirmer.`]],
   ['Le PCB FLOU',[`Le fichier KiCad contient les composants, mais pas encore de contour, de placement ni de pistes. La carte visible en vue éclatée est une supposition (185 × 162 mm, sous le capot).`,`Le contour devra passer sous le capot de 201,5 mm et laisser la place au ventilateur du Pandore.`]],
   ['Hauteur de jeu',[`980 mm convient debout. En fauteuil, il faut plutôt viser 860 mm au plus, et les deux stands retenus n’offrent pas de dégagement pour les genoux : à prévoir par l’approche de côté. Le curseur de hauteur va de 820 à 1 120 mm.`]],
   ['Câbles',[`Tout sort par l’arrière du case, donc du côté du cercle. La base molle bouge : il faut une boucle de mou et une bride sur le stand, pas sur l’instrument.`]]
  ];
  box.innerHTML=Q.map(([t,p])=>`<article class="q"><h3>${t}</h3><div>${p.map(x=>`<p>${x}</p>`).join('')}</div></article>`).join('')+`<h2>Un seul projecteur : les modèles comparés</h2><p class="lede">Image maximale avec les hauteurs réglées, et lumière à ${fr(S.diam,2)} pi ou au maximum du modèle.</p><div class="scroll"><table class="pj"><tr><th>Système</th><th>Modèle</th><th>Image max.</th><th>Lumière</th><th>Pixel</th><th>Masse</th><th>Bruit</th><th>Prix</th></tr>${line('Par-dessous','dessous','projA',PA)}${line('Mât ou rail','mat','projB',PB)}${line('Portique','portique','projC',PC)}</table></div><p class="note">Chiffres tirés des pages et manuels cités, à confirmer avant achat. Les modèles du portique hors liste de prêt viennent de l’étude du 25 novembre 2026.</p><ul class="note">${Object.entries(src).map(([n,u])=>`<li>${n} : ${u.map((x,i)=>`<a href="${x}" rel="noopener" target="_blank">source ${i+1}</a>`).join(', ')}</li>`).join('')}</ul>`;
}
