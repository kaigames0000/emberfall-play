const OUTLINE = '#1b1926', DROP_ANCHOR = [.5, .94];
const shape = (body, shade, bevel, crest, grip = [.5, .5]) => ({body, shade, bevel, crest, grip});
// Silhouettes, facets and grip anchors share a 32px drawing grid.
const FORMS = {
 sword:shape('M3 26 6 22 9 23 12 20 9 17 12 14 15 16 25 5 30 2 29 8 18 20 19 22 16 25 14 22 10 27 10 29 6 30Z','M14 19 17 19 28 6 27 10 18 20 19 22 16 25 14 22 10 27 10 29 7 29 8 25Z','M15 16 25 5 28 4 17 18 16 20 14 20 11 17 12 16Z',[21,12,.55],[.25,.79]),
 greatsword:shape('M2 27 7 22 10 23 12 20 9 16 12 13 16 15 24 4 30 2 30 9 20 20 21 23 18 26 14 23 9 29 5 31Z','M7 27 17 19 29 5 29 9 20 20 21 23 18 26 14 23 9 29 5 31Z','M15 16 24 4 29 3 26 7 17 18 15 19 11 16 12 15Z',[22,11,.67],[.24,.80]),
 dagger:shape('M4 27 9 21 12 22 15 19 12 16 14 13 17 14 21 8 29 4 28 12 21 20 22 22 19 25 17 22 11 28 8 30Z','M9 27 18 18 28 7 28 12 21 20 22 22 19 25 17 22 11 28 8 30Z','M17 14 21 8 27 5 22 12 18 17 15 16 14 15Z',[22,13,.47],[.28,.78]),
 axe:shape('M4 27 17 13 14 11 15 7 22 3 29 5 30 10 27 17 22 19 20 17 8 30Z','M6 27 20 13 26 14 29 9 27 17 22 19 20 17 8 30Z','M16 9 22 4 28 6 28 8 22 7 18 11 17 11Z',[24,10,.66],[.27,.79]),
 greataxe:shape('M3 26 14 15 9 13 8 8 13 3 18 3 19 8 23 10 27 6 31 10 31 16 25 22 21 21 19 17 7 30Z','M5 28 20 12 24 16 29 11 29 17 25 22 21 21 19 17 7 30Z','M10 9 14 5 17 5 18 9 21 11 18 13 13 10 12 12Z',[24,15,.59],[.27,.77]),
 wand:shape('M4 27 16 15 15 11 19 9 19 5 24 2 30 8 28 13 25 14 23 19 20 18 8 30Z','M6 28 19 15 23 16 25 11 30 8 28 13 25 14 23 19 20 18 8 30Z','M20 8 24 3 28 8 24 12 23 15 19 14 17 12 21 12Z',[24,8,.55],[.28,.78]),
 staff:shape('M3 28 18 13 16 10 17 5 21 3 24 5 28 3 31 8 28 13 27 18 22 19 21 17 7 31Z','M5 29 22 12 25 14 29 8 28 13 27 18 22 19 21 17 7 31Z','M18 9 18 6 21 4 24 7 28 5 29 8 25 11 25 14 22 16 20 13 22 10 21 7Z',[24,10,.68],[.28,.73]),
 bow:shape('M5 29 3 27 4 20 6 19 5 16 7 11 11 9 12 6 17 3 25 3 28 1 30 3 29 6 27 8 8 29Z M9 24 23 8 18 8 13 11 11 15 12 18 10 21Z','M6 26 7 21 9 19 8 16 10 12 14 10 17 6 25 6 27 4 28 5 27 8 18 8 13 11 11 15 12 18 10 21 9 24Z','M5 24 6 20 8 19 8 16 7 15 9 11 12 10 12 12 10 14 11 17 10 20 8 21 7 26Z M15 8 18 4 24 4 22 6 18 6Z',[8,17,.49],[.27,.56]),
 shield:shape('M5 8 16 3 27 8 26 20 21 26 16 30 11 26 6 20Z','M16 5 26 9 25 20 20 26 16 29Z','M7 9 15 5 15 8 9 11 10 20 13 24 11 24 8 20Z',[16,15,1],[.5,.47]),
 towerShield:shape('M6 5 16 1 26 5 27 17 23 25 16 31 9 25 5 17Z','M16 3 25 6 26 17 22 25 16 29Z','M7 7 15 3 15 6 9 9 9 19 12 24 10 24 7 18Z M19 10h2v11h-2Z',[16,15,1.05],[.5,.47]),
 tome:shape('M3 9 7 5 14 5 16 8 18 5 25 5 29 9 29 25 24 23 18 24 16 27 14 24 8 23 3 25Z','M3 21 8 19 14 21 16 24 18 21 24 19 29 21 29 25 24 23 18 24 16 27 14 24 8 23 3 25Z','M5 10 8 8 14 9 15 12 15 21 13 19 8 17 5 18Z M18 11 20 9 25 8 27 10 27 13 23 12 19 14Z',[22,16,.72],[.5,.56]),
 quiver:shape('M8 2 12 2 16 11 17 4 22 3 23 11 27 11 26 20 23 30 12 30 8 17 10 13 6 5Z','M16 15 24 14 26 12 25 20 22 29 17 29 18 23Z','M9 4 11 4 16 13 13 13Z M18 7 20 5 21 6 20 13 18 13Z M10 16 13 15 15 25 14 27 12 24Z',[18,20,.72],[.5,.60]),
 helm:shape('M4 14 6 8 12 4 20 4 26 8 28 14 27 26 22 28 19 26 19 22 13 22 13 26 10 28 5 26Z','M16 5 21 6 26 10 27 16 27 25 23 27 20 25 20 21 16 20Z','M6 14 8 9 12 6 16 6 16 9 12 10 10 13 8 14 8 24 6 23Z M11 17h10v2H11Z',[16,13,.66]),
 chest:shape('M10 4 14 8 18 8 22 4 27 7 30 14 25 17 24 15 24 28 21 30 11 30 8 28 8 15 7 17 2 14 5 7Z','M18 8 22 5 26 8 29 14 25 16 23 14 23 28 20 29 15 29 17 23Z','M6 8 10 6 13 10 18 10 20 8 20 10 18 13 13 13 10 10 8 11 6 15 4 13Z M10 25h12v2H10Z',[16,18,.88]),
 mediumChest:shape('M9 4 13 7 19 7 23 4 28 7 31 14 25 18 24 15 23 25 26 29 19 30 16 28 13 30 6 29 9 25 8 15 7 18 1 14 4 7Z','M18 9 23 6 27 8 30 14 25 17 23 14 22 25 24 28 19 29 16 27Z','M5 8 9 6 13 10 18 10 19 12 13 13 9 10 6 15 3 13Z M10 22h12v2H10Z',[16,17,.86]),
 heavyChest:shape('M8 4 12 6 14 4 18 4 20 6 24 4 29 7 31 15 25 18 24 16 25 25 22 29 10 29 7 25 8 16 7 18 1 15 3 7Z','M18 6 21 8 24 6 28 9 29 14 25 16 23 13 23 25 21 28 16 28Z','M4 9 8 6 11 8 11 11 8 10 5 14 3 14Z M13 8h6l3 5-3 2h-6l-3-2Z M9 22l7 3 7-3v2l-7 3-7-3Z',[16,18,.84]),
 hands:shape('M3 24 3 17 5 14 6 8 9 8 10 5 13 5 14 8 16 5 19 6 19 13 21 13 21 8 24 8 26 12 29 13 30 20 28 26 24 29 18 28 15 24 14 27 8 28Z','M12 7 15 9 16 6 19 7 19 14 22 15 23 10 25 10 26 14 29 15 29 21 27 26 23 28 19 27 16 24 17 21 13 20 14 16Z','M5 19 8 17 12 18 14 21 11 24 7 24 5 22Z M18 23 21 19 26 19 28 22 26 25 21 25Z',[10,20,.5]),
 feet:shape('M5 5h9l1 10 3 6v6l-5 2H2l-1-5 4-5Z M19 5h8l1 13 3 4v5l-5 2h-7l1-6-2-6Z','M12 7h2l1 9 3 6v4l-5 2H3v-3h9l-1-5Z M25 7h2l1 12 2 4v3l-4 2h-6v-3h5Z','M6 8h6v3H6Z M6 17h7v2H6Z M20 8h5v3h-5Z M20 17h6v2h-6Z',[9,23,.52]),
 cloak:shape('M10 3 16 2 22 3 27 7 24 10 25 17 30 27 24 30 18 27 14 29 8 30 2 27 7 17 8 10 5 7Z','M16 4 22 4 26 7 23 10 25 19 29 27 24 29 18 26 16 27 17 18Z','M7 7 11 4h6v2h-5l-3 3-2 1Z M10 12h3l-3 12-5 3 1-2 3-6Z M20 23l5 4 3-1 1 2-5 1Z',[16,12,.82]),
 charm:shape('M7 3 9 3 10 7 13 9 16 8 19 9 22 7 23 3 25 3 25 8 22 12 25 16 25 22 20 27 16 30 12 27 7 22 7 16 10 12 7 8Z','M16 11 23 16 23 21 20 25 16 28Z','M9 17 13 12 17 11 18 13 14 15 12 20 13 23 11 22Z M8 4h1l1 3 4 3-2 1-4-4Z',[16,19,1.05]),
 ring:shape('M9 9 12 4h8l4 5-2 4 4 4v7l-3 4-7 2-7-2-3-4v-7l5-4Z M12 18l-2 3 2 4 4 1 4-1 2-4-2-3-4-1Z','M16 14 22 13 26 17v7l-3 4-7 2v-3l5-2 1-4-2-3-4-1Z','M10 9l3-3h5l2 3-3 3h-5Z M7 18l3-3 2 1-3 4v4l-2-1Z',[17,9,.63]),
 ringTwin:shape('M10 8 16 3 22 8 22 13 27 18 25 26 21 29H11l-4-3-2-8 5-5Z M12 17l-3 4 3 4h8l3-4-3-4Z','M16 14h6l4 5-2 7-4 2h-4v-3h4l3-4-3-4h-4Z','M12 9l4-4 2 2-1 5h-5Z M7 19l4-5 2 1-4 5-1 4Z',[17,10,.68]),
};

