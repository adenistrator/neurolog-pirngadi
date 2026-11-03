import numpy as np, trimesh, sys, json
SP=sys.argv[1]
TS=[(7.45,.85,.5,.55),(7.8,1.42,.74,.9),(8.2,1.74,.92,1.2),(8.85,1.86,1.0,1.34),(9.45,1.8,1.05,1.22),(10.0,1.66,1.05,1.0),(10.6,1.46,1.0,.86),
    (11.3,1.5,1.02,.9),(12.2,1.62,1.12,1.0),(13.2,1.76,1.2,1.05),(14.0,1.9,1.05,1.0)]
LS=[(9.1,.92,.9,.85,.9),(8.2,.92,.9,.9,.95),(7.2,.88,.8,.82,.82),(6.1,.8,.66,.7,.66),(5.1,.74,.53,.56,.52),(4.5,.72,.5,.5,.58)]
if len(sys.argv)>2:
    o=json.load(open(sys.argv[2])); TS=[tuple(t) for t in o['TS']]; LS=[tuple(t) for t in o['LS']]
def interp(tab,y):
    tab=sorted(tab); ys=[t[0] for t in tab]
    return [np.interp(y,ys,[t[i] for t in tab]) for i in range(1,len(tab[0]))]
sc=trimesh.load(f'{SP}/lumbar/detail_raw.glb',force='scene')
V=[];N=[]
for name,g in sc.geometry.items():
    T=sc.graph[name][0] if name in sc.graph else np.eye(4)
    v=trimesh.transform_points(g.vertices,T); V.append(v); N+= [name]*len(v)
V=np.vstack(V); N=np.array(N)
M=0.06  # skin margin
def inside(p):
    x,y,z=p
    out=[]
    if 7.05<=y<=14.0:
        hw,df,db=interp(TS,y); d=df if z>0 else db
        if (abs(x)/(hw-M))**2.5+(abs(z)/(d-M))**2.5<=1: return True
    if 4.5<=y<=9.1:
        cx,rx,rf,rb=interp(LS,y)
        for sd in (-1,1):
            r2=rf if z>0 else rb
            if (abs(x-sd*cx)/(rx-M))**2.2+(abs(z)/(r2-M))**2.2<=1: return True
    return y>14.0 or y<4.5
bad=np.array([not inside(p) for p in V]) & ~((V[:,1]<7.3)&(np.abs(V[:,0])<0.35))
print('outside verts',bad.sum(),'of',len(V))
from collections import Counter
print(Counter(n.split('|')[0] for n in N[bad]).most_common())
for y0 in np.arange(5.0,13.6,0.4):
    m=bad&(V[:,1]>=y0)&(V[:,1]<y0+0.4)
    if m.sum(): print(f'y {y0:.1f}-{y0+.4:.1f}: n={m.sum():5d} max|x|={np.abs(V[m,0]).max():.2f} zmin={V[m,2].min():.2f} zmax={V[m,2].max():.2f}', Counter(n.split('|')[0] for n in N[m]).most_common(3))
