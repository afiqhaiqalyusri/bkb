# =============================================================
#  BKB - Set GitHub Secrets Script
#  Run this in a NEW PowerShell terminal after: gh auth login
#
#  Usage:
#    1. Close and reopen PowerShell (to get updated PATH)
#    2. gh auth login
#    3. cd c:\Users\yusri\.gemini\antigravity\scratch\bkb
#    4. .\scripts\set-secrets.ps1
# =============================================================

$REPO = "afiqhaiqalyusri/bkb"

Write-Host ""
Write-Host "======================================" -ForegroundColor Yellow
Write-Host " BKB - GitHub Secrets Setup" -ForegroundColor Yellow
Write-Host " Repo: $REPO" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "You will be prompted for each secret value." -ForegroundColor Cyan
Write-Host "Press Enter to skip optional secrets (mail)." -ForegroundColor Cyan
Write-Host ""

function Set-GhSecret {
    param(
        [string]$Name,
        [string]$Value
    )
    if ([string]::IsNullOrWhiteSpace($Value)) {
        Write-Host "  [SKIP] $Name" -ForegroundColor DarkGray
        return
    }
    $Value | gh secret set $Name --repo $REPO
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK]   $Name" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $Name" -ForegroundColor Red
    }
}

# -- SSH Access -----------------------------------------------
Write-Host "--- VPS SSH Access ---" -ForegroundColor White
Write-Host "Tip: Your private key is usually at C:\Users\you\.ssh\id_rsa" -ForegroundColor DarkGray
$VPS_KEY_PATH = Read-Host "Path to your VPS private key file"
if (Test-Path $VPS_KEY_PATH) {
    $VPS_KEY = Get-Content $VPS_KEY_PATH -Raw
    $VPS_KEY | gh secret set VPS_SSH_PRIVATE_KEY --repo $REPO
    Write-Host "  [OK]   VPS_SSH_PRIVATE_KEY" -ForegroundColor Green
} else {
    Write-Host "  [WARN] File not found. Enter the key content manually:" -ForegroundColor Yellow
    $VPS_KEY = Read-Host "Paste private key content"
    Set-GhSecret "VPS_SSH_PRIVATE_KEY" $VPS_KEY
}

$VPS_HOST = Read-Host "VPS_HOST (VPS IP address or hostname)"
Set-GhSecret "VPS_HOST" $VPS_HOST

$VPS_USER = Read-Host "VPS_USER (SSH username, e.g. ubuntu)"
Set-GhSecret "VPS_USER" $VPS_USER

# -- GHCR Token -----------------------------------------------
Write-Host ""
Write-Host "--- GitHub Container Registry ---" -ForegroundColor White
Write-Host "Create a PAT at: https://github.com/settings/tokens/new" -ForegroundColor DarkGray
Write-Host "Scope needed: read:packages only" -ForegroundColor DarkGray
$GHCR_TOKEN = Read-Host "GHCR_TOKEN (GitHub PAT with read:packages scope)"
Set-GhSecret "GHCR_TOKEN" $GHCR_TOKEN

# -- Database -------------------------------------------------
Write-Host ""
Write-Host "--- Database ---" -ForegroundColor White
$DB_URL = Read-Host "DATABASE_URL (press Enter for default)"
if ([string]::IsNullOrWhiteSpace($DB_URL)) {
    $DB_URL = "jdbc:postgresql://host.docker.internal:5432/bkb"
}
Set-GhSecret "DATABASE_URL" $DB_URL

$DB_USER = Read-Host "DB_USER (e.g. bkb_user)"
Set-GhSecret "DB_USER" $DB_USER

$DB_PASSWORD = Read-Host "DB_PASSWORD (strong password)"
Set-GhSecret "DB_PASSWORD" $DB_PASSWORD

# -- JWT Secrets ----------------------------------------------
Write-Host ""
Write-Host "--- JWT Secrets ---" -ForegroundColor White
Write-Host "Generate with: openssl rand -hex 64  (run in Git Bash or WSL)" -ForegroundColor DarkGray

$JWT_SECRET = Read-Host "JWT_SECRET"
Set-GhSecret "JWT_SECRET" $JWT_SECRET

$JWT_REFRESH = Read-Host "JWT_REFRESH_SECRET (must be a different value)"
Set-GhSecret "JWT_REFRESH_SECRET" $JWT_REFRESH

# -- Mail (Optional) ------------------------------------------
Write-Host ""
Write-Host "--- Mail (optional - press Enter to skip) ---" -ForegroundColor White
Write-Host "Gmail App Password: https://myaccount.google.com/apppasswords" -ForegroundColor DarkGray

$MAIL_USER = Read-Host "MAIL_USERNAME (Gmail address, or Enter to skip)"
Set-GhSecret "MAIL_USERNAME" $MAIL_USER

$MAIL_PASS = Read-Host "MAIL_PASSWORD (Gmail App Password, or Enter to skip)"
Set-GhSecret "MAIL_PASSWORD" $MAIL_PASS

# -- Done -----------------------------------------------------
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " All secrets set!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verify at: https://github.com/$REPO/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Trigger deploy at: https://github.com/$REPO/actions" -ForegroundColor Cyan
