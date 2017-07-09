{ pkgs ? import <nixpkgs> { inherit system; },
  system ? builtins.currentSystem,
  nodejs ? pkgs.nodejs }:

let
  npmInputs = import ./npm-env.nix {
    inherit pkgs system nodejs;
    packages = [ { typescript = "2.3.4"; } ];
  };
in

with pkgs;
stdenv.mkDerivation {
  name = "ben-srs";
  buildInputs = npmInputs;

  shellHook = ''
    PATH=$PWD/node_modules/.bin/:$PATH

    if [ -e $PWD/env.sh ]; then
      source $PWD/env.sh
    else
      echo "Add $PWD/env.sh file and it will be source in this shell."
    fi
  '';
}
