// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    if (targetId === "#") return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
      });
    }
  });
});

// Form Submission to Google Apps Script
const form = document.getElementById("safariForm");
const statusDiv = document.getElementById("formStatus");
const statusModal = document.getElementById("statusModal");
const closeModalBtn = document.getElementById("modalBtn");

// Dynamic Modal Elements
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalBtn = document.getElementById("modalBtn");

// Close Modal Function
function closeModal() {
  if (statusModal) {
    statusModal.classList.remove("active");
  }
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

// Close on outside click
if (statusModal) {
  statusModal.addEventListener("click", (e) => {
    if (e.target === statusModal) {
      closeModal();
    }
  });
}

// Helper to show modal
function showModal(isSuccess, title, message) {
  if (!statusModal) return;

  if (isSuccess) {
    if (modalIcon) {
      modalIcon.innerHTML = "✓";
      modalIcon.classList.remove("error");
    }
    if (modalBtn) {
      modalBtn.classList.remove("error");
    }
  } else {
    if (modalIcon) {
      modalIcon.innerHTML = "✕";
      modalIcon.classList.add("error");
    }
    if (modalBtn) {
      modalBtn.classList.add("error");
    }
  }

  if (modalTitle) modalTitle.innerText = title;
  if (modalMessage) modalMessage.innerText = message;

  statusModal.classList.add("active");
}

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("🚀 Form submission started!");

    // Show loading state
    const submitBtn = form.querySelector(".submit-btn");
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Sending...";
    submitBtn.disabled = true;

    // Collect data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log("📦 Payload:", data);

    // ✅ Replace with your actual Google Apps Script Web App URL
    const SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbwM7bmSCZ6Nkkzsf26Kxg5aLa2qoNeQfL_sV8B8yykkuWj3yh8o9mJ8rvPPIYUV6CCZ/exec";
    console.log("🔗 Target URL:", SCRIPT_URL);

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
      });

      console.log("📡 Response Status:", response.status);

      const textResult = await response.text();
      console.log("📄 Raw Response:", textResult);

      let result;
      try {
        result = JSON.parse(textResult);
      } catch (err) {
        console.warn("⚠️ Could not parse JSON.");
        throw new Error("Invalid server response.");
      }

      console.log("✅ Parsed Result:", result);

      if (result.result === "success") {
        showModal(
          true,
          "Submission Successful!",
          "Thank you for booking with us. We will get back to you shortly."
        );
        form.reset();
      } else {
        console.error("❌ Server returned logic error:", result);
        showModal(
          false,
          "Submission Failed",
          "There was an issue submitting your form. Please try again."
        );
      }
    } catch (error) {
      console.error("Error!", error.message);
      showModal(
        false,
        "Error",
        "Could not connect to the server. Please check your internet connection or use WhatsApp."
      );
    } finally {
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}
