let allInputs = ["url", "start", "end", "language", "content", "accessToken"].map(id =>
  document.getElementById(id)
);
allInputs.forEach(element => {
  element.addEventListener("change", event => {
    setTimeout(() => {
      if (allInputs.some(i => !(i as any).value)) {
        document.getElementById("submit").setAttribute("disabled", "disabled");
      } else {
        document.getElementById("submit").removeAttribute("disabled");
      }
    }, 0);
  });
});

let updateTimeout: any;
let startSeconds = 0;
let endSeconds = undefined as number;

allInputs[0].addEventListener("change", event => {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(updateVideo, 2000);
});

allInputs[1].addEventListener("change", event => {
  startSeconds = (event.target as any).value
    ? parseInt((event.target as any).value)
    : 0;
});

allInputs[2].addEventListener("change", event => {
  endSeconds = (event.target as any).value
    ? parseInt((event.target as any).value)
    : undefined;
});

document.getElementById("replay").onclick = e => {
  clearTimeout(updateTimeout);
  updateVideo();
  e.preventDefault();
};

let player: any;

let updating = false;
function updateVideo() {
  if (player) {
    let id = getVideoId((allInputs[0] as any).value);
    if (id) {
      updating = true;
      player.loadVideoById({
        videoId: id,
        startSeconds,
        endSeconds,
      });
    }
  } else {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(updateVideo, 1000);
  }
}

const playerEl = document.getElementById("player");
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

declare var YT: any;
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "390",
    width: "640",
    events: {
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerStateChange(event: any) {
  if (event.data == YT.PlayerState.PAUSED) {
    if (updating) {
      updating = false;
      return;
    }

    let time = parseInt(event.target.getCurrentTime(), 10);
    if (startSeconds) {
      endSeconds = time + 1;
      (allInputs[2] as any).value = time + 1;
    } else {
      startSeconds = time;
      (allInputs[1] as any).value = time;
    }
  }
}

function getVideoId(url: string) {
  let startIdx = url.indexOf("v=") + 2;
  let endIdx = url.indexOf("&", startIdx);
  if (endIdx == -1) {
    endIdx = url.indexOf("#", startIdx);
    if (endIdx == -1) {
      endIdx = url.length;
    }
  }
  if (startIdx != -1) return url.slice(startIdx, endIdx);
}
