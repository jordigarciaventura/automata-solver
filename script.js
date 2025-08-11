import FiniteAutomata from "./automata.js";
import * as d3 from "d3";
import "d3-graphviz";
import { Canvg } from "canvg";

let inputAutomata = new FiniteAutomata();

// SELECTORS

const statesInput = document.getElementById("states");
const alphabetInput = document.getElementById("alphabet");
const initialStatesInput = document.getElementById("initial-states");
const finalStatesInput = document.getElementById("final-states");
const transitionsDiv = document.getElementById("transitions");
const fromStateInput = document.getElementById("from-state");
const transitionInputDiv = document.getElementById("transition");
const symbolInput = document.getElementById("symbol");
const toStatesInput = document.getElementById("to-states");

const downloadOption = document.getElementById("download-option");
const uploadOption = document.getElementById("upload-option");
const resetOption = document.getElementById("reset-option");

const inputNav = document.getElementById("input-nav");
const minimizedNav = document.getElementById("minimized-nav");

const clearButton = document.getElementById("clear");

const inputFullscreenButton = document.getElementById("input-graph-fullscreen");
const inputSvgButton = document.getElementById("input-svg");
const inputPngButton = document.getElementById("input-png");

const minimizedFullscreenButton = document.getElementById(
  "minimized-graph-fullscreen"
);
const minimizedSvgButton = document.getElementById("minimized-svg");
const minimizedPngButton = document.getElementById("minimized-png");

const inputGraphContainer = document.getElementById("input-graph-container");
const minimizedGraphContainer = document.getElementById(
  "minimized-graph-container"
);

const validateInput = document.getElementById("validate");

const sidebarDiv = document.getElementById("sidebar");
const propertiesPanel = document.getElementById("properties-panel");
const contentDiv = document.getElementById("content");

const propertiesNav = document.getElementById("properties-nav");
const graphNav = document.getElementById("graph-nav");

const inputGraph = document.getElementById("input-graph");
const minimizedGraph = document.getElementById("minimized-graph");

// GLOBAL VARIABLES

let inputGraphviz;
let minimizedGraphviz;

let selectedOption = "input";
let maximizedGraph = "";
let selectedView = "properties";

let validFromState = false;
let validSymbol = true;
let validToStates = false;

// EVENTS
resetOption.addEventListener("click", () => {
  loadSample();
});

[
  statesInput,
  alphabetInput,
  initialStatesInput,
  finalStatesInput,
  fromStateInput,
  symbolInput,
  toStatesInput,
  validateInput,
].forEach((element) => {
  element.addEventListener("keypress", (e) => {
    if (e.key === "Enter") e.target.blur();
  });
});

inputNav.addEventListener("click", () => {
  if (selectedOption === "minimized") {
    loadProperties(inputAutomata.toJSON());
    unlockProperties();
    selectedOption = "input";
    inputNav.classList.toggle("menu-selected");
    minimizedNav.classList.toggle("menu-selected");
    inputGraphContainer.classList.add("selected-graph");
    minimizedGraphContainer.classList.remove("selected-graph");
  }
});

minimizedNav.addEventListener("click", () => {
  if (selectedOption === "input") {
    loadProperties(inputAutomata.minimized().toJSON());
    lockProperties();
    selectedOption = "minimized";
    inputNav.classList.toggle("menu-selected");
    minimizedNav.classList.toggle("menu-selected");
    inputGraphContainer.classList.remove("selected-graph");
    minimizedGraphContainer.classList.add("selected-graph");
  }
});

clearButton.addEventListener("click", () => {
  inputAutomata = new FiniteAutomata();
  loadProperties();
  plot(false);
});

statesInput.addEventListener("focusout", () => {
  const states = getInput(statesInput.value);
  inputAutomata.setStates(states);

  checkInitialStates();
  checkFinalStates();
  removeInvalidTransitions();
  checkFromState();
  checkToStates();
  checkTransition();
  plot();
});

