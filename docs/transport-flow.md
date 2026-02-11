# Data Flow

## Web (React SPA)

UI Hook -> RoutesProcess -> SSHRouteRepository -> HttpExecutor -> HTTP `/remote/execute`
HTTP response (ack) -> RoutesProcess -> Projection Adapter -> Zustand Store

## Desktop (Electron)

Renderer UI Hook -> RoutesProcess -> SSHRouteRepository -> ElectronExecutor
ElectronExecutor -> preload `window.remoteBridge` -> IPC `remote:execute`
Main IPC handler -> SSHExecutor (`ssh2`) -> remote host
SSH result (ack) -> IPC -> ElectronExecutor -> RoutesProcess -> Projection Adapter -> Zustand Store
