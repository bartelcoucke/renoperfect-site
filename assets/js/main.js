(function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll(".js-jaar").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  var form = document.getElementById("contactformulier");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var privacy = form.querySelector("#privacy");
      if (privacy && !privacy.checked) {
        privacy.focus();
        return;
      }
      var naam = (form.naam && form.naam.value) || "";
      var type = (form.type && form.type.value) || "";
      var email = (form.email && form.email.value) || "";
      var telefoon = (form.telefoon && form.telefoon.value) || "";
      var beschrijving = (form.beschrijving && form.beschrijving.value) || "";
      var onderwerp = "Nieuwe aanvraag via website: " + type + " — " + naam;
      var body =
        "Naam: " + naam +
        "\nEmail: " + email +
        "\nTelefoon: " + telefoon +
        "\nType: " + type +
        "\nBeschrijving: " + beschrijving;
      var mailto =
        "mailto:bartelcoucke@renoperfect.be?subject=" +
        encodeURIComponent(onderwerp) +
        "&body=" +
        encodeURIComponent(body);
      window.location.href = mailto;
      var succes = document.getElementById("form-succes");
      if (succes) succes.classList.add("toon");
      form.reset();
    });
  }
})();
