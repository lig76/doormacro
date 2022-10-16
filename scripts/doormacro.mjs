import { MODULE, TRIGGERS } from "./constants.mjs";

export function renderDoorMacroConfig(wallDocument) {
  new DoorMacroConfig(wallDocument, {}).render(true);
}

export function callMacro(wallDoc, whenWhat, context = {}) {
  const script = wallDoc.getFlag(MODULE, `commands.${whenWhat}`);
  if (!script) return;
  const that = foundry.utils.mergeObject({ trigger: whenWhat }, context);

  const body = `(async()=>{
    ${script}
  })();`;
  const fn = Function("door", "scene", body);
  fn.call(that, wallDoc, wallDoc.parent);
}

export class DoorMacroConfig extends MacroConfig {
  constructor(wallDocument, options) {
    super(wallDocument, options);
    this.isSecret = wallDocument.door === CONST.WALL_DOOR_TYPES.SECRET;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/doormacro/templates/doormacro.hbs",
      classes: ["macro-sheet", "sheet"]
    });
  }

  get id() {
    return `doormacro-${this.object.id}`;
  }

  activateListeners(html) {
    html[0].addEventListener("click", (event) => {
      const trigger = event.target.closest(".doormacro .triggers .trigger");
      if (!trigger) return;
      const type = trigger.dataset.type;
      const form = trigger.closest("form");
      form.classList.remove(...TRIGGERS.filter(t => t !== type));
      form.classList.add(type);
    });
  }

  async getData() {
    const data = await super.getData();
    data.name = `Door: ${this.object.id}`;
    data.triggers = TRIGGERS.map(trigger => {
      return {
        type: trigger,
        script: this.object.getFlag(MODULE, `commands.${trigger}`),
        label: game.i18n.localize(`DOORMACRO.${trigger}`)
      }
    });
    return data;
  }

  async _updateObject(event, formData) {
    return this.object.update(formData);
  }
}
