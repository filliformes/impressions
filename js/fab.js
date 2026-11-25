// Fabrication : liste des pièces, colis, montage, dessins et fichiers de coupe pour le système choisi.
import { FT } from './data.js';
import { optics, SYS, GAP } from './optics.js';
import { buildScreen, PIED, TUBE, MAT_D } from './screen.js';
import { EIS } from './eisode.js';

const fr=(v,d=0)=>v.toLocaleString('fr-CA',{minimumFractionDigits:d,maximumFractionDigits:d}), mm=v=>fr(Math.round(v*1000)), $=q=>document.querySelector(q);
const ALU=2700, tubeKg=(d,e)=>Math.PI*(d*d-(d-2*e)*(d-2*e))/4*ALU, INK='#191c34', BLUE='#333a7c', RED='#c4232c', GREY='#8a8c98', LINE='#c9c9c4';

// ------------------------------------------------------------ données de fabrication
export function fab(s){
  const O=optics(s), R=O.R, H=O.H, P=O.P, sc=buildScreen(s), out={ O,P,sec:[],colis:[],etapes:[],regl:[],ouvert:[],dxf:[],notes:[] }; let kg=0;
  const row=(L,rep,nom,q,mat,cote,m)=>{ const t=(m||0)*q; kg+=t; L.push([rep,nom,q,mat,cote,t?`${fr(t,1)} kg`:'']); return t; };
  const mir=sc.mirOut?sc.mirOut(.018):null, area=p=>Math.abs(p.reduce((a,[x,y],i)=>{ const [u,v]=p[(i+1)%p.length]; return a+x*v-u*y; },0)/2), ext=p=>{ const X=p.map(a=>a[0]), Y=p.map(a=>a[1]); return [Math.max(...X)-Math.min(...X),Math.max(...Y)-Math.min(...Y)]; };
  if(mir) out.dxf.push(['miroir',{poly:[mir]}]);
  const screw='Vis à bouton ou goupilles : aucun outil au montage.';
  if(s.sys==='dessous'){
    const F=O.f, Rt=O.Rt, Rf=O.Rf, arc=2*Math.PI*Rt/PIED-.004, chord=2*Rt*Math.sin(Math.PI/PIED), leg=Math.hypot(Rf-Rt,H-.06), th=Math.atan2(Rt-Rf,H-.06)*180/Math.PI, tr=Rf-.012, b=sc.banc, kt=tubeKg(TUBE,.003), A=[], B=[], C=[];
    row(A,'A1','Arc d’anneau',6,'Tube alu 6061 Ø 38 × 3, cintré',`rayon à l’axe ${mm(Rt)}, développé ${mm(arc)}, corde ${mm(chord)}`,arc*kt);
    row(A,'A2','Manchon de jonction',6,'Rond alu Ø 31,5',`longueur 140, deux boutons à ressort`,.14*Math.PI*.0315**2/4*ALU);
    row(A,'A3','Nœud de pied',6,'Alu usiné (prototype : PA-CF imprimé)',`douille Ø 38, inclinée de ${fr(th,1)}° vers l’intérieur`,.35);
    row(A,'A4','Pied',6,'Tube alu Ø 38 × 3',`longueur ${mm(leg)}`,leg*kt);
    row(A,'A5','Patin réglable',6,'Caoutchouc, tige M10','Ø 75, course ± 15',.15);
    row(A,'A6','Traverse basse',6,'Tube alu Ø 22 × 2',`longueur ${mm(tr)}, crochets en bout`,tr*tubeKg(.022,.002));
    const sl=Math.hypot(Rf-Rt,H-.07);
    row(C,'C1','Toile de rétroprojection',1,'PVC gris très diffusant, gain sous 1',`disque Ø ${mm((Rt+.02)*2)} + ourlet 60, œillets aux 100`,Math.PI*(Rt+.08)**2*.45);
    row(C,'C2','Sandows à crochet',Math.round(2*Math.PI*Rt/.1),'Élastique Ø 6','tension sous l’anneau',.015);
    row(C,'C3','Jupe, deux moitiés',2,'Tissu blanc doublé noir opaque, velcro',`cône : haut Ø ${mm((Rt+.026)*2)}, bas Ø ${mm((Rf+.028)*2)}, pente ${mm(sl)}`,Math.PI*(Rt+Rf)*sl*.35/2);
    if(F){ const [mw,ml]=ext(mir), ma=area(mir);
      row(B,'B1','Banc optique, demi-planche',2,'Contreplaqué de bouleau 18',`${mm(b.l/2)} × ${mm(b.w)}, deux charnières`,b.l/2*b.w*12.2);
      row(B,'B2','Miroir à première surface',1,'Verre 4 mm ou film tendu',`contour DXF, ${mm(ml)} × ${mm(mw)}, incliné à ${fr(Math.abs(F.ph),1)}°`,ma*10);
      row(B,'B3','Cadre et jambes du miroir',1,'Alu 20 × 20 et Ø 18','trois vis de réglage M6 en triangle',1.8);
      row(B,'B4','Berceau du projecteur',1,'Alu 4 mm plié',`${mm(P.w-.02)} × ${mm(P.dep-.02)}, quatre pattes M8, incliné à ${fr(Math.abs(F.tilt))}°`,1.1);
      row(B,'B5',`Projecteur ${P.court}`,1,P.prix,`${mm(P.w)} × ${mm(P.dep)} × ${mm(P.up+P.dn)}`,P.kg);
      row(B,'B6','Goupilles de repère',2,'Acier Ø 10','le banc se place toujours au même endroit, sur deux traverses',.05);
      out.dxf.push(['banc-demi',{poly:[[[0,0],[b.l/2,0],[b.l/2,b.w],[0,b.w]]],circ:[[.03,.03,.005],[.03,b.w-.03,.005]]}]);
      out.colis.push([`Étui rigide du miroir`,`${mm(ml+.08)} × ${mm(mw+.08)} × 120`,`${fr(ma*10+4,0)} kg`],[`Banc optique plié, berceau monté`,`${mm(b.l/2)} × ${mm(b.w)} × 220`,`${fr(b.l*b.w*12.2+3,0)} kg`]); }
    out.dxf.push(['toile',{circ:[[0,0,Rt+.02],[0,0,Rt+.08]]}]);
    out.sec.push(['Structure',A],['Toile et jupe',C],['Optique',B]);
    const lg=Math.max(chord,leg,tr);
    out.colis.unshift(['Sac de tubes (anneau, pieds, traverses)',`${mm(lg)} × 300 × 250`,`${fr(6*(arc+leg)*kt+6*tr*tubeKg(.022,.002)+5,0)} kg`]); out.colis.push(['Sac de tissu (toile roulée, jupe)',`${mm(Math.min(1.5,Rt*1.2))} × 250 × 250`,'4 kg'],['Valise du projecteur et câbles','550 × 400 × 250','8 kg']);
    out.etapes=['Assembler les six arcs au sol, à plat, avec les manchons.','Enfiler les six nœuds et les six pieds, retourner l’anneau sur ses pieds.','Accrocher les six traverses basses : la structure devient rigide.','Régler les patins : anneau de niveau à 2 mm près.','Poser la toile et les sandows en étoile, deux par deux, jusqu’à une flèche de moins de 5 mm.','Glisser le banc plié sous la toile, le déplier, le goupiller sur les traverses, poser le miroir puis le projecteur.','Allumer une mire : régler la hauteur de l’image avec les pattes du berceau, le trapèze avec les trois vis du miroir, la mise au point.','Fermer les deux moitiés de la jupe.'];
    out.regl=['Anneau : cercle à ± 2 mm, sinon la toile plisse.','Miroir : 0,5° d’erreur déplace l’image d’environ '+(F?fr(2*Math.tan(.5*Math.PI/180)*F.T*700):'')+' mm. D’où trois vis fines et des repères gravés.','Berceau : course de ± 20 mm en hauteur et ± 3° en inclinaison, pour accepter un autre projecteur.'];
    out.ouvert=['Le manuel ViewSonic contient une consigne générale de 15° d’inclinaison au plus, alors que la page du produit promet n’importe quel angle. À faire confirmer par écrit par ViewSonic avant d’acheter.','Échantillon de toile à essayer avec un projecteur emprunté : luminosité sur les côtés, point chaud, grain.','La toile supporte une main, pas un coude : un garde-corps visuel ou une plaque rigide si le public peut s’appuyer.'];
  } else {
    const A=[], B=[], C=[], plate=H>=.03;
    if(plate){ const ks=Math.PI*R*R/6*12.2; row(A,'A1','Segment de plateforme',6,'Contreplaqué de bouleau 18, dessus peint blanc mat',`secteur de 60°, rayon ${mm(R)}, corde ${mm(R)}`,ks); row(A,'A2','Pied réglable',18,'Alu et caoutchouc',`hauteur ${mm(H-.02)}, trois par segment`,.18); row(A,'A3','Grenouillère de jonction',12,'Acier','deux par joint',.12); row(A,'A4','Chant',6,'Alu 2 mm peint blanc','bande de 60, vissée sur le segment',.3); out.dxf.push(['segment',{poly:[[[0,0],...Array.from({length:41},(_,i)=>{ const a=i/40*Math.PI/3; return [Math.cos(a)*R,Math.sin(a)*R]; })]],circ:[[.22*Math.cos(Math.PI/6),.22*Math.sin(Math.PI/6),.0045],...[-.38,.38].map(t=>[Math.cos(Math.PI/6+t)*(R-.1),Math.sin(Math.PI/6+t)*(R-.1),.0045])]}]); out.colis.push(['Plateforme : six segments empilés',`${mm(R)} × ${mm(R)} × 160`,`${fr(6*ks+6,0)} kg (deux paquets de trois)`]); }
    else { row(A,'A1','Disque de vinyle blanc mat',1,'Vinyle de projection au sol, antidérapant',`Ø ${mm(R*2)}`,Math.PI*R*R*.6); out.colis.push(['Vinyle roulé',`${mm(Math.min(2*R,1.9))} × Ø 120`,'3 kg']); out.dxf.push(['vinyle',{circ:[[0,0,R]]}]); }
    out.sec.push(['Surface',A]);
    if(s.sys==='mat'){ const m=O.m, rail=s.accroche==='rail', cw=P.w+.07, cl=(-m.xa+GAP+P.dep+.07)-(m.xm-.05), chh=m.top-(m.yA-P.h/2-.02), [mw,ml]=ext(mir), y0=m.yA-P.h/2-.02;
      row(B,'B1','Caisson',1,'Alu 2 mm plié, peint blanc, perforé',`${mm(cl)} × ${mm(cw)} × ${mm(chh)}`,(2*(cl*cw+cl*chh+cw*chh))*.8*.002*ALU);
      row(B,'B2','Miroir à première surface',1,'Verre 3 mm',`contour DXF, ${mm(ml)} × ${mm(mw)}, à 45°`,area(mir)*7.5); row(B,'B3','Platine de miroir',1,'Alu 4 mm','trois vis de réglage M5',.4); row(B,'B4',`Projecteur ${P.court}`,1,P.prix,`${mm(P.w)} × ${mm(P.dep)} × ${mm(P.h)}`,P.kg); row(B,'B5','Élingue de sécurité',1,'Câble d’acier Ø 3','obligatoire au-dessus du public',.2);
      if(rail){ row(C,'C1','Tige filetée M10 + écrou-frein',2,'Acier',`longueur ${mm(s.plafond/1000-.0254-m.top+.03)}`,.25); row(C,'C2','Profilé transversal 80/20, 1 po',1,'Alu 1010',`longueur ${mm(cl)}`,cl*.8); row(C,'C3','Écrous en T et équerres 80/20',8,'Acier, série 10','pour rail de 1 po',.05); }
      else { const kt=tubeKg(MAT_D,.004); row(C,'C1','Mât, section basse',1,'Tube alu Ø 70 × 4',`longueur ${mm(1.19)}`,1.19*kt); row(C,'C2','Mât, section haute',1,'Tube alu Ø 70 × 4',`longueur ${mm(y0+.04-1.2+.12)}, emboîtement 120`,(y0+.04-1.08)*kt); row(C,'C3','Manchon',1,'Alu Ø 62','longueur 240',.5); row(C,'C4','Platine',1,'Acier 10 mm','600 × 600, poignées',.36*.01*7850); row(C,'C5','Poids',2,'Fonte','10 kg chacun',10); row(C,'C6','Jambe de force',3,'Tube Ø 22','longueur 300',.1); out.dxf.push(['platine',{poly:[[[0,0],[.6,0],[.6,.6],[0,.6]]],circ:[[.3,.6+(m.xm+R+.012),.0355]]}]); out.colis.push(['Mât en deux sections','1 310 × Ø 80',`${fr((1.19+y0-1.04)*kt+1,0)} kg`],['Platine','600 × 600 × 60','28 kg'],['Poids','deux fois 10 kg','20 kg']);
        const load=P.kg+6, arm=.45, M0=load*9.81*arm, tot=load+28.3+20+10; out.notes.push(`Stabilité : le caisson (environ ${fr(load)} kg) est en porte-à-faux de 45 cm, soit ${fr(M0)} N·m. Le pied de ${fr(tot)} kg résiste à environ ${fr(tot*9.81*.3)} N·m vers l’intérieur. Il reste ${fr((tot*9.81*.3-M0)/1.2)} N de poussée à 1,2 m : protéger le mât ou l’ancrer à la plateforme.`); }
      out.colis.push(['Caisse du caisson (projecteur retiré)',`${mm(cl)} × ${mm(cw)} × ${mm(chh)}`,'7 kg'],['Valise du projecteur','650 × 550 × 300',`${fr(P.kg+4,0)} kg`]);
      out.sec.push(['Caisson',B],[rail?'Accroche au rail 80/20':'Mât',C]);
      out.etapes=rail?[`Poser les écrous en T dans le rail 2 d’EISODE, à ${fr(s.px/100-EIS.rx[0],2)} m de son bout gauche.`,'Lever le caisson vide à deux personnes, serrer les tiges, poser l’élingue.','Mettre le caisson de niveau avec les écrous des tiges.','Glisser le projecteur, brancher courant et image.','Monter la plateforme : six segments, grenouillères, niveau.','Mire ronde : régler le zoom, le décentrement, puis les trois vis du miroir.']:['Poser la platine et les poids entre PHASMA et ESSAIM.','Monter la section basse et ses jambes de force.','Au sol, fixer le caisson sur la section haute ; emboîter à deux personnes.','Glisser le projecteur, brancher courant et image, poser l’élingue.','Monter la plateforme : six segments, grenouillères, niveau.','Mire ronde : régler le zoom, le décentrement, puis les trois vis du miroir.'];
      out.regl=['Image : le bord du cercle doit tomber à 5 mm du chant de la plateforme.',`Décentrement utilisé : ${fr(m.off*100)} %.`,'Miroir taillé au contour du cercle : il coupe aussi le rectangle de noir du projecteur.'];
      out.ouvert=[rail?'Charge permise par rail à demander à Artificiel, et accord pour percer ou non.':'Essai de stabilité avec le vrai projecteur avant le public.',P.off[0]===P.off[1]||P.court.includes('HT')?'Décalage d’image à mesurer sur l’appareil.':'Décentrement vertical maximal à vérifier quand l’image est en 16:9 plein cadre.','Les mains des joueur·euse·s restent hors du faisceau ; une personne penchée au-dessus du disque fait de l’ombre.'];
    } else { const p=O.p, Rp=p.Rp, ka=(.07*.07-.062*.062)*ALU; row(B,'B1','Pied, section basse',3,'Tube alu 70 × 70 × 4','longueur 1 200, platine 340 × 340 × 14',1.2*ka+12.7); row(B,'B2','Pied, section haute',3,'Tube alu 70 × 70 × 4',`longueur ${mm(p.top-1.2)}`,(p.top-1.2)*ka); row(B,'B3','Traverse',3,'Tube alu 80 × 80 × 4',`longueur ${mm(Rp)}`,Rp*(.08*.08-.072*.072)*ALU); row(B,'B4','Moyeu et caisson',1,'Alu plié','voir le modèle 3D',12); row(B,'B5',`Projecteur ${P.court}`,1,P.prix,`${mm(P.dim[0])} × ${mm(P.dim[1])} × ${mm(P.dim[2])}`,P.kg); if(p.mir) row(B,'B6','Miroir à première surface',1,'Verre 4 mm',`${mm(p.mirH)} × ${mm(p.mirW)}, à 45°`,p.mirH*p.mirW*10); out.sec.push(['Portique',B]); out.colis.push(['Six sections de pieds','1 250 × 250 × 250','25 kg'],['Trois platines','340 × 340 × 60','38 kg'],['Trois traverses',`${mm(Rp)} × 250 × 100`,`${fr(3*Rp*(.08*.08-.072*.072)*ALU+2,0)} kg`],['Moyeu et caisson','700 × 600 × 400','15 kg'],['Projecteur','650 × 550 × 300',`${fr(P.kg+4,0)} kg`]);
      out.etapes=['Placer les trois platines entre les instruments, au gabarit.','Monter les pieds bas, puis les pieds hauts.','Assembler moyeu et traverses au sol, lever à trois personnes.','Glisser le projecteur et le miroir, brancher, élinguer.','Monter la plateforme et régler l’image.']; out.regl=['Moyeu au centre à 5 mm près.']; out.ouvert=['Plus lourd et plus long à monter que le mât ou l’accroche au rail. À garder pour un lieu sans plafond utilisable.']; }
  }
  out.notes.push(screw); out.kg=kg; return out;
}
// ------------------------------------------------------------ DXF (R12, millimètres)
function dxf(d){ const L=['0','SECTION','2','ENTITIES']; (d.poly||[]).forEach(p=>{ L.push('0','POLYLINE','8','0','66','1','70','1'); p.forEach(([x,y])=>L.push('0','VERTEX','8','0','10',(x*1000).toFixed(3),'20',(y*1000).toFixed(3))); L.push('0','SEQEND'); }); (d.circ||[]).forEach(([x,y,r])=>L.push('0','CIRCLE','8','0','10',(x*1000).toFixed(3),'20',(y*1000).toFixed(3),'40',(r*1000).toFixed(3))); L.push('0','ENDSEC','0','EOF'); return L.join('\r\n'); }
function dl(nom,txt,type){ const u=URL.createObjectURL(new Blob([txt],{type})), a=document.createElement('a'); a.href=u; a.download=nom; a.click(); setTimeout(()=>URL.revokeObjectURL(u),4000); }

