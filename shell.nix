{ pkgs ? import <nixpkgs> {} }:

let
    python_env = pkgs.callPackage ./python {};
    node_env = pkgs.callPackage ./node {};
in
pkgs.mkShell {
    nativeBuildInputs = python_env.pkgs ++ node_env.pkgs ++ [ pkgs.bash-completion ];
    shellHook = python_env.hook + ''
    '' + node_env.hook + ''
        cd ${builtins.toString ./.}
    '';
}
