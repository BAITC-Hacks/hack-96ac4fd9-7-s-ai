# Fast pre-push gate: typecheck + lint + test + build for each zone that exists.
# No AI involved, ~1 minute. Exit 1 blocks the push.
$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent
$failed = $false

function Write-Ok($msg)   { Write-Host "  OK   $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  FAIL $msg" -ForegroundColor Red; $script:failed = $true }

Write-Host "== check: secrets =="
Push-Location $root
$leaked = git ls-files | Where-Object { $_ -match '(^|/)\.env(\.local)?$' }
Pop-Location
if ($leaked) { Write-Fail ".env is tracked by git: $leaked" } else { Write-Ok "no .env in git" }

foreach ($zone in @('frontend', 'backend')) {
    $dir = Join-Path $root $zone
    $pkgPath = Join-Path $dir 'package.json'
    if (-not (Test-Path $pkgPath)) { Write-Host "== $zone : no package.json, skipped =="; continue }

    Write-Host "== check: $zone =="
    $scripts = (Get-Content $pkgPath -Raw | ConvertFrom-Json).scripts
    $names = @()
    if ($null -ne $scripts) { $names = $scripts.PSObject.Properties.Name }

    foreach ($step in @('typecheck', 'lint', 'test', 'build')) {
        if ($names -notcontains $step) { continue }
        Push-Location $dir
        npm run $step --silent
        $code = $LASTEXITCODE
        Pop-Location
        if ($code -ne 0) { Write-Fail "$zone : npm run $step" } else { Write-Ok "$zone : npm run $step" }
    }
}

if ($failed) {
    Write-Host "`nCHECK FAILED - fix before pushing." -ForegroundColor Red
    exit 1
}
Write-Host "`nCHECK PASSED" -ForegroundColor Green
exit 0
