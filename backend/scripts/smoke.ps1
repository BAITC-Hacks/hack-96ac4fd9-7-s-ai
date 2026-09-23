param([string]$BaseUrl = 'http://127.0.0.1:8787')
$ErrorActionPreference = 'Stop'
$statusDirectory = Join-Path $PSScriptRoot '..\.status'
New-Item -ItemType Directory -Force $statusDirectory | Out-Null
function Invoke-Match([string]$Name, [hashtable]$Body) {
  $requestFile = Join-Path $statusDirectory "$Name.request.json"
  [IO.File]::WriteAllText($requestFile, ($Body | ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
  $responseText = & curl.exe --silent --show-error --fail-with-body --max-time 12 -H 'Content-Type: application/json' --data-binary "@$requestFile" "$BaseUrl/api/match"
  if ($LASTEXITCODE -ne 0) { throw "curl failed: $Name" }
  $response = $responseText | ConvertFrom-Json
  if (-not $response.ok) { throw "API failure: $Name" }
  Write-Output -NoEnumerate $response.data
}
foreach ($endpoint in @('health', 'catalog-options')) {
  $json = & curl.exe --silent --show-error --fail-with-body "$BaseUrl/api/$endpoint"
  if ($LASTEXITCODE -ne 0 -or -not ($json | ConvertFrom-Json).ok) { throw "$endpoint failed" }
}
$dense = @{ city='Алматы'; category='Ведущий'; eventType='корпоратив'; eventDate='2026-10-06'; budgetKzt=1000000; language='ru'; durationHours=5 }
$first = Invoke-Match 'dense' $dense
$repeat = Invoke-Match 'repeat' $dense
if (($first.cards.id -join ',') -ne ($repeat.cards.id -join ',')) { throw 'Non-deterministic IDs' }
if ($first.status -ne 'found' -or $first.candidatesBeforeCut -ne 6 -or $first.cards.Count -ne 3) { throw 'Dense case mismatch' }
$changed = $dense.Clone(); $changed.eventDate='2026-10-01'
$second = Invoke-Match 'dateChange' $changed
if (($second.cards.id -join ',') -ne 'HK-88430,HK-44923') { throw 'Date-change mismatch' }
$rare = Invoke-Match 'rare' @{city='Алматы';category='Флорист';eventType='корпоратив';eventDate='2026-10-04';budgetKzt=300000;durationHours=24}
if ($rare.candidatesBeforeCut -ne 1 -or $rare.cards[0].id -ne 'HK-39372') { throw 'Rare case mismatch' }
$missing = $dense.Clone(); $missing.city='Астана'; $missing.category='Декоратор'
$noCategory = Invoke-Match 'noCategory' $missing
if ($noCategory.status -ne 'no_category') { throw 'No-category mismatch' }
$tight = $dense.Clone(); $tight.budgetKzt=1000
$noMatch = Invoke-Match 'noMatch' $tight
if ($noMatch.status -ne 'no_match' -or $noMatch.message -notmatch 'бюджеттен жоғары: 10') { throw 'No-match mismatch' }
@{ denseIds=$first.cards.id; candidatesBeforeCut=$first.candidatesBeforeCut; changedDateIds=$second.cards.id; rareIds=$rare.cards.id; noCategory=$noCategory.status; noMatch=$noMatch.status; repeatedOrder='PASS' } | ConvertTo-Json
