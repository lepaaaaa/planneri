const STORAGE_KEY = "planneri-demo-v1";

const defaultState = {
  columns: [
    {
      id: "upcoming",
      title: "Tulevat tehtävät",
      tasks: [
        { id: "task-inventory", title: "Inventaario" }
      ]
    },
    {
      id: "started",
      title: "Aloitetut tehtävät",
      tasks: []
    },
    {
      id: "done",
      title: "Valmiit tehtävät",
      tasks: []
    }
  ]
};

let state = loadState();

const board = document.querySelector("#board");
const addColumnButton = document.querySelector("#add-column-button");

addColumnButton.addEventListener("click", addColumn);

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function render() {
  board.innerHTML = "";

  state.columns.forEach((column) => {
    board.appendChild(createColumnElement(column));
  });

  saveState();
}

function createColumnElement(column) {
  const columnElement = document.createElement("article");
  columnElement.className = "column";
  columnElement.dataset.columnId = column.id;

  const header = document.createElement("header");
  header.className = "column-header";

  const title = document.createElement("h2");
  title.className = "column-title";
  title.textContent = `${column.title} (${column.tasks.length})`;

  const columnActions = document.createElement("div");
  columnActions.className = "column-actions";

  const renameButton = document.createElement("button");
  renameButton.type = "button";
  renameButton.className = "icon-button";
  renameButton.textContent = "Nimeä";
  renameButton.addEventListener("click", () => renameColumn(column.id));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "icon-button";
  deleteButton.textContent = "Poista";
  deleteButton.addEventListener("click", () => deleteColumn(column.id));

  columnActions.append(renameButton, deleteButton);
  header.append(title, columnActions);

  const taskList = document.createElement("div");
  taskList.className = "task-list";

  if (column.tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "Ei tehtäviä";
    taskList.appendChild(empty);
  }

  column.tasks.forEach((task) => {
    taskList.appendChild(createTaskElement(task, column.id));
  });

  columnElement.addEventListener("dragover", (event) => {
    event.preventDefault();
    columnElement.classList.add("drag-over");
  });

  columnElement.addEventListener("dragleave", () => {
    columnElement.classList.remove("drag-over");
  });

  columnElement.addEventListener("drop", (event) => {
    event.preventDefault();
    columnElement.classList.remove("drag-over");

    const taskId = event.dataTransfer.getData("text/task-id");
    const sourceColumnId = event.dataTransfer.getData("text/source-column-id");

    if (taskId && sourceColumnId) {
      moveTask(taskId, sourceColumnId, column.id);
    }
  });

  const addTaskButton = document.createElement("button");
  addTaskButton.type = "button";
  addTaskButton.className = "add-task-button";
  addTaskButton.textContent = "+ Lisää tehtävä";
  addTaskButton.addEventListener("click", () => addTask(column.id));

  columnElement.append(header, taskList, addTaskButton);

  return columnElement;
}

function createTaskElement(task, columnId) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.taskId = task.id;

  card.addEventListener("dragstart", (event) => {
    card.classList.add("dragging");
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.setData("text/source-column-id", columnId);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const moveSelect = document.createElement("select");
  moveSelect.className = "task-move";
  moveSelect.setAttribute("aria-label", `Siirrä tehtävä ${task.title}`);

  state.columns.forEach((column) => {
    const option = document.createElement("option");
    option.value = column.id;
    option.textContent = column.title;
    option.selected = column.id === columnId;
    moveSelect.appendChild(option);
  });

  moveSelect.addEventListener("change", () => {
    moveTask(task.id, columnId, moveSelect.value);
  });

  const buttons = document.createElement("div");
  buttons.className = "task-buttons";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "secondary-button";
  editButton.textContent = "Muokkaa";
  editButton.addEventListener("click", () => editTask(task.id, columnId));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "secondary-button";
  deleteButton.textContent = "Poista";
  deleteButton.addEventListener("click", () => deleteTask(task.id, columnId));

  buttons.append(editButton, deleteButton);
  actions.append(moveSelect, buttons);
  card.append(title, actions);

  return card;
}

function addColumn() {
  const title = window.prompt("Anna uuden sarakkeen nimi:");

  if (!title?.trim()) {
    return;
  }

  state.columns.push({
    id: createId("column"),
    title: title.trim(),
    tasks: []
  });

  render();
}

function renameColumn(columnId) {
  const column = state.columns.find((item) => item.id === columnId);

  if (!column) {
    return;
  }

  const title = window.prompt("Anna sarakkeelle uusi nimi:", column.title);

  if (!title?.trim()) {
    return;
  }

  column.title = title.trim();
  render();
}

function deleteColumn(columnId) {
  const column = state.columns.find((item) => item.id === columnId);

  if (!column) {
    return;
  }

  if (column.tasks.length > 0) {
    window.alert("Siirrä tai poista ensin sarakkeen tehtävät.");
    return;
  }

  const confirmed = window.confirm(`Poistetaanko sarake "${column.title}"?`);

  if (!confirmed) {
    return;
  }

  state.columns = state.columns.filter((item) => item.id !== columnId);
  render();
}

function addTask(columnId) {
  const title = window.prompt("Anna tehtävän nimi:");

  if (!title?.trim()) {
    return;
  }

  const column = state.columns.find((item) => item.id === columnId);

  if (!column) {
    return;
  }

  column.tasks.push({
    id: createId("task"),
    title: title.trim()
  });

  render();
}

function editTask(taskId, columnId) {
  const column = state.columns.find((item) => item.id === columnId);
  const task = column?.tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  const title = window.prompt("Muokkaa tehtävän nimeä:", task.title);

  if (!title?.trim()) {
    return;
  }

  task.title = title.trim();
  render();
}

function deleteTask(taskId, columnId) {
  const column = state.columns.find((item) => item.id === columnId);

  if (!column) {
    return;
  }

  column.tasks = column.tasks.filter((item) => item.id !== taskId);
  render();
}

function moveTask(taskId, sourceColumnId, targetColumnId) {
  if (sourceColumnId === targetColumnId) {
    return;
  }

  const sourceColumn = state.columns.find((item) => item.id === sourceColumnId);
  const targetColumn = state.columns.find((item) => item.id === targetColumnId);

  if (!sourceColumn || !targetColumn) {
    return;
  }

  const taskIndex = sourceColumn.tasks.findIndex((item) => item.id === taskId);

  if (taskIndex === -1) {
    return;
  }

  const [task] = sourceColumn.tasks.splice(taskIndex, 1);
  targetColumn.tasks.push(task);

  render();
}

render();
