import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const TAU=Math.PI*2;
export const PARTS=[
  {id:'crystal',name:'蓝宝石表镜',en:'SAPPHIRE CRYSTAL',text:'通透的弧面表镜与透明中壳，展现机芯的层次。模型以光学透射材质表现蓝宝石质感，可切换为金属外壳。',anchor:[-1.65,1.20,.71]},
  {id:'hands',name:'时分指针',en:'TIME DISPLAY',text:'时针、分针与中央秒针分别按 12 小时、60 分钟和 60 秒一周的比例走时。从打开页面时的本机时间开始，跟随统一的模拟时钟运行。',anchor:[.12,.38,.62]},
  {id:'dial',name:'悬浮时标圈',en:'SUSPENDED CHAPTER RING',text:'独立悬浮的十二枚立体时标与六十分刻度环绕镂空表盘，让时间读数与机械运动同时可见。',anchor:[1.7,1,.4]},
  {id:'bridges',name:'镂空机芯桥板',en:'SKELETON BRIDGES',text:'香槟金桥板跨越齿轮轴心。蓝钢螺钉与红宝石轴承强调支撑位置；开放式结构保留对传动轮系的观察空间。',anchor:[-.94,.1,.28]},
  {id:'train',name:'发条与传动轮系',en:'BARREL & GEAR TRAIN',text:'发条盒、中心轮、过轮与擒纵轮构成示意传动链。相邻轮交替旋转，转速按齿数反比关联。轮齿使用统一模数的简化轮廓，非加工级渐开线。',anchor:[-.8,.67,.02]},
  {id:'tourbillon',name:'60 秒陀飞轮',en:'FLYING TOURBILLON',text:'框架每 60 秒旋转一周，承载每秒往复 3 次的摆轮与伸缩游丝。旋转与振荡叠加展示陀飞轮原理，内部擒纵运动为视觉示意。',anchor:[-.37,-.98,.22]},
  {id:'case',name:'透明表壳与表链',en:'CASE & BRACELET',text:'完整腕表包含透明表壳、双层表圈、表耳、滚花表冠、分节表链与折叠表扣。42 mm 为概念表壳直径，整体比例用于可视化展示。',anchor:[2.32,0,-.12]},
];

