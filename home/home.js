const pageMenu = document.getElementById("pageMenu");
const menuItems = [...document.querySelectorAll(".itemMenu")];

const vidBg    = document.getElementById("vidBg");
const vidIntro = document.getElementById("vidIntro"); 
const numMenu  = document.getElementById("numMenu");
const titleHint   = document.getElementById("titleHint");
const confirmWipe = document.getElementById("confirmWipe");

const audMove   = document.getElementById("audMove");
const audConfirm = document.getElementById("audConfirm");
const audBg     = document.getElementById("audBg");

const popupDisc = document.getElementById("popupDisc");
const btnEnter  = document.getElementById("btnEnter");

const screenPause = document.getElementById("screenPause");
const siteIcon    = document.getElementById("siteIcon");

let overlayRatio = document.getElementById("overlayRatio");
if (!overlayRatio) {
  overlayRatio = document.createElement("div");
  overlayRatio.id = "overlayRatio";
  Object.assign(overlayRatio.style, {
    position:       "fixed",
    top:            "0",
    left:           "0",
    width:          "100%",
    height:         "100%",
    background:     "#111",
    color:          "#fff",
    display:        "none",
    justifyContent: "center",
    alignItems:     "center",
    flexDirection:  "column",
    fontSize:       "1.4rem",
    textAlign:      "center",
    zIndex:         "99999",
    fontFamily:     "Arial, sans-serif",
    gap:            "12px",
  });
  overlayRatio.innerHTML = `
    <div>Unsupported screen ratio!</div>
    <div>Please resize your window.</div>
    <div id="ratioInfo" style="font-size:0.9rem;color:#ffcc00;margin-top:8px;"></div>
  `;
  document.body.appendChild(overlayRatio);
}

const ratioInfo = document.getElementById("ratioInfo");

const TARGET_RATIO     = 16 / 9;
const RATIO_TOLERANCE  = 0.5;  

let isRatioOk = true; 

function checkAspectRatio() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const current = w / h;

  if (ratioInfo) {
    ratioInfo.textContent =
      `Current: ${current.toFixed(3)}  |  Target: ${TARGET_RATIO.toFixed(3)}`;
  }

  const ok = Math.abs(current - TARGET_RATIO) <= RATIO_TOLERANCE;

  if (ok === isRatioOk) return; 
  isRatioOk = ok;

  if (ok) {
    
    overlayRatio.style.display = "none";
    if (audBg && hasEntered && !isPaused) {
      audBg.muted = false;
      if (audBg.paused) {
        audBg.play()
          .then(() => fadeMusicIn(800))
          .catch(() => queueMusicStart());
      }
    }
  } else {
    
    overlayRatio.style.display = "flex";
    if (audBg) {
      stopMusicFade();
      audBg.muted = true;
    }
  }
}

window.addEventListener("resize", checkAspectRatio);
window.addEventListener("load",   checkAspectRatio);

const DISC_KEY   = "discAccepted";
const DISC_TITLE = "Disclaimer!";
const SITE_TITLE = "Home";

const DISC_ICON = "home/assets/icondisclaimer.png";
const SITE_ICON = "home/assets/icon.png";

const MUSIC_VOL     = 0.3;
const MUSIC_FADE_MS = 1400;

const INTRO_MIN_MS      = 6000;  
const INTRO_FALLBACK_MS = 14000; 

let hasEntered   = sessionStorage.getItem(DISC_KEY) === "true";
let selected     = Math.max(0, menuItems.findIndex(item => item.classList.contains("active")));

let isLocked    = false;
let musicStarted = false;
let introStarted = false;
let waitingMusicGesture = false;
let timerMusicFade = null;

let isPaused  = false;
let isLeaving = false;

let introVideoDone = false;


menuItems.forEach(item => {
  const text = item.textContent.trim();

  item.textContent = "";

  const span = document.createElement("span");
  span.className = "textMenu";
  span.setAttribute("textCopy", text);
  span.textContent = text;

  item.appendChild(span);
});

if (screenPause) {
  screenPause.classList.remove("active");
  screenPause.hidden = true;
}


function setPageIcon(entered) {
  document.title = entered ? SITE_TITLE : DISC_TITLE;

  if (siteIcon) {
    siteIcon.href = entered ? SITE_ICON : DISC_ICON;
  }
}


function stopMusicFade() {
  if (timerMusicFade) {
    clearInterval(timerMusicFade);
    timerMusicFade = null;
  }
}

