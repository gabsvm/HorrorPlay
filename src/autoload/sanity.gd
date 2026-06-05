# res://src/autoload/sanity.gd
extends Node

signal sanity_changed(new_value: int)
signal sanity_depleted

var current_sanity: int = 100:
	set(val):
		current_sanity = clamp(val, 0, 100)
		sanity_changed.emit(current_sanity)
		if current_sanity == 0:
			sanity_depleted.emit()

func drain_sanity(amount: int) -> void:
	current_sanity -= amount

func restore_sanity(amount: int) -> void:
	current_sanity += amount
