& {
    $ErrorActionPreference = "Stop"
    $HidrantesProyecto = "C:\Users\jarce\nodeJsProyects\Ejercicios python\hidrantes-app"
    $HidrantesEquipo = "jarce003s-projects"
    $HidrantesEquipoId = "team_y295LniG17lhksVwQruyZqpN"
    $HidrantesCli = @("--yes", "--package=vercel@62.2.0", "--", "vercel")

    function Invoke-HidrantesVercel {
        param([string[]]$Argumentos)
        & npx.cmd @HidrantesCli @Argumentos
        if ($LASTEXITCODE -ne 0) { throw ("Vercel fallo: " + ($Argumentos -join " ")) }
    }

    try {
        if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) { throw "No se encontro npx.cmd. Revisa Node.js." }
        if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "No se encontro Git." }
        $HidrantesPackage = [System.IO.File]::ReadAllText((Join-Path $HidrantesProyecto "package.json")) | ConvertFrom-Json
        if ($HidrantesPackage.name -ne "hidrantes-app") { throw "La carpeta pertenece a otro proyecto." }
        Push-Location -LiteralPath $HidrantesProyecto
        try {
            $HidrantesOrigin = (& git remote get-url origin).Trim()
            if ($LASTEXITCODE -ne 0 -or $HidrantesOrigin -notin @("https://github.com/Jarce003/hidrantes-app.git", "https://github.com/Jarce003/hidrantes-app", "git@github.com:Jarce003/hidrantes-app.git")) { throw "Primero publica hidrantes-app en su repositorio de GitHub." }
            $HidrantesRama = (& git branch --show-current).Trim()
            if ($LASTEXITCODE -ne 0 -or $HidrantesRama -ne "main") { throw "La primera publicacion debe hacerse desde main." }
            $HidrantesPendientes = @(& git status --porcelain --untracked-files=no)
            if ($LASTEXITCODE -ne 0 -or $HidrantesPendientes.Count -gt 0) { throw "Existen cambios seguidos por Git sin publicar. Revisa antes del despliegue." }
            $HidrantesCommitLocal = (& git rev-parse HEAD).Trim()
            $HidrantesRemoto = @(& git ls-remote origin refs/heads/main)
            if ($LASTEXITCODE -ne 0 -or $HidrantesRemoto.Count -ne 1 -or ($HidrantesRemoto[0] -split "\s+")[0] -ne $HidrantesCommitLocal) { throw "El commit local no coincide con main en GitHub. Completa la subida primero." }

            $HidrantesEnv = @{}
            foreach ($HidrantesLinea in [System.IO.File]::ReadAllLines((Join-Path $HidrantesProyecto ".env.local"))) {
                if ($HidrantesLinea -match "^\s*(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)\s*=(.*)$") {
                    $HidrantesClaveEnv = $Matches[1]
                    if ($HidrantesEnv.ContainsKey($HidrantesClaveEnv)) { throw "Hay una variable de Supabase duplicada en .env.local." }
                    $HidrantesEnv[$HidrantesClaveEnv] = $Matches[2].Trim().Trim('"').Trim("'")
                }
            }
            if ($HidrantesEnv["NEXT_PUBLIC_SUPABASE_URL"] -ne "https://kiwuokhbeoatjiztmgwh.supabase.co") { throw "La URL no pertenece a hidrantes-app." }
            if ($HidrantesEnv["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] -notmatch "^sb_publishable_[A-Za-z0-9_-]+$") { throw "Falta la clave publishable correcta." }

            $HidrantesEnlaceRuta = Join-Path $HidrantesProyecto ".vercel\project.json"
            if (Test-Path -LiteralPath $HidrantesEnlaceRuta) {
                $HidrantesEnlace = [System.IO.File]::ReadAllText($HidrantesEnlaceRuta) | ConvertFrom-Json
                if ($HidrantesEnlace.orgId -ne $HidrantesEquipoId -or ($HidrantesEnlace.projectName -and $HidrantesEnlace.projectName -ne "hidrantes-app")) { throw "La carpeta ya esta vinculada a otro proyecto o equipo de Vercel. No se modifico." }
            }
            Invoke-HidrantesVercel -Argumentos @("whoami")
            Invoke-HidrantesVercel -Argumentos @("link", "--yes", "--project", "hidrantes-app", "--scope", $HidrantesEquipo)
            $HidrantesEnlace = [System.IO.File]::ReadAllText($HidrantesEnlaceRuta) | ConvertFrom-Json
            if ($HidrantesEnlace.orgId -ne $HidrantesEquipoId) { throw "El equipo vinculado no coincide con el esperado." }

            foreach ($HidrantesVariable in @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")) {
                Write-Host ("Configurando " + $HidrantesVariable + " en production y preview...") -ForegroundColor Cyan
                $HidrantesEnv[$HidrantesVariable] | & npx.cmd @HidrantesCli env add $HidrantesVariable "production,preview" --yes --force --scope $HidrantesEquipo
                if ($LASTEXITCODE -ne 0) { throw "No se pudo configurar una variable en Vercel." }
            }
            Invoke-HidrantesVercel -Argumentos @("git", "connect", "https://github.com/Jarce003/hidrantes-app", "--yes", "--scope", $HidrantesEquipo)
            Invoke-HidrantesVercel -Argumentos @("deploy", "--prod", "--yes", "--scope", $HidrantesEquipo)
            Write-Host "Publicacion finalizada. Usa el enlace HTTPS mostrado por Vercel para probar desde el celular." -ForegroundColor Green
        }
        finally { Pop-Location }
    }
    catch {
        Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
        Write-Host "Si falta iniciar sesion, ejecuta: npx.cmd --yes --package=vercel@62.2.0 -- vercel login"
        Write-Host "Si falta acceso al repositorio privado, habilita hidrantes-app en la integracion GitHub de Vercel y repite este bloque."
    }
    finally {
        $HidrantesEnv = $null
        $HidrantesLinea = $null
    }
}
