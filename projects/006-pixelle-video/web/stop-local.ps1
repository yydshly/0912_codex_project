$listeners = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8506 -State Listen -ErrorAction SilentlyContinue
foreach ($listener in $listeners) {
    $demoProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    if ($demoProcess.CommandLine -match 'streamlit' -and $demoProcess.CommandLine -match '8506') {
        Stop-Process -Id $listener.OwningProcess
    }
}
