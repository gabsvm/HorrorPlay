import bpy
print("BLENDER VERSION", bpy.app.version_string, bpy.app.version)
print("ENGINES probe skipped")
# list render engines via bl_enum?
try:
    scn = bpy.context.scene
    print("current engine:", scn.render.engine)
    for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items:
        print(" engine opt:", e.identifier)
except Exception as ex:
    print("engine list fail:", ex)
# eevee attrs
try:
    print("has eevee:", hasattr(scn, 'eevee'))
    if hasattr(scn, 'eevee'):
        for p in dir(scn.eevee):
            if 'sample' in p.lower() or 'taa' in p.lower():
                print(" eevee.", p, "=", getattr(scn.eevee, p, None))
except Exception as ex:
    print("eevee fail", ex)
try:
    print("has eevee_next:", hasattr(scn, 'eevee_next'))
except Exception as ex:
    print(ex)
# node group interface
try:
    ng = bpy.data.node_groups.new('ProbeOut', 'ShaderNodeTree')
    print("interface type:", type(ng.interface))
    print("interface dir:", [x for x in dir(ng.interface) if 'socket' in x.lower() or 'new' in x.lower()])
    s = ng.interface.new_socket('Color', in_out='INPUT', socket_type='NodeSocketColor')
    print("new_socket ok:", s)
    bpy.data.node_groups.remove(ng)
except Exception as ex:
    import traceback; traceback.print_exc(); print("ng fail", ex)
# world
try:
    w = bpy.data.worlds.new('void')
    print("world attrs:", [x for x in dir(w) if not x.startswith('_')][:40])
    print("world use_nodes:", w.use_nodes)
except Exception as ex:
    print("world fail", ex)
