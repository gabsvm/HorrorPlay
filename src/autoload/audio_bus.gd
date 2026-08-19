# res://src/autoload/audio_bus.gd
extends Node

@onready var music_players: Array[AudioStreamPlayer] = [AudioStreamPlayer.new(), AudioStreamPlayer.new()]
@onready var ambience_players: Array[AudioStreamPlayer] = [AudioStreamPlayer.new(), AudioStreamPlayer.new()]

var active_player_idx: int = 0
var active_ambience_idx: int = 0
var current_ambience_profile: String = ""
var horror_stinger_stream: AudioStreamWAV
var ambience_cache: Dictionary = {}
var footstep_cache: Dictionary = {}
var ambience_tween: Tween = null

const AMBIENCE_PROFILES := ["office", "streets", "tavern", "docks", "boathouse", "reef"]
const FOOTSTEP_SURFACES := ["wood", "stone", "wet_wood", "metal"]

func _ready() -> void:
	for mp in music_players:
		mp.bus = _get_safe_bus_name("Music")
		add_child(mp)
	for ap in ambience_players:
		ap.bus = _get_safe_bus_name("SFX")
		ap.volume_db = -80.0
		add_child(ap)
	horror_stinger_stream = _build_horror_stinger()
	for profile in AMBIENCE_PROFILES:
		ambience_cache[profile] = _build_ambience_loop(profile)
	for surface in FOOTSTEP_SURFACES:
		footstep_cache[surface] = _build_footstep(surface)

func play_music(stream: AudioStream, fade_time: float = 1.5) -> void:
	if not stream:
		return
	var next_idx = (active_player_idx + 1) % 2
	var current_player = music_players[active_player_idx]
	var next_player = music_players[next_idx]
	if current_player.playing and current_player.stream == stream:
		return
	next_player.stream = stream
	next_player.volume_db = -80.0
	next_player.play()
	var tween = create_tween().set_parallel(true)
	tween.tween_property(current_player, "volume_db", -80.0, fade_time)
	tween.tween_property(next_player, "volume_db", 0.0, fade_time)
	await tween.finished
	current_player.stop()
	active_player_idx = next_idx

func play_ambience(profile: String, fade_time: float = 1.25) -> void:
	if profile.is_empty():
		stop_ambience(fade_time)
		return
	if profile == current_ambience_profile and ambience_players[active_ambience_idx].playing:
		return
	if not ambience_cache.has(profile):
		push_warning("AudioBus: unknown ambience profile '%s'" % profile)
		return
	if ambience_tween and ambience_tween.is_valid():
		ambience_tween.kill()
	var next_idx = (active_ambience_idx + 1) % 2
	var current_player = ambience_players[active_ambience_idx]
	var next_player = ambience_players[next_idx]
	next_player.stream = ambience_cache[profile]
	next_player.volume_db = -80.0
	next_player.pitch_scale = 1.0
	next_player.play()
	ambience_tween = create_tween().set_parallel(true)
	ambience_tween.tween_property(current_player, "volume_db", -80.0, fade_time)
	ambience_tween.tween_property(next_player, "volume_db", _ambience_target_db(profile), fade_time)
	await ambience_tween.finished
	current_player.stop()
	active_ambience_idx = next_idx
	current_ambience_profile = profile

func stop_ambience(fade_time: float = 0.8) -> void:
	current_ambience_profile = ""
	if ambience_tween and ambience_tween.is_valid():
		ambience_tween.kill()
	var current_player = ambience_players[active_ambience_idx]
	if not current_player.playing:
		return
	ambience_tween = create_tween()
	ambience_tween.tween_property(current_player, "volume_db", -80.0, fade_time)
	await ambience_tween.finished
	current_player.stop()

