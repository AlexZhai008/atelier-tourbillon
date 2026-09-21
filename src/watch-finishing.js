import * as THREE from 'three';

// Deterministic, locally generated micro-finish maps; no external image dependency.
export function createFinishes(anisotropy=8){
  const n=512,rough=new Uint8Array(n*n*4),normal=new Uint8Array(n*n*4),circular=new Uint8Array(n*n*4);
  let seed=917;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const rows=Array.from({length:n},()=>random());
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=(y*n+x)*4,fine=rows[y]*.65+random()*.35;
    const r=Math.hypot(x-n/2,y-n/2),lathe=Math.sin(r*2.4)*.5+.5;
    rough[i]=rough[i+1]=rough[i+2]=Math.round(160+fine*70);rough[i+3]=255;
    normal[i]=128;normal[i+1]=Math.round(128+(rows[(y+1)%n]-rows[y])*15);normal[i+2]=255;normal[i+3]=255;
    circular[i]=circular[i+1]=circular[i+2]=Math.round(163+lathe*55+random()*12);circular[i+3]=255;
  }
  const make=data=>{const t=new THREE.DataTexture(data,n,n,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=anisotropy;t.needsUpdate=true;return t;};
  const brush=make(rough),micro=make(normal),lathe=make(circular);
  const gold=new THREE.MeshPhysicalMaterial({name:'champagne',color:0xc9a184,metalness:1,roughness:.34,roughnessMap:brush,normalMap:micro,normalScale:new THREE.Vector2(.10,.10),anisotropy:.65,anisotropyRotation:Math.PI/2});
  const polish=new THREE.MeshPhysicalMaterial({name:'polished-champagne',color:0xe6c3a1,metalness:1,roughness:.115,clearcoat:.25,clearcoatRoughness:.12});
  const steel=new THREE.MeshPhysicalMaterial({name:'rhodium',color:0xc5cbd0,metalness:1,roughness:.14,clearcoat:.22});
  const brushedSteel=new THREE.MeshPhysicalMaterial({name:'brushed-rhodium',color:0x929ba1,metalness:1,roughness:.40,roughnessMap:brush,normalMap:micro,normalScale:new THREE.Vector2(.08,.08),anisotropy:.65});
  const bridge=new THREE.MeshPhysicalMaterial({name:'anthracite',color:0x55585b,metalness:1,roughness:.43,roughnessMap:brush,normalMap:micro,normalScale:new THREE.Vector2(.11,.11),anisotropy:.35});
  const wheel=new THREE.MeshStandardMaterial({name:'wheel-brass',color:0xb39760,metalness:1,roughness:.36,roughnessMap:lathe});
  const blue=new THREE.MeshPhysicalMaterial({name:'blued-steel',color:0x112d53,metalness:1,roughness:.18,clearcoat:.3});
  const ruby=new THREE.MeshPhysicalMaterial({name:'synthetic-ruby',color:0x6c1536,metalness:.06,roughness:.13,clearcoat:1,ior:1.76});
  const black=new THREE.MeshStandardMaterial({name:'velvet-chapter',color:0x15191e,metalness:.55,roughness:.43});
  const lume=new THREE.MeshStandardMaterial({name:'ivory-lume',color:0xc6cabe,roughness:.55,metalness:.08});
  const glass=new THREE.MeshPhysicalMaterial({name:'crystal',color:0xf5faff,roughness:.018,transmission:1,thickness:.025,ior:1.32,envMapIntensity:.17,clearcoat:.16});
  const caseGlass=new THREE.MeshPhysicalMaterial({name:'case-crystal',color:0xe6f1fa,roughness:.035,transmission:1,thickness:.09,ior:1.40,envMapIntensity:.30});
  return {gold,polish,steel,brushedSteel,bridge,wheel,blue,ruby,black,lume,glass,caseGlass,textures:[brush,micro,lathe]};
}

export function createStudio(){
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x161b22);
  // Long photographic strip boxes produce distinct edge highlights and dark falloff.
  function panel(w,h,x,y,z,power,tint){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(tint).multiplyScalar(power),side:THREE.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);scene.add(p);}
  panel(7,7,-1,1,14,1.05,0xfff6ed);
  panel(3,13,-6,3,6,5.5,0xfff0e0);panel(1.2,12,7,1,4,4.5,0xd9e8ff);
  panel(9,2,0,8,3,4.5,0xfff9ef);panel(6,1.5,1,-6,5,2.5,0xc6ddff);
  panel(3,7,-4,-1,-7,3,0xffe8d2);panel(2,6,5,3,-6,3.5,0xffffff);
  return scene;
}
