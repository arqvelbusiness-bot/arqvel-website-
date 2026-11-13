/* Cafe Yelove — dish rendering (three.js r128, bundled in js/vendor).
   Exposes window.Scene.hero(canvas,{onPick,onHover}), Scene.explorer(canvas).show(key), Scene.lab(canvas).set(key). */
window.Scene=(function(){
if(typeof THREE==='undefined'){const no={show(){},set(){}};return {ok:false,hero(){},explorer(){return no;},lab(){return no;}};}
/* ================= TEXTURES ================= */
const C=h=>new THREE.Color(h).convertSRGBToLinear();
const TX={};const cache=(k,f)=>TX[k]||(TX[k]=f());
function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);if(o.color!==false)t.encoding=THREE.sRGBEncoding;if(o.rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(o.rep[0],o.rep[1]);}t.anisotropy=4;return t;}
const rnd=Math.random;
function blobPath(x,cx,cy,r,irr,n){const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,rr=r*(1+(rnd()-.5)*irr);p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}
 const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];x.beginPath();const s=m(p[n-1],p[0]);x.moveTo(s[0],s[1]);for(let i=0;i<n;i++){const a=p[i],e=m(a,p[(i+1)%n]);x.quadraticCurveTo(a[0],a[1],e[0],e[1]);}x.closePath();}
function speck(x,w,h,n,cols,r0,r1,a,ar){for(let i=0;i<n;i++){let px,py;if(ar){const g=rnd()*6.283,d=ar.r0+Math.sqrt(rnd())*(ar.r1-ar.r0);px=ar.cx+Math.cos(g)*d;py=ar.cy+Math.sin(g)*d;}else{px=rnd()*w;py=rnd()*h;}
 x.globalAlpha=a*(.35+rnd()*.65);x.fillStyle=cols[(rnd()*cols.length)|0];x.beginPath();x.arc(px,py,r0+rnd()*(r1-r0),0,7);x.fill();}x.globalAlpha=1;}
function leafDraw(x,cx,cy,len,ang){x.save();x.translate(cx,cy);x.rotate(ang);const g=x.createLinearGradient(0,-len*.3,0,len*.3);g.addColorStop(0,'#2a5219');g.addColorStop(.5,'#4b8a2f');g.addColorStop(1,'#234616');x.fillStyle=g;
 x.beginPath();x.moveTo(-len/2,0);x.bezierCurveTo(-len/4,-len*.34,len/4,-len*.3,len/2,0);x.bezierCurveTo(len/4,len*.3,-len/4,len*.34,-len/2,0);x.fill();
 x.strokeStyle='rgba(170,215,120,.35)';x.lineWidth=len*.025;x.beginPath();x.moveTo(-len/2,0);x.lineTo(len/2,0);x.stroke();x.restore();}
function inDisc(S,rmax){const a=rnd()*6.283,d=Math.sqrt(rnd())*rmax;return[S/2+Math.cos(a)*d,S/2+Math.sin(a)*d];}

function pizzaTop(kind){return cache('pz'+kind,()=>ctex(1024,1024,(x,S)=>{const c=S/2;
 x.fillStyle='#d9a566';x.fillRect(0,0,S,S);
 const sc={pesto:'#4c6624',makhani:'#9c4418'}[kind]||'#76200f';
 blobPath(x,c,c,S*.47,.04,56);x.save();x.clip();x.fillStyle=sc;x.fillRect(0,0,S,S);
 speck(x,S,S,1600,['#5e160a','#b2361c',sc,'#a12c16'],2,8,.35);
 const marg=kind==='margherita',nb=marg?8:15;
 for(let i=0;i<nb;i++){const[bx,by]=inDisc(S,S*.36),r=S*(marg?.07:.055)+rnd()*S*.04;blobPath(x,bx,by,r,.55,12);
  const g=x.createRadialGradient(bx-r*.2,by-r*.2,0,bx,by,r*1.2);g.addColorStop(0,'#fffaec');g.addColorStop(.65,'#f2deae');g.addColorStop(1,marg?'#e6cf9e':'#cf9f5c');x.fillStyle=g;x.fill();
  if(!marg){x.save();x.clip();speck(x,S,S,46,['#b9772f','#8f5420','#c98d45'],2,r*.17,.5,{cx:bx,cy:by,r0:0,r1:r});x.restore();}}
 if(kind==='pepperoni'){for(let i=0;i<16;i++){const[px,py]=inDisc(S,S*.37),r=S*.046;const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'#b5402a');g.addColorStop(.75,'#8a2414');g.addColorStop(1,'#4a1208');x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,7);x.fill();
  speck(x,S,S,10,['#e0a080'],1.5,3.5,.4,{cx:px,cy:py,r0:0,r1:r*.8});x.fillStyle='rgba(255,220,180,.18)';x.beginPath();x.arc(px-r*.3,py-r*.3,r*.35,0,7);x.fill();}}
 if(kind==='veg'||kind==='paneer'||kind==='chicken'||kind==='makhani'){x.lineCap='round';
  for(let i=0;i<11;i++){const[px,py]=inDisc(S,S*.38);x.strokeStyle='#36702a';x.lineWidth=11;x.beginPath();x.arc(px,py,24,rnd()*6,rnd()*6+1.3);x.stroke();x.strokeStyle='rgba(150,210,110,.4)';x.lineWidth=3;x.stroke();}
  for(let i=0;i<9;i++){const[px,py]=inDisc(S,S*.38);x.strokeStyle='#8a3c66';x.lineWidth=6;x.beginPath();x.arc(px,py,34,rnd()*6,rnd()*6+1.1);x.stroke();}}
 if(kind==='veg'){for(let i=0;i<12;i++){const[px,py]=inDisc(S,S*.38);x.strokeStyle='#1b1714';x.lineWidth=8;x.beginPath();x.arc(px,py,10,0,7);x.stroke();}
  for(let i=0;i<22;i++){const[px,py]=inDisc(S,S*.38);x.fillStyle='#e7b83a';x.beginPath();x.arc(px,py,7,0,7);x.fill();x.fillStyle='rgba(255,250,200,.6)';x.beginPath();x.arc(px-2,py-2,2.5,0,7);x.fill();}}
 if(kind==='paneer'){for(let i=0;i<16;i++){const[px,py]=inDisc(S,S*.37);x.save();x.translate(px,py);x.rotate(rnd()*3);x.fillStyle='#f5ecdc';x.fillRect(-17,-17,34,34);x.strokeStyle='#c4924e';x.lineWidth=4;x.strokeRect(-17,-17,34,34);x.restore();}}
 if(kind==='chicken'||kind==='makhani'){for(let i=0;i<18;i++){const[px,py]=inDisc(S,S*.37);blobPath(x,px,py,20,.6,9);const g=x.createRadialGradient(px-5,py-5,0,px,py,24);g.addColorStop(0,'#c98a4c');g.addColorStop(1,'#7c4218');x.fillStyle=g;x.fill();}}
 if(kind==='pesto'){for(let i=0;i<10;i++){const[px,py]=inDisc(S,S*.36);x.fillStyle='#b8301c';x.beginPath();x.arc(px,py,24,0,7);x.fill();x.fillStyle='#e0604a';x.beginPath();x.arc(px,py,16,0,7);x.fill();speck(x,S,S,6,['#f2d38a'],2,3,.8,{cx:px,cy:py,r0:3,r1:12});}}
 const nl={margherita:9,pesto:7,pepperoni:4,makhani:6,chicken:3}[kind]||0;for(let i=0;i<nl;i++){const[px,py]=inDisc(S,S*.36);leafDraw(x,px,py,70+rnd()*30,rnd()*6);}
 speck(x,S,S,60,['rgba(255,240,200,1)'],6,22,.06);
 x.restore();
 speck(x,S,S,320,['#3a1d0c','#6a3514','#2a1408'],2,9,.55,{cx:c,cy:c,r0:S*.45,r1:S*.5});
 x.globalCompositeOperation='destination-in';x.beginPath();x.arc(c,c,S*.5-2,0,7);x.fill();x.globalCompositeOperation='source-over';
}));}
const crustTex=()=>cache('crust',()=>ctex(1024,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#b47336');g.addColorStop(.35,'#d9a466');g.addColorStop(.65,'#e3b77c');g.addColorStop(1,'#c3874a');x.fillStyle=g;x.fillRect(0,0,w,h);
 speck(x,w,h,1000,['#a8642c','#e9c58f','#c07a3a'],2,10,.35);speck(x,w,h,160,['#22110a','#3d2010'],3,11,.8);speck(x,w,h,400,['#f2e6d0'],1,2.4,.5);}));