func play_sfx(stream: AudioStream, volume_db: float = 0.0, pitch_scale: float = 1.0) -> void:
	if not stream:
		return
	var sfx_player = AudioStreamPlayer.new()
	sfx_player.stream = stream
	sfx_player.bus = _get_safe_bus_name("SFX")
	sfx_player.volume_db = volume_db
	sfx_player.pitch_scale = pitch_scale
	add_child(sfx_player)
	sfx_player.play()
	sfx_player.finished.connect(func(): sfx_player.queue_free())

func play_footstep(surface: String = "wood", intensity: float = 1.0) -> void:
	if not footstep_cache.has(surface):
		surface = "wood"
	var base_volume = -13.5
	if surface == "stone": base_volume = -12.5
	elif surface == "wet_wood": base_volume = -11.8
	elif surface == "metal": base_volume = -14.0
	play_sfx(footstep_cache[surface], base_volume + lerp(-2.0, 1.0, clamp(intensity, 0.0, 1.0)), randf_range(0.92, 1.08))

func play_horror_stinger(intensity: float = 1.0) -> void:
	if not horror_stinger_stream:
		return
	intensity = clamp(intensity, 0.2, 1.5)
	var volume = lerp(-8.0, -1.0, clamp(intensity, 0.0, 1.0))
	var pitch = lerp(0.9, 1.05, clamp(intensity - 0.3, 0.0, 1.0))
	play_sfx(horror_stinger_stream, volume, pitch)

func _ambience_target_db(profile: String) -> float:
	match profile:
		"office": return -22.0
		"streets": return -14.0
		"tavern": return -18.0
		"docks": return -13.0
		"boathouse": return -20.0
		"reef": return -12.0
		_: return -18.0

func _build_footstep(surface: String) -> AudioStreamWAV:
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = 11025
	stream.stereo = false
	var duration := 0.14
	var samples := int(stream.mix_rate * duration)
	var data = PackedByteArray()
	data.resize(samples * 2)
	var rng = RandomNumberGenerator.new()
	rng.seed = hash("step_" + surface) & 0x7fffffff
	var filtered := 0.0
	for i in range(samples):
		var t = float(i) / float(stream.mix_rate)
		var env = pow(max(0.0, 1.0 - t / duration), 3.2)
		var noise = rng.randf_range(-1.0, 1.0)
		filtered = lerp(filtered, noise, 0.22 if surface != "stone" else 0.5)
		var value := 0.0
		match surface:
			"stone": value = filtered * 0.5 + sin(TAU * 118.0 * t) * 0.18
			"wet_wood": value = filtered * 0.38 + sin(TAU * 63.0 * t) * 0.2 + noise * 0.08
			"metal": value = filtered * 0.25 + sin(TAU * 205.0 * t) * 0.24
			_: value = filtered * 0.4 + sin(TAU * 74.0 * t) * 0.15
		var sample = int(clamp(value * env, -1.0, 1.0) * 32767.0)
		data[i * 2] = sample & 0xff
		data[i * 2 + 1] = (sample >> 8) & 0xff
	stream.data = data
	return stream

