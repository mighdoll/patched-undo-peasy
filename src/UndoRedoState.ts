import { Action, action } from "patched-peasy";
import _ from "lodash";
import { AnyObject, findGetters } from "./UndoUtils";
import { removeDeep } from "./Utils";
import { KeyPathFilter } from "./UndoRedoMiddleware";

/**
 * WithUndo defines actions and history state to support Undo/Redo.
 * 
 * The root application model interface should extend WithUndo.
 */
export interface WithUndo extends WithUndoHistory {
  undoSave: Action<WithUndo, UndoParams | void>;
  undoReset: Action<WithUndo, UndoParams | void>;
  undoUndo: Action<WithUndo, UndoParams | void>;
  undoRedo: Action<WithUndo, UndoParams | void>;
}

/**
 * undoable adds state and action fields to a model instance support undo.
 * 
 * The root application model should be wrapped in undoable().
 * @param model application model
 */
export function undoable<M extends {}>(model: M): ModelWithUndo<M> {
  return { ...model, undoHistory: undoModel, undoSave, undoUndo, undoRedo, undoReset };
}

interface UndoParams {
  noSaveKeys: KeyPathFilter;
  state: WithUndo;
}

interface WithUndoHistory {
  undoHistory: UndoHistory;
}

export type ModelWithUndo<T> = {
  [P in keyof T]: T[P];
} &
  WithUndo;

export interface UndoHistory {
  undo: {}[];
  redo: {}[];
  current?: {};
  computeds?: string[][]; // paths of all computed properties in the model (not persisted in the history)
}

const undoSave = action<WithUndo, UndoParams>((draftState, params) => {
  const history = draftState.undoHistory;
  history.redo.length = 0;
  if (history.current) {
    history.undo.push(history.current);
  }
  saveCurrent(draftState as WithUndo, params);
});

function saveCurrent(draftState: WithUndo, params: UndoParams) {
  const history = draftState.undoHistory;
  if (!history.computeds) {
    history.computeds = findGetters(params.state);
  }
  const computeds = history.computeds!;

  const filteredCopy: AnyObject = removeDeep(draftState, (_value, key, path) => {
    const fullPath = path.concat([key]);
    const isComputed = !!computeds.find((computedPath) =>
      _.isEqual(fullPath, computedPath)
    );
    return isComputed || params.noSaveKeys(key, path);
  });

  delete filteredCopy["undoHistory"];
  draftState.undoHistory.current = filteredCopy;
}

const undoReset = action<WithUndo, UndoParams>((draftState, params) => {
  const history = draftState.undoHistory;
  history.redo.length = 0;
  history.undo.length = 0;
  saveCurrent(draftState as WithUndo, params);
});

const undoUndo = action<WithUndo, UndoParams>((draftState, params) => {
  const history = draftState.undoHistory;
  const undoState = history.undo.pop();
  if (undoState) {
    if (history.current) {
      history.redo.push(history.current);
    }
    history.current = undoState;

    Object.assign(draftState, undoState);
  }
});

const undoRedo = action<WithUndo, UndoParams>((draftState) => {
  const history = draftState.undoHistory;
  const redoState = history.redo.pop();
  if (redoState) {
    if (history.current) {
      history.undo.push(history.current);
    }
    history.current = redoState;

    Object.assign(draftState, redoState);
  }
});

export const undoModel: UndoHistory = { undo: [], redo: [] };
