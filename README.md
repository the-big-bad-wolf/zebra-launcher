# Zebra Launcher

A Desktop app for installing and running Zebra.

[In-browser preview with example data](https://zebra-app-v0-zi2rzymvea-ue.a.run.app/)

## Installation

To install the Zebra Launcher:

1. Download the installer for your operating system from the Github releases [here](https://github.com/ZcashFoundation/zebra-app/releases/tag/v0.0.0-alpha.1).
2. Run the installer

Note: It currently requires a 64-bit processor, and on macOS, an ARM-based processor such as the Apple M1.

## Screenshots

<img src="https://github.com/ZcashFoundation/zebra-app/assets/5491350/4fb8b310-15e7-47be-8650-18a24b733ebc" width="400">
&nbsp;
<img src="https://github.com/ZcashFoundation/zebra-app/assets/5491350/564bef27-5b82-4f1e-8e9f-af709bf48528" width="400">

## Developer Setup

1. Make sure all of the [Tauri prerequisites](https://beta.tauri.app/guides/prerequisites/) are installed.
2. Install `pnpm`
3. Run `pnpm i` to install npm packages
4. Run `pnpm tauri dev` to start the Tauri app.
5. Add an empty `dist` folder to the root of this project to fix the Rust warning in `src-tauri/src/main.rs`
6. Install `Prettier` for formatting .ts/.tsx/.css files

#### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