const UNIQUE_FORMS = {
 starBlade:shape('M2 27 6 21 10 22 13 19 8 16 9 12 13 12 16 15 24 3 30 1 29 8 26 10 27 13 20 21 22 24 19 28 15 26 13 23 8 29 5 31Z','M7 27 18 18 29 4 29 8 26 10 27 13 20 21 22 24 19 28 15 26 13 23 8 29 5 31Z','M12 14 15 18 18 17 25 5 29 3 26 8 24 10 25 12 18 20 15 21 12 18 10 16Z',[22,13,.70],[.24,.80]),
 soulBlade:shape('M3 27 6 22 10 23 13 20 10 17 11 13 15 14 17 16 20 10 20 7 24 6 30 2 29 10 26 12 25 17 19 21 21 24 18 27 14 24 8 30 5 30Z','M8 28 17 18 26 10 29 6 29 10 26 12 25 17 19 21 21 24 18 27 14 24 8 30Z','M12 15 16 18 18 17 22 9 28 5 25 9 25 11 23 12 23 15 19 19 16 21 13 19Z',[21,14,.61],[.25,.80]),
 mirrorBlade:shape('M3 27 8 21 12 22 15 19 10 16 13 12 17 14 20 10 20 6 25 3 29 4 27 10 30 13 25 17 22 17 20 20 23 23 20 26 16 23 10 28 7 30Z','M8 27 17 19 27 6 27 10 30 13 25 17 22 17 20 20 23 23 20 26 16 23 10 28 7 30Z','M13 15 17 17 23 10 24 6 27 5 26 10 23 13 21 17 18 19 15 18Z',[23,13,.53],[.28,.78]),
 faultAxe:shape('M3 27 16 13 11 12 11 7 17 5 18 2 24 3 24 6 30 6 31 11 28 16 25 15 24 19 20 20 19 17 7 30Z','M7 27 20 12 24 14 30 9 31 11 28 16 25 15 24 19 20 20 19 17 7 30Z','M13 8 18 6 19 4 23 5 23 8 29 8 29 10 24 10 21 13 16 11 14 11Z',[23,10,.75],[.27,.77]),
 stormWand:shape('M4 27 16 15 14 12 16 9 20 9 21 4 25 2 26 7 31 6 28 11 27 16 24 16 22 20 19 19 8 30Z','M6 28 20 15 24 14 27 9 31 6 28 11 27 16 24 16 22 20 19 19 8 30Z','M19 11 22 10 23 5 25 3 24 8 27 9 25 11 24 15 21 16 18 15Z',[23,11,.60],[.28,.78]),
 venomBow:shape('M3 27 4 22 2 20 4 16 7 15 6 12 9 7 14 6 15 3 20 2 23 4 28 1 30 3 28 6 30 8 27 11 25 10 8 28 6 31Z M8 24 23 8 18 8 15 10 11 11 10 15 11 18 9 21Z','M6 26 7 21 10 17 9 14 12 11 16 10 17 7 23 6 28 3 28 6 29 8 27 10 25 9 23 8 18 8 15 10 11 11 10 15 11 18 9 21 8 24Z','M4 20 6 17 8 17 7 19 6 22 5 27 4 26Z M8 12 10 9 14 8 14 10 11 11 10 14Z M17 5 20 3 23 5 21 6 18 6Z',[8,17,.52],[.27,.56]),
 tideShield:shape('M3 7 8 6 10 3 16 1 22 3 24 6 29 7 27 12 27 18 24 24 16 31 8 24 5 18 5 12Z','M16 3 21 4 23 8 27 8 25 13 26 18 22 24 16 29Z','M5 8 9 8 11 4 16 3 16 6 13 7 11 11 8 11 9 18 13 24 11 24 7 18Z',[16,16,1.18],[.5,.47]),
 roundShield:shape('M12 3h8l6 4 4 6v7l-4 6-6 4h-8l-6-4-4-6v-7l4-6Z','M16 4h4l6 4 3 6v6l-4 6-5 3h-4l5-5 3-8-3-8Z','M12 5h4v2h-4L7 11l-2 4v4l2 4-3-2-1-4 2-7Z',[16,16,1.23],[.5,.47]),
 crown:shape('M3 8 8 11 11 4 16 9 21 4 24 11 29 8 27 22 24 26H8l-3-4Z','M16 10 21 6 24 13 28 10 26 22 24 25h-8Z','M5 11l4 3 3-7 4 4v3l-4-3-2 6-3-2 1 5h16v2H7Z',[16,17,.93]),
 dawnCape:shape('M7 5 13 2h6l6 3 2 5-4 3 4 6 2 9-7 3-6-5-5 5-8-3 2-9 4-6-4-3Z','M16 3h3l5 3 2 4-4 3 4 7 2 8-6 2-6-5Z','M7 8l2-3 5-2h3v3h-4l-3 3 3 3-3 7-4 8-2 1 2-7 5-8Z',[16,13,.92]),
 pilgrimCape:shape('M9 5 13 2h6l4 3 4 3-4 4 1 6 5 8-7 2-6 3-6-3-7-2 5-8 1-6-4-4Z','M16 3h3l4 3 2 2-3 4 2 7 4 7-6 1-6 3Z','M7 8l4-3 3-2 2 1-3 4-3 2 1 3-2 8-3 4H4l5-8 1-5Z',[16,13,.88]),
 nightCape:shape('M9 4 15 2l8 2 5 4-3 4 2 8 4 6-6 4-4-2-5 3-5-3-4 2-6-4 4-6 2-8-3-4Z','M16 4l7 1 4 3-3 4 2 8 4 6-5 3-4-2-5 3Z','M6 8l4-3 5-2 3 1-4 2-3 2-1 6-2 5-2 4-4 3 4-6 2-8Z',[16,13,.85]),
 choirCape:shape('M6 5 12 3 16 1 20 3 26 5 27 9 23 13 24 20 28 29 22 30 17 25 16 27 15 25 10 30 4 29 8 20 9 13 5 9Z','M16 3l4 1 5 2 1 3-4 4 1 7 4 8-5 1-5-5-1 2Z','M7 6l7-3 2 1-4 4-3 1 2 3-1 8-4 8H5l4-8 1-7-4-4Z',[16,13,.91]),
 tideCharm:shape('M8 3h2l2 5 4 2 4-2 2-5h2l-1 7-4 3 5 3 2 5-3 5-7 4-7-4-3-5 2-5 5-3-4-3Z','M16 13l7 4 2 4-3 5-6 3Z','M9 19l4-4 4-1 2 2-5 2-3 4 2 3-3-1-2-3Z M9 4h1l2 5 3 2-2 1-4-3Z',[16,21,1]),
 loneCore:shape('M7 3h2l3 6 4 2 4-2 3-6h2l-2 7-4 3 4 2 4 7-4 5-7 4-7-4-4-5 4-7 4-2-4-3Z','M16 13l6 3 4 6-4 5-6 3Z','M8 21l3-5 5-2v2l-3 3-2 3 2 4-3-1Z M8 4h1l3 6 3 1-2 1-3-2Z',[16,22,1]),
};

