shader_type canvas_item;
render_mode unshaded;

uniform sampler2D screen_texture : hint_screen_texture, repeat_disable, filter_nearest;
uniform float pixel_block : hint_range(1.0, 4.0, 1.0) = 3.0;
uniform float contrast : hint_range(0.8, 1.35) = 1.06;
uniform float saturation : hint_range(0.0, 1.4) = 0.90;
uniform float palette_steps : hint_range(12.0, 64.0, 1.0) = 48.0;
uniform float dither_strength : hint_range(0.0, 1.0) = 0.10;
uniform float vignette_strength : hint_range(0.0, 0.5) = 0.10;
uniform vec3 shadow_tint = vec3(0.035, 0.075, 0.095);
uniform vec3 highlight_tint = vec3(0.92, 0.78, 0.58);

float stable_dither(vec2 p) {
	return fract(52.9829189 * fract(dot(floor(p), vec2(0.06711056, 0.00583715))));
}

void fragment() {
	vec2 tex_size = vec2(textureSize(screen_texture, 0));
	vec2 pixel_coord = SCREEN_UV * tex_size;
	vec2 snapped = (floor(pixel_coord / pixel_block) * pixel_block + pixel_block * 0.5) / tex_size;
	vec3 c = texture(screen_texture, snapped).rgb;

	float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
	c = mix(vec3(luma), c, saturation);
	c = (c - 0.5) * contrast + 0.5;

	float shadow_mix = 1.0 - smoothstep(0.08, 0.46, luma);
	float highlight_mix = smoothstep(0.52, 0.92, luma);
	c = mix(c, c * (vec3(0.78) + shadow_tint * 2.2), shadow_mix * 0.24);
	c = mix(c, c * highlight_tint * 1.08, highlight_mix * 0.12);

	float dither = (stable_dither(pixel_coord / pixel_block) - 0.5) * dither_strength;
	c = floor(clamp(c, 0.0, 1.0) * palette_steps + dither) / palette_steps;

	vec2 centered = SCREEN_UV * 2.0 - 1.0;
	float vig = smoothstep(0.52, 1.35, dot(centered, centered));
	c *= 1.0 - vig * vignette_strength;

	COLOR = vec4(clamp(c, 0.0, 1.0), 1.0);
}
