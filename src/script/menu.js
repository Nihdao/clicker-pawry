(function () {
  const SAVE_KEY = "js13k25_clickerpawry",
    start = document.getElementById("start"),
    btnNew = document.getElementById("btn-new"),
    btnHowto = document.getElementById("btn-howto"),
    btnClear = document.getElementById("btn-clear"),
    howtoModal = document.getElementById("howto-modal"),
    closeHowto = document.getElementById("close-howto"),
    recordDisplay = document.getElementById("record-display"),
    recordValue = document.getElementById("record-value");
  function loadAndDisplayRecord() {
    try {
      const persistentData = localStorage.getItem(SAVE_KEY);
      console.log(
        "Loading record from localStorage:",
        SAVE_KEY,
        persistentData
      );
      if (persistentData) {
        const data = JSON.parse(persistentData),
          highestFloor = data.highestFloor || 0;
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
  loadAndDisplayRecord();
  window.updateRecordDisplay = loadAndDisplayRecord;
  function begin() {
    start.style.display = "none";
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) gameContainer.style.display = "flex";
    const cv = document.getElementById("cv");
    if (cv && cv.focus) cv.focus();
  }
  function showModal(modal) {
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }
  function hideModal(modal) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }
  btnNew.addEventListener("click", () => begin());
  btnHowto.addEventListener("click", () => showModal(howtoModal));
  closeHowto.addEventListener("click", () => hideModal(howtoModal));
  howtoModal.addEventListener("click", (e) => {
    if (e.target === howtoModal) hideModal(howtoModal);
  });
  btnClear.addEventListener("click", () => {
    if (
      confirm(
        "⚠️ Are you sure you want to delete all your save data? This action is irreversible!"
      )
    ) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("js13k25_clickerpawry"))
          localStorage.removeItem(key);
      });
      alert("✅ Data deleted successfully!");
      window.location.reload();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && howtoModal.style.display === "flex")
      hideModal(howtoModal);
  });
})();
