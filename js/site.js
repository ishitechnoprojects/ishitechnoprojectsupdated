// ==========================================================================
// ISHITECHNO PROJECTS — Shared site behaviour (nav, whatsapp, footer year)
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); });
    });
  }

  var yearEls = document.querySelectorAll(".year");
  yearEls.forEach(function (el) { el.textContent = new Date().getFullYear(); });
});

// Build a WhatsApp click-to-chat link with a prefilled message
function waLink(message) {
  var phone = "918096661501";
  return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    var msg = el.getAttribute("data-wa") || "Hello Ishitechno Projects, I would like more information.";
    el.setAttribute("href", waLink(msg));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
});
