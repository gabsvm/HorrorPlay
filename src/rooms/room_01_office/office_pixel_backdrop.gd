extends Node2D

# Native logical canvas for the Office benchmark. The node is scaled x3 in the
# room, keeping every authored edge on the pixel grid while the gameplay stays
# at 1920x1080.
const W := 640
const H := 360

var _rng := RandomNumberGenerator.new()

func _ready() -> void:
	_rng.seed = 47
	queue_redraw()

func _draw() -> void:
	_draw_wall_and_floor()
	_draw_window()
	_draw_case_board()
	_draw_clock()
	_draw_bookcase()
	_draw_wall_map()
	_draw_desk()
	_draw_filing_cabinet()
	_draw_door()
	_draw_carpet()
	_draw_material_noise()

func _draw_wall_and_floor() -> void:
	draw_rect(Rect2(0, 0, W, 245), Color("#11171d"))
	for y in range(0, 245, 8):
		var t: float = float(y) / 245.0
		var c: Color = Color(0.065 + t * 0.025, 0.086 + t * 0.025, 0.105 + t * 0.03, 1)
		draw_rect(Rect2(0, y, W, 8), c)
	draw_rect(Rect2(0, 228, W, 17), Color("#090d10"))
	draw_rect(Rect2(0, 245, W, 115), Color("#1d2224"))
	for y in [270, 300, 330]:
		draw_line(Vector2(0, y), Vector2(W, y), Color("#0b0e10"), 1.0)
	for x0 in range(-40, 700, 75):
		var top_x: float = 320.0 + (float(x0) - 320.0) * 0.55
		draw_line(Vector2(top_x, 245), Vector2(x0, H), Color("#0a0d0f"), 1.0)
	draw_line(Vector2(0, 230), Vector2(W, 230), Color(0.12, 0.14, 0.15, 0.7), 1.0)

func _draw_window() -> void:
	var p: Vector2 = Vector2(26, 26)
	var size: Vector2 = Vector2(122, 180)
	draw_style_box(_box(Color("#06090c"), 5, Color("#020304")), Rect2(p, size))
	draw_rect(Rect2(p + Vector2(6, 6), size - Vector2(12, 12)), Color("#173442"))
	draw_rect(Rect2(35, 120, 104, 77), Color("#0c1921"))
	draw_colored_polygon(PackedVector2Array([
		Vector2(35, 146), Vector2(61, 136), Vector2(77, 142), Vector2(92, 126),
		Vector2(111, 140), Vector2(139, 131), Vector2(139, 197), Vector2(35, 197)
	]), Color("#081116"))
	draw_circle(Vector2(104, 60), 11, Color(0.70, 0.84, 0.88, 0.22))
	draw_circle(Vector2(104, 60), 7, Color("#afd1dc"))
	draw_rect(Rect2(85, 32, 5, 168), Color("#091219"))
	draw_rect(Rect2(32, 121, 110, 5), Color("#091219"))
	draw_rect(Rect2(22, 201, 132, 10), Color("#070a0d"))
	var streaks: Array[Vector4] = [
		Vector4(42,42,40,55), Vector4(55,34,53,49), Vector4(71,53,68,69),
		Vector4(102,37,100,52), Vector4(126,47,123,63), Vector4(47,83,44,100),
		Vector4(65,90,62,111), Vector4(112,79,109,98), Vector4(132,91,129,111),
		Vector4(48,133,45,150), Vector4(74,145,70,170), Vector4(104,136,101,157),
		Vector4(126,143,122,166), Vector4(58,171,55,191), Vector4(116,169,113,192)
	]
	for s in streaks:
		draw_line(Vector2(s.x, s.y), Vector2(s.z, s.w), Color(0.55, 0.78, 0.85, 0.55), 1.0)

