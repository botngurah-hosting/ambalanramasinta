function saveSession(userData, role) {
  currentUser = { ...userData, role: role };
  sessionStorage.setItem("user_session", JSON.stringify(currentUser));
  updateLogoutButton();
}

function loadSession() {
  const saved = sessionStorage.getItem("user_session");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
    } catch (e) {
      currentUser = null;
    }
  }
  updateLogoutButton();
}

function logout() {
  sessionStorage.removeItem("user_session");
  currentUser = null;
  updateLogoutButton();
  showAlert("Anda telah keluar.", "info");
  navigateTo("login");
}

function updateLogoutButton() {
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    if (currentUser) {
      btnLogout.classList.remove("hidden");
    } else {
      btnLogout.classList.add("hidden");
    }
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const usernameInput = document.getElementById("login_username");
  const passwordInput = document.getElementById("login_password");

  if (!usernameInput || !passwordInput) return;

  showLoading(true, "Verifikasi login...");
  try {
    const payload = {
      action: "login",
      username: usernameInput.value,
      password: passwordInput.value,
    };

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const res = await response.json();
    showLoading(false);

    if (res.status === "success") {
      saveSession(res.data || res.user || {}, res.role);
      await showAlert("Login berhasil!", "success");
      navigateTo(res.role === "admin" ? "admin" : "user");
    } else {
      showAlert(res.message || "Username atau password salah!", "error");
    }
  } catch (err) {
    showLoading(false);
    showAlert("Gagal melakukan login: " + err.message, "error");
  }
}
