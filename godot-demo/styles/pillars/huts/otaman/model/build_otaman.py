#!/usr/bin/env python3
"""Otaman's khata — Blender blockout for the Zalissya Pillars-lite pipeline.

Builds the house from DESIGN.md / Issue #4 Request 5 at true scale
(11 m x 5.5 m, walls 2.6 m, door 1.9 m) and renders two previews from the
Pillars camera (orthographic, elevation 40 deg) on a transparent film:
  preview_exterior.png  full walls + gont roof + porch + korohva
  preview_interior.png  roof off, near walls as knee-high stubs, furniture in
Run: blender -b -P build_otaman.py
"""
import bpy
import math
import os

OUT = os.path.dirname(os.path.abspath(__file__))

# ---------- helpers ----------
def mat(name, rgb):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1.0)
    return m

WHITEWASH = mat("whitewash_pale_blue", (0.82, 0.87, 0.90))
WHITEWASH_IN = mat("whitewash_interior", (0.78, 0.80, 0.72))
STONE = mat("stone", (0.45, 0.44, 0.40))
WOOD = mat("wood", (0.45, 0.33, 0.20))
WOOD_DARK = mat("wood_dark", (0.32, 0.22, 0.13))
GONT = mat("gont_shingle", (0.38, 0.34, 0.29))
BRICK = mat("brick", (0.55, 0.28, 0.20))
RED = mat("shutter_red", (0.62, 0.16, 0.12))
GREEN_DOOR = mat("door_green", (0.20, 0.38, 0.22))
GLASS = mat("glass", (0.65, 0.75, 0.80))
CRIMSON = mat("crimson", (0.55, 0.10, 0.14))
GOLD = mat("gold", (0.85, 0.65, 0.20))
CLAY_FLOOR = mat("clay_floor", (0.55, 0.44, 0.33))
PLANK = mat("plank_floor", (0.52, 0.40, 0.26))
PICH = mat("pich_clay", (0.72, 0.62, 0.50))
DARK = mat("dark_opening", (0.08, 0.06, 0.05))
STEEL = mat("steel", (0.70, 0.72, 0.75))
BRASS = mat("brass", (0.70, 0.55, 0.25))
CREAM = mat("cream_cloth", (0.88, 0.84, 0.74))
TAN = mat("bread_tan", (0.76, 0.60, 0.38))
BROWN = mat("leather_brown", (0.40, 0.26, 0.16))

def box(name, loc, dims, material, coll):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = dims
    if material:
        o.data.materials.append(material)
    for c in list(o.users_collection):
        c.objects.unlink(o)
    coll.objects.link(o)
    return o

