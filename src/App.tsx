import * as React from "react";
import "./styles.css";

export enum Action {
  ADD = "ADD",
  DELETE = "DELETE",
  UNDO = "UNDO",
  REDO = "REDO",
  CLEAR = "CLEAR"
}

type Commit = { value: string; action: Action; position: number };

type State = {
  todoList: Array<string>;
  commitHistory: Array<Commit>;
  undoHistory: Array<Commit>;
};

const initialState: State = {
  todoList: [],
  commitHistory: [],
  undoHistory: []
};

const getNextAction = (commit: Commit): Commit => ({
  ...commit,
  action: commit.action === Action.ADD ? Action.DELETE : Action.ADD
});

type Actions =
  | {
      type: Action.ADD;
      payload: string;
    }
  | {
      type: Action.DELETE;
      payload: number;
    }
  | { type: Action.UNDO | Action.REDO | Action.CLEAR };

export const reducer = (state: State, action: Actions): State => {
  switch (action.type) {
    case Action.ADD: {
      console.log(JSON.stringify(state, null, 2));
      const reconcilledCommitHistoryChunk = state.undoHistory.map((commit) => ({
        ...commit,
        action: Action.UNDO
      }));
      return {
        todoList: state.todoList.concat(action.payload),
        commitHistory: state.commitHistory.concat([
          ...reconcilledCommitHistoryChunk,
          {
            action: action.type,
            position: state.todoList.length,
            value: action.payload
          }
        ]),
        undoHistory: []
      };
    }
    case Action.DELETE: {
      const reconcilledCommitHistoryChunk = state.undoHistory.map(
        getNextAction
      );
      return {
        todoList: state.todoList.filter((_, index) => index !== action.payload),
        commitHistory: state.commitHistory.concat([
          ...reconcilledCommitHistoryChunk,
          {
            action: action.type,
            position: action.payload,
            value: state.todoList[action.payload]
          }
        ]),
        undoHistory: []
      };
    }
    case Action.UNDO: {
      console.log({ commitHistory: state.commitHistory });
      const filteredCommitHistory = state.commitHistory.filter(
        (e) => e.action !== Action.UNDO
      );
      const lastCommit = filteredCommitHistory.pop();
      const nextCommit = getNextAction(lastCommit!);
      console.log({ nextCommit });
      const updatedTodoList =
        nextCommit.action === Action.ADD
          ? state.todoList
              .slice(0, nextCommit.position)
              .concat(
                nextCommit.value,
                state.todoList.slice(nextCommit.position)
              )
          : state.todoList.filter((_, index) => index !== nextCommit.position);
      console.log(updatedTodoList);
      return {
        todoList: updatedTodoList,
        commitHistory: filteredCommitHistory,
        undoHistory: state.undoHistory.concat(lastCommit!)
      };
    }
    case Action.REDO: {
      const nextCommit = state.undoHistory.pop() as Commit;
      const updatedTodoList =
        nextCommit.action === Action.ADD
          ? state.todoList
              .slice(0, nextCommit.position)
              .concat(
                nextCommit.value,
                state.todoList.slice(nextCommit.position)
              )
          : state.todoList.filter((_, index) => index !== nextCommit.position);

      return {
        todoList: updatedTodoList,
        commitHistory: state.commitHistory.concat(nextCommit),
        undoHistory: state.undoHistory
      };
    }
    case Action.CLEAR:
    default: {
      return initialState;
    }
  }
};

export default function App() {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [formState, setFormState] = React.useState("");

  return (
    <div className="App">
      <div className="todo">TODO ITEMS</div>
      <div>
        <form
          onSubmit={(e) => [
            e.preventDefault(),
            dispatch({ type: Action.ADD, payload: formState })
          ]}
        >
          <input
            className="add"
            id="add"
            required
            minLength={3}
            defaultValue={formState}
            onChange={(e) => setFormState(e.target.value)}
            type="text"
            placeholder="Enter Todo"
          />

          <button
            className="extra"
            onClick={(e: any) => [
              e.preventDefault(),
              dispatch({ type: Action.ADD, payload: formState })
            ]}
          >
            ADD
          </button>
        </form>
      </div>
      <div className="container">
        <button
          disabled={!state.commitHistory.length}
          onClick={() => dispatch({ type: Action.UNDO })}
        >
          Undo
        </button>
        <button
          disabled={!state.undoHistory.length}
          onClick={() => dispatch({ type: Action.REDO })}
        >
          Redo
        </button>
        <button
          disabled={!state.todoList.length}
          onClick={() => dispatch({ type: Action.CLEAR })}
        >
          Clear
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {state.todoList.map((value, index) => (
          <div key={value + index} className="delete">
            <span className="del">{value}</span>
            <button
              className="ddd"
              onClick={() => dispatch({ type: Action.DELETE, payload: index })}
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
