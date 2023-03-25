import {MODULE, TRIGGERS} from "./constants.mjs";

/**
 * Execute macros.
 * @param {WallDocument} wallDoc      The door.
 * @param {string} whenWhat           The trigger.
 * @param {object} context            An object of user ids.
 * @param {string} context.gmId       The first active GM found.
 * @param {string} context.userId     The id of the user who changed the door.
 */
export function callMacro(wallDoc, whenWhat, {gmId, userId}) {
  const script = wallDoc.getFlag(MODULE, `commands.${whenWhat}`);
  const asGM = wallDoc.getFlag(MODULE, `asGM.${whenWhat}`);
  if (!script) return;
  const body = `(async()=>{
    ${script}
  })();`;

  const id = asGM ? gmId : userId;
  if (game.user.id !== id && !!id) return;
  const fn = Function("door", "scene", body);
  fn.call({}, wallDoc, wallDoc.parent);
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
      tabs: [{navSelector: ".tabs", contentSelector: ".content-tabs", initial: "whenCreated"}],
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
    const commands = this.object.flags[MODULE]?.commands ?? {};
    const gms = this.object.flags[MODULE]?.asGM ?? {};
    data.triggers = TRIGGERS.map(trigger => {
      return {
        type: trigger,
        command: commands[trigger],
        asGM: gms[trigger],
        label: game.i18n.localize(`DOORMACRO.${trigger}`)
      }
    });
    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    for (const trigger of TRIGGERS) {
      if (!formData[`flags.${MODULE}.commands.${trigger}`]) {
        delete formData[`flags.${MODULE}.commands.${trigger}`];
        delete formData[`flags.${MODULE}.asGM.${trigger}`];
        formData[`flags.${MODULE}.commands.-=${trigger}`] = null;
        formData[`flags.${MODULE}.asGM.-=${trigger}`] = null;
      }
    }
    return this.object.update(formData);
  }
}
