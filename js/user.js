function populateUserProfile() {
  if (!currentUser) {
    showAlert("Anda belum login!", "warning");
    navigateTo("login");
    return;
  }

  function getDirectUrl(url) {
    if (!url || url === "-" || String(url).startsWith("ERROR")) return "";
    if (String(url).startsWith("data:image")) return url;

    var match = String(url).match(/[-\w]{25,}/);
    return match
      ? "https://drive.google.com/thumbnail?id=" + match[0] + "&sz=w1000"
      : url;
  }

  const elId = document.getElementById("u_id");
  const elNama = document.getElementById("u_nama");
  const elAngkatan = document.getElementById("u_angkatan");
  const elHp = document.getElementById("u_hp");
  const elUkuran = document.getElementById("u_ukuran");
  const elFoto = document.getElementById("u_foto");

  if (elId) elId.textContent = currentUser.id || "-";
  if (elNama) elNama.textContent = currentUser.nama || "-";
  if (elAngkatan) elAngkatan.textContent = currentUser.angkatan || "-";
  if (elHp) elHp.textContent = currentUser.no_hp || currentUser.hp || "-";
  if (elUkuran) elUkuran.textContent = currentUser.ukuran || "-";

  const fotoLink =
    currentUser.link_foto || currentUser.fotoUrl || currentUser.foto;
  if (elFoto && fotoLink && fotoLink !== "-") {
    const directUrl = getDirectUrl(fotoLink);
    if (directUrl) elFoto.src = directUrl;
  }

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
      nama,
      no_hp,
      ukuran,
    };

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const res = await response.json();
    showLoading(false);

    if (res.status === "success") {
      if (nama) currentUser.nama = nama;
      if (no_hp) {
        currentUser.no_hp = no_hp;
        currentUser.hp = no_hp;
      }
      if (ukuran) currentUser.ukuran = ukuran;

      saveSession(currentUser, currentUser.role);
      populateUserProfile();
      await showAlert("Profil berhasil diperbarui!", "success");
    } else {
      showAlert("Gagal memperbarui profil: " + res.message, "error");
    }
  } catch (err) {
    showLoading(false);
    showAlert("Terjadi kesalahan: " + err.message, "error");
  }
}

// Variable penampung foto dari galeri
let uploadedPhotoBase64 = "";

// Fungsi pendukung untuk mengompresi foto galeri agar tidak berat saat dikirim ke server
function compressAndResizeImage(file, maxWidth, maxHeight, quality, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Handler saat input file galeri dipilih
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const labelText = document.getElementById("label_foto_text");
    if (labelText) labelText.innerText = "Memproses foto...";

    compressAndResizeImage(file, 400, 500, 0.8, function (compressedBase64) {
      uploadedPhotoBase64 = compressedBase64;
      const imgEl = document.getElementById("u_foto");
      if (imgEl) imgEl.src = compressedBase64;
      if (labelText) labelText.innerText = "✓ " + file.name;
    });
  }
}

function populateUserProfile() {
  if (!currentUser) {
    showAlert("Anda belum login!", "warning");
    navigateTo("login");
    return;
  }

  function getDirectUrl(url) {
    if (!url || url === "-" || String(url).startsWith("ERROR")) return "";
    if (String(url).startsWith("data:image")) return url;

    var match = String(url).match(/[-\w]{25,}/);
    return match
      ? "https://drive.google.com/thumbnail?id=" + match[0] + "&sz=w1000"
      : url;
  }

  const elId = document.getElementById("u_id");
  const elNama = document.getElementById("u_nama");
  const elAngkatan = document.getElementById("u_angkatan");
  const elHp = document.getElementById("u_hp");
  const elUkuran = document.getElementById("u_ukuran");
  const elKeterangan = document.getElementById("u_keterangan");
  const elFoto = document.getElementById("u_foto");

  if (elId) elId.textContent = currentUser.id || "-";
  if (elNama) elNama.textContent = currentUser.nama || "-";
  if (elAngkatan) elAngkatan.textContent = currentUser.angkatan || "-";
  if (elHp) elHp.textContent = currentUser.no_hp || currentUser.hp || "-";
  if (elUkuran) elUkuran.textContent = currentUser.ukuran || "-";
  if (elKeterangan) elKeterangan.textContent = currentUser.keterangan || "-";

  // Gunakan foto baru yang dipilih, atau jatuh ke data foto yang tersimpan dicurrentUser
  const fotoLink =
    uploadedPhotoBase64 ||
    currentUser.link_foto ||
    currentUser.fotoUrl ||
    currentUser.foto;

  if (elFoto && fotoLink && fotoLink !== "-") {
    const directUrl = getDirectUrl(fotoLink);
    if (directUrl) elFoto.src = directUrl;
  }

  const editNama = document.getElementById("edit_nama");
  const editHp = document.getElementById("edit_no_hp");
  const editUkuran = document.getElementById("edit_ukuran");
  const editKeterangan = document.getElementById("edit_keterangan");

  if (editNama) editNama.value = currentUser.nama || "";
  if (editHp) editHp.value = currentUser.no_hp || currentUser.hp || "";
  if (editUkuran) editUkuran.value = currentUser.ukuran || "";
  if (editKeterangan) editKeterangan.value = currentUser.keterangan || "";
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
    const keterangan = document.getElementById("edit_keterangan")?.value || "";

    const payload = {
      action: "updateProfile",
      id: currentUser.id,
      nama,
      no_hp,
      ukuran,
      keterangan,
    };

    // Jika pengguna memilih foto baru dari galeri, sertakan Base64 gambar ke payload
    if (uploadedPhotoBase64) {
      payload.foto = uploadedPhotoBase64;
    }

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const res = await response.json();
    showLoading(false);

    if (res.status === "success") {
      if (nama) currentUser.nama = nama;
      if (no_hp) {
        currentUser.no_hp = no_hp;
        currentUser.hp = no_hp;
      }
      if (ukuran) currentUser.ukuran = ukuran;
      currentUser.keterangan = keterangan;

      if (uploadedPhotoBase64) {
        currentUser.link_foto = uploadedPhotoBase64;
        currentUser.fotoUrl = uploadedPhotoBase64;
        currentUser.foto = uploadedPhotoBase64;
      }

      saveSession(currentUser, currentUser.role);
      populateUserProfile();
      await showAlert("Profil berhasil diperbarui!", "success");
    } else {
      showAlert("Gagal memperbarui profil: " + res.message, "error");
    }
  } catch (err) {
    showLoading(false);
    showAlert("Terjadi kesalahan: " + err.message, "error");
  }
}
