import sys,re,base64
html=open(sys.argv[1]).read(); out=sys.argv[2]
for m in re.finditer(r'<script id="(glb_[a-z]+)" type="application/octet-stream">(.*?)</script>',html,re.S):
    open(f"{out}/{m.group(1)}.glb","wb").write(base64.b64decode(m.group(2).strip())); print(m.group(1), len(m.group(2)))
