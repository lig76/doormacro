import {MODULE, TRIGGERS} from "./scripts/constants.mjs";
import {callMacro, DoorMacroConfig} from "./scripts/doormacro.mjs";

// Create a button in a door's header.
Hooks.on("getWallConfigHeaderButtons", (config, buttons) => {
  const isDoor = config.object.door !== CONST.WALL_DOOR_TYPES.NONE;
  if (!isDoor) return;

  buttons.unshift({
    class: MODULE,
    icon: "fa-solid fa-door-open",
    onclick: () => new DoorMacroConfig(config.object).render(true)
  });
});

Hooks.once("setup", () => {
  WallDocument.prototype.callMacro = async function(type = "never", options = {}) {
    return callMacro(this, type, options);
  }
});

// save previous state of door.
Hooks.on("preUpdateWall", (wallDoc, update, context, userId) => {
  const {WALL_DOOR_STATES: DS, WALL_DOOR_TYPES: DOOR} = CONST;

  // ignore this if the Door type involves toggling between wall and door.
  if (wallDoc.door === DOOR.NONE || update.door === DOOR.NONE) return;

  const hasDS = foundry.utils.hasProperty(update, "ds");
  const hasDOOR = foundry.utils.hasProperty(update, "door");

  context[MODULE] = {
    [wallDoc.id]: {
      whenClosed: (wallDoc.ds === DS.OPEN) && (hasDS && (update.ds === DS.CLOSED)),
      whenOpened: (wallDoc.ds !== DS.OPEN) && (hasDS && (update.ds === DS.OPEN)),
      whenHidden: (wallDoc.door !== DOOR.SECRET) && (hasDOOR && (update.door === DOOR.SECRET)),
      whenRevealed: (wallDoc.door === DOOR.SECRET) && (hasDOOR && (update.door !== DOOR.SECRET)),
      whenLocked: (wallDoc.ds !== DS.LOCKED) && (hasDS && (update.ds === DS.LOCKED)),
      whenUnlocked: (wallDoc.ds === DS.LOCKED) && (hasDS && (update.ds !== DS.LOCKED))
    }
  }
});

Hooks.on("updateWall", (wallDoc, update, context, userId) => {
  const {id: gmId} = game.users.find(user => {
    return user.active && user.isGM;
  }) ?? {};
  TRIGGERS.map(trigger => {
    const property = `${MODULE}.${wallDoc.id}.${trigger}`;
    const triggered = foundry.utils.getProperty(context, property);
    if (triggered) callMacro(wallDoc, trigger, {gmId, userId});
  });
});
