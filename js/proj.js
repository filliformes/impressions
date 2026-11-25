// Projection par le haut : un projecteur dans le caisson d'un portique, pointé vers une plateforme basse.
import { FT } from './data.js';

export const PLAFOND = 2.57;       // EISODE, relevé sur le plan (8 pi 5 po)
export const TOP_GAP = .08;        // dessus du portique sous le plafond (chaleur, accès)
export const MIRROR_GAP = .2;      // lentille -> centre du miroir à 45°
export const MARGE = 1.03;         // le cercle occupe 97 % du petit côté de l'image
export const GAIN = .85;           // peinture de projection blanc mat

// Fiches techniques (sources dans src). dim = [largeur, profondeur avec objectif, hauteur] en m.
// tr = rapport de projection (distance / largeur d'image), [min, max] au zoom.
// off = distance de l'axe de l'objectif au centre de l'image, en fraction de la hauteur d'image (0 = centré).
// Chiffres relevés le 25 novembre 2026 dans des extraits des pages des fabricants (sources ci-dessous), à confirmer
// auprès du fournisseur avant achat. Prix de rue approximatifs en $ US.
export const PROJ = {
  lk953:{ court:'BenQ LK953ST', nom:'BenQ LK953ST', techno:'1 DLP, laser', lm:5000, res:[3840,2160], tr:[.81,.89], off:0, shift:'V ±60 %, H ±23 %',
    dim:[.49,.38,.159], kg:9.1, dB:'40 / 38', prix:'liste de prêt', libre:'360°, documenté', pret:true,
    desc:'Laser 4K de la liste de prêt, décentrement vertical de ± 60 %. Au centre d’un portique, il lui faut le miroir.',
    src:['https://www.benq.com/en-us/business/projector/lk953st/specifications.html'] },
  benq:{ court:'BenQ LU960ST2', nom:'BenQ LU960ST2', techno:'1 DLP, laser', lm:5200, res:[1920,1200], tr:[.5,.5], off:0, shift:'V ±55 %, H ±23 %',
    dim:[.48,.402,.183], kg:12, dB:'37 / 35', prix:'7 100 à 9 000', libre:'360°, documenté',
    desc:'Objectif fixe très court (0,5 : 1) et décentrement : il tient pointé vers le bas, sans miroir, pour 6 à 8 pi. L’image dépasse le cercle, qui n’utilise qu’une partie des 1 200 pixels.',
    src:['https://www.benq.com/en-us/business/projector/lu960st2/specifications.html','https://www.benq.eu/content/dam/newb2b/en-eu/projector/lu960st2/LU960ST2_Datasheet_0223_EN.PDF'] },
  epson:{ court:'Epson PU1007W + ELPLU03S', nom:'Epson EB-PU1007W (ou PU1008W) avec objectif ELPLU03S', techno:'3LCD, laser', lm:7000, res:[1920,1200], tr:[.65,.78], off:0, shift:'V ±67 %, H ±30 %',
    dim:[.545,.53,.189], kg:19.5, dB:'33 / 29', prix:'9 000 à 14 000', prixNote:'avec l’objectif', libre:'360°, documenté', est:'profondeur avec objectif et masse estimées',
    desc:'Objectif interchangeable à zoom 0,65 à 0,78 : 1. Sur une plateforme de 300 mm, pointé vers le bas, il plafonne vers 6 pi ; couché avec un miroir à 45°, il remplit le cercle de 6 à 8 pi avec presque tous ses 1 200 pixels. Silencieux, lourd.',
    src:['https://epson.ca/For-Work/Projectors/Large-Venue/EB-PU1007W-WUXGA-3LCD-Laser-Projector-with-4K-Enhancement/p/V11HA34920','https://epson.com/Accessories/Projector-Accessories/Short-throw-%231-Zoom-Lens-ELPLU03S/p/V12H004UA3','https://files.support.epson.com/pdf/specs/specifications_ebpu2010series_en_r106.pdf'] },
  optoma:{ court:'Optoma ZU920TST', nom:'Optoma ProScene ZU920TST', techno:'1 DLP, laser', lm:9800, res:[1920,1200], tr:[.65,.75], off:0, shift:'V ±55 %, H ±25 %',
    dim:[.5,.45,.19], kg:14, dB:'38 / 36', prix:'≈ 10 000', libre:'360°, selon les revendeurs', est:'dimensions et masse estimées',
    desc:'Objectif fixe à zoom motorisé 0,65 à 0,75 : 1. Même géométrie que l’Epson : sur une plateforme de 300 mm, il faut le miroir pour dépasser 6,3 pi. Très lumineux, à baisser en mode éco.',
    src:['https://www.optomausa.com/product/proscene-zu920tst'] },
  l690:{ court:'Epson L690SU', nom:'Epson EB-L690SU', techno:'3LCD, laser', lm:6200, res:[1920,1200], tr:[.79,1.36], off:0, shift:'V ±50 %, H ±20 %',
    dim:[.44,.362,.151], kg:8.9, dB:'34 / 25', prix:'≈ 4 700 (liste)', libre:'360°, documenté',
    desc:'Le courte-focale courant à 0,8 : 1, pour comparer. Sous 10 pi et sur une plateforme de 300 mm, même couché avec un miroir, il ne dépasse pas 6,7 pi : il faudrait 2,9 m de trajet pour 7 pi.',
    src:['https://epson.com/For-Work/Projectors/Meeting-Room/PowerLite-L690SU-6,200-Lumen-Short-Throw-WUXGA-3LCD-Laser-Projector/p/V11HB31020'] }
};
export const DEFP = Object.keys(PROJ)[0];

export function hautOptics(s){
  const P=PROJ[s.proj]||PROJ[DEFP], D=s.diam*FT, plate=s.plateH/1000, asp=P.res[1]/P.res[0];
  const top=(s.plafond?s.plafond/1000:PLAFOND)-TOP_GAP, rear=top-.05, mir=s.montage==='miroir';
  const axisY=rear-(mir?P.dim[2]/2:0), lensY=mir?axisY:rear-P.dim[1];
  const d=(mir?MIRROR_GAP:0)+lensY-plate;          // chemin optique jusqu'à la plateforme
  const need=D*MARGE, hMin=d/P.tr[1]*asp, hMax=d/P.tr[0]*asp;
  const fit=need<=hMax+1e-9, fh=fit?Math.max(need,hMin):hMax, fw=fh/asp;
  const circ=Math.min(D,fh/MARGE);                  // cercle réellement dessiné
  const pitch=fh/P.res[1], lux=P.lm/(fw*fh);
  const o={ P,D,plate,top,rear,mir,lensY,axisY,d,asp,fh,fw,fit,circ,
    trReq:d/(need/asp), dMax:hMax/MARGE/FT, dMin:hMin/MARGE/FT,
    pitch:pitch*1000, pxCirc:circ/pitch, lux, cdm2:lux*GAIN/Math.PI,
    off:(P.off||0)*fh,                                // décalage de l'objectif dans le plan
    vY:plate+d };                                     // source virtuelle (au-dessus du miroir)
  o.mirW=mir?MIRROR_GAP*fw/d+.06:0; o.mirH=mir?(MIRROR_GAP*fh/d+.06)*Math.SQRT2:0;
  o.floorW=fw*o.vY/d; o.floorH=fh*o.vY/d;           // débord du noir au sol
  return o;
}
