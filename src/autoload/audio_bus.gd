# res://src/autoload/audio_bus.gd
extends Node

@onready var music_players: Array[AudioStreamPlayer] = [
	AudioStreamPlayer.new(),
	AudioStreamPlayer.new()
]
var active_player_idx: int = 0
var horror_stinger_stream: AudioStreamWAV

func _ready() -> void:
	for mp in music_players:
		mp.bus = _get_safe_bus_name("Music")
		add_child(mp)
	horror_stinger_stream = _build_horror_stinger()

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

func play_horror_stinger(intensity: float = 1.0) -> void:
	if not horror_stinger_stream:
		return
	intensity = clamp(intensity, 0.2, 1.5)
	var volume = lerp(-8.0, -1.0, clamp(intensity, 0.0, 1.0))
	var pitch = lerp(0.9, 1.05, clamp(intensity - 0.3, 0.0, 1.0))
	play_sfx(horror_stinger_stream, volume, pitch)

func _build_horror_stinger() -> AudioStreamWAV:
	# Cached once at boot: a low metallic impact with a short dissonant tail.
	# It is intentionally used as punctuation, not as a substitute for the future
	# authored ambience/music pass.
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
		var value = clamp((sub + metal + dissonance + noise) * envelope, -1.0, 1.0)
		var sample = int(value * 32767.0)
		data[i * 2] = sample & 0xff
		data[i * 2 + 1] = (sample >> 8) & 0xff
	
	stream.data = data
	return stream

func _get_safe_bus_name(bus_name: String) -> StringName:
	for i in AudioServer.bus_count:
		if AudioServer.get_bus_name(i) == bus_name:
			return StringName(bus_name)
	return &"Master"
