#!/usr/bin/env bash

#cd $(mktemp -d)
#
#b.cutFileSegment() {
#  IN=$1
#  start=$2
#  end=$3
#
#  start=$(())
#
#  if [[ -z "$end" ]]; then
#    echo "$0 <in file> <start> <end time>"
#    return 1
#  fi
#}

b.splitFile() {
  IN=$1
  MIN_FRAGMENT_DURATION=$2
  SD_PARAMS="-25dB:d=0.7"
  export MIN_FRAGMENT_DURATION

  if [[ -z "$MIN_FRAGMENT_DURATION" ]]; then
    echo "$0 <in> <dur>"
    return 1
  fi

  SPLITS=$(ffmpeg -nostats repeat+info -i "${IN}" -af silencedetect="${SD_PARAMS}" -vn -sn  -f s16le  -y /dev/null \
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

  ffmpeg -v warning -i "$IN" -c copy -map 0 -f segment -segment_times "$SPLITS" "${IN%.mp3}-%03d.mp3"
}

function b.cutFile() {
  IN_FILE=$1
  OFFSET=$2
  CHUNK_LEN=$3

  if [[ -z "$CHUNK_LEN" ]]; then
    echo "$0 <in> <out>"
    return 1
  fi

  ffmpeg -i "$IN_FILE" -vcodec copy -acodec copy -ss "$OFFSET" -t "$CHUNK_LEN" "$OFFSET.$CHUNK_LEN.$IN_FILE"
}

function b.toAudio() {
  IN=$1
  OUTFILE=$2

  if [[ -z "$OUTFILE" ]]; then
    echo "$0 <in> <out>"
    return 1
  fi

  ffmpeg -i $IN -map 0:a $OUTFILE
}

function b.fetch() {
  URL=$1
  OUTNAME=$2

  if [[ -z "$OUTNAME" ]]; then
    echo "$0 <url> <outname>"
    return 1
  fi

  youtube-dl -f mp4 --no-playlist $URL -o "$OUTNAME.mp4"
}

function b.spleet() {
  IN=$1
  if [[ -z "$IN" ]]; then
    echo "$0 <file>"
    return 1
  fi

  spleeter separate -c mp3 $IN
  mv /tmp/separated_audio/*/vocals.mp3 ./$IN.vocals.mp3
}

function b.serve() {
  python3 -m http.server 8000 &>/dev/null &
  service ssh start
  ngrok start --config /root/ngrok.yml --all &>/dev/null &
}

function b.upload() {
  FILE=$1
  if [[ -z "$FILE" ]]; then
    echo "$0 <file>"
    return 1
  fi
  dbxcli account
  dbxcli put $FILE "/アプリ/Ben Srs Dev/$FILE"
}