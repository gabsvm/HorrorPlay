shader_type canvas_item;

uniform float vignette_intensity = 0.4;
uniform float vignette_opacity : hint_range(0.0, 1.0) = 0.5;
uniform vec4 vignette_rgb : source_color = vec4(0.0, 0.0, 0.0, 1.0);

uniform float grain_amount : hint_range(0.0, 1.0) = 0.05;
uniform float grain_size = 1.0;

uniform float desaturation : hint_range(0.0, 1.0) = 0.2;
uniform vec4 tint_color : source_color = vec4(0.9, 0.95, 1.0, 1.0);
uniform float tint_strength : hint_range(0.0, 1.0) = 0.1;

uniform sampler2D screen_texture : hint_screen_texture, filter_nearest;

// Pseudo-random noise function
float random(vec2 uv) {
    return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void fragment() {
    vec4 tex_color = texture(screen_texture, SCREEN_UV);
    
    // Vignette
    vec2 uv = UV;
    uv *=  1.0 - uv.yx;   //vec2(1.0)- uv.yx; -> 1.-u.yx; Thanks to this, we only need one multiply
    float vig = uv.x * uv.y * 15.0; // multiply with sth for intensity
    vig = pow(vig, vignette_intensity);
    
    // Desaturation
    float luminance = dot(tex_color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 desaturated = mix(tex_color.rgb, vec3(luminance), desaturation);
    
    // Tint
    vec3 tinted = mix(desaturated, tint_color.rgb, tint_strength);
    
    // Apply vignette
    vec3 final_color = mix(vignette_rgb.rgb, tinted, vig * vignette_opacity + (1.0 - vignette_opacity));
    
    // Grain
    vec2 grain_uv = SCREEN_UV / grain_size;
    float noise = (random(grain_uv + TIME) - 0.5) * grain_amount;
    final_color += noise;
    
    COLOR = vec4(final_color, 1.0);
}
