let courses = [];
let departments = [];
let editCourseId = null;

const API_COURSES = "http://localhost:3000/api/courses";
const API_DEPARTMENTS = "http://localhost:3000/api/departments";

const recordsTableBody = document.querySelector("#recordsTable tbody");
const searchInput = document.getElementById("searchInput");
const addRecordBtn = document.getElementById("addRecordBtn");
const modal = document.getElementById("recordModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const recordForm = document.getElementById("recordForm");
const modalTitle = document.getElementById("modalTitle");
const emptyMessage = document.getElementById("emptyMessage");

const courseIdInput = document.getElementById("course_id");
const courseTitleInput = document.getElementById("course_title");
const departmentSelect = document.getElementById("department_id");
const creditHoursInput = document.getElementById("credit_hours");

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function renderTable(courseList) {
  recordsTableBody.innerHTML = "";

  if (!courseList.length) {
    emptyMessage.style.display = "block";
    return;
  }

  emptyMessage.style.display = "none";

  courseList.forEach(course => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${course.course_id}</td>
      <td>${escapeHtml(course.course_title)}</td>
      <td>${escapeHtml(course.department_name)}</td>
      <td>${course.credit_hours}</td>
      <td class="actions">
        <button class="action-btn action-edit" data-id="${course.course_id}">Edit</button>
        <button class="action-btn action-delete" data-id="${course.course_id}">Delete</button>
      </td>
    `;
    recordsTableBody.appendChild(tr);
  });
}

function filterCourses(query) {
  const q = query.toLowerCase();

  return courses.filter(course =>
    String(course.course_id).includes(q) ||
    course.course_title.toLowerCase().includes(q) ||
    course.department_name.toLowerCase().includes(q) ||
    String(course.credit_hours).includes(q)
  );
}

function refreshDisplay() {
  renderTable(filterCourses(searchInput.value.trim()));
}

async function loadDepartments() {
  departments = await apiRequest(API_DEPARTMENTS);

  departmentSelect.innerHTML = `
    <option value="">Select a department</option>
    ${departments
      .map(
        dept =>
          `<option value="${dept.department_id}">${escapeHtml(dept.department_name)}</option>`
      )
      .join("")}
  `;
}

async function loadCourses() {
  courses = await apiRequest(API_COURSES);
  refreshDisplay();
}

function openModal(mode, course = null) {
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
  modalTitle.textContent = mode === "add" ? "Add Course" : "Edit Course";

  if (mode === "edit" && course) {
    courseIdInput.value = course.course_id;
    courseTitleInput.value = course.course_title;
    departmentSelect.value = course.department_id;
    creditHoursInput.value = course.credit_hours;
    editCourseId = course.course_id;
  } else {
    recordForm.reset();
    courseIdInput.value = "";
    editCourseId = null;
    departmentSelect.value = "";
  }
}

function closeModalUI() {
  modal.style.display = "none";
  document.body.style.overflow = "";
  recordForm.reset();
  editCourseId = null;
}

function handleAddRecord(e) {
  e.preventDefault();
  openModal("add");
}

function handleEditRecord(id) {
  const course = courses.find(c => Number(c.course_id) === Number(id));
  if (course) openModal("edit", course);
}

async function handleDeleteRecord(id) {
  if (!confirm("Delete this course?")) return;

  try {
    await apiRequest(`${API_COURSES}/${id}`, { method: "DELETE" });
    await loadCourses();
  } catch (error) {
    alert(error.message);
  }
}

async function handleSaveRecord(e) {
  e.preventDefault();

  const payload = {
    course_title: courseTitleInput.value.trim(),
    department_id: Number(departmentSelect.value),
    credit_hours: Number(creditHoursInput.value)
  };

  if (!payload.course_title || !payload.department_id || !payload.credit_hours) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    if (editCourseId === null) {
      await apiRequest(API_COURSES, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } else {
      await apiRequest(`${API_COURSES}/${editCourseId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    }

    closeModalUI();
    await loadCourses();
  } catch (error) {
    alert(error.message);
  }
}

addRecordBtn.addEventListener("click", handleAddRecord);
closeModal.addEventListener("click", closeModalUI);
cancelBtn.addEventListener("click", closeModalUI);
recordForm.addEventListener("submit", handleSaveRecord);
searchInput.addEventListener("input", refreshDisplay);

recordsTableBody.addEventListener("click", e => {
  if (e.target.classList.contains("action-edit")) {
    handleEditRecord(Number(e.target.dataset.id));
  }
  if (e.target.classList.contains("action-delete")) {
    handleDeleteRecord(Number(e.target.dataset.id));
  }
});

window.addEventListener("click", e => {
  if (e.target === modal) closeModalUI();
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadDepartments();
    await loadCourses();
  } catch (error) {
    alert("Failed to load course data.");
    console.error(error);
  }
});