export function drawFab(S,again){
  const f=fab(S), box=$('#fabIn'), esc=t=>t;
  const tbl=([t,rows])=>`<h3>${t}</h3><div class="scroll"><table class="bom"><tr><th>Rep.</th><th>Pièce</th><th>Qté</th><th>Matière</th><th>Cotes (mm)</th><th>Masse</th></tr>${rows.map(r=>`<tr><td>${r[0]}</td><td><strong>${r[1]}</strong></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</table></div>`;
  box.innerHTML=`<h2>${SYS[S.sys].titre}</h2><p class="lede">Image de ${fr(S.diam,2)} pi (${fr(f.O.R*2,2)} m), ${f.P.court}. La fiche suit les réglages des onglets Espace et Écran. Masse totale estimée : ${fr(f.kg)} kg.</p>
  <div class="fig" id="fabC"></div><div class="dls"></div>${f.sec.map(tbl).join('')}
  <h3>Transport</h3><div class="scroll"><table class="bom"><tr><th>Colis</th><th>Encombrement (mm)</th><th>Masse</th></tr>${f.colis.map(c=>`<tr><td><strong>${c[0]}</strong></td><td>${c[1]}</td><td>${c[2]}</td></tr>`).join('')}</table></div>
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
  const O=optics(S), R=O.R, H=O.H, k=300, pl=S.plafond/1000, hi=S.sys!=='dessous', W0=-1.75, W1=1.75, top=hi?pl+.12:H+.32, X=x=>(x-W0)*k, Y=y=>(top-y)*k, o=[];
  const ln=(a,b,c=INK,w=2,d='')=>o.push(`<path d="M${X(a[0])} ${Y(a[1])}L${X(b[0])} ${Y(b[1])}" stroke="${c}" stroke-width="${w}" ${d?`stroke-dasharray="${d}"`:''} fill="none"/>`), pg=(p,f='#fff',c=INK,w=1.6,op=1)=>o.push(`<path d="M${p.map(q=>`${X(q[0])} ${Y(q[1])}`).join('L')}z" fill="${f}" fill-opacity="${op}" stroke="${c}" stroke-width="${w}"/>`), rc=(x0,y0,x1,y1,f,c)=>pg([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],f,c), tx=(x,y,t,a='middle',z=19)=>o.push(`<text x="${X(x)}" y="${Y(y)}" text-anchor="${a}" font-size="${z}">${t}</text>`);
  const dh=(x0,x1,y,t)=>{ ln([x0,y],[x1,y],RED,1.4); [x0,x1].forEach(x=>ln([x,y-.018],[x,y+.018],RED,1.4)); tx((x0+x1)/2,y+.02,t); }, dv=(x,y0,y1,t)=>{ ln([x,y0],[x,y1],RED,1.4); [y0,y1].forEach(y=>ln([x-.018,y],[x+.018,y],RED,1.4)); o.push(`<text transform="translate(${X(x)-7} ${Y((y0+y1)/2)}) rotate(-90)" text-anchor="middle" font-size="19">${t}</text>`); };
  ln([W0,0],[W1,0],INK,3);
  if(S.sys==='dessous'){ const F=O.f, Rt=O.Rt, Rf=O.Rf;
    if(F){ const p2=m=>[m[0],m[1]]; pg([p2(F.m1),p2(F.m2),[R,H],[-R,H]],BLUE,'none',0,.12); pg([F.L,p2(F.m1),p2(F.m2)],BLUE,'none',0,.2); ln(p2(F.m1),[-R,H],BLUE,1.2); ln(p2(F.m2),[R,H],BLUE,1.2); ln(F.L,p2(F.m1),BLUE,1.2); ln(F.L,p2(F.m2),BLUE,1.2); }
    [-1,1].forEach(q=>{ ln([q*Rt,H-.02],[q*Rf,.02],INK,10); ln([q*(Rt+.026),H-.03],[q*(Rf+.028),.04],GREY,2,'7 5'); o.push(`<circle cx="${X(q*Rt)}" cy="${Y(H-.022)}" r="${TUBE/2*k}" fill="#fff" stroke="${INK}" stroke-width="2"/>`); }); ln([-Rt-.012,H],[Rt+.012,H],BLUE,5);
    if(F){ const n=[-Math.sin(F.fa),Math.cos(F.fa)]; ln([F.m1[0]-n[0]*.006,F.m1[1]-n[1]*.006],[F.m2[0]-n[0]*.006,F.m2[1]-n[1]*.006],INK,6); pg(F.body,INK,INK,1,.88); const b=buildScreen(S).banc; rc(b.x0,.006,b.x1,.024,'#cdb78f',INK); tx((F.x0+F.x1)/2,F.z1+.04,O.P.court); tx((F.m1[0]+F.m2[0])/2-.1,(F.m1[1]+F.m2[1])/2-.02,`miroir ${fr(Math.abs(F.ph),1)}°`,'end'); dh(b.x0,b.x1,.06,`banc ${mm(b.l)}`); }
    dh(-R,R,H+.07,`image ${mm(R*2)}`); dh(-Rt-.02,Rt+.02,H+.17,`anneau ${mm(Rt*2+.04)}`); dh(-Rf,Rf,.16,`au sol ${mm(Rf*2)}`); dv(-Rt-.2,0,H,mm(H)); }
  else { ln([W0,pl],[W1,pl],INK,3); tx(W1-.02,pl+.03,`plafond ${mm(pl)}`,'end');
    if(H>.03){ rc(-R,H-.018,R,H,'#fff',INK); [-R+.1,-.22,.22,R-.1].forEach(x=>rc(x-.02,0,x+.02,H-.018,'#333',INK)); } ln([-R,H],[R,H],BLUE,5);
    if(S.sys==='mat'){ const m=O.m, P=O.P, A=[m.a[0],m.a[2]], B=[m.b[0],m.b[2]], L=[-m.xa+GAP,m.yA], yb=m.yA-P.h/2; pg([A,B,[R,H],[-R,H]],BLUE,'none',0,.12); ln(A,[-R,H],BLUE,1.2); ln(B,[R,H],BLUE,1.2); ln(L,A,BLUE,1); ln(L,B,BLUE,1); rc(m.xm-.05,yb-.02,-m.xa+GAP+P.dep+.07,m.top,'none',INK); rc(-m.xa+GAP+.012,yb,-m.xa+GAP+P.dep,yb+P.h,INK,INK); ln(A,B,INK,6); tx(-m.xa+GAP+P.dep+.1,m.yA,P.court,'start');
      if(S.accroche==='rail'){ EIS.rails.forEach((r,i)=>{ const x=r+.0127-(EIS.rails[1]+.0127-m.xm-.06); if(x>W0&&x<W1) rc(x-.0127,pl-.0254,x+.0127,pl,i===1?RED:'#c3c6ca',INK); }); ln([m.xm+.06,m.top],[m.xm+.06,pl-.0254],INK,5); ln([-m.xa+GAP+P.dep,m.top],[-m.xa+GAP+P.dep,pl-.0254],GREY,2); tx(m.xm+.06,pl+.03,'rail 2'); }
      else { rc(m.xm-MAT_D/2,.01,m.xm+MAT_D/2,yb-.02,'#fff',INK); rc(-R-.612,0,-R-.012,.01,INK,INK); }
      dh(m.xm,0,H+.12,`${mm(-m.xm)}`); dv(W1-.32,0,m.yA,`axe ${mm(m.yA)}`); dv(W1-.14,0,m.top,mm(m.top)); dh(-R,R,-.0+H+.3,`image ${mm(R*2)}`); }
    else { const p=O.p, Rp=p.Rp, y=p.mir?p.axisY:p.lensY, rI=Math.min(R,p.circ/2); pg([[0,y],[rI,H],[-rI,H]],BLUE,'none',0,.12); [-1,1].forEach(q=>{ rc(q*Rp-.035,0,q*Rp+.035,p.top,'#fff',INK); rc(q*Rp-.17,0,q*Rp+.17,.014,INK,INK); }); rc(-Rp,p.top-.08,Rp,p.top,'#fff',INK); if(p.mir){ ln([.1,y+.1],[-.1,y-.1],INK,5); rc(-.21-O.P.dim[1],y-O.P.dim[2]/2,-.24,y+O.P.dim[2]/2,INK,INK); } else rc(-O.P.dim[2]/2,p.lensY,O.P.dim[2]/2,p.rear,INK,INK); dv(W1-.14,0,p.top,mm(p.top)); dh(-Rp,Rp,H+.2,mm(Rp*2)); } }
  box.innerHTML=`<svg viewBox="-30 -10 ${(W1-W0)*k+60} ${(top+.1)*k}" style="max-width:980px;margin:auto" role="img" aria-label="Coupe cotée de l’écran">${o.join('')}</svg>`;
}
