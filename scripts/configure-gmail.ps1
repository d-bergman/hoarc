$ErrorActionPreference = 'Stop'
$repoPath = Split-Path $PSScriptRoot -Parent
$firebaseCli = Join-Path $repoPath 'node_modules/firebase-tools/lib/bin/firebase.js'
if (!(Test-Path -LiteralPath $firebaseCli)) { throw 'Run npm ci in the repository first.' }

# Run locally after Firebase login. Secrets go to Secret Manager through stdin,
# never into arguments, a settings file, Git, or this chat.
$securePassword = Read-Host 'Church Gmail app password (hidden)' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $gmailPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer).Replace(' ', '')
    if ($gmailPassword -notmatch '^[A-Za-z]{16}$') { throw 'Enter a 16-letter Gmail app password, not the Google account password.' }
    $mailConfig = @{ host = 'smtp.gmail.com'; port = 465; user = 'hoarc.church@gmail.com'; pass = $gmailPassword; from = 'hoarc.church@gmail.com' } | ConvertTo-Json -Compress
    $mailConfig | & node $firebaseCli functions:secrets:set SMTP_CONFIG --data-file - --project hoarc-a5afd
    if ($LASTEXITCODE -ne 0) { throw 'SMTP_CONFIG was not stored. Check Firebase login and project access.' }
    $hashBytes = New-Object byte[] 32
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($hashBytes) } finally { $random.Dispose() }
    [Convert]::ToBase64String($hashBytes) | & node $firebaseCli functions:secrets:set CONTACT_HASH_KEY --data-file - --project hoarc-a5afd
    if ($LASTEXITCODE -ne 0) { throw 'CONTACT_HASH_KEY was not stored.' }
    Write-Host 'Secrets stored. Follow docs/CONTACT-SETUP.md before enabling or deploying contact.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    $securePassword.Dispose()
    $gmailPassword = $null
    $mailConfig = $null
}
