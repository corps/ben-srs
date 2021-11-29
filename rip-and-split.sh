#!/usr/bin/env bash
set -e
set -x

function confirm() {
local input
read -r -p "$1 [Y/n] " input
 
case $input in
    [yY][eE][sS]|[yY])
      return 0
 ;;
    *)
      return 1
 ;;
esac
}

ytdl="docker run --rm -i -e PGID=$(id -g) -e PUID=$(id -u) -v $(pwd):/workdir:rw mikenye/youtube-dl"
ffmpeg="docker run --rm -i -e PGID=$(id -g) -e PUID=$(id -u) -v $(pwd):/workdir:rw -w /workdir jrottenberg/ffmpeg"

$ytdl -f mp4 $1
mp4file="$(ls *.mp4)"
! [[ -e "${mp4file%.mp4}.mp3" ]] && $ffmpeg -i "$mp4file" "${mp4file%.mp4}.mp3"
mp3file="$(ls *.mp3)"

if [[ "$2" == "-a" ]]; then
  exit 0
fi

true ${SD_PARAMS:="-25dB:d=0.7"};
true ${MIN_FRAGMENT_DURATION:="1"};
export MIN_FRAGMENT_DURATION

echo "Determining split points..." >& 2

while true
do
SPLITS=$($ffmpeg -nostats -v repeat+info -i "${mp3file}" -af silencedetect="${SD_PARAMS}" -vn -sn  -f s16le  -y /dev/null \
         |& grep '\[silencedetect.*silence_start:' \
         | awk '{print $5}' \
         | perl -ne '
             our $prev;
             INIT { $prev = 0.0; }
             chomp;
             if (($_ - $prev) >= $ENV{MIN_FRAGMENT_DURATION}) {
                print "$_,";
                $prev = $_;
             }
         ' \
         | sed 's!,$!!'
)

echo "Splitting points are $SPLITS"
if confirm "Accept?"; then
  break;
else
  read -r -p "SD_PARAMS?" SD_PARAMS
  read -r -p "MIN_FRAGMENT_DURATION?" MIN_FRAGMENT_DURATION
  export MIN_FRAGMENT_DURATION
fi
done

$ffmpeg -v warning -i "$mp3file" -c copy -map 0 -f segment -segment_times "$SPLITS" "${mp3file%.mp3}-%03d.mp3"
sleep 10

rm -f "$mp4file"
rm -f "$mp3file"
