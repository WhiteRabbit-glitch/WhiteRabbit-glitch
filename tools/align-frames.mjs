// Aligns cat-fading.png to cat-full.png so the banner cross-fade does not jump.
// The two paintings were generated separately, so the head sat at a different
// position, scale and tilt in each. This finds the yellow eyes in both, solves
// the similarity transform between them, applies it, then corrects the residual
// with an integer translation and reports how close it got.
//
// Needs sharp:  npm i sharp
// Run from anywhere:  node tools/align-frames.mjs
// Output: assets/cat-fading-aligned2.png, which banner-grin.jpg is cropped from.

import sharp from 'sharp';
const A='/home/chanchan/wr-profile/assets/';
const findEyes = async (buf) => {
  const {data,info}=await sharp(buf).raw().toBuffer({resolveWithObject:true});
  const pts=[];
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++){
    const i=(y*info.width+x)*info.channels, r=data[i],g=data[i+1],b=data[i+2];
    if(r>170&&g>120&&b<110&&r-b>90&&g-b>50) pts.push([x,y]);
  }
  pts.sort((a,b)=>a[0]-b[0]);
  const mid=pts[Math.floor(pts.length/2)][0];
  const c=a=>[a.reduce((s,p)=>s+p[0],0)/a.length,a.reduce((s,p)=>s+p[1],0)/a.length];
  const [lx,ly]=c(pts.filter(p=>p[0]<mid)), [rx,ry]=c(pts.filter(p=>p[0]>=mid));
  return {lx,ly,rx,ry,sep:Math.hypot(rx-lx,ry-ly),ang:Math.atan2(ry-ly,rx-lx),
          mx:(lx+rx)/2,my:(ly+ry)/2, w:info.width, h:info.height};
};
const full = await findEyes(A+'cat-full.png');
const fade = await findEyes(A+'cat-fading.png');
const s = full.sep/fade.sep, th = full.ang-fade.ang;
const a= s*Math.cos(th), b= -s*Math.sin(th), c= s*Math.sin(th), d= s*Math.cos(th);
const px = a*fade.mx + b*fade.my, py = c*fade.mx + d*fade.my;
console.log('scale',s.toFixed(5),'rotate',(th*180/Math.PI).toFixed(2)+'deg');

let out = await sharp(A+'cat-fading.png')
  .affine([[a,b],[c,d]], {background:'#080517', odx: full.mx-px, ody: full.my-py})
  .toBuffer();
// force back to the original canvas, padding with ink if the affine shrank it
const m = await sharp(out).metadata();
out = await sharp(out)
  .extend({top:0,left:0,bottom:Math.max(0,full.h-m.height),right:Math.max(0,full.w-m.width),background:'#080517'})
  .extract({left:0,top:0,width:full.w,height:full.h}).png().toBuffer();
await sharp(out).toFile(A+'cat-fading-aligned.png');
const chk = await findEyes(A+'cat-fading-aligned.png');
console.log('residual  dx='+(chk.mx-full.mx).toFixed(2), 'dy='+(chk.my-full.my).toFixed(2),
            'dsep='+(chk.sep-full.sep).toFixed(2), 'dang='+((chk.ang-full.ang)*180/Math.PI).toFixed(2)+'deg');

// second pass: pure integer translation to kill the residual
const dx = Math.round(chk.mx-full.mx), dy = Math.round(chk.my-full.my);
const W=full.w, H=full.h;
await sharp(A+'cat-fading-aligned.png')
  .extract({ left:Math.max(0,dx), top:Math.max(0,dy), width:W-Math.abs(dx), height:H-Math.abs(dy) })
  .extend({ top:Math.max(0,-dy), left:Math.max(0,-dx), bottom:Math.max(0,dy), right:Math.max(0,dx), background:'#080517' })
  .png().toFile(A+'cat-fading-aligned2.png');
const chk2 = await findEyes(A+'cat-fading-aligned2.png');
console.log('after pass 2  dx='+(chk2.mx-full.mx).toFixed(2), 'dy='+(chk2.my-full.my).toFixed(2),
            'dsep='+(chk2.sep-full.sep).toFixed(2), 'dang='+((chk2.ang-full.ang)*180/Math.PI).toFixed(2)+'deg');
