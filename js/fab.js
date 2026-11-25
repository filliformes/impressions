// Fabrication : liste des pièces, colis, montage, dessins et fichiers de coupe pour le système choisi.
import { optics, SYS, GAP, rpOf, secteurs } from './optics.js';
import { buildScreen, PIED, ARCS, TUBE, MAT_D } from './screen.js';
import { SUB, TRAY, SOL_TECH } from './tech.js';
import { items, resume } from './transport.js';
import { EIS } from './eisode.js';
import { LIEU } from './lieu.js';
import { centre } from './space.js';

const fr=(v,d=0)=>v.toLocaleString('fr-CA',{minimumFractionDigits:d,maximumFractionDigits:d}), mm=v=>fr(Math.round(v*1000)), $=q=>document.querySelector(q);
const ALU=2700, tubeKg=(d,e)=>Math.PI*(d*d-(d-2*e)*(d-2*e))/4*ALU, INK='#191c34', BLUE='#333a7c', RED='#c4232c', GREY='#8a8c98';

// ------------------------------------------------------------ données de fabrication
export function fab(s){
  const O=optics(s), R=O.R, H=O.H, P=O.P, sc=buildScreen(s), out={ O,P,sec:[],colis:[],etapes:[],regl:[],ouvert:[],dxf:[],notes:[] }; let kg=0;
  const row=(L,rep,nom,q,mat,cote,m)=>{ const t=(m||0)*q; kg+=t; L.push([rep,nom,q,mat,cote,t?`${fr(t,1)} kg`:'']); return t; };
  const mir=sc.mirOut?sc.mirOut(s.sys==='dessous'?0:.018):null, area=p=>Math.abs(p.reduce((a,[x,y],i)=>{ const [u,v]=p[(i+1)%p.length]; return a+x*v-u*y; },0)/2), ext=p=>{ const X=p.map(a=>a[0]), Y=p.map(a=>a[1]); return [Math.max(...X)-Math.min(...X),Math.max(...Y)-Math.min(...Y)]; };
  if(mir) out.dxf.push(['miroir',{poly:[mir]}]);
  const { Rt,Rf }=O, des=s.sys==='dessous', kt=tubeKg(TUBE,.003), leg=O.vinyle?0:Math.hypot(Rt-Rf,Math.max(H-.06,0)), haut=leg>.03, th=des?Math.atan2(Rt-Rf,H-.06)*180/Math.PI:7, tr=Rf-.012, A=[], B=[], C=[], D=[], T=[];
  // --- le dessus
  if(O.vinyle){ row(A,'A1','Disque de vinyle blanc mat',1,'Vinyle de projection au sol, antidérapant',`Ø ${mm(R*2)}`,Math.PI*R*R*.6); out.dxf.push(['vinyle',{circ:[[0,0,R]]}]); out.sec.push(['Surface',A]); }
  else {
    const arc=2*Math.PI*Rt/ARCS-.004, chord=2*Rt*Math.sin(Math.PI/ARCS);
    row(A,'A1','Arc d’anneau',ARCS,'Tube alu 6061 Ø 38 × 3, cintré',`rayon à l’axe ${mm(Rt)}, développé ${mm(arc)}, corde ${mm(chord)}`,arc*kt);
    row(A,'A2','Manchon de jonction',PIED,'Tube alu Ø 31,5 × 3','longueur 140, deux boutons à ressort',.14*tubeKg(.0315,.003));
    row(A,'A3','Nœud',PIED,'Alu usiné (prototype : PA-CF imprimé)',`relie deux arcs, douille Ø 38 inclinée de ${fr(th,1)}° vers l’intérieur`,.3);
    row(A,'A4','Pied court',PIED,'Caoutchouc, tige M10','se visse dans la douille : le dessus tient seul, à 60 mm du sol',.06);
    row(A,'A5',des?'Toile grise de rétroprojection':'Toile blanche mate, opaque',1,des?'PVC gris très diffusant, gain sous 1':'PVC blanc mat, gain 1, dos noir',`disque Ø ${mm((Rt+.02)*2)} + ourlet 60, œillets aux 100`,Math.PI*(Rt+.08)**2*.45);
    row(A,'A6','Sandow à crochet',Math.round(2*Math.PI*Rt/.1),'Élastique Ø 6','tension sous l’anneau',.012);
    out.dxf.push(['toile',{circ:[[0,0,Rt+.02],[0,0,Rt+.08]]}]); out.sec.push(['Le dessus, le même dans tous les systèmes',A]);
    out.notes.push(des?'La même structure reçoit la toile blanche quand le dessus sert seul, projeté d’en haut.':'La même structure reçoit la toile grise quand elle sert de table rétroprojetée.');
    // --- pieds et jupe
    if(haut) row(C,'P1','Pied',PIED,'Tube alu Ø 38 × 3',`longueur ${mm(leg)}${leg>.56?', en deux bouts emboîtés':''}`,leg*kt+.1);
    if(haut) row(C,'P2','Patin réglable',PIED,'Caoutchouc, tige M10','Ø 75, course ± 15',.15);
    if(des||H>.2) row(C,'P3','Traverse basse',PIED,'Tube alu Ø 22 × 2',`longueur ${mm(tr)}, crochets en bout${tr>.56?', en deux bouts':''}`,tr*tubeKg(.022,.002));
    const sl=Math.hypot(Rf-Rt,H-.07); if(H>=.16) row(C,'P4','Jupe, deux moitiés',2,'Tissu blanc doublé noir opaque, velcro',`cône : haut Ø ${mm((Rt+.026)*2)}, bas Ø ${mm((Rf+.028)*2)}, pente ${mm(sl)}`,Math.PI*(Rt+Rf)*sl*.35/2);
    if(C.length) out.sec.push(['Pieds et jupe',C]);
  }
  const mDessus=O.vinyle?['Dérouler le vinyle au gabarit, le coller aux bords.']:['Assembler les douze arcs au sol, avec les six manchons et les six nœuds.',haut?'Enfiler les pieds dans les nœuds, retourner l’anneau.':'Visser les six pieds courts, retourner l’anneau.',...(des||H>.2?['Accrocher les traverses basses : la structure devient rigide.']:[]),'Mettre l’anneau de niveau à 2 mm près.','Poser la toile et les sandows en étoile, deux par deux, jusqu’à une flèche de moins de 5 mm.'];
  if(des){
    const F=O.f, b=sc.banc;
    if(F){ const [mw,ml]=ext(mir), ma=area(mir), lb=b.l/b.n;
      row(B,'B1','Banc optique, panneau',b.n,'Contreplaqué de bouleau 18',`${mm(lb)} × ${mm(b.w)}, deux charnières par joint`,lb*b.w*12.2);
      const pap=s.miroir==='papier', nS=pap?secteurs(O.mr,s):1, tail=O.rond?`Ø ${mm(O.mr*2)}`:`${mm(ml)} × ${mm(mw)}`;
      if(pap){ row(B,'B2','Secteur de miroir',nS,'Composite alu 3 mm, papier miroir collé',`secteur de ${fr(360/nS)}°, disque ${tail}, incliné à ${fr(Math.abs(F.ph),1)}°`,ma*3.8/nS); row(B,'B2b','Moyeu et éclisses',1,'Alu 4 mm, boutons quart de tour',`moyeu Ø 220, ${nS} éclisses au dos, joints à fleur à 0,2 mm`,.7); const L=O.mir(0), m=L.length/nS; out.dxf.push(['miroir-secteur',{poly:[[[0,O.rond?F.disc.t0:0],...L.slice(0,m+1)]]}]); }
      else row(B,'B2','Miroir à première surface',1,'Verre 4 mm',`${tail}, incliné à ${fr(Math.abs(F.ph),1)}°`,ma*10);
      row(B,'B3','Cadre et jambes du miroir',1,'Alu 20 × 20 et Ø 18','trois vis de réglage M6 en triangle',1.8);
      row(B,'B4','Berceau du projecteur',1,'Alu 4 mm plié',`${mm(P.w-.02)} × ${mm(P.dep-.02)}, quatre pattes M8, incliné à ${fr(Math.abs(F.tilt))}°`,1.1);
      row(B,'B5',`Projecteur ${P.court}`,1,prix(P),`${mm(P.w)} × ${mm(P.dep)} × ${mm(P.up+P.dn)}`,P.kg);
      row(B,'B6','Goupille de repère',2,'Acier Ø 10','le banc se place toujours au même endroit, sur deux traverses',.05);
      out.dxf.push(['banc-panneau',{poly:[[[0,0],[lb,0],[lb,b.w],[0,b.w]]],circ:[[.03,.03,.005],[.03,b.w-.03,.005]]}]); }
    out.sec.push(['Optique',B]);
    out.etapes=[...mDessus.slice(0,3),'Glisser le banc plié entre deux pieds, le déplier, le goupiller sur les traverses.','Poser le miroir, puis le projecteur.',...mDessus.slice(3),'Allumer une mire : régler la hauteur de l’image avec les pattes du berceau, le trapèze avec les trois vis du miroir, puis la mise au point.',s.sub||s.regieE?'Poser la technique sous la toile, fermer les deux moitiés de la jupe.':'Fermer les deux moitiés de la jupe.'];
    out.regl=['Anneau : cercle à ± 2 mm, sinon la toile plisse.','Miroir : 0,5° d’erreur déplace l’image d’environ '+(F?fr(2*Math.tan(.5*Math.PI/180)*F.T*700):'')+' mm. D’où trois vis fines et des repères gravés.','Berceau : course de ± 20 mm en hauteur et ± 3° en inclinaison, pour accepter un autre projecteur.'];
    out.ouvert=['Le manuel ViewSonic contient une consigne générale de 15° d’inclinaison au plus, alors que la page du produit promet n’importe quel angle. À faire confirmer par écrit par ViewSonic avant d’acheter.',...(s.miroir==='papier'?[`Papier miroir : une ondulation de 0,1° déplace l’image d’environ ${F?fr(2*Math.tan(.1*Math.PI/180)*F.T*700,1):''} mm, et chaque joint se voit. L’image sera texturée, pas nette. Essai en carton, avec un projecteur emprunté, avant de couper l’alu.`]:['Le miroir de verre est la plus grande pièce rigide : il n’entre pas dans une case de soute. Achat sur place, expédition à plat, ou papier miroir sur secteurs.']),'Échantillon de toile à essayer avec un projecteur emprunté : luminosité sur les côtés, point chaud, grain.','La toile supporte une main, pas un coude : un garde-corps visuel ou une plaque rigide si le public peut s’appuyer.'];
  } else if(s.sys==='mat'){ const m=O.m, rail=s.accroche==='rail', cw=P.w+.07, cl=(-m.xa+GAP+P.dep+.07)-(m.xm-.05), chh=m.top-(m.yA-P.h/2-.02), [mw,ml]=ext(mir), y0=m.yA-P.h/2-.02;
    row(B,'B1','Caisson',1,'Alu 2 mm plié, peint blanc, perforé',`${mm(cl)} × ${mm(cw)} × ${mm(chh)}`,(2*(cl*cw+cl*chh+cw*chh))*.8*.002*ALU);
    row(B,'B2','Miroir à première surface',1,'Verre 3 mm',`contour DXF, ${mm(ml)} × ${mm(mw)}, à 45°`,area(mir)*7.5); row(B,'B3','Platine de miroir',1,'Alu 4 mm','trois vis de réglage M5',.4); row(B,'B4',`Projecteur ${P.court}`,1,prix(P),`${mm(P.w)} × ${mm(P.dep)} × ${mm(P.h)}`,P.kg); row(B,'B5','Élingue de sécurité',1,'Câble d’acier Ø 3','obligatoire au-dessus du public',.2);
    if(rail){ row(D,'C1','Tige filetée M10 + écrou-frein',2,'Acier',`longueur ${mm(s.plafond/1000-.0254-m.top+.03)}`,.25); row(D,'C2','Profilé 80/20, 1 po, du rail 2 au rail 3',1,'Alu 1010',`longueur ${mm(EIS.rails[2]-EIS.rails[1]+.08)}`,(EIS.rails[2]-EIS.rails[1]+.08)*.8); row(D,'C2b','Profilé 80/20, 1 po, traverse arrière',1,'Alu 1010','longueur 280',.28*.8); row(D,'C3','Écrous en T et équerres 80/20',12,'Acier, série 10','pour rail de 1 po',.05); }
    else { const km=tubeKg(MAT_D,.004), x0=O.Rb+.004; row(D,'C1','Mât, section basse',1,'Tube alu Ø 70 × 4',`longueur ${mm(1.19)}`,1.19*km); row(D,'C2','Mât, section haute',1,'Tube alu Ø 70 × 4',`longueur ${mm(y0+.04-1.2+.12)}, emboîtement 120`,(y0+.04-1.08)*km); row(D,'C3','Manchon',1,'Alu Ø 62','longueur 240',.5); row(D,'C4','Platine',1,'Acier 10 mm','600 × 600, poignées',.36*.01*7850); row(D,'C5','Poids',2,'Fonte','10 kg chacun',10); row(D,'C6','Jambe de force',3,'Tube Ø 22','longueur 300',.1); out.dxf.push(['platine',{poly:[[[0,0],[.6,0],[.6,.6],[0,.6]]],circ:[[.3,.6+(m.xm+x0),.0355]]}]);
      const load=P.kg+6, M0=load*9.81*.45, tot=load+28.3+20+10; out.notes.push(`Stabilité : le caisson (environ ${fr(load)} kg) est en porte-à-faux de 45 cm, soit ${fr(M0)} N·m. Le pied de ${fr(tot)} kg résiste à environ ${fr(tot*9.81*.3)} N·m vers l’intérieur. Il reste ${fr((tot*9.81*.3-M0)/1.2)} N de poussée à 1,2 m : protéger le mât ou le lester davantage.`); }
    out.sec.push(['Caisson',B],[rail?'Accroche au rail 80/20':'Mât',D]);
    out.etapes=[...(rail?[`Poser les écrous en T dans le rail 2 d’EISODE, à ${fr(centre(s)[0]-EIS.rx[0],2)} m de son bout gauche.`,'Fixer le profilé sous les rails 2 et 3, dans l’axe du caisson.','Lever le caisson vide à deux personnes, serrer les tiges, poser l’élingue.','Mettre le caisson de niveau avec les écrous des tiges.']:['Poser la platine et les poids entre PHASMA et ESSAIM.','Monter la section basse et ses jambes de force.','Au sol, fixer le caisson sur la section haute ; emboîter à deux personnes.']),'Glisser le projecteur, brancher courant et image, poser l’élingue.',...mDessus,'Mire ronde : régler le zoom, le décentrement, puis les trois vis du miroir.'];
    out.regl=['Image : le bord du cercle doit tomber à 70 mm de l’axe de l’anneau, à 5 mm près.',`Décentrement utilisé : ${fr(m.off*100)} %.`,'Miroir taillé au contour du cercle : il coupe aussi le rectangle de noir du projecteur.'];
    out.ouvert=[rail?'Charge permise par rail à demander à Artificiel, et accord pour percer ou non.':'Essai de stabilité avec le vrai projecteur avant le public.',P.court.includes('HT')||P.off[0]===P.off[1]?'Décalage d’image à mesurer sur l’appareil.':'Décentrement vertical maximal à vérifier quand l’image est en 16:9 plein cadre.','Les mains des joueur·euse·s restent hors du faisceau ; une personne penchée au-dessus du disque fait de l’ombre.'];
  } else if(s.sys==='sol'){ const q=O.s;
    row(B,'B1',P.lieu?'Projecteur du lieu':`Projecteur ${P.court}`,1,prix(P),`${mm(P.w)} × ${mm(P.dep)} × ${mm(P.h)}, pointé à la verticale`,P.kg); row(B,'B2','Crochet de gril et élingue',1,'Acier, tube de 48 mm',q.drop>.05?`tige de ${mm(q.drop)} pour descendre le projecteur`:'accroche directe',1.2);
    out.sec.push(['Au gril',B]);
    out.etapes=[`Accrocher le projecteur au gril, objectif à ${fr(q.lensY,2)} m du sol, au-dessus du centre. Élingue.`,...mDessus,'Mire ronde : régler le zoom, la mise au point et le décentrement.'];
    out.regl=[`Rapport de projection requis : ${fr(q.zoom,2)} : 1, pour un trajet de ${fr(q.T,2)} m.`,`Avec ce projecteur, le gril peut être entre ${fr(q.idealMin,1)} et ${fr(q.idealMax,1)} m. Plus haut, on descend le projecteur.`];
    out.ouvert=['À demander au lieu : hauteur du gril, modèle, objectif, droit de pointer le projecteur à la verticale.','Le projecteur voit l’ombre des têtes : un faisceau étroit et haut en fait moins qu’un faisceau large et bas.'];
  } else { const p=O.p, Rp=rpOf(s,O), ka=(.07*.07-.062*.062)*ALU; row(B,'B1','Pied, section basse',3,'Tube alu 70 × 70 × 4','longueur 1 200, platine 340 × 340 × 14',1.2*ka+12.7); row(B,'B2','Pied, section haute',3,'Tube alu 70 × 70 × 4',`longueur ${mm(p.top-1.2)}`,(p.top-1.2)*ka); row(B,'B3','Traverse',3,'Tube alu 80 × 80 × 4',`longueur ${mm(Rp)}`,Rp*(.08*.08-.072*.072)*ALU); row(B,'B4','Moyeu et caisson',1,'Alu plié','voir le modèle 3D',12); row(B,'B5',`Projecteur ${P.court}`,1,prix(P),`${mm(P.dim[0])} × ${mm(P.dim[1])} × ${mm(P.dim[2])}`,P.kg); if(p.mir) row(B,'B6','Miroir à première surface',1,'Verre 4 mm',`${mm(p.mirH)} × ${mm(p.mirW)}, à 45°`,p.mirH*p.mirW*10); out.sec.push(['Portique',B]);
    out.etapes=['Placer les trois platines entre les instruments, au gabarit.','Monter les pieds bas, puis les pieds hauts.','Assembler moyeu et traverses au sol, lever à trois personnes.','Glisser le projecteur et le miroir, brancher, élinguer.',...mDessus,'Régler l’image.']; out.regl=['Moyeu au centre à 5 mm près.']; out.ouvert=['Plus lourd et plus long à monter que le mât ou l’accroche au rail. À garder pour un lieu sans plafond utilisable.']; }
  if(!des&&!O.vinyle) out.ouvert.push('Une toile basse ne supporte pas qu’on marche dessus : ligne au sol ou lumière de bord pour tenir le public à distance.');
  if(s.sub||s.regieE){ const t=sc.tech, pos=q=>q.cote?'à côté de l’écran':`sous la toile, à ${mm(Math.hypot(q.x,q.y))} du centre`;
    if(t.sub) row(T,'T1',SUB.nom,1,'Kanto SUB8 ou semblable',`${mm(SUB.w)} × ${mm(SUB.d)} × ${mm(SUB.h)}, ${pos(t.sub)}, sur quatre plots mous`,SUB.kg);
    if(t.tray) row(T,'T2',TRAY.nom,1,'Ordinateur, commutateur, multiprise',`${mm(TRAY.w)} × ${mm(TRAY.d)} × ${mm(TRAY.h)}, ${pos(t.tray)}`,TRAY.kg);
    out.sec.push(['Technique',T]); if(t.sub&&!t.sub.cote&&des) out.ouvert.push('Sub sous la toile : la pression du grave fait bouger la toile et le miroir. Essai d’écoute avec l’image, et passe-haut si elle tremble.'); if(t.tray&&!t.tray.cote) out.ouvert.push('Chaleur sous la jupe : projecteur et ordinateur ensemble. Laisser les perforations du bas libres et une sortie d’air en haut.'); }
  out.colis=resume(items(s).list.filter(i=>['ecran','optique'].includes(i.g))).map(i=>[`${i.n>1?i.n+' × ':''}${i.nom}`,`${fr(Math.round(i.l))} × ${fr(Math.round(i.w))} × ${fr(Math.round(i.h))}`,`${fr(i.tot,1)} kg`]);
  out.notes.push('Vis à bouton ou goupilles : aucun outil au montage.'); out.kg=kg; return out;
}
const prix=P=>/^liste/.test(P.prix)?'Liste de prêt':P.prix;
// ------------------------------------------------------------ DXF (R12, millimètres)
function dxf(d){ const L=['0','SECTION','2','ENTITIES']; (d.poly||[]).forEach(p=>{ L.push('0','POLYLINE','8','0','66','1','70','1'); p.forEach(([x,y])=>L.push('0','VERTEX','8','0','10',(x*1000).toFixed(3),'20',(y*1000).toFixed(3))); L.push('0','SEQEND'); }); (d.circ||[]).forEach(([x,y,r])=>L.push('0','CIRCLE','8','0','10',(x*1000).toFixed(3),'20',(y*1000).toFixed(3),'40',(r*1000).toFixed(3))); L.push('0','ENDSEC','0','EOF'); return L.join('\r\n'); }
function dl(nom,txt,type){ const u=URL.createObjectURL(new Blob([txt],{type})), a=document.createElement('a'); a.href=u; a.download=nom; a.click(); setTimeout(()=>URL.revokeObjectURL(u),4000); }

