<?php
declare(strict_types=1);

/**
 * Anfrage-Endpunkt für die Formulare von dieaufraeumer.com.
 * Nimmt Kostenanfrage, Rückrufbitte und Objektanfrage entgegen, prüft die Angaben,
 * hängt hochgeladene Fotos an und versendet eine E-Mail. Antwortet immer mit JSON.
 *
 * Einrichtung: anfrage-config.sample.php nach anfrage-config.php kopieren und Empfänger eintragen.
 * Ohne diese Datei meldet der Endpunkt ehrlich, dass der Versand nicht eingerichtet ist.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(int $status, string $code, string $message, array $fields = []): never
{
    respond($status, ['ok' => false, 'code' => $code, 'message' => $message, 'fields' => (object) $fields]);
}
/** Eine Zeile ohne Steuerzeichen: schützt E-Mail-Kopfzeilen vor eingeschleusten Zeilenumbrüchen. */
function line(?string $v, int $max = 200): string
{
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string) $v) ?? '';
    return mb_substr(trim($v), 0, $max);
}
function text(?string $v, int $max = 3000): string
{
    $v = str_replace(["\r\n", "\r"], "\n", (string) $v);
    $v = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]+/u', ' ', $v) ?? '';
    return mb_substr(trim($v), 0, $max);
}

$configFile = __DIR__ . '/anfrage-config.php';
if (!is_file($configFile)) {
    fail(503, 'nicht_eingerichtet', 'Der Online-Versand ist noch nicht eingerichtet. Bitte rufen Sie uns an.');
}
$cfg = require $configFile;

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'methode', 'Nur POST ist erlaubt.');
}

// Herkunft: Anfragen müssen von der eigenen Website kommen.
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$originHost = $origin !== '' ? (string) parse_url($origin, PHP_URL_HOST) : '';
if ($originHost === '' || !in_array($originHost, $cfg['erlaubte_hosts'], true)) {
    fail(403, 'herkunft', 'Die Anfrage kam nicht von unserer Website.');
}

// Zu große Uploads verwirft PHP stillschweigend: dann ist $_POST leer.
if (empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    fail(413, 'zu_gross', 'Die Fotos sind zusammen zu groß. Bitte senden Sie weniger oder kleinere Bilder.', ['fotos' => 'Zusammen zu groß.']);
}

// Automatische Einsendungen: Lockfeld gefüllt oder Formular unplausibel schnell abgeschickt.
// Antwort wie bei Erfolg, damit Bots nichts lernen. Es wird nichts versendet.
$started = (int) ($_POST['ts'] ?? 0);
$elapsed = $started > 0 ? (int) (microtime(true) * 1000) - $started : 0;
if (line($_POST['website'] ?? '') !== '' || $elapsed < 2500) {
    respond(200, ['ok' => true]);
}

// Begrenzung je Absender-Adresse und Stunde. Gespeichert wird nur eine Prüfsumme.
$dataDir = rtrim($cfg['daten_ordner'], '/');
if (!is_dir($dataDir) && !@mkdir($dataDir, 0700, true)) {
    fail(500, 'server', 'Der Versand ist gerade nicht möglich. Bitte rufen Sie uns an.');
}
$ipHash = substr(hash('sha256', ($cfg['salz'] ?? '') . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16);
$rateFile = $dataDir . '/rate-' . $ipHash . '.json';
$now = time();
$hits = is_file($rateFile) ? (json_decode((string) file_get_contents($rateFile), true) ?: []) : [];
$hits = array_values(array_filter($hits, static fn ($t) => $t > $now - 3600));
if (count($hits) >= (int) $cfg['max_pro_stunde']) {
    fail(429, 'zu_oft', 'Sie haben in kurzer Zeit mehrere Anfragen gesendet. Bitte rufen Sie uns an.');
}

// Angaben prüfen
$art = line($_POST['art'] ?? '');
$arten = ['kostenanfrage' => 'Kostenanfrage', 'rueckruf' => 'Rückrufbitte', 'objektanfrage' => 'Objektanfrage'];
if (!isset($arten[$art])) {
    fail(422, 'art', 'Unbekannte Anfrageart.');
}
$f = [
    'name' => line($_POST['name'] ?? '', 120),
    'tel' => line($_POST['tel'] ?? '', 40),
    'mail' => line($_POST['mail'] ?? '', 160),
    'ort' => line($_POST['ort'] ?? '', 120),
    'zeit' => line($_POST['zeit'] ?? '', 40),
    'thema' => line($_POST['thema'] ?? '', 120),
    'firma' => line($_POST['firma'] ?? '', 160),
    'objekt' => line($_POST['objekt'] ?? '', 200),
    'frist' => line($_POST['frist'] ?? '', 20),
    'nachricht' => text($_POST['nachricht'] ?? ''),
    'angaben' => text($_POST['angaben'] ?? '', 2000),
];
$errors = [];
if (mb_strlen($f['name']) < 2) $errors['name'] = 'Bitte geben Sie Ihren Namen an.';
if (strlen(preg_replace('/\D/', '', $f['tel']) ?? '') < 6) $errors['tel'] = 'Bitte geben Sie eine Telefonnummer an.';
if ($f['mail'] !== '' && !filter_var($f['mail'], FILTER_VALIDATE_EMAIL)) $errors['mail'] = 'Bitte prüfen Sie die E-Mail-Adresse.';
if ($art === 'kostenanfrage' && mb_strlen($f['ort']) < 3) $errors['ort'] = 'Bitte nennen Sie PLZ oder Ort des Objekts.';
if ($art === 'objektanfrage') {
    if (mb_strlen($f['firma']) < 2) $errors['firma'] = 'Bitte nennen Sie Ihr Unternehmen.';
    if (mb_strlen($f['objekt']) < 6) $errors['objekt'] = 'Bitte geben Sie die Objektadresse an.';
    if ($f['mail'] === '') $errors['mail'] = 'Bitte geben Sie eine E-Mail-Adresse an.';
}
if ($art !== 'rueckruf' && ($_POST['ok'] ?? '') === '') $errors['ok'] = 'Bitte stimmen Sie der Verwendung Ihrer Angaben zu.';

// Fotos prüfen: Anzahl, Größe und tatsächlicher Dateityp
$attachments = [];
$erlaubt = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/heic' => 'heic', 'image/heif' => 'heif'];
if (!empty($_FILES['fotos']) && is_array($_FILES['fotos']['name'])) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $total = 0;
    foreach ($_FILES['fotos']['name'] as $i => $original) {
        $err = $_FILES['fotos']['error'][$i];
        if ($err === UPLOAD_ERR_NO_FILE) continue;
        if ($err !== UPLOAD_ERR_OK) { $errors['fotos'] = 'Ein Foto konnte nicht übertragen werden. Bitte versuchen Sie es mit kleineren Bildern.'; break; }
        if (count($attachments) >= (int) $cfg['max_fotos']) { $errors['fotos'] = 'Bitte senden Sie höchstens ' . (int) $cfg['max_fotos'] . ' Fotos.'; break; }
        $tmp = $_FILES['fotos']['tmp_name'][$i];
        $size = (int) $_FILES['fotos']['size'][$i];
        $mime = is_uploaded_file($tmp) ? (string) $finfo->file($tmp) : '';
        if (!isset($erlaubt[$mime])) { $errors['fotos'] = 'Bitte senden Sie nur Fotos (JPG, PNG, WebP oder HEIC).'; break; }
        if ($size > (int) $cfg['max_mb_je_foto'] * 1048576) { $errors['fotos'] = 'Ein Foto ist größer als ' . (int) $cfg['max_mb_je_foto'] . ' MB.'; break; }
        $total += $size;
        if ($total > (int) $cfg['max_mb_gesamt'] * 1048576) { $errors['fotos'] = 'Die Fotos sind zusammen zu groß.'; break; }
        $attachments[] = ['path' => $tmp, 'mime' => $mime, 'name' => 'foto-' . (count($attachments) + 1) . '.' . $erlaubt[$mime]];
    }
}
if ($errors) {
    fail(422, 'angaben', 'Bitte prüfen Sie die markierten Angaben.', $errors);
}

