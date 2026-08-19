const STORAGE_KEY = "planneri-demo-v1";

const COLUMN_COLORS = [
  "#5b5bf7",
  "#0f766e",
  "#b45309",
  "#be123c",
  "#7e22ce",
  "#0369a1",
  "#4d7c0f",
  "#9f1239"
];

const defaultState = {
  columns: [
    {
      id: "upcoming",
      title: "Tulevat tehtävät",
      color: COLUMN_COLORS[0],
      tasks: [
        {
          id: "task-inventory",
          title: "Inventaario",
          description: "",
          dueDate: ""
        }
      ]
    },
    {
      id: "started",
      title: "Aloitetut tehtävät",
      color: COLUMN_COLORS[1],
      tasks: []
    },
    {
      id: "done",
      title: "Valmiit tehtävät",
      color: COLUMN_COLORS[2],
      tasks: []
    }
  ]
};

let state = loadState();
let activeView = "board";
let calendarDate = startOfMonth(new Date());

let dialogMode = "add";
let dialogColumnId = null;
let dialogTaskId = null;

const board = document.querySelector("#board");
const addColumnButton = document.querySelector("#add-column-button");
const viewTabs = [...document.querySelectorAll(".view-tab")];

const boardView = document.querySelector("#board-view");
const calendarView = document.querySelector("#calendar-view");
const tableView = document.querySelector("#table-view");

const calendarTitle = document.querySelector("#calendar-title");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarPrev = document.querySelector("#calendar-prev");
const calendarNext = document.querySelector("#calendar-next");
const unscheduledTasks = document.querySelector("#unscheduled-tasks");

const tableSort = document.querySelector("#table-sort");
const tableGroup = document.querySelector("#table-group");
const taskTableContainer = document.querySelector("#task-table-container");

const taskDialog = document.querySelector("#task-dialog");
const taskDialogTitle = document.querySelector("#task-dialog-title");
const taskDialogClose = document.querySelector("#task-dialog-close");
const taskDialogCancel = document.querySelector("#task-dialog-cancel");
const taskDialogSave = document.querySelector("#task-dialog-save");
const taskTitleInput = document.querySelector("#task-title-input");
const taskDateInput = document.querySelector("#task-date-input");
const taskDescriptionInput = document.querySelector("#task-description-input");

addColumnButton.addEventListener("click", addColumn);

viewTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchView(tab.dataset.view);
  });
});

calendarPrev.addEventListener("click", () => {
  calendarDate = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() - 1,
    1
  );
  renderCalendar();
});

calendarNext.addEventListener("click", () => {
  calendarDate = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() + 1,
    1
  );
  renderCalendar();
});

tableSort.addEventListener("change", renderTable);
tableGroup.addEventListener("change", renderTable);

taskDialogClose.addEventListener("click", closeTaskDialog);
taskDialogCancel.addEventListener("click", closeTaskDialog);
taskDialogSave.addEventListener("click", saveTaskDialog);

taskTitleInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    saveTaskDialog();
  }
});

