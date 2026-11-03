// dump world-space positions + colors per mesh to JSON (for alignment)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs';
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(process.argv[2]); const out={};
for(const n of doc.getRoot().listNodes()){ const m=n.getMesh(); if(!m) continue; const M=n.getWorldMatrix(); const p=m.listPrimitives()[0];
 const pa=p.getAttribute('POSITION'); const ca=p.getAttribute('COLOR_0'); const P=[],C=[]; const v=[0,0,0],c=[0,0,0,0];
 for(let i=0;i<pa.getCount();i++){ pa.getElement(i,v); const x=M[0]*v[0]+M[4]*v[1]+M[8]*v[2]+M[12], y=M[1]*v[0]+M[5]*v[1]+M[9]*v[2]+M[13], z=M[2]*v[0]+M[6]*v[1]+M[10]*v[2]+M[14]; P.push(x,y,z); if(ca){ca.getElement(i,c); C.push(c[0],c[1],c[2]);} }
 const ix=p.getIndices(); out[n.getName()]={P,C,I:ix?Array.from(ix.getArray()):null}; }
fs.writeFileSync(process.argv[3], JSON.stringify(out));
