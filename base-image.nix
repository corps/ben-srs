{ pkgs ? import <nixpkgs> { }
, pkgsLinux ? import <nixpkgs> { system = "x86_64-linux"; }
}:

let 
  env = pkgs.callPackage ./default.nix {};
in

pkgs.dockerTools.buildImage {
  name = "bensrs";
  tag = "base-image";
  created = "now";
  
  config = {
    WorkingDir = "/app";
    Env = [
      "GIT_SSL_CAINFO=${env}/etc/ssl/certs/ca-bundle.crt"
      "SSL_CERT_FILE=${env}/etc/ssl/certs/ca-bundle.crt"
    ];
  };

  contents = env;

  runAsRoot = ''
    #!${pkgs.runtimeShell}
    ${pkgs.dockerTools.shadowSetup}
    useradd -Ums /bin/bash -u 1002 bensrs
    mkdir /app
    chgrp -R bensrs /app
    chown -R bensrs /app
    mkdir /usr
    ln -s /bin /usr/bin
    mkdir /tmp
  '';
}

