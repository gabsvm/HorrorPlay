shader_type canvas_item;
render_mode unshaded;

uniform sampler2D screen_texture : hint_screen_texture, repeat_disable, filter_nearest;
uniform float pixel_block : hint_range(1.0, 4.0, 1.0) = 2.0;
uniform float contrast : hint_range(0.8, 1.35) = 1.10;
uniform float saturation : hint_range(0.0, 1.4) = 0.88;
uniform float palette_steps : hint_range(12.0, 64.0, 1.0) = 36.0;
uniform float dither_strength : hint_range(0.0, 1.0) = 0.22;
uniform float vignette_strength : hint_range(0.0, 0.5) = 0.16;
uniform vec3 shadow_tint = vec3(0.035, 0.075, 0.095);
uniform vec3 highlight_tint = vec3(0.92, 0.78, 0.58);

float bayer4(vec2 p) {
	ivec2 q = ivec2(mod(floor(p), 4.0));
	int x = q.x;
	int y = q.y;
	int i = x + y * 4;
	float values[16] = float[16](
		0.0, 8.0, 2.0, 10.0,
		12.0, 4.0, 14.0, 6.0,
		3.0, 11.0, 1.0, 9.0,
		15.0, 7.0, 13.0, 5.0
	);
	return values[i] / 16.0;
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

	float dither = (bayer4(pixel_coord / pixel_block) - 0.5) * dither_strength;
	c = floor(clamp(c, 0.0, 1.0) * palette_steps + dither) / palette_steps;

	vec2 centered = SCREEN_UV * 2.0 - 1.0;
	float vig = smoothstep(0.52, 1.35, dot(centered, centered));
	c *= 1.0 - vig * vignette_strength;

	COLOR = vec4(clamp(c, 0.0, 1.0), 1.0);
}
