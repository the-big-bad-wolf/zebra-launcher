# Zebra App

A Desktop app for installing and running Zebra.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Setup

1. Make sure all of the [Tauri prerequisites](https://beta.tauri.app/guides/prerequisites/) are installed.
2. Install `pnpm`
3. Run `pnpm i` to install npm packages
4. Run `pnpm tauri dev` to start the Tauri app.
5. Add an empty `dist` folder to the root of this project to fix the Rust warning in `src-tauri/src/main.rs`
6. Install Prettier for formatting .ts/.tsx/.css files
