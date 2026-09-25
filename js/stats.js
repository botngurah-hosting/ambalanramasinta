// Variabel global untuk menyimpan data sementara agar bisa dibaca modal
let cachedMembersData = [];

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
      cachedMembersData = res.data; // Simpan data ke variabel global
      processAndRenderStats(res.data);
    } else {
      showAlert(
        "Gagal mengambil data statistik: " +
          (res.message || "Terjadi kesalahan"),
        "error",
      );
    }
  } catch (err) {
    showAlert("Terjadi kesalahan koneksi: " + err.message, "error");
  } finally {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (contentEl) contentEl.classList.remove("hidden");
  }
}

function processAndRenderStats(data) {
  const totalDaftar = data.length;
  if (document.getElementById("stat_total_daftar")) {
    document.getElementById("stat_total_daftar").textContent = totalDaftar;
  }

  const countAngkatan = {};
  const sizesMaster = ["S", "M", "L", "XL", "XXL"];
  const countUkuran = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
  let totalBaju = 0;

  data.forEach((item) => {
    const angk = item.angkatan ? String(item.angkatan).trim() : "Lainnya";
    if (angk && angk !== "-")
      countAngkatan[angk] = (countAngkatan[angk] || 0) + 1;

    const sizeRaw = item.ukuran ? String(item.ukuran).trim().toUpperCase() : "";
    if (sizeRaw && sizeRaw !== "-" && !sizeRaw.includes("TIDAK BELI")) {
      totalBaju++;
      if (countUkuran.hasOwnProperty(sizeRaw)) countUkuran[sizeRaw]++;
    }
  });

  if (document.getElementById("stat_total_baju")) {
    document.getElementById("stat_total_baju").textContent = totalBaju;
  }

  const containerAngkatan = document.getElementById("container_angkatan");
  if (containerAngkatan) {
    containerAngkatan.innerHTML = "";
    const sortedKeys = Object.keys(countAngkatan).sort(
      (a, b) => (parseInt(a, 10) || 999) - (parseInt(b, 10) || 999),
    );

    if (sortedKeys.length === 0) {
      containerAngkatan.innerHTML = `<p class="text-xs text-slate-400 text-center font-semibold py-2">Belum ada data pendaftaran</p>`;
    } else {
      sortedKeys.forEach((key) => {
        const count = countAngkatan[key];
        const percent =
          totalDaftar > 0 ? Math.round((count / totalDaftar) * 100) : 0;

        // Tambahkan event click onclick="openMembersModal('${key}')"
        containerAngkatan.innerHTML += `
          <div 
            onclick="openMembersModal('${key}')"
            class="space-y-1 p-2 bg-slate-50 hover:bg-sky-50/80 rounded-2xl border border-slate-100 transition-all cursor-pointer group"
            title="Klik untuk melihat daftar anggota angkatan ${key}"
          >
            <div class="flex justify-between items-center text-xs font-extrabold text-slate-700">
              <span class="group-hover:text-sky-600 transition-colors flex items-center gap-1">
                Angkatan ${key}
                <span class="text-[10px] text-sky-500 font-normal">🔍</span>
              </span>
              <span class="text-slate-500">${count} Anggota <span class="text-[10px] font-bold text-sky-600">(${percent}%)</span></span>
            </div>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div class="bg-sky-600 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
            </div>
          </div>`;
      });
    }
  }

  const containerUkuran = document.getElementById("container_ukuran");
  if (containerUkuran) {
    containerUkuran.innerHTML = "";
    sizesMaster.forEach((size) => {
      containerUkuran.innerHTML += `
        <div class="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl flex flex-col items-center justify-center">
          <span class="text-[10px] font-black text-slate-400 block mb-0.5">${size}</span>
          <span class="text-base font-black text-slate-800">${countUkuran[size] || 0}</span>
          <span class="text-[8px] font-bold text-slate-400">Pcs</span>
        </div>`;
    });
  }
}

// HELPER: Mengubah link Google Drive biasa menjadi Direct Link Gambar
function formatDriveUrl(url) {
  if (!url || url === "-" || typeof url !== "string") return null;

  // Jika bukan link Google Drive (misal base64 atau URL luar), kembalikan langsung
  if (!url.includes("drive.google.com")) return url;

  // Ekstrak File ID Google Drive dari URL
  const match = url.match(/[-\w]{25,}/);
  if (match && match[0]) {
    // Format link langsung gambar via Google UserContent CDN
    return `https://lh3.googleusercontent.com/d/${match[0]}`;
  }
  return url;
}

// FUNGSI MEMBUKA MODAL DAN MENAMPILKAN DAFTAR ANGGOTA PER ANGKATAN
window.openMembersModal = function (angkatan) {
  const filtered = cachedMembersData.filter(
    (m) => (m.angkatan ? String(m.angkatan).trim() : "Lainnya") === angkatan,
  );

  const titleEl = document.getElementById("modal_angkatan_title");
  const subEl = document.getElementById("modal_angkatan_subtitle");
  if (titleEl) titleEl.innerText = `Angkatan ${angkatan}`;
  if (subEl) subEl.innerText = `Total ${filtered.length} Anggota Terdaftar`;

  const listEl = document.getElementById("modal_members_list");
  if (listEl) {
    listEl.innerHTML = "";

    if (filtered.length === 0) {
      listEl.innerHTML = `<p class="text-center text-xs text-slate-400 py-6">Tidak ada anggota pada angkatan ini.</p>`;
    } else {
      filtered.forEach((m) => {
        const rawFoto = m.foto || m.link_foto || m.fotoUrl || m.foto_url;

        // Format link Drive menjadi link gambar langsung
        const formattedFoto = formatDriveUrl(rawFoto);
        const hasPhoto = formattedFoto && formattedFoto !== "-";

        const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          m.nama || "Member",
        )}&background=0284c7&color=fff&bold=true`;

        const photoSrc = hasPhoto ? formattedFoto : avatarFallback;

        const card = document.createElement("div");
        card.className =
          "flex items-center space-x-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all";

        card.innerHTML = `
          <img 
            src="${photoSrc}" 
            onerror="this.onerror=null; this.src='${avatarFallback}';"
            alt="${m.nama || "Foto"}" 
            class="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs cursor-pointer"
            onclick="window.openImageModal && window.openImageModal('${photoSrc}')"
            loading="lazy"
          />
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-extrabold text-slate-800 truncate">${m.nama || "-"}</h4>
            <p class="text-[10px] text-slate-400 font-medium">ID/NTA: ${m.id || "-"}</p>
            <div class="mt-1 flex items-center space-x-1">
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${
                m.ukuran &&
                m.ukuran !== "-" &&
                !String(m.ukuran).includes("TIDAK BELI")
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-200/60 text-slate-600"
              }">
                ${
                  m.ukuran &&
                  m.ukuran !== "-" &&
                  !String(m.ukuran).includes("TIDAK BELI")
                    ? "Jersey: " + m.ukuran
                    : "Tanpa Jersey"
                }
              </span>
            </div>
          </div>
        `;
        listEl.appendChild(card);
      });
    }
  }

  const modal = document.getElementById("membersModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
};

// FUNGSI TUTUP MODAL
window.closeMembersModal = function () {
  const modal = document.getElementById("membersModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
};

window.fetchInfoStats = fetchInfoStats;
