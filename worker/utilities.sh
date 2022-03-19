#!/usr/bin/env bash

#cd $(mktemp -d)

b.splitFile() {
  IN=$1
  MIN_FRAGMENT_DURATION=$2
  SD_PARAMS="-25dB:d=0.7"
  export MIN_FRAGMENT_DURATION

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
  ffmpeg -i "$IN_FILE" -vcodec copy -acodec copy -ss "$OFFSET" -t "$CHUNK_LEN" "$OFFSET.$CHUNK_LEN.$IN_FILE"
}

function b.toAudio() {
  IN=$1
  OUTFILE=$2
  ffmpeg -i $IN -map 0:a $OUTFILE
}

function b.fetch() {
  URL=$1
  OUTNAME=$1

  youtube-dl -f mp4 --no-playlist $URL -o "$OUTNAME.mp4"
}

function b.spleet() {
  IN=$1

  spleeter separate -c mp3 $IN
  mv /tmp/separated_audio/*/vocals.mp3 ./
}

function b.serve() {
  python3 -m http.server 8000 &>/dev/null &
  service ssh start
  ngrok start --config /root/ngrok.yml --all &>/dev/null &
}

function autoFill() {
  local tmp
  local v
  tmp=$(mktemp)

  while read line; do
    if [[ "$line" =~ \ *([A-Z]*)=\$([1-9]).* ]]; then
      if [[ -z "${COMP_WORDS[${BASH_REMATCH[2]}]}" ]]; then
        COMPREPLY+=( "${BASH_REMATCH[1]}" )
        return 0
      fi
    fi
  done < <(type -a "$1")
}

complete -F autoFill b.toAudio b.splitFile b.cutFile b.fetch b.spleet b.serve