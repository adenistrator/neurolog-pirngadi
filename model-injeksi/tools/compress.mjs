import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { dedup, prune, quantize, reorder, weld, normals } from '@gltf-transform/functions';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(process.argv[2]);
// drop materials (page assigns its own)
for(const p of doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives())) p.setMaterial(null);
await doc.transform(weld(), normals({overwrite:true}), dedup(), prune(), reorder({encoder:MeshoptEncoder}), quantize({quantizePosition:14,quantizeNormal:8,quantizeColor:8}));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.FILTER});
await io.write(process.argv[3],doc);