alphabetInput.addEventListener("focusout", () => {
  const alphabet = getInput(alphabetInput.value);
  inputAutomata.setAlphabet(alphabet);
  removeInvalidTransitions();
  checkSymbol();
  checkTransition();
  plot();
});

initialStatesInput.addEventListener("focusout", () => {
  const initialStates = getInput(initialStatesInput.value);

  if (!assertSetContains(inputAutomata.states, initialStates)) {
    initialStatesInput.classList.add("textbox-error");
    return;
  }

  initialStatesInput.classList.remove("textbox-error");
  inputAutomata.setInitialStates(initialStates);
  plot();
});

finalStatesInput.addEventListener("focusout", () => {
  const finalStates = getInput(finalStatesInput.value);

  if (!assertSetContains(inputAutomata.states, new Set(finalStates))) {
    finalStatesInput.classList.add("textbox-error");
    return;
  }

  finalStatesInput.classList.remove("textbox-error");
  inputAutomata.setFinalStates(finalStates);
  plot();
});

fromStateInput.addEventListener("focusout", () => {
  checkFromState();
  checkTransition();
});

symbolInput.addEventListener("focusout", () => {
  checkSymbol();
  checkTransition();
});

toStatesInput.addEventListener("focusout", () => {
  checkToStates();
  checkTransition();
});

downloadOption.addEventListener("click", () => {
  download(inputAutomata.toJSON(), "automata.json", "text/json");
});

uploadOption.addEventListener("click", async () => {
  await upload().then((json) => {
    loadProperties(json);
    inputAutomata.fromJSON(json);
    plot(false);
  });
});

validateInput.addEventListener("input", validate);

inputFullscreenButton.addEventListener("click", () => {
  if (maximizedGraph === "") {
    maximizedGraph = "input";
    changeIcon(inputFullscreenButton, "minimize");
    minimizedGraphContainer.classList.add("hide");
    minimizedGraphContainer.classList.remove("show");
  } else {
    maximizedGraph = "";
    changeIcon(inputFullscreenButton, "maximize");
    minimizedGraphContainer.classList.remove("hide");
    minimizedGraphContainer.classList.add("show");
  }
});

minimizedFullscreenButton.addEventListener("click", () => {
  if (maximizedGraph === "") {
    maximizedGraph = "minimized";
    changeIcon(minimizedFullscreenButton, "minimize");
    inputGraphContainer.classList.remove("show");
    inputGraphContainer.classList.add("hide");
  } else {
    maximizedGraph = "";
    changeIcon(minimizedFullscreenButton, "maximize");
    inputGraphContainer.classList.remove("hide");
    inputGraphContainer.classList.add("show");
  }
});

propertiesNav.addEventListener("click", () => {
  if (selectedView === "graph") {
    selectedView = "properties";
    propertiesNav.classList.add("menu-selected");
    graphNav.classList.remove("menu-selected");

    propertiesPanel.classList.add("panel-selected");
    contentDiv.classList.remove("panel-selected");
    sidebarDiv.classList.remove("compact");
  }
});

graphNav.addEventListener("click", () => {
  if (selectedView === "properties") {
    selectedView = "graph";
    graphNav.classList.add("menu-selected");
    propertiesNav.classList.remove("menu-selected");

    propertiesPanel.classList.remove("panel-selected");
    contentDiv.classList.add("panel-selected");
    sidebarDiv.classList.add("compact");
  }
});

inputPngButton.addEventListener("click", () => {
  inputGraphviz.resetZoom();
  downloadPNG(inputGraph.getElementsByTagName("svg")[0], "inputGraph");
});

inputSvgButton.addEventListener("click", () => {
  inputGraphviz.resetZoom();
  downloadSVG(inputGraph.getElementsByTagName("svg")[0], "inputGraph");
});

minimizedPngButton.addEventListener("click", () => {
  minimizedGraphviz.resetZoom();
  downloadPNG(minimizedGraph.getElementsByTagName("svg")[0], "minimizedGraph");
});

minimizedSvgButton.addEventListener("click", () => {
  minimizedGraphviz.resetZoom();
  downloadSVG(minimizedGraph.getElementsByTagName("svg")[0], "minimizedGraph");
});

