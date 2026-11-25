// Plan, élévations, schéma du signal, points à trancher.
import { FT, INSTR, DRIVER } from './data.js';
import { STANDS, buildStand } from './stands.js';
import { PAD_OFF } from './assembly.js';
import { optics, ECRANS } from './space.js';
import { PROJ, PLAFOND, hautOptics } from './proj.js';

const fr=(v,d=0)=>v.toLocaleString('fr-CA',{minimumFractionDigits:d,maximumFractionDigits:d});
const INK='#191c34', BLUE='#333a7c', RED='#c4232c', GREY='#8a8c98', LINE='#c9c9c4';

export function drawPlan(box,S){
  const R=S.diam*FT/2, Rr=R+S.ecart/1000+.16, W=S.salle, k=100, m=95, w=W*k, o=[];
  const X=x=>(x+W/2)*k, Y=z=>(z+W/2)*k;
  o.push(`<rect x="0" y="0" width="${w}" height="${w}" fill="#fff" stroke="${INK}" stroke-width="3"/>`);
  for(let i=1;i<W;i++) o.push(`<path d="M${i*k} 0V${w}M0 ${i*k}H${w}" stroke="${LINE}" stroke-width=".7"/>`);
  o.push(`<circle cx="${X(0)}" cy="${Y(0)}" r="${Rr*k}" fill="none" stroke="${GREY}" stroke-dasharray="6 6"/>`);
  // tronc
  o.push(`<path d="M${X(0)} ${Y(0)}L${X(-W/2+1.6)} ${Y(-W/2+1.6)}" stroke="${RED}" stroke-width="3"/>`);
  o.push(`<circle cx="${X(0)}" cy="${Y(0)}" r="${R*k}" fill="${BLUE}" fill-opacity=".14" stroke="${BLUE}" stroke-width="3"/>`);
  if(S.ecran==='haut'){ const h=hautOptics(S), Rp=R+Math.max(.24,S.ecart/1000*.62);
    o.push(`<rect x="${X(-h.floorW/2)}" y="${Y(-h.floorH/2)}" width="${h.floorW*k}" height="${h.floorH*k}" fill="none" stroke="${BLUE}" stroke-dasharray="3 5"/>`);
    for(let i=0;i<3;i++){ const a=Math.PI/3+i*Math.PI*2/3, x=Math.sin(a)*Rp, z=Math.cos(a)*Rp; o.push(`<path d="M${X(0)} ${Y(0)}L${X(x)} ${Y(z)}" stroke="${INK}" stroke-width="8" stroke-opacity=".25"/><rect x="${X(x)-5}" y="${Y(z)-5}" width="10" height="10" fill="${INK}"/><rect x="${X(x)-17}" y="${Y(z)-17}" width="34" height="34" fill="none" stroke="${GREY}"/>`); }
    o.push(`<circle cx="${X(0)}" cy="${Y(-h.off)}" r="${30}" fill="#fff" fill-opacity=".85" stroke="${INK}" stroke-width="2"/><circle cx="${X(0)}" cy="${Y(-h.off)}" r="6" fill="${INK}"/>`);
    o.push(`<text x="${X(-h.floorW/2)+8}" y="${Y(h.floorH/2)-10}" font-size="16" fill="${BLUE}">débord du noir au sol</text>`); }
  else if(S.ecran==='ust') o.push(`<rect x="${X(.03)}" y="${Y(-.26)}" width="42" height="20" fill="${INK}"/><rect x="${X(-.45)}" y="${Y(.06)}" width="42" height="20" fill="${INK}"/><path d="M${X(-R)} ${Y(0)}H${X(R)}" stroke="${BLUE}" stroke-dasharray="4 4"/>`);
  else o.push(`<rect x="${X(-.18)}" y="${Y(-.18)}" width="36" height="36" fill="${INK}"/><circle cx="${X(0)}" cy="${Y(0)}" r="8" fill="#fff"/>`);
  Object.keys(INSTR).forEach((n,i)=>{ const a=i*Math.PI*2/3, s=Math.sin(a), c=Math.cos(a), x=X(s*Rr), y=Y(c*Rr), deg=-a*180/Math.PI;
    o.push(`<path d="M${X(s*R*.2)} ${Y(c*R*.2)}L${X(s*(Rr-.15))} ${Y(c*(Rr-.15))}" stroke="${RED}" stroke-width="2"/>`);
    o.push(`<g transform="translate(${x} ${y}) rotate(${deg})"><rect x="-23" y="-23" width="46" height="46" fill="#fff" stroke="${INK}" stroke-width="1.5"/><rect x="-13.3" y="-9" width="26.6" height="18" fill="${BLUE}"/><path d="M16 -11l16 -8v38l-16 -8zM-16 -11l-16 -8v38l16 -8z" fill="${INK}"/><path d="M38 0h52m-10 -6l10 6l-10 6M-38 0h-52m10 -6l-10 6l10 6" fill="none" stroke="${GREY}" stroke-width="1.6"/><circle cx="0" cy="52" r="20" fill="none" stroke="${GREY}" stroke-width="2"/></g>`);
    o.push(`<text x="${X(s*(Rr+1.32))}" y="${Y(c*(Rr+1.2))+8}" text-anchor="middle" font-size="24" font-weight="700">${n}</text>`); });
  o.push(`<g transform="translate(${X(-W/2+1.35)} ${Y(-W/2+1.35)}) rotate(-45)"><rect x="-80" y="-35" width="160" height="70" fill="#fff" stroke="${INK}" stroke-width="2"/><text y="7" text-anchor="middle" font-size="20" font-weight="600">Régie</text></g>`);
  o.push(`<text x="${X(.12)}" y="${Y(0)-R*k*.6}" text-anchor="middle" font-size="18" font-weight="600" fill="${BLUE}">Ø ${fr(S.diam,1)} pi · ${fr(2*R,2)} m</text>`);
  o.push(`<text x="${X(.2)}" y="${Y(R+.28)}" font-size="19">${fr(S.ecart)} mm</text>`);
  o.push(`<text x="${w/2}" y="${w+38}" text-anchor="middle" font-size="20">Salle ${fr(W,1)} × ${fr(W,1)} m, quadrillage de 1 m. ${ECRANS[S.ecran].nom}${S.ecran==='haut'?', '+PROJ[S.proj].court:''}.</text><text x="${w/2}" y="${w+68}" text-anchor="middle" font-size="20">Instruments à ${fr(2*Rr*Math.sin(Math.PI/3),2)} m l’un de l’autre, centre à centre.</text>`);
  box.innerHTML=`<svg viewBox="-10 -10 ${w+20} ${w+m}" style="max-width:860px;margin:auto" role="img" aria-label="Plan de l’espace">${o.join('')}</svg>`;
}

