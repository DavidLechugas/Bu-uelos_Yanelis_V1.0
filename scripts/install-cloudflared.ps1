$ErrorActionPreference = 'Stop'
# Release oficial fijada; verificar integridad antes de ejecutar.
$version = '2026.10.0'
$expectedHash = '86aee4017b26625cee8484c113558f48effa4cd47f7aa05fcf425604e5d2b23c'
$root = Split-Path -Parent $PSScriptRoot
$bin = Join-Path $root 'tools\bin'
$exe = Join-Path $bin 'cloudflared.exe'
New-Item -ItemType Directory -Force -Path $bin | Out-Null
if (!(Test-Path $exe) -or (Get-FileHash $exe -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) {
    $download = Join-Path $bin 'cloudflared.download'
    try {
        Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/cloudflare/cloudflared/releases/download/$version/cloudflared-windows-amd64.exe" -OutFile $download
        if ((Get-FileHash $download -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) {
            throw 'El SHA256 no coincide. No se ejecutara el archivo descargado.'
        }
        Move-Item -Force $download $exe
    } finally {
        if (Test-Path $download) { Remove-Item $download }
    }
}
& $exe --version
if ($LASTEXITCODE -ne 0) { throw 'No se pudo ejecutar cloudflared.' }
Write-Host 'Instalacion local lista; no se modificaron PATH ni servicios.'
