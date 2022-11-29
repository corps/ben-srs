{ pkgs ? import <nixpkgs> { }
, pkgsLinux ? import <nixpkgs> { system = "x86_64-linux"; }
}:

let 
  env = import ./default.nix { pkgs = pkgsLinux; };
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

  contents = [ env ];

  runAsRoot = ''
    #!${pkgsLinux.runtimeShell}
    mkdir /app
    mkdir /usr
    ln -s /bin /usr/bin
    mkdir /tmp
  '';
}

