/**
 * Clicker Pawry - Main menu management
 * Handles start screen and modals
 */

(function () {
  const SAVE_KEY = "js13k25_clickerpawry";
  const start = document.getElementById("start");
  const btnNew = document.getElementById("btn-new");
  const btnCont = document.getElementById("btn-continue");
  const btnHowto = document.getElementById("btn-howto");
  const btnClear = document.getElementById("btn-clear");
  const howtoModal = document.getElementById("howto-modal");
  const closeHowto = document.getElementById("close-howto");

  // Check for save data presence
  function checkSaveData() {
    const hasSave = !!localStorage.getItem(SAVE_KEY);
    btnCont.style.display = hasSave ? "block" : "none";
  }

  // Initialize button states
  checkSaveData();

  function begin(mode) {
    // Hide start screen and focus canvas
    start.style.display = "none";
    const cv = document.getElementById("cv");
    if (cv && cv.focus) cv.focus();
    // Let game logic handle loading/reloading (game.js)
    // Here we notify intent via a lightweight flag if needed
    try {
      sessionStorage.setItem("cp_start_mode", mode);
    } catch {}
  }

  // Modal management
  function showModal(modal) {
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }

  function hideModal(modal) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  // Event listeners
  btnNew.addEventListener("click", () => begin("new"));
  btnCont.addEventListener("click", () => begin("continue"));

  btnHowto.addEventListener("click", () => showModal(howtoModal));
  closeHowto.addEventListener("click", () => hideModal(howtoModal));

  // Close modal by clicking outside
  howtoModal.addEventListener("click", (e) => {
    if (e.target === howtoModal) hideModal(howtoModal);
  });

  // Clear Data button handling
  btnClear.addEventListener("click", () => {
    if (
      confirm(
        "⚠️ Are you sure you want to delete all your save data? This action is irreversible!"
      )
    ) {
      // Remove all game-related data
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("js13k25_clickerpawry")) {
          localStorage.removeItem(key);
        }
      });
      // Update display
      checkSaveData();
      alert("✅ Data deleted successfully!");
    }
  });

  // Keyboard shortcuts handling
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && howtoModal.style.display === "flex") {
      hideModal(howtoModal);
    }
  });
})();
