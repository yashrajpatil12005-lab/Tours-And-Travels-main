// Smooth Scrolling (Safely ignores cross-page hash links)
document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    
    // Check if the link is a hash link for the current page
    const isCurrentPageHash = href.startsWith("#") || 
      (window.location.pathname.endsWith("index.html") && href.includes("index.html#")) ||
      (window.location.pathname === "/" && href.includes("index.html#"));
      
    if (isCurrentPageHash) {
      const targetId = href.substring(href.indexOf("#"));
      if (targetId === "#") return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        
        // Close mobile menu if open
        const navMenu = document.getElementById("navMenu");
        if (navMenu) {
          navMenu.classList.remove("active");
        }
        
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    }
  });
});

// Mobile Navigation Toggle
const menuToggleBtn = document.getElementById("menuToggleBtn");
const navMenu = document.getElementById("navMenu");

if (menuToggleBtn && navMenu) {
  menuToggleBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  // Close menu when clicking outside of it
  document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !menuToggleBtn.contains(e.target)) {
      navMenu.classList.remove("active");
    }
  });
}

// Interactive FAQ Accordion
const faqHeaders = document.querySelectorAll(".faq-header");

faqHeaders.forEach((header) => {
  header.addEventListener("click", () => {
    const faqItem = header.parentElement;
    const faqContent = faqItem.querySelector(".faq-content");
    const isActive = faqItem.classList.contains("active");

    // Close all other FAQ items first
    document.querySelectorAll(".faq-item").forEach((item) => {
      if (item !== faqItem) {
        item.classList.remove("active");
        item.querySelector(".faq-content").style.maxHeight = null;
      }
    });

    // Toggle current FAQ item
    if (isActive) {
      faqItem.classList.remove("active");
      faqContent.style.maxHeight = null;
    } else {
      faqItem.classList.add("active");
      faqContent.style.maxHeight = faqContent.scrollHeight + "px";
    }
  });
});

// Form Submission to Google Apps Script
const form = document.getElementById("safariForm");
const statusModal = document.getElementById("statusModal");
const closeModalBtn = document.getElementById("modalBtn");

// Close Modal Function (for error popups)
function closeModal() {
  if (statusModal) {
    statusModal.classList.remove("active");
  }
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

if (statusModal) {
  statusModal.addEventListener("click", (e) => {
    if (e.target === statusModal) {
      closeModal();
    }
  });
}

// Helper to show modal for errors
function showErrorModal(title, message) {
  if (!statusModal) return;

  const modalIcon = document.getElementById("modalIcon");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalBtn = document.getElementById("modalBtn");

  if (modalIcon) {
    modalIcon.innerHTML = "✕";
    modalIcon.classList.add("error");
  }
  if (modalBtn) {
    modalBtn.classList.add("error");
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
    submitBtn.innerText = "Submitting Inquiry...";
    submitBtn.disabled = true;

    // Collect data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log("📦 Payload:", data);

    // Google Apps Script Web App URL
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
        // Save to localStorage for confirmation page
        localStorage.setItem("last_booking_name", data.name || "");
        localStorage.setItem("last_booking_email", data.email || "");
        localStorage.setItem("last_booking_phone", data.phone || "");
        localStorage.setItem("last_booking_package", data.package || "");
        localStorage.setItem("last_booking_id_proof", data.id_proof || "");

        // Reset form
        form.reset();

        // Redirect to booking confirmation page
        const queryParams = new URLSearchParams({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          package: data.package || "",
          id_proof: data.id_proof || ""
        }).toString();

        window.location.href = `confirmation.html?${queryParams}`;
      } else {
        console.error("❌ Server returned logic error:", result);
        showErrorModal(
          "Submission Failed",
          "There was an issue submitting your enquiry. Please verify details and try again."
        );
      }
    } catch (error) {
      console.error("Error!", error.message);
      showErrorModal(
        "Connection Error",
        "Could not connect to the booking server. Please verify your internet connection or call/WhatsApp us directly."
      );
    } finally {
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}
