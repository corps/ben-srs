#!/usr/bin/env bash
set -e
set -x

ytdl="docker run --rm -i -e PGID=$(id -g) -e PUID=$(id -u) -v $(pwd):/workdir:rw mikenye/youtube-dl"
ffmpeg="docker run --rm -i -e PGID=$(id -g) -e PUID=$(id -u) -v $(pwd):/workdir:rw -w /workdir jrottenberg/ffmpeg"

$ytdl -f mp4 $1
mp4file="$(ls *.mp4)"
$ffmpeg -i "$mp4file" "${mp4file%.mp4}.mp3"
mp3file="$(ls *.mp3)"

true ${SD_PARAMS:="-25dB:d=0.7"};
true ${MIN_FRAGMENT_DURATION:="1"};
export MIN_FRAGMENT_DURATION

echo "Determining split points..." >& 2

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
$ffmpeg -v warning -i "$mp3file" -c copy -map 0 -f segment -segment_times "$SPLITS" "${mp3file%.mp3}-%03d.mp3"

rm "$mp4file"
rm "$mp3file"