// The same heraldry carries across all parts of a set.
const CRESTS = {
 ember:'M-1-4H1L0-1 2-2 4 1 3 4H-2L-4 1-2-2-2 1-1 2Z',
 shield:'M-4-3H4V1L2 3 0 4-2 3-4 1Z M-1-1V1L0 2 1 1V-1Z',
 feather:'M-4 4-2 0 1-3 4-4 3-1 1 1-1 1-2 3Z',
 eye:'M-4 0-2-2 0-3 2-2 4 0 2 2 0 3-2 2Z M-1 0 0 1 1 0 0-1Z',
 diamond:'M0-4 4 0 0 4-4 0Z M0-2-2 0 0 2 2 0Z',
 crystal:'M0-4 2-2 4-2 3 1 0 4-3 1-4-2-2-2Z M0-2-1 0 0 2 1 0Z',
 orb:'M0-4 3-3 4 0 3 3 0 4-3 3-4 0-3-3Z M-1-1H1V1H-1Z',
 star:'M0-4 1-1 4 0 1 1 0 4-1 1-4 0-1-1Z',
 moon:'M1-4-1-2-1 1 1 3 4 2 2 4-1 4-4 1-4-1-2-4Z',
 crown:'M-4-2-2 0 0-3 2 0 4-2 3 3H-3Z',
 bolt:'M-1-4H3L1-1H4L-2 4-1 0H-4Z',
 tear:'M0-4 3 0 4 2 2 4H-2L-4 2-3 0Z M-2 1V2L0 3-1 1Z',
 split:'M-4-3H0L1-2-1 0 0 1-2 3H-4L-2 0Z M2-3H4L2 0 4 3H0L-1 2 1 0 0-1Z',
 thorn:'M-4 3-2-1-3-3 0-2 2-4 2-1 4 0 2 2 1 4 0 2Z',
 arrow:'M-4 3 1-2H-2V-4H4V2H2V-1L-3 4Z',
 vessel:'M-2-4H2V-2L4 0V3L2 4H-2L-4 3V0L-2-2Z M-2 1H2V2H-2Z',
 tower:'M-4-4H-2V-2H-1V-4H1V-2H2V-4H4V0H2V2L3 4H-3L-2 2V0H-4Z',
 wave:'M-4 2-3-1-1-3H2L4-1H1L0 1 2 2 4 1 3 4H-2Z',
 anvil:'M-4-2H4L2 0 0 1V2L2 4H-3L-1 2V1L-3 0Z',
 flake:'M-1-4H1V-1L4-2V0L2 1 4 2V3L1 2V4H-1V2L-4 3V2L-2 1-4 0V-2L-1-1Z',
 pulse:'M-4 0H-2L-1-3H0L1 1 2-1H4V1H3L2 4H1L-1 0-2 2H-4Z',
 };
