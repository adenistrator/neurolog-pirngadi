import trimesh, numpy as np, re
_cache={}
def za_extract(glb, names):
    """{name: Trimesh (world coords)}; merges per-material primitives named '<name>_<6hex>'"""
    if glb not in _cache: _cache[glb]=trimesh.load(glb, force='scene', process=False)
    sc=_cache[glb]; parts={}
    for node in sc.graph.nodes_geometry:
        base=re.sub(r'_[0-9a-f]{6}$','',node)
        if base in names:
            T,g=sc.graph[node]; m=sc.geometry[g].copy(); m.apply_transform(T); parts.setdefault(base,[]).append(m)
    out={}
    for k,v in parts.items():
        m=trimesh.util.concatenate(v); m=trimesh.Trimesh(m.vertices,m.faces,process=True); m.merge_vertices()
        m.update_faces(m.nondegenerate_faces()); m.remove_unreferenced_vertices(); trimesh.repair.fix_normals(m); out[k]=m
    return out
