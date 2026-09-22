const TAU=Math.PI*2;
// Ideal compound train. Rates are radians per simulated second.
const minute=-TAU/3600;
const third=-minute*80/10;
const second=-third*75/10;
export const RATES=Object.freeze({barrel:-minute*12/80,minute,third,second,hour:minute/12,escape:-second*10});

export function advanceClock(clock,elapsed,wallSeconds){
  if(clock.mode==='live'){
    if(clock.lastWall!==undefined&&clock.lastWall-wallSeconds>43200)clock.dayOffset=(clock.dayOffset||0)+86400;
    clock.lastWall=wallSeconds;
    clock.time=wallSeconds+(clock.dayOffset||0);
  }
  else if(clock.running)clock.time+=Math.max(0,elapsed)*clock.speed;
  return clock.time;
}

// Render the mean pose when the display cannot resolve a reciprocating oscillator.
// Never slow or reverse the driving train to disguise temporal aliasing.
export function balanceVisibility(speed,frameSeconds){
  const cycles=2.5*Math.abs(speed)*Math.max(0,frameSeconds);
  return Math.max(0,Math.min(1,(.35-cycles)/.15));
}
