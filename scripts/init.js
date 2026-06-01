import { MODULE, REQUIRED_CORE_MODULE_VERSION, ACTION_TYPE, GROUP_ID, STAT_ID } from './constants.js';
import { registerSettings } from './settings.js';
import { Utils } from './utils.js';

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  const localize = coreModule.api.Utils.i18n;

  // ── Default HUD layout ────────────────────────────────────────────────────
  const DEFAULTS = {
    layout: [
      {
        nestId: GROUP_ID.stats,
        id: GROUP_ID.stats,
        name: localize('PTR2e.Groups.Stats'),
        type: 'system',
      },
      {
        nestId: GROUP_ID.allSkills,
        id: GROUP_ID.allSkills,
        name: localize('PTR2e.Groups.AllSkills'),
        type: 'system',
      },
      {
        nestId: GROUP_ID.favoriteSkills,
        id: GROUP_ID.favoriteSkills,
        name: localize('PTR2e.Groups.FavoriteSkills'),
        type: 'system',
      },
      {
        nestId: GROUP_ID.skills70,
        id: GROUP_ID.skills70,
        name: localize('PTR2e.Groups.Skills70'),
        type: 'system',
      },
      {
        nestId: GROUP_ID.skills25,
        id: GROUP_ID.skills25,
        name: localize('PTR2e.Groups.Skills25'),
        type: 'system',
      },
      {
        nestId: GROUP_ID.skillsOther,
        id: GROUP_ID.skillsOther,
        name: localize('PTR2e.Groups.SkillsOther'),
        type: 'system',
      },
    ],
    groups: [
      { id: GROUP_ID.stats, name: localize('PTR2e.Groups.Stats'), type: 'system' },
      { id: GROUP_ID.allSkills, name: localize('PTR2e.Groups.AllSkills'), type: 'system' },
      { id: GROUP_ID.favoriteSkills, name: localize('PTR2e.Groups.FavoriteSkills'), type: 'system' },
      { id: GROUP_ID.skills70, name: localize('PTR2e.Groups.Skills70'), type: 'system' },
      { id: GROUP_ID.skills25, name: localize('PTR2e.Groups.Skills25'), type: 'system' },
      { id: GROUP_ID.skillsOther, name: localize('PTR2e.Groups.SkillsOther'), type: 'system' },
    ],
  };

  // ── ActionHandler ─────────────────────────────────────────────────────────
  class ActionHandler extends coreModule.api.ActionHandler {
    async buildSystemActions(character) {
      const { actor } = character;
      if (!actor) return;

      await this.#buildStats(actor);
      await this.#buildSkills(actor);
    }

    async #buildStats(actor) {
      const actions = [];

      // HP
      const hp = actor.system.health ?? {};
      actions.push({
        id: `${ACTION_TYPE.stat}|${STAT_ID.hp}`,
        name: `HP: ${hp.value ?? 0}/${hp.max ?? 0}`,
        encodedValue: [ACTION_TYPE.stat, STAT_ID.hp].join('|'),
        tooltip: localize('PTR2e.Stats.HP'),
        cssClass: 'ptr2e-stat',
      });

      // Shield
      const shield = actor.system.shield ?? {};
      actions.push({
        id: `${ACTION_TYPE.stat}|${STAT_ID.shield}`,
        name: `Shield: ${shield.value ?? 0}/${shield.max ?? 0}`,
        encodedValue: [ACTION_TYPE.stat, STAT_ID.shield].join('|'),
        tooltip: localize('PTR2e.Stats.Shield'),
        cssClass: 'ptr2e-stat',
      });

      // PP
      const pp = actor.system.powerPoints ?? {};
      actions.push({
        id: `${ACTION_TYPE.stat}|${STAT_ID.pp}`,
        name: `PP: ${pp.value ?? 0}/${pp.max ?? 0}`,
        encodedValue: [ACTION_TYPE.stat, STAT_ID.pp].join('|'),
        tooltip: localize('PTR2e.Stats.PP'),
        cssClass: 'ptr2e-stat',
      });

      // Overland movement
      const overland = actor.system.movement?.overland?.value ?? 3;
      actions.push({
        id: `${ACTION_TYPE.stat}|${STAT_ID.overland}`,
        name: `${localize('PTR2e.Stats.Overland')}: ${overland}`,
        encodedValue: [ACTION_TYPE.stat, STAT_ID.overland].join('|'),
        tooltip: localize('PTR2e.Stats.Overland'),
        cssClass: 'ptr2e-stat ptr2e-display-only',
      });

      // Traits
      const traits = actor.system.traits ?? [];
      for (const slug of traits) {
        const label = Utils.slugToLabel(slug);
        actions.push({
          id: `${ACTION_TYPE.trait}|${slug}`,
          name: label,
          encodedValue: [ACTION_TYPE.trait, slug].join('|'),
          tooltip: label,
          cssClass: 'ptr2e-trait ptr2e-display-only',
        });
      }

      await this.addActions(actions, { id: GROUP_ID.stats, type: 'system' });
    }

    async #buildSkillGroup(actor, nestId, skills) {
      if (!skills.length) return;

      const actions = skills.map((skill) => {
        const statistic = actor.skills?.[skill.slug];
        const label = statistic?.label ?? Utils.slugToLabel(skill.slug);
        const total = skill.total ?? 0;
        return {
          id: `${ACTION_TYPE.skill}|${skill.slug}`,
          name: `${label} (${total})`,
          encodedValue: [ACTION_TYPE.skill, skill.slug].join('|'),
          tooltip: `${label}: ${total}`,
          cssClass: 'ptr2e-skill',
        };
      });

      await this.addActions(actions, { id: nestId, type: 'system' });
    }

    async #buildSkills(actor) {
      const allSkills = Object.values(actor.system.skills ?? {}).filter(
        (s) => !s.hidden,
      );

      // All Skills – alphabetical by slug
      const allSorted = [...allSkills].sort((a, b) => a.slug.localeCompare(b.slug));
      await this.#buildSkillGroup(actor, GROUP_ID.allSkills, allSorted);

      const byTotalDesc = (a, b) => (b.total ?? 0) - (a.total ?? 0);

      // Favorite Skills
      const favorites = allSkills.filter((s) => s.favourite).sort(byTotalDesc);
      await this.#buildSkillGroup(actor, GROUP_ID.favoriteSkills, favorites);

      // 70+ Skills
      const high = allSkills.filter((s) => (s.total ?? 0) >= 70).sort(byTotalDesc);
      await this.#buildSkillGroup(actor, GROUP_ID.skills70, high);

      // 25–69 Skills
      const mid = allSkills
        .filter((s) => (s.total ?? 0) >= 25 && (s.total ?? 0) < 70)
        .sort(byTotalDesc);
      await this.#buildSkillGroup(actor, GROUP_ID.skills25, mid);

      // Other Skills (< 25)
      const low = allSkills.filter((s) => (s.total ?? 0) < 25).sort(byTotalDesc);
      await this.#buildSkillGroup(actor, GROUP_ID.skillsOther, low);
    }
  }

  // ── RollHandler ───────────────────────────────────────────────────────────
  class RollHandler extends coreModule.api.RollHandler {
    async handleActionClick(event, actionTypeId, actionId) {
      const actor = this.actor;
      if (!actor) return;

      switch (actionTypeId) {
        case ACTION_TYPE.stat:
          await this.#handleStat(event, actor, actionId);
          break;
        case ACTION_TYPE.skill:
          await this.#handleSkill(event, actor, actionId);
          break;
        case ACTION_TYPE.trait:
          // Display only – no action
          break;
      }
    }

    async #handleStat(event, actor, statId) {
      const isRightClick = event.button === 2;

      const statPaths = {
        [STAT_ID.hp]: {
          path: 'system.health.value',
          maxPath: 'system.health.max',
        },
        [STAT_ID.shield]: {
          path: 'system.shield.value',
          maxPath: 'system.shield.max',
        },
        [STAT_ID.pp]: {
          path: 'system.powerPoints.value',
          maxPath: 'system.powerPoints.max',
        },
      };

      const entry = statPaths[statId];
      if (!entry) return; // overland and unknown stats are display-only

      const current = foundry.utils.getProperty(actor, entry.path) ?? 0;
      const max = foundry.utils.getProperty(actor, entry.maxPath) ?? 0;

      const newValue = isRightClick
        ? Math.max(0, current - 1)
        : Math.min(max, current + 1);

      await actor.update({ [entry.path]: newValue });
    }

    async #handleSkill(event, actor, skillSlug) {
      const statistic = actor.skills?.[skillSlug];
      if (!statistic) {
        ui.notifications.warn(`Skill "${skillSlug}" not found on this actor.`);
        return;
      }
      await statistic.roll({ event });
    }
  }

  // ── SystemManager ─────────────────────────────────────────────────────────
  class SystemManager extends coreModule.api.SystemManager {
    getActionHandler() {
      return new ActionHandler();
    }

    getAvailableRollHandlers() {
      return { core: 'Core PTR2e' };
    }

    getRollHandler(rollHandlerId) {
      return new RollHandler();
    }

    registerDefaults() {
      return DEFAULTS;
    }

    registerSettings(coreUpdate) {
      registerSettings(coreUpdate);
    }
  }

  // ── Register module API ───────────────────────────────────────────────────
  const module = game.modules.get(MODULE.id);
  module.api = {
    requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION,
    SystemManager,
  };
  Hooks.callAll('tokenActionHudSystemReady', module);
});