// FUNCTIONS

function loadSample() {
  const automataExampleJSON = `
{
  "states": [
    "1",
    "2",
    "3",
    "4"
  ],
  "alphabet": [
    "a",
    "b"
  ],
  "initialStates": [
    "1",
    "3"
  ],
  "finalStates": [
    "1",
    "3"
  ],
  "transitions": {
    "1": {
      "a": [
        "2"
      ],
      "": [
        "3"
      ]
    },
    "2": {
      "a": [
        "1"
      ]
    },
    "3": {
      "": [
        "1"
      ],
      "b": [
        "4"
      ]
    },
    "4": {
      "b": [
        "3"
      ]
    }
  }
}
`;

  inputAutomata.fromJSON(automataExampleJSON);
  loadProperties(automataExampleJSON);
  plot(false);

  validateInput.value = "a a b b";
  validate();
}

function assertSetContains(set, subset) {
  return [...subset].every((value) => set.has(value));
}

function getInput(text) {
  const words = text.split(" ");
  return new Set(words.filter((w) => w !== ""));
}

const transition = d3.transition().duration(2000).ease(d3.easeLinear);

function attributer(datum, index, nodes) {
  var selection = d3.select(this);
  if (datum.tag == "svg") {
    datum.attributes = {
      ...datum.attributes,
      width: "100%",
      height: "100%",
    };
    const px2pt = 3 / 4;

    const graphWidth = datum.attributes.viewBox.split(" ")[2] / px2pt;
    const graphHeight = datum.attributes.viewBox.split(" ")[3] / px2pt;

    const w = graphWidth / 0.6;
    const h = graphHeight / 0.6;

    const x = -(w - graphWidth) / 2;
    const y = -(h - graphHeight) / 2;

    const viewBox = `${x * px2pt} ${y * px2pt} ${w * px2pt} ${h * px2pt}`;
    selection.attr("viewBox", viewBox);
    datum.attributes.viewBox = viewBox;
  }
}

function plotInput(animated = true) {
  if (!inputGraphviz) {
    inputGraphviz = d3.select("#input-graph").graphviz().attributer(attributer);
    if (animated) {
      inputGraphviz.transition(transition);
    }
  }
  inputGraphviz.renderDot(inputAutomata.toDOT());
}

function plotMinimized(animated = true) {
  if (!minimizedGraphviz) {
    minimizedGraphviz = d3
      .select("#minimized-graph")
      .graphviz()
      .attributer(attributer);
    if (animated) {
      minimizedGraphviz.transition(transition);
    }
  }
  minimizedGraphviz.renderDot(inputAutomata.minimized().toDOT());
}

function plot(animated = true) {
  validate();
  plotInput(animated);
  plotMinimized(animated);
}

function checkInitialStates() {
  const initialStates = getInput(initialStatesInput.value);
  if (initialStates === "") return;
  if (!assertSetContains(inputAutomata.states, initialStates)) {
    initialStatesInput.classList.add("textbox-error");
    inputAutomata.setInitialStates();
  } else {
    initialStatesInput.classList.remove("textbox-error");
  }
}

function checkFinalStates() {
  const finalStates = getInput(finalStatesInput.value);
  if (finalStates === "") return;
  if (!assertSetContains(inputAutomata.states, finalStates)) {
    finalStatesInput.classList.add("textbox-error");
    inputAutomata.setFinalStates();
  } else {
    finalStatesInput.classList.remove("textbox-error");
  }
}

function checkFromState() {
  const value = fromStateInput.value.trim();

  if (value === "") return;

  validFromState = inputAutomata.states.has(value);

  if (!validFromState) {
    fromStateInput.classList.add("textbox-error");
    return false;
  }

  fromStateInput.classList.remove("textbox-error");
  return true;
}

function checkSymbol() {
  const value = symbolInput.value.trim();
  validSymbol = inputAutomata.alphabet.has(value) || value === "";

  if (!validSymbol) {
    symbolInput.classList.add("textbox-error");
    return false;
  }

  symbolInput.classList.remove("textbox-error");
  return true;
}

