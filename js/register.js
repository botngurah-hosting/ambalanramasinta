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
    transferBox.classList.toggle("hidden", regPembayaran.value !== "Transfer");
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

window.handleRegisterProcess = async function (e) {
  if (e) e.preventDefault();

  // 1. CEK APABILA USER SUDAH PERNAH DAFTAR DARI BROWSER/PERANGKAT INI
  if (localStorage.getItem("has_registered") === "true") {
    showAlert("Anda sudah pernah melakukan pendaftaran sebelumnya!", "warning");
    navigateTo("login");
    return;
  }

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

    const fotoFile = document.getElementById("reg_foto")?.files[0] || null;
    const fotoData = fotoFile ? await fileToBase64(fotoFile) : null;

    const buktiFile = document.getElementById("reg_bukti")?.files[0] || null;
    const buktiData = buktiFile ? await fileToBase64(buktiFile) : null;

    const payload = {
      action: "register",
      nama,
      angkatan,
      hp,
      no_hp: hp,
      beliBaju: isBaju ? "Ya" : "Tidak",
      ukuran,
      pembayaran,
      keterangan,
      foto: fotoData,
      bukti: buktiData,
      fotoBase64: fotoData ? fotoData.base64 : "",
      fotoName: fotoData ? fotoData.fileName : "",
      buktiBase64: buktiData ? buktiData.base64 : "",
      buktiName: buktiData ? buktiData.fileName : "",
    };

    if (!SCRIPT_URL) throw new Error("URL Server (SCRIPT_URL) belum diatur.");

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const res = await response.json();

    if (res.status === "success" || res.result === "success") {
      // 2. TANDAI BAHWA PERANGKAT/PENGGUNA SUDAH BERHASIL DAFTAR
      localStorage.setItem("has_registered", "true");
      if (res.id) localStorage.setItem("registered_id", res.id);

      await showAlert(
        `Pendaftaran berhasil! ID Anda: ${res.id || "-"}`,
        "success",
      );
      document.getElementById("form_pendaftaran")?.reset();
      window.toggleBajuOptions();
      navigateTo("login");
    } else {
      // Tangani penolakan dari server jika No HP / Data sudah terdaftar
      showAlert(
        "Gagal mendaftar: " + (res.message || "Data sudah terdaftar."),
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
};

async function handleRegisterSubmit(event) {
  return window.handleRegisterProcess(event);
}
