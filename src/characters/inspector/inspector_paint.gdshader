shader_type canvas_item;

uniform float grain_strength : hint_range(0.0, 0.15) = 0.045;
uniform float volume_strength : hint_range(0.0, 0.25) = 0.10;
uniform float rim_strength : hint_range(0.0, 0.35) = 0.14;
uniform vec4 cool_tint = vec4(0.48, 0.66, 0.72, 1.0);
uniform vec4 warm_tint = vec4(0.78, 0.54, 0.30, 1.0);

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

void fragment() {
	vec4 source = texture(TEXTURE, UV);
	vec4 vertex_modulate = COLOR;

	if (source.a <= 0.001) {
		COLOR = vec4(0.0);
	} else {
		// Low-frequency illustrated volume, deliberately restrained so animation
		// frames keep their authored palette instead of looking shader-heavy.
		float upper_light = 1.0 - smoothstep(0.08, 1.0, UV.y);
		float side_light = 1.0 - smoothstep(0.12, 0.82, UV.x);
		float volume = (upper_light * 0.65 + side_light * 0.35 - 0.48) * volume_strength;
		vec3 graded = source.rgb + vec3(volume);

		// Stable fabric/paper grain in texture space. It does not crawl with TIME.
		vec2 safe_pixel = max(TEXTURE_PIXEL_SIZE, vec2(0.0001));
		vec2 grain_cell = floor(UV / safe_pixel * 0.52);
		float grain = (hash21(grain_cell) - 0.5) * grain_strength;
		graded += vec3(grain);

		// Subtle two-temperature paint variation: cool upper planes, warmer lower
		// coat/boots. This helps the flat procedural base sit in the room lighting.
		graded = mix(graded, graded * cool_tint.rgb, upper_light * 0.07);
		graded = mix(graded, graded * warm_tint.rgb, smoothstep(0.48, 0.96, UV.y) * 0.055);

		// Find the interior silhouette edge from neighbouring alpha samples and
		// lift it slightly; this is intentionally an inner rim, not a neon outline.
		vec2 px = TEXTURE_PIXEL_SIZE;
		float min_alpha = min(
			min(texture(TEXTURE, UV + vec2(px.x, 0.0)).a, texture(TEXTURE, UV - vec2(px.x, 0.0)).a),
			min(texture(TEXTURE, UV + vec2(0.0, px.y)).a, texture(TEXTURE, UV - vec2(0.0, px.y)).a)
		);
		float inner_edge = clamp(source.a - min_alpha, 0.0, 1.0);
		vec3 rim_color = mix(cool_tint.rgb, warm_tint.rgb, UV.y);
		graded = mix(graded, rim_color, inner_edge * rim_strength);

		COLOR = vec4(clamp(graded, vec3(0.0), vec3(1.0)), source.a) * vertex_modulate;
	}
}
