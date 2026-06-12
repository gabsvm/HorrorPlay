shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform float horizon_y : hint_range(0.0, 1.0) = 0.7407;
uniform float reflection_strength : hint_range(0.0, 1.0) = 0.35;
uniform float distortion_strength : hint_range(0.0, 0.1) = 0.005;
uniform float wave_speed : hint_range(0.0, 10.0) = 3.0;
uniform float wave_frequency : hint_range(0.0, 100.0) = 40.0;
uniform vec4 wet_tint : source_color = vec4(0.05, 0.08, 0.15, 1.0);

void fragment() {
    vec2 screen_uv = SCREEN_UV;
    
    // Only reflect below the horizon line
    if (screen_uv.y > horizon_y) {
        // Simple and super-lightweight wave distortion using sine waves
        float wave = sin(screen_uv.y * wave_frequency - TIME * wave_speed) * cos(screen_uv.x * wave_frequency * 0.5 + TIME * wave_speed * 0.7);
        float dist_x = wave * distortion_strength;
        
        // Calculate the mirrored Y position
        float mirrored_y = horizon_y - (screen_uv.y - horizon_y);
        
        // Ensure we don't sample outside bounds
        mirrored_y = clamp(mirrored_y, 0.0, 1.0);
        
        // Sample screen texture at mirrored position with distortion
        vec2 mirrored_uv = vec2(screen_uv.x + dist_x, mirrored_y);
        vec4 reflection_color = texture(screen_texture, mirrored_uv);
        
        // Mix the original background (what's drawn on this ColorRect/Sprite) with reflection and wet tint
        vec4 floor_color = texture(TEXTURE, UV);
        
        // Blend reflection and wet floor tint
        vec4 final_reflection = mix(floor_color, reflection_color, reflection_strength);
        COLOR = mix(final_reflection, wet_tint, 0.15);
    } else {
        COLOR = texture(TEXTURE, UV);
    }
}
