{ pkgs ? import <nixpkgs> {}
, symlinkJoin ? pkgs.symlinkJoin
, runCommand ? pkgs.runCommand
, nodejs ? pkgs.nodejs
, nodePackages ? pkgs.nodePackages
, ffmpeg ? pkgs.ffmpeg
, youtube-dl ? pkgs.youtube-dl
, node2nix ? pkgs.node2nix
, bash ? pkgs.bash
, coreutils ? pkgs.coreutils
, cacert ? pkgs.cacert
, python ? pkgs.python39
, expat ? pkgs.expat
, zlib ? pkgs.zlib
, jansson ? pkgs.jansson
, pcre ? pkgs.pcre
, libxcrypt ? pkgs.libxcrypt
, lib ? pkgs.lib
, stdenv ? pkgs.stdenv
}:

symlinkJoin {
  name = "ben-srs-env";
  paths = [
    nodejs
    nodePackages.typescript-language-server 
    nodePackages.typescript
    ffmpeg
    youtube-dl
    node2nix
    bash
    coreutils
    cacert
    python
    jansson pcre libxcrypt
  ] ++ lib.optionals (stdenv.isDarwin && stdenv.isAarch64) [ expat zlib ];

  postBuild = ''
    for f in $out/lib/node_modules/.bin/*; do
       path="$(readlink --canonicalize-missing "$f")"
       ln -s "$path" "$out/bin/$(basename $f)"
    done
  '';
}
