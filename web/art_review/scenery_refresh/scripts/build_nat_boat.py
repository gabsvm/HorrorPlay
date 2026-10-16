"""Nat's carved cigar-box toy boat; game-ready prerender from Blender 4.2.

Run: blender -b --factory-startup -P web/art_review/scenery_refresh/scripts/build_nat_boat.py
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


def material(name, rgba, rough=.75, metallic=0):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*rgba,1)
    m.use_nodes=True
    shader=m.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value=(*rgba,1)
    shader.inputs["Roughness"].default_value=rough
    shader.inputs["Metallic"].default_value=metallic
    return m

wood=material("Madera de caja de puros, barniz gastado",(.28,.16,.075))
edge=material("Costillas de madera y cantos pulidos",(.44,.28,.13))
seam=material("Uniones mojadas y clavos",(.10,.075,.05))
sail=material("Lona sucia, beige crudo",(.67,.64,.49),.98)
sailFold=material("Lona en sombra",(.38,.37,.31),.94)
rope=material("Jarcia de hilo de algodón",(.46,.36,.22),.87)
label=material("Papel amarillento de cigarrillos",(.60,.44,.24),.9)
iron=material("Clavo oxidado",(.24,.20,.15),.36,.4)


def mesh(name, verts, faces, mat):
    m=bpy.data.meshes.new(name)
    m.from_pydata(verts, [], faces)
    m.update()
    o=bpy.data.objects.new(name,m)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    return o


def cylinder(name, at, radius, depth, mat, rot=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=depth, location=at)
    o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    if rot:o.rotation_euler=rot
    return o


def cord(name,pts,r,mat):
    c=bpy.data.curves.new(name,'CURVE')
    c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2
    s=c.splines.new('POLY');s.points.add(len(pts)-1)
    for i,p in enumerate(pts):s.points[i].co=(*p,1)
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)


# Flat-bottomed, asymmetric hull: 70cm cigar box, realistically made by a
# child rather than a professional shipwright.
top=[(-.43,-.18,.16),(.30,-.21,.15),(.44,0,.16),(.30,.19,.15),(-.43,.17,.16),(-.48,0,.17)]
bot=[(-.35,-.115,0),(.22,-.13,0),(.32,0,.01),(.22,.13,0),(-.35,.11,0),(-.41,0,0)]
verts=top+bot
faces=[tuple(range(6)),tuple(range(6,12))]
for i in range(6):faces.append((i,(i+1)%6,(i+1)%6+6,i+6))
mesh("Casco tallado y desigual",verts,faces,wood)
for i,(a,b) in enumerate(zip(top,top[1:]+top[:1])):
    cord("Regala gastada "+str(i),[a,b],.015,edge)
for z in (.045,.09):
    cord("Tablas de la borda "+str(z),[(-.37,-.19,z),(.29,-.22,z)],.007,seam)
cylinder("Máistil astillado",(-.075,.01,.39),.016,.66,edge,rot=(0,.04,-.08))
cord("Driza",[( -.09,.02,.71),(.30,.01,.13)],.005,rope)

# A single torn sail bends slightly toward the wind, revealing two planes.
sverts=[(-.062,.01,.69),(.20,.025,.57),(.31,.055,.27),(.17,.03,.30),
        (.11,-.015,.34),(.07,-.035,.24),(-.065,0,.26)]
mesh("Vela remendada con mordisco",sverts,[(0,1,2,3,4,5,6)],sail)
mesh("Dobladillo en sombra",
    [(-.06,-.005,.66),(.185,.02,.55),(.095,.015,.52),(-.04,-.005,.56)],
    [(0,1,2,3)],sailFold)
cord("Costura a estribor",[(.20,.02,.57),(.29,.056,.32),(.17,.03,.30)],.006,rope)
cord("Costura inferior",[(-.06,-.003,.26),(.06,-.03,.24),(.11,-.015,.34)],.004,rope)

# Faded cigar-box label on deck, only visible at close-up.
mesh("Restos etiqueta caja",
    [(-.30,-.20,.178),(-.11,-.205,.178),(-.11,-.205,.18),(-.30,-.20,.18)],
    [(0,1,2,3)],label)
for x in (-.33,.27):
    cylinder("Clavo", (x,-.17,.178),.009,.01,iron)

world=bpy.context.scene.world
world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.095,.12,.13,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.8


def area(name,position,power,color,size):
    bpy.ops.object.light_add(type='AREA',location=position)
    o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.size=size
    o.rotation_euler=(Vector((0,0,.27))-o.location).to_track_quat('-Z','Y').to_euler()

area("Anochecer del río",(-2,-3,2),170,(1,.75,.52),3)
area("Rim de luna húmeda",(2,1,1.7),130,(.62,.78,1),2.5)
bpy.ops.object.camera_add(location=(1.25,-3.6,1.7))
cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,.3))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=1.27
sc=bpy.context.scene;sc.camera=cam
sc.render.engine='CYCLES';sc.cycles.samples=24
sc.render.resolution_x=370;sc.render.resolution_y=310
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
sc.render.film_transparent=True
sc.view_settings.view_transform='Standard'
sc.view_settings.look='Medium High Contrast'
sc.render.filepath=str(ROOT/'renders'/'nat_boat_raw.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'source'/'nat_cigar_box_boat.blend'))
bpy.ops.render.render(write_still=True)
