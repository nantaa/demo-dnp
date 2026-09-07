# --- Install ALL SuperGravity skills, workflows & rules (no pip, no MCP, no CLI) ---

$Gemini = "$env:USERPROFILE\.gemini\antigravity"
$Temp   = "$env:TEMP\sg-skills-temp"

Write-Host "Checking for git..." -ForegroundColor Cyan
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git not found. Install it from https://git-scm.com/download/win first." -ForegroundColor Red
    exit 1
}

# Clean up any previous attempt
if (Test-Path $Temp) { Remove-Item $Temp -Recurse -Force }

Write-Host "Cloning repo structure (no file contents yet)..." -ForegroundColor Cyan
git clone --filter=blob:none --sparse https://github.com/mithun50/SuperGravity.git $Temp

Push-Location $Temp
Write-Host "Fetching workflows, skills, and rules folders..." -ForegroundColor Cyan
git sparse-checkout set global_workflows "SuperGravity/Agents" rules
Pop-Location

# Ensure target directories exist
New-Item -ItemType Directory -Force -Path "$Gemini\global_workflows" | Out-Null
New-Item -ItemType Directory -Force -Path "$Gemini\rules"            | Out-Null
New-Item -ItemType Directory -Force -Path "$Gemini\skills"           | Out-Null

# --- Install all workflows ---
Write-Host "`nInstalling workflows:" -ForegroundColor Yellow
Get-ChildItem "$Temp\global_workflows\*.md" | ForEach-Object {
    Copy-Item $_.FullName "$Gemini\global_workflows\" -Force
    Write-Host "  /$($_.BaseName)"
}

# --- Install all rules ---
Write-Host "`nInstalling rules:" -ForegroundColor Yellow
Get-ChildItem "$Temp\rules\*.md" | ForEach-Object {
    Copy-Item $_.FullName "$Gemini\rules\" -Force
    Write-Host "  $($_.Name)"
}

# --- Install all skills ---
Write-Host "`nInstalling skills:" -ForegroundColor Yellow
Get-ChildItem "$Temp\SuperGravity\Agents\*.md" | ForEach-Object {
    $name = $_.BaseName
    $skillDir = "$Gemini\skills\$name"
    New-Item -ItemType Directory -Force -Path $skillDir | Out-Null
    Copy-Item $_.FullName "$skillDir\SKILL.md" -Force
    Write-Host "  $name"
}

# Clean up temp clone
Remove-Item $Temp -Recurse -Force

Write-Host "`n✅ Done. Installed to: $Gemini" -ForegroundColor Green
Write-Host "Restart Antigravity IDE to load the new workflows, rules, and skills." -ForegroundColor Green