const look = (crest, shade, base, light, accent, cut = 0) => ({crest, palette:[shade, base, light, accent], cut});
const SET_LOOKS = {
 wrath:look('ember','#542c44','#9b4355','#df7976','#ffd3a0',1),
 iron:look('shield','#293846','#5a6d82','#a6b8ca','#ffe1a4'),
 wind:look('feather','#294846','#548574','#a1ceb2','#eaf5cc',2),
 hunt:look('eye','#42314f','#745483','#b096ca','#ffcf8d',1),
 flame:look('crystal','#305575','#538db5','#a3dced','#f1f9ff',2),
 frost:look('flake','#293b62','#5169a0','#a8b9ee','#cefcff',3),
 soul:look('orb','#2d494c','#478983','#93d2ba','#e2f6b6',1),
 codex:look('star','#3b3355','#615290','#ae96d5','#ffe3a1',3),
 covenant:look('moon','#3c3d55','#74768a','#c0c1d1','#ffefc3',2),
 court:look('crown','#473145','#8a4d68','#d6959c','#ffdb9f'),
 evolution:look('bolt','#234c62','#43818a','#75cfbc','#f8eaa2',1),
 fate:look('split','#4a325a','#805084','#e9a6cb','#fff0b3',2),
 drift:look('arrow','#283c62','#49669a','#82bbe4','#d5f5ff',3),
 rotcycle:look('thorn','#3b422e','#67763d','#a5ad69','#e4ed89',2),
 huntmark:look('eye','#383f38','#637259','#a3b692','#ffcb7c'),
 manavessel:look('vessel','#263a64','#4c61a3','#85add9','#a6fff4',3),
 convergence:look('star','#433253','#78629b','#b9acd5','#d0e9ff',2),
 singularity:look('orb','#4b3849','#885769','#dc9b9b','#ffd1c2',1),
 rifts:look('split','#252840','#5a537b','#9884bd','#ffb0d7',3),
 galeguard:look('feather','#283f54','#4a7d95','#91ced2','#def7cd',2),
 bastion:look('tower','#45372d','#78604a','#bdb29c','#ffca7f'),
 fletcher:look('arrow','#37385e','#6264a5','#a8a7de','#ffdd9e',3),
 chorus:look('pulse','#45354d','#796387','#c9a6c5','#ffe2bd',1),
 faultguard:look('anvil','#4f3937','#8b6255','#c89b76','#ffe2aa'),
 frostmirror:look('diamond','#2c4467','#5c85ae','#aed2ed','#ddfaff',3),
 twinvanguard:look('split','#294945','#597f79','#9cc1ae','#ffe4a4',1),
};
const UNIQUE_LOOKS = {
 bellbreaker:['axe',look('split','#573b30','#9d6a48','#d2a777','#ffe393')],
 mire_bow:['bow',look('thorn','#293c36','#4c7355','#8bbd82','#e7f6aa')],
 keeper_lantern:['charm',look('orb','#34454d','#517a80','#8dbab4','#f4dfa6')],
 rime_scribe:['tome',look('flake','#303d57','#546d98','#94b8db','#ddfaff')],
 pilgrim_treads:['feet',look('ember','#493a38','#815748','#b98a67','#ffca85')],
 ash_buckler:['roundShield',look('anvil','#403a36','#72635b','#b7a189','#f1ddb4')],
 star_cleaver:['starBlade',look('star','#3d345a','#7d78ab','#c5c7e7','#ffe2a1')],
 focus_codex:['tome',look('eye','#45394f','#846388','#c3aac3','#ffdeab')],
 tide_heart:['tideCharm',look('wave','#264556','#487f98','#8bc3cf','#ccf9ea')],
 soul_edge:['soulBlade',look('ember','#522c42','#95525a','#e09180','#ffd899')],
 thunder_shell:['heavyChest',look('bolt','#354662','#627e9c','#abcae3','#fff4b8')],
 soul_crown:['crown',look('crown','#3f3153','#795e91','#b0a2c9','#baffdb')],
 storm_weaver:['hands',look('bolt','#3f405c','#6967a2','#9aabe4','#fff6b7')],
 ember_loop:['ring',look('ember','#50313b','#a05353','#dc8d72','#fff2a6')],
 hunt_step:['feet',look('eye','#3c4540','#638571','#a6c49f','#f2dd9e')],
 lone_core:['loneCore',look('orb','#42364b','#7f6589','#b6a2bc','#f5d1ef')],
 poison_bow:['venomBow',look('thorn','#324832','#597a4d','#a8bd73','#e1ec91')],
 tide_shield:['tideShield',look('wave','#294663','#4d7899','#8db7c3','#acf7e9')],
 echo_seal:['charm',look('pulse','#56463e','#8a7766','#cfb090','#fff2bc')],
 mist_tome:['tome',look('moon','#304550','#52778a','#9abfc8','#dff4ef')],
 thunder_wand:['stormWand',look('bolt','#534253','#946c81','#d5aeba','#fff1aa')],
 reaver_hands:['hands',look('split','#523746','#85576d','#c69198','#ffd2ae')],
 shadow_mantle:['chest',look('moon','#333142','#4c4966','#7c7a9c','#c5bddf')],
 blood_furnace:['heavyChest',look('ember','#4c3040','#864b58','#c67a76','#ffcf84')],
 blood_loop:['ringTwin',look('tear','#503244','#924b63','#d48396','#ffd2b0')],
 mirror_dagger:['mirrorBlade',look('diamond','#40395c','#71658f','#b4a8d1','#e7efff')],
 device_mail:['mediumChest',look('anvil','#504437','#87705d','#c1a685','#f7d792')],
 dawn_standard:['dawnCape',look('star','#5d3947','#a85962','#e49a85','#ffe09c',1)],
 pilgrim_shroud:['pilgrimCape',look('star','#3b3b5e','#625e89','#aaa4ca','#ffebba',3)],
 night_sail:['nightCape',look('moon','#242d49','#4e5278','#888eb7','#cdeaff',2)],
 storm_quiver:['quiver',look('bolt','#32455d','#5a7997','#91c3de','#fff5ba')],
 duelist_buckler:['roundShield',look('split','#473f4c','#75697a','#bdb2b4','#ffe1a9')],
 mountain_heart:['heavyChest',look('crystal','#474845','#777c75','#b5bdb4','#cfffdf')],
 silkstep:['feet',look('feather','#3b4853','#687b8a','#adc5c9','#eef2d2')],
 fault_axe:['faultAxe',look('split','#4d3935','#956052','#d9a488','#ffe69d')],
 frost_well:['tome',look('flake','#2f4e66','#527ea0','#98cee7','#e2fdff')],
 stone_vow:['charm',look('anvil','#4e433d','#827b5e','#b9af8b','#dfedac')],
 choir_standard:['choirCape',look('pulse','#38494e','#647f85','#a7c3c0','#fff0b5',3)],
};

