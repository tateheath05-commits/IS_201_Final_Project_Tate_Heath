(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const menuOverlay = document.getElementById("menuOverlay");
  const messageOverlay = document.getElementById("messageOverlay");
  const messageTitle = document.getElementById("messageTitle");
  const messageBody = document.getElementById("messageBody");
  const messageBtn = document.getElementById("messageBtn");
  const startBtn = document.getElementById("startBtn");
  const exitGameBtn = document.getElementById("exitGameBtn");
  const mountainBadge = document.getElementById("mountainBadge");

  const avatarText = document.getElementById("avatarText");
  const levelText = document.getElementById("levelText");
  const animalText = document.getElementById("animalText");
  const altitudeText = document.getElementById("altitudeText");
  const altitudeFill = document.getElementById("altitudeFill");
  const waterFill = document.getElementById("waterFill");
  const waterText = document.getElementById("waterText");
  const starsList = document.getElementById("starsList");

  const LEVELS = [
    {
      mountain: "Mount Kosciuszko",
      continent: "Australia",
      height: 2228,
      animal: "Dingo",
      animalColor: "#cd8f3f"
    },
    {
      mountain: "Mount Vinson",
      continent: "Antarctica",
      height: 4892,
      animal: "Polar Bear",
      animalColor: "#f4fdff"
    },
    {
      mountain: "Mount Elbrus",
      continent: "Europe",
      height: 5642,
      animal: "Wolf",
      animalColor: "#9eb2c2"
    },
    {
      mountain: "Mount Kilimanjaro",
      continent: "Africa",
      height: 5895,
      animal: "Lion",
      animalColor: "#d89a2d"
    },
    {
      mountain: "Mount McKinley / Denali",
      continent: "North America",
      height: 6190,
      animal: "Grizzly Bear",
      animalColor: "#a27042"
    },
    {
      mountain: "Aconcagua",
      continent: "South America",
      height: 6962,
      animal: "Jaguar",
      animalColor: "#dfad58"
    },
    {
      mountain: "Mount Everest",
      continent: "Asia",
      height: 8848,
      animal: "Snow Leopard",
      animalColor: "#dae7f5"
    }
  ];

  const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
  };

  const game = {
    status: "menu",
    selectedAvatar: null,
    levelIndex: 0,
    consecutiveDeaths: 0,
    starsEarned: Array(LEVELS.length).fill(0),
    player: {
      x: canvas.width / 2,
      y: canvas.height - 92,
      w: 40,
      h: 56,
      moveSpeed: 360,
      jumpDuration: 0.62,
      jumpPeak: 76,
      jumpTimer: 0,
      jumpLift: 0
    },
    obstacles: [],
    bottles: [],
    water: 100,
    climbed: 0,
    worldScroll: 0,
    summitCutscene: {
      active: false,
      t: 0,
      x: canvas.width / 2,
      y: canvas.height - 92
    },
    spawnTimer: 0,
    bottleTimer: 0,
    now: performance.now()
  };

  const avatarBtns = [...document.querySelectorAll(".avatar-btn")];
  avatarBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      avatarBtns.forEach((item) => {
        item.classList.remove("selected");
        item.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("selected");
      btn.setAttribute("aria-pressed", "true");
      game.selectedAvatar = btn.dataset.avatar;
      avatarText.textContent = game.selectedAvatar === "male" ? "Male climber" : "Female climber";
      startBtn.disabled = false;
    });
  });

  startBtn.addEventListener("click", () => {
    menuOverlay.classList.remove("active");
    game.status = "playing";
    resetLevelState();
  });

  exitGameBtn.addEventListener("click", () => {
    const shouldExit = window.confirm("Exit current climb and return to avatar selection?");
    if (!shouldExit) {
      return;
    }

    messageOverlay.classList.remove("active");
    game.levelIndex = 0;
    game.consecutiveDeaths = 0;
    game.starsEarned = Array(LEVELS.length).fill(0);
    game.selectedAvatar = null;
    avatarText.textContent = "Not selected";
    avatarBtns.forEach((item) => {
      item.classList.remove("selected");
      item.setAttribute("aria-pressed", "false");
    });
    startBtn.disabled = true;
    game.status = "menu";
    resetLevelState();
    renderPeaksList();
    menuOverlay.classList.add("active");
  });

  messageBtn.addEventListener("click", () => {
    messageOverlay.classList.remove("active");
    if (game.status === "next-level") {
      game.levelIndex += 1;
      game.consecutiveDeaths = 0;
      if (game.levelIndex >= LEVELS.length) {
        game.status = "victory";
        showMessage("Seven Summits Complete", "You conquered every summit and earned 3 stars on each climb.", "Play Again", () => {
          resetEntireGame();
        });
        return;
      }
      game.status = "playing";
      resetLevelState();
      return;
    }

    if (game.status === "retry-level") {
      game.status = "playing";
      resetLevelState();
      return;
    }

    if (game.status === "reset-expedition") {
      resetEntireGame();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      event.preventDefault();
      keys[event.code] = true;
    }

    if (event.code === "Space") {
      event.preventDefault();
      keys.Space = true;
      if (game.status === "playing" && game.player.jumpTimer <= 0) {
        game.player.jumpTimer = game.player.jumpDuration;
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      keys[event.code] = false;
    }
    if (event.code === "Space") {
      keys.Space = false;
    }
  });

  function resetLevelState() {
    game.obstacles = [];
    game.bottles = [];
    game.water = 100;
    game.climbed = 0;
    game.worldScroll = 0;
    game.summitCutscene.active = false;
    game.summitCutscene.t = 0;
    game.summitCutscene.x = canvas.width / 2;
    game.summitCutscene.y = canvas.height - 92;
    game.spawnTimer = 0;
    game.bottleTimer = 0;
    game.player.x = canvas.width / 2;
    game.player.y = canvas.height - 92;
    game.player.jumpTimer = 0;
    game.player.jumpLift = 0;
    updateHud();
    renderPeaksList();
  }

  function resetEntireGame() {
    game.levelIndex = 0;
    game.consecutiveDeaths = 0;
    game.starsEarned = Array(LEVELS.length).fill(0);
    game.status = "playing";
    resetLevelState();
    renderPeaksList();
  }

  function showMessage(title, body, buttonText, callback) {
    messageTitle.textContent = title;
    messageBody.textContent = body;
    messageBtn.textContent = buttonText;
    messageOverlay.classList.add("active");

    const next = () => {
      messageBtn.removeEventListener("click", next);
      callback();
    };

    messageBtn.addEventListener("click", next);
  }

  function getLevelConfig() {
    const idx = game.levelIndex;
    return {
      obstacleRate: Math.max(0.2, 1.05 - idx * 0.1),
      obstacleSpeed: 26 + idx * 8,
      dehydrationPerSecond: 3.8 + idx * 0.95,
      waterBottleRate: Math.max(2.2, 4.2 - idx * 0.32),
      climbRate: 115 + idx * 16,
      worldScrollSpeed: 170 + idx * 26,
      mountainBottomWidth: 560 - idx * 16,
      mountainTopWidth: 130 - idx * 6
    };
  }

  function getMountainBounds(progress, cfg) {
    const width = cfg.mountainBottomWidth - (cfg.mountainBottomWidth - cfg.mountainTopWidth) * easeInCubic(progress);
    const left = (canvas.width - width) / 2;
    return {
      left,
      right: left + width,
      width
    };
  }

  function easeInCubic(value) {
    return value * value * value;
  }

  function spawnObstacle(level, cfg, progress) {
    const bounds = getMountainBounds(progress, cfg);
    const kindRoll = Math.random();
    let type = "boulder";
    if (kindRoll > 0.6 && kindRoll <= 0.85) {
      type = "animal";
    } else if (kindRoll > 0.85) {
      type = "crevasse";
    }

    if (type === "crevasse") {
      const width = 50 + Math.random() * 42;
      game.obstacles.push({
        type,
        x: rand(bounds.left + width / 2, bounds.right - width / 2),
        y: -30,
        w: width,
        h: 16
      });
      return;
    }

    const radius = type === "boulder" ? 16 + Math.random() * 8 : 14 + Math.random() * 6;
    game.obstacles.push({
      type,
      x: rand(bounds.left + radius, bounds.right - radius),
      y: -30,
      r: radius,
      vx: (Math.random() - 0.5) * (type === "boulder" ? 52 : 36),
      speed: cfg.obstacleSpeed * (0.85 + Math.random() * 0.5),
      animal: level.animal,
      animalColor: level.animalColor
    });
  }

  function spawnWaterBottle(cfg, progress) {
    const bounds = getMountainBounds(progress, cfg);
    game.bottles.push({
      x: rand(bounds.left + 12, bounds.right - 12),
      y: -20,
      r: 10,
      speed: cfg.obstacleSpeed * 0.8
    });
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function update(deltaSeconds) {
    if (game.status === "summit-run") {
      runSummitCutscene(deltaSeconds);
      draw();
      return;
    }

    if (game.status !== "playing") {
      draw();
      return;
    }

    const level = LEVELS[getCurrentLevelIndex()];
    const cfg = getLevelConfig();
    const worldStep = cfg.worldScrollSpeed * deltaSeconds;

    game.climbed += cfg.climbRate * deltaSeconds;
    game.worldScroll += worldStep;
    game.water = Math.max(0, game.water - cfg.dehydrationPerSecond * deltaSeconds);

    const progress = Math.min(1, game.climbed / level.height);
    const bounds = getMountainBounds(progress, cfg);

    let move = 0;
    if (keys.ArrowLeft) {
      move -= game.player.moveSpeed * deltaSeconds;
    }
    if (keys.ArrowRight) {
      move += game.player.moveSpeed * deltaSeconds;
    }
    game.player.x += move;
    game.player.x = Math.max(bounds.left + game.player.w / 2, Math.min(bounds.right - game.player.w / 2, game.player.x));

    if (game.player.jumpTimer > 0) {
      game.player.jumpTimer = Math.max(0, game.player.jumpTimer - deltaSeconds);
    }
    game.player.jumpLift = getJumpLift();

    game.spawnTimer += deltaSeconds;
    if (game.spawnTimer >= cfg.obstacleRate) {
      game.spawnTimer = 0;
      spawnObstacle(level, cfg, progress);
    }

    game.bottleTimer += deltaSeconds;
    if (game.bottleTimer >= cfg.waterBottleRate) {
      game.bottleTimer = 0;
      spawnWaterBottle(cfg, progress);
    }

    game.obstacles.forEach((ob) => {
      ob.y += worldStep;
      if (ob.type !== "crevasse") {
        ob.y += ob.speed * deltaSeconds;
        ob.x += ob.vx * deltaSeconds;
        if (ob.x < bounds.left + ob.r || ob.x > bounds.right - ob.r) {
          ob.vx *= -1;
        }
      }
    });

    game.bottles.forEach((bot) => {
      bot.y += worldStep + bot.speed * deltaSeconds;
    });

    game.obstacles = game.obstacles.filter((ob) => ob.y < canvas.height + 60);
    game.bottles = game.bottles.filter((bot) => bot.y < canvas.height + 40);

    if (checkBottlePickup()) {
      game.water = Math.min(100, game.water + 30);
    }

    if (game.water <= 0) {
      handleDeath("You ran out of water.");
      draw();
      return;
    }

    if (checkObstacleCollision()) {
      handleDeath("You were hit by a mountain hazard.");
      draw();
      return;
    }

    if (progress >= 1) {
      startSummitCutscene();
      draw();
      return;
    }

    updateHud();
    draw();
  }

  function checkBottlePickup() {
    const px = game.player.x;
    const py = game.player.y;
    const radius = 18;
    let picked = false;

    game.bottles = game.bottles.filter((bot) => {
      const hit = distance(px, py, bot.x, bot.y) < radius + bot.r;
      if (hit) {
        picked = true;
      }
      return !hit;
    });

    return picked;
  }

  function checkObstacleCollision() {
    const px = game.player.x;
    const py = game.player.y;
    const jumpLift = game.player.jumpLift;

    for (const ob of game.obstacles) {
      if (ob.type === "crevasse") {
        const touching = Math.abs(px - ob.x) < ob.w / 2 + 9 && Math.abs(py - ob.y) < ob.h / 2 + 12;
        if (touching && jumpLift < 22) {
          return true;
        }
        continue;
      }

      if (jumpLift > 28) {
        if (ob.type === "boulder" || ob.type === "animal") {
          continue;
        }
      }

      const radius = jumpLift > 10 ? 8 : 14;
      if (distance(px, py, ob.x, ob.y) < radius + ob.r) {
        return true;
      }
    }

    return false;
  }

  function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getJumpLift() {
    if (game.player.jumpTimer <= 0) {
      return 0;
    }

    const ratio = game.player.jumpTimer / game.player.jumpDuration;
    return Math.sin((1 - ratio) * Math.PI) * game.player.jumpPeak;
  }

  function handleDeath(reason) {
    game.consecutiveDeaths += 1;

    if (game.consecutiveDeaths >= 2) {
      game.status = "reset-expedition";
      showMessage(
        "Expedition Failed",
        `${reason} Two deaths in a row on this level sent you back to Mount Kosciuszko.`,
        "Restart Expedition",
        () => {}
      );
      return;
    }

    game.status = "retry-level";
    showMessage(
      "Climber Down",
      `${reason} You can retry this level once before a full expedition reset.`,
      "Retry Level",
      () => {}
    );
  }

  function updateHud() {
    const level = LEVELS[getCurrentLevelIndex()];
    const progress = Math.min(1, game.climbed / level.height);
    levelText.textContent = `${game.levelIndex + 1}. ${level.mountain} (${level.continent})`;
    animalText.textContent = `Hazard Animal: ${level.animal}`;
    altitudeText.textContent = `${Math.floor(game.climbed)} / ${level.height} m`;
    mountainBadge.textContent = `${level.mountain} (${level.continent}) - ${level.height.toLocaleString()} m`;
    altitudeFill.style.width = `${(progress * 100).toFixed(1)}%`;
    waterText.textContent = `${Math.ceil(game.water)}%`;

    const fillPercent = Math.max(0, game.water) / 100;
    if (window.matchMedia("(max-width: 980px)").matches) {
      waterFill.style.transform = `scaleX(${fillPercent})`;
    } else {
      waterFill.style.transform = `scaleY(${fillPercent})`;
    }

    waterFill.style.background = game.water > 60
      ? "linear-gradient(180deg, #77f4ff, #2083d0)"
      : game.water > 30
        ? "linear-gradient(180deg, #f6ee8e, #d58f2e)"
        : "linear-gradient(180deg, #ff8a8a, #c93434)";
  }

  function renderPeaksList() {
    starsList.innerHTML = "";
    const activeIdx = getCurrentLevelIndex();
    LEVELS.forEach((level, idx) => {
      const p = document.createElement("p");
      p.textContent = `${idx + 1}. ${level.mountain} (${level.continent})`;
      if (game.starsEarned[idx] === 3) {
        p.classList.add("completed-peak");
      }
      if (idx === activeIdx) {
        p.classList.add("active-peak");
      }
      starsList.appendChild(p);
    });
  }

  function draw() {
    const level = LEVELS[getCurrentLevelIndex()];
    const cfg = getLevelConfig();
    const progress = Math.min(1, game.climbed / level.height);
    const bounds = getMountainBounds(progress, cfg);
    const isSummitPose = game.status === "summit-run" || (progress >= 1 && (game.status === "next-level" || game.status === "victory"));
    const summitX = game.status === "summit-run" ? game.summitCutscene.x : canvas.width / 2;
    const summitY = game.status === "summit-run" ? game.summitCutscene.y : 74;

    drawBackdrop(level, progress, isSummitPose);
    drawMountain(bounds, progress, isSummitPose);
    drawTrailMarkers(bounds);
    drawBottles();
    drawObstacles();
    drawPlayer(bounds, isSummitPose, summitX, summitY);
  }

  function drawBackdrop(level, progress, isSummitPose) {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#77b6e6");
    sky.addColorStop(0.52, "#9fd0ee");
    sky.addColorStop(1, "#d7edf9");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawAmbientClouds();

    if (isSummitPose) {
      drawSummitSky();
    }
  }

  function drawAmbientClouds() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    for (let i = 0; i < 8; i += 1) {
      const x = ((i * 160) + (game.worldScroll * 0.18)) % (canvas.width + 120) - 60;
      const y = 70 + ((i * 67) % 210);
      const scale = 0.75 + (i % 3) * 0.16;
      drawCloud(x, y, scale);
    }
  }

  function drawSummitSky() {
    ctx.fillStyle = "#f7d561";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.79, 86, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 246, 220, 0.86)";
    drawCloud(180, 74, 0.9);
    drawCloud(270, 96, 1.05);
    drawCloud(510, 70, 0.82);
  }

  function drawCloud(x, y, scale) {
    ctx.beginPath();
    ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
    ctx.arc(x + 18 * scale, y - 9 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.arc(x + 35 * scale, y, 16 * scale, 0, Math.PI * 2);
    ctx.arc(x + 16 * scale, y + 10 * scale, 16 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMountain(bounds, progress, isSummitPose) {
    const pathTop = 20;
    const pathBottom = canvas.height;
    const midX = canvas.width / 2;
    const tipRevealStart = 0.72;
    const tipRevealEnd = 0.9;
    const snowRevealProgress = 0.885;
    const tipBlend = isSummitPose
      ? 1
      : clamp((progress - tipRevealStart) / (tipRevealEnd - tipRevealStart), 0, 1);
    const showSnowCap = isSummitPose || progress >= snowRevealProgress;
    const crestHalfWidth = (bounds.width * 0.5) * (1 - tipBlend);
    const crestLeftX = midX - crestHalfWidth;
    const crestRightX = midX + crestHalfWidth;

    const leftBottom = (canvas.width - getLevelConfig().mountainBottomWidth) / 2;
    const rightBottom = canvas.width - leftBottom;

    ctx.fillStyle = "#8f7a5a";
    ctx.beginPath();
    ctx.moveTo(leftBottom, pathBottom);
    ctx.lineTo(crestLeftX, pathTop);
    ctx.lineTo(crestRightX, pathTop);
    ctx.lineTo(rightBottom, pathBottom);
    ctx.closePath();
    ctx.fill();

    if (tipBlend > 0.05 && showSnowCap) {
      ctx.fillStyle = "#d6ddc6";
      const capTipY = pathTop;
      const capBaseY = pathTop + 84;
      const slopeRatio = (capBaseY - pathTop) / (pathBottom - pathTop);
      const maxHalfWidthAtBase = (rightBottom - midX) * slopeRatio;
      const fullCapHalfWidth = Math.max(24, Math.min(46, maxHalfWidthAtBase - 5));
      const capHalfWidth = fullCapHalfWidth;
      ctx.beginPath();
      ctx.moveTo(midX, capTipY);
      ctx.lineTo(midX - capHalfWidth, capBaseY);
      ctx.lineTo(midX - capHalfWidth * 0.64, capBaseY - 10);
      ctx.lineTo(midX - capHalfWidth * 0.38, capBaseY + 2);
      ctx.lineTo(midX - capHalfWidth * 0.12, capBaseY - 12);
      ctx.lineTo(midX + capHalfWidth * 0.12, capBaseY - 4);
      ctx.lineTo(midX + capHalfWidth * 0.36, capBaseY - 15);
      ctx.lineTo(midX + capHalfWidth * 0.63, capBaseY - 6);
      ctx.lineTo(midX + capHalfWidth, capBaseY);
      ctx.closePath();
      ctx.fill();

      // Inner ridge detail while keeping a pointed, jagged cartoon cap.
      ctx.fillStyle = "#e8f0da";
      ctx.beginPath();
      ctx.moveTo(midX, capTipY + 12);
      ctx.lineTo(midX - capHalfWidth * 0.25, capBaseY - 10);
      ctx.lineTo(midX - capHalfWidth * 0.02, capBaseY - 17);
      ctx.lineTo(midX + capHalfWidth * 0.24, capBaseY - 12);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(245, 242, 220, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bounds.left, 0);
    ctx.lineTo(bounds.left, canvas.height);
    ctx.moveTo(bounds.right, 0);
    ctx.lineTo(bounds.right, canvas.height);
    ctx.stroke();

    ctx.fillStyle = "rgba(239, 231, 198, 0.26)";
    for (let i = 0; i < 10; i += 1) {
      const y = canvas.height - ((i * 90 + game.worldScroll * 0.8) % (canvas.height + 80));
      const width = bounds.width * (0.45 + i * 0.045);
      ctx.fillRect(midX - width / 2, y, width, 3);
    }
  }

  function drawTrailMarkers(bounds) {
    const markerCount = 8;
    for (let i = 0; i < markerCount; i += 1) {
      const y = canvas.height - (((i * 110 + game.worldScroll * 1.15) % (canvas.height + 120)) - 55);
      const widthFactor = 1 - i / markerCount;
      const x = canvas.width / 2 + Math.sin((game.climbed / 120) + i) * (bounds.width * 0.18 * widthFactor);
      ctx.fillStyle = "rgba(67, 88, 50, 0.33)";
      ctx.beginPath();
      ctx.arc(x, y, 7 - i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBottles() {
    game.bottles.forEach((bot) => {
      ctx.fillStyle = "rgba(219, 244, 255, 0.65)";
      ctx.fillRect(bot.x - 7, bot.y - 10, 14, 16);

      ctx.fillStyle = "#3d9fe8";
      ctx.fillRect(bot.x - 6, bot.y - 3, 12, 8);

      ctx.fillStyle = "rgba(176, 230, 255, 0.86)";
      ctx.fillRect(bot.x - 5, bot.y - 9, 3, 12);

      ctx.strokeStyle = "#2f5f83";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bot.x - 7, bot.y - 10, 14, 16);

      ctx.fillStyle = "#2f6ca0";
      ctx.fillRect(bot.x - 4, bot.y - 14, 8, 5);
    });
  }

  function drawObstacles() {
    game.obstacles.forEach((ob) => {
      if (ob.type === "boulder") {
        ctx.fillStyle = "#6a5a46";
        ctx.beginPath();
        ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#9a876d";
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      if (ob.type === "crevasse") {
        ctx.fillStyle = "#3c2f22";
        ctx.beginPath();
        ctx.ellipse(ob.x, ob.y, ob.w / 2, ob.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1f1710";
        ctx.stroke();
        return;
      }
      drawAnimalHazard(ob);
    });
  }

  function drawAnimalHazard(ob) {
    const animal = (ob.animal || "").toLowerCase();
    const isBear = animal.includes("bear");
    const isLion = animal.includes("lion");
    const isWolf = animal.includes("wolf");
    const isJaguar = animal.includes("jaguar");
    const isDingo = animal.includes("dingo");
    const isSnowLeopard = animal.includes("leopard");

    const bodyColor = ob.animalColor;
    const outline = "#2b2117";
    const bodyRy = isBear ? 0.66 : 0.56;
    const bodyRx = isBear ? 1.06 : 0.95;
    const headR = isBear ? 0.45 : 0.4;

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(ob.x, ob.y + ob.r * 0.2, ob.r * bodyRx, ob.r * bodyRy, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ob.x + ob.r * 0.56, ob.y - ob.r * 0.08, ob.r * headR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(245, 236, 214, 0.45)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(ob.x, ob.y + ob.r * 0.2, ob.r * bodyRx, ob.r * bodyRy, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ob.x + ob.r * 0.56, ob.y - ob.r * 0.08, ob.r * headR, 0, Math.PI * 2);
    ctx.stroke();

    if (isBear) {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(ob.x + ob.r * 0.44, ob.y - ob.r * 0.4, ob.r * 0.16, 0, Math.PI * 2);
      ctx.arc(ob.x + ob.r * 0.7, ob.y - ob.r * 0.38, ob.r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isWolf) {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(ob.x + ob.r * 0.42, ob.y - ob.r * 0.28);
      ctx.lineTo(ob.x + ob.r * 0.5, ob.y - ob.r * 0.66);
      ctx.lineTo(ob.x + ob.r * 0.58, ob.y - ob.r * 0.28);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(ob.x + ob.r * 0.62, ob.y - ob.r * 0.26);
      ctx.lineTo(ob.x + ob.r * 0.72, ob.y - ob.r * 0.64);
      ctx.lineTo(ob.x + ob.r * 0.8, ob.y - ob.r * 0.22);
      ctx.closePath();
      ctx.fill();
    }

    if (isDingo || isSnowLeopard) {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(ob.x + ob.r * 0.45, ob.y - ob.r * 0.39, ob.r * 0.12, 0, Math.PI * 2);
      ctx.arc(ob.x + ob.r * 0.7, ob.y - ob.r * 0.36, ob.r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isLion) {
      ctx.fillStyle = "#a76420";
      ctx.beginPath();
      ctx.arc(ob.x + ob.r * 0.56, ob.y - ob.r * 0.08, ob.r * 0.56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(137, 80, 28, 0.5)";
      ctx.beginPath();
      ctx.arc(ob.x + ob.r * 0.56, ob.y - ob.r * 0.08, ob.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(ob.x + ob.r * 0.56, ob.y - ob.r * 0.08, ob.r * 0.31, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isJaguar) {
      ctx.strokeStyle = "rgba(48, 35, 21, 0.58)";
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 6; i += 1) {
        const sx = ob.x - ob.r * 0.48 + i * ob.r * 0.19;
        const sy = ob.y + (i % 2 === 0 ? ob.r * 0.05 : ob.r * 0.31);
        ctx.beginPath();
        ctx.arc(sx, sy, ob.r * 0.08, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(44, 29, 16, 0.38)";
        ctx.beginPath();
        ctx.arc(sx, sy, ob.r * 0.03, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (isSnowLeopard) {
      ctx.strokeStyle = "rgba(72, 82, 92, 0.46)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) {
        const sx = ob.x - ob.r * 0.44 + i * ob.r * 0.22;
        const sy = ob.y + (i % 2 === 0 ? ob.r * 0.02 : ob.r * 0.28);
        ctx.beginPath();
        ctx.arc(sx, sy, ob.r * 0.085, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.fillStyle = outline;
    const legH = isBear ? 0.62 : 0.55;
    ctx.fillRect(ob.x - ob.r * 0.56, ob.y + ob.r * 0.45, ob.r * 0.22, ob.r * legH);
    ctx.fillRect(ob.x - ob.r * 0.12, ob.y + ob.r * 0.48, ob.r * 0.22, ob.r * legH);
    ctx.fillRect(ob.x + ob.r * 0.28, ob.y + ob.r * 0.45, ob.r * 0.22, ob.r * legH);

    // Tail profiles per species.
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (isLion) {
      ctx.moveTo(ob.x - ob.r * 0.98, ob.y + ob.r * 0.12);
      ctx.quadraticCurveTo(ob.x - ob.r * 1.28, ob.y - ob.r * 0.18, ob.x - ob.r * 1.06, ob.y - ob.r * 0.42);
    } else if (isBear) {
      ctx.moveTo(ob.x - ob.r * 0.98, ob.y + ob.r * 0.25);
      ctx.quadraticCurveTo(ob.x - ob.r * 1.16, ob.y + ob.r * 0.2, ob.x - ob.r * 1.04, ob.y + ob.r * 0.04);
    } else {
      ctx.moveTo(ob.x - ob.r * 0.98, ob.y + ob.r * 0.1);
      ctx.quadraticCurveTo(ob.x - ob.r * 1.24, ob.y - ob.r * 0.04, ob.x - ob.r * 1.04, ob.y - ob.r * 0.28);
    }
    ctx.stroke();

    // Eye and snout.
    ctx.fillStyle = "#f9f4e8";
    ctx.beginPath();
    ctx.arc(ob.x + ob.r * 0.74, ob.y - ob.r * 0.2, ob.r * 0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.arc(ob.x + ob.r * 0.74, ob.y - ob.r * 0.2, ob.r * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(252, 236, 205, 0.65)";
    ctx.beginPath();
    ctx.ellipse(ob.x + ob.r * 0.71, ob.y + ob.r * 0.02, ob.r * 0.14, ob.r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer(bounds, isSummitPose, summitX, summitY) {
    const jumpRatio = game.player.jumpTimer > 0 ? game.player.jumpTimer / game.player.jumpDuration : 0;
    const yOffset = game.player.jumpLift;
    const px = isSummitPose ? summitX : game.player.x;
    const py = isSummitPose ? summitY : game.player.y - yOffset;
    const isFemale = game.selectedAvatar === "female";

    const jacketColor = isFemale ? "#d9694f" : "#4a8fb8";
    const pantsColor = "#24313f";
    const bootColor = "#e8ecdf";
    const backpackColor = "#43523b";
    const strapColor = "#2f3a2a";
    const hairColor = isFemale ? "#f2c343" : "#3e2f25";

    if (!isSummitPose) {
      game.player.x = Math.max(bounds.left + game.player.w / 2, Math.min(bounds.right - game.player.w / 2, game.player.x));
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(px, isSummitPose ? py + 44 : game.player.y + 22, 24, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(px, py - 18, 9.5, 0, Math.PI * 2);
    ctx.fill();

    if (isFemale) {
      ctx.beginPath();
      ctx.moveTo(px - 8, py - 17);
      ctx.lineTo(px - 7, py + 4);
      ctx.lineTo(px - 3, py + 5);
      ctx.lineTo(px - 4, py - 15);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px + 8, py - 17);
      ctx.lineTo(px + 7, py + 4);
      ctx.lineTo(px + 3, py + 5);
      ctx.lineTo(px + 4, py - 15);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = jacketColor;
    ctx.fillRect(px - 12, py - 8, 24, 29);
    ctx.strokeStyle = "rgba(233, 239, 228, 0.8)";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(px - 12, py - 8, 24, 29);

    ctx.fillStyle = backpackColor;
    ctx.beginPath();
    ctx.roundRect(px - 14, py - 14, 28, 27, 7);
    ctx.fill();
    ctx.fillStyle = "#7b8a6f";
    ctx.fillRect(px - 4, py - 5, 8, 9);

    ctx.fillStyle = strapColor;
    ctx.fillRect(px - 11, py - 7, 3, 24);
    ctx.fillRect(px + 8, py - 7, 3, 24);

    ctx.fillStyle = pantsColor;
    ctx.fillRect(px - 12, py + 20, 10, 24);
    ctx.fillRect(px + 2, py + 20, 10, 24);

    ctx.fillStyle = bootColor;
    ctx.fillRect(px - 12, py + 42, 11, 5);
    ctx.fillRect(px + 2, py + 42, 11, 5);

    if (jumpRatio > 0 && !isSummitPose) {
      ctx.strokeStyle = "rgba(255, 248, 188, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py + 5, 26 + jumpRatio * 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function startSummitCutscene() {
    game.status = "summit-run";
    game.obstacles = [];
    game.bottles = [];
    game.player.jumpTimer = 0;
    game.player.jumpLift = 0;
    game.summitCutscene.active = true;
    game.summitCutscene.t = 0;
    game.summitCutscene.x = game.player.x;
    game.summitCutscene.y = game.player.y;
  }

  function runSummitCutscene(deltaSeconds) {
    const level = LEVELS[getCurrentLevelIndex()];
    const targetX = canvas.width / 2;
    const targetY = 74;
    const speedX = 380;
    const speedY = 340;

    game.summitCutscene.t += deltaSeconds;
    game.summitCutscene.x += clamp(targetX - game.summitCutscene.x, -speedX * deltaSeconds, speedX * deltaSeconds);
    game.summitCutscene.y += clamp(targetY - game.summitCutscene.y, -speedY * deltaSeconds, speedY * deltaSeconds);

    if (game.summitCutscene.t >= 1.25 && Math.abs(targetX - game.summitCutscene.x) < 1.2 && Math.abs(targetY - game.summitCutscene.y) < 1.2) {
      game.summitCutscene.active = false;
      game.starsEarned[game.levelIndex] = 3;
      game.status = "next-level";
      renderPeaksList();
      showMessage(
        "Summit Reached: 3 Stars",
        `${level.mountain} complete. You can continue to the next summit.`,
        game.levelIndex === LEVELS.length - 1 ? "Finish Expedition" : "Next Level",
        () => {}
      );
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getCurrentLevelIndex() {
    return Math.max(0, Math.min(LEVELS.length - 1, game.levelIndex));
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - game.now) / 1000);
    game.now = now;
    update(dt);
    requestAnimationFrame(loop);
  }

  renderPeaksList();
  updateHud();
  requestAnimationFrame(loop);
})();
