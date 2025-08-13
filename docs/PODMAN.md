### Docker socket compatibility on macOS

Podman en macOS requiere `podman-mac-helper` para compatibilidad con el socket Docker (`/var/run/docker.sock`).

Pasos:

```bash
brew install podman
sudo $(brew --prefix podman)/bin/podman-mac-helper install
podman machine init cactus-dashboard
podman machine start cactus-dashboard
```

Verificación:

```bash
task --silent podman:helper:status
```

Problemas comunes:
- Permisos sudo: ejecuta el comando `install` manualmente si lo pide.
- Puertos ocupados: `task --silent cleanup:ports`.


