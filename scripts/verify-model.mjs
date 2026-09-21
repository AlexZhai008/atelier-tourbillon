import assert from 'node:assert/strict';
import {createWatch,PARTS} from '../src/watch-model.js';
import {beijingSeconds} from '../src/watch-time.js';
// The geometry/kinematics test needs no browser: text texture drawing is stubbed.
globalThis.document={createElement(){return {width:0,height:0,getContext(){return {fillText(){}};}};}};
const watch=createWatch();const tau=Math.PI*2;
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-8,`${message}: ${actual} vs ${expected}`);
assert.equal(PARTS.length,7);
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
for(const simulationTime of [0,1,61,20000]){
  watch.update(simulationTime,0,beijing);
  near(watch.hands.second.rotation.z,-tau*56.5/60,'Seconds independent of mechanism time');
  near(watch.hands.minute.rotation.z,-tau*(34*60+56.5)/3600,'Beijing minute hand');
  near(watch.hands.hour.rotation.z,-tau*(34*60+56.5)/43200,'Beijing hour hand');
}
watch.update(20000,0,beijing+5);near(watch.hands.second.rotation.z,-tau*1.5/60,'Clock advances while mechanism is paused');
watch.update(1/10,0,0);near(watch.balance.rotation.z,Math.PI*.76,'2.5 Hz balance peak');
for(let i=1;i<5;i++){near(watch.moving[i-1].rate*watch.moving[i-1].teeth,-watch.moving[i].rate*watch.moving[i].teeth,'Adjacent gear tooth-speed ratio');}
watch.update(0,0,0);assert.ok(Object.values(watch.groups).every(g=>g.position.z===0));
watch.select('train');watch.setFinish('silver');watch.select(null);
watch.root.traverse(o=>{if(o.isMesh)for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat.name==='champagne')assert.equal(mat.color.getHex(),0xb7c0c7,'Finish propagates to original and highlighted materials');});watch.setFinish('gold');
watch.setTransparent(false);assert.equal(watch.groups.crystal.visible,false);watch.setTransparent(true);assert.equal(watch.groups.crystal.visible,true);
let meshCount=0,vertexCount=0;watch.root.traverse(o=>{if(o.isMesh){meshCount++;const positions=o.geometry.attributes.position;vertexCount+=positions.count;for(const n of positions.array)assert.ok(Number.isFinite(n),'All vertices finite');}});
assert.ok(meshCount<220,'Static batching keeps mesh count bounded');
const maps=[];watch.root.traverse(o=>{if(o.isMesh)for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat.map)maps.push(mat.map);});
assert.ok(maps.length>10&&maps.every(t=>t.image.width===2048&&t.image.height===512),'All dial text uses high resolution textures');
watch.update(12,.4,0);const angles=watch.moving.map(g=>g.object.rotation.z);watch.update(12,.4,0);assert.deepEqual(watch.moving.map(g=>g.object.rotation.z),angles,'Unchanged simulation time preserves paused pose');
console.log(JSON.stringify({passed:true,parts:PARTS.length,meshes:meshCount,vertices:vertexCount,checks:['layer separation and reset','60s cage revolution','2.5 Hz balance','12h / 1h / 60s hands','alternating gear ratios','finish changes after highlight','transparent / metal material restoration','finite geometry']},null,2));
watch.dispose();
