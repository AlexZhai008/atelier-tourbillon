import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.dirname(fileURLToPath(import.meta.url));
const dist=process.argv.includes('--dist');
const base=dist?path.join(root,'dist'):root;
const vendor=path.dirname(path.dirname(createRequire(import.meta.url).resolve('three')));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const port=Number(process.env.PORT||5180);
http.createServer(async(req,res)=>{
  try{
    const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let directory=base,relative=url;
    if(!dist&&url.startsWith('/vendor/')){directory=vendor;relative=url.slice(7);}
    if(!dist&&url==='/watch-icon.svg')directory=path.join(root,'public');
    let file=path.resolve(directory,'.'+relative);
    if(file!==directory&&!file.startsWith(directory+path.sep)){res.writeHead(403).end();return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}).end(data);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`ATELIER TOURBILLON ready: http://127.0.0.1:${port}${dist?' (production)':''}`));