function fadeMusicIn(duration = MUSIC_FADE_MS) {
  if (!audBg) return;

  stopMusicFade();

  const steps    = 30;
  const stepTime = duration / steps;
  let step       = 0;

  if (!isRatioOk) return;

  audBg.muted  = false;
  audBg.volume = 0;

  timerMusicFade = setInterval(() => {
    step++;

    const progress = step / steps;
    audBg.volume   = Math.min(MUSIC_VOL, MUSIC_VOL * progress);

    if (step >= steps) {
      stopMusicFade();
      audBg.volume = MUSIC_VOL;
    }
  }, stepTime);
}

function queueMusicStart() {
  if (waitingMusicGesture) return;

  waitingMusicGesture = true;

  const retryMusic = () => {
    waitingMusicGesture = false;

    document.removeEventListener("pointerdown", retryMusic);
    document.removeEventListener("keydown",     retryMusic);

    startMusic(false);
  };

  document.addEventListener("pointerdown", retryMusic, { once: true });
  document.addEventListener("keydown",     retryMusic, { once: true });
}

function startMusic(delayFade = true) {
  if (!audBg) return;

  const firstStart = !musicStarted;

  if (!firstStart && !audBg.paused) return;

  musicStarted = true;
  audBg.loop   = true;

  if (firstStart) {
    audBg.muted  = true;
    audBg.volume = 0;
  }

  audBg.play()
    .then(() => {
      if (firstStart && delayFade) {
        setTimeout(() => {
          if (!isPaused) fadeMusicIn(1600);
        }, 2000);
      } else {
        fadeMusicIn(1000);
      }
    })
    .catch(() => {
      if (firstStart) musicStarted = false;
      queueMusicStart();
    });
}


function playBgVid() {
  if (!vidBg) return;

  vidBg.muted      = true;
  vidBg.loop       = true;
  vidBg.playsInline = true;

  vidBg.setAttribute("muted",       "");
  vidBg.setAttribute("loop",        "");
  vidBg.setAttribute("playsinline", "");
  vidBg.setAttribute("autoplay",    "");

  const play = () => {
    vidBg.play().catch(() => {
      setTimeout(() => { vidBg.play().catch(() => {}); }, 250);
    });
  };

  if (vidBg.readyState >= 2) {
    play();
  } else {
    vidBg.load();
    vidBg.addEventListener("canplay", play, { once: true });
  }
}


function playIntroVid() {
  if (!vidIntro || introVideoDone) {
    switchToLoop();
    return;
  }

  vidIntro.muted       = true;
  vidIntro.loop        = false;
  vidIntro.playsInline = true;
  vidIntro.currentTime = 0;

  vidIntro.classList.add("playing");
  vidIntro.play().catch(() => {}); 

  setTimeout(switchToLoop, 6000);
}

function switchToLoop() {
  if (introVideoDone) return; 
  introVideoDone = true;

  if (vidIntro) {
    vidIntro.classList.remove("playing");
    vidIntro.classList.add("done"); 
    setTimeout(() => {
      try { vidIntro.pause(); vidIntro.removeAttribute("src"); vidIntro.load(); } catch (_) {}
    }, 700);
  }

  playBgVid();
  guardBgVid(vidBg);
}


function enterSite() {
  if (hasEntered) return;

  hasEntered = true;
  sessionStorage.setItem(DISC_KEY, "true");

  setPageIcon(true);

  if (popupDisc) {
    popupDisc.classList.add("hidden");
    setTimeout(() => { popupDisc.remove(); }, 500);
  }

  startMusic(true);

  playIntroVid();

  startIntro();
}


function playSound(sound) {
  if (!sound || !hasEntered || isPaused) return;

  sound.currentTime = 0;
  sound.play().catch(() => {});
}


function sizeActiveShard(item) {
  if (!item) return;

  const textWidth  = item.offsetWidth;
  const textHeight = item.offsetHeight;

  const shardW = textWidth  * 1.2;
  const shardH = textHeight * 1.2;
  const shardY = textHeight * -0.1;

  const shardMidY    = shardY + shardH * 0.5;
  const shardBottomY = shardY + shardH;

  item.style.setProperty("--shardW",       `${shardW}px`);
  item.style.setProperty("--shardH",       `${shardH}px`);
  item.style.setProperty("--shardY",       `${shardY}px`);
  item.style.setProperty("--shardMidY",    `${shardMidY}px`);
  item.style.setProperty("--shardBottomY", `${shardBottomY}px`);
}

