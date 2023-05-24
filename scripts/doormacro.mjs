import {MODULE, TRIGGERS} from "./constants.mjs";

/**
 * Execute macros.
 * @param {WallDocument} wallDoc      The door.
 * @param {string} trigger            The trigger.
 * @param {object} context            An object of user ids.
 * @param {string} context.gmId       The first active GM found.
 * @param {string} context.userId     The id of the user who changed the door.
 */
export function callMacro(wallDoc, trigger, {gmId, userId}) {
  const data = wallDoc.flags[MODULE]?.[trigger] ?? {};
  if (!data.script) return;
  const body = `(async()=>{
    ${data.script}
  })();`;

  const id = data.asGM ? gmId : userId;
  if ((game.user.id !== id) && !!id) return;
  const fn = Function("door", "scene", body);
  return fn.call({}, wallDoc, wallDoc.parent);
}

export class DoorMacroConfig extends MacroConfig {
  /** @override */
  constructor(wallDocument, options) {
    super(wallDocument, options);
    this.isSecret = wallDocument.door === CONST.WALL_DOOR_TYPES.SECRET;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/doormacro/templates/doormacro.hbs",
      classes: ["macro-sheet", "sheet", MODULE],
      tabs: [{navSelector: ".tabs", contentSelector: ".content-tabs"}],
      height: 600,
      width: 600
    });
  }

  /**
   * Override for the sheet id.
   * @returns {string}      The id of the application.
   */
  get id() {
    return `doormacro-${this.object.id}`;
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    data.name = game.i18n.format("DOORMACRO.Door", {id: this.object.id});
    const dm = this.object.flags[MODULE] ?? {};
    data.triggers = TRIGGERS.map(trigger => {
      const t = dm[trigger] ?? {};
      return {
        type: trigger,
        command: t.command ?? "",
        asGM: t.asGM,
        label: game.i18n.localize(`DOORMACRO.${trigger}`)
      }
    });
    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    for (const trigger of TRIGGERS) {
      if (!formData[`flags.${MODULE}.${trigger}.command`]) {
        delete formData[`flags.${MODULE}.${trigger}`];
        formData[`flags.${MODULE}.-=${trigger}`] = null;
      }
    }
    return this.object.update(formData);
  }

  /** @override */
  _renderInner(data) {
    const trigger = TRIGGERS.find(t => this.document.flags[MODULE]?.[t]?.command);
    if (trigger) this._tabs[0].active = trigger;
    return super._renderInner(data);
  }
}