const shapes = {...FORMS, ...UNIQUE_FORMS};
const outlines = Object.fromEntries(Object.keys(shapes).map((key, index) => [key, 'gear-silhouette-' + index]));
const design = (id, form, theme) => ({id, form, ...theme, shape:shapes[form]});
const uniques = Object.fromEntries(Object.entries(UNIQUE_LOOKS).map(([id, [form, theme]]) =>
 [id, design('gear-unique-' + id, form, theme)]));
const sets = Object.fromEntries(Object.entries(SET_LOOKS).map(([id, theme]) =>
 [id, Object.fromEntries(Object.keys(FORMS).map(form => [form, design('gear-set-' + id + '-' + form, form, theme)]))]));

function formFor(item, fallback) {
 if (item.slot === 'weapon') return Object.hasOwn(FORMS, item.weaponType ?? fallback) ? item.weaponType ?? fallback : 'sword';
 if (item.slot === 'offhand') return Object.hasOwn(FORMS, item.weaponType) ? item.weaponType : 'shield';
 if (item.slot === 'chest') return ({heavy:'heavyChest', medium:'mediumChest'})[item.armorWeight] ?? 'chest';
 if (item.slot === 'ring' || item.slot?.startsWith('ring_')) return item.setPiece === 'ring:b' || item.slot === 'ring_b' ? 'ringTwin' : 'ring';
 return Object.hasOwn(FORMS, item.slot) ? item.slot : null;
}

