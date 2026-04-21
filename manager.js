const entity = new URLSearchParams(window.location.search).get("entity");

const API_BASE = "http://localhost:3000/api";

const pageTitle = document.getElementById("pageTitle");
const tableHead = document.getElementById("tableHead");
const tableBody = document.querySelector("#recordsTable tbody");
const searchInput = document.getElementById("searchInput");
const addRecordBtn = document.getElementById("addRecordBtn");
const exportBtn = document.getElementById("exportBtn");
const modal = document.getElementById("recordModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const recordForm = document.getElementById("recordForm");
const emptyMessage = document.getElementById("emptyMessage");

let rows = [];
let lookups = {};
let editId = null;

const configs = {
  colleges: {
    title: "Colleges",
    idField: "college_id",
    endpoint: "colleges",
    columns: ["college_id", "college_name", "location"],
    labels: {
      college_id: "ID",
      college_name: "College Name",
      location: "Location"
    },
    fields: [
      { name: "college_name", label: "College Name", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: true }
    ]
  },
  departments: {
    title: "Departments",
    idField: "department_id",
    endpoint: "departments",
    columns: ["department_id", "college_name", "department_name"],
    labels: {
      department_id: "ID",
      college_name: "College",
      department_name: "Department Name"
    },
    fields: [
      { name: "college_id", label: "College", type: "select", required: true, lookup: "colleges" },
      { name: "department_name", label: "Department Name", type: "text", required: true }
    ]
  },
  students: {
    title: "Students",
    idField: "student_id",
    endpoint: "students",
    columns: ["student_id", "first_name", "last_name", "department_name", "max_courses_allowed"],
    labels: {
      student_id: "ID",
      first_name: "First Name",
      last_name: "Last Name",
      department_name: "Department",
      max_courses_allowed: "Max Courses"
    },
    fields: [
      { name: "first_name", label: "First Name", type: "text", required: true },
      { name: "last_name", label: "Last Name", type: "text", required: true },
      { name: "department_id", label: "Department", type: "select", required: true, lookup: "departments" },
      { name: "max_courses_allowed", label: "Max Courses Allowed", type: "number", required: true }
    ]
  },
  student_accounts: {
    title: "Student Accounts",
    idField: "account_id",
    endpoint: "student_accounts",
    columns: ["account_id", "student_name", "username"],
    labels: {
      account_id: "ID",
      student_name: "Student",
      username: "Username"
    },
    fields: [
      { name: "student_id", label: "Student", type: "select", required: true, lookup: "students" },
      { name: "username", label: "Username", type: "text", required: true },
      { name: "password", label: "Password", type: "text", required: true }
    ]
  },
  instructors: {
    title: "Instructors",
    idField: "instructor_id",
    endpoint: "instructors",
    columns: ["instructor_id", "first_name", "last_name", "department_name"],
    labels: {
      instructor_id: "ID",
      first_name: "First Name",
      last_name: "Last Name",
      department_name: "Department"
    },
    fields: [
      { name: "first_name", label: "First Name", type: "text", required: true },
      { name: "last_name", label: "Last Name", type: "text", required: true },
      { name: "department_id", label: "Department", type: "select", required: true, lookup: "departments" }
    ]
  },
  instructor_profiles: {
    title: "Instructor Profiles",
    idField: "profile_id",
    endpoint: "instructor_profiles",
    columns: ["profile_id", "instructor_name", "office", "rank_title"],
    labels: {
      profile_id: "ID",
      instructor_name: "Instructor",
      office: "Office",
      rank_title: "Rank"
    },
    fields: [
      { name: "instructor_id", label: "Instructor", type: "select", required: true, lookup: "instructors" },
      { name: "office", label: "Office", type: "text", required: false },
      { name: "rank_title", label: "Rank", type: "text", required: false }
    ]
  },
  courses: {
    title: "Courses",
    idField: "course_id",
    endpoint: "courses",
    columns: ["course_id", "course_title", "department_name", "credit_hours"],
    labels: {
      course_id: "ID",
      course_title: "Course Title",
      department_name: "Department",
      credit_hours: "Credit Hours"
    },
    fields: [
      { name: "course_title", label: "Course Title", type: "text", required: true },
      { name: "department_id", label: "Department", type: "select", required: true, lookup: "departments" },
      { name: "credit_hours", label: "Credit Hours", type: "number", required: true }
    ]
  },
  classrooms: {
    title: "Classrooms",
    idField: "classroom_id",
    endpoint: "classrooms",
    columns: ["classroom_id", "building_name", "room_number", "capacity"],
    labels: {
      classroom_id: "ID",
      building_name: "Building",
      room_number: "Room Number",
      capacity: "Capacity"
    },
    fields: [
      { name: "building_name", label: "Building Name", type: "text", required: true },
      { name: "room_number", label: "Room Number", type: "text", required: true },
      { name: "capacity", label: "Capacity", type: "number", required: true }
    ]
  },
  sections: {
    title: "Sections",
    idField: "section_id",
    endpoint: "sections",
    columns: ["section_id", "course_title", "instructor_name", "classroom_label", "semester", "year"],
    labels: {
      section_id: "ID",
      course_title: "Course",
      instructor_name: "Instructor",
      classroom_label: "Classroom",
      semester: "Semester",
      year: "Year"
    },
    fields: [
      { name: "course_id", label: "Course", type: "select", required: true, lookup: "courses" },
      { name: "instructor_id", label: "Instructor", type: "select", required: true, lookup: "instructors" },
      { name: "classroom_id", label: "Classroom", type: "select", required: true, lookup: "classrooms" },
      { name: "semester", label: "Semester", type: "select", required: true, options: ["Spring", "Summer", "Fall", "Winter"] },
      { name: "year", label: "Year", type: "number", required: true }
    ]
  },
  enrollments: {
    title: "Enrollments",
    idField: "enrollment_id",
    endpoint: "enrollments",
    columns: ["enrollment_id", "student_name", "section_label", "grade"],
    labels: {
      enrollment_id: "ID",
      student_name: "Student",
      section_label: "Section",
      grade: "Grade"
    },
    fields: [
      { name: "student_id", label: "Student", type: "select", required: true, lookup: "students" },
      { name: "section_id", label: "Section", type: "select", required: true, lookup: "sections" },
      { name: "grade", label: "Grade", type: "select", required: false, options: ["", "A", "B", "C", "D", "F", "I", "W"] }
    ]
  }
};

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
}

