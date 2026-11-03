import json,numpy as np,sys,glob,os,re
sys.path.insert(0,os.path.dirname(__file__)); from vtkio import read_vtk
import trimesh, fast_simplification
from scipy.spatial import cKDTree
SP=sys.argv[1]
s,tx,ty,tz=0.0199243,0.24229647,0.25377766,0.20239834
D=json.load(open(f'{SP}/knee/detail_dump.json'))
BUD={'femur':90000,'tibia':80000,'fibula':20000,'patella':24000,'femoral_cartilage':40000,'patellar_cartilage':14000,
     'lateral_tibial_cartilage':14000,'medial_tibial_cartilage':14000,'lateral_meniscus':12000,'medial_meniscus':12000,
     'infrapatellar_fat_body':16000,'patellar_ligament':16000}
DEF={'bone':40000,'cart':12000,'lig':12000,'ten':8000,'mus':6000,'nerve':8000,'vessel':8000,'fat':16000}
scene=trimesh.Scene(); tot=0
for nm in D:
    layer,key=nm.split('__')
    f=glob.glob(f'{SP}/src/spl-knee-atlas/Data/Model_*_{key}.vtk')[0]
    V,F=read_vtk(f); V=V[:,[0,2,1]]*s+[tx,ty,tz]; F=F[:,[0,2,1]]
    m=trimesh.Trimesh(V,F,process=True); m.remove_unreferenced_vertices()
    tgt=BUD.get(key,DEF[layer])
    if len(m.faces)>tgt*1.05:
        v2,f2=fast_simplification.simplify(m.vertices.astype(np.float32),m.faces.astype(np.int32),target_reduction=1-tgt/len(m.faces),agg=5)
        m=trimesh.Trimesh(v2,f2,process=True)
    trimesh.smoothing.filter_taubin(m,lamb=0.5,nu=-0.53,iterations=4)
    old=np.array(D[nm]['P']).reshape(-1,3); oc=np.array(D[nm]['C']).reshape(-1,3)
    d,idx=cKDTree(old).query(m.vertices,k=4); w=1/(d+1e-4); c=(oc[idx]*w[...,None]).sum(1)/w.sum(1)[:,None]
    m.visual=trimesh.visual.ColorVisuals(m,vertex_colors=np.c_[np.clip(c*255,0,255),np.full(len(c),255)].astype(np.uint8))
    scene.add_geometry(m,node_name=nm,geom_name=nm); tot+=len(m.faces)
    print(nm.ljust(48),len(m.faces))
print('TOTAL',tot)
scene.export(f'{SP}/knee/detail_raw.glb')
