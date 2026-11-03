import numpy as np, re
def read_vtk(path):
    b=open(path,'rb').read()
    def hdr(pos):
        e=b.index(b'\n',pos); return b[pos:e].decode('latin1').strip(), e+1
    pos=0; lines=[]
    for _ in range(4):
        l,pos=hdr(pos); lines.append(l)
    binary = lines[2].upper()=='BINARY'
    V=None; F=[]
    while pos < len(b):
        l,pos=hdr(pos)
        if not l: continue
        t=l.split()
        k=t[0].upper()
        if k=='POINTS':
            n=int(t[1]); dt={'float':'>f4','double':'>f8'}[t[2]]
            if binary:
                sz=n*3*np.dtype(dt).itemsize; V=np.frombuffer(b[pos:pos+sz],dtype=dt).reshape(n,3).astype(np.float64); pos+=sz
            else:
                vals=[]; 
                while len(vals)<n*3:
                    l,pos=hdr(pos); vals+=l.split()
                V=np.array(vals[:n*3],float).reshape(n,3)
        elif k in ('POLYGONS','TRIANGLE_STRIPS','LINES','VERTICES'):
            n,size=int(t[1]),int(t[2])
            if len(t)>3 or (pos<len(b) and b[pos:pos+7]==b'OFFSETS'):
                # vtk 5 format
                l,pos=hdr(pos); n_off=int(n); 
                dt='>i8' if 'int64' in l or 'vtktypeint64' in l.lower() else '>i4'
                off=np.frombuffer(b[pos:pos+n_off*np.dtype(dt).itemsize],dtype=dt); pos+=n_off*np.dtype(dt).itemsize
                if b[pos:pos+1]==b'\n': pos+=1
                l,pos=hdr(pos); dt2='>i8' if 'int64' in l.lower() else '>i4'
                con=np.frombuffer(b[pos:pos+size*np.dtype(dt2).itemsize],dtype=dt2); pos+=size*np.dtype(dt2).itemsize
                cells=[con[off[i]:off[i+1]] for i in range(len(off)-1)]
            else:
                if binary:
                    a=np.frombuffer(b[pos:pos+size*4],dtype='>i4'); pos+=size*4
                else:
                    vals=[]
                    while len(vals)<size:
                        l,pos=hdr(pos); vals+=l.split()
                    a=np.array(vals[:size],int)
                cells=[]; i=0
                while i<len(a):
                    c=a[i]; cells.append(a[i+1:i+1+c]); i+=1+c
            if k=='POLYGONS':
                for c in cells:
                    for j in range(1,len(c)-1): F.append((c[0],c[j],c[j+1]))
            elif k=='TRIANGLE_STRIPS':
                for c in cells:
                    for j in range(len(c)-2):
                        F.append((c[j],c[j+1],c[j+2]) if j%2==0 else (c[j+1],c[j],c[j+2]))
        elif k in ('POINT_DATA','CELL_DATA'):
            break
    return V, np.array(F,dtype=np.int64)