const woodTex=()=>cache('wood',()=>ctex(1024,1024,(x,w,h)=>{x.fillStyle='#4a2f1c';x.fillRect(0,0,w,h);
 for(let i=0;i<260;i++){const y0=rnd()*h,amp=4+rnd()*10,f=rnd()*.01;x.strokeStyle=['#38220f','#5c3b22','#6b4428','#2e1c0e'][(rnd()*4)|0];x.globalAlpha=.2+rnd()*.35;x.lineWidth=1+rnd()*3;x.beginPath();for(let X=0;X<=w;X+=16)x.lineTo(X,y0+Math.sin(X*f+i)*amp);x.stroke();}
 x.globalAlpha=1;speck(x,w,h,500,['#2a180c'],1,2,.4);}));
const slateTex=()=>cache('slate',()=>ctex(512,512,(x,w,h)=>{x.fillStyle='#1c1815';x.fillRect(0,0,w,h);speck(x,w,h,2500,['#26201c','#151210','#2d2622'],1,4,.6);
 for(let i=0;i<30;i++){x.strokeStyle='rgba(60,52,46,.25)';x.lineWidth=1;x.beginPath();const y=rnd()*h;x.moveTo(0,y);x.bezierCurveTo(w*.3,y+rnd()*40-20,w*.6,y+rnd()*40-20,w,y+rnd()*40-20);x.stroke();}},{rep:[6,6]}));
const stoneTex=()=>cache('stone',()=>ctex(512,512,(x,w,h)=>{x.fillStyle='#1d1a18';x.fillRect(0,0,w,h);speck(x,w,h,1800,['#2a2522','#141210','#332d29'],1,2.5,.6);},{rep:[2,2]}));
const cremaTex=()=>cache('crema',()=>ctex(512,512,(x,S)=>{const c=S/2;const g=x.createRadialGradient(c,c,0,c,c,c);g.addColorStop(0,'#c99464');g.addColorStop(.72,'#8d5228');g.addColorStop(.92,'#5a2d14');g.addColorStop(1,'#3a1a0b');x.fillStyle=g;x.fillRect(0,0,S,S);
 speck(x,S,S,700,['#a36a3c','#6a3518','#c08a5a'],1,4,.3);x.filter='blur(2px)';
 for(let i=0;i<7;i++){const y=c+100-i*30,w=118-i*12,h=30-i*2;x.fillStyle='#f3e6d0';x.beginPath();x.ellipse(c,y,w,h,0,0,7);x.fill();x.fillStyle='#a8703f';x.beginPath();x.ellipse(c,y+11,w*.84,h*.7,0,0,7);x.fill();}
 x.fillStyle='#f3e6d0';x.beginPath();x.ellipse(c,c-125,40,32,0,0,7);x.fill();x.strokeStyle='#f3e6d0';x.lineWidth=5;x.beginPath();x.moveTo(c,c-145);x.lineTo(c,c+135);x.stroke();x.filter='none';}));
function gradTex(key,stops){return cache('g'+key,()=>ctex(16,512,(x,w,h)=>{const g=x.createLinearGradient(0,h,0,0);stops.forEach(s=>g.addColorStop(s[0],s[1]));x.fillStyle=g;x.fillRect(0,0,w,h);
 }));}
const noiseTex=(key,base,cols,rep)=>cache(key,()=>ctex(256,256,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);speck(x,w,h,1400,cols,1,5,.6);},{rep:rep||[2,2]}));
const bunTex=()=>cache('bun',()=>ctex(512,512,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#c48a4a');g.addColorStop(.3,'#a9622a');g.addColorStop(.75,'#86441a');g.addColorStop(1,'#6e3410');x.fillStyle=g;x.fillRect(0,0,w,h);
 speck(x,w,h,500,['#8a4a1a','#c27a36'],2,8,.3);for(let i=0;i<120;i++){const px=rnd()*w,py=rnd()*h*.75;x.save();x.translate(px,py);x.rotate(rnd()*3);x.fillStyle='rgba(60,30,10,.35)';x.beginPath();x.ellipse(1.5,1.5,6,3,0,0,7);x.fill();x.fillStyle='#f4e4bf';x.beginPath();x.ellipse(0,0,6,3,0,0,7);x.fill();x.restore();}}));
const tomatoTex=()=>cache('tom',()=>ctex(256,256,(x,S)=>{const c=S/2;x.fillStyle='#b7281a';x.fillRect(0,0,S,S);x.fillStyle='#d8432c';x.beginPath();x.arc(c,c,S*.42,0,7);x.fill();
 for(let i=0;i<5;i++){const a=i/5*6.283;x.fillStyle='#e9775a';x.beginPath();x.ellipse(c+Math.cos(a)*S*.22,c+Math.sin(a)*S*.22,S*.12,S*.08,a,0,7);x.fill();speck(x,S,S,5,['#f4d6a0'],3,5,.9,{cx:c+Math.cos(a)*S*.22,cy:c+Math.sin(a)*S*.22,r0:0,r1:S*.06});}}));
function cutTex(kind){return cache('cut'+kind,()=>ctex(256,256,(x,S)=>{const crust=kind==='beef'?'#3a1d10':'#9a6230';x.fillStyle=crust;x.fillRect(0,0,S,S);
 const g=x.createRadialGradient(S/2,S/2,S*.05,S/2,S/2,S*.5);if(kind==='beef'){g.addColorStop(0,'#d9746e');g.addColorStop(.55,'#c65a52');g.addColorStop(.85,'#8a4a34');g.addColorStop(1,crust);}else{g.addColorStop(0,'#f4e3cc');g.addColorStop(.8,'#e7cba5');g.addColorStop(1,crust);}
 x.fillStyle=g;x.beginPath();x.roundRect?x.roundRect(S*.07,S*.09,S*.86,S*.82,30):x.rect(S*.07,S*.09,S*.86,S*.82);x.fill();speck(x,S,S,200,['rgba(255,255,255,.3)','rgba(0,0,0,.15)'],1,2,.4);}));}