export function drawElev(box,S){
  const Hs=S.padH-PAD_OFF*1000, o=[], k=.5, gy=640; let x=60;
  const base=(cx,w)=>{ const y=gy-(Hs+80)*k; return `<rect x="${cx-w*k/2}" y="${y}" width="${w*k}" height="${80*k}" fill="${BLUE}"/>`; };
  const ci=(cx,front)=>{ const y=gy-(Hs+80)*k; if(front) return `<path d="M${cx-133.2*k} ${y}v${-83.2*k}h${201.5*k}v${24.4*k}h${64.9*k}v${58.8*k}z" fill="#fff" stroke="${INK}" stroke-width="1.4"/><path d="M${cx-133.2*k} ${y-73.2*k}h${201.5*k}" stroke="${LINE}"/>`;
    return `<path d="M${cx-89.4*k} ${y}v${-83.2*k}h${59.7*k}l${10*k} ${10*k}h${109.2*k}v${73.2*k}z" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`; };
  const prof={
    A:f=>{ const W=f?320:300, T=f?270.4:182.9; return [[-T/2,Hs],[-W/2,Hs-62],[-W/2,30],[W/2,30],[W/2,Hs-62],[T/2,Hs]]; },
    B:f=>{ const ys=Hs*.545, W=f?335:330, T=f?270.4:182.9, B=f?200:190; return [[-T/2,Hs],[-W/2,ys+150],[-W/2,ys-150],[-B/2,12],[B/2,12],[W/2,ys-150],[W/2,ys+150],[T/2,Hs]]; },
    C:f=>f?[[-150,Hs],[-150,0],[150,0],[150,Hs]]:[[-91.5,Hs],[-200,0],[200,0],[91.5,Hs]] };
  for(const K of ['A','B','C']){ const ys={A:Hs-265,B:Hs*.545,C:Hs*.5}[K], enc={A:460,B:470,C:420}[K];
    const cx1=x+enc*k/2, cx2=cx1+enc*k/2+60+(K==='C'?400:enc)*k/2;
    const poly=(cx,p,fill='#fff')=>`<path d="M${p.map(q=>`${cx+q[0]*k} ${gy-q[1]*k}`).join('L')}z" fill="${fill}" stroke="${INK}" stroke-width="1.4"/>`;
    o.push(`<rect x="${cx1-enc*k/2}" y="${gy-5}" width="${enc*k}" height="5" fill="${INK}"/>`,poly(cx1,prof[K](1)),K==='C'?`<rect x="${cx1-144*k}" y="${gy-(ys+165)*k}" width="${288*k}" height="${330*k}" fill="${BLUE}" fill-opacity=".85"/>`:'');
    [1,-1].forEach(s=>{ const e={A:160,B:167.5,C:150}[K]; const a=cx1+s*e*k, y=gy-ys*k; o.push(`<path d="M${a} ${y-130*k}L${a-s*22*k} ${y-120*k}L${a-s*75*k} ${y-74*k}V${y-70*k}H${a-s*118*k}V${y+70*k}H${a-s*75*k}V${y+74*k}L${a-s*22*k} ${y+120*k}L${a} ${y+130*k}z" fill="none" stroke="${RED}" stroke-width="1.2" stroke-dasharray="4 3"/>`); });
    o.push(base(cx1,266.4),ci(cx1,1));
    const e2=(K==='C'?400:enc); o.push(`<rect x="${cx2-e2*k/2}" y="${gy-5}" width="${e2*k}" height="5" fill="${INK}"/>`,poly(cx2,prof[K](0)),`<circle cx="${cx2}" cy="${gy-ys*k}" r="${130.5*k}" fill="none" stroke="${RED}" stroke-width="1.4"/><circle cx="${cx2}" cy="${gy-ys*k}" r="${97*k}" fill="none" stroke="${RED}" stroke-width="1"/>`,base(cx2,178.9),ci(cx2,0));
    const dx=x-22; o.push(`<path d="M${dx} ${gy}V${gy-S.padH*k}M${dx-6} ${gy}h12M${dx-6} ${gy-S.padH*k}h12" stroke="${RED}" stroke-width="1.2"/><text transform="translate(${dx-8} ${gy-S.padH*k/2}) rotate(-90)" text-anchor="middle" font-size="21">${fr(S.padH)}</text>`);
    o.push(`<text x="${cx1}" y="${gy+28}" text-anchor="middle" font-size="21">${enc}</text><text x="${cx2}" y="${gy+28}" text-anchor="middle" font-size="21">${e2}</text><text x="${(cx1+cx2)/2}" y="${gy+72}" text-anchor="middle" font-size="26" font-weight="700">${K}  ${STANDS[K].nom}</text>`);
    x=cx2+e2*k/2+80; }
  box.innerHTML=`<svg viewBox="0 90 ${x-30} ${gy+4}" style="min-width:900px" role="img" aria-label="Élévations des trois stands">${o.join('')}</svg>`;
}
export function drawTable(t,S){
  const Hs=S.padH/1000-PAD_OFF, rows=['A','B','C'].map(k=>{ const i=buildStand(k,Hs).info; i.kg+=3.2+4.3; i.b=i.kg*9.81*i.appui/(S.padH/1000); return [k,i]; });
  t.innerHTML='<tr><th>Stand</th><th>Emprise au sol</th><th>Corps</th><th>Volume par HP</th><th>Masse</th><th>Basculement</th><th>Pied</th></tr>'+rows.map(([k,i])=>`<tr><td><strong>${k} ${STANDS[k].nom}</strong></td><td>${i.encombrement.join(' × ')}</td><td>${i.corps.join(' × ')}</td><td>≈ ${fr(i.vol/2)} L</td><td>≈ ${fr(i.kg)} kg</td><td>≈ ${fr(i.b)} N</td><td>${i.plaque}</td></tr>`).join('');
}