def cyl(name, loc, radius, depth, material, coll, verts=16, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth,
                                        location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    if material:
        o.data.materials.append(material)
    for c in list(o.users_collection):
        c.objects.unlink(o)
    coll.objects.link(o)
    return o

def ball(name, loc, scale, material, coll):
    bpy.ops.mesh.primitive_uv_sphere_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    if material:
        o.data.materials.append(material)
    for c in list(o.users_collection):
        c.objects.unlink(o)
    coll.objects.link(o)
    return o

def prism_gable(name, x, thickness, y0, y1, z_base, z_ridge, material, coll):
    """Triangular gable prism centred on x, ridge over the middle of y0..y1."""
    ym = (y0 + y1) / 2
    verts = [(x - thickness / 2, y0, z_base), (x + thickness / 2, y0, z_base),
             (x + thickness / 2, y1, z_base), (x - thickness / 2, y1, z_base),
             (x - thickness / 2, ym, z_ridge), (x + thickness / 2, ym, z_ridge)]
    faces = [(0, 1, 5, 4), (3, 5, 2), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]
    faces = [(0, 1, 2, 3), (0, 4, 5, 1), (3, 2, 5, 4), (0, 3, 4), (1, 5, 2)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    if material:
        o.data.materials.append(material)
    coll.objects.link(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    o.select_set(False)
    return o

# ---------- scene ----------
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for c in list(bpy.data.collections):
    if c.name != "Collection":
        bpy.data.collections.remove(c)
SHELL = bpy.data.collections.new("SHELL"); bpy.context.scene.collection.children.link(SHELL)
EXT = bpy.data.collections.new("EXT_ONLY"); bpy.context.scene.collection.children.link(EXT)
INT = bpy.data.collections.new("INT_ONLY"); bpy.context.scene.collection.children.link(INT)
STUB = bpy.data.collections.new("INT_STUB"); bpy.context.scene.collection.children.link(STUB)

FLOOR = 0.35          # top of the stone plinth
WALL_H = 2.6
TOP = FLOOR + WALL_H  # 2.95

# plinth + floors
box("plinth", (0, 2.75, 0.175), (11.5, 6.0, 0.35), STONE, SHELL)
box("floor_clay", (-2.0, 2.75, FLOOR + 0.02), (7.0, 5.5, 0.04), CLAY_FLOOR, INT)
box("floor_plank", (3.5, 2.75, FLOOR + 0.02), (4.0, 5.5, 0.04), PLANK, INT)

# far walls (both views)
box("wall_north", (0, 5.375, FLOOR + WALL_H / 2), (11.0, 0.25, WALL_H), WHITEWASH, SHELL)
box("wall_west", (-5.375, 2.75, FLOOR + WALL_H / 2), (0.25, 5.5, WALL_H), WHITEWASH, SHELL)

# south (door) wall — full for exterior, stubs for interior; door gap x -0.6..0.6
for coll, h in [(EXT, WALL_H), (INT, 0.55)]:
    zc = FLOOR + h / 2
    box("wall_south_w", (-3.05, 0.125, zc), (4.9, 0.25, h), WHITEWASH, coll)
    box("wall_south_e", (3.05, 0.125, zc), (4.9, 0.25, h), WHITEWASH, coll)
    if coll is EXT:
        box("wall_south_lintel", (0, 0.125, (2.25 + TOP) / 2), (1.2, 0.25, TOP - 2.25), WHITEWASH, coll)
# east wall — full / stub
box("wall_east", (5.375, 2.75, FLOOR + WALL_H / 2), (0.25, 5.5, WALL_H), WHITEWASH, EXT)
box("wall_east_stub", (5.375, 2.75, FLOOR + 0.275), (0.25, 5.5, 0.55), WHITEWASH, INT)

# door leaves (closed double door, green)
box("door_l", (-0.30, 0.10, FLOOR + 0.95), (0.57, 0.07, 1.9), GREEN_DOOR, SHELL)
box("door_r", (0.30, 0.10, FLOOR + 0.95), (0.57, 0.07, 1.9), GREEN_DOOR, SHELL)

def window(cx, cy, facing, coll):
    """Window unit: frame, glass, red shutters. facing: 'S' (on south wall) or 'E' (east wall)."""
    if facing == "S":
        box("win_frame", (cx, -0.02, 1.75), (1.14, 0.10, 1.24), WOOD_DARK, coll)
        box("win_glass", (cx, 0.02, 1.75), (0.94, 0.06, 1.04), GLASS, coll)
        box("shut_l", (cx - 0.86, -0.05, 1.75), (0.5, 0.05, 1.2), RED, coll)
        box("shut_r", (cx + 0.86, -0.05, 1.75), (0.5, 0.05, 1.2), RED, coll)
        box("win_frame_in", (cx, 0.27, 1.75), (1.14, 0.06, 1.24), WOOD_DARK, coll)
    else:
        box("win_frame", (5.52, cy, 1.75), (0.10, 1.14, 1.24), WOOD_DARK, coll)
        box("win_glass", (5.48, cy, 1.75), (0.06, 0.94, 1.04), GLASS, coll)
        box("shut_l", (5.55, cy - 0.86, 1.75), (0.05, 0.5, 1.2), RED, coll)
        box("shut_r", (5.55, cy + 0.86, 1.75), (0.05, 0.5, 1.2), RED, coll)
        box("win_frame_in", (5.23, cy, 1.75), (0.06, 1.14, 1.24), WOOD_DARK, coll)

window(-3.4, 0, "S", EXT)
window(3.4, 0, "S", EXT)
window(0, 1.7, "E", EXT)
window(0, 3.9, "E", EXT)

# roof (exterior only): gable along X, pitch 32 deg, ridge over y=2.75
pitch = math.radians(32)
half = 3.25  # horizontal run from ridge to eave (incl. overhang)
slope = half / math.cos(pitch)
ridge_z = TOP + half * math.tan(pitch)
for sgn, name in [(-1, "roof_s"), (1, "roof_n")]:
    o = box(name, (0, 2.75 + sgn * half / 2, (TOP + ridge_z) / 2 + 0.05),
            (11.9, slope, 0.12), GONT, EXT)
    o.rotation_euler = (-sgn * pitch, 0, 0)
prism_gable("gable_w", -5.42, 0.24, 0.1, 5.4, TOP, ridge_z, WHITEWASH, EXT)
prism_gable("gable_e", 5.42, 0.24, 0.1, 5.4, TOP, ridge_z, WHITEWASH, EXT)
box("chimney", (2.2, 2.75, ridge_z + 0.35), (0.65, 0.65, 1.5), BRICK, EXT)
box("chimney_cap", (2.2, 2.75, ridge_z + 1.15), (0.82, 0.82, 0.12), BRICK, EXT)

# porch (exterior only)
box("porch_deck", (0, -0.85, 0.44), (2.4, 1.2, 0.18), WOOD, EXT)
box("porch_step1", (0, -1.62, 0.28), (2.0, 0.4, 0.16), WOOD, EXT)
box("porch_step2", (0, -1.95, 0.12), (2.0, 0.3, 0.12), WOOD, EXT)
cyl("porch_post_l", (-1.0, -1.35, 1.45), 0.07, 1.9, WOOD_DARK, EXT)
cyl("porch_post_r", (1.0, -1.35, 1.45), 0.07, 1.9, WOOD_DARK, EXT)
o = box("porch_roof", (0, -0.92, 2.52), (2.6, 1.45, 0.08), GONT, EXT)
o.rotation_euler = (math.radians(14), 0, 0)

# korohva: pole + crimson banner with a gold cross (exterior only)
cyl("korohva_pole", (1.75, -0.95, 1.95), 0.035, 3.6, WOOD_DARK, EXT, rot=(math.radians(5), 0, 0))
cyl("korohva_bar", (1.83, -1.02, 3.45), 0.025, 0.85, WOOD_DARK, EXT, rot=(0, math.radians(90), 0))
box("korohva_banner", (1.83, -1.04, 2.85), (0.78, 0.03, 1.05), CRIMSON, EXT)
box("korohva_cross_v", (1.83, -1.07, 2.90), (0.09, 0.02, 0.55), GOLD, EXT)
box("korohva_cross_h", (1.83, -1.07, 3.00), (0.34, 0.02, 0.09), GOLD, EXT)

# partitions (interior): siny x -1.5..1.5, doorway gap y 2.0..2.95 in each
PARTITION_OBJS = []
for px in (-1.5, 1.5):
    PARTITION_OBJS.append(box("partition_a", (px, 1.125, FLOOR + WALL_H / 2), (0.18, 1.75, WALL_H), WHITEWASH_IN, INT))
    PARTITION_OBJS.append(box("partition_b", (px, 4.10, FLOOR + WALL_H / 2), (0.18, 2.30, WALL_H), WHITEWASH_IN, INT))
    PARTITION_OBJS.append(box("partition_lintel", (px, 2.475, (2.30 + TOP) / 2), (0.18, 0.95, TOP - 2.30), WHITEWASH_IN, INT))
    # knee-high stub variant (Request 5b): same runs, doorway left as a notch
    box("partition_stub_a", (px, 1.125, FLOOR + 0.275), (0.18, 1.75, 0.55), WHITEWASH_IN, STUB)
    box("partition_stub_b", (px, 4.10, FLOOR + 0.275), (0.18, 2.30, 0.55), WHITEWASH_IN, STUB)

# ---- furniture: west room (working khata) ----
box("pich_base", (-4.3, 4.55, FLOOR + 0.575), (1.9, 1.3, 1.15), PICH, INT)
box("pich_top", (-4.3, 4.55, FLOOR + 1.20), (2.0, 1.4, 0.10), PICH, INT)
box("pich_shoulder", (-4.3, 4.60, FLOOR + 1.50), (1.45, 0.95, 0.50), PICH, INT)
box("pich_mouth", (-4.3, 3.86, FLOOR + 0.55), (0.55, 0.10, 0.50), DARK, INT)
cyl("borshch_pot", (-4.3, 3.78, FLOOR + 0.48), 0.16, 0.22, DARK, INT)
ball("palianytsia", (-4.3, 4.55, FLOOR + 1.82), (0.30, 0.24, 0.11), TAN, INT)
box("pil", (-2.72, 4.85, FLOOR + 0.225), (2.1, 1.05, 0.45), WOOD, INT)
box("pil_pillow", (-3.52, 4.85, FLOOR + 0.52), (0.5, 0.6, 0.14), CREAM, INT)
box("pil_blanket", (-2.52, 4.85, FLOOR + 0.50), (1.25, 0.95, 0.09), mat("blanket_grey", (0.52, 0.47, 0.40)), INT)
box("bench", (-3.6, 0.60, FLOOR + 0.225), (1.7, 0.35, 0.45), WOOD, INT)
box("trough", (-4.2, 1.55, FLOOR + 0.175), (1.15, 0.5, 0.35), WOOD_DARK, INT)
ball("dough", (-4.35, 1.55, FLOOR + 0.38), (0.42, 0.20, 0.10), CREAM, INT)
box("trough_cloth", (-3.95, 1.55, FLOOR + 0.40), (0.55, 0.42, 0.05), CREAM, INT)

# ---- furniture: siny ----
cyl("barrel", (0.55, 4.65, FLOOR + 0.45), 0.33, 0.9, WOOD, INT)
cyl("barrel_ring1", (0.55, 4.65, FLOOR + 0.20), 0.345, 0.05, DARK, INT)
cyl("barrel_ring2", (0.55, 4.65, FLOOR + 0.70), 0.345, 0.05, DARK, INT)
for dx in (-0.24, 0.24):
    o = box("ladder_rail", (-0.55 + dx, 5.02, FLOOR + 1.25), (0.06, 0.05, 2.7), WOOD_DARK, INT)
    o.rotation_euler = (math.radians(-10), 0, 0)
for i in range(5):
    z = FLOOR + 0.45 + i * 0.42
    y = 5.02 - (z - FLOOR - 1.25) * math.tan(math.radians(-10)) * -1
    cyl("ladder_rung", (-0.55, 5.06 - i * 0.075, z), 0.022, 0.44, WOOD_DARK, INT, rot=(0, 0, math.radians(90)))
cyl("saddle_peg", (1.36, 3.4, FLOOR + 1.55), 0.03, 0.35, WOOD_DARK, INT, rot=(0, math.radians(90), 0))
box("saddle", (1.22, 3.4, FLOOR + 1.62), (0.28, 0.55, 0.22), BROWN, INT)

# ---- siny details: beams, hatch, stores, everyday things ----
HERBS = mat("herbs_dried", (0.35, 0.42, 0.22))
SACK = mat("sack_cloth", (0.60, 0.50, 0.36))
RUNNER = mat("runner_rug", (0.45, 0.28, 0.20))
for bx in (-0.8, 0.8):
    box("siny_beam", (bx, 2.75, TOP + 0.10), (0.18, 5.5, 0.22), WOOD_DARK, INT)
box("loft_hatch", (-0.55, 4.90, TOP - 0.03), (1.0, 0.8, 0.06), WOOD_DARK, INT)
for i, hy in enumerate((1.1, 1.9, 2.7)):
    cyl("herb_string", (-0.8, hy, TOP - 0.22), 0.008, 0.35, WOOD_DARK, INT)
    ball("herb_bundle", (-0.8, hy, TOP - 0.52), (0.09, 0.09, 0.17), HERBS, INT)
for i in range(3):
    ball("garlic", (0.8, 3.55, TOP - 0.30 - i * 0.16), (0.055, 0.055, 0.07), CREAM, INT)
cyl("barrel_small", (-0.78, 4.72, FLOOR + 0.33), 0.26, 0.65, WOOD, INT)
box("siny_bench", (-1.28, 1.15, FLOOR + 0.21), (0.32, 1.25, 0.42), WOOD, INT)
cyl("bucket", (0.98, 0.58, FLOOR + 0.16), 0.16, 0.32, WOOD_DARK, INT)
for i, (lx, lz) in enumerate(((-1.12, 0.10), (-0.92, 0.10), (-1.02, 0.24))):
    cyl("firewood", (lx, 4.30, FLOOR + lz), 0.065, 0.55, WOOD, INT, rot=(math.radians(90), 0, 0))
ball("grain_sack1", (1.14, 4.78, FLOOR + 0.30), (0.27, 0.27, 0.34), SACK, INT)
ball("grain_sack2", (0.70, 5.02, FLOOR + 0.26), (0.24, 0.24, 0.30), SACK, INT)
box("siny_runner", (0, 2.05, FLOOR + 0.045), (1.05, 2.7, 0.025), RUNNER, INT)
o = cyl("broom_handle", (-0.92, 0.42, FLOOR + 0.62), 0.02, 1.25, WOOD, INT)
o.rotation_euler = (math.radians(10), 0, math.radians(6))
ball("broom_head", (-0.99, 0.34, FLOOR + 0.10), (0.09, 0.09, 0.13), TAN, INT)
box("lantern", (1.44, 2.45, FLOOR + 1.95), (0.11, 0.11, 0.20), DARK, INT)
cyl("lantern_candle", (1.44, 2.45, FLOOR + 1.95), 0.02, 0.10, CREAM, INT)

# ---- furniture: svitlytsia ----
box("kylym", (3.5, 2.6, FLOOR + 0.055), (2.3, 1.5, 0.03), CRIMSON, INT)
box("weapon_cloth", (3.5, 5.20, FLOOR + 1.65), (2.5, 0.05, 1.35), CRIMSON, INT)
for i, dz in enumerate((2.05, 1.78)):
    o = box("sabre", (3.25 + i * 0.5, 5.16, FLOOR + dz), (0.95, 0.03, 0.07), STEEL, INT)
    o.rotation_euler = (0, 0, math.radians(-4))
for i, dx in enumerate((-0.55, 0.55)):
    box("pistol", (3.5 + dx, 5.16, FLOOR + 1.28), (0.30, 0.05, 0.13), DARK, INT)
o = box("musket", (5.18, 4.35, FLOOR + 0.85), (0.05, 0.09, 1.45), WOOD_DARK, INT)
o.rotation_euler = (math.radians(14), 0, 0)
box("skrynia", (4.55, 4.80, FLOOR + 0.31), (1.25, 0.55, 0.62), RED, INT)
box("skrynia_lid", (4.55, 4.80, FLOOR + 0.65), (1.31, 0.60, 0.07), RED, INT)
box("kuntush", (4.55, 4.80, FLOOR + 0.78), (0.72, 0.40, 0.18), mat("kuntush_dark", (0.16, 0.20, 0.16)), INT)
box("table_top", (3.3, 1.30, FLOOR + 0.73), (1.5, 0.85, 0.06), WOOD, INT)
for dx, dy in [(-0.65, -0.32), (0.65, -0.32), (-0.65, 0.32), (0.65, 0.32)]:
    box("table_leg", (3.3 + dx, 1.30 + dy, FLOOR + 0.35), (0.08, 0.08, 0.70), WOOD_DARK, INT)
o = cyl("pernach_haft", (3.05, 1.25, FLOOR + 0.80), 0.022, 0.55, WOOD_DARK, INT, rot=(math.radians(90), 0, math.radians(20)))
ball("pernach_head", (2.88, 1.44, FLOOR + 0.80), (0.07, 0.07, 0.07), BRASS, INT)
box("paper1", (3.55, 1.15, FLOOR + 0.775), (0.30, 0.22, 0.012), CREAM, INT)
box("paper2", (3.75, 1.50, FLOOR + 0.775), (0.26, 0.20, 0.012), CREAM, INT)
cyl("inkwell", (3.50, 1.62, FLOOR + 0.81), 0.05, 0.09, DARK, INT)
cyl("candlestick", (2.80, 1.55, FLOOR + 0.86), 0.035, 0.20, BRASS, INT)
cyl("candle", (2.80, 1.55, FLOOR + 1.02), 0.018, 0.12, CREAM, INT)
box("chair_seat", (4.35, 1.30, FLOOR + 0.46), (0.45, 0.45, 0.05), WOOD, INT)
box("chair_base", (4.35, 1.30, FLOOR + 0.22), (0.40, 0.40, 0.44), WOOD_DARK, INT)
box("chair_back", (4.60, 1.30, FLOOR + 0.85), (0.05, 0.45, 0.75), WOOD, INT)

# ---------- camera + render ----------
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "MATERIAL"
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.display.shading.cavity_type = "WORLD"
scene.render.film_transparent = True
scene.render.resolution_x = 2048
scene.render.resolution_y = 1440
scene.render.image_settings.file_format = "PNG"

cam = bpy.data.cameras.new("cam")
cam.type = "ORTHO"
cam.ortho_scale = 14.5
cam_obj = bpy.data.objects.new("cam", cam)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

target = bpy.data.objects.new("target", None)
target.location = (0, 2.6, 1.2)
bpy.context.scene.collection.objects.link(target)
con = cam_obj.constraints.new("TRACK_TO")
con.target = target
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"

import mathutils
el = math.radians(40)
az = math.radians(45)
d = 30.0
cam_obj.location = (target.location.x + d * math.cos(el) * math.sin(az),
                    target.location.y - d * math.cos(el) * math.cos(az),
                    target.location.z + d * math.sin(el))

def render(name, show_ext, stubs=False):
    EXT.hide_render = not show_ext
    INT.hide_render = show_ext
    STUB.hide_render = not stubs
    for o in PARTITION_OBJS:
        o.hide_render = stubs
    scene.render.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)
    print("rendered", name)

render("preview_exterior.png", True)
render("preview_interior.png", False)
render("preview_interior_stubs.png", False, stubs=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "otaman_khata.blend"))
print("DONE")
