# res://src/autoload/audio_bus.gd
extends Node

@onready var music_players: Array[AudioStreamPlayer] = [
	AudioStreamPlayer.new(),
	AudioStreamPlayer.new()
]
var active_player_idx: int = 0

func _ready() -> void:
	for mp in music_players:
		mp.bus = _get_safe_bus_name("Music")
		add_child(mp)

func play_music(stream: AudioStream, fade_time: float = 1.5) -> void:
	if not stream:
		return
		
	var next_idx = (active_player_idx + 1) % 2
	var current_player = music_players[active_player_idx]
	var next_player = music_players[next_idx]
	
	# If the same stream is already playing on the active player, do nothing
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

func play_sfx(stream: AudioStream) -> void:
	if not stream:
		return
	var sfx_player = AudioStreamPlayer.new()
	sfx_player.stream = stream
	sfx_player.bus = _get_safe_bus_name("SFX")
	add_child(sfx_player)
	sfx_player.play()
	sfx_player.finished.connect(func(): sfx_player.queue_free())

func _get_safe_bus_name(bus_name: String) -> StringName:
	for i in AudioServer.bus_count:
		if AudioServer.get_bus_name(i) == bus_name:
			return StringName(bus_name)
	return &"Master"
