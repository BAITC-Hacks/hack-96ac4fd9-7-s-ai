# Launches your zone's Codex session.
#   powershell -ExecutionPolicy Bypass -File scripts/start.ps1 -Role front
#   powershell -ExecutionPolicy Bypass -File scripts/start.ps1 -Role back
# Tester (checkpoints / final only, run inside the <repo>-main worktree):
#   powershell -ExecutionPolicy Bypass -File scripts/start.ps1 -Role front -Tester SMOKE
#   powershell -ExecutionPolicy Bypass -File scripts/start.ps1 -Role front -Tester FULL
param(
    [Parameter(Mandatory = $true)][ValidateSet('front', 'back')][string]$Role,
    [ValidateSet('', 'SMOKE', 'FULL')][string]$Tester = ''
)

$root = Split-Path $PSScriptRoot -Parent
$zone = if ($Role -eq 'front') { 'frontend' } else { 'backend' }
$zoneName = $Role.ToUpper()
$dir = Join-Path $root $zone

# NOTE: prompts must not contain ';' (Windows Terminal uses it as a command separator).
function Get-CodexCmd([string]$prompt) {
    return "codex --sandbox workspace-write '$prompt'"
}

if ($Tester -ne '') {
    $p = "You are the TESTER in mode $Tester. Read AGENTS.md, CONVENTIONS.md, roles/TESTER.md, shared/api.md, shared/types.ts and follow roles/TESTER.md exactly. Write the report to TEST_REPORT.md."
    & wt.exe -w new new-tab -d $root --title "TESTER-$Tester" powershell -NoExit -Command (Get-CodexCmd $p)
    exit 0
}

$devPrompt = "You are DEV for zone $zoneName. Read ../AGENTS.md, AGENTS.md, ../CONVENTIONS.md, ../roles/DEV.md, ../shared/api.md, ../shared/types.ts. Follow roles/DEV.md exactly: you plan AND code, alone, only inside this folder. Confirm you understood in 3 lines, then wait for the hackathon task from the human."

& wt.exe -w new new-tab -d $dir --title "DEV-$zoneName" powershell -NoExit -Command (Get-CodexCmd $devPrompt)
