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
        containerAngkatan.innerHTML += `
          <div class="space-y-1">
            <div class="flex justify-between items-center text-xs font-extrabold text-slate-700">
              <span>Angkatan ${key}</span>
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

window.fetchInfoStats = fetchInfoStats;
