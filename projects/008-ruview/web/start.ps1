$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if (-not (Test-Path -LiteralPath 'engine/target/release/ruview-lab.exe')) {
        python bootstrap.py
        if ($LASTEXITCODE -ne 0) { throw 'RuView build failed.' }
    }
    python server.py
} finally { Pop-Location }
