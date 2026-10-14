param([string]$OutputPath = "outputs/auth-security-lab-game-BRB.zip")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root $OutputPath
$stage = Join-Path $env:TEMP ("auth-security-lab-game-brb-" + [guid]::NewGuid().ToString("N"))
$project = Join-Path $stage "auth-security-lab-game"
New-Item -ItemType Directory -Path $project -Force | Out-Null
$include = @("src", "public", "data", "docs/BRB_SUBMISSION.md", "tests/game.spec.ts", "README.md", "package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "next-env.d.ts", "playwright.game.config.ts", ".gitignore", ".npmrc")
foreach ($item in $include) {
  $source = Join-Path $root $item
  if (-not (Test-Path -LiteralPath $source)) { throw "필수 파일 누락: $item" }
  $target = Join-Path $project $item
  $parent = Split-Path -Parent $target
  New-Item -ItemType Directory -Path $parent -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
}
New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Force }
Compress-Archive -LiteralPath $project -DestinationPath $destination -CompressionLevel Optimal
Remove-Item -LiteralPath $stage -Recurse -Force
Write-Output $destination