function buildTableHead() {
  const config = configs[entity];
  const ths = config.columns.map(col => `<th>${config.labels[col] || col}</th>`).join("");
  tableHead.innerHTML = `<tr>${ths}<th>Actions</th></tr>`;
}

function renderTable(list) {
  tableBody.innerHTML = "";

  if (!list.length) {
    emptyMessage.style.display = "block";
    return;
  }

  emptyMessage.style.display = "none";

  const config = configs[entity];

  list.forEach(row => {
    const cells = config.columns.map(col => `<td>${escapeHtml(row[col])}</td>`).join("");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      ${cells}
      <td class="actions">
        <button class="action-edit" data-id="${row[config.idField]}">Edit</button>
        <button class="action-delete" data-id="${row[config.idField]}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function filterRows(query) {
  const q = query.toLowerCase();
  const config = configs[entity];

  return rows.filter(row =>
    config.columns.some(col => String(row[col] ?? "").toLowerCase().includes(q)) ||
    String(row[config.idField] ?? "").includes(q)
  );
}

function refreshDisplay() {
  renderTable(filterRows(searchInput.value.trim()));
}

function buildForm(record = null) {
  const config = configs[entity];
  const html = config.fields.map(field => {
    const value = record ? (record[field.name] ?? "") : "";
    if (field.type === "select") {
      const options = field.lookup
        ? (lookups[field.lookup] || []).map(item => {
            const valueKey = Object.keys(item).find(k => k.endsWith("_id"));
            const labelKey = Object.keys(item).find(k => k !== valueKey);
            return `<option value="${item[valueKey]}" ${String(item[valueKey]) === String(value) ? "selected" : ""}>${escapeHtml(item[labelKey])}</option>`;
          }).join("")
        : (field.options || []).map(opt => `<option value="${opt}" ${String(opt) === String(value) ? "selected" : ""}>${escapeHtml(opt || "None")}</option>`).join("");

      return `
        <label>
          ${field.label}
          <select name="${field.name}" ${field.required ? "required" : ""}>
            <option value="">Select</option>
            ${options}
          </select>
        </label>
      `;
    }

    return `
      <label>
        ${field.label}
        <input type="${field.type}" name="${field.name}" value="${escapeHtml(value)}" ${field.required ? "required" : ""} />
      </label>
    `;
  }).join("");

  recordForm.innerHTML = `
    ${html}
    <div class="modal-actions">
      <button type="submit">Save</button>
      <button type="button" id="cancelBtnForm">Cancel</button>
    </div>
  `;

  document.getElementById("cancelBtnForm").addEventListener("click", closeModalUI);
  recordForm.addEventListener("submit", handleSaveRecord, { once: true });
}

async function loadLookups() {
  const needed = new Set();
  configs[entity].fields.forEach(f => { if (f.lookup) needed.add(f.lookup); });

  for (const lookupName of needed) {
    lookups[lookupName] = await apiRequest(`${API_BASE}/lookups/${lookupName}`);
  }
}

async function loadRows() {
  rows = await apiRequest(`${API_BASE}/${configs[entity].endpoint}`);
  refreshDisplay();
}

function openModal(mode, record = null) {
  modal.style.display = "block";
  modalTitle.textContent = mode === "add" ? `Add ${configs[entity].title.slice(0, -1)}` : `Edit ${configs[entity].title.slice(0, -1)}`;
  editId = record ? record[configs[entity].idField] : null;
  buildForm(record);
}

function closeModalUI() {
  modal.style.display = "none";
  editId = null;
  recordForm.innerHTML = "";
}

async function handleSaveRecord(e) {
  e.preventDefault();

  const formData = new FormData(recordForm);
  const payload = {};

  configs[entity].fields.forEach(field => {
    let value = formData.get(field.name);
    if (field.type === "number") value = value === "" ? null : Number(value);
    payload[field.name] = value;
  });

  try {
    if (editId === null) {
      await apiRequest(`${API_BASE}/${configs[entity].endpoint}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } else {
      await apiRequest(`${API_BASE}/${configs[entity].endpoint}/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    }

    closeModalUI();
    await loadRows();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteRecord(id) {
  if (!confirm("Delete this record?")) return;
  try {
    await apiRequest(`${API_BASE}/${configs[entity].endpoint}/${id}`, {
      method: "DELETE"
    });
    await loadRows();
  } catch (err) {
    alert(err.message);
  }
}

async function exportCurrentTable() {
  const data = await apiRequest(`${API_BASE}/export/${configs[entity].endpoint}`);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${configs[entity].endpoint}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

addRecordBtn.addEventListener("click", () => openModal("add"));
closeModal.addEventListener("click", closeModalUI);
searchInput.addEventListener("input", refreshDisplay);
exportBtn.addEventListener("click", exportCurrentTable);

window.addEventListener("click", (e) => {
  if (e.target === modal) closeModalUI();
});

tableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("action-edit")) {
    const id = Number(e.target.dataset.id);
    const record = rows.find(r => Number(r[configs[entity].idField]) === id);
    if (record) openModal("edit", record);
  }

  if (e.target.classList.contains("action-delete")) {
    handleDeleteRecord(Number(e.target.dataset.id));
  }
});

(async function init() {
  if (!entity || !configs[entity]) {
    pageTitle.textContent = "Invalid page";
    return;
  }

  pageTitle.textContent = configs[entity].title;
  buildTableHead();

  try {
    await loadLookups();
    await loadRows();
  } catch (err) {
    console.error(err);
    alert("Failed to load page data.");
  }
})();