{ pkgs ? import <nixpkgs> {}
, symlinkJoin ? pkgs.symlinkJoin
, runCommand ? pkgs.runCommand
, nodejs ? pkgs.nodejs
, nodePackages ? pkgs.nodePackages
, websocketd ? pkgs.websocketd
, ffmpeg ? pkgs.ffmpeg
, youtube-dl ? pkgs.youtube-dl
, node2nix ? pkgs.node2nix
, bash ? pkgs.bash
, coreutils ? pkgs.coreutils
, cacert ? pkgs.cacert
}:

symlinkJoin {
  name = "ben-srs-env";
  paths = [
    nodejs
    nodePackages.typescript-language-server 
    nodePackages.typescript
    websocketd
    ffmpeg
    youtube-dl
    node2nix
    bash
    coreutils
    cacert
  ];
  postBuild = ''
    for f in $out/lib/node_modules/.bin/*; do
       path="$(readlink --canonicalize-missing "$f")"
       ln -s "$path" "$out/bin/$(basename $f)"
    done
  '';
}
