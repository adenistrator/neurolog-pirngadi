"""Assemble a model page: src html + shared shell CSS + embedded data blobs.
usage: build_page.py SRC OUT KEY=FILE ...   (FILE .glb -> base64; other -> raw text)
Placeholders: /*@SHELL@*/ and @@KEY@@ or /*@KEY@*/"""
import sys, base64, pathlib
src, out, *pairs = sys.argv[1:]
root = pathlib.Path(__file__).resolve().parent.parent
html = pathlib.Path(src).read_text()
html = html.replace('/*@SHELL@*/', (root/'shared/shell.css').read_text()).replace('/*@SHELLJS@*/', (root/'shared/shell.js').read_text())
for p in pairs:
    k, f = p.split('=', 1); f = pathlib.Path(f)
    val = base64.b64encode(f.read_bytes()).decode() if f.suffix in ('.glb', '.bin') else f.read_text()
    for ph in (f'@@{k}@@', f'/*@{k}@*/'):
        html = html.replace(ph, val)
left = [t for t in ('/*@', '@@') if t in html.replace('/*@SHELL','')]
pathlib.Path(out).write_text(html)
print(out, f'{len(html)/1e6:.2f} MB', 'UNFILLED:'+str(left) if left else 'ok')
