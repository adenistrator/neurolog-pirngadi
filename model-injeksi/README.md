# Model 3D Injeksi

Empat model 3D interaktif untuk referensi, edukasi pasien, dan pelatihan. Semuanya dipublish sebagai artifact claude.ai:

| Model | Artifact | Sumber halaman | Mesh sederhana | Mesh detail |
|---|---|---|---|---|
| Lutut (Rabago) | https://claude.ai/artifact/6jnnsE3gvEhwYNfZw6F4x6 | `src/lutut.html` | BodyParts3D | SPL Knee Atlas |
| Atlas SIJ | https://claude.ai/artifact/56aTviE2SvCuFzk1wEybnU | `src/sij.html` | BodyParts3D | BodyParts3D + Z-Anatomy |
| Pergelangan tangan | https://claude.ai/artifact/6vcre4QyWMQLU1o9ZN46wc | `src/wrist.html` | BodyParts3D | BodyParts3D + Z-Anatomy |
| Peta nyeri pinggang | https://claude.ai/artifact/XHZ3TA7KzVjZ1v6oma6jZW | `src/pinggang.html` | skematik prosedural + overlay patologi (facet arthropathy, spinal stenosis) | BodyParts3D + Z-Anatomy |

## Struktur

- `backup/` — HTML versi live sebelum upgrade (3 Nov 2026).
- `shared/shell.css`, `shared/shell.js` — tampilan dan navigasi bersama (warna, tombol, legenda, panel, badge verifikasi).
- `src/` — sumber halaman dengan placeholder (`/*@SHELL@*/`, `@@GLB_*@@`, dll).
- `data/<model>/` — GLB terkompresi (meshopt) dan data titik yang diekstrak dari versi lama.
- `dist/` — halaman jadi yang dipublish.
- `tools/` — skrip build dan tes.

## Build

```bash
python3 tools/build_page.py src/lutut.html dist/lutut.html LMS=data/lutut/lms.js GLB_SIMPLE=data/lutut/simple.glb GLB_DETAIL=data/lutut/detail.glb
python3 tools/build_page.py src/sij.html dist/sij.html HOT=data/sij/hot.js LEGACY=data/sij/legacy_svg.js GLB_SIMPLE=data/sij/simple.glb GLB_DETAIL=data/sij/detail.glb
python3 tools/build_page.py src/wrist.html dist/wrist.html LM=data/wrist/lm.js POINTS=data/wrist/points.js CONSTS=data/wrist/consts.js GLB_SIMPLE=data/wrist/simple.glb GLB_DETAIL=data/wrist/detail.glb
python3 tools/patch_pinggang.py data/pinggang/legacy_raw.js data/pinggang/app.js
python3 tools/build_page.py src/pinggang.html dist/pinggang.html APP=data/pinggang/app.js GLB_DETAIL=data/pinggang/detail.glb
```

## Pipeline mesh (ringkas)

1. Sumber: `mhalle/spl-knee-atlas` (VTK), `Kevin-Mattheus-Moerman/BodyParts3D` (STL), `LluisV/Z-Anatomy` (FBX → GLB via assimpjs).
2. Penyelarasan ke frame model lama supaya posisi titik tidak berubah: bounding-box fit (SPL lutut), ICP similarity (`tools/icp.py`), atau Umeyama pada pusat diskus (pinggang).
3. Penyederhanaan `fast-simplification`, Taubin smoothing, subdivisi Loop untuk mesh kasar, kompresi `gltfpack -cc`.
4. Skrip: `build_knee_detail.py`, `build_sij.py`, `build_wrist.py`, `build_lumbar.py`.

## Tes

`tools/test_page.cjs` membungkus halaman dengan skeleton publish, menyajikan three.js r160 dari salinan lokal, lalu menjalankan iPhone (terang/gelap), iPad, dan desktop (terang/gelap). Tes gagal bila ada error console, scroll horizontal, atau model tidak termuat.

## Lisensi mesh

- BodyParts3D © 2008 DBCLS — CC BY-SA 2.1 Japan (mesh turunan berlisensi sama).
- Z-Anatomy — CC BY-SA 4.0.
- SPL Knee Atlas — 3D Slicer License.
