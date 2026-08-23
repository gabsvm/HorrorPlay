"""
Generate inspector_frames.tres for Godot 4
"""
import os

ANIMATIONS = [
    ("idle", 6, 6.0, True),
    ("idle_uneasy", 6, 6.0, True),
    ("walk", 8, 9.0, True),
    ("turn", 4, 12.0, False),
    ("inspect", 6, 6.0, False),
    ("use_mid", 6, 7.0, False),
    ("pickup_low", 6, 6.0, False),
    ("react", 6, 8.0, False),
    ("hide_enter", 4, 8.0, False),
    ("hide_hold", 4, 4.0, True),
    ("hide_exit", 4, 8.0, False),
]

def generate_sprite_frames_tres(tres_path):
    ext_resources = []
    anim_blocks = []
    
    res_index = 1
    for anim_name, frame_count, speed, loop in ANIMATIONS:
        frame_entries = []
        for i in range(1, frame_count + 1):
            res_id = f"{res_index}_{anim_name}_{i}"
            rel_path = f"res://assets/images/characters/inspector_production/{anim_name}/inspector_{anim_name}_{i:02d}.png"
            ext_resources.append(f'[ext_resource type="Texture2D" path="{rel_path}" id="{res_id}"]')
            frame_entries.append(f'{{\n"duration": 1.0,\n"texture": ExtResource("{res_id}")\n}}')
            res_index += 1
        
        frames_joined = ",\n".join(frame_entries)
        loop_str = "true" if loop else "false"
        anim_blocks.append(f'''{{
"frames": [
{frames_joined}
],
"loop": {loop_str},
"name": &"{anim_name}",
"speed": {speed}
}}''')

    ext_res_str = "\n".join(ext_resources)
    anims_str = ",\n".join(anim_blocks)

    tres_content = f'''[gd_resource type="SpriteFrames" load_steps={res_index} format=3 uid="uid://inspector_sprite_frames"]

{ext_res_str}

[resource]
animations = [
{anims_str}
]
'''
    with open(tres_path, "w", encoding="utf-8") as f:
        f.write(tres_content)
    print(f"Generated SpriteFrames at {tres_path} with {res_index - 1} frames.")

if __name__ == "__main__":
    generate_sprite_frames_tres("src/characters/inspector/inspector_frames.tres")
