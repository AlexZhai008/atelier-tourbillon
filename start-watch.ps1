$ErrorActionPreference = 'Stop'
$watchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$watchNode = (Get-Command node -ErrorAction Stop).Source
$watchUrl = 'http://127.0.0.1:5180'
try {
    $watchResponse = Invoke-WebRequest -Uri $watchUrl -TimeoutSec 2
    if ($watchResponse.Content -notmatch 'ATELIER') { throw 'Port 5180 is occupied by another application.' }
} catch {
    if ($_.Exception.Message -like '*occupied*') { throw }
    Start-Process -FilePath $watchNode -ArgumentList 'server.mjs' -WorkingDirectory $watchRoot -WindowStyle Hidden
    Start-Sleep -Seconds 2
}
Start-Process $watchUrl
