// Cotes relevées dans les fichiers de François Auclair (casingPandore.3mf), en mm.
// Repère du case : x de gauche à droite, y de l'avant (0) vers l'arrière (180), z vers le haut.
export const CASE = {
  w: 266.4, d: 178.9, y0: 0.9, y1: 179.8,
  zBottom: 15.5, zPlate: 21.8, zDeck: 74.3, zPad: 90.1, zTop: 98.7,
  cx: 133.2, cy: 90.35,
  coverW: 201.5,
  coverProfile: [[0.9,74.3],[0.9,88.7],[110.1,88.7],[120.1,98.7],[180.1,98.7],[180.1,74.3]],
  skirtOuter: [20,20.9,246.4,159.8], skirtInner: [40,40.9,226.4,139.8],
  knobs: [[43,150.1,98.7],[83,150.1,98.7],[123,150.1,98.7],[163,150.1,98.7],[83,91.2,88.7],[123,91.2,88.7]],
  leds: [[43,137.6,98.7],[83,137.7,98.7],[123,137.8,98.7],[163,137.9,98.7],[102.2,91.8,88.7],
    ...[27.9,34,40.2,46.4].map(x=>[x,78.2,88.7]), ...[155.2,161.3,167.4,173.6].map(x=>[x,78.2,88.7])],
  pads: [[2.6,4.3],[128.9,4.3]], padSize: 69,
  buttons: [[80.9,11],[120.7,11],[100.7,42]],
  oled: [218.8,148.4,260.9,175.6], enc: [240.1,136.8], slider: [235.6,38.6,245.1,113.6], sliderKnobY: 76.1,
  text: [9.4,59.2,71.2,68.4],
  puck: {x:126.9,y:97.9,d:44.8,z0:1.6,z1:15.5}
};
// Perforations de la paroi gauche : 24 colonnes (y = 10,8 + 7 i), 5 rangées (z = 34,7 + 7 j), diamètre en mm
export const HOLES = [
 [6,5.6,5.2,4.83,4.47,4.13,3.83,3.57,3.36,3.24,3.21,3.31,3.54,3.89,4.32,4.8,5.24,5.45,5.36,5.11,4.78,4.4,3.97,3.52],
 [5.09,4.69,4.29,3.91,3.54,3.2,2.89,2.62,2.4,2.26,2.24,2.35,2.61,2.99,3.45,3.92,4.3,4.46,4.38,4.16,3.85,3.49,3.08,2.65],
 [4.19,3.78,3.38,2.99,2.63,2.28,1.96,1.69,1.48,1.35,1.32,1.44,1.72,2.13,2.59,3.03,3.35,3.47,3.4,3.2,2.92,2.58,2.2,1.79],
 [3.3,2.88,2.48,2.1,1.74,1.41,1.15,1,1.02,1.1,1.13,1.04,1.03,1.32,1.74,2.12,2.39,2.49,2.43,2.25,2,1.69,1.36,1.06],
 [2.41,2,1.62,1.27,1.03,1.04,1.25,1.52,1.77,1.94,1.98,1.78,1.39,1.06,1.04,1.27,1.47,1.54,1.49,1.35,1.16,1.01,1.06,1.33]
];
// Pandore Rev A0 dans le case : carte 260 x 110 x 1,6, dessus à z = 35,4
export const PCB = { x: 6.35, y: 69.6, zTop: 35.4, w: 260, d: 110, t: 1.6 };
// [nom, u le long du bord, forme, A, B, z au-dessus de la carte, saillie]
export const BACK = [
  ['VOL',5.9,'c',6.2,0,6.53,9.2],['PHONES',19,'c',5,0,2.45,1.8],['OUT',40.52,'r',10.94,30,16.01,8.1],
  ['IN2',64.01,'c',23.8,0,15.03,9],['IN1',91.41,'c',23.8,0,15.03,9],['MIDIOUT',123.9,'r',20,21.1,10.58,0.9],
  ['MIDIIN',144.7,'r',20,21.1,10.58,0.9],['ETH1',173.27,'r',17.17,14.14,6.56,2.6],['HDMI',192.4,'r',15,6,3.12,1.9],
  ['USB2',212.5,'r',14.5,15.45,8.2,2],['USB3',230.4,'r',14.5,15.62,8.53,2],['DC',245.8,'r',10,9,4.53,1]
];
export const RIGHT = [['DIO',21.81,20.4,8.1,4.03],['AIO',44.69,20.4,8.1,4.03],['GROVE B',63.75,10,4.7,2.33],['GROVE A',77,10,4.7,2.33],['VIN',88.2,8.4,8.5,5]];
export const BASE_H = 80;        // hauteur de la base molle, estimée sur les rendus de François
export const DRIVER = { d: 261, cut: 233, depth: 129, total: 142, kg: 3.95 }; // coaxial 10 po de référence (B&C 10CXN64)
export const SILICONE = { bleu:'#2b316e', noir:'#1d1e22', rouge:'#b8282b', gris:'#8c9097', jaune:'#d2a62c' };
export const INSTR = {
  RES:    { nom:'RES',    role:'les traces du passé' },
  PHASMA: { nom:'PHASMA', role:'l’écoute percussive de la salle' },
  ESSAIM: { nom:'ESSAIM', role:'l’ambiance' }
};
export const FT = 0.3048;

// BenQ HT2150ST (liste de prêt, cinq exemplaires) : 379 × 277 × 122 mm, 3,6 kg, rapport 0,69, décalage de 102,5 à 105 %.
// up/dn : boîtier du côté de l'image et du côté opposé, depuis l'axe de l'objectif (m)
const HT = { nom:'BenQ HT2150ST', aspect:16/9, px:1080, lm:2200, tr:.69, s:[.525,.55], dep:.277, up:.04, dn:.085, w:.379 };
export const PROJ = {
  duo:{ ...HT, n:2, titre:'Deux HT2150ST', court:'Dos à dos au centre, un miroir à 45° chacun, un demi-disque chacun.' },
  solo:{ ...HT, n:1, titre:'Un HT2150ST', court:'Un seul projecteur et un miroir à 45°. Plus simple, image plus petite.' }
};
