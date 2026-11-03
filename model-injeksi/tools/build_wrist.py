import sys,os,json,numpy as np,trimesh,fast_simplification
sys.path.insert(0,os.path.dirname(__file__)); from za import za_extract
SP=sys.argv[1]; B=f'{SP}/src/BodyParts3D/assets/BodyParts3D_data/stl/'
D=json.load(open(f'{SP}/wrist/dump.json')); Tb=np.load(f'{SP}/wrist/bp3d_T.npy'); Tz=np.load(f'{SP}/wrist/za_T.npy')
YMIN,YMAX=-4.25,6.2
def crop(m):
    keep=((m.vertices[m.faces][:,:,1]>YMIN)&(m.vertices[m.faces][:,:,1]<YMAX)).all(1); m.update_faces(keep); m.remove_unreferenced_vertices(); return m
def simp(m,n):
    if len(m.faces)>n*1.05:
        v,f=fast_simplification.simplify(m.vertices.astype(np.float32),m.faces.astype(np.int32),target_reduction=1-n/len(m.faces)); m=trimesh.Trimesh(v,f)
    return m
def white(m,c=(255,255,255)): m.visual=trimesh.visual.ColorVisuals(m,vertex_colors=np.tile(list(c)+[255],(len(m.vertices),1)).astype(np.uint8)); return m
MAP={'radius':23464,'ulna':23467,'scaphoid':24435,'lunate':24437,'triquetrum':24439,'pisiform':24441,'trapezium':24443,'trapezoid':23725,'capitate':24446,'hamate':24448,'mc1':24464,'mc2':24466,'mc3':24468,'mc4':24470,'mc5':24472,'pp1':24450,'pp2':24451,'pp3':24452,'pp4':24453,'pp5':24454}
sc=trimesh.Scene(); tot=0
for nm,d in D.items():
    layer,key=nm.split('__')
    if layer=='bone':
        m=trimesh.load(B+f'FMA{MAP[key]}.stl'); m.apply_transform(Tb)
        v,f=trimesh.remesh.subdivide_loop(m.vertices,m.faces,iterations=1); m=trimesh.Trimesh(v,f)
        trimesh.smoothing.filter_taubin(m,iterations=6); m=crop(m); white(m,(235,235,235))
    else:
        P=np.array(d['P']).reshape(-1,3); I=np.array(d['I']).reshape(-1,3); C=np.array(d['C']).reshape(-1,3) if d['C'] else None
        m=trimesh.Trimesh(P,I,process=False)
        if C is not None and len(C): m.visual=trimesh.visual.ColorVisuals(m,vertex_colors=np.c_[C*255,np.full(len(C),255)].astype(np.uint8))
    sc.add_geometry(m,node_name=nm,geom_name=nm); tot+=len(m.faces)
print('simple tris',tot); sc.export(f'{SP}/wrist/simple_raw.glb')
REQ={'Joints100':[('lig','Articular disc of distal radio-ulnar joint.r','tfcc_disc'),('lig','Palmar radio-ulnar ligament.r','palmar_ru_lig'),('lig','Dorsal radio-ulnar ligament.r','dorsal_ru_lig'),
                  ('lig','Scapholunate interosseous ligament.r','sl_lig'),('lig','Dorsal radiocarpal ligament.r','drc_lig'),('lig','Dorsal intercarpal ligaments.r','dic_lig'),
                  ('lig','Ulnolunate ligament.r','ul_lig'),('lig','Ulnotriquetral ligament.r','ut_lig')],
     'MuscularSystem100':[('ret','Extensor retinaculum of wrist.r','extret'),
                  ('sheath','Tendon sheath - abd. pollicis longus - ext. pollicis brevis.r','sh_k1'),('sheath','Tendon sheath of extensors carpi radialis.r','sh_k2'),('sheath','Tendon sheath of extensor pollicis longus.r','sh_k3'),
                  ('sheath','Tendon sheath of extensor digitorum and extensor indicis.r','sh_k4'),('sheath','Tendon sheath of extensor digiti minimi manus.r','sh_k5'),('sheath','Tendon sheath of extensor carpi ulnaris.r','sh_k6'),
                  ('sheath','Tendon sheath of flexor carpi radialis.r','sh_fcr'),('sheath','Tendon sheath of flexor pollicis longus.r','sh_fpl'),('sheath','Common flexor tendon sheath.r','sh_flex')],
     'NervousSystem100':[('nerve','Median nerve.r','median'),('nerve','Palmar branch of median nerve.r','median_palmar'),('nerve','Muscular branches of median nerve.r','median_motor'),
                  ('nerve','Superficial branch of radial nerve.r','radial_sup'),('nerve','Posterior interosseous nerve of forearm.r','pin'),
                  ('nerve','Ulnar nerve.r','ulnar'),('nerve','Dorsal branch of ulnar nerve.r','ulnar_dorsal'),('nerve','Superficial branch of ulnar nerve.r','ulnar_sup'),('nerve','Deep branch of ulnar nerve.r','ulnar_deep')],
     'CardioVascular41':[('vessel','Radial artery.r','radial_a'),('vessel','Ulnar artery.r','ulnar_a'),('vessel','Superficial palmar arch.r','sup_arch'),('vessel','Deep palmar arch.r','deep_arch')]}
dt=trimesh.Scene(); tot=0
for f,items in REQ.items():
    got=za_extract(f'{SP}/za/{f}.glb',{n for _,n,_ in items})
    for layer,n,key in items:
        if n not in got: print('  MISSING',n); continue
        m=got[n]; m.apply_transform(Tz); m=crop(m)
        if len(m.faces)==0: print('  EMPTY after crop',n); continue
        m=simp(m,7000)
        if len(m.faces)<2000:
            v,f2=trimesh.remesh.subdivide_loop(m.vertices,m.faces,iterations=2 if len(m.faces)<500 else 1); m=trimesh.Trimesh(v,f2)
        trimesh.smoothing.filter_taubin(m,iterations=4); white(m)
        dt.add_geometry(m,node_name=f'{layer}__{key}',geom_name=f'{layer}__{key}'); tot+=len(m.faces); print('  ',layer,key,len(m.faces),m.bounds.round(2).tolist())
print('detail tris',tot); dt.export(f'{SP}/wrist/detail_raw.glb')
