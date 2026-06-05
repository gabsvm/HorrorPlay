# res://src/autoload/dialogue_manager.gd
extends Node

signal dialogue_started
signal dialogue_ended

var balloon_scene: PackedScene = preload("res://src/common/ui/dialogue_balloon.tscn")
var current_balloon: Node = null

func show_dialogue(lines: Array[String], speaker: String = "Inspector") -> void:
	if current_balloon:
		return # Already displaying dialogue
		
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
	
	current_balloon.queue_free()
	current_balloon = null
	
	InputController.block_input(false)
	dialogue_ended.emit()
