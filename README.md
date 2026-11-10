# Techover Claude Hub

My reusable Claude skills, prompts and workflows.

## Skills
| Skill | What it does |
|---|---|
| [`email-to-figma`](skills/email-to-figma/SKILL.md) | Moves an email design (Claude Design export, Claude artifact, or HTML email) into Figma as editable layers, with a fallback that works when the sandbox can't reach `mcp.figma.com`. |
| [`klaviyo-email-build`](skills/klaviyo-email-build/SKILL.md) | Builds a Gmail-safe Klaviyo HTML template from a design: flattened hero, every image hosted on Shopify Files, fixed two-column tables, correct Klaviyo tags, then a confirmed test send. Safe for live client accounts. |

## Using a skill
Copy a skill folder into `~/.claude/skills/` (all projects) or `<project>/.claude/skills/` (one project).

## Adding new work
- `skills/<skill-name>/SKILL.md` plus any `scripts/`
- Keep client names, API keys and tokens out of this repo.
