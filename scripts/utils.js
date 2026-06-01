import { MODULE } from './constants.js';

export class Utils {
  static getSetting(settingName) {
    return game.settings.get(MODULE.id, settingName);
  }

  static async setSetting(settingName, value) {
    return await game.settings.set(MODULE.id, settingName, value);
  }

  /**
   * Converts a kebab-case or snake_case slug to Title Case.
   * e.g. "bipedal-speech" → "Bipedal Speech"
   */
  static slugToLabel(slug) {
    const str = typeof slug === 'string' ? slug : String(slug?.slug ?? slug ?? '');
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
