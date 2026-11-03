import numpy as np, itertools
from scipy.spatial import cKDTree
def umeyama(A,B):
    ma,mb=A.mean(0),B.mean(0); A0,B0=A-ma,B-mb
    U,S,Vt=np.linalg.svd(B0.T@A0/len(A)); d=np.sign(np.linalg.det(U@Vt)); Dm=np.diag([1,1,d])
    R=U@Dm@Vt; s=(S*np.diag(Dm)).sum()/((A0**2).sum()/len(A)); t=mb-s*R@ma; return s,R,t
def icp(src,dst,s,R,t,it=60):
    tree=cKDTree(src)  # find for each dst point nearest transformed src -> use inverse: transform src each iter
    for i in range(it):
        S=(s*(R@src.T)).T+t; tr=cKDTree(S); d,idx=tr.query(dst)
        keep=d<np.percentile(d,90)
        s,R,t=umeyama(src[idx[keep]],dst[keep])
    S=(s*(R@src.T)).T+t; d,_=cKDTree(S).query(dst); return s,R,t,d.mean()
def fit(srcs,dsts):
    src=np.vstack(srcs); dst=np.vstack(dsts); best=None
    for perm in itertools.permutations(range(3)):
      for sg in itertools.product([1,-1],repeat=3):
        R0=np.zeros((3,3))
        for i,p in enumerate(perm): R0[i,p]=sg[i]
        if np.linalg.det(R0)<0: continue
        s0=np.ptp(dst,0).max()/np.ptp(src,0).max()
        # align centroid of dst to centroid of matching src subset
        t0=dst.mean(0)-s0*R0@src.mean(0)
        r=icp(src[::3],dst[::3],s0,R0,t0,25)
        if best is None or r[3]<best[3]: best=r
    return icp(src,dst,*best[:3],60)
