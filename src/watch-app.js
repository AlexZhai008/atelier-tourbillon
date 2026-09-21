import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStudio } from './watch-finishing.js';
import { createWatch, PARTS } from './watch-model.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const canvas=$('#canvas'),viewport=$('#viewport');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={mode:'assembled',running:!reduced,labels:true,transparent:true,speed:1,explosion:0,explodeTarget:0,tour:false,selected:null,simTime:0,finish:'gold',quality:'high'};
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}
catch(error){$('#loading').hidden=true;$('#webgl-error').hidden=false;console.error(error);}
if(renderer)initialize();

function initialize(){
  renderer.setClearColor(0x111514,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.transmissionResolutionScale=1;renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(33,1,.04,150);
  // A dark rendered background also appears through the transmission buffer.
  const backdrop=document.createElement('canvas');backdrop.width=1024;backdrop.height=1024;
  const context=backdrop.getContext('2d');const gradient=context.createRadialGradient(530,440,10,520,480,620);gradient.addColorStop(0,'#2d382e');gradient.addColorStop(.5,'#19221c');gradient.addColorStop(1,'#111514');context.fillStyle=gradient;context.fillRect(0,0,1024,1024);
  const background=new THREE.CanvasTexture(backdrop);background.colorSpace=THREE.SRGBColorSpace;scene.background=background;
  const envScene=createStudio();const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(envScene,.015,.1,50,{size:512});scene.environment=environment.texture;scene.environmentIntensity=.85;envScene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});pmrem.dispose();
  const fill=new THREE.HemisphereLight(0xe8f0ff,0x181b1e,.75);scene.add(fill);
  const key=new THREE.DirectionalLight(0xffebd5,2.5);key.position.set(-4,6,9);scene.add(key);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:1,far:30});key.shadow.bias=-.0002;key.shadow.normalBias=.014;key.shadow.radius=2;
  const rim=new THREE.DirectionalLight(0xcfe2ff,1.5);rim.position.set(5,2,-3);scene.add(rim);
  const front=new THREE.DirectionalLight(0xfff3e0,.6);front.position.set(1,-5,6);scene.add(front);
  const watch=createWatch({anisotropy:renderer.capabilities.getMaxAnisotropy()});scene.add(watch.root);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=3;controls.maxDistance=35;controls.enablePan=true;controls.maxPolarAngle=Math.PI;controls.target.set(0,0,0);
  // Presentation starts at the conventional 10:08 pose so the tourbillon stays visible.
  const clockSeconds=10*3600+8*60;
  let mobile=false,width=1,height=1,transition=null,last=performance.now(),tourTime=0,frames=0,fpsTime=last,labelCounter=0;
  let toastTimer;const keys=new Set();const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
  const flyEuler=new THREE.Euler(0,0,0,'YXZ');const direction=new THREE.Vector3();const right=new THREE.Vector3();const world=new THREE.Vector3();
  const labels=new Map();const leaders=new Map();
  const leaderSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');leaderSvg.classList.add('label-leaders');$('#labels').append(leaderSvg);
  function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
  function switchState(id,value){$(id).classList.toggle('on',value);$(id).setAttribute('aria-checked',String(value));}
  function homePosition(exploded=false){return mobile?new THREE.Vector3(exploded?10:2.4,exploded?7:2.5,exploded?27:24):new THREE.Vector3(exploded?11:2.4,exploded?6:2.5,exploded?16:14.5);}
  function applyQuality(){
    const config={standard:{ratio:Math.min(devicePixelRatio,1.5),budget:3500000},high:{ratio:Math.max(2,Math.min(devicePixelRatio,2.5)),budget:7000000},ultra:{ratio:3,budget:14000000}}[state.quality];
    const ratio=Math.min(config.ratio,Math.sqrt(config.budget/(width*height)),renderer.capabilities.maxTextureSize/Math.max(width,height));
    renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);
    $('#render-size').textContent=`${canvas.width} × ${canvas.height}`;
    $$('[data-quality]').forEach(b=>{b.classList.toggle('active',b.dataset.quality===state.quality);b.setAttribute('aria-pressed',String(b.dataset.quality===state.quality));});
  }
  function resize(){
    width=viewport.clientWidth;height=viewport.clientHeight;const wasMobile=mobile;mobile=innerWidth<=900;
    camera.aspect=width/height;
    camera.setViewOffset(width,height,mobile?0:-width*.008,mobile?-height*.205:0,width,height);
    camera.updateProjectionMatrix();applyQuality();
    if(wasMobile!==mobile){transition=null;camera.position.copy(homePosition(state.explodeTarget>.1));controls.target.set(0,0,state.explodeTarget);controls.update();}
  }
  new ResizeObserver(resize).observe(viewport);resize();camera.position.copy(homePosition());controls.update();
  function animateView(position,target,duration=1000){transition={from:camera.position.clone(),to:position.clone(),targetFrom:controls.target.clone(),targetTo:target.clone(),start:performance.now(),duration:reduced?1:duration};}
  function stopTour(){state.tour=false;$('#tour-button').innerHTML='<span>▷</span> 开启机械之旅 <b>↗</b>';}
  function clearSelection(){state.selected=null;watch.select(null);$('#detail').hidden=true;$$('.part-button,.label').forEach(b=>b.classList.remove('active'));}
  function select(id){
    stopTour();const part=PARTS.find(p=>p.id===id);if(!part)return;state.selected=id;watch.select(id);
    $('#part-number').textContent=`${String(PARTS.indexOf(part)+1).padStart(2,'0')} / ${part.en}`;$('#part-name').textContent=part.name;$('#part-description').textContent=part.text;$('#detail').hidden=false;
    $$('.part-button,.label').forEach(b=>b.classList.toggle('active',b.dataset.part===id));
  }
  PARTS.forEach((part,index)=>{
    const number=String(index+1).padStart(2,'0');const button=document.createElement('button');button.className='part-button';button.dataset.part=part.id;button.innerHTML=`<span>${number}</span>${part.name}<i>↗</i>`;button.onclick=()=>select(part.id);$('#part-list').append(button);
    const label=document.createElement('button');label.className='label';label.dataset.part=part.id;label.innerHTML=`<span>${number}</span>${part.name}`;label.onclick=()=>select(part.id);$('#labels').append(label);labels.set(part.id,label);
    const line=document.createElementNS('http://www.w3.org/2000/svg','path');leaderSvg.append(line);leaders.set(part.id,line);
  });
  $('#close-detail').onclick=clearSelection;
  $$('[data-quality]').forEach(b=>b.onclick=()=>{state.quality=b.dataset.quality;applyQuality();toast(`${b.textContent}画质 · ${canvas.width} × ${canvas.height} 实际渲染像素`);});
  $('#macro-view').onclick=()=>{if(state.mode==='flight')exitFlight();stopTour();clearSelection();setExplosion(0);animateView(new THREE.Vector3(.6,.85,mobile?13:8.1),new THREE.Vector3(0,0,0));$('#view-name').textContent='MOVEMENT MACRO';};
  $('#focus-part').onclick=()=>{
    if(!state.selected)return;
    if(state.mode==='flight')exitFlight();
    watch.anchors[state.selected].getWorldPosition(world);const target=world.clone();
    const distance=state.selected==='case'?9:state.selected==='tourbillon'?(mobile?7:4.5):5.5;
    animateView(target.clone().add(new THREE.Vector3(.4,.4,distance)),target);$('#detail').hidden=true;
  };
  function setModeButtons(mode){$$('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});$('#view-name').textContent=mode==='flight'?'FREE FLIGHT':mode==='exploded'?'EXPLODED VIEW':'ASSEMBLED VIEW';}
  function exitFlight(){
    keys.clear();state.mode=state.explodeTarget>.01?'exploded':'assembled';controls.enabled=true;camera.getWorldDirection(direction);controls.target.copy(camera.position).addScaledVector(direction,Math.max(2,camera.position.length()));controls.update();
    $('#flight-controls').hidden=true;$('#touch-flight').hidden=true;$('#scene-hint').hidden=false;setModeButtons(state.mode);
  }
  function setExplosion(value,moveCamera=false){
    if(state.mode==='flight')exitFlight();stopTour();state.explodeTarget=value;state.mode=value>.01?'exploded':'assembled';
    $('#explode').value=Math.round(value*100);$('#explode').style.setProperty('--pct',`${value*100}%`);$('#explode-value').textContent=`${Math.round(value*100)}%`;setModeButtons(state.mode);
    if(moveCamera)animateView(homePosition(value>.01),new THREE.Vector3(0,0,value*1.5));
  }
  function mode(value){
    stopTour();clearSelection();
    if(value==='flight'){
      transition=null;state.mode='flight';controls.enabled=false;flyEuler.setFromQuaternion(camera.quaternion,'YXZ');$('#flight-controls').hidden=false;$('#touch-flight').hidden=!(matchMedia('(pointer: coarse)').matches||mobile);$('#scene-hint').hidden=true;setModeButtons(value);viewport.focus({preventScroll:true});toast('飞行模式已开启 · 拖动转向，WASD 移动，Esc 退出');
    }else setExplosion(value==='exploded'?1:0,true);
  }
  $$('[data-mode]').forEach(b=>b.onclick=()=>mode(b.dataset.mode));
  $('#explode').addEventListener('input',e=>{const previous=state.explodeTarget;setExplosion(Number(e.target.value)/100,previous===0&&Number(e.target.value)>0);});
  $('#glass-toggle').onclick=()=>{state.transparent=!state.transparent;switchState('#glass-toggle',state.transparent);watch.setTransparent(state.transparent);toast(state.transparent?'透明表壳 · 机芯清晰可见':'金属表壳 · 保留镂空表盘');};
  $('#labels-toggle').onclick=()=>{state.labels=!state.labels;switchState('#labels-toggle',state.labels);$('#labels').hidden=!state.labels;};
  function syncMotion(){switchState('#motion-toggle',state.running);$('#movement-status').textContent=state.running?'机芯正在运转':'机芯已暂停';}
  $('#motion-toggle').onclick=()=>{state.running=!state.running;syncMotion();};syncMotion();
  $$('[data-speed]').forEach(b=>b.onclick=()=>{state.speed=Number(b.dataset.speed);$$('[data-speed]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});});
  $$('[data-finish]').forEach(b=>b.onclick=()=>{state.finish=b.dataset.finish;watch.setFinish(state.finish);$('#finish-name').textContent={gold:'香槟金',silver:'铂银',dark:'曜黑'}[state.finish];$$('[data-finish]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});});
  $('#tour-button').onclick=()=>{
    if(state.tour){stopTour();return;}
    if(state.mode==='flight')exitFlight();transition=null;clearSelection();state.tour=true;tourTime=0;
    $('#tour-button').innerHTML='<span>Ⅱ</span> 暂停机械之旅 <b>↗</b>';toast('镜头巡游中 · 拖动场景可随时停止');
  };
  controls.addEventListener('start',()=>{transition=null;stopTour();});
  $('#reset').onclick=()=>{if(state.mode==='flight')exitFlight();stopTour();clearSelection();animateView(homePosition(state.explodeTarget>.01),new THREE.Vector3(0,0,state.explodeTarget*1.5));};
  function zoom(factor){stopTour();transition=null;if(state.mode==='flight'){camera.getWorldDirection(direction);camera.position.addScaledVector(direction,factor<1?1:-1);}else{const delta=camera.position.clone().sub(controls.target);delta.setLength(THREE.MathUtils.clamp(delta.length()*factor,controls.minDistance,controls.maxDistance));animateView(controls.target.clone().add(delta),controls.target,300);}}
  $('#zoom-in').onclick=()=>zoom(.80);$('#zoom-out').onclick=()=>zoom(1.25);
  $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前环境暂不支持全屏显示');}};
  $('#exit-flight').onclick=()=>mode('assembled');
  const dialog=$('#help-dialog');$('#help').onclick=()=>{stopTour();keys.clear();dialog.showModal();};$('.dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  let down=null,lastDrag=null;
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId};lastDrag={x:e.clientX,y:e.clientY};if(state.mode==='flight')canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    if(state.mode==='flight'&&down&&lastDrag){flyEuler.y-=(e.clientX-lastDrag.x)*.004;flyEuler.x=THREE.MathUtils.clamp(flyEuler.x-(e.clientY-lastDrag.y)*.004,-Math.PI/2+.03,Math.PI/2-.03);camera.quaternion.setFromEuler(flyEuler);lastDrag={x:e.clientX,y:e.clientY};}
  });
  canvas.addEventListener('pointerup',e=>{
    if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5&&state.mode!=='flight'){
      const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
      const hits=raycaster.intersectObject(watch.root,true).filter(h=>h.object.isMesh&&h.object.visible&&h.object.material.transmission!==1&&h.object.material.transmission!==.96);
      const hit=hits[0];if(hit){let object=hit.object;while(object&&!object.userData.part)object=object.parent;if(object)select(object.userData.part);}else clearSelection();
    }down=null;lastDrag=null;
  });
  canvas.addEventListener('pointercancel',()=>{down=null;lastDrag=null;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{
    if(e.code==='Escape'){keys.clear();if(dialog.open)return;if(state.mode==='flight'){mode('assembled');return;}clearSelection();stopTour();return;}
    if(dialog.open||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(state.mode==='flight'&&['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();down=null;});document.addEventListener('visibilitychange',()=>{keys.clear();last=performance.now();});
  $$('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.move));});
  function updateFlight(dt){
    if(dialog.open)return;
    camera.getWorldDirection(direction);right.crossVectors(direction,camera.up).normalize();
    const velocity=new THREE.Vector3();if(keys.has('KeyW'))velocity.add(direction);if(keys.has('KeyS'))velocity.sub(direction);if(keys.has('KeyD'))velocity.add(right);if(keys.has('KeyA'))velocity.sub(right);if(keys.has('KeyE'))velocity.y+=1;if(keys.has('KeyQ'))velocity.y-=1;
    const amount=(keys.has('ShiftLeft')||keys.has('ShiftRight')?6:2)*dt;camera.position.addScaledVector(velocity.normalize(),amount);
    if(camera.position.length()>55)camera.position.setLength(55);
  }
  function updateLabels(){
    if(!state.labels)return;
    const placed=[];const frontNormal=new THREE.Vector3(0,0,1).transformDirection(watch.root.matrixWorld);const facing=frontNormal.dot(camera.position.clone().sub(watch.root.position).normalize());
    for(const [index,part] of PARTS.entries()){
      const label=labels.get(part.id);watch.anchors[part.id].getWorldPosition(world);const distance=world.distanceTo(camera.position);world.project(camera);
      const x=(world.x*.5+.5)*width,y=(-world.y*.5+.5)*height;
      const isImportant=['crystal','train','tourbillon','case'].includes(part.id)||state.selected===part.id||state.explosion>.25;
      let visible=isImportant&&world.z>-1&&world.z<1&&distance>1.2&&facing>-.1;
      if(!state.transparent&&part.id==='crystal')visible=false;
      const labelWidth=part.id==='case'?135:part.id==='train'?137:120;
      const offsetX=part.id==='case'?28:(index%2===0?-labelWidth-35:28),offsetY=part.id==='tourbillon'?43:(index%2===0?-27:16);
      let left=x+offsetX,top=y+offsetY;
      // Clamp only inside the usable stage; suppress labels behind side panels.
      const min=mobile?12:width<=1150?245:315,max=mobile?width-12:width<=1150?width-240:width-293;
      left=THREE.MathUtils.clamp(left,min,Math.max(min,max-labelWidth));
      if(top<45||top>height-80||x<min-45||x>max+45)visible=false;
      if(mobile&&top<285)visible=false;
      const rect={x:left,y:top,w:labelWidth,h:32};if(placed.some(r=>Math.abs(r.y-rect.y)<34&&r.x<rect.x+rect.w&&r.x+r.w>rect.x))visible=false;
      if(visible)placed.push(rect);label.hidden=!visible;label.style.transform=`translate(${left.toFixed(1)}px,${top.toFixed(1)}px)`;
      const line=leaders.get(part.id);line.style.display=visible?'':'none';const endX=left>x?left:left+label.offsetWidth,endY=top+14;line.setAttribute('d',`M ${x} ${y} L ${(x+endX)/2} ${endY} L ${endX} ${endY}`);
    }
  }
  function frame(now){
    requestAnimationFrame(frame);const elapsed=Math.max(0,(now-last)/1000),dt=Math.min(elapsed,.06);last=now;if(document.hidden)return;
    // Keep physical timing independent of render quality; clamp only camera interpolation.
    if(state.running)state.simTime+=elapsed*state.speed;
    const blend=reduced?1:1-Math.exp(-dt*5);state.explosion+=(state.explodeTarget-state.explosion)*blend;
    if(Math.abs(state.explodeTarget-state.explosion)<.0001)state.explosion=state.explodeTarget;
    watch.update(state.simTime,state.explosion,clockSeconds);
    if(state.mode==='flight')updateFlight(dt);
    else if(state.tour){
      tourTime+=dt;const a=tourTime*.16,rad=mobile?22:12.5;const target=new THREE.Vector3(0,0,state.explosion*1.4);
      const wanted=new THREE.Vector3(Math.sin(a)*rad,3+Math.sin(a*.7)*2,Math.cos(a)*rad);wanted.z+=state.explosion*1.4;
      camera.position.lerp(wanted,1-Math.exp(-dt*1.2));controls.target.lerp(target,.05);controls.update();
    }else if(transition){
      const t=Math.min((now-transition.start)/transition.duration,1),ease=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.targetFrom,transition.targetTo,ease);controls.update();if(t===1)transition=null;
    }else controls.update();
    if(labelCounter%6===0)renderer.shadowMap.needsUpdate=true;
    renderer.render(scene,camera);if(++labelCounter%2===0)updateLabels();
    frames++;if(now-fpsTime>1000){$('#fps').textContent=`${Math.round(frames*1000/(now-fpsTime))} FPS`;frames=0;fpsTime=now;}
  }
  watch.update(0,0,clockSeconds);renderer.render(scene,camera);$('#loading').classList.add('done');requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#webgl-error').hidden=false;$('#webgl-error h2').textContent='3D 渲染已中断';});
  // Read-only diagnostics make animation timing and rendering verifiable.
  window.__watchDiagnostics=()=>({state:{...state},camera:camera.position.toArray(),target:controls.target.toArray(),renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},parts:PARTS.length,gearAngles:watch.moving.map(x=>x.object.rotation.z),cageAngle:watch.cage.rotation.z,balanceAngle:watch.balance.rotation.z,handAngles:Object.fromEntries(Object.entries(watch.hands).map(([k,v])=>[k,v.rotation.z])),layers:Object.fromEntries(Object.entries(watch.groups).map(([k,v])=>[k,v.position.z]))});
}
