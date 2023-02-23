{ pkgs ? import <nixpkgs> {} }:
{
    pkgs = [ pkgs.python39 ];
    hook = ''
        cd ${builtins.toString ./.}
        if ! [ -e ./venv ]; then
            python -m venv venv
        fi
        source ./venv/bin/activate
        make installation
    '';
}
