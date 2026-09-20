"use strict";

document.documentElement.classList.add("js");

const CONFIG = Object.freeze({
  names: { first: "许毕胜", second: "李小哲" },
  togetherSince: "2024-05-20T20:13:14+08:00",
  photoSelector: ".photo-card",
  music: "assets/music/te-bie-de-ren.mp3",
  shareUrl: "https://zhuyan621.github.io/xu-lixiao-love/index.html?v=20260920b"
});

const body = document.body;
const entryGate = document.getElementById("entry-gate");
const enterButton = document.getElementById("enter-story");
const music = document.getElementById("background-music");
const musicToggle = document.getElementById("music-toggle");
const carousel = document.getElementById("photo-carousel");
const track = carousel.querySelector(".photo-track");
const cards = Array.from(document.querySelectorAll(CONFIG.photoSelector));
const dotsRoot = document.getElementById("photo-dots");
const prevButton = document.querySelector(".carousel-prev");
const nextButton = document.querySelector(".carousel-next");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxCaption = document.getElementById("lightbox-caption");
const closeLightboxButton = document.querySelector(".lightbox-close");

let activePhoto = 0;
let autoPlayTimer = null;
let resumeAutoPlayTimer = null;
let pointerStartX = 0;
let pointerStartY = 0;
let pointerMoved = false;
let musicAvailable = false;

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function formatTogetherDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date).replace(/\//g, "年").replace(/年(\d+)年/, "年$1月").replace(/日/, "日 ");
}

function updateTimer() {
  const startTime = new Date(CONFIG.togetherSince).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  const days = Math.floor(elapsedSeconds / 86400);
  const hours = Math.floor((elapsedSeconds % 86400) / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  document.getElementById("days").textContent = pad(days, 3);
  document.getElementById("hours").textContent = pad(hours);
  document.getElementById("minutes").textContent = pad(minutes);
  document.getElementById("seconds").textContent = pad(seconds);
}

function initTimer() {
  const startDate = new Date(CONFIG.togetherSince);
  const dateNode = document.getElementById("together-date");
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(startDate).reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});

  dateNode.textContent = `${parts.year}年${parts.month}${parts.day}日 ${parts.hour}:${parts.minute}:${parts.second}`;
  dateNode.dateTime = CONFIG.togetherSince;
  updateTimer();
  window.setInterval(updateTimer, 250);
  document.addEventListener("visibilitychange", updateTimer);
}

function enterStory() {
  body.classList.add("entered");
  entryGate.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    entryGate.hidden = true;
    startCarouselAutoPlay();
  }, 750);

  if (musicAvailable) {
    music.volume = 0.42;
    music.play().then(() => {
      musicAvailable = true;
      musicToggle.hidden = false;
      updateMusicState(true);
    }).catch(() => {
      updateMusicState(false);
    });
  }
}

function updateMusicState(isPlaying) {
  musicToggle.classList.toggle("is-playing", isPlaying);
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute("aria-label", isPlaying ? "暂停背景音乐" : "播放背景音乐");
}

function toggleMusic() {
  if (music.paused) {
    music.play().then(() => updateMusicState(true)).catch(() => updateMusicState(false));
  } else {
    music.pause();
    updateMusicState(false);
  }
}

function probeMusic() {
  const musicUrl = new URL(CONFIG.music, window.location.href).href;
  fetch(musicUrl, { method: "HEAD", cache: "no-store" })
    .then((response) => {
      musicAvailable = response.ok;
      if (musicAvailable) {
        music.src = CONFIG.music;
        music.load();
      }
      musicToggle.hidden = !musicAvailable;
    })
    .catch(() => {
      musicAvailable = false;
      musicToggle.hidden = true;
    });
}

function initMusic() {
  music.volume = 0.42;
  music.addEventListener("play", () => {
    musicToggle.hidden = false;
    updateMusicState(true);
  });
  music.addEventListener("pause", () => updateMusicState(false));
  music.addEventListener("error", () => {
    musicAvailable = false;
    musicToggle.hidden = true;
    updateMusicState(false);
  });
  musicToggle.addEventListener("click", toggleMusic);
  probeMusic();
}

function buildPhotoDots() {
  cards.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "photo-dot";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-label", `查看第 ${index + 1} 张照片`);
    button.addEventListener("click", () => {
      pauseCarouselForInteraction();
      scrollToPhoto(index);
    });
    dotsRoot.appendChild(button);
  });
  updateActivePhoto(0);
}

function scrollToPhoto(index, behavior = "smooth") {
  const nextIndex = (index + cards.length) % cards.length;
  const card = cards[nextIndex];
  const targetLeft = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
  track.scrollTo({ left: targetLeft, behavior });
  updateActivePhoto(nextIndex);
}

function updateActivePhoto(index) {
  activePhoto = index;
  cards.forEach((card, cardIndex) => card.classList.toggle("is-active", cardIndex === index));
  Array.from(dotsRoot.children).forEach((dot, dotIndex) => {
    const isActive = dotIndex === index;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-selected", String(isActive));
    dot.tabIndex = isActive ? 0 : -1;
  });
}

function findNearestPhoto() {
  const center = track.scrollLeft + track.clientWidth / 2;
  return cards.reduce((nearestIndex, card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const currentDistance = Math.abs(cardCenter - center);
    const nearestCard = cards[nearestIndex];
    const nearestDistance = Math.abs(nearestCard.offsetLeft + nearestCard.offsetWidth / 2 - center);
    return currentDistance < nearestDistance ? index : nearestIndex;
  }, 0);
}

function startCarouselAutoPlay() {
  window.clearInterval(autoPlayTimer);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  autoPlayTimer = window.setInterval(() => {
    if (document.visibilityState === "visible" && !lightbox.hidden) return;
    if (document.visibilityState === "visible") scrollToPhoto(activePhoto + 1);
  }, 5200);
}

function pauseCarouselForInteraction() {
  window.clearInterval(autoPlayTimer);
  window.clearTimeout(resumeAutoPlayTimer);
  resumeAutoPlayTimer = window.setTimeout(startCarouselAutoPlay, 7000);
}

function openLightbox(index) {
  const card = cards[index];
  const image = card.querySelector("img");
  const caption = card.querySelector("figcaption");
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = caption ? caption.textContent.replace(/\s+/g, " ").trim() : "";
  lightbox.hidden = false;
  body.style.overflow = "hidden";
  closeLightboxButton.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  body.style.overflow = "";
  cards[activePhoto].querySelector("img").focus?.();
}

function initCarousel() {
  if (!cards.length || !track) return;
  buildPhotoDots();

  prevButton.addEventListener("click", () => {
    pauseCarouselForInteraction();
    scrollToPhoto(activePhoto - 1);
  });

  nextButton.addEventListener("click", () => {
    pauseCarouselForInteraction();
    scrollToPhoto(activePhoto + 1);
  });

  track.addEventListener("scroll", () => {
    window.clearTimeout(track.scrollEndTimer);
    track.scrollEndTimer = window.setTimeout(() => updateActivePhoto(findNearestPhoto()), 90);
  }, { passive: true });

  track.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    pointerMoved = false;
    pauseCarouselForInteraction();
  }, { passive: true });

  track.addEventListener("pointermove", (event) => {
    if (Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) > 9) {
      pointerMoved = true;
    }
  }, { passive: true });

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (!pointerMoved) openLightbox(index);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(index);
      }
    });
  });

  closeLightboxButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
  });
}

function initRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    observer.observe(item);
  });
}

enterButton.addEventListener("click", enterStory);
initTimer();
initMusic();
initCarousel();
initRevealAnimations();
