// --------------------
// This script powers the interactive UI and operates on mock data (data.json).
// To later connect to your backend, swap out fetch/read/write operations for API calls.
// --------------------
let records = []; // In-memory records loaded from data.json (mock data)

const recordsTableBody = document.querySelector("#recordsTable tbody");
const searchInput = document.getElementById("searchInput");
const addRecordBtn = document.getElementById("addRecordBtn");
const exportBtn = document.getElementById("exportBtn");
const modal = document.getElementById("recordModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const recordForm = document.getElementById("recordForm");
const modalTitle = document.getElementById("modalTitle");
const emptyMessage = document.getElementById("emptyMessage");

let editRecordId = null;

// ----------- Utilities ------------
function renderTable(recList) {
  recordsTableBody.innerHTML = '';
  if (!recList.length) {
    emptyMessage.style.display = "block";
    return;
  }
  emptyMessage.style.display = "none";
  recList.forEach(record => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${record.id}</td>
      <td>${escapeHtml(record.name)}</td>
      <td>${escapeHtml(record.email)}</td>
      <td>${escapeHtml(record.role)}</td>
      <td class="actions">
        <button class="action-btn action-edit" data-id="${record.id}">Edit</button>
        <button class="action-btn action-delete" data-id="${record.id}">Delete</button>
      </td>
    `;
    recordsTableBody.appendChild(tr);
  });
}

// Escapes HTML for safe rendering
function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

// Returns filtered array based on search field
function filterRecords(query) {
  return records.filter(record => {
    const q = query.toLowerCase();
    return record.name.toLowerCase().includes(q) ||
      record.email.toLowerCase().includes(q) ||
      record.role.toLowerCase().includes(q) ||
      String(record.id).includes(q);
  });
}

// Finds index by ID
function findRecordIndexById(id) {
  return records.findIndex(r => r.id === id);
}

// ------------- Modal UI Logic -----------------
function openModal(mode, record) {
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
  modalTitle.textContent = mode === "add" ? "Add Record" : "Edit Record";
  if (mode === "edit" && record) {
    recordForm.name.value = record.name;
    recordForm.email.value = record.email;
    recordForm.role.value = record.role;
    recordForm.id.value = record.id;
    editRecordId = record.id;
  } else {
    recordForm.reset();
    recordForm.id.value = '';
    editRecordId = null;
  }
  setTimeout(() => recordForm.name.focus(), 200);
}

function closeModalUI() {
  modal.style.display = "none";
  document.body.style.overflow = "";
  recordForm.reset();
  editRecordId = null;
}

// ------------- CRUD Handlers ----------------
function handleAddRecord(e) {
  e.preventDefault();
  openModal("add");
}

function handleEditRecord(id) {
  const idx = findRecordIndexById(id);
  if (idx > -1) openModal("edit", records[idx]);
}

function handleDeleteRecord(id) {
  if (!confirm("Delete this record?")) return;
  const idx = findRecordIndexById(id);
  if (idx > -1) {
    records.splice(idx, 1);
    refreshDisplay();
  }
}

function handleSaveRecord(e) {
  e.preventDefault();
  // Grab data from form
  const name = recordForm.name.value.trim();
  const email = recordForm.email.value.trim();
  const role = recordForm.role.value;
  if (!(name && email && role)) return;
  // Add mode
  if (!editRecordId) {
    // Generate unique id
    const nextId = records.length ? Math.max(...records.map(r => r.id)) + 1 : 1;
    records.push({id: nextId, name, email, role});
  } else {
    // Edit mode
    const idx = findRecordIndexById(Number(recordForm.id.value));
    if (idx > -1) {
      records[idx] = { ...records[idx], name, email, role };
    }
  }
  closeModalUI();
  refreshDisplay();
}

function handleExportJSON() {
  // Exports the *displayed* rows, i.e. applies current filter
  const query = searchInput.value.trim();
  const filtered = filterRecords(query);
  const json = JSON.stringify(filtered, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "records.json";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ------------- Event Listeners --------------
function refreshDisplay() {
  const query = searchInput.value.trim();
  renderTable(filterRecords(query));
}

addRecordBtn.addEventListener("click", handleAddRecord);
closeModal.addEventListener("click", closeModalUI);
cancelBtn.addEventListener("click", closeModalUI);
window.addEventListener("click", e => {
  if (e.target === modal) closeModalUI();
});

recordForm.addEventListener("submit", handleSaveRecord);

searchInput.addEventListener("input", refreshDisplay);

exportBtn.addEventListener("click", handleExportJSON);

recordsTableBody.addEventListener("click", function(e) {
  if (e.target.classList.contains("action-edit")) {
    const id = Number(e.target.getAttribute("data-id"));
    handleEditRecord(id);
  } else if (e.target.classList.contains("action-delete")) {
    const id = Number(e.target.getAttribute("data-id"));
    handleDeleteRecord(id);
  }
});

// --------------------------
// Mock Data Loader
// --------------------------
async function loadMockData() {
  try {
    const resp = await fetch("data.json");
    const data = await resp.json();
    // For real API, replace with API call, and change references to data as needed
    records = data;
    refreshDisplay();
  } catch {
    records = [];
    refreshDisplay();
  }
}

// -------------- Init ---------------
window.addEventListener("DOMContentLoaded", loadMockData);