const searTex=k=>cache('sear'+k,()=>ctex(256,256,(x,w,h)=>{x.fillStyle=k==='beef'?'#3d1f10':'#a8682f';x.fillRect(0,0,w,h);speck(x,w,h,800,k==='beef'?['#2a140a','#5a2e16']:['#7c4518','#c4864a'],1,5,.6);
 x.strokeStyle='rgba(15,7,3,.75)';x.lineWidth=12;for(let i=-2;i<6;i++){x.beginPath();x.moveTo(i*60,0);x.lineTo(i*60+140,h);x.stroke();}speck(x,w,h,60,['#f0ece4'],1,2.5,.8);}));
const softDot=()=>cache('soft',()=>ctex(128,128,(x,S)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,S,S);},{color:false}));
const shadowTex=()=>cache('shd',()=>ctex(128,128,(x)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);},{color:false}));

/* ================= MATERIALS & HELPERS ================= */
const std=(o)=>new THREE.MeshStandardMaterial(o);
const phys=(o)=>new THREE.MeshPhysicalMaterial(o);
const mesh=(g,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);return o;};
const shadows=o=>{o.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});return o;};
const glassMat=()=>{const m=phys({color:0xffffff,roughness:.05,metalness:0,clearcoat:1,clearcoatRoughness:.04,transparent:true,opacity:.2,side:THREE.DoubleSide,envMapIntensity:2,depthWrite:false});return m;};
const ceramic=(c,r=.3)=>phys({color:C(c),roughness:r,clearcoat:.8,clearcoatRoughness:.15});
const lathe=(pts,seg=72)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg);
function lumpy(geo,amt){const p=geo.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=1+(Math.sin(v.x*13)*Math.cos(v.y*11)*Math.sin(v.z*17))*amt+(rnd()-.5)*amt*.6;p.setXYZ(i,v.x*n,v.y*n,v.z*n);}geo.computeVertexNormals();return geo;}
function leafMesh(len=.26){const s=new THREE.Shape();s.moveTo(-len/2,0);s.bezierCurveTo(-len/4,-len*.34,len/4,-len*.3,len/2,0);s.bezierCurveTo(len/4,len*.3,-len/4,len*.34,-len/2,0);
 const g=new THREE.ShapeGeometry(s,12);const p=g.attributes.position;for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i);p.setZ(i,-Math.abs(Y)*.25+Math.cos(X/len*3)*.012);}g.computeVertexNormals();
 const m=mesh(g,phys({color:C('#3f7a27'),roughness:.38,clearcoat:.5,side:THREE.DoubleSide}));return m;}

/* ================= MODELS ================= */
function makeBoard(){const g=new THREE.Group();const wm=std({map:woodTex(),roughness:.72,bumpMap:woodTex(),bumpScale:.01});
 const side=std({color:C('#3a2414'),roughness:.8});
 g.add(mesh(new THREE.CylinderGeometry(1.78,1.74,.1,96),[side,wm,side],0,.05));
 const h=mesh(new THREE.BoxGeometry(1.0,.1,.34),wm,2.15,.05,0);g.add(h);
 const hole=mesh(new THREE.CylinderGeometry(.07,.07,.12,24),std({color:C('#120e0b')}),2.45,.05,0);g.add(hole);return g;}
function makePizza(kind){kind=kind||'margherita';if(kind==='keema')kind='makhani';const g=new THREE.Group();const tx=pizzaTop(kind);
 const top=mesh(new THREE.PlaneGeometry(2.72,2.72,1,1),std({map:tx,bumpMap:tx,bumpScale:.012,roughness:.6,alphaTest:.5,color:C('#e8e2da')}),0,.118,0);top.rotation.x=-Math.PI/2;g.add(top);
 const cr=mesh(new THREE.TorusGeometry(1.38,.16,28,160),std({map:crustTex(),bumpMap:crustTex(),bumpScale:.03,roughness:.82}),0,.1,0);cr.rotation.x=Math.PI/2;cr.scale.z=.72;cr.position.y=.115;g.add(cr);
 g.add(mesh(new THREE.CylinderGeometry(1.42,1.36,.1,96),std({color:C('#c58a4c'),roughness:.9}),0,.05,0));
 const nl={margherita:4,pesto:3,makhani:2}[kind]||0;for(let i=0;i<nl;i++){const l=leafMesh(.24+rnd()*.08);const a=rnd()*6.28,d=.2+rnd()*.8;l.rotation.set(-Math.PI/2+(rnd()-.5)*.3,0,rnd()*6);l.position.set(Math.cos(a)*d,.14,Math.sin(a)*d);g.add(l);}
 return shadows(g);}
function makeBurger(kind){const g=new THREE.Group();let y=0;const put=(o,h)=>{o.position.y=y+h/2;g.add(o);y+=h;};
 const bunSide=std({color:C('#8a4a1c'),roughness:.6});const bunCut=std({color:C('#ecd3a2'),roughness:.9});
 put(mesh(new THREE.CylinderGeometry(.98,.9,.34,64),[bunSide,bunCut,bunSide]),.34);
 const pc={veg:['#b9772f',['#9a5a20','#d39a52']],paneer:['#c98a3c',['#a8662a','#e0b06a']],chicken:['#a8662c',['#7c4518','#c98a4a']]}[kind]||['#3f2316',['#2a140a','#5a3220','#6b3a22']];
 const ptx=noiseTex('patty'+kind,pc[0],pc[1],[5,1]);
 put(mesh(lumpy(new THREE.CylinderGeometry(1.04,1.04,.32,64,4),.025),std({map:ptx,bumpMap:ptx,bumpScale:.015,roughness:.8})),.32);
 const cg=new THREE.PlaneGeometry(1.75,1.75,30,30);cg.rotateX(-Math.PI/2);const cp=cg.attributes.position;for(let i=0;i<cp.count;i++){const X=cp.getX(i),Z=cp.getZ(i),d=Math.max(Math.abs(X),Math.abs(Z));if(d>.62)cp.setY(i,-(d-.62)*(d-.62)*1.3);}cg.computeVertexNormals();
 const ch=mesh(cg,phys({color:C(kind==='veg'?'#f1c75a':'#eeaa2a'),roughness:.32,clearcoat:.4,side:THREE.DoubleSide}),0,y+.01,0);ch.rotation.y=Math.PI/4;g.add(ch);y+=.03;
 put(mesh(new THREE.CylinderGeometry(.92,.92,.09,64),[std({color:C('#b7281a'),roughness:.4}),phys({map:tomatoTex(),roughness:.25,clearcoat:.6}),std({color:C('#b7281a')})]),.09);
 const lg=new THREE.CylinderGeometry(1.12,1.12,.07,96,2);const lp=lg.attributes.position;for(let i=0;i<lp.count;i++){const X=lp.getX(i),Z=lp.getZ(i);if(Math.hypot(X,Z)>.9)lp.setY(i,lp.getY(i)+Math.sin(Math.atan2(Z,X)*14)*.06+Math.sin(Math.atan2(Z,X)*5)*.03);}lg.computeVertexNormals();
 put(mesh(lg,phys({color:C('#5f8f33'),roughness:.45,clearcoat:.3})),.07);
 const top=mesh(new THREE.SphereGeometry(1,96,48,0,Math.PI*2,0,Math.PI/2),phys({map:bunTex(),roughness:.45,clearcoat:.35,bumpMap:bunTex(),bumpScale:.01}),0,y,0);top.scale.set(1,.74,1);g.add(top);
 return shadows(g);}
