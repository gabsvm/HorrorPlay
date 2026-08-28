extends Node

var _tick_player: AudioStreamPlayer
var _rain_tap_player: AudioStreamPlayer
var _tick_stream: AudioStreamWAV
var _tap_stream: AudioStreamWAV
var _elapsed := 0.0
var _next_tap := 3.4
var _rng := RandomNumberGenerator.new()

func _ready() -> void:
	_rng.seed = 192647
	_tick_player = AudioStreamPlayer.new()
	_rain_tap_player = AudioStreamPlayer.new()
	_tick_player.bus = _safe_sfx_bus()
	_rain_tap_player.bus = _safe_sfx_bus()
	_tick_player.volume_db = -27.0
	_rain_tap_player.volume_db = -31.0
	add_child(_tick_player)
	add_child(_rain_tap_player)
	_tick_stream = _build_tick()
	_tap_stream = _build_tap()

func _process(delta: float) -> void:
	_elapsed += delta
	if _elapsed >= 1.0:
		_elapsed -= 1.0
		_tick_player.pitch_scale = _rng.randf_range(0.97, 1.03)
		_tick_player.stream = _tick_stream
		_tick_player.play()
	_next_tap -= delta
	if _next_tap <= 0.0:
		_next_tap = _rng.randf_range(2.1, 5.8)
		_rain_tap_player.pitch_scale = _rng.randf_range(0.88, 1.13)
		_rain_tap_player.stream = _tap_stream
		_rain_tap_player.play()

func _build_tick() -> AudioStreamWAV:
	return _build_transient(0.045, 1650.0, 0.42, 0.10)

func _build_tap() -> AudioStreamWAV:
	return _build_transient(0.065, 760.0, 0.26, 0.24)

func _build_transient(duration: float, frequency: float, tone_gain: float, noise_gain: float) -> AudioStreamWAV:
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = 11025
	stream.stereo = false
	var samples := int(stream.mix_rate * duration)
	var data := PackedByteArray()
	data.resize(samples * 2)
	var filtered := 0.0
	for i in range(samples):
		var t := float(i) / float(stream.mix_rate)
		var env := pow(max(0.0, 1.0 - t / duration), 4.2)
		filtered = lerp(filtered, _rng.randf_range(-1.0, 1.0), 0.42)
		var v := (sin(TAU * frequency * t) * tone_gain + filtered * noise_gain) * env
		var sample := int(clamp(v, -1.0, 1.0) * 32767.0)
		data[i * 2] = sample & 0xff
		data[i * 2 + 1] = (sample >> 8) & 0xff
	stream.data = data
	return stream

func _safe_sfx_bus() -> StringName:
	return &"SFX" if AudioServer.get_bus_index("SFX") >= 0 else &"Master"
