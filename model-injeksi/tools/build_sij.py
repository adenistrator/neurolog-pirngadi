import sys,os,json,pickle,numpy as np,trimesh,fast_simplification
sys.path.insert(0,os.path.dirname(__file__)); from za import za_extract; from icp import icp
from scipy.spatial import cKDTree
SP=sys.argv[1]; B=f'{SP}/src/BodyParts3D/assets/BodyParts3D_data/stl/'
S=json.load(open(f'{SP}/sij/simple_parts.json')); Tb=np.load(f'{SP}/sij/bp3d_T.npy')
def simp(m,n):
    if len(m.faces)>n*1.05:
        v,f=fast_simplification.simplify(m.vertices.astype(np.float32),m.faces.astype(np.int32),target_reduction=1-n/len(m.faces)); m=trimesh.Trimesh(v,f)
    return m
def col(m,rgb): m.visual=trimesh.visual.ColorVisuals(m,vertex_colors=np.tile(list(rgb)+[255],(len(m.vertices),1)).astype(np.uint8)); return m
# ---- bones (simple + shared by detail)
bones={}; sc=trimesh.Scene()
for fma,key,n in [('FMA16202','sacrum',30000),('FMA16587','hipL',12000),('FMA16586','hipR',12000),('FMA13076','L5',12000),('FMA16037','disc',6000)]:
    m=trimesh.load(B+fma+'.stl'); m.apply_transform(Tb); m=simp(m,n); trimesh.smoothing.filter_taubin(m,iterations=3)
    old=S[key]; c=np.zeros((len(m.vertices),3),np.uint8)
    if old['J']:
        OV=np.array(old['V']); J=np.array(old['J']); d,i=cKDTree(OV).query(m.vertices,k=3); jf=(J[i].mean(1)>0.5)
        # joint only where the old surface was close (avoid bleeding across the cleft)
        jf&=d[:,0]<6; c[jf,0]=255
    m.visual=trimesh.visual.ColorVisuals(m,vertex_colors=np.c_[c,np.full(len(c),255)].astype(np.uint8))
    bones[key]=m; sc.add_geometry(m,node_name=key,geom_name=key); print(key,len(m.faces),'joint verts',int((c[:,0]>0).sum()), 'bounds',m.bounds.round(0).tolist())
sc.export(f'{SP}/sij/simple_raw.glb')
# ---- detail soft tissue
dt=trimesh.Scene()
def add(layer,key,m,n):
    m=simp(m,n)
    if len(m.faces)<1500:
        v,f=trimesh.remesh.subdivide_loop(m.vertices,m.faces,iterations=2 if len(m.faces)<400 else 1); m=trimesh.Trimesh(v,f)
    trimesh.smoothing.filter_taubin(m,iterations=4 if len(m.faces)<8000 else 2); col(m,(255,255,255)); dt.add_geometry(m,node_name=f'{layer}__{key}',geom_name=f'{layer}__{key}'); print(' ',layer,key,len(m.faces))
for fma,key in [('FMA22340','piriformis_r'),('FMA22341','piriformis_l'),('FMA22328','gluteus_maximus_r'),('FMA22329','gluteus_maximus_l'),('FMA22330','gluteus_medius_r'),('FMA22331','gluteus_medius_l'),('FMA22332','gluteus_minimus_r'),('FMA22333','gluteus_minimus_l')]:
    m=trimesh.load(B+fma+'.stl'); m.apply_transform(Tb); add('mus',key,m,8000 if 'piri' in key else 9000)
# Z-Anatomy -> frame: start from coarse fit, refine onto hi-res BP3D bones
Za=pickle.load(open(f'{SP}/sij/za_bones.pkl','rb')); T0=np.load(f'{SP}/sij/za_T.npy')
src=np.vstack([Za[k].vertices for k in ('Sacrum','Hip bone.l','Hip bone.r','Vertebra L5')])
dst=np.vstack([bones[k].vertices for k in ('sacrum','hipL','hipR','L5')])
s0=np.cbrt(np.linalg.det(T0[:3,:3])); s,R,t,e=icp(src,dst,s0,T0[:3,:3]/s0,T0[:3,3],80); print('Z-A refine err',round(e,2),'scale',round(s,3))
Tz=np.eye(4); Tz[:3,:3]=s*R; Tz[:3,3]=t; np.save(f'{SP}/sij/za_T2.npy',Tz)
REQ={'Joints100':[('lig','Posterior sacro-iliac ligament.r','post_si_lig_r'),('lig','Posterior sacro-iliac ligament.l','post_si_lig_l'),
                  ('lig','Interosseous sacro-iliac ligament.r','interosseous_si_lig_r'),('lig','Interosseous sacro-iliac ligament.l','interosseous_si_lig_l'),
                  ('lig','Sacrotuberous ligament.r','sacrotuberous_r'),('lig','Sacrotuberous ligament.l','sacrotuberous_l'),
                  ('lig','Sacrospinous ligament.r','sacrospinous_r'),('lig','Sacrospinous ligament.l','sacrospinous_l'),
                  ('lig','Iliolumbar ligament.r','iliolumbar_r'),('lig','Iliolumbar ligament.l','iliolumbar_l')],
     'NervousSystem100':[('nerve','Sciatic nerve.r','sciatic_r'),('nerve','Sciatic nerve.l','sciatic_l'),('nerve','Superior gluteal nerve.r','sup_gluteal_n_r'),('nerve','Superior gluteal nerve.l','sup_gluteal_n_l')],
     'CardioVascular41':[('vessel','Superior gluteal artery.r','sup_gluteal_a_r'),('vessel','Superior gluteal artery.l','sup_gluteal_a_l'),('vessel','Inferior gluteal artery.r','inf_gluteal_a_r'),('vessel','Inferior gluteal artery.l','inf_gluteal_a_l')],
     'MuscularSystem100':[('mus','Multifidus lumborum muscle.r','multifidus_r'),('mus','Multifidus lumborum muscle.l','multifidus_l')]}
for f,items in REQ.items():
    got=za_extract(f'{SP}/za/{f}.glb',{n for _,n,_ in items})
    for layer,n,key in items:
        if n not in got: print('  MISSING',n); continue
        m=got[n]; m.apply_transform(Tz); add(layer,key,m,6000)
dt.export(f'{SP}/sij/detail_raw.glb')
