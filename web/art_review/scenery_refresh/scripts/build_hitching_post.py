"""High-readability Victorian granite tethering post, rendered from Blender 4.2.

Run from the repository root:
  blender -b --factory-startup -P web/art_review/scenery_refresh/scripts/build_hitching_post.py

Outputs: ../source/wren_hitching_post.blend and ../renders/wren_hitching_post_raw.png.
Does not modify the game or its production sprites.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
(ROOT / "renders").mkdir(parents=True, exist_ok=True)
(ROOT / "source").mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def mat(name, rgb, rough=0.77, metal=0.0, noise=.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*rgb, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if noise:
        n = m.node_tree.nodes.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = 43
        n.inputs["Detail"].default_value = 3
        b = m.node_tree.nodes.new("ShaderNodeBump")
        b.inputs["Strength"].default_value = noise
        b.inputs["Distance"].default_value = .032
        m.node_tree.links.new(n.outputs["Fac"], b.inputs["Height"])
        m.node_tree.links.new(b.outputs["Normal"], p.inputs["Normal"])
    return m

granite = mat("Granit gris roto · irregular", (.39, .38, .36), .94, noise=.34)
capstone = mat("Canto iluminado, piedra pulida", (.51, .49, .44), .83, noise=.2)
chip = mat("Grietas de años de amarre", (.13, .14, .13), .95, noise=.23)
iron = mat("Hierro negro del anillo", (.13, .15, .16), .36, metal=.82)
edge = mat("Aristas mojadas del hierro", (.31, .32, .29), .29, metal=.65)
rope = mat("Cuerda de cáñamo desgastada", (.39, .32, .22), .92, noise=.13)
moss = mat("Líquenes en la base", (.19, .25, .17), .97, noise=.28)


def box(name, at, scale, material, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    ob = bpy.context.object
    ob.name = name
    ob.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(material)
    if bevel:
        mod = ob.modifiers.new("Weathered corners", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        n = ob.modifiers.new("Weighted stone normals", "WEIGHTED_NORMAL")
        n.keep_sharp = True
    return ob


def torus(name, at, major, minor, material, rx=0, ry=0):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
        major_segments=36, minor_segments=10, location=at, rotation=(rx,ry,0))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    for polygon in o.data.polygons: polygon.use_smooth = True
    return o


def cord(name, points, radius, material):
    cv = bpy.data.curves.new(name, "CURVE")
    cv.dimensions = "3D"
    cv.bevel_resolution = 3
    cv.resolution_u = 16
    cv.bevel_depth = radius
    s = cv.splines.new("POLY")
    s.points.add(len(points) - 1)
    for i, p in enumerate(points): s.points[i].co = (*p, 1)
    o = bpy.data.objects.new(name, cv)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(material)
    return o


# 0.92 m, designed as a short, solid granite hitching bollard: this is *not*
# a gas lamp. The broad cap is a believable surface for Thomas's penny.
box("Base de granito encajada en la acera", (0,0,.10), (.51,.47,.20), granite, .052)
box("Cuerpo estriado, sección octogonal sugerida", (0,0,.43), (.36,.33,.53), granite, .055)
box("Corona para el penique · superficie horizontal", (0,0,.75), (.46,.41,.13), capstone, .059)
box("Almohadilla de asiento de la corona", (0,0,.67), (.39,.37,.06), granite, .031)

for i, (x, y, z, w) in enumerate([(-.18,-.11,.21,.07),(.15,-.17,.38,.09),
                                  (-.10,-.18,.58,.065),(.11,-.17,.64,.055)]):
    frag = box(f"Desconchón {i}", (x,y,z), (w,.008,.019), chip, .004)
    frag.rotation_euler[1] = -.23 if i%2 else .16

# Ring oriented in the vertical XZ plane, protruding toward the camera.
torus("Ojo de amarre hierro forjado", (.02,-.27,.51), .145,.026,iron,rx=math.pi/2)
torus("Desgaste del anillo", (.02,-.292,.51), .127,.007,edge,rx=math.pi/2)
box("Placa de anclaje", (.02,-.192,.49), (.17,.058,.26),iron,.024)
for x in [-.045,.084]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=.015, location=(x,-.226,.53))
    bpy.context.object.data.materials.append(edge)

# A short length of rope actually passes through the ring and hangs. Slight
# thickness makes the contour legible after downsampling on a dark screen.
cord("Cuerda por el ojo", [(-.085,-.34,.58),(-.04,-.365,.66),(.06,-.36,.64),
    (.135,-.33,.55),(.17,-.34,.39),(.13,-.32,.29),(.11,-.34,.25)],.023,rope)
cord("Cabos sueltos",[(.11,-.34,.25),(.145,-.33,.22),(.19,-.31,.18)],.016,rope)

for i in range(5):
    x=-.20+i*.08
    box(f"Líquenes y suciedad {i}", (x,-.237,.08), (.08,.009,.025), moss,.007)

world = bpy.context.scene.world
world.use_nodes=True
world.node_tree.nodes["Background"].inputs["Color"].default_value=(.055,.066,.083,1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value=.6

def area(name, at, energy, color, size):
    bpy.ops.object.light_add(type="AREA",location=at)
    o=bpy.context.object; o.name=name; o.data.energy=energy; o.data.color=color
    o.data.shape="DISK"; o.data.size=size
    direction=Vector((0,0,.43))-o.location
    o.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()

area("Farola cálida lateral",(-1.7,-3,2.9),290,(1,.73,.46),3.2)
area("Relleno luna azul",(2.5,-1,2.2),180,(.62,.75,1),2.5)
area("Recorte del granito",(-.3,2.1,1.7),220,(.65,.76,.87),1.3)

bpy.ops.object.camera_add(location=(1.35,-4.6,1.79))
camera=bpy.context.object
direction=Vector((0,0,.44))-camera.location
camera.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
camera.data.type="ORTHO"
camera.data.ortho_scale=1.46
bpy.context.scene.camera=camera
sc=bpy.context.scene
sc.render.engine="CYCLES"
sc.cycles.samples=24
sc.render.resolution_x=320
sc.render.resolution_y=440
sc.render.resolution_percentage=100
sc.render.image_settings.file_format="PNG"
sc.render.image_settings.color_mode="RGBA"
sc.render.film_transparent=True
sc.view_settings.view_transform="Standard"
sc.view_settings.look="Medium High Contrast"
sc.view_settings.exposure=0
sc.view_settings.gamma=1
sc.render.filepath=str(ROOT/"renders"/"wren_hitching_post_raw.png")
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/"source"/"wren_hitching_post.blend"))
bpy.ops.render.render(write_still=True)
print("RENDERED",sc.render.filepath)
