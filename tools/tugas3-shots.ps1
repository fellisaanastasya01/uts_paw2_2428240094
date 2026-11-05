# Jalankan satu grup uji di jendela PowerShell berjudul "Fellisa Anastasya" lalu simpan tangkapan layarnya.
# Pemakaian: powershell -NoProfile -ExecutionPolicy Bypass -File tools/tugas3-shots.ps1 [-Hanya 03-filtering]
param([string]$Hanya)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$shotDir = Join-Path $root 'postman\screenshots\tugas3'
New-Item -ItemType Directory -Force -Path $shotDir | Out-Null

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class Jendela {
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    public delegate bool EnumProc(IntPtr h, IntPtr l);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
    public static List<IntPtr> Semua() {
        var hasil = new List<IntPtr>();
        EnumWindows((h, l) => {
            var sb = new StringBuilder(400);
            GetWindowText(h, sb, 400);
            if (sb.ToString() == "Fellisa Anastasya") hasil.Add(h);
            return true;
        }, IntPtr.Zero);
        return hasil;
    }
    public static IntPtr Tunggu(int milidetik) {
        var batas = Environment.TickCount + milidetik;
        while (Environment.TickCount < batas) {
            var d = Semua();
            if (d.Count > 0) return d[d.Count - 1];
            System.Threading.Thread.Sleep(250);
        }
        return IntPtr.Zero;
    }
}
"@

function Tangkap([IntPtr]$h, [string]$path) {
    [void][Jendela]::ShowWindow($h, 3)       # SW_MAXIMIZE
    [void][Jendela]::BringWindowToTop($h)
    [void][Jendela]::SetForegroundWindow($h)
    Start-Sleep -Milliseconds 1500
    $r = New-Object Jendela+RECT
    [void][Jendela]::GetWindowRect($h, [ref]$r)
    $w = $r.Right - $r.Left; $t = $r.Bottom - $r.Top
    $bmp = New-Object System.Drawing.Bitmap($w, $t)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($r.Left, $r.Top, 0, 0, $bmp.Size)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "  tersimpan $path ($w x $t)"
}

function JalankanUji([string]$nama, [string]$grup) {
    Write-Host "== $nama  (node tools/uji.js $grup)"
    $isi = @"
`$Host.UI.RawUI.WindowTitle = 'Fellisa Anastasya'
function global:prompt { 'Fellisa Anastasya> ' }
try {
    `$Host.UI.RawUI.BufferSize = New-Object Management.Automation.Host.Size(220, 5000)
    `$Host.UI.RawUI.WindowSize = New-Object Management.Automation.Host.Size(168, 52)
} catch {}
Clear-Host
Set-Location '$root'
node tools/uji.js $grup
"@
    $enc = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($isi))
    $proc = Start-Process powershell.exe -WindowStyle Maximized `
        -ArgumentList '-NoLogo', '-NoProfile', '-NoExit', '-EncodedCommand', $enc -PassThru

    $h = [Jendela]::Tunggu(20000)
    if ($h -eq [IntPtr]::Zero) { throw "Jendela 'Fellisa Anastasya' tidak muncul" }
    [void][Jendela]::SetForegroundWindow($h)
    Start-Sleep -Seconds 10
    Tangkap $h (Join-Path $shotDir "$nama.png")
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 900
}

$daftar = @(
    @{ n = '01-struktur-database'; g = '01-struktur' },
    @{ n = '02-schema-embedding-referencing'; g = '02-schema' },
    @{ n = '03-filtering'; g = '03-filtering' },
    @{ n = '04-sorting'; g = '04-sorting' },
    @{ n = '05-pagination'; g = '05-pagination' },
    @{ n = '06-projection'; g = '06-projection' },
    @{ n = '07-referencing'; g = '07-referencing' },
    @{ n = '08-create-referencing'; g = '08-create' },
    @{ n = '09-validasi-error'; g = '09-validasi' }
)
if ($Hanya) { $daftar = $daftar | Where-Object { $_.n -like "*$Hanya*" } }
foreach ($u in $daftar) { JalankanUji $u.n $u.g }
Write-Host 'Selesai.'
