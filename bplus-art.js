const artImages = new Map();
const artWatchers = new Set();
let artBase = 'art/bplus/';

export function setBplusArtBase(base) {
 if (artImages.size) throw new Error('Configure the art base before loading images.');
 artBase = base;
}

export function bplusAsset(relative) {
 return globalThis.emberfallBplusAssets?.[relative] ?? artBase + relative;
}

export function bplusImage(relative) {
 if (!relative || typeof Image !== 'function') return null;
 let image = artImages.get(relative);
 if (!image) {
  image = new Image();
  image.decoding = 'async';
  image.addEventListener('load', () => {
   for (const callback of artWatchers) callback(relative);
  }, {once:true});
  artImages.set(relative,image);
  image.src = bplusAsset(relative);
 }
 return image.complete && image.naturalWidth > 0 ? image : null;
}

export function watchBplusImages(callback) {
 artWatchers.add(callback);
 return () => artWatchers.delete(callback);
}

export function drawBplus(ctx,relative,x,y,width,height,{fit='contain',anchorX=.5,anchorY=1,flip=false}={}) {
 const image = bplusImage(relative);
 if (!image) return false;
 let w = width, h = height;
 if (fit === 'contain') {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  w = image.naturalWidth * scale;
  h = image.naturalHeight * scale;
 }
 if (flip) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(-1,1);
  ctx.drawImage(image,-w * anchorX,-h * anchorY,w,h);
  ctx.restore();
 } else ctx.drawImage(image,x - w * anchorX,y - h * anchorY,w,h);
 return true;
}