export function rareGearDesign(item, fallback = 'sword') {
 if (Object.hasOwn(uniques, item?.uniqueID)) return uniques[item.uniqueID];
 return Object.hasOwn(sets, item?.set) ? sets[item.set][formFor(item, fallback)] ?? null : null;
}

export function rareGearIcon(item, fallback, silhouette) {
 const art = rareGearDesign(item, fallback);
 return silhouette ? outlines[art?.form ?? formFor(item, fallback)] : art?.id;
}

const symbol = (id, body) => '<symbol id="i-' + id + '" viewBox="0 0 32 32">' + body + '</symbol>';
function artSymbol(art) {
 const [shade, base, light, accent] = art.palette;
 const [x, y, scale] = art.shape.crest;
 return symbol(art.id, '<use href="#i-gear-form-' + art.form + '" width="32" height="32" style="--gear-shade:' +
  shade + ';--gear-base:' + base + ';--gear-light:' + light + '"/><path d="' + CRESTS[art.crest] +
  '" transform="translate(' + x + ' ' + y + ') scale(' + scale + ')" fill="' + accent +
  '" fill-rule="evenodd" stroke="' + shade + '" stroke-width=".6" stroke-linejoin="round"/>');
}
let symbolMarkup;
export function rareGearSymbols() {
 if (symbolMarkup) return symbolMarkup;
 const bodies = Object.entries(shapes).map(([key, {body, shade, bevel}]) =>
  symbol('gear-form-' + key, '<path d="' + body + '" fill="var(--gear-base)" fill-rule="evenodd" stroke="' +
   OUTLINE + '" stroke-width="1.45" stroke-linejoin="round"/><path d="' + shade +
   '" fill="var(--gear-shade)" stroke="none"/><path d="' + bevel + '" fill="var(--gear-light)" stroke="none"/>') +
  symbol(outlines[key], '<path d="' + body + '" fill="#35445c" fill-rule="evenodd" stroke="#596984" stroke-width=".85" stroke-linejoin="round"/>'));
 symbolMarkup = bodies.concat(Object.values(uniques).map(artSymbol), Object.values(sets).flatMap(forms => Object.values(forms).map(artSymbol))).join('');
 return symbolMarkup;
}