function bowl(){return mesh(lathe([[0,0],[.7,0],[1.0,.14],[1.3,.48],[1.4,.62],[1.34,.64],[1.24,.5],[.96,.2],[0,.14]]),std({map:stoneTex(),roughness:.6,side:THREE.DoubleSide}));}
function makePasta(kind){const g=new THREE.Group();g.add(bowl());
 const nc={white:'#ecd29c',pesto:'#8ea24a',mac:'#eab54a',red:'#b9442a',bolognese:'#a83d26',aglio:'#e6c374'}[kind]||'#e6c374';
 const nm=phys({color:C(nc),roughness:.35,clearcoat:.5});
 if(kind==='mac'){for(let i=0;i<150;i++){const t=mesh(new THREE.TorusGeometry(.085,.04,10,16,Math.PI*.9),nm);const a=rnd()*6.28,d=Math.sqrt(rnd())*.88;t.position.set(Math.cos(a)*d,.3+rnd()*.24*(1-d*.7),Math.sin(a)*d);t.rotation.set(rnd()*6,rnd()*6,rnd()*6);g.add(t);}}
 else{for(let i=0;i<46;i++){const pts=[];let a=rnd()*6.28,r=.15+rnd()*.6,yy=.32+rnd()*.12;for(let k=0;k<16;k++){a+=.5+rnd()*.3;r=Math.min(.95,Math.max(.08,r+(rnd()-.5)*.18));yy+=(rnd()-.45)*.035;pts.push(new THREE.Vector3(Math.cos(a)*r,Math.min(yy,.62-r*.18),Math.sin(a)*r));}
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),90,kind==='white'?.034:.026,6),nm));}}
 if(kind==='bolognese')for(let i=0;i<40;i++){const b=mesh(lumpy(new THREE.SphereGeometry(.05,8,6),.3),std({color:C('#5a2614'),roughness:.7}));const a=rnd()*6.28,d=rnd()*.5;b.position.set(Math.cos(a)*d,.55,Math.sin(a)*d);g.add(b);}
 if(kind==='aglio')for(let i=0;i<40;i++){g.add(mesh(new THREE.BoxGeometry(.03,.01,.02),std({color:C('#b22a18')}),(rnd()-.5)*1.1,.58,(rnd()-.5)*1.1));}
 for(let i=0;i<14;i++){const s=mesh(new THREE.BoxGeometry(.07,.006,.035),std({color:C('#f1e6c4'),roughness:.6}),(rnd()-.5)*.8,.6+rnd()*.04,(rnd()-.5)*.8);s.rotation.set(rnd(),rnd()*3,rnd());g.add(s);}
 for(let i=0;i<3;i++){const l=leafMesh(.26);l.position.set((rnd()-.5)*.5,.64,(rnd()-.5)*.5);l.rotation.set(-Math.PI/2+.3,0,rnd()*6);g.add(l);}
 return shadows(g);}
function slateBoard(w=2.8,d=1.9){return mesh(new THREE.BoxGeometry(w,.08,d),std({map:slateTex(),roughness:.85}),0,.04,0);}
function ramekin(sauce){const g=new THREE.Group();g.add(mesh(lathe([[0,0],[.26,0],[.3,.24],[.27,.24],[.24,.04],[0,.04]],40),ceramic('#ece6dc',.35)));
 const s=mesh(new THREE.CircleGeometry(.26,32),phys({color:C(sauce),roughness:.2,clearcoat:.8}),0,.2,0);s.rotation.x=-Math.PI/2;g.add(s);return g;}
function makeBites(kind){const g=new THREE.Group();g.add(slateBoard());
 const r=ramekin(kind==='prawn'?'#e8b07a':kind==='wings'?'#f3ede0':'#e9dcc0');r.position.set(.95,.08,.45);g.add(r);
 const P={
  wings:()=>{const m=mesh(lumpy(new THREE.SphereGeometry(.2,24,16),.12),phys({color:C('#4e1a07'),roughness:.32,clearcoat:.9,clearcoatRoughness:.2}));m.scale.set(1.6,.7,.85);return m;},
  pops:()=>{const t=noiseTex('crisp','#c48a3c',['#a8682a','#e0b06a','#8a5220']);const m=mesh(lumpy(new THREE.SphereGeometry(.15,20,14),.22),std({map:t,bumpMap:t,bumpScale:.05,roughness:.9}));m.scale.set(1.2,.85,1);return m;},
  paneer:()=>{const m=mesh(lumpy(new THREE.BoxGeometry(.26,.22,.26,3,3,3),.06),phys({color:C('#c4521f'),roughness:.3,clearcoat:.8}));return m;},
  prawn:()=>{const m=mesh(new THREE.TorusGeometry(.16,.075,14,28,Math.PI*1.35),phys({color:C('#e57c4f'),roughness:.4,clearcoat:.5}));m.rotation.x=Math.PI/2;const w=new THREE.Group();w.add(m);return w;},
  bread:()=>{const w=new THREE.Group();const b=mesh(new THREE.CylinderGeometry(.24,.24,.1,32),std({color:C('#d79a52'),roughness:.9}));b.scale.z=.6;w.add(b);const t=noiseTex('brus','#4f6a2a',['#2f4a18','#7a8a4a','#e8dcc0']);const tp=mesh(lumpy(new THREE.SphereGeometry(.2,16,10,0,Math.PI*2,0,Math.PI/2),.2),std({map:t,roughness:.6}),0,.05,0);tp.scale.set(1,.35,.6);w.add(tp);return w;},
  cigar:()=>{const t=noiseTex('roll','#d29a52',['#b47a36','#e8c084','#9a5e26']);const m=mesh((THREE.CapsuleGeometry?new THREE.CapsuleGeometry(.08,.6,8,16):new THREE.CylinderGeometry(.08,.08,.7,20)),std({map:t,bumpMap:t,bumpScale:.03,roughness:.8}));m.rotation.z=Math.PI/2;const w=new THREE.Group();w.add(m);return w;}
 };
 const mk=P[kind]||P.pops,n={bread:5,cigar:6,wings:9,prawn:9,paneer:12}[kind]||12;
 for(let i=0;i<n;i++){const o=mk();o.position.set((rnd()-.5)*1.4-.25,.17+rnd()*.06,(rnd()-.5)*1.0);o.rotation.y=rnd()*6.28;g.add(o);}
 for(let i=0;i<20;i++){g.add(mesh(new THREE.TorusGeometry(.03,.012,6,12),std({color:C('#6fae3a')}),(rnd()-.5)*1.6-.2,.27,(rnd()-.5)*1.1));}
 for(let i=0;i<40;i++){g.add(mesh(new THREE.SphereGeometry(.012,6,4),std({color:C('#efe3c0')}),(rnd()-.5)*1.4-.25,.29,(rnd()-.5)*.9));}
 return shadows(g);}
