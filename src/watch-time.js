// UTC+8 civil time, independent of the visitor's selected device timezone.
export function beijingSeconds(timestamp=Date.now()){
  return ((timestamp/1000+8*3600)%86400+86400)%86400;
}
