Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media, ContentType=WindowsRuntime]

if ($args[0] -eq 'list') {
    [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | ForEach-Object {
        $_.DisplayName + ' | ' + $_.Language + ' | ' + $_.Gender + ' | ' + $_.Description
    }
    exit 0
}

$text = [Console]::In.ReadToEnd()
$voiceName = $args[0]
$outPath = $args[1]

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

$synth = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::new()
$voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object {
    $_.DisplayName -like "*$voiceName*"
} | Select-Object -First 1
if (-not $voice) {
    Write-Error "Voz no encontrada: $voiceName"
    exit 2
}
$synth.Voice = $voice

$stream = Await ($synth.SynthesizeTextToStreamAsync($text)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
$stream.Seek(0)
$reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
$loadOp = $reader.LoadAsync([uint32]$stream.Size)
$loaded = Await $loadOp ([System.UInt32])
$bytes = New-Object byte[] $stream.Size
$reader.ReadBytes($bytes)
[System.IO.File]::WriteAllBytes($outPath, $bytes)
Write-Output "OK $outPath ($($bytes.Length) bytes)"
