{
  description = "ana-engine-ts";
  nixConfig.bash-prompt = "[nix]λ. ";

  inputs.flake-utils.url = "github:numtide/flake-utils";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, flake-utils, nixpkgs }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system}; in
      {
        devShells.default = with pkgs; mkShell {
          packages = [
            nodejs_22
            pnpm
            typescript
          ];

          shellHook = ''
            echo "Ana Engine TS Development Environment"
            echo "Node: $(node -v) | PNPM: $(pnpm -v)"
            [ ! -d "node_modules" ] && pnpm install
          '';

        };
      });
}
