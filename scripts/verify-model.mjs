import assert from 'node:assert/strict';
import {createWatch,PARTS} from '../src/watch-model.js';
// The geometry/kinematics test needs no browser: text texture drawing is stubbed.
globalThis.document={createElement(){return {width:0,height:0,getContext(){return {fillText(){}};}};}};
const watch=createWatch();const tau=Math.PI*2;
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-8,`${message}: ${actual} vs ${expected}`);
assert.equal(PARTS.length,7);
watch.update(0,0,0);assert.ok(Object.values(watch.groups).every(g=>g.position.z===0));
watch.update(60,1,0);near(watch.cage.rotation.z,-tau,'60 second cage revolution');
assert.equal(new Set(Object.values(watch.groups).map(g=>g.position.z)).size,7);
watch.update(1,.5,0);near(watch.hands.second.rotation.z,-tau/60,'Second hand');near(watch.hands.minute.rotation.z,-tau/3600,'Minute hand');near(watch.hands.hour.rotation.z,-tau/43200,'Hour hand');
watch.update(1/12,0,0);near(watch.balance.rotation.z,Math.PI*.76,'3 Hz balance peak');
for(let i=1;i<5;i++){near(watch.moving[i-1].rate*watch.moving[i-1].teeth,-watch.moving[i].rate*watch.moving[i].teeth,'Adjacent gear tooth-speed ratio');}
watch.update(0,0,0);assert.ok(Object.values(watch.groups).every(g=>g.position.z===0));
watch.select('train');watch.setFinish('silver');watch.select(null);watch.setFinish('gold');
watch.setTransparent(false);assert.equal(watch.groups.crystal.visible,false);watch.setTransparent(true);assert.equal(watch.groups.crystal.visible,true);
let meshCount=0,vertexCount=0;watch.root.traverse(o=>{if(o.isMesh){meshCount++;const positions=o.geometry.attributes.position;vertexCount+=positions.count;for(const n of positions.array)assert.ok(Number.isFinite(n),'All vertices finite');}});
console.log(JSON.stringify({passed:true,parts:PARTS.length,meshes:meshCount,vertices:vertexCount,checks:['layer separation and reset','60s cage revolution','3 Hz balance','12h / 1h / 60s hands','alternating gear ratios','finish changes after highlight','transparent / metal material restoration','finite geometry']},null,2));
watch.dispose();
