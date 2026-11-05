/* Slide carousels for the "My talks" page */
function initTalkCarousels() {
  document.querySelectorAll(".talk-carousel:not([data-ready])").forEach(function (root) {
    root.setAttribute("data-ready", "");
    var track = document.createElement("div");
    track.className = "talk-carousel__track";
    while (root.firstChild) track.appendChild(root.firstChild);
    Array.prototype.slice.call(track.childNodes).forEach(function (n) {
      if (n.nodeType !== 1) track.removeChild(n);
      else n.classList.add("talk-carousel__slide");
    });
    var slides = track.children, total = slides.length;

    var prev = document.createElement("button");
    prev.className = "talk-carousel__btn talk-carousel__btn--prev";
    prev.setAttribute("aria-label", "Previous slide");
    prev.innerHTML = "&#8249;";
    var next = document.createElement("button");
    next.className = "talk-carousel__btn talk-carousel__btn--next";
    next.setAttribute("aria-label", "Next slide");
    next.innerHTML = "&#8250;";
    var counter = document.createElement("div");
    counter.className = "talk-carousel__counter";

    root.appendChild(track);
    root.appendChild(prev);
    root.appendChild(next);
    root.appendChild(counter);
    root.setAttribute("tabindex", "0");

    function current() { return Math.round(track.scrollLeft / track.clientWidth); }
    function update() {
      var i = current();
      counter.textContent = (i + 1) + " / " + total;
      prev.disabled = i <= 0;
      next.disabled = i >= total - 1;
    }
    function go(i) {
      i = Math.max(0, Math.min(total - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    }
    prev.addEventListener("click", function () { go(current() - 1); });
    next.addEventListener("click", function () { go(current() + 1); });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
    });
    var t;
    track.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(update, 60); });
    window.addEventListener("resize", update);
    update();
  });
}
if (typeof document$ !== "undefined") document$.subscribe(initTalkCarousels);
else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initTalkCarousels);
else initTalkCarousels();
