Undo/Redo support for [easy peasy](https://easy-peasy.now.sh/).

_`patched-undo-peasy` depends on an [easy peasy fork](https://github.com/mighdoll/patched-peasy). (but modifying undo-peasy to depend on stock easy-peasy should be straightforward.)_

## Usage

1. Attach `undoRedoMiddleWare` in `createStore`.
    ```
    const store = createStore(appModel, {
      middleware: [undoRedo()],
    });
    ```
1. If using typescript, the root application model should extend `WithUndo`. 
`WithUndo` will add types for undo actions and undo history to your root model.
    ```
      interface Model extends WithUndo {
        count: number;
        increment: Action<Model>;
      }
    ```
1. Wrap the root application instance in `undoable`. 
`undoable` will add types for undo actions and undo history to your root model.
    ```
    const appModel: Model = undoable({
      count: 0,
      increment: action((state) => {
        state.count++;
      }),
    });
    ```
1. Profit
    ```
    const undoAction = useStoreActions((actions) => actions.undoUndo);
    ```


## Supported Actions
* **`undoUndo`** - restore state to the most recently saved version.
* **`undoRedo`** - restore state to the most recently undone version.
* `undoSave` - save current application state to undo history. 
undoSave is generated automatically by the middleware, but in rare cases it's useful to save manually.
* `undoReset` - erases saved undo/redo history and saves the current state.

## Configuration
The `undoRedo()` middleware function accepts an optional configuration object.
* `noSaveActions` - a function that tells undoRedo to not save certain actions to undo/redo history.
* `noSaveKeys` - a function tthat tells undoRedo not to save certain keys inside the state model 
to undo/redo history. e.g. view state in the model.