export function drawFab(S){
  const f=fab(S), box=$('#fabIn');
  const tbl=([t,rows])=>`<h3>${t}</h3><div class="scroll"><table class="bom"><tr><th>Rep.</th><th>Pièce</th><th>Qté</th><th>Matière</th><th>Cotes (mm)</th><th>Masse</th></tr>${rows.map(r=>`<tr><td>${r[0]}</td><td><strong>${r[1]}</strong></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</table></div>`;
  box.innerHTML=`<h2>${SYS[S.sys].titre}</h2><p class="lede">Image de ${fr(S.diam,2)} pi (${fr(f.O.R*2,2)} m), ${f.P.court}. La fiche suit les réglages des onglets Espace et Écran. Masse totale estimée : ${fr(f.kg)} kg.</p>
  <div class="fig" id="fabC"></div><div class="dls"></div>${f.sec.map(tbl).join('')}
  <h3>Transport de l’écran</h3><p class="lede">Mousse comprise. L’onglet Transport range tout, instruments compris, dans des cases de soute.</p><div class="scroll"><table class="bom"><tr><th>Objet</th><th>Encombrement (mm)</th><th>Masse</th></tr>${f.colis.map(c=>`<tr><td><strong>${c[0]}</strong></td><td>${c[1]}</td><td>${c[2]}</td></tr>`).join('')}</table></div>
  <h3>Montage</h3><ol class="steps">${f.etapes.map(e=>`<li>${e}</li>`).join('')}</ol>
  <h3>Réglages et tolérances</h3><ul class="steps">${f.regl.concat(f.notes).map(e=>`<li>${e}</li>`).join('')}</ul>
  <h3>À confirmer avant fabrication</h3><ul class="steps">${f.ouvert.map(e=>`<li>${e}</li>`).join('')}</ul>
  <p class="note">Masses et cotes calculées par la maquette, à valider par la personne qui fabrique. Les fichiers DXF sont en millimètres, à l’échelle 1:1, sans jeu de coupe.</p>`;
  drawCoupe($('#fabC'),S); const D=box.querySelector('.dls');
  const bt=(t,fn)=>{ const b=document.createElement('button'); b.type='button'; b.className='btn'; b.textContent=t; b.onclick=fn; D.append(b); };
  f.dxf.forEach(([n,d])=>bt(`${n.replace('-',' ')} (DXF)`,()=>dl(`impressions-${S.sys}-${n}.dxf`,dxf(d),'application/dxf')));
  bt('Liste des pièces (CSV)',()=>dl(`impressions-${S.sys}-pieces.csv`,'﻿'+[['Groupe','Rep','Piece','Qte','Matiere','Cotes','Masse'],...f.sec.flatMap(([t,r])=>r.map(x=>[t,...x]))].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(';')).join('\r\n'),'text/csv'));
}

// ------------------------------------------------------------ coupe cotée (plan de l'axe du projecteur)
export function drawCoupe(box,S){
  const O=optics(S), R=O.R, H=O.H, k=300, so=S.sys==='sol', pl=so?S.gril/1000:S.plafond/1000, hi=S.sys!=='dessous', W1=Math.max(1.75,O.Rb+.75), W0=-W1, top=hi?pl+(so?.3:.12):H+.32, X=x=>(x-W0)*k, Y=y=>(top-y)*k, o=[], sc=buildScreen(S);
  const ln=(a,b,c=INK,w=2,d='')=>o.push(`<path d="M${X(a[0])} ${Y(a[1])}L${X(b[0])} ${Y(b[1])}" stroke="${c}" stroke-width="${w}" ${d?`stroke-dasharray="${d}"`:''} fill="none"/>`), pg=(p,f='#fff',c=INK,w=1.6,op=1)=>o.push(`<path d="M${p.map(q=>`${X(q[0])} ${Y(q[1])}`).join('L')}z" fill="${f}" fill-opacity="${op}" stroke="${c}" stroke-width="${w}"/>`), rc=(x0,y0,x1,y1,f,c,op=1)=>pg([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],f,c,1.6,op), tx=(x,y,t,a='middle',z=19)=>o.push(`<text x="${X(x)}" y="${Y(y)}" text-anchor="${a}" font-size="${z}">${t}</text>`);
  const dh=(x0,x1,y,t)=>{ ln([x0,y],[x1,y],RED,1.4); [x0,x1].forEach(x=>ln([x,y-.018],[x,y+.018],RED,1.4)); tx((x0+x1)/2,y+.02,t); }, dv=(x,y0,y1,t)=>{ ln([x,y0],[x,y1],RED,1.4); [y0,y1].forEach(y=>ln([x-.018,y],[x+.018,y],RED,1.4)); o.push(`<text transform="translate(${X(x)-7} ${Y((y0+y1)/2)}) rotate(-90)" text-anchor="middle" font-size="19">${t}</text>`); };
  ln([W0,0],[W1,0],INK,3);
  const F=O.f, Rt=O.Rt, Rf=O.Rf;
  if(F){ const p2=m=>[m[0],m[1]]; pg([p2(F.m1),p2(F.m2),[R,H],[-R,H]],BLUE,'none',0,.12); pg([F.L,p2(F.m1),p2(F.m2)],BLUE,'none',0,.2); ln(p2(F.m1),[-R,H],BLUE,1.2); ln(p2(F.m2),[R,H],BLUE,1.2); ln(F.L,p2(F.m1),BLUE,1.2); ln(F.L,p2(F.m2),BLUE,1.2); }
  // technique
  for(const [q,t] of [[sc.tech.sub,'sub'],[sc.tech.tray,'technique']]) if(q){ rc(q.x-q.w/2,SOL_TECH,q.x+q.w/2,q.h,'#d2a62c','#8a6a10',.35); tx(q.x,q.h+.02,t,'middle',16); }
  // le dessus
  if(O.vinyle) ln([-R,.006],[R,.006],BLUE,5);
  else { [-1,1].forEach(q=>{ if(H>.08) ln([q*Rt,H-.03],[q*Rf,.02],INK,10); rc(q*Rf-.036,0,q*Rf+.036,.02,INK,INK); if(H>=.16) ln([q*(Rt+.026),H-.03],[q*(Rf+.028),.04],GREY,2,'7 5'); o.push(`<circle cx="${X(q*Rt)}" cy="${Y(H-.022)}" r="${TUBE/2*k}" fill="#fff" stroke="${INK}" stroke-width="2"/>`); }); if(S.sys==='dessous'||H>.2) ln([-Rf*.86,.09],[Rf*.86,.09],GREY,2,'4 4'); ln([-Rt-.012,H],[Rt+.012,H],BLUE,5); }
  if(S.sys==='dessous'){
    if(F){ const n=[-Math.sin(F.fa),Math.cos(F.fa)]; const [e1,e2]=[-1,1].map(q=>F.disc.pt(0,(O.rond?F.disc.t0:0)+q*Math.max(...O.mir(0).map(p=>Math.abs(p[1]-(O.rond?F.disc.t0:0)))))); ln([e1[0]-n[0]*.006,e1[2]-n[1]*.006],[e2[0]-n[0]*.006,e2[2]-n[1]*.006],INK,6); pg(F.body,INK,INK,1,.88); const b=sc.banc; rc(b.x0,.006,b.x1,.024,'#cdb78f',INK); tx((F.x0+F.x1)/2,F.z1+.04,O.P.court); tx((F.m1[0]+F.m2[0])/2-.1,(F.m1[1]+F.m2[1])/2-.02,`miroir ${fr(Math.abs(F.ph),1)}°`,'end'); dh(b.x0,b.x1,.045,`banc ${mm(b.l)}`); }
    dh(-R,R,H+.07,`image ${mm(R*2)}`); dh(-Rt-.02,Rt+.02,H+.17,`anneau ${mm(Rt*2+.04)}`); dh(-Rf,Rf,-.09,`au sol ${mm(Rf*2)}`); dv(-Rt-.2,0,H,mm(H)); }
  else { ln([W0,pl],[W1,pl],INK,so?2:3); tx(W1-.02,pl+.03,`${so?'gril':'plafond'} ${mm(pl)}`,'end');
    if(!O.vinyle){ dh(-Rt-.02,Rt+.02,-.09,`anneau ${mm(Rt*2+.04)}`); dv(-Rt-.16,0,H,mm(H)); }
    if(S.sys==='mat'){ const m=O.m, P=O.P, A=[m.a[0],m.a[2]], B=[m.b[0],m.b[2]], L=[-m.xa+GAP,m.yA], yb=m.yA-P.h/2; pg([A,B,[R,H],[-R,H]],BLUE,'none',0,.12); ln(A,[-R,H],BLUE,1.2); ln(B,[R,H],BLUE,1.2); ln(L,A,BLUE,1); ln(L,B,BLUE,1); rc(m.xm-.05,yb-.02,-m.xa+GAP+P.dep+.07,m.top,'none',INK); rc(-m.xa+GAP+.012,yb,-m.xa+GAP+P.dep,yb+P.h,INK,INK); ln(A,B,INK,6); tx(-m.xa+GAP+P.dep+.1,m.yA,P.court,'start');
      if(S.accroche==='rail'){ EIS.rails.forEach((r,i)=>{ const x=r+.0127-(EIS.rails[1]+.0127-m.xm-.06); if(x>W0&&x<W1) rc(x-.0127,pl-.0254,x+.0127,pl,i===1?RED:'#c3c6ca',INK); }); ln([m.xm+.06,m.top],[m.xm+.06,pl-.0254],INK,5); ln([-m.xa+GAP+P.dep,m.top],[-m.xa+GAP+P.dep,pl-.0254],GREY,2); tx(m.xm+.06,pl+.03,'rail 2'); }
      else { rc(m.xm-MAT_D/2,.01,m.xm+MAT_D/2,yb-.02,'#fff',INK); rc(-O.Rb-.604,0,-O.Rb-.004,.01,INK,INK); }
      dh(m.xm,0,H+.12,`${mm(-m.xm)}`); dv(W1-.32,0,m.yA,`axe ${mm(m.yA)}`); dv(W1-.14,0,m.top,mm(m.top)); dh(-R,R,H+.3,`image ${mm(R*2)}`); }
    else if(so){ const q=O.s, P=O.P; pg([[0,q.lensY],[R,H],[-R,H]],BLUE,'none',0,.12); ln([0,q.lensY],[-R,H],BLUE,1.2); ln([0,q.lensY],[R,H],BLUE,1.2); rc(-P.h/2,q.lensY+.02,P.h/2,q.rear,INK,INK); if(pl>q.rear) ln([0,q.rear],[0,pl],INK,4); for(let x=-Math.floor(W1/LIEU.pas)*LIEU.pas;x<W1;x+=LIEU.pas) o.push(`<circle cx="${X(x)}" cy="${Y(pl)}" r="7" fill="#fff" stroke="${INK}" stroke-width="2"/>`); tx(P.h/2+.06,(q.lensY+q.rear)/2,P.court,'start'); dv(W1-.14,0,q.lensY,`objectif ${mm(q.lensY)}`); dh(-R,R,H+.12,`image ${mm(R*2)}`); }
    else { const p=O.p, Rp=rpOf(S,O), y=p.mir?p.axisY:p.lensY, rI=Math.min(R,p.circ/2); pg([[0,y],[rI,H],[-rI,H]],BLUE,'none',0,.12); [-1,1].forEach(q=>{ rc(q*Rp-.035,0,q*Rp+.035,p.top,'#fff',INK); rc(q*Rp-.17,0,q*Rp+.17,.014,INK,INK); }); rc(-Rp,p.top-.08,Rp,p.top,'#fff',INK); if(p.mir){ ln([-.1,y+.1],[.1,y-.1],INK,5); rc(-.21-O.P.dim[1],y-O.P.dim[2]/2,-.24,y+O.P.dim[2]/2,INK,INK); } else rc(-O.P.dim[2]/2,p.lensY,O.P.dim[2]/2,p.rear,INK,INK); dv(W1-.14,0,p.top,mm(p.top)); dh(-Rp,Rp,H+.2,mm(Rp*2)); dh(-R,R,H+.34,`image ${mm(R*2)}`); } }
  box.innerHTML=`<svg viewBox="-30 -10 ${(W1-W0)*k+60} ${(top+.17)*k}" style="max-width:${so?720:980}px;margin:auto" role="img" aria-label="Coupe cotée de l’écran">${o.join('')}</svg>`;
}
