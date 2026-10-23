"""Local CPU smoke test for the seven Colab notebooks, without network or GPU."""
from pathlib import Path
import json,ast,hashlib
from PIL import Image
root=Path(__file__).resolve().parents[3]
nbs=Path(__file__).resolve().parent
assert (root/"web/assets/closeups/hands.jpg").exists(),str(root)
def source(path):
    b=(root/path).read_bytes()
    return Image.open(root/path).convert("RGB" if path.endswith(".jpg") else "RGBA"),hashlib.sha256(b).hexdigest()
for nb in sorted(nbs.glob("*.ipynb")):
    book=json.loads(nb.read_text(encoding="utf-8"))
    codes=["".join(c["source"]) for c in book["cells"] if c["cell_type"]=="code"]
    for code in codes:
        if not code.startswith("%"):ast.parse(code)
    context={"__name__":"__main__"}
    count=0
    for code in codes:
        if code.startswith("%"):continue
        if nb.name.startswith("02") and "from diffusers import AutoPipelineForInpainting" in code:continue
        if nb.name.startswith("02") and "SEEDS=[1888]" in code:continue
        # Keep all generated smoke outputs out of the repository and Colab path.
        code=code.replace("/content/horrorplay_", "C:/Dev/HorrorPlay_Colab_QA/horrorplay_")
        code=code.replace("from IPython.display import display", "display=lambda *a,**kw:None")
        code=code.replace("random, requests, shutil", "random, shutil")
        exec(compile(code,str(nb),"exec"),context)
        if "def source(path):" in code:
            context["source"]=source
            context["display"]=lambda *a,**kw:None
            context["finish"]=lambda *a,**kw:None
        count+=1
    if nb.name.startswith(("03","04","05")):
        for x,y,r in context["HOTSPOTS"]:
            assert context["mask"].getpixel((x,y))==0,(nb.name,x,y)
    if nb.name.startswith("01"):
        p=Path("C:/Dev/HorrorPlay_Colab_QA/horrorplay_wall_candidates")
        assert len(list(p.glob("*.png")))==6, list(p.iterdir())
    if nb.name.startswith("06"):assert len(context["versions"])==2
    if nb.name.startswith("07"):assert len(context["examples"])==3
    print("PASS",nb.name,"cells_run",count,flush=True)
print("PASS all 7 notebooks (CPU path and mask checks); GPU execution remains untested")
