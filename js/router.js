function navigateTo(pageName) {
  window.location.hash = pageName;
}

async function loadPage(pageName) {
  const container = document.getElementById("app-container");
  if (!container) return;

  showLoading(true, "Memuat halaman...");

  try {
    const response = await fetch(`pages/${pageName}.html`);
    if (!response.ok)
      throw new Error(`Halaman pages/${pageName}.html tidak ditemukan.`);

    const html = await response.text();
    container.innerHTML = html;

    initPageLogic(pageName);
  } catch (err) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-500">
        <p class="font-bold text-red-500">Gagal Memuat Halaman</p>
        <p class="text-xs mt-1 text-slate-400">${err.message}</p>
        <button onclick="navigateTo('home')" class="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold shadow">
          Kembali ke Beranda
        </button>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

function initPageLogic(pageName) {
  updateLogoutButton();

  if (pageName === "user") {
    populateUserProfile();
  } else if (pageName === "admin") {
    if (!currentUser || currentUser.role !== "admin") {
      showAlert("Akses ditolak! Anda harus login sebagai Admin.", "warning");
      navigateTo("login");
      return;
    }
    fetchAdminData();
  } else if (pageName === "info") {
    fetchInfoStats();
  } else if (pageName === "register") {
    if (typeof window.toggleBajuOptions === "function") {
      window.toggleBajuOptions();
    }
  }
}