// E-Mail zusammenstellen
$zeilen = [$arten[$art] . ' über ' . ($cfg['website'] ?? 'die Website'), ''];
$zeilen[] = 'Name:      ' . $f['name'];
if ($f['firma'] !== '') $zeilen[] = 'Firma:     ' . $f['firma'];
$zeilen[] = 'Telefon:   ' . $f['tel'];
if ($f['mail'] !== '') $zeilen[] = 'E-Mail:    ' . $f['mail'];
if ($f['ort'] !== '') $zeilen[] = 'Ort:       ' . $f['ort'];
if ($f['objekt'] !== '') $zeilen[] = 'Objekt:    ' . $f['objekt'];
if ($f['frist'] !== '') $zeilen[] = 'Leer bis:  ' . $f['frist'];
if ($f['thema'] !== '') $zeilen[] = 'Thema:     ' . $f['thema'];
if ($f['zeit'] !== '') $zeilen[] = 'Erreichbar: ' . $f['zeit'];
if ($f['angaben'] !== '') { $zeilen[] = ''; $zeilen[] = 'Angaben aus dem Kostenrechner (unverbindlich):'; $zeilen[] = $f['angaben']; }
if ($f['nachricht'] !== '') { $zeilen[] = ''; $zeilen[] = 'Nachricht:'; $zeilen[] = $f['nachricht']; }
$zeilen[] = '';
$zeilen[] = 'Fotos im Anhang: ' . count($attachments);
$bodyText = implode("\n", $zeilen) . "\n";

$subject = $arten[$art] . ': ' . $f['name'] . ($f['ort'] !== '' ? ', ' . $f['ort'] : '');
$boundary = 'b' . bin2hex(random_bytes(12));
$headers = [
    'From: ' . mb_encode_mimeheader($cfg['absender_name'], 'UTF-8') . ' <' . $cfg['absender'] . '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
    'X-Mailer: dieaufraeumer.com',
];
if ($f['mail'] !== '') $headers[] = 'Reply-To: ' . $f['mail'];

$message = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($bodyText)) . "\r\n";
foreach ($attachments as $a) {
    $message .= "--$boundary\r\nContent-Type: {$a['mime']}; name=\"{$a['name']}\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$a['name']}\"\r\n\r\n"
        . chunk_split(base64_encode((string) file_get_contents($a['path']))) . "\r\n";
}
$message .= "--$boundary--\r\n";

// Versand. 'protokoll' schreibt die fertige E-Mail in den Datenordner (zum Testen ohne Mailserver).
if (($cfg['versand'] ?? 'mail') === 'protokoll') {
    $sent = file_put_contents($dataDir . '/mail-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.eml',
        'To: ' . $cfg['empfaenger'] . "\r\nSubject: " . $subject . "\r\n" . implode("\r\n", $headers) . "\r\n\r\n" . $message) !== false;
} else {
    $sent = mail($cfg['empfaenger'], mb_encode_mimeheader($subject, 'UTF-8'), $message, implode("\r\n", $headers), '-f' . $cfg['absender']);
}
if (!$sent) {
    fail(502, 'versand', 'Die Anfrage konnte nicht versendet werden. Bitte rufen Sie uns an.');
}

$hits[] = $now;
@file_put_contents($rateFile, json_encode($hits), LOCK_EX);
respond(200, ['ok' => true]);
