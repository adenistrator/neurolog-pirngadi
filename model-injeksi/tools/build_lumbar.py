import sys,os,numpy as np,trimesh,fast_simplification
sys.path.insert(0,os.path.dirname(__file__)); from icp import umeyama; from za import za_extract
SP=sys.argv[1]; B=f'{SP}/src/BodyParts3D/assets/BodyParts3D_data/stl/'
LV={'T10':13.2,'T11':12.76,'T12':12.32,'L1':11.86,'L2':11.4,'L3':10.93,'L4':10.45,'L5':9.98}
zoff=lambda y:.12*np.sin(np.pi*min(1,max(0,(y-9.7)/2.9))); bz=lambda y:.1+zoff(y)
order=['T10','T11','T12','L1','L2','L3','L4','L5']
DISC=[('T10',13507),('T11',13508),('T12',13509),('L1',16033),('L2',16034),('L3',16035),('L4',16036),('L5',16037)]
VERT=[('T10',10037),('T11',10059),('T12',10081),('L1',13072),('L2',13073),('L3',13074),('L4',13075),('L5',13076)]
ld=lambda i: trimesh.load(B+f'FMA{i}.stl')
src=[];dst=[]
for lv,n in DISC:
    src.append(ld(n).vertices.mean(0))
    if lv=='L5': ym=9.8; dst.append([0,ym,bz(ym)+.02])
    else: i=order.index(lv); ym=(LV[lv]+LV[order[i+1]])/2; dst.append([0,ym,bz(ym)])
src=np.array(src);dst=np.array(dst); s,R,t=umeyama(src,dst)
res=np.linalg.norm((s*(R@src.T)).T+t-dst,axis=1); print('BP3D->sch scale',round(s,5),'(1 unit = %.0f mm)'%(1/s),'disc resid',res.round(3),'det',round(np.linalg.det(R),3))
T=np.eye(4); T[:3,:3]=s*R; T[:3,3]=t; np.save(f'{SP}/lumbar/bp3d_T.npy',T)
Tb_sij=np.load(f'{SP}/sij/bp3d_T.npy'); Tz_sij=np.load(f'{SP}/sij/za_T2.npy'); Tz=T@np.linalg.inv(Tb_sij)@Tz_sij
def simp(m,n):
    if len(m.faces)>n*1.05:
        v,f=fast_simplification.simplify(m.vertices.astype(np.float32),m.faces.astype(np.int32),target_reduction=1-n/len(m.faces)); m=trimesh.Trimesh(v,f)
    return m
sc=trimesh.Scene(); tot=0
def add(key,m,TT,n,ymin=None,ymax=None,side=None):
    global tot
    m=m.copy(); m.apply_transform(TT)
    if ymin is not None or ymax is not None:
        y=m.vertices[m.faces][:,:,1]; keep=np.ones(len(m.faces),bool)
        if ymin is not None: keep&=(y>ymin).all(1)
        if ymax is not None: keep&=(y<ymax).all(1)
        m.update_faces(keep); m.remove_unreferenced_vertices()
    m=simp(m,n)
    if len(m.faces)<1500: v,f=trimesh.remesh.subdivide_loop(m.vertices,m.faces,iterations=1); m=trimesh.Trimesh(v,f)
    trimesh.smoothing.filter_taubin(m,iterations=3)
    m.visual=trimesh.visual.ColorVisuals(m,vertex_colors=np.tile([255,255,255,255],(len(m.vertices),1)).astype(np.uint8))
    if side is None: side='R' if m.centroid[0]<-0.05 else 'L' if m.centroid[0]>0.05 else 'C'
    name=f'{key}|{side}'; sc.add_geometry(m,node_name=name,geom_name=name); tot+=len(m.faces); return m
for lv,n in VERT: add('vb:'+lv,ld(n),T,9000,side='C')
for lv,n in DISC: add('disc:'+lv,ld(n),T,3000,side='C')
add('sacrum',ld(16202),T,16000,side='C')
for key,ids,n,ymin,ymax in [('hip',(16586,16587),12000,None,None),('femur',(24474,24475),6000,6.6,None),('psoas',(22342,22343),6000,None,None),('ql',(22348,22349),5000,None,None),
    ('iliacus',(22322,22323),5000,None,None),('erector',(22740,22741,22751,22753),6000,None,13.6),('multifidus',(22878,22879),6000,None,13.6),
    ('piri',(22340,22341),5000,None,None),('gmax',(22328,22329),7000,None,None),('gmed',(22330,22331),7000,None,None),('gmin',(22332,22333),7000,None,None)]:
    for i in ids: add(key,ld(i),T,n,ymin,ymax)
got=za_extract(f'{SP}/za/NervousSystem100.glb',{'Sciatic nerve.r','Sciatic nerve.l','Superior gluteal nerve.r','Superior gluteal nerve.l'})
for nm,m in got.items(): add('sciatic' if 'Sciatic' in nm else 'sgn', m, Tz, 5000, ymin=6.6)
print('total tris',tot); sc.export(f'{SP}/lumbar/detail_raw.glb')
for k,g in sc.geometry.items():
    if k.split('|')[0] in ('vb:L5','vb:L1','sacrum','hip','femur','sciatic','psoas'): print(k, g.bounds.round(2).tolist())
