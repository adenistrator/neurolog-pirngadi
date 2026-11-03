const assimpjs=require('assimpjs'); const fs=require('fs');
assimpjs().then(ajs=>{ const [inp,out]=process.argv.slice(2); const fl=new ajs.FileList(); fl.AddFile(require('path').basename(inp), new Uint8Array(fs.readFileSync(inp)));
 const r=ajs.ConvertFileList(fl,'glb2'); if(!r.IsSuccess()||r.FileCount()==0){console.error('fail',r.GetErrorCode());process.exit(1);} fs.writeFileSync(out, Buffer.from(r.GetFile(0).GetContent())); console.log('ok',out); });
