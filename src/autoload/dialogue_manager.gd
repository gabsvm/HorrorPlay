# res://src/autoload/dialogue_manager.gd
extends Node

signal dialogue_started
signal dialogue_ended

var balloon_scene: PackedScene = preload("res://src/common/ui/dialogue_balloon.tscn")
var current_balloon: Node = null

func show_dialogue(lines: Array[String], speaker: String = "Inspector") -> void:
	if current_balloon:
		return
		
	dialogue_started.emit()
	InputController.block_input(true)
	
	current_balloon = balloon_scene.instantiate()
	get_tree().root.add_child(current_balloon)
	current_balloon.start_dialogue(lines, speaker)
	
	await current_balloon.dialogue_finished
	
	current_balloon.queue_free()
	current_balloon = null
	
	InputController.block_input(false)
	dialogue_ended.emit()

func show_choices(prompt: String, choices: Array[Dictionary], speaker: String = "Inspector") -> void:
	if current_balloon:
		return
		
	dialogue_started.emit()
	InputController.block_input(true)
	
	current_balloon = balloon_scene.instantiate()
	get_tree().root.add_child(current_balloon)
	current_balloon.start_choices(prompt, choices, speaker)
	
	await current_balloon.dialogue_finished
	
	# The choice callback must run only after the current balloon stops owning the
	# dialogue channel. Previously callbacks ran inside the balloon, so any
	# callback that called show_dialogue() was silently rejected as "already
	# displaying dialogue".
	var selected_choice: Dictionary = current_balloon.selected_choice
	current_balloon.queue_free()
	current_balloon = null
	
	InputController.block_input(false)
	dialogue_ended.emit()
	
	if selected_choice.has("callback") and selected_choice["callback"] is Callable:
		selected_choice["callback"].call()
