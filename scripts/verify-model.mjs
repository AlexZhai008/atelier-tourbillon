import assert from 'node:assert/strict';
import {Box3} from 'three';
import {createWatch,PARTS} from '../src/watch-model.js';
import {beijingSeconds} from '../src/watch-time.js';
import {RATES,advanceClock,balanceVisibility} from '../src/watch-movement.js';
// The geometry/kinematics test needs no browser: text texture drawing is stubbed.
globalThis.document={createElement(){return {width:0,height:0,getContext(){return {fillText(){}};}};}};
const watch=createWatch();const tau=Math.PI*2;
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-8,`${message}: ${actual} vs ${expected}`);
assert.equal(PARTS.length,7);
near(watch.root.rotation.z,0,'Dial has no sideways tilt');
const caseBounds=new Box3().setFromObject(watch.groups.case);
assert.ok(caseBounds.min.z>-.6,'Straps do not wrap behind the case');
assert.ok(caseBounds.min.y> -5 && caseBounds.max.y<5,'Open straps stay compact');
assert.ok(caseBounds.min.y< -4 && caseBounds.max.y>4,'Straps extend on both sides of the dial');
watch.update(0,0,0);assert.ok(Object.values(watch.groups).every(g=>g.position.z===0));
watch.update(60,1,0);near(watch.cage.rotation.z,-tau,'60 second cage revolution');
assert.equal(new Set(Object.values(watch.groups).map(g=>g.position.z)).size,7);
watch.update(1,.5,1);near(watch.hands.second.rotation.z,-tau/60,'Second hand');near(watch.hands.minute.rotation.z,-tau/3600,'Minute hand');near(watch.hands.hour.rotation.z,-tau/43200,'Hour hand');
assert.equal(watch.hands.second.parent,watch.groups.hands,'Central seconds explodes with the other hands');
near(watch.hands.second.position.x,0,'Seconds centered X');near(watch.hands.second.position.y,0,'Seconds centered Y');
assert.ok(watch.hands.second.position.z>watch.hands.minute.position.z,'Seconds above minute hand');
const beijing=beijingSeconds(Date.parse('2026-09-21T04:34:56.500Z'));
near(beijing,12*3600+34*60+56.5,'UTC to Beijing with fractional seconds');
near(beijingSeconds(Date.parse('2026-09-21T16:00:00Z')),0,'Beijing midnight rollover');
watch.update(beijing,0);
near(watch.hands.second.rotation.z,RATES.second*beijing,'Seconds follows common Beijing clock');
near(watch.hands.minute.rotation.z,RATES.minute*beijing,'Minute follows common Beijing clock');
near(watch.hands.hour.rotation.z,RATES.hour*beijing,'Hour follows common Beijing clock');
watch.update(1/10,0,0);near(watch.balance.rotation.z,Math.PI*.76,'2.5 Hz balance peak');
for(const [a,b] of watch.meshes){
  const ga=watch.moving.find(g=>g.object===watch.drive[a]),gb=watch.moving.find(g=>g.object===watch.drive[b]);
  near(ga.rate*ga.teeth,-gb.rate*gb.teeth,`${a}/${b} tooth-speed ratio`);
  near(ga.radius/ga.teeth,gb.radius/gb.teeth,`${a}/${b} common module`);
  near(ga.object.position.distanceTo(gb.object.position),ga.radius+gb.radius,`${a}/${b} pitch circles touch`);
}
for(const speed of [.25,1,5,20])for(const fps of [24,30,60,144]){
  let lastAngles;
  for(let frame=0;frame<=fps*2;frame++){
    const t=12345+frame/fps*speed;watch.update(t,0,{speed,frameSeconds:1/fps});
    const angles=watch.moving.map(g=>g.object.rotation.z);
    if(lastAngles)angles.forEach((a,i)=>assert.ok((a-lastAngles[i])*watch.moving[i].rate>0,`No driven wheel reversal at ${speed}x/${fps}fps`));
    near(watch.hands.second.rotation.z,watch.drive.secondRelayOutput.rotation.z-watch.drive.secondRelayOutput.userData.mountingPhase,'Second shaft coupled');
    near(watch.hands.minute.rotation.z,watch.drive.cannon.rotation.z-watch.drive.cannon.userData.mountingPhase,'Minute shaft coupled');
    near(watch.hands.hour.rotation.z,watch.drive.hourWheel.rotation.z-watch.drive.hourWheel.userData.mountingPhase,'Hour shaft coupled');
    near(watch.cage.rotation.z,watch.hands.second.rotation.z,'Cage and seconds share 60s period');
    lastAngles=angles;
  }
}
near(RATES.minute/RATES.hour,12,'Motion works 12:1 reduction');
near(RATES.second/RATES.minute,60,'Going train 60:1 ratio');
near(RATES.escape*6,tau,'15-tooth escapement at 5 half-tooth releases per second');
near(balanceVisibility(20,1/30),0,'Unresolved 50 Hz oscillation shows mean pose');
const clock={mode:'live',time:0,running:true,speed:1};
near(advanceClock(clock,10,500),500,'Live clock recovers after backgrounding');
clock.mode='demo';clock.speed=20;near(advanceClock(clock,.05,900),501,'Demo advances at 20x without wall time jump');
clock.running=false;near(advanceClock(clock,20,920),501,'All movement pauses');
clock.running=true;clock.speed=.25;near(advanceClock(clock,4,924),502,'Speed change preserves phase');
clock.mode='live';near(advanceClock(clock,0,924),924,'Restore Beijing time');
const midnight={mode:'live',time:86399.9,lastWall:86399.9};
near(advanceClock(midnight,.2,.1),86400.1,'Midnight preserves continuous train phase');
watch.update(0,0,0);assert.ok(Object.values(watch.groups).every(g=>g.position.z===0));
watch.select('train');watch.setFinish('silver');watch.select(null);
watch.root.traverse(o=>{if(o.isMesh)for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat.name==='champagne')assert.equal(mat.color.getHex(),0xb7c0c7,'Finish propagates to original and highlighted materials');});watch.setFinish('gold');
watch.setTransparent(false);assert.equal(watch.groups.crystal.visible,false);watch.setTransparent(true);assert.equal(watch.groups.crystal.visible,true);
let meshCount=0,vertexCount=0;watch.root.traverse(o=>{if(o.isMesh){meshCount++;const positions=o.geometry.attributes.position;vertexCount+=positions.count;for(const n of positions.array)assert.ok(Number.isFinite(n),'All vertices finite');}});
assert.ok(meshCount<280,'Compound train and motion works stay within the mesh budget');
const maps=[];watch.root.traverse(o=>{if(o.isMesh)for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat.map)maps.push(mat.map);});
assert.ok(maps.length>10&&maps.every(t=>t.image.width===2048&&t.image.height===512),'All dial text uses high resolution textures');
watch.update(12,.4,0);const angles=watch.moving.map(g=>g.object.rotation.z);watch.update(12,.4,0);assert.deepEqual(watch.moving.map(g=>g.object.rotation.z),angles,'Unchanged simulation time preserves paused pose');
console.log(JSON.stringify({passed:true,parts:PARTS.length,meshes:meshCount,vertices:vertexCount,checks:['layer separation and reset','60s cage revolution','2.5 Hz balance','12h / 1h / 60s hands','alternating gear ratios','finish changes after highlight','transparent / metal material restoration','finite geometry']},null,2));
watch.dispose();