function checkToStates() {
  const values = getInput(toStatesInput.value);

  if (values.size === 0) return;

  validToStates =
    assertSetContains(inputAutomata.states, values) && values.size !== 0;

  if (!validToStates) {
    toStatesInput.classList.add("textbox-error");
    return false;
  }

  toStatesInput.classList.remove("textbox-error");
  return true;
}

function checkTransition() {
  if (!validFromState || !validSymbol || !validToStates) return;

  inputAutomata.addTransition(
    fromStateInput.value.trim(),
    symbolInput.value.trim(),
    getInput(toStatesInput.value)
  );
  addTransitionElement(
    fromStateInput.value,
    symbolInput.value,
    toStatesInput.value
  );
  plot();

  validFromState = false;
  validSymbol = true;
  validToStates = false;

  fromStateInput.value = "";
  symbolInput.value = "";
  toStatesInput.value = "";
}

function onClose(e) {
  const transitionDiv = e.target.closest(".transition");
  const [fromStateInput, symbolInput, toStatesInput] =
    transitionDiv.getElementsByTagName("input");
  inputAutomata.removeTransition(
    fromStateInput.value,
    symbolInput.value,
    toStatesInput.value
  );
  transitionDiv.remove();
  plot();
}

function removeTransitionsElements() {
  const transitions = document.querySelectorAll(".transition");

  for (const transition of transitions) {
    transition.remove();
  }
}

function removeInvalidTransitions() {
  const transitions = document.querySelectorAll(".transition");

  for (const transition of transitions) {
    const [fromStateInput, symbolInput, toStatesInput] =
      transition.getElementsByTagName("input");

    if (!inputAutomata.states.has(fromStateInput.value)) {
      inputAutomata.removeTransition(
        fromStateInput.value,
        symbolInput.value,
        toStatesInput.value
      );
      transition.remove();
      continue;
    }

    if (
      !assertSetContains(inputAutomata.states, getInput(toStatesInput.value))
    ) {
      inputAutomata.removeTransition(
        fromStateInput.value,
        symbolInput.value,
        toStatesInput.value
      );
      transition.remove();
      continue;
    }

    if (!inputAutomata.alphabet.has(symbolInput.value) && symbolInput != "") {
      inputAutomata.removeTransition(
        fromStateInput.value,
        symbolInput.value,
        toStatesInput.value
      );
      transition.remove();
      continue;
    }
  }
}

function addTransitionElement(fromStateValue, symbolValue, toStatesValue) {
  const transitionDiv = document.createElement("div");
  transitionDiv.classList.add("transition");

  const newFromStateInput = document.createElement("input");
  newFromStateInput.classList.add("textbox", "text-centered");
  newFromStateInput.type = "text";
  newFromStateInput.value = fromStateValue;
  newFromStateInput.disabled = true;

  const newSymbolInput = document.createElement("input");
  newSymbolInput.classList.add("textbox", "text-centered");
  newSymbolInput.type = "text";
  newSymbolInput.value = symbolValue;
  newSymbolInput.disabled = true;

  const rightArrowDiv = document.createElement("div");
  const rightArrowIcon = getIconElement("right-arrow");
  rightArrowIcon.classList.add("icon-16");
  rightArrowDiv.appendChild(rightArrowIcon);

  const newToStatesInput = document.createElement("input");
  newToStatesInput.classList.add("textbox", "text-centered");
  newToStatesInput.type = "text";
  newToStatesInput.value = toStatesValue;
  newToStatesInput.disabled = true;

  const closeButton = document.createElement("a");
  closeButton.href = "#";
  closeButton.classList.add("close");
  const closeIconDiv = document.createElement("div");
  const closeIcon = getIconElement("cross");
  closeIcon.classList.add("icon-16");
  closeIconDiv.appendChild(closeIcon);
  closeButton.appendChild(closeIconDiv);

  closeButton.addEventListener("click", onClose);

  transitionDiv.appendChild(newFromStateInput);
  transitionDiv.appendChild(newSymbolInput);
  transitionDiv.appendChild(rightArrowDiv);
  transitionDiv.appendChild(newToStatesInput);
  transitionDiv.appendChild(closeButton);

  transitionsDiv.appendChild(transitionDiv);
  transitionsDiv.insertBefore(transitionDiv, transitionInputDiv);

  fromStateInput.focus();
}