export function drawSignal(box,S={}){
  const hp=S.ecran==='haut';
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
   bx(740,110,170,66,'Deux autres','instruments'),bx(740,272,170,74,'Commutateur','dans le socle de l’écran'),
   ar('M460 309H738',N,'OSC, dataFLOU',588,300),ar('M825 176V270',N,'Ethernet',858,226),
   bx(1010,264,170,90,'Régie','Palinopsia',N,N),ar('M910 309H1008',N,'Ethernet',959,300),
   bx(740,404,170,70,'Projecteur',hp?'dans le portique':'au centre du cercle'),ar('M1095 354V439H912',I,'SDI ou HDBaseT',1003,430),
   bx(1010,110,170,66,hp?'Plateforme':'Toile',hp?'blanc mat, par le haut':'rétroprojection'),ar('M825 474V504H1214V143H1182',I,'Lumière',1010,496),
   `<g font-size="14"><path d="M40 486h34" stroke="${A}" stroke-width="3"/><text x="82" y="491">Audio</text><path d="M160 486h34" stroke="${N}" stroke-width="3"/><text x="202" y="491">Données</text><path d="M300 486h34" stroke="${I}" stroke-width="3"/><text x="342" y="491">Image</text></g>`];
  box.innerHTML=`<svg viewBox="0 22 1230 500" style="min-width:900px" role="img" aria-label="Schéma du signal">${o.join('')}</svg>`;
}

