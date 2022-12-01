{ pkgs ? import <nixpkgs> {}
, symlinkJoin ? pkgs.symlinkJoin
, runCommand ? pkgs.runCommand
, nodejs ? pkgs.nodejs
, ffmpeg ? pkgs.ffmpeg
, youtube-dl ? pkgs.youtube-dl
, node2nix ? pkgs.node2nix
, bash ? pkgs.bash
, coreutils ? pkgs.coreutils
, cacert ? pkgs.cacert
, python ? pkgs.python39
, lib ? pkgs.lib
}:

symlinkJoin {
  name = "ben-srs-env";
  paths = [
    nodejs
    ffmpeg
    youtube-dl
    node2nix
    bash
    coreutils
    cacert
    python
  ];

  postBuild = ''
    for f in $out/lib/node_modules/.bin/*; do
       path="$(readlink --canonicalize-missing "$f")"
       ln -s "$path" "$out/bin/$(basename $f)"
    done
  '';
}
