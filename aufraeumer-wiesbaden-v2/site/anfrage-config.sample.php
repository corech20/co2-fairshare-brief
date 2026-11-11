<?php
// Einstellungen für anfrage.php.
// Diese Datei nach "anfrage-config.php" kopieren und anpassen. Die Kopie gehört nicht ins Repository.
return [
    'website'        => 'dieaufraeumer.com',
    'empfaenger'     => 'info@dieaufraeumer.com',       // Hier kommen die Anfragen an
    'absender'       => 'website@dieaufraeumer.com',    // Adresse der eigenen Domain, sonst landen Mails im Spam
    'absender_name'  => 'Website Die Aufräumer',
    'erlaubte_hosts' => ['dieaufraeumer.com', 'www.dieaufraeumer.com'],
    'versand'        => 'mail',                         // 'mail' = Versand über den Server, 'protokoll' = nur in Datei schreiben (Test)
    'daten_ordner'   => __DIR__ . '/../anfrage-daten',  // außerhalb des Web-Ordners, für die Begrenzung je Absender
    'salz'           => 'bitte-durch-zufaellige-zeichen-ersetzen',
    'max_pro_stunde' => 5,
    'max_fotos'      => 8,
    'max_mb_je_foto' => 8,
    'max_mb_gesamt'  => 24,
];
