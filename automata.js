export default class FiniteAutomata {
  /**
   * Creates a new FiniteAutomata and accepts no parameters.
   * @param {Array.<String>} states - All states
   * @param {Array.<String>} alphabet - Characters from alphabet
   * @param {Object} transitions - Transitions in the form {'0':{'a':['1', '2'], 'b':['1']}, '1':{'a':['0']}}
   * @param {Array.<String>} initialStates - Initial states from states
   * @param {Array.<String>} finalStates - Final states from states
   */
  constructor(states, alphabet, transitions, initialStates, finalStates) {
    this.states = new Set(states);
    this.alphabet = new Set(alphabet);
    this.transitions = this.transitionsFromObject(transitions);
    this.initialStates = new Set(initialStates);
    this.finalStates = new Set(finalStates);
  }

  setStates(states = []) {
    this.states = new Set(states);
  }

  setAlphabet(alphabet = []) {
    this.alphabet = new Set(alphabet);
  }

  setInitialStates(initialStates = []) {
    this.initialStates = new Set(initialStates);
  }

  setFinalStates(finalStates = []) {
    this.finalStates = new Set(finalStates);
  }

  setTransitions(transitions = []) {
    this.transitions = new Map();
    for (const [state, stateTransitions] of transitions) {
      let symbolTransitions = new Map();
      for (const [symbol, endStates] of stateTransitions) {
        symbolTransitions.set(symbol, new Set(endStates));
      }
      this.transitions.set(state, symbolTransitions);
    }
  }

  hasTransition(newInitialState, newSymbol, newFinalStates) {
    if (!this.transitions.has(newInitialState)) return false;
    const symbolTransitions = this.transitions.get(newInitialState);
    if (!symbolTransitions.has(newSymbol)) return false;
    const finalStates = symbolTransitions.get(newSymbol);
    for (let finalState of newFinalStates) {
      if (!finalStates.has(finalState)) return false;
    }
    return true;
  }

  addTransition(initialState, symbol, finalStates) {
    if (this.hasTransition(initialState, symbol, finalStates)) return;

    finalStates = new Set(finalStates);
    if (!this.transitions.has(initialState)) {
      const symbolTransitions = new Map();
      symbolTransitions.set(symbol, finalStates);
      this.transitions.set(initialState, symbolTransitions);
      return;
    }

    const symbolTransitions = this.transitions.get(initialState);

    if (!symbolTransitions.has(symbol)) {
      symbolTransitions.set(symbol, finalStates);
      return;
    }

    const endStates = symbolTransitions.get(symbol);

    for (const finalState of finalStates) {
      endStates.add(finalState);
    }
  }

  removeTransition(initialState, symbol, endStates) {
    if (!this.hasTransition(initialState, symbol, endStates)) return;

    const currentEndStates = this.transitions.get(initialState).get(symbol);

    for (const endState of endStates) {
      currentEndStates.delete(endState);
    }

    // Clean empty transitions

    if (this.transitions.get(initialState).get(symbol).size === 0)
      this.transitions.get(initialState).delete(symbol);

    if (this.transitions.get(initialState).size === 0)
      this.transitions.delete(initialState);
  }

  validate(symbols) {
    let configurationsStack = new StackSet();

    // Fill stack with initial configurations
    for (const initialState of this.initialStates) {
      const labmdaStates = this.lambdaStates(initialState);
      for (const lambdaState of labmdaStates) {
        configurationsStack.push(new Configuration(lambdaState, [...symbols]));
      }
    }

    while (configurationsStack.length > 0) {
      const configuration = configurationsStack.pop();

      // No symbols left -> check if configuration state is a final state or if we can reach some final state with lambda transitions

      if (!configuration.hasSymbols()) {
        const lambdaStates = this.lambdaStates(configuration.state); // reachable states with lambda transitions (including itself)
        for (let lambdaState of lambdaStates) {
          if (this.finalStates.has(lambdaState)) return true; // if some reachable state is a final state, return true
        }
        continue;
      }

      // Symbols left -> add configurations with reachable states by the next symbol in symbols, so we pop that symbol

      if (!this.transitions.has(configuration.state)) continue; // no reachable states

      const symbol = configuration.popSymbol();

      // Check reachable states with symbol transitions
      const symbolTransitions = this.transitions.get(configuration.state);
      if (symbolTransitions.has(symbol)) {
        for (const endState of symbolTransitions.get(symbol)) {
          const lambdaStates = this.lambdaStates(endState); // reachable states with symbol
          for (let lambdaState of lambdaStates) {
            configurationsStack.push(
              new Configuration(lambdaState, [...configuration.symbols])
            ); // add to stack (there is one minus symbol so we are reducing the problem)
          }
        }
      }
    }

    return false;
  }

  deterministic() {
    if (this.isDeterministic()) return this;

    const deterministicAutomata = new FiniteAutomata();

    deterministicAutomata.setAlphabet(this.alphabet);

    const initialStates = this.lambdaStates(this.initialStates);
    deterministicAutomata.setInitialStates([this.statesName(initialStates)]);

    let hasNull = false;
    let stack = [initialStates];

    while (stack.length > 0) {
      const states = stack.pop();

      const statesName = this.statesName(states);
      deterministicAutomata.states.add(statesName);

      if (this.hasFinalState(states)) {
        deterministicAutomata.finalStates.add(statesName);
      }

      for (const symbol of this.alphabet) {
        const endStates = this.endStates(states, symbol);
        const lambdaStates = this.lambdaStates(endStates);

        if (lambdaStates.size === 0) {
          if (!hasNull) {
            deterministicAutomata.addNullState();
            hasNull = true;
          }
          deterministicAutomata.addTransition(statesName, symbol, ["ø"]);
          continue;
        }
        const lambdaStatesName = this.statesName(lambdaStates);
        deterministicAutomata.addTransition(statesName, symbol, [
          lambdaStatesName,
        ]);
        if (!deterministicAutomata.states.has(lambdaStatesName))
          stack.push(lambdaStates);
      }
    }

    return deterministicAutomata;
  }

  hasFinalState(states) {
    for (const state of states) {
      if (this.finalStates.has(state)) return true;
    }
    return false;
  }

  hasInitialState(states) {
    for (const state of states) {
      if (this.initialStates.has(state)) return true;
    }
    return false;
  }

  statesName(states) {
    return [...states].sort().join(",");
  }

  endStates(states, symbol) {
    if (typeof states === "string") states = [states];

    let endStates = [];

    for (const state of states) {
      if (this.transitions.has(state)) {
        const stateTransitions = this.transitions.get(state);
        if (stateTransitions.has(symbol)) {
          endStates.push(...stateTransitions.get(symbol));
        }
      }
    }

    return new Set(endStates);
  }

  lambdaStates(states, includeSources = true) {
    if (typeof states === "string") states = [states];
    states = new Set(states);

    let lambdaStates = new Set();
    let stack = includeSources ? [...states] : [];

    while (stack.length > 0) {
      const state = stack.pop();

      if (lambdaStates.has(state)) continue; // avoid infinite loop
      if (!includeSources && states.has(state)) continue;
      lambdaStates.add(state);

      if (this.transitions.has(state)) {
        const stateTransitions = this.transitions.get(state);
        if (stateTransitions.has("")) {
          const endStates = stateTransitions.get("");
          stack.push(...endStates);
        }
      }
    }

    return lambdaStates;
  }

  addNullState() {
    this.states.add("ø");
    for (const symbol of this.alphabet) {
      this.addTransition("ø", symbol, ["ø"]);
    }
  }

  isDeterministic() {
    if (this.initialStates.size > 1) return false;
    if (this.transitions.size != this.states.size) return false;

    for (const [, symbolTransitions] of this.transitions) {
      if (symbolTransitions.size != this.alphabet.size) return false;
      for (const [, endStates] of symbolTransitions) {
        if (endStates.size > 1) return false;
      }
    }

    return true;
  }

  minimized() {
    function getStateClasses(equivalenceClasses) {
      let stateClasses = new Map();
      for (const [key, states] of equivalenceClasses) {
        for (const state of states) {
          stateClasses.set(state, key);
        }
      }
      return stateClasses;
    }

    const automata = this.isDeterministic() ? this : this.deterministic();

    const minimizedAutomata = new FiniteAutomata();
    minimizedAutomata.setAlphabet(automata.alphabet);

    let equivalenceClasses = [];
    let stateClasses = [];

    let initialEquivalenceClass = new Map();
    initialEquivalenceClass.set("0", automata.finalStates);
    initialEquivalenceClass.set(
      "1",
      new Set(
        [...automata.states].filter((state) => !automata.finalStates.has(state))
      )
    );
    equivalenceClasses.push(initialEquivalenceClass);
    stateClasses.push(getStateClasses(initialEquivalenceClass));

    do {
      const equivalenceClass = new Map();
      for (let state of automata.states) {
        let key = stateClasses.at(-1).get(state);
        for (let symbol of automata.alphabet) {
          const [endState] = automata.transitions.get(state).get(symbol);
          key += stateClasses.at(-1).get(endState);
        }
        const states = equivalenceClass.get(key) || new Set();
        states.add(state);
        equivalenceClass.set(key, states);
      }
      equivalenceClasses.push(equivalenceClass);
      stateClasses.push(getStateClasses(equivalenceClass));
    } while (
      equivalenceClasses.at(-1).size != equivalenceClasses.at(-2).size ||
      equivalenceClasses.at(-1).size == automata.states
    );

    for (const states of equivalenceClasses.at(-1).values()) {
      const stateName = automata.statesName(states);

      minimizedAutomata.states.add(stateName);
      if (automata.hasFinalState(states))
        minimizedAutomata.finalStates.add(stateName);

      if (automata.hasInitialState(states)) {
        minimizedAutomata.setInitialStates([stateName]);
      }

      const [firstState] = states;
      for (const symbol of minimizedAutomata.alphabet) {
        const [endState] = automata.transitions.get(firstState).get(symbol);
        const classNum = stateClasses.at(-1).get(endState);
        const equivalenceClass = equivalenceClasses.at(-1).get(classNum);
        const endStateName = automata.statesName(equivalenceClass);
        minimizedAutomata.addTransition(stateName, symbol, [endStateName]);
      }
    }
    return minimizedAutomata;
  }

  transitionsToObject(transitions) {
    const transitionsObj = {};
    for (const [state, symbols] of transitions) {
      const stateTransitions = {};
      for (const [symbol, finalStates] of symbols) {
        stateTransitions[symbol] = [...finalStates];
      }
      transitionsObj[state] = stateTransitions;
    }
    return transitionsObj;
  }

  toJSON() {
    const automataObj = {
      states: [...this.states],
      alphabet: [...this.alphabet],
      initialStates: [...this.initialStates],
      finalStates: [...this.finalStates],
      transitions: this.transitionsToObject(this.transitions),
    };
    return JSON.stringify(automataObj, null, 2);
  }

  toDOT() {
    let transitionsMap = new Map();

    for (const [state, symbolTransitions] of this.transitions) {
      for (let [symbol, endStates] of symbolTransitions) {
        for (const endState of endStates) {
          if (symbol === "") symbol = "λ";
          const key = `"${state}" -> "${endState}"`;
          const symbols = transitionsMap.get(key);
          if (symbols === undefined) {
            transitionsMap.set(key, [symbol]);
          } else {
            symbols.push(symbol);
          }
        }
      }
    }

    const initialAndFinalStates = new Set(
      [...this.initialStates].filter((elem) => this.finalStates.has(elem))
    );
    const onlyFinalStates = new Set(
      [...this.finalStates].filter((elem) => !initialAndFinalStates.has(elem))
    );
    const onlyInitialStates = new Set(
      [...this.initialStates].filter((elem) => !initialAndFinalStates.has(elem))
    );
    const normalStates = new Set(
      [...this.states].filter(
        (elem) => !onlyInitialStates.has(elem) && !onlyFinalStates.has(elem)
      )
    );

    return `
digraph finite_state_machine {
  fontname="Helvetica,Arial,sans-serif"
  node [fontname="Helvetica,Arial,sans-serif"]
  edge [fontname="Helvetica,Arial,sans-serif"]
  rankdir=LR;
  node [shape = doublecircle style = solid]; ${[...onlyFinalStates]
    .map((x) => `"${x}"`)
    .join(" ")} ${onlyFinalStates.size > 0 ? ";" : ""}
  node [shape = doublecircle style = dashed]; ${[...initialAndFinalStates]
    .map((x) => `"${x}"`)
    .join(" ")} ${initialAndFinalStates.size > 0 ? ";" : ""}
  node [shape = circle style = dashed]; ${[...onlyInitialStates]
    .map((x) => `"${x}"`)
    .join(" ")} ${onlyInitialStates.size > 0 ? ";" : ""}
  node [shape = circle style = solid]; ${[...normalStates]
    .map((x) => `"${x}"`)
    .join(" ")} ${normalStates.size > 0 ? ";" : ""}
  ${[...transitionsMap.keys()]
    .map((key) => `${key} [label="${transitionsMap.get(key).join(",")}"]`)
    .join("\n")}
}`;
  }

  transitionsFromObject(obj) {
    let transitions = new Map();
    if (!obj) return transitions;
    for (const [state, symbols] of Object.entries(obj)) {
      const stateTransitions = new Map();
      for (const [symbol, finalStates] of Object.entries(symbols)) {
        stateTransitions.set(symbol, new Set(finalStates));
      }
      transitions.set(state, stateTransitions);
    }
    return transitions;
  }

  fromJSON(json) {
    const automataObj = JSON.parse(json);
    this.states = new Set(automataObj.states);
    this.alphabet = new Set(automataObj.alphabet);
    this.initialStates = new Set(automataObj.initialStates);
    this.finalStates = new Set(automataObj.finalStates);
    this.transitions = this.transitionsFromObject(automataObj.transitions);
  }
}

class Configuration {
  constructor(state, symbols) {
    this.state = state;
    this.symbols = symbols;
  }

  hasSymbols() {
    return this.symbols.length > 0;
  }

  popSymbol() {
    return this.symbols.shift();
  }

  toString() {
    return `${this.state}${this.symbols.join("")}`;
  }
}

class StackSet {
  constructor() {
    this.arr = [];
    this.length = 0;
    this.hashSet = new Set();
  }

  push(obj) {
    const hash = obj.toString();
    if (this.hashSet.has(hash)) return;

    this.length++;
    this.hashSet.add(hash);
    this.arr.push(obj);
  }

  pop() {
    this.length--;
    const obj = this.arr.pop();
    const hash = obj.toString();
    this.hashSet.delete(hash);
    return obj;
  }
}