taskDialog.addEventListener("click", (event) => {
  if (event.target === taskDialog) {
    closeTaskDialog();
  }
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeState(rawState) {
  if (!rawState || !Array.isArray(rawState.columns)) {
    return structuredClone(defaultState);
  }

  return {
    columns: rawState.columns.map((column, columnIndex) => ({
      id: column.id || createId("column"),
      title: column.title || `Sarake ${columnIndex + 1}`,
      color: isHexColor(column.color)
        ? column.color
        : COLUMN_COLORS[columnIndex % COLUMN_COLORS.length],
      tasks: Array.isArray(column.tasks)
        ? column.tasks.map((task) => ({
            id: task.id || createId("task"),
            title: task.title || "Nimetön tehtävä",
            description: task.description || "",
            dueDate: isIsoDate(task.dueDate) ? task.dueDate : ""
          }))
        : []
    }))
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function switchView(viewName) {
  activeView = viewName;

  boardView.hidden = viewName !== "board";
  calendarView.hidden = viewName !== "calendar";
  tableView.hidden = viewName !== "table";

  viewTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === viewName);
  });

  addColumnButton.hidden = viewName !== "board";

  if (viewName === "calendar") {
    renderCalendar();
  }

  if (viewName === "table") {
    renderTable();
  }
}

function renderAll() {
  renderBoard();

  if (activeView === "calendar") {
    renderCalendar();
  }

  if (activeView === "table") {
    renderTable();
  }

  saveState();
}

function renderBoard() {
  board.innerHTML = "";

  if (state.columns.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-view";
    empty.textContent = "Taululla ei ole vielä sarakkeita. Lisää ensimmäinen sarake yläreunan painikkeesta.";
    board.appendChild(empty);
    return;
  }

  state.columns.forEach((column) => {
    board.appendChild(createColumnElement(column));
  });
}

function createColumnElement(column) {
  const columnElement = document.createElement("article");
  columnElement.className = "column";
  columnElement.dataset.columnId = column.id;
  columnElement.style.setProperty("--column-color", column.color);

  const header = document.createElement("header");
  header.className = "column-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "column-title-wrap";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.className = "column-color";
  colorInput.value = column.color;
  colorInput.title = `Valitse sarakkeen ${column.title} väri`;
  colorInput.setAttribute("aria-label", `Valitse sarakkeen ${column.title} väri`);
  colorInput.addEventListener("input", () => {
    column.color = colorInput.value;
    columnElement.style.setProperty("--column-color", column.color);
    saveState();
  });
  colorInput.addEventListener("change", renderAll);

  const title = document.createElement("h2");
  title.className = "column-title";
  title.textContent = `${column.title} (${column.tasks.length})`;

  titleWrap.append(colorInput, title);

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
  header.append(titleWrap, columnActions);

  const taskList = document.createElement("div");
  taskList.className = "task-list";

  if (column.tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "Ei tehtäviä";
    taskList.appendChild(empty);
  }

  column.tasks.forEach((task) => {
    taskList.appendChild(createTaskElement(task, column));
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
  addTaskButton.addEventListener("click", () => openTaskDialogForAdd(column.id));

  columnElement.append(header, taskList, addTaskButton);

  return columnElement;
}

function createTaskElement(task, column) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.taskId = task.id;
  card.style.setProperty("--column-color", column.color);

  card.addEventListener("dragstart", (event) => {
    card.classList.add("dragging");
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.setData("text/source-column-id", column.id);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  card.appendChild(title);

  if (task.description) {
    const description = document.createElement("p");
    description.className = "task-description-preview";
    description.textContent =
      task.description.length > 100
        ? `${task.description.slice(0, 100)}…`
        : task.description;
    card.appendChild(description);
  }

  if (task.dueDate) {
    const dueDate = document.createElement("span");
    dueDate.className = "task-date";
    dueDate.textContent = `📅 ${formatDate(task.dueDate)}`;
    card.appendChild(dueDate);
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const moveSelect = document.createElement("select");
  moveSelect.className = "task-move";
  moveSelect.setAttribute("aria-label", `Siirrä tehtävä ${task.title}`);

  state.columns.forEach((targetColumn) => {
    const option = document.createElement("option");
    option.value = targetColumn.id;
    option.textContent = targetColumn.title;
    option.selected = targetColumn.id === column.id;
    moveSelect.appendChild(option);
  });

  moveSelect.addEventListener("change", () => {
    moveTask(task.id, column.id, moveSelect.value);
  });

  const buttons = document.createElement("div");
  buttons.className = "task-buttons";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "secondary-button";
  editButton.textContent = "Muokkaa";
  editButton.addEventListener("click", () => openTaskDialogForEdit(task.id, column.id));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "secondary-button";
  deleteButton.textContent = "Poista";
  deleteButton.addEventListener("click", () => deleteTask(task.id, column.id));

  buttons.append(editButton, deleteButton);
  actions.append(moveSelect, buttons);
  card.appendChild(actions);

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
    color: COLUMN_COLORS[state.columns.length % COLUMN_COLORS.length],
    tasks: []
  });

  renderAll();
}

function renameColumn(columnId) {
  const column = getColumn(columnId);

  if (!column) {
    return;
  }

  const title = window.prompt("Anna sarakkeelle uusi nimi:", column.title);

  if (!title?.trim()) {
    return;
  }

  column.title = title.trim();
  renderAll();
}

function deleteColumn(columnId) {
  const column = getColumn(columnId);

  if (!column) {
    return;
  }

  if (column.tasks.length > 0) {
    window.alert("Siirrä tai poista ensin sarakkeen tehtävät.");
    return;
  }

  const confirmed = window.confirm(
    `Poistetaanko sarake "${column.title}"? Tätä toimintoa ei voi perua.`
  );

  if (!confirmed) {
    return;
  }

  state.columns = state.columns.filter((item) => item.id !== columnId);
  renderAll();
}

function openTaskDialogForAdd(columnId) {
  dialogMode = "add";
  dialogColumnId = columnId;
  dialogTaskId = null;

  taskDialogTitle.textContent = "Lisää tehtävä";
  taskTitleInput.value = "";
  taskDateInput.value = "";
  taskDescriptionInput.value = "";

  taskDialog.showModal();
  taskTitleInput.focus();
}

function openTaskDialogForEdit(taskId, columnId) {
  const task = getTask(taskId, columnId);

  if (!task) {
    return;
  }

  dialogMode = "edit";
  dialogColumnId = columnId;
  dialogTaskId = taskId;

  taskDialogTitle.textContent = "Muokkaa tehtävää";
  taskTitleInput.value = task.title;
  taskDateInput.value = task.dueDate || "";
  taskDescriptionInput.value = task.description || "";

  taskDialog.showModal();
  taskTitleInput.focus();
}

function closeTaskDialog() {
  if (taskDialog.open) {
    taskDialog.close();
  }
}

function saveTaskDialog() {
  const title = taskTitleInput.value.trim();

  if (!title) {
    window.alert("Anna tehtävälle nimi.");
    taskTitleInput.focus();
    return;
  }

  const taskData = {
    title,
    dueDate: taskDateInput.value || "",
    description: taskDescriptionInput.value.trim()
  };

  if (dialogMode === "add") {
    const column = getColumn(dialogColumnId);

    if (!column) {
      closeTaskDialog();
      return;
    }

    column.tasks.push({
      id: createId("task"),
      ...taskData
    });
  } else {
    const task = getTask(dialogTaskId, dialogColumnId);

    if (!task) {
      closeTaskDialog();
      return;
    }

    task.title = taskData.title;
    task.dueDate = taskData.dueDate;
    task.description = taskData.description;
  }

  closeTaskDialog();
  renderAll();
}

function deleteTask(taskId, columnId) {
  const task = getTask(taskId, columnId);

  if (!task) {
    return;
  }

  const confirmed = window.confirm(
    `Poistetaanko tehtävä "${task.title}"? Tätä toimintoa ei voi perua.`
  );

  if (!confirmed) {
    return;
  }

  const column = getColumn(columnId);
  column.tasks = column.tasks.filter((item) => item.id !== taskId);

  renderAll();
}

function moveTask(taskId, sourceColumnId, targetColumnId) {
  if (sourceColumnId === targetColumnId) {
    return;
  }

  const sourceColumn = getColumn(sourceColumnId);
  const targetColumn = getColumn(targetColumnId);

  if (!sourceColumn || !targetColumn) {
    return;
  }

  const taskIndex = sourceColumn.tasks.findIndex((item) => item.id === taskId);

  if (taskIndex === -1) {
    return;
  }

  const [task] = sourceColumn.tasks.splice(taskIndex, 1);
  targetColumn.tasks.push(task);

  renderAll();
}

function getColumn(columnId) {
  return state.columns.find((column) => column.id === columnId);
}

function getTask(taskId, columnId) {
  return getColumn(columnId)?.tasks.find((task) => task.id === taskId);
}

/* Kalenteri */

function renderCalendar() {
  calendarGrid.innerHTML = "";
  unscheduledTasks.innerHTML = "";

  calendarTitle.textContent = new Intl.DateTimeFormat("fi-FI", {
    month: "long",
    year: "numeric"
  }).format(calendarDate);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const mondayIndex = (firstDay.getDay() + 6) % 7;

  const gridStart = new Date(year, month, 1 - mondayIndex);

  const tasksByDate = new Map();

  getAllTasks().forEach((entry) => {
    if (!entry.task.dueDate) {
      return;
    }

    if (!tasksByDate.has(entry.task.dueDate)) {
      tasksByDate.set(entry.task.dueDate, []);
    }

    tasksByDate.get(entry.task.dueDate).push(entry);
  });

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index
    );

    const isoDate = localDateToIso(date);

    const day = document.createElement("section");
    day.className = "calendar-day";

    if (date.getMonth() !== month) {
      day.classList.add("outside-month");
    }

    if (isToday(date)) {
      day.classList.add("today");
    }

    const number = document.createElement("span");
    number.className = "calendar-day-number";
    number.textContent = date.getDate();

    const taskList = document.createElement("div");
    taskList.className = "calendar-task-list";

    const entries = tasksByDate.get(isoDate) || [];

    entries.forEach((entry) => {
      const taskButton = document.createElement("button");
      taskButton.type = "button";
      taskButton.className = "calendar-task";
      taskButton.style.setProperty("--task-color", entry.column.color);
      taskButton.textContent = entry.task.title;
      taskButton.title = `${entry.task.title} – ${entry.column.title}`;
      taskButton.addEventListener("click", () => {
        openTaskDialogForEdit(entry.task.id, entry.column.id);
      });

      taskList.appendChild(taskButton);
    });

    day.append(number, taskList);
    calendarGrid.appendChild(day);
  }

  const noDateEntries = getAllTasks().filter((entry) => !entry.task.dueDate);

  if (noDateEntries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "Kaikilla tehtävillä on määräpäivä.";
    unscheduledTasks.appendChild(empty);
  } else {
    noDateEntries.forEach((entry) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "unscheduled-task";
      button.style.setProperty("--task-color", entry.column.color);
      button.textContent = `${entry.task.title} · ${entry.column.title}`;
      button.addEventListener("click", () => {
        openTaskDialogForEdit(entry.task.id, entry.column.id);
      });

      unscheduledTasks.appendChild(button);
    });
  }
}