func _build_ambience_loop(profile: String) -> AudioStreamWAV:
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = 11025
	stream.stereo = true
	var duration := 7.0
	var frames := int(stream.mix_rate * duration)
	stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	stream.loop_begin = 0
	stream.loop_end = frames
	var data = PackedByteArray()
	data.resize(frames * 4)
	var rng = RandomNumberGenerator.new()
	rng.seed = hash(profile) & 0x7fffffff
	var slow_l := 0.0
	var slow_r := 0.0
	var rain_env := 0.0
	for i in range(frames):
		var t = float(i) / float(stream.mix_rate)
		var raw_l = rng.randf_range(-1.0, 1.0)
		var raw_r = rng.randf_range(-1.0, 1.0)
		slow_l = lerp(slow_l, raw_l, 0.018)
		slow_r = lerp(slow_r, raw_r, 0.018)
		var left := 0.0
		var right := 0.0
		match profile:
			"office":
				var room_hum = sin(TAU * 54.0 * t) * 0.018
				left = raw_l * 0.06 + slow_l * 0.12 + room_hum + sin(TAU * 0.12 * t) * slow_l * 0.08
				right = raw_r * 0.05 + slow_r * 0.1 + room_hum
			"streets":
				if rng.randf() < 0.012: rain_env = rng.randf_range(0.35, 0.85)
				rain_env *= 0.985
				left = raw_l * (0.12 + rain_env * 0.12) + slow_l * 0.22 + sin(TAU * 0.08 * t) * 0.05
				right = raw_r * (0.11 + rain_env * 0.1) + slow_r * 0.2
			"tavern":
				left = slow_l * 0.08 + sin(TAU * 86.0 * t + sin(t * 1.7)) * 0.012 + raw_l * 0.025 + sin(TAU * 43.0 * t) * 0.014
				right = slow_r * 0.07 + raw_r * 0.022 + sin(TAU * 47.0 * t) * 0.012
			"docks":
				left = sin(TAU * 0.19 * t) * 0.13 + sin(TAU * 0.31 * t) * 0.06 + slow_l * 0.2 + raw_l * 0.055
				right = sin(TAU * 0.17 * t + 1.2) * 0.12 + slow_r * 0.18 + raw_r * 0.05
			"boathouse":
				var timber = sin(TAU * 0.41 * t) * slow_l * 0.11
				var hum = sin(TAU * 48.0 * t) * 0.018
				left = slow_l * 0.1 + timber + hum
				right = slow_r * 0.09 - timber + hum
			"reef":
				var sub = sin(TAU * 31.0 * t + sin(t * 0.27)) * 0.035
				left = sin(TAU * 0.13 * t) * 0.2 + sin(TAU * 0.21 * t + 2.0) * 0.09 + slow_l * 0.15 + sub
				right = sin(TAU * 0.11 * t + 1.0) * 0.18 + slow_r * 0.15 + sub
		var seam = min(1.0, min(t / 0.08, (duration - t) / 0.08))
		_write_pcm16_stereo(data, i, clamp(left * seam, -0.9, 0.9), clamp(right * seam, -0.9, 0.9))
	stream.data = data
	return stream

func _write_pcm16_stereo(data: PackedByteArray, frame: int, left: float, right: float) -> void:
	var l = int(clamp(left, -1.0, 1.0) * 32767.0)
	var r = int(clamp(right, -1.0, 1.0) * 32767.0)
	var offset = frame * 4
	data[offset] = l & 0xff
	data[offset + 1] = (l >> 8) & 0xff
	data[offset + 2] = r & 0xff
	data[offset + 3] = (r >> 8) & 0xff

func _build_horror_stinger() -> AudioStreamWAV:
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = 22050
	stream.stereo = false
	var duration = 1.15
	var sample_count = int(stream.mix_rate * duration)
	var data = PackedByteArray()
	data.resize(sample_count * 2)
	for i in range(sample_count):
		var t = float(i) / float(stream.mix_rate)
		var attack = min(1.0, t / 0.025)
		var decay = exp(-3.1 * t)
		var envelope = attack * decay
		var sub = sin(TAU * 43.0 * t) * 0.68
		var metal = sin(TAU * (117.0 + 28.0 * t) * t) * 0.22
		var dissonance = sin(TAU * 71.0 * t + sin(t * 19.0) * 1.7) * 0.18
		var noise = (randf() * 2.0 - 1.0) * max(0.0, 0.12 - t * 0.09)
		var sample = int(clamp((sub + metal + dissonance + noise) * envelope, -1.0, 1.0) * 32767.0)
		data[i * 2] = sample & 0xff
		data[i * 2 + 1] = (sample >> 8) & 0xff
	stream.data = data
	return stream

func _get_safe_bus_name(bus_name: String) -> StringName:
	for i in AudioServer.bus_count:
		if AudioServer.get_bus_name(i) == bus_name:
			return StringName(bus_name)
	return &"Master"
