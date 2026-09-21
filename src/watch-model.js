import * as THREE from 'three';
import {createFinishes} from './watch-finishing.js';
import {geometryTools,batchDetails} from './watch-geometry.js';
const TAU=Math.PI*2;
export const PARTS=[
  {id:'crystal',name:'蓝宝石表镜',en:'SAPPHIRE CRYSTAL',text:'高透射、低粗糙度表镜，降低折射对微小机芯结构的模糊。透明中壳与底盖是本模型的展示性改造；参考腕表原款采用金属表壳。',anchor:[-1.65,1.2,.73]},
  {id:'hands',name:'时分秒指针',en:'HOURS · MINUTES · SECONDS',text:'金质时分针采用拉丝表面、镜面倒角和嵌入式夜光。蓝钢长秒针带明亮中脊，取消尾部圆环。三根指针共用中央轴心与抛光轴帽，分层独立旋转；1× 速度下秒针 60 秒平滑旋转一周。',anchor:[0,0,.66]},
  {id:'dial',name:'立体时标与刻度',en:'APPLIED HOUR MARKERS',text:'黑色分钟圈配立体金属时标，外缘为抛光切面。12 点双时标与五分钟数字加强辨识度；四倍尺寸文字贴图和细分几何支持近距离观察。',anchor:[1.65,1.0,.45]},
  {id:'bridges',name:'深灰镂空桥板',en:'ANTHRACITE BRIDGES',text:'参考江诗丹顿 Overseas 2160 SQ 机芯的深灰镂空结构，采用细拉丝、抛光倒角、红宝石轴承与蓝钢螺钉。桥板路径按可见轮系重建，不是原厂零件测绘。',anchor:[-1.10,.05,.21]},
  {id:'train',name:'发条与传动轮系',en:'BARREL & GEAR TRAIN',text:'黄铜轮系具有细化齿形、圆周加工纹和钢制小齿轴。主轮系以齿数反比交替旋转；后层机板与边缘摆陀增加结构深度。齿形和传动路线为可视化近似。',anchor:[-.62,.84,-.02]},
  {id:'tourbillon',name:'六点位陀飞轮',en:'60-SECOND TOURBILLON',text:'参考 Overseas 的六点位布局与马耳他十字形框架，重建抛光框架、摆轮配重、蓝色游丝、擒纵轮与宝石轴承。框架 60 秒一周，摆轮按参考机芯的 2.5 Hz 往复。',anchor:[0,-1.03,.22]},
  {id:'case',name:'表壳与一体式表链',en:'CASE & INTEGRATED BRACELET',text:'借鉴 Overseas 六瓣表圈与一体式金属表链的轮廓，交替使用缎面拉丝和镜面抛光。保留透明中壳便于探索内部；42.5 mm 为参考款直径，模型不是品牌官方数字资产。',anchor:[2.31,0,-.10]},
];

