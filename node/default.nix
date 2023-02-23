{ pkgs ? import <nixpkgs> {} }:
{
    pkgs = [ pkgs.nodejs-16_x ];
    hook = ''
        cd ${builtins.toString ./.}
        export PATH=$PWD/node_modules/.bin:$PATH
        make installation
    '';
}