const paths = new Map(), sprites = new WeakMap();
function pathFor(d) {
 let path = paths.get(d);
 if (!path) {path = new Path2D(d);paths.set(d,path);}
 return path;
}
export function paintGearCrest(ctx, art, x, y, scale = 1) {
 if (!art || typeof Path2D !== 'function') return;
 ctx.save();
 ctx.translate(x,y);
 ctx.scale(scale,scale);
 const path = pathFor(CRESTS[art.crest]);
 ctx.strokeStyle = art.palette[0];
 ctx.lineWidth = .6;
 ctx.lineJoin = 'round';
 ctx.stroke(path);
 ctx.fillStyle = art.palette[3];
 ctx.fill(path,'evenodd');
 ctx.restore();
}

export function drawRareGear(ctx, art, x, y, size, anchor = DROP_ANCHOR) {
 if (!art || typeof Path2D !== 'function') return false;
 let sprite = sprites.get(art);
 if (!sprite) {
  sprite = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(64,64) : globalThis.document?.createElement('canvas');
  if (!sprite) return false;
  sprite.width = sprite.height = 64;
  const paint = sprite.getContext('2d');
  if (!paint) return false;
  paint.scale(2,2);
  const {body, shade, bevel, crest} = art.shape;
  const outline = pathFor(body);
  paint.fillStyle = art.palette[1];paint.fill(outline,'evenodd');
  paint.strokeStyle = OUTLINE;paint.lineWidth = 1.45;paint.lineJoin = 'round';paint.stroke(outline);
  paint.fillStyle = art.palette[0];paint.fill(pathFor(shade));
  paint.fillStyle = art.palette[2];paint.fill(pathFor(bevel));
  paintGearCrest(paint,art,...crest);
  sprites.set(art,sprite);
 }
 ctx.drawImage(sprite,x-size*anchor[0],y-size*anchor[1],size,size);
 return true;
}
