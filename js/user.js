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
