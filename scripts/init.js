import { MODULE, REQUIRED_CORE_MODULE_VERSION, ACTION_TYPE, GROUP_ID, STAT_ID } from './constants.js';
import { registerSettings } from './settings.js';
import { Utils } from './utils.js';

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  const localize = coreModule.api.Utils.i18n;

  // ── Default HUD layout ────────────────────────────────────────────────────
  // Every tab needs an inner sub-group with the same id but a composed nestId
  // (e.g. "stats_stats"). TAH Core only renders actions that live inside a
  // sub-group – not on the tab itself.
  //
  // The Stats tab gets TWO sub-groups:
  //   stats_stats → HP / Shield / PP / Overland
  //   stats_tags  → Traits (shown as a separate "Tags" section)
  const g = (id, name) => ({ id, name, type: 'system' });

  const RAW_GROUPS = [
    g(GROUP_ID.stats,          localize('PTR2e.Groups.Stats')),
    g(GROUP_ID.tags,           localize('PTR2e.Groups.Tags')),
    g(GROUP_ID.utils,          localize('PTR2e.Groups.Utils')),
    g(GROUP_ID.allSkills,      localize('PTR2e.Groups.AllSkills')),
    g(GROUP_ID.favoriteSkills, localize('PTR2e.Groups.FavoriteSkills')),
    g(GROUP_ID.skills70,       localize('PTR2e.Groups.Skills70')),
    g(GROUP_ID.skills25,       localize('PTR2e.Groups.Skills25')),
    g(GROUP_ID.skillsOther,    localize('PTR2e.Groups.SkillsOther')),
  ];

  const statsGroup   = g(GROUP_ID.stats, localize('PTR2e.Groups.Stats'));
  const tagsGroup    = g(GROUP_ID.tags,  localize('PTR2e.Groups.Tags'));

  const DEFAULTS = {
    layout: [
      // Stats tab: two sub-groups
      {
        ...statsGroup,
        nestId: GROUP_ID.stats,
        groups: [
          { ...statsGroup, nestId: `${GROUP_ID.stats}_${GROUP_ID.stats}` },
          { ...tagsGroup,  nestId: `${GROUP_ID.stats}_${GROUP_ID.tags}` },
        ],
      },
      // Remaining tabs: single sub-group each
      ...RAW_GROUPS
        .filter(grp => grp.id !== GROUP_ID.stats && grp.id !== GROUP_ID.tags)
        .map(grp => ({
          ...grp,
          nestId: grp.id,
          groups: [{ ...grp, nestId: `${grp.id}_${grp.id}` }],
        })),
    ],
    groups: RAW_GROUPS,
  };

  // ── ActionHandler ─────────────────────────────────────────────────────────
  class ActionHandler extends coreModule.api.ActionHandler {
    async buildSystemActions (groupIds) {
      const actor = this.actor;
      if (!actor) return;

      await this.#buildStats(actor);
      await this.#buildTags(actor);
      await this.#buildUtils(actor);
      await this.#buildSkills(actor);
    }

    // HP / Shield / PP / Overland
    async #buildStats (actor) {
      const actions = [];

      const hp = actor.system.health ?? {};
      actions.push({
        id: `${ACTION_TYPE.stat}-${STAT_ID.hp}`,
        name: localize('PTR2e.Stats.HP'),
        info1: { text: `${hp.value ?? 0}/${hp.max ?? 0}` },
        system: { actionType: ACTION_TYPE.stat, actionId: STAT_ID.hp },
      });

      const shield = actor.system.shield ?? {};
      actions.push({
        id: `${ACTION_TYPE.stat}-${STAT_ID.shield}`,
        name: localize('PTR2e.Stats.Shield'),
        info1: { text: `${shield.value ?? 0}/${shield.max ?? 0}` },
        system: { actionType: ACTION_TYPE.stat, actionId: STAT_ID.shield },
      });

      const pp = actor.system.powerPoints ?? {};
      actions.push({
        id: `${ACTION_TYPE.stat}-${STAT_ID.pp}`,
        name: localize('PTR2e.Stats.PP'),
        info1: { text: `${pp.value ?? 0}/${pp.max ?? 0}` },
        system: { actionType: ACTION_TYPE.stat, actionId: STAT_ID.pp },
      });

      const overland = actor.system.movement?.overland?.value ?? 3;
      actions.push({
        id: `${ACTION_TYPE.stat}-${STAT_ID.overland}`,
        name: localize('PTR2e.Stats.Overland'),
        info1: { text: String(overland) },
        system: { actionType: ACTION_TYPE.stat, actionId: STAT_ID.overland },
      });

      await this.addActions(actions, { id: GROUP_ID.stats, type: 'system' });
    }

    // Traits shown as display-only tags in their own sub-group
    async #buildTags (actor) {
      const traits = actor.system.traits ?? [];
      if (!traits.size && !traits.length) return;

      const actions = [];
      for (const trait of traits) {
        const slug    = typeof trait === 'string' ? trait : (trait?.slug ?? String(trait));
        const label   = typeof trait === 'string' ? Utils.slugToLabel(trait) : (trait?.label ?? Utils.slugToLabel(slug));
        const tooltip = trait?.description ?? label;
        actions.push({
          id: `${ACTION_TYPE.trait}-${slug}`,
          name: label,
          tooltip,
          system: { actionType: ACTION_TYPE.trait, actionId: slug },
        });
      }

      if (actions.length) await this.addActions(actions, { id: GROUP_ID.tags, type: 'system' });
    }

    async #buildUtils (actor) {
      const actions = [
        {
          id: 'util-rest',
          name: localize('PTR2e.Utils.Rest'),
          system: { actionType: ACTION_TYPE.util, actionId: 'rest' },
        },
        {
          id: 'util-open-dex',
          name: localize('PTR2e.Utils.OpenDex'),
          system: { actionType: ACTION_TYPE.util, actionId: 'open-dex' },
        },
        {
          id: 'util-open-party-sheet',
          name: localize('PTR2e.Utils.OpenPartySheet'),
          system: { actionType: ACTION_TYPE.util, actionId: 'open-party-sheet' },
        },
        {
          id: 'util-open-tutor-list',
          name: localize('PTR2e.Utils.OpenTutorList'),
          system: { actionType: ACTION_TYPE.util, actionId: 'open-tutor-list' },
        },
        {
          id: 'util-luck-roll',
          name: localize('PTR2e.Utils.LuckRoll'),
          system: { actionType: ACTION_TYPE.util, actionId: 'luck-roll' },
        },
      ];
      await this.addActions(actions, { id: GROUP_ID.utils, type: 'system' });
    }

    async #buildSkillGroup (actor, groupId, skills) {
      if (!skills.length) return;
      const actions = skills.map((skill) => {
        const statistic = actor.skills?.[skill.slug];
        const label = statistic?.label ?? Utils.slugToLabel(skill.slug);
        return {
          id: `${ACTION_TYPE.skill}-${skill.slug}`,
          name: label,
          info1: { text: String(skill.total ?? 0) },
          tooltip: `${label}: ${skill.total ?? 0}`,
          system: { actionType: ACTION_TYPE.skill, actionId: skill.slug },
        };
      });
      await this.addActions(actions, { id: groupId, type: 'system' });
    }

    async #buildSkills (actor) {
      const allSkills = Object.values(actor.system.skills ?? {}).filter((s) => !s.hidden);
      const byTotalDesc = (a, b) => (b.total ?? 0) - (a.total ?? 0);

      await this.#buildSkillGroup(actor, GROUP_ID.allSkills,
        [...allSkills].sort((a, b) => a.slug.localeCompare(b.slug)));

      await this.#buildSkillGroup(actor, GROUP_ID.favoriteSkills,
        allSkills.filter((s) => s.favourite).sort(byTotalDesc));

      await this.#buildSkillGroup(actor, GROUP_ID.skills70,
        allSkills.filter((s) => (s.total ?? 0) >= 70).sort(byTotalDesc));

      await this.#buildSkillGroup(actor, GROUP_ID.skills25,
        allSkills.filter((s) => (s.total ?? 0) >= 25 && (s.total ?? 0) < 70).sort(byTotalDesc));

      await this.#buildSkillGroup(actor, GROUP_ID.skillsOther,
        allSkills.filter((s) => (s.total ?? 0) < 25).sort(byTotalDesc));
    }
  }

  // ── RollHandler ───────────────────────────────────────────────────────────
  // TAH Core calls handleActionClick(event, buttonValue).
  // The current action lives on this.action; right-click is this.isRightClick.
  class RollHandler extends coreModule.api.RollHandler {
    async handleActionClick (event) {
      const actor = this.actor;
      if (!actor) return;

      const { actionType, actionId } = this.action?.system ?? {};
      if (!actionType) return;

      switch (actionType) {
        case ACTION_TYPE.stat:
          await this.#handleStat(actor, actionId);
          break;
        case ACTION_TYPE.skill:
          await this.#handleSkill(actor, actionId);
          break;
        case ACTION_TYPE.util:
          await this.#handleUtil(actor, actionId);
          break;
        case ACTION_TYPE.trait:
          // Display only — no click action
          break;
      }
    }

    async #handleStat (actor, statId) {
      const statPaths = {
        [STAT_ID.hp]:     { path: 'system.health.value',      maxPath: 'system.health.max' },
        [STAT_ID.shield]: { path: 'system.shield.value',      maxPath: 'system.shield.max' },
        [STAT_ID.pp]:     { path: 'system.powerPoints.value', maxPath: 'system.powerPoints.max' },
      };

      const entry = statPaths[statId];
      if (!entry) return; // overland is display-only

      const current  = foundry.utils.getProperty(actor, entry.path) ?? 0;
      const max      = foundry.utils.getProperty(actor, entry.maxPath) ?? 0;
      const newValue = this.isRightClick
        ? Math.max(0, current - 1)
        : Math.min(max, current + 1);

      await actor.update({ [entry.path]: newValue });
    }

    async #handleSkill (actor, skillSlug) {
      const statistic = actor.skills?.[skillSlug];
      if (!statistic) {
        ui.notifications.warn(`Skill "${skillSlug}" not found on this actor.`);
        return;
      }
      await statistic.roll();
    }

    async #handleUtil (actor, actionId) {
      switch (actionId) {
        case 'luck-roll': {
          const skill = actor.system.skills?.['luck'];
          if (skill) await skill.endOfDayLuckRoll();
          break;
        }
        case 'open-tutor-list': {
          game.ptr.tutorList.render({ force: true, actor });
          break;
        }
        default: {
          // rest, open-dex, open-party-sheet: delegate to the actor sheet's registered action
          const sheet = actor.sheet;
          const fn = sheet?.constructor?.DEFAULT_OPTIONS?.actions?.[actionId];
          if (fn) await fn.call(sheet);
          break;
        }
      }
    }
  }

  // ── SystemManager ─────────────────────────────────────────────────────────
  class SystemManager extends coreModule.api.SystemManager {
    getActionHandler ()          { return new ActionHandler(); }
    getAvailableRollHandlers ()  { return { core: 'Core PTR2e' }; }
    getRollHandler ()            { return new RollHandler(); }
    registerDefaults ()          { return DEFAULTS; }
    registerSettings (coreUpdate){ registerSettings(coreUpdate); }
  }

  // ── Register module API ───────────────────────────────────────────────────
  const module = game.modules.get(MODULE.id);
  module.api = {
    requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION,
    SystemManager,
  };
  Hooks.callAll('tokenActionHudSystemReady', module);
});
