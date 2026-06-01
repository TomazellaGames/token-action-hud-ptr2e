# Token Action HUD – Pokémon Tabletop Reunited: Evolved

A [Token Action HUD](https://github.com/Larkinabout/fvtt-token-action-hud-core) system module for the [PTR2E](https://2e.ptr.wiki/) game system in [Foundry VTT](https://foundryvtt.com/).

Adds a floating action HUD when a token is selected, giving quick access to stats, resources, and skills without opening the character sheet.

---

## Requirements

| Dependency | Minimum version |
|---|---|
| Foundry VTT | 14 |
| PTR2E system | latest |
| Token Action HUD Core | 2.1.0 |

---

## Installation

### Via manifest URL (recommended)

1. Open Foundry VTT and go to **Configuration → Add-on Modules → Install Module**.
2. Paste the manifest URL into the **Manifest URL** field at the bottom:
   ```
   https://github.com/TomazellaGames/token-action-hud-ptr2e/releases/latest/download/module.json
   ```
3. Click **Install**.
4. Foundry will prompt you to install **Token Action HUD Core** if it is not already present — accept.
5. Enable both **Token Action HUD Core** and **Token Action HUD – PTR2E** in your world's module list.

### Manual installation

1. Download `module.zip` from the [latest release](https://github.com/TomazellaGames/token-action-hud-ptr2e/releases/latest).
2. Extract it into `<Foundry User Data>/Data/modules/token-action-hud-ptr2e/`.
3. Restart Foundry and enable the module as above.

---

## Usage

Select any token that belongs to a PTR2E actor (humanoid, Pokémon, or creature). The HUD will appear near the token with the following tabs:

### Stats

Two sections inside this tab:

**Stats** — core resources with live current/max display:

| Button | Left-click | Right-click |
|---|---|---|
| HP | Increase current HP by 1 | Decrease current HP by 1 |
| Shield | Increase Shield by 1 | Decrease Shield by 1 |
| PP | Increase PP by 1 | Decrease PP by 1 |
| Overland | — (display only) | — |

**Tags** — the actor's traits displayed as read-only labels. Hover over a tag to see its description.

### All Skills

Every skill available to the actor, sorted **A – Z**. Click any skill to open the PTR2E roll dialog for that skill.

### Favorite Skills

Only skills marked as favourite in the character sheet, sorted by **total value (descending)**. Click to roll.

### 70+ Skills

Skills with a total value of **70 or higher**, sorted descending. Click to roll.

### 25+ Skills

Skills with a total value between **25 and 69**, sorted descending. Click to roll.

### Other Skills

Skills with a total value **below 25**, sorted descending. Click to roll.

---

## Configuration

No additional settings are required. Token Action HUD Core provides its own settings for HUD position, scale, and colour. Access them via **Configuration → Module Settings → Token Action HUD Core**.

---

## License

[GNU General Public License v3](LICENSE)

---

## Credits

- Built with [Token Action HUD Core](https://github.com/Larkinabout/fvtt-token-action-hud-core) by Larkinabout.
- For the [PTR2E](https://2e.ptr.wiki/) system by the Pokémon Tabletop Reunited team.
