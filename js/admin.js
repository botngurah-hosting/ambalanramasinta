let adminRawData = [];
let filteredAdminData = [];

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
    showAlert("Terjadi kesalahan koneksi: " + err.message, "error");
  }
}

async function fetchAdminData() {
  return loadAdminData();
}

function calculateAdminStats(data) {
  let total = data.length,
    cashCount = 0,
    transferCount = 0;
  const sizeCounts = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0 };

  data.forEach((item) => {
    const method = String(item.pembayaran || "")
      .trim()
      .toLowerCase();
    if (method === "cash") cashCount++;
    else if (method === "transfer") transferCount++;

    const size = String(item.ukuran || "")
      .trim()
      .toUpperCase();
    if (sizeCounts.hasOwnProperty(size)) sizeCounts[size]++;
  });

  if (document.getElementById("stat_total"))
    document.getElementById("stat_total").textContent = total;
  if (document.getElementById("stat_cash"))
    document.getElementById("stat_cash").textContent = cashCount;
  if (document.getElementById("stat_transfer"))
    document.getElementById("stat_transfer").textContent = transferCount;

  ["S", "M", "L", "XL", "XXL", "3XL"].forEach((s) => {
    const el = document.getElementById(`stat_${s.toLowerCase()}`);
    if (el) el.textContent = sizeCounts[s] || 0;
  });
}

function filterTableData() {
  const searchVal = (document.getElementById("searchAdmin")?.value || "")
    .toLowerCase()
    .trim();
  const filterBayar =
    document.getElementById("filterPembayaran")?.value || "ALL";
  const filterUkuran = document.getElementById("filterUkuran")?.value || "ALL";

  filteredAdminData = adminRawData.filter((item) => {
    const matchesSearch =
      String(item.id || "")
        .toLowerCase()
        .includes(searchVal) ||
      String(item.nama || "")
        .toLowerCase()
        .includes(searchVal);
    const matchesBayar =
      filterBayar === "ALL" ||
      String(item.pembayaran || "").trim() === filterBayar;
    const matchesUkuran =
      filterUkuran === "ALL" ||
      String(item.ukuran || "")
        .trim()
        .toUpperCase() === filterUkuran;

    return matchesSearch && matchesBayar && matchesUkuran;
  });

  renderAdminTable(filteredAdminData);
}

function renderAdminTable(dataList) {
  const tbody =
    document.getElementById("tableAdminBody") ||
    document.getElementById("admin-table-body");
  const rowCountEl = document.getElementById("admin_row_count");

  if (rowCountEl)
    rowCountEl.textContent = `Menampilkan ${dataList.length} dari ${adminRawData.length} data`;
  if (!tbody) return;

  if (dataList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-slate-400 font-medium">Tidak ada data yang sesuai.</td></tr>`;
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
        <td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-lg bg-slate-100 font-extrabold text-[10px] text-slate-700">${item.ukuran || "-"}</span></td>
        <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded-full text-[9px] font-bold border ${bayarClass}">${item.pembayaran || "-"}</span></td>
        <td class="py-2.5 px-3 text-slate-500 text-[11px] max-w-[150px] truncate" title="${item.keterangan || ""}">${item.keterangan || "-"}</td>
        <td class="py-2.5 px-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button type="button" onclick="openModalEdit('${item.id}')" class="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg text-[10px] font-bold">Edit</button>
            <button type="button" onclick="deleteMember('${item.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2 py-1 rounded-lg text-[10px] font-bold">Hapus</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function openModalCreate() {
  const form = document.getElementById("crudForm");
  if (form) form.reset();
  if (document.getElementById("modalTitle"))
    document.getElementById("modalTitle").textContent = "Tambah Data Baru";
  if (document.getElementById("form_is_edit"))
    document.getElementById("form_is_edit").value = "false";

  const formId = document.getElementById("form_id");
  if (formId) {
    formId.readOnly = false;
    formId.classList.remove("bg-slate-100");
  }
  document.getElementById("crudModal")?.classList.remove("hidden");
}

function openModalEdit(id) {
  const item = adminRawData.find((d) => String(d.id) === String(id));
  if (!item) return showAlert("Data anggota tidak ditemukan!", "error");

  document.getElementById("form_id").value = item.id || "";
  document.getElementById("form_nama").value = item.nama || "";
  document.getElementById("form_angkatan").value = item.angkatan || "";
  document.getElementById("form_no_hp").value = item.no_hp || item.hp || "";
  document.getElementById("form_ukuran").value = item.ukuran || "M";
  document.getElementById("form_pembayaran").value = item.pembayaran || "Cash";
  document.getElementById("form_keterangan").value = item.keterangan || "";

  const formId = document.getElementById("form_id");
  if (formId) {
    formId.readOnly = true;
    formId.classList.add("bg-slate-100");
  }

  if (document.getElementById("modalTitle"))
    document.getElementById("modalTitle").textContent = "Edit Data Anggota";
  if (document.getElementById("form_is_edit"))
    document.getElementById("form_is_edit").value = "true";
  document.getElementById("crudModal")?.classList.remove("hidden");
}

function closeModal() {
  document.getElementById("crudModal")?.classList.add("hidden");
}

function handleModalBackdropClick(event) {
  if (event.target.id === "crudModal") closeModal();
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

  if (!payload.id || !payload.nama)
    return showAlert("NTA / ID dan Nama Lengkap wajib diisi!", "warning");

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
    `Apakah Anda yakin ingin menghapus anggota ID ${id}? Data tidak dapat dikembalikan.`,
    "Hapus Anggota",
  );
  if (!confirmed) return;

  showLoading(true, "Menghapus data...");
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "deleteMember", id }),
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
  if (!filteredAdminData || filteredAdminData.length === 0)
    return showAlert("Tidak ada data untuk diekspor!", "warning");

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

  const link = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  link.setAttribute(
    "href",
    encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n")),
  );
  link.setAttribute("download", `Rekap_Pendaftaran_Alumni_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Window Exposures
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
