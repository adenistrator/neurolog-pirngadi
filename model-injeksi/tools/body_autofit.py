import numpy as np, trimesh, sys, json
SP=sys.argv[1]
TS=[[7.05,.75,.4,.75],[7.45,1.1,.5,.95],[7.8,1.42,.74,.9],[8.2,1.74,.92,1.2],[8.85,1.86,1.0,1.34],[9.45,1.8,1.05,1.22],[10.0,1.66,1.05,1.0],[10.6,1.46,1.0,.86],
    [11.3,1.5,1.02,.9],[12.2,1.62,1.12,1.0],[13.2,1.76,1.2,1.05],[14.0,1.9,1.05,1.0]]
LS=[[9.1,1.15,1.0,.85,.9],[8.2,1.25,.95,.9,1.0],[7.2,1.3,.85,.82,.9],[6.1,1.25,.68,.7,.7],[5.1,1.05,.55,.56,.52],[4.5,.85,.5,.5,.58]]
sc=trimesh.load(f'{SP}/lumbar/detail_raw.glb',force='scene')
V=np.vstack([g.vertices for g in sc.geometry.values()])
V=V[(V[:,1]>4.6)&(V[:,1]<13.9)]; V=V[~((V[:,1]<7.3)&(np.abs(V[:,0])<0.35))]; V=V[::2]
M=0.07
def it(tab,y,i):
    t=sorted(tab); return np.interp(y,[r[0] for r in t],[r[i] for r in t])
def s_torso(p):
    x,y,z=p
    if not 7.05<=y<=14: return 9
    hw=it(TS,y,1); d=it(TS,y,2) if z>0 else it(TS,y,3)
    return ((abs(x)/(hw-M))**2.5+(abs(z)/(d-M))**2.5)**(1/2.5)
def s_leg(p):
    x,y,z=p
    if not 4.5<=y<=9.1: return 9
    cx=it(LS,y,1); rx=it(LS,y,2); r=it(LS,y,3) if z>0 else it(LS,y,4); sd=1 if x>0 else -1
    return ((abs(x-sd*cx)/(rx-M))**2.2+(abs(z)/(r-M))**2.2)**(1/2.2)
for rnd in range(40):
    st=np.array([s_torso(p) for p in V]); sl=np.array([s_leg(p) for p in V])
    bad=(st>1)&(sl>1); print('round',rnd,'outside',int(bad.sum()))
    if not bad.any(): break
    need={}
    def bump(key,f):
        if f>1.0005: need[key]=max(need.get(key,1),f)
    for p,a,b in zip(V[bad],st[bad],sl[bad]):
        x,y,z=p
        if y>=8.0 or (y>=7.05 and a<b):
            i=int(np.argmin([abs(r[0]-y) for r in TS])); r=TS[i]; kz=2 if z>0 else 3
            tx=(abs(x)/r[1])**2.5; tz=(abs(z)/r[kz])**2.5; w=tx/(tx+tz+1e-9); f=min(a,1.2)
            bump(('T',i,1),f**w); bump(('T',i,kz),f**(1-w))
        else:
            i=int(np.argmin([abs(r[0]-y) for r in LS])); r=LS[i]; kz=3 if z>0 else 4
            tx=(abs(abs(x)-r[1])/r[2])**2.2; tz=(abs(z)/r[kz])**2.2; w=tx/(tx+tz+1e-9); f=min(b,1.2)
            bump(('L',i,2),f**w); bump(('L',i,kz),f**(1-w))
    for (t,i,k),f in need.items():
        (TS if t=='T' else LS)[i][k]*=f*1.005
# hips: widest at trochanter/gluteus-medius band, monotone above and below
w=max(TS[4][1],TS[5][1]); TS[4][1]=w; TS[5][1]=w; TS[3][1]=max(TS[3][1],w*0.95)
TS=[[round(float(v),3) for v in r] for r in TS]; LS=[[round(float(v),3) for v in r] for r in LS]
print('TS',TS); print('LS',LS); json.dump({'TS':TS,'LS':LS},open(f'{SP}/lumbar/body_fit.json','w'))
