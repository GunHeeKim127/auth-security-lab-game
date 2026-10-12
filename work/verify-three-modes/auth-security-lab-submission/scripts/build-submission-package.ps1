$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outputs = Join-Path $projectRoot 'outputs'
$stage = Join-Path $projectRoot 'work\submission-stage'
$stageRoot = Join-Path $stage 'auth-security-lab-submission'
$zip = Join-Path $outputs 'auth-security-lab-submission.zip'

if (-not $stage.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Staging path escaped the project root.'
}
if (Test-Path -LiteralPath $stage) {
  $resolvedStage = (Resolve-Path -LiteralPath $stage).Path
  if (-not $resolvedStage.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Refusing to remove a staging path outside the project.'
  }
  Remove-Item -LiteralPath $resolvedStage -Recurse -Force
}
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

$files = @(
  'SUBMISSION_README.md', '.env.example', '.gitignore', 'package.json', 'package-lock.json',
  'next.config.ts', 'next-env.d.ts', 'tsconfig.json', 'playwright.config.ts', 'playwright.repeat.config.ts'
)
$directories = @('src', 'prisma', 'tests', 'scripts', 'results', 'prompts')
foreach ($file in $files) {
  $source = Join-Path $projectRoot $file
  if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination $stageRoot }
}
foreach ($directory in $directories) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $directory) -Destination $stageRoot -Recurse
}

$docsDir = Join-Path $stageRoot 'docs'
New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs\submission-paper-source.md') -Destination $docsDir
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs\rubric-checklist.md') -Destination $docsDir
if (Test-Path -LiteralPath (Join-Path $projectRoot 'docs\assets')) {
  Copy-Item -LiteralPath (Join-Path $projectRoot 'docs\assets') -Destination $docsDir -Recurse
}

$paperDir = Join-Path $stageRoot 'paper'
New-Item -ItemType Directory -Path $paperDir -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $outputs 'auth-security-lab-paper.docx') -Destination $paperDir

$manifestItems = Get-ChildItem -LiteralPath $stageRoot -Recurse -File | Sort-Object FullName | ForEach-Object {
  $relative = $_.FullName.Substring($stageRoot.Length + 1).Replace('\', '/')
  $hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  "$hash  $relative"
}
$manifestItems | Set-Content -LiteralPath (Join-Path $stageRoot 'SHA256SUMS.txt') -Encoding utf8

if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -LiteralPath $stageRoot -DestinationPath $zip -CompressionLevel Optimal
Get-Item -LiteralPath $zip | Select-Object FullName, Length
