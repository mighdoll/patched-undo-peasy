import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";
import { replaceUndefined } from "../util/Utils";

/*
TODO 
 * separate undoredo into its own project
 * clean up for review
 * add option for max number undo elements
*/

export interface UndoRedoConfig {
  noSaveActions?: ActionFilter;
  noSaveKeys?: KeyPathFilter;
}

export const undoDefaults = {
  noSaveActions: (_str: string) => false,
  noSaveKeys: (_str: string, _path: string[]) => false,
};

export type ActionFilter = (actionType: string) => boolean;
export type KeyPathFilter = (key: string, path: string[]) => boolean;

export function undoRedo(config: UndoRedoConfig = {}): Middleware {
  const { noSaveActions, noSaveKeys } = replaceUndefined(config, undoDefaults);
  const result = (api: MiddlewareAPI) => (next: Dispatch<AnyAction>) => (
    action: AnyAction
  ) => {
    if (noSaveActions(action.type) || alwaysSkipAction(action.type)) {
      return next(action);
    } else if (undoAction(action.type)) {
      const state = api.getState();
      const enhancedAction = { ...action, payload: {noSaveKeys, state} };
      return next(enhancedAction);
    } else {
      const result = next(action);
      api.dispatch({ type: "@action.undoSave" });
      return result;
    }
  };

  return result;
}

function alwaysSkipAction(actionType: string): boolean {
  return actionType === "@action.ePRS" || actionType === "@@INIT";
}

function undoAction(actionType: string): boolean {
  return (
    actionType === "@action.undoSave" ||
    actionType === "@action.undoReset" ||
    actionType === "@action.undoUndo" ||
    actionType === "@action.undoRedo"
  );
}
