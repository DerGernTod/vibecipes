# Running vibecipes under WSL1 (kernel 4.4.0-Microsoft)

Notes from verifying Cook Mode (#21). Each quirk cost time, so check here before debugging.

- **Node:** the Windows nvm shim (`/mnt/c/nvm4w/nodejs/node.exe`) and the pnpm shim both break under WSL (Windows paths, stdio `EISDIR`). A native Linux Node 24 tarball from nodejs.org executes only through the dynamic loader: `/lib64/ld-linux-x86-64.so.2 /path/to/node`. Wrap it as a `node` script on `PATH`. Then `npm i -g --prefix <dir> pnpm@10.20.0` and run `pnpm install --frozen-lockfile`.
- **Vitest:** the default `forks` pool crashes with "Worker exited unexpectedly" because child processes cannot exec the loader-wrapped Node. Run `pnpm vitest run --pool=threads`.
- **Ports:** the Windows host owns ports 3000 and 5173 (a "noodle" page answers there), and WSL1 shares localhost with Windows. Vite's `/api` proxy is hardcoded to 3000, so the API cannot be reached on that port. Run the API with `PORT=3100` and point a temporary Vite config at it.
- **Dev DB:** `vibecipes_prototype.db` is write-locked from WSL on `/mnt/d` (`SQLITE_PROTOCOL`) while the server runs. Reads work. Inject test data through Playwright `page.route` instead of writing to the DB.
- **Browser checks:** headless Chrome on the Windows side can be driven over CDP. Start it with `--remote-debugging-port=<port>` and a Windows `--user-data-dir`, then `chromium.connectOverCDP('http://127.0.0.1:<port>')`. Stop only the instance you started, identified by its debugging port. The Windows process outlives the WSL PID.
- **Process hygiene:** `pkill -f <pattern>` matches the shell running the command, because the pattern appears in its own command line, and kills it (exit 144). Track PIDs in files instead.
