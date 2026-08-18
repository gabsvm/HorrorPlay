# res://src/autoload/sanity.gd
extends Node

signal sanity_changed(new_value: int)
signal sanity_tier_changed(new_tier: int)
signal sanity_depleted

enum Tier {
	STABLE,
	UNEASY,
	FRACTURED,
	BREAKING
}

var current_tier: int = Tier.STABLE

var current_sanity: int = 100:
	set(value):
		var previous_value = current_sanity
		current_sanity = int(clamp(value, 0, 100))
		if current_sanity == previous_value:
			return
		
		sanity_changed.emit(current_sanity)
		
		var next_tier = _tier_for_value(current_sanity)
		if next_tier != current_tier:
			current_tier = next_tier
			sanity_tier_changed.emit(current_tier)
		
		if current_sanity == 0 and previous_value > 0:
			sanity_depleted.emit()

func drain_sanity(amount: int) -> void:
	current_sanity -= max(amount, 0)

func restore_sanity(amount: int) -> void:
	current_sanity += max(amount, 0)

func reset_sanity() -> void:
	current_sanity = 100

func get_ratio() -> float:
	return float(current_sanity) / 100.0

func is_below_tier(tier: int) -> bool:
	return current_tier >= tier

func _tier_for_value(value: int) -> int:
	if value >= 75:
		return Tier.STABLE
	if value >= 50:
		return Tier.UNEASY
	if value >= 25:
		return Tier.FRACTURED
	return Tier.BREAKING