function makeFries(kind){const g=new THREE.Group();
 g.add(mesh(lathe([[0,0],[.45,0],[.62,1.0],[.58,1.0],[.42,.05],[0,.05]],48),phys({color:C('#b9b3aa'),metalness:1,roughness:.28})));
 const ft=ctex(16,128,(x,w,h)=>{const gg=x.createLinearGradient(0,0,0,h);gg.addColorStop(0,'#b5702c');gg.addColorStop(.12,'#e2b25a');gg.addColorStop(.9,'#e8bd68');gg.addColorStop(1,'#c58a3a');x.fillStyle=gg;x.fillRect(0,0,w,h);});
 const fm=std({map:ft,roughness:.6,color:kind==='peri'?C('#f2a070'):0xffffff});
 for(let i=0;i<40;i++){const h=1.0+rnd()*.5;const f=mesh(new THREE.BoxGeometry(.085,h,.085),fm,(rnd()-.5)*.6,.3+h/2,(rnd()-.5)*.6);f.rotation.set((rnd()-.5)*.45,rnd()*3,(rnd()-.5)*.45);g.add(f);}
 for(let i=0;i<30;i++){g.add(mesh(new THREE.SphereGeometry(.015,6,4),std({color:C('#f3ecd8')}),(rnd()-.5)*.8,1.2+rnd()*.5,(rnd()-.5)*.8));}
 return shadows(g);}
function plate(){const g=new THREE.Group();g.add(mesh(lathe([[0,0],[1.1,0],[1.5,.12],[1.6,.16],[1.58,.18],[1.45,.15],[1.05,.05],[0,.05]],96),ceramic('#ece7df',.25)));return g;}
function makePlate(kind){const g=new THREE.Group();g.add(plate());
 if(kind==='rice'){const t=noiseTex('rice','#efe6d2',['#fbf6ea','#d9ccb0','#e8d9a8'],[3,3]);const d=mesh(lumpy(new THREE.SphereGeometry(.85,48,24,0,Math.PI*2,0,Math.PI/2),.03),std({map:t,bumpMap:t,bumpScale:.04,roughness:.9}),0,.05,0);d.scale.y=.5;g.add(d);
  for(let i=0;i<30;i++){const a=rnd()*6.28,r=Math.sqrt(rnd())*.7;g.add(mesh(new THREE.SphereGeometry(.035,8,6),std({color:C(i%3?'#e6b23a':'#4f8a2e')}),Math.cos(a)*r,.05+.425*Math.sqrt(Math.max(0,1-(r/.85)**2)),Math.sin(a)*r));}return shadows(g);}
 if(kind==='fish'){const t=noiseTex('batter','#d9a14e',['#b87a2e','#f0c878','#a86828']);const f=mesh(lumpy(new THREE.SphereGeometry(.6,40,24),.06),std({map:t,bumpMap:t,bumpScale:.06,roughness:.85}),.15,.22,0);f.scale.set(1.3,.32,.55);f.rotation.y=.4;g.add(f);
  const lm=mesh(new THREE.SphereGeometry(.2,24,16,0,Math.PI),phys({color:C('#e9c936'),roughness:.4,clearcoat:.5}),.95,.12,.55);lm.rotation.set(-Math.PI/2,0,.4);g.add(lm);
  const fr=makeFries();fr.children[0].visible=false;fr.scale.setScalar(.45);fr.position.set(-.75,0,-.3);g.add(fr);}
 else{const k=kind==='steak'?'beef':'chicken';const cut=std({map:cutTex(k),roughness:.55}),sear=std({map:searTex(k),bumpMap:searTex(k),bumpScale:.02,roughness:.6});
  for(let i=0;i<6;i++){const s=mesh(new THREE.BoxGeometry(.16,.34,.95),[cut,cut,sear,sear,sear,sear]);s.position.set(-.3+i*.15,.22,-.05+i*.03);s.rotation.set(0,.25,-.28);g.add(s);}
  if(k==='beef')for(let i=0;i<45;i++){g.add(mesh(new THREE.SphereGeometry(.018+rnd()*.015,6,4),phys({color:C(rnd()<.8?'#3f7a22':'#b5301c'),roughness:.3,clearcoat:.8}),-.2+rnd()*.9,.4+rnd()*.03,-.3+rnd()*.5));}
  const mash=mesh(lumpy(new THREE.SphereGeometry(.4,32,20),.05),std({color:C('#efe0b8'),roughness:.8}),-.75,.12,.45);mash.scale.y=.55;g.add(mash);
  for(let i=0;i<4;i++){const l=leafMesh(.22);l.position.set(.7+rnd()*.3,.12,.6+rnd()*.2);l.rotation.set(-Math.PI/2+.2,0,rnd()*6);g.add(l);}}
 return shadows(g);}
function makeCoffee(kind){const g=new THREE.Group();const cm=ceramic('#2c2724',.32);
 g.add(mesh(lathe([[0,0],[.95,0],[1.15,.06],[1.2,.1],[1.12,.1],[.9,.06],[0,.06]],80),cm));
 const cup=mesh(lathe([[0,0],[.38,0],[.42,.04],[.58,.4],[.7,.92],[.66,.94],[.55,.42],[.4,.1],[0,.1]],80),cm,0,.06,0);g.add(cup);
 const sf=mesh(new THREE.CircleGeometry(.63,64),phys({map:kind==='espresso'?null:cremaTex(),color:kind==='espresso'?C('#5a2d14'):0xffffff,roughness:.25,clearcoat:.6}),0,.93,0);sf.rotation.x=-Math.PI/2;sf.rotation.z=.4;g.add(sf);
 const h=mesh(new THREE.TorusGeometry(.22,.055,16,32,Math.PI),cm,.62,.55,0);h.rotation.z=-Math.PI/2;g.add(h);
 const sp=new THREE.Group();const met=phys({color:C('#cfc8bd'),metalness:1,roughness:.22});const bowlS=mesh(new THREE.SphereGeometry(.12,24,12),met);bowlS.scale.set(1,.25,.7);sp.add(bowlS);
 const st=mesh(new THREE.CylinderGeometry(.02,.03,.6,12),met,0,.0,.36);st.rotation.x=Math.PI/2;sp.add(st);sp.position.set(-.55,.1,.6);sp.rotation.y=.9;g.add(sp);
 return shadows(g);}
function makeSteam(n=12){const grp=new THREE.Group();const ps=[];for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:softDot(),color:0xfff6ea,transparent:true,opacity:0,depthWrite:false}));grp.add(s);ps.push({s,k:i/n});}
 grp.userData.update=t=>ps.forEach(p=>{const k=(t*.09+p.k)%1;p.s.position.set(Math.sin(t*.7+p.k*9)*.12*k,k*1.6,Math.cos(t*.5+p.k*7)*.08*k);p.s.scale.setScalar(.25+k*.8);p.s.material.opacity=Math.sin(k*Math.PI)*.07;});return grp;}

