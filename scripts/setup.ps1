# One-time setup per person:  powershell -ExecutionPolicy Bypass -File scripts/setup.ps1 -Role front|back
param([Parameter(Mandatory = $true)][ValidateSet('front', 'back')][string]$Role)

$root = Split-Path $PSScriptRoot -Parent
$zone = if ($Role -eq 'front') { 'frontend' } else { 'backend' }
Set-Location $root

foreach ($tool in @('git', 'node', 'npm', 'codex', 'wt')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "MISSING: $tool" -ForegroundColor Yellow
    }
}

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { Write-Host "Not a git repo. Clone the team repo first." -ForegroundColor Red; exit 1 }

# pre-push gate for everyone
git config core.hooksPath scripts/hooks
Write-Host "pre-push hook enabled (scripts/hooks/pre-push)"

# own branch
git show-ref --verify --quiet "refs/heads/$Role"
if ($LASTEXITCODE -ne 0) {
    git show-ref --verify --quiet "refs/remotes/origin/$Role"
    if ($LASTEXITCODE -eq 0) { git checkout -b $Role "origin/$Role" } else { git checkout -b $Role }
} else {
    git checkout $Role
}

if (-not (Test-Path "$root\.env")) { Copy-Item "$root\.env.example" "$root\.env"; Write-Host ".env created - put your keys in it" }
New-Item -ItemType Directory -Force "$root\$zone\.status" | Out-Null

# Second folder with branch main: used for merges and the tester,
# so nobody ever switches branches under running agents.
$mainBranch = 'main'
$head = git symbolic-ref --short refs/remotes/origin/HEAD 2>$null
if ($LASTEXITCODE -eq 0 -and $head) { $mainBranch = $head -replace '^origin/', '' }
$mainWt = Join-Path (Split-Path $root -Parent) ((Split-Path $root -Leaf) + '-main')
if (-not (Test-Path $mainWt)) {
    git worktree add $mainWt $mainBranch
    if ($LASTEXITCODE -eq 0) { Write-Host "main worktree: $mainWt" }
}
if ((Test-Path $mainWt) -and -not (Test-Path "$mainWt\.env")) { Copy-Item "$root\.env" "$mainWt\.env" }

Write-Host "`nReady. Branch: $Role  Zone: $zone  Main folder: $mainWt" -ForegroundColor Green
Write-Host "Next: powershell -ExecutionPolicy Bypass -File scripts/start.ps1 -Role $Role"