export function createWatch(){
  const root=new THREE.Group();root.name='XT-01 Tourbillon';root.rotation.z=-.22;
  const gold=new THREE.MeshStandardMaterial({color:0xc8a46b,metalness:.84,roughness:.29});
  const bright=new THREE.MeshStandardMaterial({color:0xe0c190,metalness:.88,roughness:.22});
  const silver=new THREE.MeshStandardMaterial({color:0xc3cfcb,metalness:.92,roughness:.21});
  const dark=new THREE.MeshStandardMaterial({color:0x29312c,metalness:.75,roughness:.38});
  const blue=new THREE.MeshStandardMaterial({color:0x274878,metalness:.8,roughness:.19});
  const ruby=new THREE.MeshPhysicalMaterial({color:0xa8244f,metalness:.2,roughness:.13,clearcoat:1});
  const glass=new THREE.MeshPhysicalMaterial({color:0xe3eee5,metalness:0,roughness:.06,transmission:1,thickness:.14,ior:1.46,envMapIntensity:.5,clearcoat:.7,transparent:false});
  const caseGlass=new THREE.MeshPhysicalMaterial({color:0xc9ddcd,roughness:.1,transmission:.96,thickness:.22,ior:1.38,envMapIntensity:.7,clearcoat:1});
  const lume=new THREE.MeshStandardMaterial({color:0xd1daca,metalness:.4,roughness:.25,emissive:0x9baf94,emissiveIntensity:.07});
  const groups={};const anchors={};
  for(const p of PARTS){const g=new THREE.Group();g.name=p.name;g.userData.part=p.id;groups[p.id]=g;root.add(g);const a=new THREE.Object3D();a.position.fromArray(p.anchor);g.add(a);anchors[p.id]=a;}
  const glassMeshes=[];const metalShell=new THREE.MeshStandardMaterial({color:0xa9b0ac,metalness:.94,roughness:.22});
  function mesh(geo,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);if(mat===glass||mat===caseGlass)glassMeshes.push(m);return m;}
  const annuli=new Map();
  function ring(ro,ri,h,mat,parent,x=0,y=0,z=0){
    const key=[ro,ri,h].join(':');let geo=annuli.get(key);
    if(!geo){const s=new THREE.Shape();s.absarc(0,0,ro,0,TAU,false);const hole=new THREE.Path();hole.absarc(0,0,ri,0,TAU,true);s.holes.push(hole);geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:.008,bevelSize:.009,bevelSegments:2,steps:1,curveSegments:64});geo.translate(0,0,-h/2);annuli.set(key,geo);}
    return mesh(geo,mat,parent,x,y,z);
  }
  const boxes=new Map();
  function box(w,h,d,mat,parent,x=0,y=0,z=0,round=.035){const key=[w,h,d,round].join(':');let g=boxes.get(key);if(!g){g=new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/3,h/3,d/3));boxes.set(key,g);}return mesh(g,mat,parent,x,y,z);}
  const cylinders=new Map();
  function cylinder(r,h,mat,parent,x=0,y=0,z=0){const key=[r,h].join(':');let g=cylinders.get(key);if(!g){g=new THREE.CylinderGeometry(r,r,h,32);g.rotateX(Math.PI/2);cylinders.set(key,g);}return mesh(g,mat,parent,x,y,z);}
  function torus(r,t,mat,parent,x=0,y=0,z=0){return mesh(new THREE.TorusGeometry(r,t,8,80),mat,parent,x,y,z);}
  function beam(x1,y1,x2,y2,w,d,z,mat,parent){const b=box(w,Math.hypot(x2-x1,y2-y1),d,mat,parent,(x1+x2)/2,(y1+y2)/2,z);b.rotation.z=-Math.atan2(x2-x1,y2-y1);return b;}
  function screw(parent,x,y,z,r=.045){cylinder(r,.028,blue,parent,x,y,z);const slot=box(r*1.3,.009,.005,silver,parent,x,y,z+.017,.001);slot.rotation.z=.5;}
  function bearing(parent,x,y,z,r=.064){ring(r*1.55,r,.025,gold,parent,x,y,z);cylinder(r,.031,ruby,parent,x,y,z+.014);cylinder(r*.35,.047,silver,parent,x,y,z+.027);}
  function textPlane(text,w,h,parent,x,y,z,color='#c8b88f',size=64){
    const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.font=`${size}px Georgia`;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide});return mesh(new THREE.PlaneGeometry(w,h),mat,parent,x,y,z);
  }
  // The case remains open through the center; no opaque plate hides the train.
  const shell=groups.case;
  ring(2.13,1.98,.51,caseGlass,shell,0,0,-.10);
  ring(2.15,2.04,.09,silver,shell,0,0,.24);ring(2.15,2.01,.09,silver,shell,0,0,-.42);
  torus(2.11,.026,bright,shell,0,0,.305);torus(2.1,.028,silver,shell,0,0,-.48);
  ring(1.94,1.79,.095,dark,shell,0,0,-.30);ring(1.80,1.75,.035,gold,shell,0,0,-.22);
  cylinder(1.96,.04,glass,shell,0,0,-.46);
  for(let i=0;i<12;i++){const a=i*TAU/12; screw(shell,2.077*Math.sin(a),2.077*Math.cos(a),.30,.032);}
  for(const side of [-1,1]){
    for(const x of [-.85,.85]){const lug=box(.27,.82,.32,silver,shell,x,side*2.10,-.10);lug.rotation.x=side*-.12;box(.14,.64,.20,caseGlass,shell,x,side*2.12,.09);}
    for(let i=0;i<7;i++){
      const y=side*(2.32+i*.32),z=-.14-.035*i*i;const link=new THREE.Group();link.position.set(0,y,z);link.rotation.x=-side*(.1+i*.15);shell.add(link);
      const width=1.54-i*.036;
      box(width,.295,.22,caseGlass,link);box(width*.45,.26,.26,silver,link,0,0,-.018);
      for(const edge of [-1,1]){box(.15,.26,.25,silver,link,edge*(width/2-.075),0,-.01);box(.028,.21,.013,bright,link,edge*.29,0,.132);}
      beam(-width/2,-.14,width/2,-.14,.025,.024,0,silver,link);
    }
    box(1.19,.40,.18,silver,shell,0,side*4.42,-1.97);box(.88,.27,.03,dark,shell,0,side*4.43,-1.865);
  }
  textPlane('XT',.24,.12,shell,0,-4.43,-1.84,'#c3c9bd');
  const crown=new THREE.Group();crown.position.set(2.23,0,-.09);crown.rotation.y=Math.PI/2;shell.add(crown);
  cylinder(.20,.40,silver,crown);cylinder(.15,.025,gold,crown,0,0,.215);
  for(let i=0;i<28;i++){const a=i*TAU/28;const b=box(.025,.045,.29,dark,crown,.197*Math.cos(a),.197*Math.sin(a),0,.004);b.rotation.z=a;}
  cylinder(.074,.026,blue,crown,0,0,.24);
  // A separate crystal is essential for a legible layered exploded view.
  cylinder(2.025,.045,glass,groups.crystal,0,0,.66);ring(2.065,2.015,.045,silver,groups.crystal,0,0,.645);
  torus(2.037,.011,lume,groups.crystal,0,0,.68);
  const dial=groups.dial;ring(1.984,1.775,.042,dark,dial,0,0,.39);torus(1.97,.011,gold,dial,0,0,.425);torus(1.785,.012,gold,dial,0,0,.43);
  for(let i=0;i<60;i++){
    const a=i*TAU/60,r=i%5===0?1.85:1.90;const tick=box(i%5===0?.055:.018,i%5===0?.16:.065,.024,i%5===0?bright:silver,dial,r*Math.sin(a),r*Math.cos(a),.435,.004);tick.rotation.z=-a;
    if(i%5===0){const baton=box(.045,.12,.045,lume,dial,1.73*Math.sin(a),1.73*Math.cos(a),.443,.009);baton.rotation.z=-a;}
  }
  textPlane('XII',.3,.15,dial,0,1.58,.455);textPlane('III',.22,.13,dial,1.57,0,.455);textPlane('IX',.23,.14,dial,-1.57,0,.455);
  textPlane('A T E L I E R',.92,.19,dial,0,1.29,.43,'#cfc5a9',46);textPlane('TOURBILLON',.68,.105,dial,0,-1.68,.45,'#b3b8a5',42);
  // Gear rings with individual machined-looking teeth, open spokes and pinions.
  const moving=[];
  function gear(radius,teeth,x,y,z,rate,parent=groups.train,mat=gold,phase=0){
    const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
    const s=new THREE.Shape(),rootR=radius-.024,tipR=radius+.018;
    for(let i=0;i<teeth*4;i++){const a=i*TAU/(teeth*4),r=(i%4===1||i%4===2)?tipR:rootR;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)s.moveTo(px,py);else s.lineTo(px,py);}s.closePath();
    const h=new THREE.Path();h.absarc(0,0,radius*.74,0,TAU,true);s.holes.push(h);
    const geo=new THREE.ExtrudeGeometry(s,{depth:.055,bevelEnabled:true,bevelThickness:.005,bevelSize:.004,bevelSegments:1,curveSegments:48});geo.translate(0,0,-.0275);mesh(geo,mat,g);
    torus(radius*.79,.009,bright,g,0,0,.034);
    const spokes=radius>.4?6:5;
    for(let i=0;i<spokes;i++){const a=i*TAU/spokes;beam(.04*Math.cos(a),.04*Math.sin(a),radius*.80*Math.cos(a),radius*.80*Math.sin(a),radius*.095,.038,.003,mat,g);}
    cylinder(radius*.19,.079,mat,g);cylinder(.031,.28,silver,g,0,0,.01);
    for(let i=0;i<12;i++){const a=i*TAU/12;const b=box(.018,.044,.07,silver,g,.065*Math.cos(a),.065*Math.sin(a),.068,.003);b.rotation.z=a-Math.PI/2;}
    moving.push({object:g,rate,phase,teeth});g.rotation.z=phase;return g;
  }
  // Pitch radii share a .02 module. Main centers are laid out at pitch tangencies.
  const train=groups.train;
  ring(1.73,1.57,.045,gold,train,0,0,-.17);
  const gearSpecs=[{r:.7,n:70,x:-.8,y:.62},{r:.55,n:55,x:.4397,y:.7802},{r:.35,n:35,x:1.1307,y:.2035},{r:.27,n:27,x:.9637,y:-.3936},{r:.35,n:35,x:.4327,y:-.7135}];
  gearSpecs.forEach((g,i)=>{gear(g.r,g.n,g.x,g.y,-.03,((i%2===0)?-1:1)*TAU/60*35/g.n,train,gold,i*.17);bearing(train,g.x,g.y,.14,.041);});
  const barrel=gearSpecs[0];
  ring(.54,.49,.028,bright,train,barrel.x,barrel.y,-.07);
  const springPoints=[];for(let i=0;i<=480;i++){const t=i/480,a=t*TAU*5.5,r=.07+t*.42;springPoints.push(new THREE.Vector3(barrel.x+r*Math.cos(a),barrel.y+r*Math.sin(a),-.08));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPoints),360,.008,4,false),blue,train);
  gear(.24,24,-1.10,-.42,-.09,TAU/100,train,silver);gear(.34,34,-1.36,.098,-.085,-TAU/100*24/34,train,gold);
  for(let i=0;i<18;i++){const a=i*TAU/18; screw(train,1.66*Math.cos(a),1.66*Math.sin(a),-.13,.028);}
  // Open bridges, blue screws and ruby bearings instead of an opaque face plate.
  const bridges=groups.bridges;
  const paths=[[-1.48,1.05,-.8,.62],[-.8,.62,-1.50,-.36],[.4397,.7802,.70,1.49],[.4397,.7802,1.55,.86],[1.1307,.2035,1.62,-.15],[.4327,-.7135,1.35,-.95],[-1.15,-1.15,-1.60,-.43]];
  paths.forEach(([x1,y1,x2,y2])=>{beam(x1,y1,x2,y2,.15,.055,.18,gold,bridges);beam(x1,y1,x2,y2,.018,.009,.214,bright,bridges);});
  for(const g of gearSpecs){ring(.12,.067,.07,gold,bridges,g.x,g.y,.19);bearing(bridges,g.x,g.y,.235,.044);}
  [[-1.48,1.05],[-1.50,-.36],[.70,1.49],[1.55,.86],[1.62,-.15],[1.35,-.95],[-1.15,-1.15]].forEach(([x,y])=>screw(bridges,x,y,.225,.045));
  textPlane('XT–01',.4,.12,bridges,-1.2,-.65,.22,'#beb79e');
  // Flying tourbillon cage with an independently oscillating balance and hairspring.
  const tour=groups.tourbillon;const cage=new THREE.Group();cage.position.set(-.38,-.99,.03);tour.add(cage);
  ring(.685,.635,.048,silver,tour,-.38,-.99,-.04);ring(.70,.679,.031,gold,tour,-.38,-.99,-.02);
  ring(.605,.574,.038,gold,cage,0,0,.19);torus(.585,.012,silver,cage,0,0,.228);
  ring(.60,.567,.035,dark,cage,0,0,-.105);
  for(let i=0;i<3;i++){const a=i*TAU/3+.2,x=.575*Math.cos(a),y=.575*Math.sin(a);cylinder(.025,.30,silver,cage,x,y,.048);beam(0,0,x,y,.047,.032,.23,silver,cage);screw(cage,x,y,.249,.03);}
  const balance=new THREE.Group();balance.position.z=.065;cage.add(balance);torus(.462,.031,bright,balance);
  for(let i=0;i<3;i++){const a=i*TAU/3;beam(0,0,.455*Math.cos(a),.455*Math.sin(a),.034,.025,0,gold,balance);}
  for(let i=0;i<12;i++){const a=i*TAU/12;cylinder(.022,.025,silver,balance,.465*Math.cos(a),.465*Math.sin(a),.023);}
  const hairspring=new THREE.Group();cage.add(hairspring);
  const spiral=[];for(let i=0;i<=600;i++){const t=i/600,a=t*TAU*6;spiral.push(new THREE.Vector3((.036+t*.335)*Math.cos(a),(.036+t*.335)*Math.sin(a),.115));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral),480,.0055,4,false),blue,hairspring);
  bearing(cage,0,0,.266,.044);
  const escape=gear(.105,15,.32,.18,-.07,TAU/3,cage,silver);
  const pallet=box(.18,.025,.025,blue,cage,.15,.21,.022,.005);
  // Hands rotate from a single simulation clock, preserving exact time ratios.
  const hands={};
  function hand(name,length,width,z,mat){const group=new THREE.Group();group.position.z=z;groups.hands.add(group);const s=new THREE.Shape();s.moveTo(-width*.55,-.20);s.lineTo(-width*.5,length*.62);s.lineTo(0,length);s.lineTo(width*.5,length*.62);s.lineTo(width*.55,-.20);s.closePath();const geom=new THREE.ExtrudeGeometry(s,{depth:.023,bevelEnabled:true,bevelSize:.007,bevelThickness:.006,bevelSegments:1});mesh(geom,mat,group);box(width*.23,length*.57,.007,lume,group,0,length*.40,.031,.002);hands[name]=group;}
  hand('hour',1.02,.095,.46,blue);hand('minute',1.43,.065,.50,silver);
  const second=new THREE.Group();second.position.z=.56;groups.hands.add(second);box(.014,1.98,.018,bright,second,0,.60,0,.002);ring(.078,.057,.012,bright,second,0,-.34,0);hands.second=second;
  cylinder(.09,.12,silver,groups.hands,0,0,.51);cylinder(.047,.025,blue,groups.hands,0,0,.584);
  const offsets={case:-.75,train:0,tourbillon:.30,bridges:.9,dial:1.65,hands:2.4,crystal:3.1};
  // Sparse guide lines connect the separated layers without obscuring the model.
  const guide=new THREE.Group();root.add(guide);
  const lineMat=new THREE.LineDashedMaterial({color:0xb7aa86,transparent:true,opacity:.19,dashSize:.06,gapSize:.07});
  for(const x of [-1.5,1.5]){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,0,-1.25),new THREE.Vector3(x,0,6.86)]);const l=new THREE.Line(geo,lineMat);l.computeLineDistances();guide.add(l);}guide.visible=false;
  let selectedMaterials=[];
  function select(id){
    for(const [m,old] of selectedMaterials)m.emissive.copy(old);selectedMaterials=[];
    if(!id)return;
    // Highlight only cloned materials to avoid changing unrelated parts sharing metal.
    groups[id].traverse(o=>{if(o.isMesh&&o.material.emissive&&o.material!==glass&&o.material!==caseGlass){if(!o.userData.highlightMaterial){o.material=o.material.clone();o.userData.highlightMaterial=true;}selectedMaterials.push([o.material,o.material.emissive.clone()]);o.material.emissive.set(0x30200a);}});
  }
  function setFinish(mode){const colors=mode==='silver'?[0xbccac9,0xe3e6df]:mode==='dark'?[0x535c5b,0x9caaa5]:[0xc8a46b,0xe0c190];gold.color.set(colors[0]);bright.color.set(colors[1]);}
  // Track metal families so selected material clones follow finish changes as well.
  gold.name='champagne';bright.name='polished-champagne';
  return {root,groups,anchors,moving,cage,balance,hairspring,hands,
    select,
    setFinish(mode){setFinish(mode);root.traverse(o=>{if(o.isMesh&&o.userData.highlightMaterial){if(o.material.name===gold.name)o.material.color.copy(gold.color);if(o.material.name===bright.name)o.material.color.copy(bright.color);}});},
    setTransparent(value){for(const m of glassMeshes){if(!m.userData.originalGlass)m.userData.originalGlass=m.material;m.material=value?m.userData.originalGlass:metalShell;}groups.crystal.visible=value;},
    update(t,explosion,clockSeconds){
      for(const [id,g] of Object.entries(groups))g.position.z=offsets[id]*explosion*1.65;
      guide.visible=explosion>.025;lineMat.opacity=explosion*.22;
      for(const g of moving)g.object.rotation.z=g.phase+t*g.rate;
      cage.rotation.z=-TAU*t/60;balance.rotation.z=Math.sin(t*TAU*3)*Math.PI*.76;
      hairspring.rotation.z=Math.sin(t*TAU*3)*.14;const pulse=1+.08*Math.sin(t*TAU*3);hairspring.scale.set(pulse,pulse,1);
      pallet.rotation.z=Math.sin(t*TAU*3)*.22;escape.rotation.z=Math.floor(t*6)*TAU/15;
      const time=clockSeconds+t;hands.hour.rotation.z=-TAU*(time%43200)/43200;hands.minute.rotation.z=-TAU*(time%3600)/3600;hands.second.rotation.z=-TAU*(time%60)/60;
    },
    dispose(){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});for(const g of geometries)g.dispose();for(const m of materials){m.map?.dispose();m.dispose();}},
  };
}
