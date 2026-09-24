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

      const hpNum = String(item.no_hp || item.hp || "").trim();
      const hasHp = hpNum && hpNum !== "-";

      const namaEscaped = (item.nama || "")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
      const ukuranEscaped = (item.ukuran || "-")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
      const bayarEscaped = (item.pembayaran || "-")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");

      const waBtnHtml = hasHp
        ? `<button type="button" onclick="contactWA('${hpNum}', '${namaEscaped}', '${ukuranEscaped}', '${bayarEscaped}')" title="Chat WA ke ${hpNum}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold border border-emerald-200 transition text-[11px] cursor-pointer group shadow-sm">
            <svg class="w-3.5 h-3.5 fill-emerald-600 group-hover:fill-white shrink-0 transition" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99 0-3.951-.5-5.688-1.448l-6.205 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span class="font-mono">${hpNum}</span>
          </button>`
        : `<span class="text-slate-400 font-mono text-xs">-</span>`;

      return `
      <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
        <td class="py-2.5 px-3 font-bold text-slate-800">${item.id || "-"}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-900">${item.nama || "-"}</td>
        <td class="py-2.5 px-3 text-slate-600">${item.angkatan || "-"}</td>
        <td class="py-2.5 px-3">${waBtnHtml}</td>
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

function contactWA(noHp, nama = "", ukuran = "-", pembayaran = "-") {
  if (!noHp || noHp === "-") {
    if (typeof showAlert === "function") {
      showAlert("Nomor WhatsApp tidak valid!", "warning");
    } else {
      alert("Nomor WhatsApp tidak valid!");
    }
    return;
  }
  let cleanNumber = String(noHp).replace(/[^0-9]/g, "");
  if (cleanNumber.startsWith("0")) {
    cleanNumber = "62" + cleanNumber.slice(1);
  }

  // Pesan WhatsApp tanpa emoji sama sekali
  const pesan = `*Salam Pramuka!*

Yth. Kak *${nama || "Anggota"}*

Terima kasih telah berpartisipasi dan melakukan pendaftaran keanggotaan Ambalan Rama Sinta (Gudep 05.193 - 05.194).

Berikut adalah rincian pendaftaran Kakak:

*Ukuran Baju:* ${ukuran}
*Metode Pembayaran:* ${pembayaran}

Untuk penyelesaian pembayaran via transfer, silakan menyalurkan ke rekening resmi berikut:
*Bank BRI:* \`357601028469531\`

Mohon untuk me-reply pesan ini dengan melampirkan foto/screenshot bukti transfer.

Terima kasih atas perhatian dan partisipasi Kakak.

*Salam,*
*Pengurus GPRS*`;

  window.open(
    `https://wa.me/${cleanNumber}?text=${encodeURIComponent(pesan)}`,
    "_blank",
  );
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
window.contactWA = contactWA;
