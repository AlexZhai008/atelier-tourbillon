import * as THREE from 'three';

// Broad, interlocking cross links inspired by the supplied Overseas bracelet.
// Both halves remain open, with just a slight fall-away at their free ends.
export function createBracelet(shell,m,{extrude,box,cylinder,pathShape}){
  const count=5,pitch=.47;
  for(const side of [-1,1]){
    const bracelet=new THREE.Group();bracelet.name=side>0?'Upper open bracelet':'Lower open bracelet';
    bracelet.position.set(0,side*2.19,-.10);if(side<0)bracelet.rotation.z=Math.PI;
    shell.add(bracelet);
    for(let i=0;i<count;i++){
      const t=i/(count-1),w=2.38-.48*t,h=pitch-.018;
      const link=new THREE.Group();link.position.set(0,i*pitch,-.12*t*t);link.rotation.x=-.10-.09*t;
      bracelet.add(link);
      // Recessed carrier and transverse pin connect the three visible facets.
      box(w-.06,h-.07,.12,m.gold,link,0,0,-.065,.025);
      const pin=cylinder(.031,w-.025,m.steel,link,0,-h*.32,-.065);pin.rotation.y=Math.PI/2;
      // Broad brushed shoulders open into V-shaped polished inner edges.
      for(const sign of [-1,1]){
        const outline=[
          [sign*(w/2+.010),-h/2], [sign*(w/2-.047),h/2],
          [sign*.305,h/2], [sign*.205,h*.13],
          [sign*.205,-h*.13], [sign*.305,-h/2],
        ];
        extrude(pathShape(outline),.145,m.gold,m.polish,link,0,0,0,.030);
      }
      // The narrow waist and flared tips form the repeated Maltese-cross motif.
      const center=pathShape([
        [-.266,-h*.49],[.266,-h*.49],[.17,-h*.12],
        [.17,h*.12],[.266,h*.49],[-.266,h*.49],
        [-.17,h*.12],[-.17,-h*.12],
      ]);
      extrude(center,.15,m.gold,m.polish,link,0,0,.013,.012);
    }
    // Separate finished terminal links, with no loop or clasp beneath the watch.
    box(1.87,.13,.15,m.polish,bracelet,0,(count-1)*pitch+.28,-.14,.025);
    box(1.74,.065,.018,m.gold,bracelet,0,(count-1)*pitch+.28,-.054,.005);
  }
}
