param([string]$Interface = 'WLAN')
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if (!(Test-Path '../real-wifi/.venv/Scripts/python.exe')) {
        python -m venv ../real-wifi/.venv
        if ($LASTEXITCODE -ne 0) { throw 'Python environment creation failed.' }
    }
    & ../real-wifi/.venv/Scripts/python.exe -c "import importlib.metadata as m, sys; packages = {d.metadata['Name'].lower(): d.version for d in m.distributions()}; sys.exit(0 if packages.get('numpy') == '2.2.6' and packages.get('scipy') == '1.15.3' else 1)"
    if ($LASTEXITCODE -ne 0) {
        & ../real-wifi/.venv/Scripts/python.exe -m pip install -r ../real-wifi/requirements.txt
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    }
    & ../real-wifi/.venv/Scripts/python.exe real_server.py --interface $Interface
    if ($LASTEXITCODE -ne 0) { throw 'Real WiFi monitor stopped with an error.' }
}
finally { Pop-Location }
