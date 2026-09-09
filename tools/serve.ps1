# Minimal static file server for local preview (no Node/Python required).
# Supports HTTP Range requests so <video> playback and seeking work.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools\serve.ps1 [-Port 8791]
param([int]$Port = 8791, [string]$Root = (Split-Path $PSScriptRoot -Parent))

$mime = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".js"="application/javascript; charset=utf-8";
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".svg"="image/svg+xml"; ".webp"="image/webp"; ".ico"="image/x-icon";
  ".json"="application/json"; ".woff"="font/woff"; ".woff2"="font/woff2"; ".txt"="text/plain; charset=utf-8";
  ".mp4"="video/mp4"; ".webm"="video/webm"; ".m4v"="video/x-m4v" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root at http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $null
  try { $ctx = $listener.GetContext() } catch { break }
  $res = $ctx.Response
  $fs = $null
  try {
    $path = [uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path.EndsWith("/")) { $path += "index.html" }
    $file = Join-Path $Root ($path.TrimStart("/") -replace "/", "\")
    $full = [IO.Path]::GetFullPath($file)
    $rootFull = [IO.Path]::GetFullPath($Root)

    if (-not ((Test-Path $full -PathType Leaf) -and $full.StartsWith($rootFull))) {
      $res.StatusCode = 404
      $b = [Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $res.ContentType = "text/plain; charset=utf-8"
      $res.ContentLength64 = $b.Length
      $res.OutputStream.Write($b, 0, $b.Length)
      $res.OutputStream.Close()
      continue
    }

    $ext = [IO.Path]::GetExtension($full).ToLower()
    $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
    $res.Headers.Add("Cache-Control", "no-cache")
    $res.Headers.Add("Accept-Ranges", "bytes")

    $fs = [IO.File]::Open($full, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
    $total = $fs.Length
    $start = 0; $end = $total - 1

    $range = $ctx.Request.Headers["Range"]
    if ($range -and $range -match "bytes=(\d*)-(\d*)") {
      $s = $Matches[1]; $e = $Matches[2]
      if ($s -ne "") { $start = [int64]$s }
      if ($e -ne "") { $end = [int64]$e }
      if ($start -ge $total) { $start = 0 }
      if ($end -ge $total -or $end -lt $start) { $end = $total - 1 }
      $res.StatusCode = 206
      $res.Headers.Add("Content-Range", "bytes $start-$end/$total")
    }

    $length = $end - $start + 1
    $res.ContentLength64 = $length

    if ($ctx.Request.HttpMethod -ne "HEAD") {
      $fs.Position = $start
      $buf = New-Object byte[] 65536
      $left = $length
      while ($left -gt 0) {
        $want = [Math]::Min($buf.Length, $left)
        $read = $fs.Read($buf, 0, $want)
        if ($read -le 0) { break }
        $res.OutputStream.Write($buf, 0, $read)
        $left -= $read
      }
    }
  } catch {
    # a client that navigates away mid-download lands here; never let it stop the loop
    Write-Host "ERR $($_.Exception.Message)"
  } finally {
    if ($fs) { $fs.Dispose() }
    try { $res.OutputStream.Close() } catch {}
  }
}

