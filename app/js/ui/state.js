// app/js/ui/state.js

export function createStore(reducer, initialState) {
    let state = initialState;
    const listeners = [];

    function getState() {
        return state;
    }

    function dispatch(action) {
        state = reducer(state, action);
        listeners.forEach(listener => listener());
    }

    function subscribe(listener) {
        listeners.push(listener);
        // Return an unsubscribe function
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }

    return { getState, dispatch, subscribe };
}
