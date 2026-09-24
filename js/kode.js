// ================= CONFIGURATION =================
// Ganti dengan URL Web App Google Apps Script Anda yang sudah di-deploy
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz9Uf8oUccYuOU12fgo9HDE1NIAoQyt2sa9EMSwG4IYZsNf7KyjbFF_dFOhzfzUfSLAhw/exec";

let currentUser = null;

// ================= HELPER NOTIFIKASI (SWEETALERT2) =================

function showAlert(message, type = "info", title = "") {
  if (typeof Swal !== "undefined") {
    const titles = {
      success: title || "Berhasil!",
      error: title || "Gagal!",
      warning: title || "Peringatan!",
      info: title || "Informasi",
    };

    return Swal.fire({
      title: titles[type] || title,
      text: message,
      icon: type,
      confirmButtonColor: "#0284c7", // Tailwind sky-600
      customClass: {
        popup: "rounded-3xl p-6",
        confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs shadow-md",
      },
    });
  } else {
    alert(message);
  }
}

async function showConfirm(message, title = "Konfirmasi") {
  if (typeof Swal !== "undefined") {
    const result = await Swal.fire({
      title: title,
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", // Tailwind red-500
      cancelButtonColor: "#64748b", // Tailwind slate-500
      confirmButtonText: "Ya, Lanjutkan",
      cancelButtonText: "Batal",
      customClass: {
        popup: "rounded-3xl p-6",
        confirmButton: "px-4 py-2 rounded-xl font-bold text-xs shadow-md",
        cancelButton: "px-4 py-2 rounded-xl font-bold text-xs shadow-md",
      },
    });
    return result.isConfirmed;
  } else {
    return confirm(message);
  }
}

// ================= NAVIGASI & ROUTING =================

function navigateTo(pageName) {
  window.location.hash = pageName;
}