export function drawChoix(box,S){
  const o=optics({...S,ecran:'fisheye',ecranH:S.ecran==='fisheye'||S.ecran==='ust'?S.ecranH:800}), o8=optics({...S,ecran:'fisheye',ecranH:o.H*1000,diam:8});
  const Q=[
   ['La forme du cercle',[`La maquette part d’un disque horizontal tendu sur une base de métal, projeté par en dessous. Le cylindre 360° est une autre lecture possible, et la plateforme basse projetée par le haut une troisième. Toutes sont dans l’onglet Espace.`]],
   ['Projeter par le haut',hautText(S)],
   ['Un projecteur au centre du disque',[`Un cercle de ${fr(S.diam,1)} pi à ${fr(S.ecranH)} mm du sol demande ${fr(2*o.theta)}° de champ depuis le centre. Un objectif ordinaire n’y arrive pas (rapport équivalent de ${fr(o.tr,2)} : 1). Il faut un fisheye.`,
     `Sur une toile plane, le fisheye donne ${fr(o.bord*100)} % de lumière au bord par rapport au centre, et des pixels de ${fr(o.pxB,1)} mm au bord. Palinopsia peut corriger la géométrie et la lumière, au prix de la luminosité totale. À 8 pi, le bord tombe à ${fr(o8.bord*100)} %.`,
     `Remonter la toile aide beaucoup. L’option à deux projecteurs ultra-courts donne une image plus nette et plus égale, avec un raccord au milieu.`]],
   ['Des 10 po dans un instrument de 179 mm',[`Un coaxial de 10 po fait ${DRIVER.d} mm de diamètre et ${DRIVER.depth} mm de profondeur de montage. Dos à dos, il faut au moins 290 mm de large et 290 mm de profond : le stand est forcément plus profond que le case (179 mm). Les trois propositions règlent cet écart de trois façons.`]],
   ['Large bande ou grave',[`Un haut-parleur de 10 po seul ne monte pas dans l’aigu. La maquette suppose des coaxiaux (10 po et moteur d’aigu au centre). Une autre voie, à la Barefoot : 10 po latéraux pour le grave et un petit large bande vers le joueur.`]],
   ['Vibrations et IMU',[`Les deux haut-parleurs sont sous la base molle : leurs vibrations peuvent entrer dans l’IMU. Le montage dos à dos annule les forces seulement si les deux membranes jouent la même chose. D’où des graves sommés en mono, et un filtre passe-bas sur l’IMU.`]],
   ['Larsen',[`Le micro est à moins d’un mètre des haut-parleurs. Les faire tirer à gauche et à droite aide. Il faudra quand même un seuil et un filtre coupe-bande dans Pandore, ou en faire une matière.`]],
   ['Basculement',[`Le public va pousser l’instrument vers 1 m de haut. Sans lest, les stands basculent entre 100 et 140 N environ. Viser 200 N : lest dans le pied, plaque plus large ou fixation au sol.`]],
   ['La base molle',[`Le moule bleu n’est pas dans les fichiers reçus (3MF et STEP). Sa hauteur (80 mm) vient des rendus, sa gorge vient de la jupe du case. À recevoir : le fichier du moule, la dureté du silicone, la position et le diamètre des aimants.`,`Le cylindre Ø 44,8 × 13,9 mm sous le case n’est pas centré (126,9 ; 97,9). La maquette lui fait un logement dans l’îlot. À confirmer.`]],
   ['Le PCB FLOU',[`Le fichier KiCad contient les composants, mais pas encore de contour, de placement ni de pistes. La carte visible en vue éclatée est une supposition (185 × 162 mm, sous le capot).`,`Le contour devra passer sous le capot de 201,5 mm et laisser la place au ventilateur du Pandore.`]],
   ['Hauteur de jeu',[`980 mm convient debout. En fauteuil, il faut plutôt viser 860 mm au plus, avec un dégagement pour les genoux que seul le Portique pourrait offrir. Le curseur de hauteur va de 820 à 1 120 mm.`]],
   ['Câbles',[`Tout sort par l’arrière du case, donc du côté du cercle. La base molle bouge : il faut une boucle de mou et une bride sur le stand, pas sur l’instrument.`]]
  ];
  box.innerHTML=Q.map(([t,p])=>`<article class="q"><h3>${t}</h3><div>${p.map(x=>`<p>${x}</p>`).join('')}</div></article>`).join('')+projTable(S);
}

