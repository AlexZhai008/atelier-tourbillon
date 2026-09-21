import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const TAU=Math.PI*2;

export function geometryTools(materials){
  const cache=new Map();
  const cached=(key,create)=>{if(!cache.has(key))cache.set(key,create());return cache.get(key);};
  function mesh(geometry,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=!(material.transmission>0);parent.add(m);return m;}
  function extrude(shape,depth,face,edge,parent,x=0,y=0,z=0,bevel=.01){
    const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:4,steps:1,curveSegments:28});g.translate(0,0,-depth/2);return mesh(g,[face,edge],parent,x,y,z);
  }
  function ring(ro,ri,h,mat,parent,x=0,y=0,z=0,edge=mat){
    const g=cached(`ring:${ro}:${ri}:${h}`,()=>{const s=new THREE.Shape();s.absarc(0,0,ro,0,TAU,false);const hole=new THREE.Path();hole.absarc(0,0,ri,0,TAU,true);s.holes.push(hole);const bevel=Math.min(.008,(ro-ri)*.15,h*.20);const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:ro<.15?32:ro<.8?64:96});geo.translate(0,0,-h/2);return geo;});
    return mesh(g,mat===edge?mat:[mat,edge],parent,x,y,z);
  }
  function box(w,h,d,mat,parent,x=0,y=0,z=0,r=.016){return mesh(cached(`box:${w}:${h}:${d}:${r}`,()=>new RoundedBoxGeometry(w,h,d,d<.02?1:2,Math.min(r,w/3,h/3,d/3))),mat,parent,x,y,z);}
  function cylinder(r,h,mat,parent,x=0,y=0,z=0){return mesh(cached(`cylinder:${r}:${h}`,()=>{const g=new THREE.CylinderGeometry(r,r,h,r>1?192:64);g.rotateX(Math.PI/2);return g;}),mat,parent,x,y,z);}
  function torus(r,t,mat,parent,x=0,y=0,z=0){return mesh(cached(`torus:${r}:${t}`,()=>new THREE.TorusGeometry(r,t,12,r>.3?192:96)),mat,parent,x,y,z);}
  function beam(x1,y1,x2,y2,w,d,z,mat,parent){const b=box(w,Math.hypot(x2-x1,y2-y1),d,mat,parent,(x1+x2)/2,(y1+y2)/2,z);b.rotation.z=-Math.atan2(x2-x1,y2-y1);return b;}
  function screw(parent,x,y,z,r=.035){
    ring(r*1.25,r*.91,.012,materials.steel,parent,x,y,z-.01);
    // A recessed slot exposes dark steel; the polished rim catches a separate highlight.
    cylinder(r,.017,materials.blue,parent,x,y,z);
    const slot=box(r*1.48,.007,.003,materials.black,parent,x,y,z+.011,.001);slot.rotation.z=.4;
    const lip=box(r*1.42,.0017,.002,materials.steel,parent,x,y+.004,z+.012,.0003);lip.rotation.z=.4;
  }
  function jewel(parent,x,y,z,r=.041){ring(r*1.8,r*1.1,.022,materials.polish,parent,x,y,z);cylinder(r,.026,materials.ruby,parent,x,y,z+.013);torus(r*.72,.007,materials.ruby,parent,x,y,z+.029);cylinder(r*.27,.041,materials.steel,parent,x,y,z+.024);}
  function text(text,w,h,parent,x,y,z,color='#d8d5c9',size=64){
    const c=document.createElement('canvas');c.width=2048;c.height=512;const ctx=c.getContext('2d');ctx.font=`${size*4}px Georgia`;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,1024,256);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=16;texture.minFilter=THREE.LinearMipmapLinearFilter;
    return mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}),parent,x,y,z);
  }
  function pathShape(points){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s;}
  return {mesh,extrude,ring,box,cylinder,torus,beam,screw,jewel,text,pathShape};
}

// Preserve articulated groups while batching stationary details into few draw calls.
export function batchDetails(root){
  root.updateMatrixWorld(true);
  const original=new Set();
  const process=g=>{
    const buckets=new Map();const inverse=g.matrixWorld.clone().invert();
    const visit=o=>{
      if(o!==g&&o.userData.articulated){process(o);return;}
      for(const child of [...o.children])visit(child);
      if(!o.isMesh||Array.isArray(o.material)||o.material.transmission>0||o.material.transparent)return;
      if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(o);
    };
    visit(g);
    for(const [material,meshes] of buckets){if(meshes.length<2)continue;const inputs=meshes.map(m=>{const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,m.matrixWorld));return geo;});
      const merged=mergeGeometries(inputs,false);inputs.forEach(geo=>geo.dispose());if(!merged)continue;
      const m=new THREE.Mesh(merged,material);m.castShadow=m.receiveShadow=true;g.add(m);for(const old of meshes){original.add(old.geometry);old.removeFromParent();}
    }
  };
  for(const group of [...root.children])process(group);
  const used=new Set();root.traverse(o=>{if(o.geometry)used.add(o.geometry);});for(const geo of original)if(!used.has(geo))geo.dispose();
}
