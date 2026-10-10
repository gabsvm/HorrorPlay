# El Huésped V4 — Cómo instalar el paquete en Claude Code

## Archivos

- `docs/EL_HUESPED_PLAN_MAESTRO_V4_GAMEPLAY_HISTORIA_PACING.md`: especificación completa de las 18 fases (00–17), arquitectura, canon y pruebas.
- `PROMPT_EJECUCION_CLAUDE_V4.md`: prompt de arranque para pegar en una sesión de Claude Code.
- `.claude/agents/opus-55-observer.md`: agente Opus 5.5 que revisa en modo lectura.
- `.claude/agents/haiku-implementer.md`: perfil Haiku de implementación.

## Preparación

1. Extraer **el contenido** de este ZIP en la raíz del clon local `HorrorPlay/` (no dentro de `web/`), preservando `.claude/agents/` y `docs/`.
2. Cambiar a rama `reboot/web-el-huesped` y comprobar `git status` sin borrar nada. Se recomienda efectuar el trabajo en una rama hija de esa referencia si otros están publicando al mismo tiempo.
3. Actualizar Claude Code si es necesario: `claude update`; comprobar con `/model` que tu cuenta/proveedor tiene Haiku y Opus 5.5. Consulta https://code.claude.com/docs/en/model-config.
4. Habilitar Agent Teams para una sesión **interactiva**, porque `claude -p` no forma equipos:

   PowerShell (Windows):

   ```powershell
   $env:CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1"
   claude --model haiku
   ```

   Bash/Linux/macOS:

   ```bash
   export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
   claude --model haiku
   ```

   También se puede configurar en `settings.json`:

   ```json
   { "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
   ```

5. Pegar **íntegramente** el contenido de `PROMPT_EJECUCION_CLAUDE_V4.md` en la sesión Haiku. Indicar expresamente que cree un equipo real con teammate `opus-55-observer`, modelo `claude-opus-5-5`, **no** que él mismo simule ambos roles.
6. Si aparece un agente con modelo distinto, no dar por cumplido el requisito. El prompt exige detenerse e informarlo.
7. Dejar que Haiku trabaje por fases y que Opus emita revisiones independientes antes y después; solicitar trazabilidad de commits y push normal a `reboot/web-el-huesped` únicamente tras aprobación Opus (sin `--force`).

**Nota:** los archivos son una especificación y configuraciones, no modifican por sí solos el repositorio remoto. La función Agent Teams es experimental y su soporte varía por modalidad; alternativa honesta: Haiku lead y Opus 5.5 como subagente revisor en cada fase. No usar `--dangerously-skip-permissions` para evitar prompts.