function hautText(S){
  const s={...S,plateH:S.ecran==='haut'?S.plateH:300}, b=hautOptics({...s,proj:'benq',montage:'droit'}), e=hautOptics({...s,proj:'epson',montage:'droit'}), em=hautOptics({...s,proj:'epson',montage:'miroir'}), l=hautOptics({...s,proj:'l690',montage:'miroir'});
  const pl=s.plateH?`une plateforme de ${fr(s.plateH)} mm`:'le sol';
  return [
   `Sous un plafond de 10 pi (${fr(PLAFOND,2)} m), le caisson du portique laisse le dos du projecteur à environ ${fr(e.rear,2)} m. Pointé vers le bas, sa profondeur se prend sur cette hauteur : la lentille descend vers ${fr(e.lensY,1)} à ${fr(b.lensY,1)} m. Jusqu’à ${pl}, il reste environ ${fr(e.d,1)} à ${fr(b.d,1)} m de trajet. Pour qu’un cercle de ${fr(S.diam,1)} pi tienne dans le petit côté d’une image 16:10, il faut un rapport de projection d’environ ${fr(e.trReq,2)} : 1.`,
   `Les courtes focales courantes, autour de 0,8 : 1, n’y arrivent pas : même couché avec un miroir, l’Epson L690SU plafonne à ${fr(l.dMax,1)} pi. Deux voies restent. Un objectif encore plus court, pointé vers le bas sans miroir : le BenQ LU960ST2 (0,5 : 1) va jusqu’à ${fr(b.dMax,1)} pi, mais son image dépasse le cercle, qui n’en utilise que ${fr(b.pxCirc)} pixels sur 1 200. Ou un projecteur couché, avec un miroir à surface avant à 45° au centre du caisson : le trajet s’allonge d’environ ${fr(em.d-e.d,1)} m et l’Epson PU1007W avec l’objectif ELPLU03S remplit alors ${fr(S.diam,1)} pi avec ${fr(em.pxCirc)} pixels, jusqu’à ${fr(em.dMax,1)} pi.`,
   `Le noir d’un projecteur n’est jamais nul : tout le cadre reçoit un peu de lumière, soit environ ${fr(b.floorW,1)} × ${fr(b.floorH,1)} m au sol avec le BenQ, jusqu’au pied des stands. La plateforme donne le bord net du cercle, une moquette noire autour avale le reste. Les projecteurs DLP laissent aussi une faible bordure hors de l’image ; BenQ le documente.`,
   `Le faisceau de l’image part du centre et ne touche ni les instruments ni les joueur·euse·s. Seule une personne penchée au-dessus de la plateforme fait de l’ombre.`,
   `Le portique porte de 9 à 20 kg de projecteur, plus le caisson, à 2,8 m de haut, sur trois pieds placés entre les instruments. Il faut des platines lestées ou une fixation au sol, et un accès au filtre et aux réglages : échelle, ou caisson qui descend sur un treuil.`,
   `Les quatre modèles comparés ci-dessous annoncent une installation à 360° (pour l’Optoma, seulement selon les revendeurs), mais les fabricants ne s’entendent pas sur le sens de l’entrée d’air quand l’objectif pointe vers le bas. À faire confirmer par écrit par le fournisseur pour le modèle choisi. Couché avec un miroir, la question ne se pose plus ; il faut alors inverser l’image dans les réglages et garder le miroir sans poussière.`];
}
function projTable(S){
  const s={...S,plateH:S.ecran==='haut'?S.plateH:300};
  const cell=o=>o.fit?`jusqu’à ${fr(o.dMax,1)} pi<br><span class="ok">${fr(S.diam,1)} pi sur ${fr(o.pxCirc)} px</span>`:`<span class="no">${fr(o.dMax,1)} pi au plus</span>`;
  const rows=Object.entries(PROJ).map(([k,P])=>{ const a=hautOptics({...s,proj:k,montage:'droit'}), m=hautOptics({...s,proj:k,montage:'miroir'});
    return `<tr><td><strong>${P.nom}</strong><br><span class="sm">${P.techno}, ${fr(P.res[0])} × ${fr(P.res[1])}${P.est?', '+P.est:''}</span></td><td>${P.tr[0]===P.tr[1]?fr(P.tr[0],2):fr(P.tr[0],2)+' à '+fr(P.tr[1],2)} : 1</td><td>${cell(a)}</td><td>${cell(m)}</td><td>${fr(P.lm)}</td><td>${fr(P.kg,1)} kg</td><td>${P.dB} dB</td><td>${P.prix} $${P.prixNote?`<br><span class="sm">${P.prixNote}</span>`:''}</td></tr>`; }).join('');
  const src=Object.values(PROJ).map(P=>`<li>${P.nom} : ${P.src.map((u,i)=>`<a href="${u}" rel="noopener" target="_blank">source ${i+1}</a>`).join(', ')}</li>`).join('');
  return `<h2 id="projecteurs">Projecteurs pour la plateforme</h2><p class="lede">Cercle de ${fr(S.diam,1)} pi sur ${s.plateH?`une plateforme de ${fr(s.plateH)} mm`:'le sol'}, plafond de 10 pi. Le tableau suit les réglages de l’onglet Espace.</p>
  <div class="scroll"><table class="pj"><tr><th>Modèle</th><th>Rapport</th><th>Pointé vers le bas</th><th>Couché, miroir à 45°</th><th>Lumens</th><th>Masse</th><th>Bruit</th><th>Prix ≈ ($ US)</th></tr>${rows}</table></div>
  <p class="note">Chiffres relevés le 25 novembre 2026 dans les pages des fabricants citées ci-dessous, sans visite directe des pages : à confirmer auprès du fournisseur avant achat. Les prix sont des prix de rue approximatifs. Hypothèses : dessus du portique à 18 cm du plafond, projecteur à 5 cm sous le dessus, miroir à 20 cm de la lentille, cercle à 97 % du petit côté de l’image. Écartés : les courtes focales à décentrement fixe (Optoma ZU507TST, ViewSonic LS711HD), faits pour une colonne au bord du cercle et pas pour un caisson au centre ; les gros projecteurs d’installation à objectif court (Panasonic PT-MZ11KL à MZ17KL avec ET-EMW300), qui marchent mais pèsent près de 28 kg et coûtent plus de 17 000 $.</p>
  <ul class="note">${src}</ul>`;
}
