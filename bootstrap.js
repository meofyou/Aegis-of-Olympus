(function () {
  var statusEl = document.getElementById("status");

  function setStatus(text) {
    if (statusEl) {
      statusEl.textContent = text;
    }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.onload = function () {
        resolve(src);
      };
      script.onerror = function () {
        reject(new Error("failed: " + src));
      };
      document.head.appendChild(script);
    });
  }

  async function boot() {
    var threeCandidates = [
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r161/three.min.js",
      "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.min.js",
      "https://unpkg.com/three@0.161.0/build/three.min.js",
      "./three.min.js",
    ];

    var loadedFrom = "";
    for (var i = 0; i < threeCandidates.length; i += 1) {
      var src = threeCandidates[i];
      try {
        setStatus("엔진 로딩 중: " + src);
        await loadScript(src);
        if (window.THREE) {
          loadedFrom = src;
          break;
        }
      } catch (err) {
        // Try next source.
      }
    }

    if (!window.THREE) {
      setStatus("Three.js 로드 실패. 2D 대체 모드로 실행합니다.");
      try {
        await loadScript("./fallback-main.js");
      } catch (err) {
        setStatus("fallback-main.js 로드 실패. 콘솔 에러를 확인해 주세요.");
        console.error(err);
      }
      return;
    }

    window.__THREE_LOADED_FROM__ = loadedFrom;
    setStatus("엔진 로드 완료. 3D 모드 시작 준비 중...");

    try {
      await loadScript("./main.js");
    } catch (err) {
      setStatus("main.js 로드 실패. 콘솔 에러를 확인해 주세요.");
      console.error(err);
    }
  }

  boot();
})();
