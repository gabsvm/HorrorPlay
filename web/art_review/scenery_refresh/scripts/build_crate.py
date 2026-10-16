"""Reusable Victorian packing crate rendered in Blender 4.2.

Run: blender -b --factory-startup -P web/art_review/scenery_refresh/scripts/build_crate.py
"""
from pathlib import Path
import math
import random
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parent.parent
(ROOT/'source').mkdir(parents=True,exist_ok=True)
(ROOT/'renders').mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mat(name, rgb, rough=.9, metal=0, bump=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*rgb,1)
    bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    if bump:
        n=m.node_tree.nodes.new('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value=69
        b=m.node_tree.nodes.new('ShaderNodeBump')
        b.inputs['Strength'].default_value=bump
        b.inputs['Distance'].default_value=.014
        m.node_tree.links.new(n.outputs['Fac'],b.inputs['Height'])
        m.node_tree.links.new(b.outputs['Normal'],bs.inputs['Normal'])
    return m

pine=[mat('Pino oscuro tablón '+str(i),c,bump=.22) for i,c in enumerate(
    [(.32,.21,.11),(.27,.17,.09),(.39,.25,.13),(.33,.20,.10)])]
iron=mat('Clavos hierro ennegrecido',(.18,.17,.15),.42,.56)
wet=mat('Hollín y suciedad',(.10,.085,.064),.96)

def box(name,loc,dimensions,material,bevel=.009):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=dimensions
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if bevel:
        m=o.modifiers.new('Aristas astilladas','BEVEL');m.width=bevel;m.segments=2
        o.modifiers.new('Normales ponderadas','WEIGHTED_NORMAL')
    return o

def nail(x,z,y=-.518):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=.018,location=(x,y,z))
    o=bpy.context.object;o.name='Cabeza de clavo';o.scale=(.9,.35,.8);o.data.materials.append(iron)

box('Interior oscuro', (0,0,.46),(1,.91,.91),wet,.012)
for i in range(5):
    z=.105+i*.19
    box('Tabla frontal '+str(i),(0,-.479,z),(.95,.073,.184),pine[(i+1)%4],.008)
    box('Tabla lateral '+str(i),(.51,0,z),(.071,.94,.184),pine[(i+2)%4],.008)
    for x in (-.43,.43):nail(x,z)
for x in (-.435,.435):
    box('Listón vertical frontal', (x,-.532,.46),(.095,.05,.92),pine[2],.009)
for z in (.065,.86):
    box('Listón horizontal frontal', (0,-.538,z),(.97,.055,.091),pine[0],.007)
for x in (-.41,.41):
    for z in (.065,.86):nail(x,z,y=-.574)
for i in range(5):
    y=-.42+i*.21
    box('Tabla superior '+str(i),(0,y,.931),(.96,.185,.059),pine[i%4],.007)
box('Marco superior delantero', (0,-.47,.97),(.99,.085,.065),pine[0],.009)
box('Marco superior lateral',(.5,0,.97),(.073,.98,.065),pine[1],.009)

world=bpy.context.scene.world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.065,.08,.09,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.75

def area(pos,power,color,size):
    bpy.ops.object.light_add(type='AREA',location=pos)
    o=bpy.context.object;o.data.energy=power;o.data.color=color;o.data.size=size
    o.rotation_euler=(Vector((0,0,.48))-o.location).to_track_quat('-Z','Y').to_euler()

area((-2,-3,3.8),240,(1,.82,.65),3.4)
area((2,1,2.3),140,(.55,.68,.92),2.2)
bpy.ops.object.camera_add(location=(2.25,-3.6,2.05))
c=bpy.context.object;c.rotation_euler=(Vector((0,0,.47))-c.location).to_track_quat('-Z','Y').to_euler()
c.data.type='ORTHO';c.data.ortho_scale=1.63
sc=bpy.context.scene;sc.camera=c
sc.render.engine='CYCLES';sc.cycles.samples=24
sc.render.resolution_x=240;sc.render.resolution_y=240
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
sc.render.film_transparent=True
sc.view_settings.view_transform='Standard';sc.view_settings.look='Medium High Contrast'
sc.render.filepath=str(ROOT/'renders'/'crate_raw.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'source'/'packing_crate.blend'))
bpy.ops.render.render(write_still=True)
