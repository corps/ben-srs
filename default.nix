{ pkgs ? import <nixpkgs> { inherit system; },
  system ? builtins.currentSystem,
  nodejs ? pkgs.nodejs }:

with pkgs;
stdenv.mkDerivation {
  name = "ben-srs";
  buildInputs = [ nodejs ffmpeg youtube-dl ];

  shellHook = ''
    PATH=$PWD/node_modules/.bin/:$PATH

    if [ -e $PWD/env.sh ]; then
      source $PWD/env.sh
    else
      echo "Add $PWD/env.sh file and it will be source in this shell."
    fi
  '';
}
