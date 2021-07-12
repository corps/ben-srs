#!/usr/bin/env bash

set -e
set -o pipefail

if [[ "$QUERY_STRING" != "pw=$PW" ]]; then
  echo "Content-Type: text/plain"
  echo "Status: 401 Unauthorized"
  echo
  echo "Password was incorrect"
  exit 0
fi

cd $(mktemp -d)

splitFile() {
  IN=$1
  SD_PARAMS=$2
#  true ${2:="-25dB:d=0.7"};
  MIN_FRAGMENT_DURATION=1
  export MIN_FRAGMENT_DURATION

#  if [ -z "$IN" ]; then
#     echo "Usage: split_by_silence.sh input_media.mp4 output_template_%03d.mkv"
#     echo "Depends on FFmpeg, Bash, Awk, Perl 5. Not tested on Mac or Windows."
#     echo ""
#     echo "Environment variables (with their current values):"
#     echo "    SD_PARAMS=$SD_PARAMS       Parameters for FFmpeg's silencedetect filter: noise tolerance and minimal silence duration"
#     echo "    MIN_FRAGMENT_DURATION=$MIN_FRAGMENT_DURATION    Minimal fragment duration"
#     exit 1
#  fi

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

  ffmpeg -v warning -i "$IN" -c copy -map 0 -f segment -segment_times "$SPLITS" "${IN%.mp3}-%03d.mp3" &>>logs
}

function cutFile() {
  IN_FILE=$1
  OFFSET=$2
  CHUNK_LEN=$3
  OUTFILE=$4
  ffmpeg -i "$IN_FILE" -vcodec copy -acodec copy -ss "$OFFSET" -t "$CHUNK_LEN" "$OUTFILE" &>>logs
}

function toAudio() {
  IN=$1
  OUTFILE=$2
  ffmpeg -i $IN -map 0:a OUTFILE &>>logs
}

function downloadFileB64() {
  IN=$1
  cat $IN | base64 | jq -R -c
}

ls | jq -R --slurp -c 'split("\n") | map(select(. != ""))'
while IFS='$\n' read -r line; do
    # do whatever with line
    case "$(echo "$line" | jq -r -c .[0])" in
      downloadFileB64)
        downloadFileB64 "$(echo "$line" | jq -r -c .[1])"
        ;;
      toAudio)
        toAudio "$(echo "$line" | jq -r -c .[1])" "$(echo "$line" | jq -r -c .[2])"
        ;;
      cutFile)
        cutFile "$(echo "$line" | jq -r -c .[1])" "$(echo "$line" | jq -r -c .[2])" "$(echo "$line" | jq -r -c .[3])" "$(echo "$line" | jq -r -c .[4])"
        ;;
      splitFile)
        splitFile "$(echo "$line" | jq -r -c .[1])" "$(echo "$line" | jq -r -c .[2])"
        ;;
    esac
    if [[ $command =~ ^toAudio|^cutFile|^splitFile ]]; then
      $command &>>logs
    fi
    ls | jq -R --slurp -c 'split("\n") | map(select(. != ""))'
done