const DRINK={
 pink:{name:'Pink Lady',p:389,st:[[0,'#f1c3cd'],[.42,'#e6a3b3'],[.56,'#b9807a'],[.7,'#5e3220'],[1,'#3a1d0f']]},
 ocean:{name:'Ocean Latte',p:349,st:[[0,'#f3f0e8'],[.45,'#dbe7ec'],[.62,'#86bdd8'],[1,'#2a76a3']]},
 spanish:{name:'Spanish Latte',p:289,st:[[0,'#eedbb5'],[.45,'#e0c08e'],[.63,'#a8714a'],[1,'#552c16']]},
 latte:{name:'Iced Latte',p:249,st:[[0,'#f1e8da'],[.5,'#e0ccae'],[.7,'#a27250'],[1,'#64381e']]},
 cold:{name:'Cold Coffee',p:199,st:[[0,'#d8c09f'],[1,'#9c704c']]},
 matcha:{name:'Matcha',p:0,st:[[0,'#f2eee4'],[.45,'#e5e8d4'],[.62,'#a3b96a'],[1,'#6b8a33']]}
};
const SHAKES={milo:'#7c5136',strawberry:'#e7a3b2',butterscotch:'#d9a25a',oreo:'#7d746f',caramel:'#c0803d',biscoff:'#ae7140',ferrero:'#6a3e24',triple:'#43230f',tiramisu:'#cdb594'};
const lighten=(h,k)=>'#'+new THREE.Color(h).lerp(new THREE.Color('#fff8ee'),k).getHexString();
function makeGlass(stops,opt={}){const g=new THREE.Group(),H=1.9;
 const shell=mesh(lathe([[0,0],[.5,0],[.52,.02],[.64,H],[.61,H],[.5,.16],[0,.16]],72),glassMat());shell.renderOrder=5;g.add(shell);
 const L=opt.cream?1.62:1.42,geo=new THREE.CylinderGeometry(.585,.49,L,64);geo.translate(0,L/2,0);
 const lm=phys({map:gradTex(opt.key,stops),roughness:.18,clearcoat:.6});const liq=mesh(geo,lm,0,.165,0);g.add(liq);
 const ice=[];if(!opt.cream){for(let i=0;i<4;i++){const c=mesh(lumpy(new THREE.BoxGeometry(.27,.27,.27,3,3,3),.05),phys({color:0xffffff,roughness:.12,transparent:true,opacity:.45,clearcoat:1,envMapIntensity:2}));c.rotation.set(i,i*2,i*.5);g.add(c);ice.push(c);}}
 const straw=mesh(new THREE.CylinderGeometry(.04,.04,2.5,16),std({color:C(opt.straw||'#1d1a18'),roughness:.7}),.2,1.45,.06);straw.rotation.z=-.2;g.add(straw);
 let cream=null;if(opt.cream){cream=new THREE.Group();const cm=std({color:C('#f7f0e4'),roughness:.55});[[.5,.1],[.42,.1],[.33,.09],[.24,.08],[.14,.07]].forEach(([r,t],i)=>{const tt=mesh(new THREE.TorusGeometry(r,t+.02,16,48),cm,0,.08+i*.13,0);tt.rotation.x=Math.PI/2;cream.add(tt);});
  cream.add(mesh(new THREE.SphereGeometry(.12,16,12),cm,0,.7,0));
  const pts=[];for(let i=0;i<60;i++){const a=i*.42,r=.52-i*.007;pts.push(new THREE.Vector3(Math.cos(a)*r,.12+i*.011,Math.sin(a)*r));}cream.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),200,.018,6),phys({color:C(opt.drizzle||'#5a2e14'),roughness:.2,clearcoat:1})));
  const x=opt.extra;if(x==='ferrero')cream.add(mesh(lumpy(new THREE.SphereGeometry(.15,24,16),.05),phys({color:C('#c9a24a'),metalness:1,roughness:.35}),0,.86,0));
  else if(x==='oreo'){const o=mesh(new THREE.CylinderGeometry(.2,.2,.07,32),std({color:C('#1e1714'),roughness:.8}),.05,.82,0);o.rotation.z=1.1;cream.add(o);}
  else if(x==='biscoff'){const o=mesh(new THREE.BoxGeometry(.4,.04,.22),std({color:C('#a8692f'),roughness:.8}),0,.84,0);o.rotation.z=.9;cream.add(o);}
  else cream.add(mesh(new THREE.SphereGeometry(.1,20,14),phys({color:C('#8f0f1c'),roughness:.15,clearcoat:1}),0,.82,0));
  g.add(cream);}
 const u=g.userData;u.fill=1;u.target=1;u.next=null;u.lm=lm;u.L=L;
 u.setDrink=(key,st)=>{u.next=[key,st];u.target=0;};
 u.update=t=>{u.fill+=(u.target-u.fill)*.045;if(u.target===0&&u.fill<.02&&u.next){lm.map=gradTex(u.next[0],u.next[1]);lm.needsUpdate=true;u.next=null;u.target=1;}
  liq.scale.y=Math.max(.001,u.fill);liq.visible=u.fill>.01;
  ice.forEach((c,i)=>{c.position.set(Math.cos(i*1.6)*.2,Math.max(.32,.165+L*u.fill-.13)+Math.sin(t*1.2+i)*.02+(i>1?-.22:0),Math.sin(i*1.6)*.2);});
  if(cream){cream.position.y=.165+L*u.fill;cream.scale.setScalar(Math.min(1,u.fill*1.15)+.001);}};
 return shadows(g);}
function makeShake(k){const c=SHAKES[k]||SHAKES.oreo;return makeGlass([[0,lighten(c,.45)],[.6,c],[1,lighten(c,.15)]],{cream:true,key:'sh'+k,extra:k,drizzle:k==='strawberry'?'#9a1c2c':k==='butterscotch'||k==='caramel'||k==='biscoff'?'#a5621f':'#3a1a0b'});}
function makeIced(k){const d=DRINK[k]||DRINK.latte;return makeGlass(d.st,{key:k});}
function buildModel(key){const[t,v]=key.split(':');switch(t){case'pizza':return makePizza(v);case'burger':return makeBurger(v);case'pasta':return makePasta(v);case'fries':return makeFries(v);case'bites':return makeBites(v);case'plate':return makePlate(v);case'cup':return makeCoffee(v);case'glass':return makeIced(v);case'shake':return makeShake(v);}return makePizza();}

/* ================= STAGES ================= */
const stages=[];
function envFor(renderer){const s=new THREE.Scene();s.background=new THREE.Color(0x0a0807);
 const bm=c=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide});
 const add=(w,h,c,p,r)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),bm(c));m.position.set(...p);m.lookAt(0,0,0);s.add(m);};
 add(8,4,new THREE.Color(5,4.4,3.6),[0,8,2]);add(4,6,new THREE.Color(3.2,2.4,1.6),[-8,3,3]);add(3,6,new THREE.Color(1.2,1.4,1.8),[8,2,-3]);add(10,2,new THREE.Color(.5,.4,.3),[0,1,-9]);
 const pm=new THREE.PMREMGenerator(renderer);const t=pm.fromScene(s,.04).texture;pm.dispose();return t;}