function updateMenu(useSound = false) {
  if (!menuItems.length) return;

  menuItems.forEach((item, index) => {
    const isActive = index === selected;

    item.classList.toggle("active", isActive);
    item.classList.remove("bump");
    item.tabIndex = isActive ? 0 : -1;

    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  const current = menuItems[selected];
  const label   = current.title || current.textContent.trim();

  if (numMenu)    numMenu.textContent  = String(selected + 1).padStart(2, "0");
  if (titleHint)  titleHint.textContent = label;

  sizeActiveShard(current);
  current.focus({ preventScroll: true });

  if (useSound) {
    void current.offsetWidth;
    current.classList.add("bump");
    playSound(audMove);
  }
}

function moveMenu(direction) {
  if (!hasEntered || isLocked || isPaused || !menuItems.length) return;

  selected = (selected + direction + menuItems.length) % menuItems.length;
  updateMenu(true);
}

function confirmMenu() {
  if (!hasEntered || isLocked || isPaused || !menuItems.length) return;

  isLocked = true;

  const link = menuItems[selected].getAttribute("href");

  playSound(audConfirm);

  if (confirmWipe) {
    confirmWipe.classList.remove("active");
    void confirmWipe.offsetWidth;
    confirmWipe.classList.add("active");
  }

  setTimeout(() => {
    if (link && link !== "#") {
      isLeaving = true;
      window.location.href = link;
      return;
    }

    isLocked = false;

    if (confirmWipe) confirmWipe.classList.remove("active");
  }, 430);
}

function closeMenu() {
  if (!hasEntered || isLocked || isPaused) return;

  isLocked  = true;
  isLeaving = true;

  if (confirmWipe) {
    confirmWipe.classList.remove("active");
    void confirmWipe.offsetWidth;
    confirmWipe.classList.add("active");
  }

  setTimeout(() => { history.back(); }, 430);
}

function startIntro() {
  if (!pageMenu || introStarted) return;

  introStarted = true;
  pageMenu.classList.add("introWiping");

  setTimeout(() => {
    pageMenu.classList.add("menuLoaded", "introEntering");
    updateMenu(false);

    setTimeout(() => {
      pageMenu.classList.remove("introEntering");
    }, 950);
  }, 1050);
}


function pauseSite() {
  if (!hasEntered || isPaused || isLeaving) return;

  isPaused = true;
  isLocked = true;

  if (screenPause) {
    screenPause.hidden = false;
    requestAnimationFrame(() => { screenPause.classList.add("active"); });
  }

  if (vidIntro && !introVideoDone) {
    vidIntro.pause();
  }
  if (vidBg) {
    vidBg.pause();
  }

  if (audBg) {
    stopMusicFade();
    audBg.pause();
  }
}

function resumeSite(event) {
  if (!isPaused) return;
  if (document.hidden) return;

  if (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  isPaused = false;
  isLocked = false;

  if (screenPause) {
    screenPause.classList.remove("active");
    setTimeout(() => {
      if (!isPaused) screenPause.hidden = true;
    }, 260);
  }

  if (vidIntro && !introVideoDone) {
    vidIntro.play().catch(() => {});
  } else {
    playBgVid();
  }

  if (audBg) {
    // Respect ratio gate when resuming
    if (isRatioOk) {
      audBg.muted  = false;
      audBg.volume = 0;

      audBg.play()
        .then(() => { fadeMusicIn(1000); })
        .catch(() => { queueMusicStart(); });
    } else {
      audBg.muted = true;
    }
  }

  updateMenu(false);
}

function resumeHome() {
  if (!hasEntered) return;

  isLeaving = false;
  isPaused  = false;
  isLocked  = false;

  setPageIcon(true);

  if (screenPause) {
    screenPause.classList.remove("active");
    screenPause.hidden = true;
  }

  if (confirmWipe) confirmWipe.classList.remove("active");

  if (pageMenu) {
    pageMenu.classList.remove("introEntering");
    pageMenu.classList.add("menuLoaded");
  }

  updateMenu(false);
  playIntroVid();
  switchToLoop();

  if (audBg) {
    
    if (isRatioOk) {
      audBg.volume = 0;

      audBg.play()
        .then(() => { fadeMusicIn(1000); })
        .catch(() => { queueMusicStart(); });
    } else {
      audBg.muted = true;
    }
  }
}


menuItems.forEach((item, index) => {
  item.addEventListener("mouseenter", () => {
    if (!hasEntered || isLocked || isPaused || selected === index) return;

    selected = index;
    updateMenu(true);
  });

  item.addEventListener("click", event => {
    event.preventDefault();

    if (!hasEntered || isLocked || isPaused) return;

    if (selected !== index) {
      selected = index;
      updateMenu(true);
      return;
    }

    confirmMenu();
  });

  item.addEventListener("focus", () => {
    if (!hasEntered || isLocked || isPaused || selected === index) return;

    selected = index;
    updateMenu(false);
  });
});


document.addEventListener("pointerdown", event => {
  if (isPaused) resumeSite(event);
}, true);

document.addEventListener("keydown", event => {
  if (isPaused) resumeSite(event);
}, true);

document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (!hasEntered) {
    if (key === "enter") {
      event.preventDefault();
      enterSite();
    }
    return;
  }

  if (isPaused) return;

  if (key === "arrowdown" || key === "s") { event.preventDefault(); moveMenu(1);   return; }
  if (key === "arrowup"   || key === "w") { event.preventDefault(); moveMenu(-1);  return; }
  if (key === "enter"     || key === " ") { event.preventDefault(); confirmMenu(); return; }
  if (key === "escape")                   { event.preventDefault(); closeMenu();          }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseSite();
});

window.addEventListener("focus", () => {
  if (!hasEntered) return;

  if (!isPaused) {
    if (introVideoDone) {
      playBgVid();
    } else if (vidIntro) {
      vidIntro.play().catch(() => {});
    }
  }
});

window.addEventListener("resize", () => {
  if (!hasEntered || isPaused) return;
  updateMenu(false);
});

window.addEventListener("pagehide", () => {
  isLocked  = false;
  isLeaving = true;

  stopMusicFade();

  if (confirmWipe) confirmWipe.classList.remove("active");
});

window.addEventListener("pageshow", event => {
  const navigation = performance.getEntriesByType("navigation")[0];

  if (event.persisted || navigation?.type === "back_forward") {
    resumeHome();
  } else {
    isLeaving = false;
  }
});


if (hasEntered) {

  setPageIcon(true);

  if (popupDisc) popupDisc.remove();

  if (screenPause) {
    screenPause.classList.remove("active");
    screenPause.hidden = true;
  }

  startIntro();
  startMusic(false);
  queueMusicStart();

 } else {
  setPageIcon(false);

  if (screenPause) {
    screenPause.classList.remove("active");
    screenPause.hidden = true;
  }

  if (btnEnter) btnEnter.addEventListener("click", enterSite);
}

checkAspectRatio();


function guardBgVid(video) {
  if (!video) return;

  video.muted      = true;
  video.loop       = true;
  video.autoplay   = true;
  video.playsInline = true;

  video.setAttribute("muted",       "");
  video.setAttribute("loop",        "");
  video.setAttribute("autoplay",    "");
  video.setAttribute("playsinline", "");

  let lastTime     = 0;
  let stuckTicks   = 0;
  let hardResetting = false;

  function tryPlay() {
    if (document.hidden || isPaused) return;
    video.play().catch(() => {});
  }

  function softRestart() {
    if (document.hidden || isPaused) return;

    try { video.currentTime = Math.max(0, video.currentTime - 0.05); } catch (_) {}
    tryPlay();
  }

  function hardRestart() {
    if (document.hidden || isPaused || hardResetting) return;

    hardResetting = true;

    try { video.pause(); video.load(); } catch (_) {}

    setTimeout(() => {
      hardResetting = false;
      tryPlay();
    }, 120);
  }

  video.addEventListener("pause",   () => { setTimeout(tryPlay, 80); });
  video.addEventListener("stalled",  softRestart);
  video.addEventListener("waiting",  softRestart);
  video.addEventListener("suspend",  softRestart);
  video.addEventListener("emptied",  hardRestart);
  video.addEventListener("error",    hardRestart);
  video.addEventListener("ended", () => {
    try { video.currentTime = 0; } catch (_) {}
    tryPlay();
  });


  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !isPaused) setTimeout(tryPlay, 120);
  });

  window.addEventListener("focus",     tryPlay);
  window.addEventListener("pageshow",  tryPlay);
  window.addEventListener("click",     tryPlay);
  window.addEventListener("keydown",   tryPlay);
  window.addEventListener("touchstart", tryPlay, { passive: true });


  setInterval(() => {
    if (document.hidden || isPaused) return;

    const time     = video.currentTime;
    const isMoving = Math.abs(time - lastTime) > 0.03;

    if (video.paused) {
      tryPlay();
    }

    if (!isMoving && !video.paused) {
      stuckTicks++;
    } else {
      stuckTicks = 0;
    }

    if (stuckTicks >= 4) {
      stuckTicks = 0;
      hardRestart();
    }

    lastTime = time;
  }, 700);

  tryPlay();
}