func _draw_case_board() -> void:
	draw_rect(Rect2(159, 37, 120, 92), Color("#080604"))
	draw_rect(Rect2(163, 41, 112, 84), Color("#21170f"))
	draw_rect(Rect2(168, 46, 102, 74), Color("#66543e"))
	var papers: Array[Rect2] = [Rect2(169,49,35,25), Rect2(215,46,45,31), Rect2(180,83,31,21), Rect2(224,86,29,18)]
	for r in papers:
		draw_rect(r, Color("#cbbd99"))
		draw_rect(Rect2(r.position + Vector2(2,2), Vector2(r.size.x - 4,1)), Color(0.25,0.22,0.18,0.55))
	var thread: PackedVector2Array = PackedVector2Array([Vector2(184,61), Vector2(237,62), Vector2(194,94), Vector2(238,95)])
	draw_polyline(thread, Color("#8f3630"), 2.0)
	for point in thread:
		draw_circle(point, 2, Color("#b14b41"))

func _draw_clock() -> void:
	draw_circle(Vector2(304,58), 20, Color("#0b0e10"))
	draw_arc(Vector2(304,58), 19, 0, TAU, 32, Color("#6d5838"), 3)
	draw_circle(Vector2(304,58), 14, Color("#cfc3a1"))
	draw_line(Vector2(304,58), Vector2(304,48), Color("#29231c"), 2)
	draw_line(Vector2(304,58), Vector2(312,62), Color("#29231c"), 2)

func _draw_bookcase() -> void:
	draw_rect(Rect2(314,77,106,177), Color("#070504"))
	draw_rect(Rect2(319,82,96,167), Color("#3b2315"))
	for shelf_y in [118,157,196,235]:
		draw_rect(Rect2(319,shelf_y,96,4), Color("#0d0805"))
	var palette: Array[Color] = [Color("#663c2e"), Color("#3f525b"), Color("#655333"), Color("#405946"), Color("#7a4737"), Color("#4f342b")]
	_rng.seed = 317
	for shelf_y in [84,123,162,201]:
		var x: int = 324
		while x < 405:
			var bw: int = _rng.randi_range(4,8)
			var bh: int = _rng.randi_range(17,27)
			var col: Color = palette[_rng.randi_range(0, palette.size() - 1)]
			draw_rect(Rect2(x, shelf_y + 30 - bh, bw, bh), col)
			draw_line(Vector2(x+1, shelf_y+30-bh+3), Vector2(x+bw-1,shelf_y+30-bh+3), Color(0.73,0.62,0.40,0.22), 1)
			x += bw + 2
	draw_rect(Rect2(368,214,29,20), Color("#211813"))
	draw_rect(Rect2(372,218,21,2), Color("#9b8359"))

func _draw_wall_map() -> void:
	draw_rect(Rect2(428,68,47,44), Color("#15110e"))
	draw_rect(Rect2(433,73,37,34), Color("#343c3b"))
	var marks: PackedVector2Array = PackedVector2Array([Vector2(438,91),Vector2(445,87),Vector2(453,88),Vector2(459,82),Vector2(466,85)])
	draw_polyline(marks, Color(0.62,0.64,0.56,0.72),1)
	draw_polyline(PackedVector2Array([Vector2(442,99),Vector2(451,94),Vector2(461,96),Vector2(467,102)]), Color(0.62,0.64,0.56,0.55),1)

