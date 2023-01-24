import { MODULE, TRIGGERS } from "./constants.mjs";

export function renderDoorMacroConfig(wallDocument) {
  new DoorMacroConfig(wallDocument, {}).render(true);
}

/**
 * Execute macros.
 * @param wallDoc   The door.
 * @param whenWhat  The trigger.
 * @param gmId      The first active GM found.
 * @param userId    The id of the user who changed the door.
 */
export function callMacro(wallDoc, whenWhat, { gmId, userId }) {
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
  constructor(wallDocument, options) {
    super(wallDocument, options);
    this.isSecret = wallDocument.door === CONST.WALL_DOOR_TYPES.SECRET;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/doormacro/templates/doormacro.hbs",
      classes: ["macro-sheet", "sheet", MODULE],
      tabs: [{ navSelector: ".tabs", contentSelector: ".content-tabs", initial: "whenCreated" }],
      height: 600,
      width: 600
    });
  }

  get id() {
    return `doormacro-${this.object.id}`;
  }

  async getData() {
    const data = await super.getData();
    data.name = `Door: ${this.object.id}`;
    data.triggers = TRIGGERS.map(trigger => {
      return {
        type: trigger,
        command: this.object.getFlag(MODULE, `commands.${trigger}`),
        asGM: this.object.getFlag(MODULE, `asGM.${trigger}`),
        label: game.i18n.localize(`DOORMACRO.${trigger}`)
      }
    });
    return data;
  }

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
