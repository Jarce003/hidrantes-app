& {
    $ErrorActionPreference = "Stop"
    $HidrantesProyecto = "C:\Users\jarce\nodeJsProyects\Ejercicios python\hidrantes-app"
    $HidrantesRemoto = "https://github.com/Jarce003/hidrantes-app.git"

    function Invoke-HidrantesGit {
        param([string[]]$Argumentos)
        & git @Argumentos
        if ($LASTEXITCODE -ne 0) { throw ("Git fallo: " + ($Argumentos -join " ")) }
    }

    try {
        if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "No se encontro Git. Instala Git for Windows y abre otra terminal." }
        if (-not (Test-Path -LiteralPath (Join-Path $HidrantesProyecto "package.json"))) { throw "No existe hidrantes-app." }
        $HidrantesNombreProyecto = ([System.IO.File]::ReadAllText((Join-Path $HidrantesProyecto "package.json")) | ConvertFrom-Json).name
        if ($HidrantesNombreProyecto -ne "hidrantes-app") { throw "La carpeta corresponde a otro proyecto." }

        Push-Location -LiteralPath $HidrantesProyecto
        try {
            if (-not (Test-Path -LiteralPath ".git")) { Invoke-HidrantesGit -Argumentos @("init", "-b", "main") }
            $HidrantesRaizGit = (& git rev-parse --show-toplevel).Trim()
            if ($LASTEXITCODE -ne 0 -or [System.IO.Path]::GetFullPath($HidrantesRaizGit) -ne [System.IO.Path]::GetFullPath($HidrantesProyecto)) { throw "La carpeta no es la raiz de su propio repositorio." }
            $HidrantesRamasRemotas = @(& git remote)
            if ($LASTEXITCODE -ne 0) { throw "No se pudieron consultar los remotos." }
            if (@($HidrantesRamasRemotas | Where-Object { $_ -ne "origin" }).Count -gt 0) { throw "Existen otros remotos; revisalos antes de publicar." }
            if ($HidrantesRamasRemotas -contains "origin") {
                $HidrantesOrigin = (& git remote get-url origin).Trim()
                if ($LASTEXITCODE -ne 0 -or $HidrantesOrigin -notin @($HidrantesRemoto, "https://github.com/Jarce003/hidrantes-app", "git@github.com:Jarce003/hidrantes-app.git")) { throw "origin apunta a otro repositorio. No se modifico." }
            }
            else { Invoke-HidrantesGit -Argumentos @("remote", "add", "origin", $HidrantesRemoto) }

            $HidrantesArchivosSeguidos = @(& git ls-files)
            if ($LASTEXITCODE -ne 0) { throw "No se pudieron revisar los archivos de Git." }
            if (@($HidrantesArchivosSeguidos | Where-Object { $_ -match "(^|/)\.env($|\.)" -and $_ -ne ".env.example" }).Count -gt 0) { throw "Hay un archivo de entorno seguido por Git. Detenemos la publicacion para corregirlo." }

            if (Get-Command gh -ErrorAction SilentlyContinue) {
                & gh auth status 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $HidrantesLoginGithub = & gh api user --jq .login
                    if ($LASTEXITCODE -ne 0 -or $HidrantesLoginGithub.Trim() -ne "Jarce003") { throw "GitHub CLI esta conectado con otra cuenta." }
                    & gh repo view Jarce003/hidrantes-app --json name 2>$null | Out-Null
                    if ($LASTEXITCODE -ne 0) {
                        & gh repo create Jarce003/hidrantes-app --private --description "Consulta publica y gestion de hidrantes de Tres Rios"
                        if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el repositorio privado. Comparte la salida." }
                    }
                }
            }

            Invoke-HidrantesGit -Argumentos @("ls-remote", "origin")
            $HidrantesNombreGit = & git config user.name
            if ([string]::IsNullOrWhiteSpace($HidrantesNombreGit)) {
                $HidrantesNombreGit = (Read-Host "Nombre para tus commits de este proyecto").Trim()
                if (-not $HidrantesNombreGit) { throw "Falta el nombre de autor." }
                Invoke-HidrantesGit -Argumentos @("config", "user.name", $HidrantesNombreGit)
            }
            $HidrantesCorreoGit = & git config user.email
            if ([string]::IsNullOrWhiteSpace($HidrantesCorreoGit)) {
                $HidrantesCorreoGit = (Read-Host "Correo para tus commits de este proyecto").Trim()
                if ($HidrantesCorreoGit -notmatch "^[^\s@]+@[^\s@]+$") { throw "El correo de autor no es valido." }
                Invoke-HidrantesGit -Argumentos @("config", "user.email", $HidrantesCorreoGit)
            }

            $HidrantesRama = (& git branch --show-current).Trim()
            if ($HidrantesRama -ne "main") {
                & git show-ref --verify --quiet refs/heads/main
                if ($LASTEXITCODE -eq 0) { throw "Existe main pero estas en otra rama. Revisa antes de publicar." }
                Invoke-HidrantesGit -Argumentos @("switch", "-c", "main")
            }

            $HidrantesPermitidos = @("src", "public", "package.json", "package-lock.json", "tsconfig.json", "eslint.config.mjs", "next.config.ts", "next.config.js", "next.config.mjs", "postcss.config.mjs", "postcss.config.js", "tailwind.config.ts", "tailwind.config.js", ".gitignore", ".env.example", "README.md", "vercel.json", ".github", "scripts", "supabase")
            $HidrantesParaAgregar = @($HidrantesPermitidos | Where-Object { Test-Path -LiteralPath $_ })
            Invoke-HidrantesGit -Argumentos (@("add", "--") + $HidrantesParaAgregar)
            $HidrantesPreparados = @(& git diff --cached --name-only)
            if ($LASTEXITCODE -ne 0) { throw "No se pudieron revisar los archivos preparados." }
            foreach ($HidrantesArchivo in $HidrantesPreparados) {
                if ($HidrantesArchivo -match "(^|/)\.env($|\.)" -and $HidrantesArchivo -ne ".env.example") { throw "Se detecto un archivo de entorno en la publicacion." }
                if (($HidrantesArchivo -split "/")[0] -notin $HidrantesPermitidos) { throw "Hay un archivo preparado fuera del proyecto previsto. Revisalo antes de publicar." }
            }
            $HidrantesDiff = (& git diff --cached --unified=0) -join "`n"
            if ($LASTEXITCODE -ne 0) { throw "No se pudo revisar el contenido preparado." }
            if ($HidrantesDiff -match "(?m)^\+.*(?:sb_secret_[A-Za-z0-9_-]{10,}|BEGIN [A-Z ]*PRIVATE KEY)") { throw "Se detecto una posible clave secreta. No se publico." }
            $HidrantesDiff = $null

            & git diff --cached --quiet
            if ($LASTEXITCODE -eq 1) { Invoke-HidrantesGit -Argumentos @("commit", "-m", "Configurar hidrantes Tres Rios y vistas para celular") }
            elseif ($LASTEXITCODE -ne 0) { throw "No se pudo comprobar el commit." }
            Invoke-HidrantesGit -Argumentos @("push", "-u", "origin", "main")
            Write-Host "Repositorio publicado: https://github.com/Jarce003/hidrantes-app" -ForegroundColor Green
            Write-Host "Siguiente paso: vincular hidrantes-app y publicar en Vercel."
        }
        finally { Pop-Location }
    }
    catch {
        Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
        Write-Host "Si falta el repositorio, crea Jarce003/hidrantes-app privado y vacio en https://github.com/new; luego repite este bloque."
    }
}
