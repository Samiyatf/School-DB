const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const full_name = document.getElementById("full_name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ full_name, email, password, role })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error);
    }

    alert("Account created successfully. Please login.");
    window.location.href = "login.html";
  } catch (error) {
    alert(error.message);
  }
});