async function loadPage(pageName) {
  const container = document.getElementById("app-container");
  if (!container) return;

  showLoading(true, "Memuat halaman...");

  try {
    const response = await fetch(`pages/${pageName}.html`);
    if (!response.ok) {
      throw new Error(`Halaman pages/${pageName}.html tidak ditemukan.`);
    }
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

function showLoading(show, text = "Memuat...") {
  const spinner = document.getElementById("loading-spinner");
  const loadingText = document.getElementById("loading-text");
  if (spinner) {
    if (show) {
      if (loadingText) loadingText.textContent = text;
      spinner.classList.remove("hidden");
    } else {
      spinner.classList.add("hidden");
    }
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

// ================= SESI & AUTENTIKASI =================

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

// ================= HELPER FILE & BASE64 =================

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64Data = result.includes(",") ? result.split(",")[1] : result;
      resolve({
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
        base64: base64Data,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// ================= KONTROL MODAL & FORM REGISTRASI =================

window.openImageModal = function (src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  if (modal && modalImg) {
    modalImg.src = src;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
};

window.closeImageModal = function () {
  const modal = document.getElementById("imageModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
};

window.toggleTransfer = function () {
  const regPembayaran = document.getElementById("reg_pembayaran");
  const transferBox = document.getElementById("transfer_box");
  if (regPembayaran && transferBox) {
    if (regPembayaran.value === "Transfer") {
      transferBox.classList.remove("hidden");
    } else {
      transferBox.classList.add("hidden");
    }
  }
};

window.toggleBajuOptions = function () {
  const isChecked = document.getElementById("toggle_baju")?.checked;
  const container = document.getElementById("baju_options_container");
  const regUkuran = document.getElementById("reg_ukuran");
  const regPembayaran = document.getElementById("reg_pembayaran");

  if (isChecked) {
    if (container) container.classList.remove("hidden");
    if (regUkuran) regUkuran.required = true;
    if (regPembayaran) regPembayaran.required = true;
    window.toggleTransfer();
  } else {
    if (container) container.classList.add("hidden");
    if (regUkuran) {
      regUkuran.required = false;
      regUkuran.value = "";
    }
    if (regPembayaran) {
      regPembayaran.required = false;
      regPembayaran.value = "Cash";
    }
    const transferBox = document.getElementById("transfer_box");
    if (transferBox) transferBox.classList.add("hidden");
  }
};

// HANDLER PROSES REGISTRASI (UPLOAD FOTO PROFIL + BUKTI BAYAR)
window.handleRegisterProcess = async function (e) {
  if (e) e.preventDefault();

  const btnSubmit = document.getElementById("btn_submit_reg");
  const originalText = btnSubmit ? btnSubmit.innerHTML : "";

  try {
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span>MEMPROSES...</span> <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1"></div>`;
    }

    const nama = document.getElementById("reg_nama")?.value.trim() || "";
    const angkatan =
      document.getElementById("reg_angkatan")?.value.trim() || "-";
    const hp =
      document.getElementById("reg_hp")?.value.trim() ||
      document.getElementById("reg_no_hp")?.value.trim() ||
      "";
    const isBaju = document.getElementById("toggle_baju")?.checked;

    let ukuran = "-";
    let pembayaran = "Tidak Beli Baju";
    let keterangan =
      document.getElementById("reg_keterangan")?.value.trim() || "";

    if (isBaju) {
      ukuran = document.getElementById("reg_ukuran")?.value || "-";
      pembayaran = document.getElementById("reg_pembayaran")?.value || "Cash";
    } else if (!keterangan) {
      keterangan = "Hanya Pendaftaran Anggota";
    }

    // Process Foto Profil
    const fotoInput = document.getElementById("reg_foto");
    const fotoFile =
      fotoInput && fotoInput.files.length > 0 ? fotoInput.files[0] : null;
    const fotoData = fotoFile ? await fileToBase64(fotoFile) : null;

    // Process Bukti Bayar
    const buktiInput = document.getElementById("reg_bukti");
    const buktiFile =
      buktiInput && buktiInput.files.length > 0 ? buktiInput.files[0] : null;
    const buktiData = buktiFile ? await fileToBase64(buktiFile) : null;

    const payload = {
      action: "register",
      nama: nama,
      angkatan: angkatan,
      hp: hp,
      no_hp: hp,
      beliBaju: isBaju ? "Ya" : "Tidak",
      ukuran: ukuran,
      pembayaran: pembayaran,
      keterangan: keterangan,

      // Format ganda (Objek & Flat)
      foto: fotoData,
      bukti: buktiData,
      fotoBase64: fotoData ? fotoData.base64 : "",
      fotoName: fotoData ? fotoData.fileName : "",
      buktiBase64: buktiData ? buktiData.base64 : "",
      buktiName: buktiData ? buktiData.fileName : "",
    };

    const targetUrl = typeof SCRIPT_URL !== "undefined" ? SCRIPT_URL : "";
    if (!targetUrl) throw new Error("URL Server (SCRIPT_URL) belum diatur.");

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const res = await response.json();

    if (res.status === "success" || res.result === "success") {
      await showAlert(
        `Pendaftaran berhasil! ID Anda: ${res.id || "-"}`,
        "success",
      );
      const formEl = document.getElementById("form_pendaftaran");
      if (formEl) formEl.reset();
      window.toggleBajuOptions();
      navigateTo("login");
    } else {
      showAlert(
        "Gagal mendaftar: " + (res.message || "Terjadi kesalahan."),
        "error",
      );
    }
  } catch (err) {
    console.error(err);
    showAlert("Terjadi kesalahan: " + err.message, "error");
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  }
};

// Aliasing fungsi registrasi opsional
async function handleRegisterSubmit(event) {
  return window.handleRegisterProcess(event);
}

// ================= LOGIN & USER PROFILE =================

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
      if (res.role === "admin") {
        navigateTo("admin");
      } else {
        navigateTo("user");
      }
    } else {
      showAlert(res.message || "Username atau password salah!", "error");
    }
  } catch (err) {
    showLoading(false);
    showAlert("Gagal melakukan login: " + err.message, "error");
  }
}

function populateUserProfile() {
  if (!currentUser) {
    showAlert("Anda belum login!", "warning");
    navigateTo("login");
    return;
  }

  // Helper untuk mengubah Link Google Drive ke thumbnail image
  function getDirectUrl(url) {
    if (!url || url === "-" || String(url).startsWith("ERROR")) return "";
    if (String(url).startsWith("data:image")) return url;

    var match = String(url).match(/[-\w]{25,}/);
    if (match) {
      return "https://drive.google.com/thumbnail?id=" + match[0] + "&sz=w1000";
    }
    return url;
  }

  // 1. Update data pada Tampilan KTA
  const elId = document.getElementById("u_id");
  const elNama = document.getElementById("u_nama");
  const elAngkatan = document.getElementById("u_angkatan");
  const elHp = document.getElementById("u_hp");
  const elFoto = document.getElementById("u_foto");

  if (elId) elId.textContent = currentUser.id || "-";
  if (elNama) elNama.textContent = currentUser.nama || "-";
  if (elAngkatan) elAngkatan.textContent = currentUser.angkatan || "-";
  if (elHp) elHp.textContent = currentUser.no_hp || currentUser.hp || "-";

  // Render Foto Profil jika tersedia
  const fotoLink =
    currentUser.link_foto || currentUser.fotoUrl || currentUser.foto;
  if (elFoto && fotoLink && fotoLink !== "-") {
    const directUrl = getDirectUrl(fotoLink);
    if (directUrl) elFoto.src = directUrl;
  }

  // 2. Fill data ke Form Edit Profil
  const editNama = document.getElementById("edit_nama");
  const editHp = document.getElementById("edit_no_hp");
  const editUkuran = document.getElementById("edit_ukuran");

  if (editNama) editNama.value = currentUser.nama || "";
  if (editHp) editHp.value = currentUser.no_hp || currentUser.hp || "";
  if (editUkuran) editUkuran.value = currentUser.ukuran || "";
}

async function handleUpdateProfileSubmit(event) {
  event.preventDefault();
  if (!currentUser || !currentUser.id) {
    showAlert("Sesi login berakhir. Silakan login kembali.", "warning");
    navigateTo("login");
    return;
  }

  showLoading(true, "Memperbarui profil...");
  try {
    const nama = document.getElementById("edit_nama")?.value || "";
    const no_hp = document.getElementById("edit_no_hp")?.value || "";
    const ukuran = document.getElementById("edit_ukuran")?.value || "";

    const payload = {
      action: "updateProfile",
      id: currentUser.id,
      nama: nama,
      no_hp: no_hp,
      ukuran: ukuran,
    };

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const res = await response.json();
    showLoading(false);

    if (res.status === "success") {
      showAlert("Profil berhasil diperbarui!", "success");
      if (nama) currentUser.nama = nama;
      if (no_hp) {
        currentUser.no_hp = no_hp;
        currentUser.hp = no_hp;
      }
      if (ukuran) currentUser.ukuran = ukuran;
      saveSession(currentUser, currentUser.role);
    } else {
      showAlert("Gagal memperbarui profil: " + res.message, "error");
    }
  } catch (err) {
    showLoading(false);
    showAlert("Terjadi kesalahan: " + err.message, "error");
  }
}

// ================= PANEL ADMIN & REKAP DATA (CRUD + FILTER + EXPORT) =================

// Variable global untuk data admin
let adminRawData = [];
let filteredAdminData = [];

/**
 * Memuat data pendaftaran dari Google Apps Script
 */
async function loadAdminData() {
  const tbody =
    document.getElementById("tableAdminBody") ||
    document.getElementById("admin-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-8 text-slate-400 font-medium">
          <div class="flex items-center justify-center gap-2">
            <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Mengambil data pendaftaran...</span>
          </div>
        </td>
      </tr>`;
  }

  try {
    const response = await fetch(`${SCRIPT_URL}?action=getAdminData`);
    const res = await response.json();

    if (res.status === "success" || res.result === "success") {
      adminRawData = res.data || [];
      calculateAdminStats(adminRawData);
      filterTableData();
    } else {
      showAlert(
        "Gagal mengambil data: " + (res.message || "Terjadi kesalahan"),
        "error",
      );
    }
  } catch (err) {
    console.error(err);
    showAlert("Terjadi kesalahan koneksi: " + err.message, "error");
  }
}

// Aliasing agar sinkron dengan router initPageLogic()
async function fetchAdminData() {
  return loadAdminData();
}

/**
 * Menghitung dan merender statistik (Ringkasan Bayar & Rekap Ukuran Baju)
 */
function calculateAdminStats(data) {
  let total = data.length;
  let cashCount = 0;
  let transferCount = 0;

  const sizeCounts = {
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
    "3XL": 0,
  };

  data.forEach((item) => {
    // Hitung Metode Pembayaran
    const method = String(item.pembayaran || "")
      .trim()
      .toLowerCase();
    if (method === "cash") cashCount++;
    else if (method === "transfer") transferCount++;

    // Hitung Ukuran Baju
    const size = String(item.ukuran || "")
      .trim()
      .toUpperCase();
    if (sizeCounts.hasOwnProperty(size)) {
      sizeCounts[size]++;
    }
  });

  // Update statistik di DOM
  const elTotal = document.getElementById("stat_total");
  const elCash = document.getElementById("stat_cash");
  const elTransfer = document.getElementById("stat_transfer");

  if (elTotal) elTotal.textContent = total;
  if (elCash) elCash.textContent = cashCount;
  if (elTransfer) elTransfer.textContent = transferCount;

  // Update rekap ukuran baju
  const sizes = ["S", "M", "L", "XL", "XXL", "3XL"];
  sizes.forEach((s) => {
    const key = s.toLowerCase();
    const el = document.getElementById(`stat_${key}`);
    if (el) el.textContent = sizeCounts[s] || 0;
  });
}

/**
 * Menyaring (Filter & Search) data berdasarkan kata kunci, metode bayar, & ukuran
 */
function filterTableData() {
  const searchVal = (document.getElementById("searchAdmin")?.value || "")
    .toLowerCase()
    .trim();
  const filterBayar =
    document.getElementById("filterPembayaran")?.value || "ALL";
  const filterUkuran = document.getElementById("filterUkuran")?.value || "ALL";

  filteredAdminData = adminRawData.filter((item) => {
    const idStr = String(item.id || "").toLowerCase();
    const namaStr = String(item.nama || "").toLowerCase();
    const matchesSearch =
      idStr.includes(searchVal) || namaStr.includes(searchVal);

    const itemBayar = String(item.pembayaran || "").trim();
    const matchesBayar = filterBayar === "ALL" || itemBayar === filterBayar;

    const itemUkuran = String(item.ukuran || "")
      .trim()
      .toUpperCase();
    const matchesUkuran = filterUkuran === "ALL" || itemUkuran === filterUkuran;

    return matchesSearch && matchesBayar && matchesUkuran;
  });

  renderAdminTable(filteredAdminData);
}

/**
 * Merender baris tabel pendaftaran
 */
function renderAdminTable(dataList) {
  const tbody =
    document.getElementById("tableAdminBody") ||
    document.getElementById("admin-table-body");
  const rowCountEl = document.getElementById("admin_row_count");

  if (rowCountEl) {
    rowCountEl.textContent = `Menampilkan ${dataList.length} dari ${adminRawData.length} data`;
  }

  if (!tbody) return;

  if (dataList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-6 text-slate-400 font-medium">
          Tidak ada data yang sesuai.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = dataList
    .map((item) => {
      const bayarClass =
        item.pembayaran === "Transfer"
          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      return `
      <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
        <td class="py-2.5 px-3 font-bold text-slate-800">${item.id || "-"}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-900">${item.nama || "-"}</td>
        <td class="py-2.5 px-3 text-slate-600">${item.angkatan || "-"}</td>
        <td class="py-2.5 px-3 text-slate-600">${item.no_hp || item.hp || "-"}</td>
        <td class="py-2.5 px-3 text-center">
          <span class="px-2 py-0.5 rounded-lg bg-slate-100 font-extrabold text-[10px] text-slate-700">
            ${item.ukuran || "-"}
          </span>
        </td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold border ${bayarClass}">
            ${item.pembayaran || "-"}
          </span>
        </td>
        <td class="py-2.5 px-3 text-slate-500 text-[11px] max-w-[150px] truncate" title="${item.keterangan || ""}">
          ${item.keterangan || "-"}
        </td>
        <td class="py-2.5 px-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button 
              type="button"
              onclick="openModalEdit('${item.id}')"
              class="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg text-[10px] font-bold transition active:scale-95 cursor-pointer"
            >
              Edit
            </button>
            <button 
              type="button"
              onclick="deleteMember('${item.id}')"
              class="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2 py-1 rounded-lg text-[10px] font-bold transition active:scale-95 cursor-pointer"
            >
              Hapus
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// ================= MODAL & MANAJEMEN KONTROL CRUD =================

function openModalCreate() {
  const modal = document.getElementById("crudModal");
  const modalTitle = document.getElementById("modalTitle");
  const formIsEdit = document.getElementById("form_is_edit");
  const formId = document.getElementById("form_id");
  const form = document.getElementById("crudForm");

  if (form) form.reset();
  if (modalTitle) modalTitle.textContent = "Tambah Data Baru";
  if (formIsEdit) formIsEdit.value = "false";
  if (formId) {
    formId.readOnly = false;
    formId.classList.remove("bg-slate-100");
  }

  if (modal) modal.classList.remove("hidden");
}

function openModalEdit(id) {
  const item = adminRawData.find((d) => String(d.id) === String(id));
  if (!item) {
    showAlert("Data anggota tidak ditemukan!", "error");
    return;
  }

  const modal = document.getElementById("crudModal");
  const modalTitle = document.getElementById("modalTitle");
  const formIsEdit = document.getElementById("form_is_edit");

  // Populate Input Form
  document.getElementById("form_id").value = item.id || "";
  document.getElementById("form_nama").value = item.nama || "";
  document.getElementById("form_angkatan").value = item.angkatan || "";
  document.getElementById("form_no_hp").value = item.no_hp || item.hp || "";
  document.getElementById("form_ukuran").value = item.ukuran || "M";
  document.getElementById("form_pembayaran").value = item.pembayaran || "Cash";
  document.getElementById("form_keterangan").value = item.keterangan || "";

  // Set ID readonly saat edit
  const formId = document.getElementById("form_id");
  if (formId) {
    formId.readOnly = true;
    formId.classList.add("bg-slate-100");
  }

  if (modalTitle) modalTitle.textContent = "Edit Data Anggota";
  if (formIsEdit) formIsEdit.value = "true";

  if (modal) modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("crudModal");
  if (modal) modal.classList.add("hidden");
}

function handleModalBackdropClick(event) {
  if (event.target.id === "crudModal") {
    closeModal();
  }
}

async function submitForm(e) {
  if (e) e.preventDefault();

  const isEdit = document.getElementById("form_is_edit")?.value === "true";
  const btnSubmit = document.getElementById("btnSubmit");
  const originalText = btnSubmit ? btnSubmit.innerHTML : "Simpan";

  const payload = {
    action: isEdit ? "updateMember" : "createMember",
    id: document.getElementById("form_id")?.value.trim(),
    nama: document.getElementById("form_nama")?.value.trim(),
    angkatan: document.getElementById("form_angkatan")?.value.trim() || "-",
    no_hp: document.getElementById("form_no_hp")?.value.trim() || "",
    hp: document.getElementById("form_no_hp")?.value.trim() || "",
    ukuran: document.getElementById("form_ukuran")?.value || "M",
    pembayaran: document.getElementById("form_pembayaran")?.value || "Cash",
    keterangan: document.getElementById("form_keterangan")?.value.trim() || "",
  };

  if (!payload.id || !payload.nama) {
    showAlert("NTA / ID dan Nama Lengkap wajib diisi!", "warning");
    return;
  }

  try {
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span>Menyimpan...</span>`;
    }

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const res = await response.json();

    if (res.status === "success" || res.result === "success") {
      showAlert(
        isEdit
          ? "Data berhasil diperbarui!"
          : "Data baru berhasil ditambahkan!",
        "success",
      );
      closeModal();
      loadAdminData();
    } else {
      showAlert(
        "Gagal menyimpan data: " + (res.message || "Terjadi kesalahan"),
        "error",
      );
    }
  } catch (err) {
    console.error(err);
    showAlert("Terjadi kesalahan: " + err.message, "error");
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  }
}

async function deleteMember(id) {
  const confirmed = await showConfirm(
    `Apakah Anda yakin ingin menghapus anggota ID ${id}? Data yang dihapus tidak dapat dikembalikan.`,
    "Hapus Anggota",
  );
  if (!confirmed) return;

  showLoading(true, "Menghapus data...");
  try {
    const payload = { action: "deleteMember", id: id };

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const res = await response.json();
    showLoading(false);

    if (res.status === "success" || res.result === "success") {
      await showAlert("Anggota berhasil dihapus!", "success");
      loadAdminData();
    } else {
      showAlert(
        "Gagal menghapus: " + (res.message || "Terjadi kesalahan."),
        "error",
      );
    }
  } catch (err) {
    showLoading(false);
    showAlert("Terjadi kesalahan: " + err.message, "error");
  }
}

function exportTableToCSV() {
  if (!filteredAdminData || filteredAdminData.length === 0) {
    showAlert("Tidak ada data untuk diekspor!", "warning");
    return;
  }

  const headers = [
    "NTA / ID",
    "Nama Anggota",
    "Angkatan",
    "No. HP",
    "Ukuran Baju",
    "Pembayaran",
    "Keterangan",
  ];

  const csvRows = [
    headers.join(","),
    ...filteredAdminData.map((row) =>
      [
        `"${row.id || ""}"`,
        `"${(row.nama || "").replace(/"/g, '""')}"`,
        `"${row.angkatan || ""}"`,
        `"${row.no_hp || row.hp || ""}"`,
        `"${row.ukuran || ""}"`,
        `"${row.pembayaran || ""}"`,
        `"${(row.keterangan || "").replace(/"/g, '""')}"`,
      ].join(","),
    ),
  ];

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");

  const today = new Date().toISOString().split("T")[0];
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Rekap_Pendaftaran_Alumni_${today}.csv`);
  document.body.appendChild(link);

  link.click();
  document.body.removeChild(link);
}

// Window attachment
window.fetchAdminData = fetchAdminData;
window.loadAdminData = loadAdminData;
window.filterTableData = filterTableData;
window.openModalCreate = openModalCreate;
window.openModalEdit = openModalEdit;
window.closeModal = closeModal;
window.handleModalBackdropClick = handleModalBackdropClick;
window.submitForm = submitForm;
window.deleteMember = deleteMember;
window.exportTableToCSV = exportTableToCSV;

// ================= STATISTIK / INFO =================

async function fetchInfoStats() {
  const loadingEl = document.getElementById("info_loading");
  const contentEl = document.getElementById("info_content");

  if (loadingEl) loadingEl.classList.remove("hidden");
  if (contentEl) contentEl.classList.add("hidden");

  try {
    const response = await fetch(`${SCRIPT_URL}?action=getAll`);
    const res = await response.json();

    if (
      (res.status === "success" || res.result === "success") &&
      Array.isArray(res.data)
    ) {
      processAndRenderStats(res.data);
    } else {
      showAlert(
        "Gagal mengambil data statistik: " +
          (res.message || "Terjadi kesalahan pada server"),
        "error",
      );
    }
  } catch (err) {
    console.error(err);
    showAlert("Terjadi kesalahan koneksi: " + err.message, "error");
  } finally {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (contentEl) contentEl.classList.remove("hidden");
  }
}

function processAndRenderStats(data) {
  const totalDaftar = data.length;
  const statDaftar = document.getElementById("stat_total_daftar");
  if (statDaftar) statDaftar.textContent = totalDaftar;

  const countAngkatan = {};
  const sizesMaster = ["S", "M", "L", "XL", "XXL"];
  const countUkuran = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
  let totalBaju = 0;

  data.forEach((item) => {
    const angk = item.angkatan ? String(item.angkatan).trim() : "Lainnya";
    if (angk && angk !== "-") {
      countAngkatan[angk] = (countAngkatan[angk] || 0) + 1;
    }

    const sizeRaw = item.ukuran ? String(item.ukuran).trim().toUpperCase() : "";
    if (
      sizeRaw &&
      sizeRaw !== "-" &&
      sizeRaw !== "TIDAK BELI BAJU" &&
      sizeRaw !== "TIDAK BELI"
    ) {
      totalBaju++;
      if (countUkuran.hasOwnProperty(sizeRaw)) {
        countUkuran[sizeRaw]++;
      }
    }
  });

  const statBaju = document.getElementById("stat_total_baju");
  if (statBaju) statBaju.textContent = totalBaju;

  const containerAngkatan = document.getElementById("container_angkatan");
  if (containerAngkatan) {
    containerAngkatan.innerHTML = "";

    const sortedAngkatanKeys = Object.keys(countAngkatan).sort((a, b) => {
      const numA = parseInt(a, 10) || 999;
      const numB = parseInt(b, 10) || 999;
      return numA - numB;
    });

    if (sortedAngkatanKeys.length === 0) {
      containerAngkatan.innerHTML = `<p class="text-xs text-slate-400 text-center font-semibold py-2">Belum ada data pendaftaran</p>`;
    } else {
      sortedAngkatanKeys.forEach((key) => {
        const count = countAngkatan[key];
        const percent =
          totalDaftar > 0 ? Math.round((count / totalDaftar) * 100) : 0;

        containerAngkatan.innerHTML += `
            <div class="space-y-1">
              <div class="flex justify-between items-center text-xs font-extrabold text-slate-700">
                <span>Angkatan ${key}</span>
                <span class="text-slate-500">${count} Anggota <span class="text-[10px] font-bold text-sky-600">(${percent}%)</span></span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-sky-600 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
              </div>
            </div>
          `;
      });
    }
  }

  const containerUkuran = document.getElementById("container_ukuran");
  if (containerUkuran) {
    containerUkuran.innerHTML = "";

    sizesMaster.forEach((size) => {
      const count = countUkuran[size] || 0;
      containerUkuran.innerHTML += `
          <div class="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl flex flex-col items-center justify-center">
            <span class="text-[10px] font-black text-slate-400 block mb-0.5">${size}</span>
            <span class="text-base font-black text-slate-800">${count}</span>
            <span class="text-[8px] font-bold text-slate-400">Pcs</span>
          </div>
        `;
    });
  }
}

window.fetchInfoStats = fetchInfoStats;

// ================= INISIALISASI =================

window.addEventListener("DOMContentLoaded", () => {
  loadSession();
  const initialPage = window.location.hash.replace("#", "") || "home";
  loadPage(initialPage);
});

window.addEventListener("hashchange", () => {
  const pageName = window.location.hash.replace("#", "") || "home";
  loadPage(pageName);
});
