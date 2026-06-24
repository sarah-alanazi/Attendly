import { apiFetch } from "/attendly/public/assets/js/api.js";
import { storage } from "/attendly/public/assets/js/storage.js";

const form = document.getElementById("loginForm");
const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const alertBox = document.getElementById("alertBox");
const loginBtn = document.getElementById("loginBtn");
const spinner = loginBtn.querySelector(".att-spinner");
const btnText = loginBtn.querySelector(".att-btn-text");
const rememberMe = document.getElementById("rememberMe");
const togglePass = document.getElementById("togglePass");
const passwordInput = document.getElementById("password");

function showAlert(type, message) {
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
}

function hideAlert() {
  alertBox.classList.add("d-none");
  alertBox.textContent = "";
}

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  if (isLoading) {
    spinner.classList.remove("d-none");
    btnText.textContent = "Signing in...";
  } else {
    spinner.classList.add("d-none");
    btnText.textContent = "Sign In";
  }
}

function validate() {
  let ok = true;

  usernameEl.classList.remove("is-invalid");
  passwordEl.classList.remove("is-invalid");

  if (!usernameEl.value.trim()) {
    usernameEl.classList.add("is-invalid");
    ok = false;
  }
  if (!passwordEl.value.trim()) {
    passwordEl.classList.add("is-invalid");
    ok = false;
  }

  return ok;
}

togglePass.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  if (!validate()) {
    showAlert("danger", "Please fill in the required fields.");
    return;
  }

  setLoading(true);

  try {
    const payload = {
      username: usernameEl.value.trim(),
      password: passwordEl.value
    };

    const res = await apiFetch("/attendly/backend/api/auth/login.php", {
      method: "POST",
      data: payload
    });

    if (!res || !res.success) {
      throw new Error(res?.error || "Login failed. Please try again.");
    }

    const sessionData = {
      user_id: res.user?.user_id,
      username: res.user?.username,
      role: res.user?.role
    };

    if (rememberMe.checked) storage.set("attendly_session", sessionData);
    else sessionStorage.setItem("attendly_session", JSON.stringify(sessionData));

    showAlert("success", "Login successful. Redirecting...");

    // Redirect based on role
    const redirect = res.redirect || "/attendly/public/index.html";
    setTimeout(() => {
      window.location.href = redirect;
    }, 700);

  } catch (err) {
    showAlert("danger", err.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
});