func _draw_desk() -> void:
	draw_colored_polygon(PackedVector2Array([Vector2(136,213),Vector2(290,213),Vector2(282,310),Vector2(145,310)]), Color("#3a2114"))
	draw_rect(Rect2(128,204,170,18), Color("#512f1a"))
	draw_line(Vector2(128,204),Vector2(298,204),Color("#815331"),1)
	draw_rect(Rect2(142,226,42,64), Color("#2a180f"))
	draw_rect(Rect2(244,226,40,64), Color("#2a180f"))
	for r in [Rect2(146,231,34,53),Rect2(248,231,32,53)]:
		draw_rect(r, Color("#352016"))
		draw_rect(Rect2(r.position + Vector2(13,16), Vector2(8,2)), Color("#9a7240"))
	draw_rect(Rect2(157,193,41,18), Color("#cbbd98"))
	for yy in [198,202,206]:
		draw_line(Vector2(161,yy),Vector2(190,yy),Color("#625a49"),1)
	draw_rect(Rect2(213,196,33,14), Color("#aa9976"))
	draw_line(Vector2(213,196),Vector2(229,205),Color("#716047"),1)
	draw_line(Vector2(229,205),Vector2(246,196),Color("#716047"),1)
	draw_rect(Rect2(178,217,29,6), Color("#6c4128"))
	draw_rect(Rect2(180,215,28,3), Color("#9a5d34"))
	draw_circle(Vector2(225,207),5,Color("#4a4438"))
	draw_circle(Vector2(225,207),3,Color("#141311"))
	draw_rect(Rect2(251,204,8,11), Color("#4a4438"))
	draw_arc(Vector2(259,208),4,-PI/2,PI/2,8,Color("#4a4438"),1)
	draw_line(Vector2(272,189),Vector2(272,154),Color("#4a3421"),4)
	draw_colored_polygon(PackedVector2Array([Vector2(257,155),Vector2(289,155),Vector2(282,140),Vector2(264,140)]),Color("#98632f"))
	draw_line(Vector2(257,155),Vector2(289,155),Color("#2d1b10"),2)

func _draw_filing_cabinet() -> void:
	draw_rect(Rect2(447,167,78,92),Color("#121616"))
	draw_rect(Rect2(451,171,70,84),Color("#252d2c"))
	for i in range(3):
		var y: int = 173 + i*28
		draw_rect(Rect2(453,y,66,23),Color("#35403e"))
		draw_line(Vector2(455,y+2),Vector2(517,y+2),Color(0.42,0.47,0.45,0.45),1)
		draw_rect(Rect2(475,y+7,22,4),Color("#a58a5a"))
	draw_rect(Rect2(454,230,64,20),Color(0.31,0.24,0.18,0.32))

func _draw_door() -> void:
	draw_rect(Rect2(542,87,82,176),Color("#070504"))
	draw_rect(Rect2(548,93,70,164),Color("#3a2114"))
	draw_rect(Rect2(555,101,56,58),Color("#301b11"))
	draw_rect(Rect2(555,170,56,77),Color("#301b11"))
	draw_rect(Rect2(559,105,48,50),Color("#44291a"))
	draw_rect(Rect2(559,174,48,69),Color("#44291a"))
	draw_circle(Vector2(605,181),3,Color("#a48149"))
	draw_line(Vector2(605,87),Vector2(619,76),Color("#050403"),3)

func _draw_carpet() -> void:
	draw_colored_polygon(PackedVector2Array([Vector2(95,271),Vector2(488,271),Vector2(564,355),Vector2(42,355)]),Color("#452d2a"))
	draw_polyline(PackedVector2Array([Vector2(115,280),Vector2(473,280),Vector2(535,344),Vector2(72,344),Vector2(115,280)]),Color(0.45,0.33,0.28,0.75),1)
	for yy in range(294,344,12):
		for xx in range(110,500,24):
			if xx < 520 - int((yy-270)*0.25):
				draw_rect(Rect2(xx,yy,1,1),Color(0.48,0.33,0.29,0.32))

func _draw_material_noise() -> void:
	_rng.seed = 1926
	for i in range(180):
		var x: int = _rng.randi_range(8,632)
		var y: int = _rng.randi_range(8,224)
		var alpha: float = _rng.randf_range(0.05,0.12)
		draw_rect(Rect2(x,y,1,1),Color(0.60,0.66,0.66,alpha))
	for i in range(90):
		var x: int = _rng.randi_range(10,630)
		var y: int = _rng.randi_range(248,352)
		draw_rect(Rect2(x,y,1,1),Color(0.02,0.025,0.03,_rng.randf_range(0.12,0.28)))

func _box(bg: Color, border_width: int, border: Color) -> StyleBoxFlat:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = bg
	style.border_color = border
	style.border_width_left = border_width
	style.border_width_top = border_width
	style.border_width_right = border_width
	style.border_width_bottom = border_width
	style.corner_radius_top_left = 18
	style.corner_radius_top_right = 18
	style.corner_radius_bottom_left = 4
	style.corner_radius_bottom_right = 4
	return style