/* Taulukko */

function renderTable() {
  taskTableContainer.innerHTML = "";

  const entries = sortTaskEntries(getAllTasks(), tableSort.value);

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-view";
    empty.textContent = "Tehtäviä ei ole vielä lisätty.";
    taskTableContainer.appendChild(empty);
    return;
  }

  if (tableGroup.value === "column") {
    state.columns.forEach((column) => {
      const groupEntries = entries.filter(
        (entry) => entry.column.id === column.id
      );

      if (groupEntries.length === 0) {
        return;
      }

      const group = document.createElement("section");
      group.className = "table-group";

      const heading = document.createElement("div");
      heading.className = "table-group-heading";

      const dot = document.createElement("span");
      dot.className = "color-dot";
      dot.style.setProperty("--dot-color", column.color);

      const title = document.createElement("h3");
      title.textContent = `${column.title} (${groupEntries.length})`;

      heading.append(dot, title);
      group.append(heading, createTaskTable(groupEntries));
      taskTableContainer.appendChild(group);
    });
  } else {
    taskTableContainer.appendChild(createTaskTable(entries));
  }
}

function createTaskTable(entries) {
  const wrap = document.createElement("div");
  wrap.className = "task-table-wrap";

  const table = document.createElement("table");
  table.className = "task-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  ["Tehtävä", "Määräpäivä", "Sarake", "Kuvaus", ""].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");

  entries.forEach((entry) => {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.textContent = entry.task.title;

    const dateCell = document.createElement("td");
    dateCell.textContent = entry.task.dueDate
      ? formatDate(entry.task.dueDate)
      : "–";

    const columnCell = document.createElement("td");
    const columnLabel = document.createElement("span");
    columnLabel.className = "table-column-label";

    const dot = document.createElement("span");
    dot.className = "color-dot";
    dot.style.setProperty("--dot-color", entry.column.color);

    const columnName = document.createElement("span");
    columnName.textContent = entry.column.title;

    columnLabel.append(dot, columnName);
    columnCell.appendChild(columnLabel);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = entry.task.description || "–";

    const actionsCell = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary-button table-edit-button";
    editButton.textContent = "Muokkaa";
    editButton.addEventListener("click", () => {
      openTaskDialogForEdit(entry.task.id, entry.column.id);
    });

    actionsCell.appendChild(editButton);

    row.append(
      titleCell,
      dateCell,
      columnCell,
      descriptionCell,
      actionsCell
    );

    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  wrap.appendChild(table);

  return wrap;
}

function getAllTasks() {
  const entries = [];

  state.columns.forEach((column, columnIndex) => {
    column.tasks.forEach((task, taskIndex) => {
      entries.push({
        task,
        column,
        columnIndex,
        taskIndex
      });
    });
  });

  return entries;
}

function sortTaskEntries(entries, direction) {
  return [...entries].sort((a, b) => {
    const dateA = a.task.dueDate;
    const dateB = b.task.dueDate;

    if (!dateA && !dateB) {
      return a.task.title.localeCompare(b.task.title, "fi");
    }

    if (!dateA) {
      return 1;
    }

    if (!dateB) {
      return -1;
    }

    const comparison = dateA.localeCompare(dateB);

    if (comparison === 0) {
      return a.task.title.localeCompare(b.task.title, "fi");
    }

    return direction === "desc" ? -comparison : comparison;
  });
}

/* Päivämääräapu */

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function localDateToIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isToday(date) {
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatDate(isoDate) {
  if (!isoDate) {
    return "";
  }

  const [year, month, day] = isoDate.split("-").map(Number);

  return new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

renderBoard();
saveState();
