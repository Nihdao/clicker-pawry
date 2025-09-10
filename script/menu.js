/**
 * Clicker Pawry - Main menu management
 * Handles start screen and modals
 */

(function () {
  const SAVE_KEY = "js13k25_clickerpawry";
  const start = document.getElementById("start");
  const btnNew = document.getElementById("btn-new");
  const btnHowto = document.getElementById("btn-howto");
  const btnClear = document.getElementById("btn-clear");
  const howtoModal = document.getElementById("howto-modal");
  const closeHowto = document.getElementById("close-howto");
  const recordDisplay = document.getElementById("record-display");
  const recordValue = document.getElementById("record-value");

  // Load and display record
  function loadAndDisplayRecord() {
    try {
      const persistentData = localStorage.getItem(SAVE_KEY);
      console.log(
        "Loading record from localStorage:",
        SAVE_KEY,
        persistentData
      );
      if (persistentData) {
        const data = JSON.parse(persistentData);
        const highestFloor = data.highestFloor || 0;
        console.log("Parsed data:", data, "highestFloor:", highestFloor);
        if (highestFloor > 0) {
          recordValue.textContent = `Floor ${highestFloor}`;
          recordDisplay.style.display = "flex";
          console.log("Record displayed:", highestFloor);
        } else {
          recordDisplay.style.display = "none";
          console.log("No record to display");
        }
      } else {
        recordDisplay.style.display = "none";
        console.log("No persistent data found");
      }
    } catch (e) {
      console.warn("Could not load record:", e);
      recordDisplay.style.display = "none";
    }
  }

  // Load record on page load
  loadAndDisplayRecord();

  // Expose function globally for game to update record
  window.updateRecordDisplay = loadAndDisplayRecord;

  function begin() {
    // Hide start screen and show game container
    start.style.display = "none";
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.style.display = "flex";
    }
    const cv = document.getElementById("cv");
    if (cv && cv.focus) cv.focus();
    // Game will automatically load from localStorage if available
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
  btnNew.addEventListener("click", () => begin());

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
      // Data cleared successfully
      alert("✅ Data deleted successfully!");
      // Reload the page to ensure clean state
      window.location.reload();
    }
  });

  // Keyboard shortcuts handling
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && howtoModal.style.display === "flex") {
      hideModal(howtoModal);
    }
  });
})();
