"""Build a portable public-only research page; no upstream or private files included."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parent
project=root.parents[1]
out=root/'dist'
shutil.copytree(root/'public',out,dirs_exist_ok=True)
(out/'assets').mkdir(exist_ok=True)
for source,name in [
    (project.parent/'006-pixelle-video/assets/cafe-demo.mp4','cafe-demo.mp4'),
    (project.parent/'006-pixelle-video/assets/composed-frame.png','pixelle-frame.png'),
    (project/'assets/canvas-reference.jpg','wao-canvas.jpg')]:
    shutil.copy2(source,out/'assets'/name)
print('Built public summary:',out)
