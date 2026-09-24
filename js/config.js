// CONFIGURATION
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz9Uf8oUccYuOU12fgo9HDE1NIAoQyt2sa9EMSwG4IYZsNf7KyjbFF_dFOhzfzUfSLAhw/exec";
let currentUser = null;

// NOTIFIKASI HELPER (SWEETALERT2)
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
      confirmButtonColor: "#0284c7",
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
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
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