export function createWatch({anisotropy=8}={}){
  const root=new THREE.Group();root.name='XT-02 / Overseas-inspired skeleton study';root.rotation.z=-.16;
  const m=createFinishes(anisotropy);
  const {mesh,extrude,ring,box,cylinder,torus,beam,screw,jewel,text,pathShape}=geometryTools(m);
  const groups={},anchors={},moving=[];
  for(const p of PARTS){const g=new THREE.Group();g.name=p.name;g.userData.part=p.id;root.add(g);groups[p.id]=g;const a=new THREE.Object3D();a.position.fromArray(p.anchor);g.add(a);anchors[p.id]=a;}
  const articulated=(parent,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);g.userData.articulated=true;parent.add(g);return g;};
  // Sculpted six-lobed bezel, satin flats and polished bevels.
  function bezelShape(ro,ri){const s=new THREE.Shape();for(let i=0;i<384;i++){const a=i*TAU/384,phase=(a+Math.PI/12)%(TAU/6),notch=Math.exp(-Math.pow((phase-TAU/12)/.085,6)),r=ro-.105*notch;const x=r*Math.cos(a),y=r*Math.sin(a);if(i)s.lineTo(x,y);else s.moveTo(x,y);}s.closePath();const hole=new THREE.Path();hole.absarc(0,0,ri,0,TAU,true);s.holes.push(hole);return s;}
  const shell=groups.case;
  ring(2.10,1.98,.48,m.caseGlass,shell,0,0,-.12);
  extrude(bezelShape(2.17,1.966),.082,m.gold,m.polish,shell,0,0,.29,.014);
  ring(2.10,1.97,.075,m.gold,shell,0,0,-.43,m.polish);torus(2.045,.012,m.polish,shell,0,0,-.475);
  ring(1.92,1.78,.048,m.bridge,shell,0,0,-.31,m.steel);cylinder(1.975,.026,m.glass,shell,0,0,-.455);
  for(let i=0;i<8;i++){const a=i*TAU/8;screw(shell,2.025*Math.sin(a),2.025*Math.cos(a),-.48,.03);}
  for(const side of [-1,1]){
    const shoulder=pathShape([[-1.02,1.78],[-.91,2.38],[-.65,2.46],[.65,2.46],[.91,2.38],[1.02,1.78]]);
    const lugs=extrude(shoulder,.21,m.gold,m.polish,shell,0,0,-.04,.045);if(side<0)lugs.rotation.z=Math.PI;
    const curve=new THREE.CatmullRomCurve3([[2.40,-.14],[3.16,-.36],[3.65,-1.30],[3.64,-3.05],[2.50,-4.80],[.58,-5.35]].map(([y,z])=>new THREE.Vector3(0,side*y,z)));
    const count=30,pitch=curve.getLength()/count;
    for(let i=0;i<=count;i++){
      const u=i/count,p=curve.getPointAt(u),tangent=curve.getTangentAt(u);
      const w=1.56-.36*Math.min(u*2.5,1),link=new THREE.Group();
      link.position.copy(p);link.rotation.x=Math.atan2(side*tangent.z,side*tangent.y);shell.add(link);
      // Rounded three-piece links with narrow polished shoulders and satin faces.
      box(w,pitch*.91,.16,m.polish,link,0,0,0,.035);
      box(w*.46,pitch*.85,.025,m.gold,link,0,0,.086,.010);
      for(const sign of [-1,1]){
        box(w*.225,pitch*.82,.022,m.gold,link,sign*w*.365,0,.084,.009);
        const pin=cylinder(.024,.016,m.steel,link,sign*(w/2+.002),0,0);pin.rotation.y=Math.PI/2;
      }
    }
  }
  const clasp=new THREE.Group();clasp.position.set(0,0,-5.35);clasp.rotation.x=Math.PI;shell.add(clasp);
  box(1.23,1.32,.18,m.polish,clasp,0,0,0,.06);
  for(const side of [-1,1]){
    box(1.14,.625,.025,m.gold,clasp,0,side*.322,.098,.025);
    box(.065,.30,.085,m.steel,clasp,side*.631,0,0,.022);
    cylinder(.045,1.12,m.steel,clasp,0,side*.60,-.045).rotation.y=Math.PI/2;
  }
  text('ATELIER',.62,.095,clasp,0,.22,.117,'#63523c',56);
  const crown=new THREE.Group();crown.position.set(2.25,0,-.10);crown.rotation.y=Math.PI/2;shell.add(crown);
  cylinder(.182,.32,m.gold,crown);ring(.184,.148,.029,m.polish,crown,0,0,.17);cylinder(.149,.025,m.gold,crown,0,0,.172);
  for(let i=0;i<40;i++){const a=i*TAU/40;const b=box(.010,.031,.255,m.polish,crown,.181*Math.cos(a),.181*Math.sin(a),0,.003);b.rotation.z=a;}
  for(let i=0;i<4;i++){const a=i*TAU/4;const mark=box(.026,.076,.008,m.polish,crown,.029*Math.sin(a),.029*Math.cos(a),.19,.003);mark.rotation.z=-a;}
  cylinder(1.971,.022,m.glass,groups.crystal,0,0,.71);ring(2.001,1.970,.025,m.polish,groups.crystal,0,0,.69);

  // Applied batons replace printed Roman numerals. All details are true geometry.
  const dial=groups.dial;
  ring(1.958,1.73,.048,m.black,dial,0,0,.425,m.polish);torus(1.95,.009,m.polish,dial,0,0,.458);torus(1.731,.008,m.polish,dial,0,0,.458);
  for(let i=0;i<60;i++){
    const a=i*TAU/60;const r=i%5===0?1.865:1.889;
    const tick=box(i%5===0?.020:.009,i%5===0?.09:.045,.008,m.lume,dial,r*Math.sin(a),r*Math.cos(a),.459,.0015);tick.rotation.z=-a;
    if(i%5===0){
      if(i!==30){const offsets=i===0?[-.046,.046]:[0];for(const ox of offsets){const marker=new THREE.Group();marker.position.set(1.65*Math.sin(a),1.65*Math.cos(a),.465);marker.rotation.z=-a;dial.add(marker);
        const profile=pathShape([[-.043,-.14],[-.055,.10],[-.034,.15],[.034,.15],[.055,.10],[.043,-.14]]);extrude(profile,.033,m.gold,m.polish,marker,ox,0,0,.010);box(.024,.186,.009,m.lume,marker,ox,.01,.031,.004);}}
      const number=i===0?'60':String(i);const numberLabel=text(number,.13,.072,dial,1.79*Math.sin(a),1.79*Math.cos(a),.472,'#c9c6bd',54);numberLabel.rotation.z=-a;
    }
  }
  text('A T E L I E R',.92,.12,dial,0,1.39,.478,'#c6c4ba',49);
  text('S K E L E T O N',.58,.078,dial,0,1.23,.478,'#8f928f',43);

  // The main train is modeled as actual perforated wheels rather than flat disks.
  function gear(radius,teeth,x,y,z,rate,parent=groups.train,phase=0){
    const g=articulated(parent,x,y,z);const s=new THREE.Shape();
    const profile=[-.024,-.024,-.020,.008,.018,.018,.008,-.020];
    for(let i=0;i<teeth*8;i++){const a=i*TAU/(teeth*8),r=radius+profile[i%8];if(i)s.lineTo(r*Math.cos(a),r*Math.sin(a));else s.moveTo(r*Math.cos(a),r*Math.sin(a));}s.closePath();
    const spokes=radius>.32?5:4,inner=radius*.22,outer=radius*.77;
    for(let j=0;j<spokes;j++){const a=j*TAU/spokes+.15,b=(j+1)*TAU/spokes-.15;const hole=new THREE.Path();hole.moveTo(inner*Math.cos(a),inner*Math.sin(a));hole.lineTo(outer*Math.cos(a),outer*Math.sin(a));hole.absarc(0,0,outer,a,b,false);hole.lineTo(inner*Math.cos(b),inner*Math.sin(b));hole.absarc(0,0,inner,b,a,true);hole.closePath();s.holes.push(hole);}
    extrude(s,.037,m.wheel,m.polish,g,0,0,0,.0035);torus(radius*.84,.0045,m.polish,g,0,0,.024);
    cylinder(radius*.18,.052,m.wheel,g);cylinder(.025,.19,m.steel,g,0,0,.018);
    for(let i=0;i<10;i++){const a=i*TAU/10;const b=box(.012,.025,.053,m.steel,g,.047*Math.cos(a),.047*Math.sin(a),.06,.002);b.rotation.z=a;}
    moving.push({object:g,rate,phase,teeth});g.rotation.z=phase;return g;
  }
  const train=groups.train;ring(1.72,1.50,.041,m.bridge,train,0,0,-.20,m.steel);
  // Skeleton backplate with windows keeps depth visible through both sides.
  const plate=new THREE.Shape();plate.absarc(0,0,1.70,0,TAU,false);
  [[-.64,.65,.67],[.63,.62,.54],[0,-1.01,.665],[1.1,-.24,.26],[-1.16,-.24,.25]].forEach(([x,y,r])=>{const h=new THREE.Path();h.absarc(x,y,r,0,TAU,true);plate.holes.push(h);});
  extrude(plate,.035,m.bridge,m.steel,train,0,0,-.22,.003);
  const spec=[{r:.62,n:62,x:-.63,y:.70},{r:.47,n:47,x:.46,y:.70},{r:.30,n:30,x:1.06,y:.218},{r:.245,n:24.5,x:.885,y:-.298},{r:.295,n:29.5,x:.414,y:-.562}];
  // integer tooth counts with matching pitch radii (module .02).
  spec[3].n=25;spec[3].r=.25;spec[4].n=29;spec[4].r=.29;
  spec.forEach((s,i)=>{gear(s.r,s.n,s.x,s.y,-.07,(i%2?-1:1)*TAU/60*29/s.n,train,i*.14);jewel(train,s.x,s.y,.056,.029);});
  ring(.48,.453,.023,m.polish,train,-.63,.70,-.099);
  const spring=[];for(let i=0;i<=768;i++){const t=i/768,a=t*TAU*7,r=.055+t*.38;spring.push(new THREE.Vector3(-.63+r*Math.cos(a),.70+r*Math.sin(a),-.121));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spring),768,.0042,6,false),m.steel,train);
  gear(.22,22,-1.10,-.18,-.103,-TAU/110);gear(.265,27,-1.29,.265,-.10,TAU/110*22/27);
  for(let i=0;i<18;i++){const a=i*TAU/18;screw(train,1.615*Math.cos(a),1.615*Math.sin(a),-.164,.022);}
  // Peripheral rotor is visible from the back rather than hiding the skeleton.
  const rotor=articulated(train,0,0,-.31);const rotorShape=new THREE.Shape();rotorShape.absarc(0,0,1.75,.15,Math.PI+.10,false);rotorShape.absarc(0,0,1.58,Math.PI+.10,.15,true);rotorShape.closePath();extrude(rotorShape,.055,m.gold,m.polish,rotor,0,0,0,.006);
  for(let i=0;i<28;i++){const a=.18+i*Math.PI/29;box(.013,.052,.008,m.black,rotor,1.66*Math.cos(a),1.66*Math.sin(a),-.033,.001).rotation.z=a;}

  const bridges=groups.bridges;
  function bridge(points,z=.15,width=.11){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],0)));const contour=[];
    for(let i=0;i<=48;i++){const t=i/48,p=curve.getPoint(t),v=curve.getTangent(t);contour.push([p.x-v.y*width/2,p.y+v.x*width/2]);}
    for(let i=48;i>=0;i--){const t=i/48,p=curve.getPoint(t),v=curve.getTangent(t);contour.push([p.x+v.y*width/2,p.y-v.x*width/2]);}
    extrude(pathShape(contour),.053,m.bridge,m.polish,bridges,0,0,z,.010);
  }
  bridge([[-1.49,1.00],[-1.21,.87],[-.87,.72],[-.63,.70]],.15,.17);
  bridge([[-.63,.70],[-.53,.32],[-.74,.05],[-1.25,-.20],[-1.53,-.45]],.15,.15);
  bridge([[.44,1.52],[.33,1.20],[.46,.70],[.86,.53],[1.06,.218]],.16,.18);
  bridge([[.46,.70],[1.10,.93],[1.47,.75]],.16,.13);
  bridge([[1.06,.218],[1.36,.05],[1.50,-.24]],.16,.14);
  bridge([[.885,-.298],[1.03,-.68],[1.26,-1.06]],.16,.16);
  bridge([[.414,-.562],[.61,-.61],[.80,-.77]],.15,.12);
  bridge([[-1.47,-.69],[-1.17,-1.12],[-.84,-1.36]],.12,.13);
  for(const s of spec){ring(.100,.049,.042,m.bridge,bridges,s.x,s.y,.166,m.polish);jewel(bridges,s.x,s.y,.203,.028);}
  [[-1.49,1],[-1.53,-.45],[.44,1.52],[1.47,.75],[1.50,-.24],[1.26,-1.06],[-.84,-1.36]].forEach(([x,y])=>screw(bridges,x,y,.20,.035));
  // Pierced bridge sections, recessed locating holes and polished countersinks.
  function piercedPlate(points,holes,z){
    const shape=pathShape(points);for(const [x,y,r] of holes){const h=new THREE.Path();h.absarc(x,y,r,0,TAU,true);shape.holes.push(h);}
    extrude(shape,.04,m.bridge,m.steel,bridges,0,0,z,.005);
    for(const [x,y,r] of holes)torus(r+.006,.003,m.steel,bridges,x,y,z+.026);
  }
  piercedPlate([[-1.19,.97],[-.96,1.30],[-.40,1.50],[.18,1.52],[.26,1.32],[-.35,1.22],[-.77,1.06],[-1.03,.82]],[[ -.69,1.25,.058],[-.39,1.35,.052],[-.08,1.405,.037]],.19);
  piercedPlate([[1.17,.81],[1.48,.48],[1.57,.08],[1.50,-.36],[1.29,-.41],[1.31,.04],[1.18,.40],[1.01,.61]],[[1.32,.42,.049],[1.438,.13,.055],[1.434,-.19,.048]],.185);
  piercedPlate([[-1.50,-.12],[-1.61,-.49],[-1.41,-.88],[-1.07,-1.26],[-.91,-1.16],[-1.18,-.80],[-1.33,-.42],[-1.29,-.16]],[[-1.46,-.44,.048],[-1.29,-.79,.05],[-1.09,-1.07,.037]],.14);
  for(const [x,y] of [[-.27,.27],[.14,.07],[-.71,-.33],[.80,-1.03]]){ring(.09,.057,.022,m.bridge,bridges,x,y,.11,m.steel);jewel(bridges,x,y,.13,.025);}
  text('XT–02',.32,.08,bridges,-1.15,-.63,.216,'#c7c4b8',54);

  const tour=groups.tourbillon,cage=articulated(tour,0,-1.02,.015);
  ring(.682,.611,.047,m.bridge,tour,0,-1.02,-.048,m.polish);torus(.651,.009,m.polish,tour,0,-1.02,-.015);
  ring(.610,.576,.029,m.steel,cage,0,0,.214);ring(.60,.559,.028,m.bridge,cage,0,0,-.095,m.polish);
  for(let i=0;i<60;i++){const a=i*TAU/60;box(i%5===0?.011:.005,i%5===0?.042:.021,.006,m.lume,tour,.653*Math.sin(a),-1.02+.653*Math.cos(a),-.014,.001).rotation.z=-a;}
  for(let i=0;i<4;i++){const a=i*TAU/4;const label=text(i===0?'60':String(i*15),.07,.041,tour,.646*Math.sin(a),-1.02+.646*Math.cos(a),.002,'#d6d8d5',56);label.rotation.z=-a;}
  // Four bifurcated arms evoke the reference's Maltese-cross carriage silhouette.
  for(let i=0;i<4;i++){
    const a=i*TAU/4;const arm=pathShape([[-.034,.065],[-.028,.25],[-.105,.49],[-.155,.535],[-.055,.522],[0,.46],[.055,.522],[.155,.535],[.105,.49],[.028,.25],[.034,.065]]);
    extrude(arm,.024,m.brushedSteel,m.steel,cage,0,0,.24,.006).rotation.z=a;
    cylinder(.019,.285,m.steel,cage,.572*Math.sin(a),.572*Math.cos(a),.053);screw(cage,.572*Math.sin(a),.572*Math.cos(a),.252,.023);
  }
  const balance=articulated(cage,0,0,.05);ring(.457,.422,.023,m.wheel,balance,0,0,0,m.polish);
  for(let i=0;i<4;i++){const a=i*TAU/4;beam(0,0,.443*Math.cos(a),.443*Math.sin(a),.025,.020,0,m.wheel,balance);}
  for(let i=0;i<16;i++){const a=i*TAU/16;cylinder(.017,.024,m.polish,balance,.452*Math.cos(a),.452*Math.sin(a),.013);}
  const hairspring=articulated(cage,0,0,0);const spiral=[];
  for(let i=0;i<=1400;i++){const t=i/1400,a=t*TAU*9.5,r=.039+t*.326;spiral.push(new THREE.Vector3(r*Math.cos(a),r*Math.sin(a),.109));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral),1400,.0033,6,false),m.blue,hairspring);
  jewel(cage,0,0,.267,.032);
  const escape=gear(.088,15,.315,.17,-.04,TAU/3,cage);const pallet=articulated(cage,.16,.18,.028);
  beam(-.075,-.02,.075,.02,.018,.015,0,m.steel,pallet);box(.023,.018,.015,m.ruby,pallet,-.07,-.019,.003,.002);box(.023,.018,.015,m.ruby,pallet,.07,.019,.003,.002);

  const hands={};
  function hand(name,length,width,z){
    const g=articulated(groups.hands,0,0,z);const s=pathShape([[-width*.42,-.16],[-width*.55,length*.23],[-width*.44,length*.91],[0,length],[width*.44,length*.91],[width*.55,length*.23],[width*.42,-.16]]);
    extrude(s,.023,m.gold,m.polish,g,0,0,0,.009);
    // Raised central facet, with a narrow recessed lume insert.
    const ridge=pathShape([[-width*.15,.24],[-width*.12,length*.84],[0,length*.91],[width*.12,length*.84],[width*.15,.24]]);extrude(ridge,.003,m.lume,m.polish,g,0,0,.024,.002);
    hands[name]=g;
  }
  hand('hour',1.08,.10,.51);hand('minute',1.56,.068,.56);
  // One continuous spindle through all three hand layers, covered by one cap.
  cylinder(.048,.15,m.steel,groups.hands,0,0,.585);
  cylinder(.085,.024,m.polish,groups.hands,0,0,.664);
  // Central seconds sits above both hands, with a bright facet for legibility.
  const second=articulated(groups.hands,0,0,.635);
  const needle=pathShape([[-.018,-.035],[-.018,1.66],[0,1.84],[.018,1.66],[.018,-.035]]);
  extrude(needle,.012,m.blue,m.steel,second,0,0,0,.003);
  beam(0,.15,0,1.73,.010,.004,.016,m.lume,second);
  hands.second=second;
  const offsets={case:-.75,train:0,tourbillon:.30,bridges:.9,dial:1.65,hands:2.4,crystal:3.1};
  const guide=new THREE.Group();root.add(guide);const lineMat=new THREE.LineDashedMaterial({color:0xb7aa86,transparent:true,opacity:.19,dashSize:.06,gapSize:.07});
  for(const x of [-1.5,1.5]){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,0,-1.25),new THREE.Vector3(x,0,6.86)]);const l=new THREE.Line(g,lineMat);l.computeLineDistances();guide.add(l);}guide.visible=false;

  batchDetails(root);
  const glassMeshes=[];root.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&o.material.transmission>0){o.userData.originalGlass=o.material;glassMeshes.push(o);}});
  let selectedMaterials=[];
  function select(id){
    for(const [mat,color] of selectedMaterials)mat.emissive.copy(color);selectedMaterials=[];if(!id)return;
    groups[id].traverse(o=>{if(!o.isMesh)return;const originals=Array.isArray(o.material)?o.material:[o.material];if(!o.userData.highlightMaterials){const replacements=originals.map(mat=>mat.emissive&&!(mat.transmission>0)?mat.clone():mat);o.material=Array.isArray(o.material)?replacements:replacements[0];o.userData.highlightMaterials=true;}
      for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat.emissive&&!(mat.transmission>0)){selectedMaterials.push([mat,mat.emissive.clone()]);mat.emissive.set(0x100c06);}
    });
  }
  function setFinish(mode){const colors=mode==='silver'?[0xb7c0c7,0xe5e9ed]:mode==='dark'?[0x454b51,0xa1aab1]:[0xc9a184,0xe6c3a1];m.gold.color.set(colors[0]);m.polish.color.set(colors[1]);root.traverse(o=>{if(o.isMesh)for(const mat of Array.isArray(o.material)?o.material:[o.material]){if(mat.name===m.gold.name)mat.color.copy(m.gold.color);if(mat.name===m.polish.name)mat.color.copy(m.polish.color);}});}
  return {root,groups,anchors,moving,cage,balance,hairspring,hands,select,setFinish,
    setTransparent(value){glassMeshes.forEach(o=>o.material=value?o.userData.originalGlass:m.gold);groups.crystal.visible=value;},
    update(t,explosion,clockSeconds){
      for(const [id,g] of Object.entries(groups))g.position.z=offsets[id]*explosion*1.65;
      guide.visible=explosion>.025;lineMat.opacity=explosion*.20;
      moving.forEach(g=>g.object.rotation.z=g.phase+t*g.rate);
      cage.rotation.z=-TAU*t/60;balance.rotation.z=Math.sin(t*TAU*2.5)*Math.PI*.76;
      hairspring.rotation.z=Math.sin(t*TAU*2.5)*.13;const pulse=1+.07*Math.sin(t*TAU*2.5);hairspring.scale.set(pulse,pulse,1);
      pallet.rotation.z=Math.sin(t*TAU*2.5)*.18;escape.rotation.z=Math.floor(t*5)*TAU/15;rotor.rotation.z=Math.sin(t*.23)*.35;
      const time=clockSeconds;hands.hour.rotation.z=-TAU*(time%43200)/43200;hands.minute.rotation.z=-TAU*(time%3600)/3600;hands.second.rotation.z=-TAU*(time%60)/60;
    },
    dispose(){const geometries=new Set(),materials=new Set(),textures=new Set(m.textures);root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const mat of Array.isArray(o.material)?o.material:[o.material])materials.add(mat);});for(const g of geometries)g.dispose();for(const mat of materials){for(const v of Object.values(mat))if(v?.isTexture)textures.add(v);mat.dispose();}textures.forEach(t=>t.dispose());},
  };
}
