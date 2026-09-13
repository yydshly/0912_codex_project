param(
    [int]$Seconds = 180,
    [string]$Interface = 'WLAN',
    [string]$Label = 'unlabelled'
)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if (!(Test-Path '.venv/Scripts/python.exe')) {
        python -m venv .venv
        if ($LASTEXITCODE -ne 0) { throw 'Python environment creation failed.' }
    }
    & ./.venv/Scripts/python.exe -c "import importlib.metadata as m, sys; packages = {d.metadata['Name'].lower(): d.version for d in m.distributions()}; sys.exit(0 if packages.get('numpy') == '2.2.6' and packages.get('scipy') == '1.15.3' else 1)"
    if ($LASTEXITCODE -ne 0) {
        & ./.venv/Scripts/python.exe -m pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    }
    & ./.venv/Scripts/python.exe monitor.py --seconds $Seconds --interface $Interface --label $Label
    if ($LASTEXITCODE -ne 0) { throw 'Real WiFi test stopped with an error. No simulated fallback.' }
}
finally { Pop-Location }
