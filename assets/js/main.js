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
    var succes = document.getElementById("form-succes");
    var fout = document.getElementById("form-fout");
    var knop = form.querySelector("button[type=submit]");
    var knopTekst = knop ? knop.textContent : "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var privacy = form.querySelector("#privacy");
      if (privacy && !privacy.checked) {
        privacy.focus();
        return;
      }
      if (fout) fout.classList.remove("toon");
      if (knop) {
        knop.disabled = true;
        knop.textContent = "Versturen…";
      }
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Formspree antwoordde " + res.status);
          if (succes) succes.classList.add("toon");
          form.reset();
        })
        .catch(function () {
          if (fout) fout.classList.add("toon");
        })
        .then(function () {
          if (knop) {
            knop.disabled = false;
            knop.textContent = knopTekst;
          }
        });
    });
  }
})();