function createStage(canvas,o){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=o.exp||1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.environment=envFor(renderer);
 if(o.fog)scene.fog=new THREE.Fog(o.fog,o.fogNear,o.fogFar);
 scene.add(new THREE.HemisphereLight(0xffeedd,0x1a120c,.25));
 const key=new THREE.DirectionalLight(0xffd6a8,2.4);key.position.set(-4,7,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.radius=6;key.shadow.bias=-.0004;
 const sc=key.shadow.camera;sc.left=-5;sc.right=5;sc.top=5;sc.bottom=-5;sc.near=1;sc.far=20;scene.add(key);
 const rim=new THREE.DirectionalLight(0x9fb4d8,.9);rim.position.set(4,3,-5);scene.add(rim);
 const fill=new THREE.PointLight(0xffb27a,.5,18);fill.position.set(3,2,4);scene.add(fill);
 const camera=new THREE.PerspectiveCamera(o.fov||30,1,.1,60);camera.position.set(...o.cam);camera.lookAt(...o.look);
 const st={renderer,scene,camera,canvas,visible:false,onTick:null,onResize:null,look:new THREE.Vector3(...o.look),base:new THREE.Vector3(...o.cam)};
 st.resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();st.onResize&&st.onResize(w,h);};
 new ResizeObserver(st.resize).observe(canvas);st.resize();
 new IntersectionObserver(e=>{st.visible=e[0].isIntersecting;st.onVisible&&st.onVisible(st.visible);},{rootMargin:'100px'}).observe(canvas);
 stages.push(st);return st;}
function turnable(canvas,onDelta){let d=false,lx=0;canvas.addEventListener('pointerdown',e=>{d=true;lx=e.clientX;});addEventListener('pointerup',()=>d=false);
 canvas.addEventListener('pointermove',e=>{if(!d)return;onDelta((e.clientX-lx)*.006);lx=e.clientX;});}
function fitObj(obj,maxW,maxH){const b=new THREE.Box3().setFromObject(obj),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());const k=Math.min(maxW/Math.max(s.x,s.z),maxH/s.y);obj.scale.setScalar(k);obj.position.set(-c.x*k,-b.min.y*k,-c.z*k);}
const collectUps=o=>{const a=[];o.traverse(n=>{if(n.userData&&n.userData.update)a.push(n.userData.update);});return a;};
const ease=x=>1-Math.pow(1-x,3);


/* ================= LIGHT STONE (menu pedestal) ================= */
const marbleTex=()=>cache('marble',()=>ctex(1024,1024,(x,w,h)=>{x.fillStyle='#efe7dc';x.fillRect(0,0,w,h);speck(x,w,h,2500,['#e3d8c9','#f6f0e7','#d9ccba'],1,4,.5);
 for(let i=0;i<18;i++){x.strokeStyle=`rgba(150,128,105,${.08+rnd()*.12})`;x.lineWidth=1+rnd()*2.5;x.beginPath();let px=rnd()*w,py=rnd()*h;x.moveTo(px,py);for(let k=0;k<8;k++){px+=(rnd()-.3)*160;py+=(rnd()-.5)*120;x.lineTo(px,py);}x.stroke();}}));

/* ================= HERO ================= */
function hero(canvas,opts){
 const st=createStage(canvas,{fov:32,cam:[0,0,11],look:[0,0,0],exp:1.08});
 const pin=new THREE.Group(),tilt=new THREE.Group();
 const pz=makePizza('pepperoni');fitObj(pz,3.4,3);pz.position.y-=.05;pin.add(pz);tilt.add(pin);tilt.rotation.x=.82;st.scene.add(tilt);
 const ORB=[
  {m:()=>makeIced('pink'),cat:'coffee',item:'Pink Lady',label:'Pink Lady · ₹389',s:1},
  {m:()=>makeBurger('beef'),cat:'burgers',item:'Smash Beef Burger',label:'Smash Beef Burger · ₹469',s:1,t:.15},
  {m:()=>makeCoffee('latte'),cat:'coffee',item:'Cappuccino (Hot/Iced)',label:'Cappuccino · ₹219',s:1,t:.45},
  {m:()=>makeIced('matcha'),cat:'coffee',item:'Pink Lady',label:'Matcha mood · Pink Lady',s:1},
  {m:()=>makeFries('plain'),cat:'small',item:'Fries',label:'Fries · from ₹199',s:1,t:.2},
  {m:()=>makeShake('ferrero'),cat:'shakes',item:'Ferrero Rocher Shake',label:'Ferrero Rocher Shake · ₹299',s:1},
  {m:()=>makePasta('red'),cat:'pasta',item:'Arrabbiata',label:'Arrabbiata · ₹389',s:1,t:.55}
 ];
 const orbiters=ORB.map((o,i)=>{const w=new THREE.Group(),inner=new THREE.Group(),m=o.m();fitObj(m,2.1,2.3);const bb=new THREE.Box3().setFromObject(m);m.position.y-=(bb.max.y+bb.min.y)/2;
  inner.add(m);if(o.t)inner.rotation.x=o.t;w.add(inner);w.userData=Object.assign({},o,{k:1,inner,ups:collectUps(m)});st.scene.add(w);return w;});
 const beanM=phys({color:C('#3a2014'),roughness:.35,clearcoat:.6}),beans=[];
 for(let i=0;i<26;i++){const b=mesh(lumpy(new THREE.SphereGeometry(.13,16,12),.05),beanM,(rnd()-.5)*17,(rnd()-.5)*9,-2-rnd()*6);b.scale.set(1,.62,.75);b.rotation.set(rnd()*6,rnd()*6,0);b.userData.v=.2+rnd()*.5;st.scene.add(b);beans.push(b);}
 const L={px:2.4,py:-.1,ps:1,rx:3.1,ry:2.0,os:.62};
 st.onResize=(w,h)=>{const a=w/h;if(a<.9)Object.assign(L,{px:0,py:-2.35,ps:.55,rx:1.45,ry:.85,os:.34});else Object.assign(L,{px:a>1.45?2.5:1.9,py:-.1,ps:a>1.45?1:.85,rx:a>1.45?3.0:2.4,ry:2.0,os:a>1.45?.62:.52});};st.resize();
 const ray=new THREE.Raycaster();let spin=0,spinV=0,drag=false,lx=0,moved=0,mx=0,my=0,hov=null;
 const ptr=e=>{const r=canvas.getBoundingClientRect();return new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);};
 const hit=p=>{ray.setFromCamera(p,st.camera);const h=ray.intersectObjects(orbiters,true)[0];if(!h)return null;let o=h.object;while(o&&!o.userData.label)o=o.parent;return o;};
 canvas.addEventListener('pointerdown',e=>{drag=true;lx=e.clientX;moved=0;});
 addEventListener('pointerup',e=>{if(!drag)return;drag=false;if(moved<6&&e.target===canvas){const o=hit(ptr(e));if(o&&opts.onPick)opts.onPick(o.userData.cat,o.userData.item);}});
 canvas.addEventListener('pointermove',e=>{const p=ptr(e);mx=p.x;my=p.y;if(drag){const dx=e.clientX-lx;spinV=dx*.006;lx=e.clientX;moved+=Math.abs(dx);}
  if(e.pointerType==='mouse'){hov=hit(p);opts.onHover&&opts.onHover(hov?hov.userData.label:null,e);canvas.style.cursor=hov?'pointer':'';}});
 canvas.addEventListener('pointerleave',()=>{hov=null;opts.onHover&&opts.onHover(null);});
 st.onTick=t=>{spin+=spinV;spinV*=.95;pin.rotation.y=spin+t*.16;const sc=Math.min(scrollY/innerHeight,1);
  tilt.position.set(L.px,L.py+Math.sin(t*.8)*.06+sc*1.2,0);tilt.scale.setScalar(L.ps*(1+sc*.15));tilt.rotation.x=.82+sc*.35;
  orbiters.forEach((w,i)=>{const u=w.userData,a=t*.1+i/orbiters.length*Math.PI*2;
   w.position.set(L.px+Math.cos(a)*L.rx,L.py+Math.sin(a)*L.ry+Math.sin(t*1.3+i)*.1,Math.cos(a+1.2)*.9);
   u.k+=((hov===w?1.22:1)-u.k)*.15;w.scale.setScalar(u.s*L.os*u.k);u.inner.rotation.y+=.007+(hov===w?.025:0);u.ups.forEach(f=>f(t));});
  beans.forEach(b=>{b.rotation.x+=.004*b.userData.v;b.rotation.y+=.006*b.userData.v;b.position.y+=Math.sin(t*b.userData.v+b.position.x)*.002;});
  const c=st.camera;c.position.x+=(mx*.7-c.position.x)*.04;c.position.y+=(my*.45-c.position.y)*.04;c.lookAt(0,0,0);};
 return st;}