function changeIcon(button, id) {
  const svg = button.getElementsByTagName("svg")[0];
  const classList = svg.classList;
  svg.remove();
  const newSvg = getIconElement(id);
  newSvg.classList = classList;
  button.appendChild(newSvg);
}

function getIconElement(id) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + id);
  svg.appendChild(use);
  return svg;
}

function loadProperties(json) {
  removeTransitionsElements();

  try {
    const obj = JSON.parse(json);
    statesInput.value = obj.states.join(" ");
    alphabetInput.value = obj.alphabet.join(" ");
    initialStatesInput.value = obj.initialStates.join(" ");
    finalStatesInput.value = obj.finalStates.join(" ");

    if (Object.keys(obj.transitions).length > 0) {
      for (const [fromState, symbols] of Object.entries(obj.transitions)) {
        for (const [symbol, toStates] of Object.entries(symbols)) {
          addTransitionElement(fromState, symbol, toStates.join(" "));
        }
      }
    }
  } catch (e) {
    statesInput.value = "";
    alphabetInput.value = "";
    initialStatesInput.value = "";
    finalStatesInput.value = "";
  }
}

function lockProperties() {
  [statesInput, alphabetInput, initialStatesInput, finalStatesInput].forEach(
    (element) => {
      element.disabled = true;
    }
  );

  for (const closeButton of transitionsDiv.getElementsByTagName("a")) {
    closeButton.style.visibility = "hidden";
  }

  transitionInputDiv.style.display = "none";
}

function unlockProperties() {
  [statesInput, alphabetInput, initialStatesInput, finalStatesInput].forEach(
    (element) => {
      element.disabled = false;
    }
  );

  for (const closeButton of transitionsDiv.getElementsByTagName("a")) {
    closeButton.style.visibility = "visible";
  }

  transitionInputDiv.style.display = "flex";
}

function downloadPNG(svg, filename) {
  const canvas = document.createElement('canvas');
  const width = svg.width.baseVal.value || svg.getAttribute('width') || 800;
  const height = svg.height.baseVal.value || svg.getAttribute('height') || 600;
  canvas.width = parseInt(width);
  canvas.height = parseInt(height);

  const ctx = canvas.getContext('2d');
  const v = Canvg.fromString(ctx, svg.outerHTML);
  v.render().then(() => {
    const link = document.createElement('a');
    link.download = filename + '.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function downloadSVG(svg, filename) {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svg);

  if (!svgString.startsWith('<?xml')) {
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
  }

  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function download(data, filename, type) {
  const file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob)
    window.navigator.msSaveOrOpenBlob(file, filename);
  else {
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

function upload() {
  return new Promise((res) => {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = (e) => {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");

      reader.onload = (readerEvent) => {
        res(readerEvent.target.result);
      };
    };

    input.click();
  });
}

function validate() {
  const symbols = validateInput.value.split(" ").filter((i) => i);
  if (inputAutomata.validate(symbols)) {
    validateInput.classList.add("valid");
    validateInput.classList.remove("invalid");
  } else {
    validateInput.classList.add("invalid");
    validateInput.classList.remove("valid");
  }
}

// SAVE

window.onbeforeunload = save;

function save() {
  window.localStorage.setItem("automata", inputAutomata.toJSON());
  window.localStorage.setItem("validate", validateInput.value);
}

function load() {
  const savedAutomata = localStorage.getItem("automata");
  if (savedAutomata) {
    const savedValidate = localStorage.getItem("validate");
    inputAutomata.fromJSON(savedAutomata);
    loadProperties(savedAutomata);
    plot(false);

    validateInput.value = savedValidate;
    validate();
  } else {
    loadSample();
  }
}

load();
