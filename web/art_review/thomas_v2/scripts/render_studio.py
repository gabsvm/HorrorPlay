"""Studio showcase renders from the V2 master (Blender batch). NOT game frames."""
import bpy, os, sys
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
outdir = os.path.abspath(args[0]) if args else os.path.abspath('web/art_review/thomas_v2/working')
os.makedirs(outdir, exist_ok=True)
scn = bpy.context.scene
scn.render.engine = 'BLENDER_EEVEE'
scn.render.resolution_percentage = 100
scn.render.film_transparent = True
scn.render.image_settings.file_format = 'PNG'
scn.render.image_settings.color_mode = 'RGBA'
try:
    scn.eevee.taa_render_samples = 64
except Exception:
    pass
try:
    scn.view_settings.view_transform = 'Standard'
    scn.view_settings.look = 'Medium Contrast'
except Exception:
    pass
for cam_name, fname, rx, ry in (('STUDIO_threequarter', 'studio_34.png', 900, 900),
                                ('STUDIO_side', 'studio_side.png', 900, 900),
                                ('STUDIO_front', 'studio_front.png', 900, 900)):
    cam = bpy.data.objects.get(cam_name)
    if not cam:
        print('missing', cam_name)
        continue
    scn.camera = cam
    scn.render.resolution_x, scn.render.resolution_y = rx, ry
    scn.render.filepath = os.path.join(outdir, fname)
    bpy.ops.render.render(write_still=True)
    print('STUDIO saved', fname)