/* ================= MENU STAGE ================= */
function explorer(canvas){
 const st=createStage(canvas,{fov:30,cam:[0,3.5,6.5],look:[0,.6,0],exp:1.05});
 const ped=mesh(new THREE.CylinderGeometry(2.1,2.2,.18,96),phys({map:marbleTex(),roughness:.35,clearcoat:.4}),0,-.09,0);ped.receiveShadow=true;st.scene.add(ped);
 const ring=mesh(new THREE.TorusGeometry(2.12,.012,8,128),phys({color:C('#c8503a'),metalness:.6,roughness:.35}),0,.005,0);ring.rotation.x=Math.PI/2;st.scene.add(ring);
 const root=new THREE.Group();st.scene.add(root);let cur=null,rotV=0,rot=0,tiltX=0;
 turnable(canvas,d=>rotV=d);
 st.onTick=t=>{rot+=rotV+.003;rotV*=.93;
  [...root.children].forEach(w=>{const u=w.userData;
   if(u.leaving){u.k-=.05;w.position.y=-(1-Math.max(u.k,0))*.6;w.scale.setScalar(Math.max(.001,u.k));if(u.k<=0)root.remove(w);return;}
   u.k=Math.min(1,u.k+.025);const e=ease(u.k);w.scale.setScalar(Math.max(.001,.6+.4*e));w.position.y=(1-e)*.9;w.rotation.y=rot+(1-e)*1.2;u.ups.forEach(f=>f(t));});};
 return {show(key){if(key===cur)return;cur=key;root.children.forEach(w=>w.userData.leaving=true);
  const m=buildModel(key);fitObj(m,3.0,2.5);const w=new THREE.Group();w.add(m);w.userData={k:0,leaving:false,ups:collectUps(m)};w.scale.setScalar(.001);root.add(w);}};}

/* ================= DRINK LAB ================= */
function lab(canvas){
 const st=createStage(canvas,{fov:28,cam:[0,2.6,9.6],look:[0,1.15,0],exp:1.15});
 const ped=mesh(new THREE.CylinderGeometry(1.3,1.35,.12,96),std({map:stoneTex(),roughness:.75,color:0x5a5450,envMapIntensity:.5}),0,-.06,0);ped.receiveShadow=true;st.scene.add(ped);
 const glass=makeIced('pink');glass.scale.setScalar(1.05);st.scene.add(glass);const gu=glass.userData;gu.fill=0;gu.target=0;
 const stream=mesh(new THREE.CylinderGeometry(.045,.045,1,16),phys({roughness:.2,clearcoat:1,color:C('#5e3220')}));st.scene.add(stream);
 let seen=false,grot=0,gV=0;turnable(canvas,d=>gV=d);
 st.onVisible=v=>{if(v&&!seen){seen=true;gu.target=1;}};
 st.onTick=t=>{grot+=gV+.004;gV*=.93;glass.rotation.y=grot;gu.update(t);
  const pour=gu.target===1&&gu.fill<.96;stream.visible=pour&&seen;if(pour){const top=4,bot=(.165+gu.L*gu.fill)*1.05;stream.scale.y=Math.max(.01,top-bot);stream.position.set(0,(top+bot)/2,0);}};
 return {set(key){const d=DRINK[key];if(!d)return;gu.setDrink(key,d.st);stream.material.color.copy(C(d.st[d.st.length-1][1]));}};}

let started=false;
function start(){if(started)return;started=true;const clock=new THREE.Clock();let first=true;
 (function loop(){requestAnimationFrame(loop);const t=clock.getElapsedTime();for(const s of stages){if(!s.visible)continue;s.onTick&&s.onTick(t);s.renderer.render(s.scene,s.camera);}
  if(first){first=false;document.dispatchEvent(new Event('scene:ready'));}})();}
/* ================= STILL THUMBNAILS ================= */
let TH=null;
function thumb(key,size){size=size||320;
 if(!TH){const c=document.createElement('canvas');c.width=c.height=size;
  const r=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true,preserveDrawingBuffer:true});r.setPixelRatio(1);r.setSize(size,size,false);
  r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.1;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
  const s=new THREE.Scene();s.environment=envFor(r);s.add(new THREE.HemisphereLight(0xffeedd,0x1a120c,.3));
  const k=new THREE.DirectionalLight(0xffd6a8,2.3);k.position.set(-4,7,4);k.castShadow=true;k.shadow.mapSize.set(1024,1024);k.shadow.radius=8;k.shadow.bias=-.0004;
  const sc=k.shadow.camera;sc.left=-4;sc.right=4;sc.top=4;sc.bottom=-4;sc.near=1;sc.far=20;s.add(k);
  const rim=new THREE.DirectionalLight(0x9fb4d8,.8);rim.position.set(4,3,-5);s.add(rim);const f=new THREE.PointLight(0xffb27a,.5,18);f.position.set(3,2,4);s.add(f);
  const g=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.ShadowMaterial({opacity:.25}));g.rotation.x=-Math.PI/2;g.receiveShadow=true;s.add(g);
  TH={r,s,c,cam:new THREE.PerspectiveCamera(26,1,.1,80)};}
 const m=buildModel(key);fitObj(m,3,2.6);const w=new THREE.Group();w.add(m);w.rotation.y=-.55;TH.s.add(w);
 collectUps(m).forEach(fn=>{try{fn(1.3)}catch(e){}});
 const b=new THREE.Box3().setFromObject(w),sph=b.getBoundingSphere(new THREE.Sphere());
 const flat=/^(pizza|plate|pasta|bites)/.test(key);
 const dir=(flat?new THREE.Vector3(0,1.05,1):new THREE.Vector3(0,.42,1)).normalize();
 const dist=sph.radius/Math.sin(THREE.MathUtils.degToRad(13))*(flat?.8:.9);
 TH.cam.position.copy(sph.center).addScaledVector(dir,dist);TH.cam.lookAt(sph.center);
 TH.r.render(TH.s,TH.cam);const url=TH.c.toDataURL('image/png');
 TH.s.remove(w);w.traverse(n=>{if(n.geometry)n.geometry.dispose();});return url;}

return {ok:true,thumb:(k,z)=>thumb(k,z),hero:(c,o)=>{const s=hero(c,o||{});start();return s;},explorer:c=>{const e=explorer(c);start();return e;},lab:c=>{const l=lab(c);start();return l;}};
})();
