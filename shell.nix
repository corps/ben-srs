{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
    # nativeBuildInputs is usually what you want -- tools you need to run
    nativeBuildInputs = [ (import ./default.nix {}) ];
    shellHook = ''
        if ! [ -e ./venv ]; then
            python -m venv venv
        fi

        source ./venv/bin/activate
        if [ -e ./requirements.txt ]; then
            pip install -r requirements.txt
        fi

        pip freeze | grep -v "file:" > requirements.txt
    '';
}
