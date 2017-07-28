<?php

/*
 *
 * Put email and datetime to output.txt
 * Send notification to email
 *
*/


$email = $_GET['email'];

if (!empty($email)) {

    // validate email

    $reg = "/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]{2,4}$/is";
    if (preg_match($reg, $email)) {

        // add to file output.txt

        $fp = fopen('output.txt', 'a');
        $time = time();
        $string = "\n" . $time . ' ' . $email;
        fwrite($fp, $string);
        fclose($fp);

        //send email to admin with subcriber's email

        $message = "New Subscriber from landing:\n";
        $message .= "----------------------------\n";
        $message .= "Email: " . $email . "\n";
        $message .= "Time: " . date("Y:m:d h:i:s", $time) . "\n";
        $message .= "Line in output.txt: " . $string;


        $to      = 'info@specify.cc';
        $from    = 'no-reply@specify.cc';
        $subject = 'New subscriber';

        $headers = 'From: '. $from . "\r\n" .
            'Reply-To: ' . $from . "\r\n" .
            'Subject: ' . $subject. "\r\n".
            'X-Mailer: PHP/' . phpversion();

//        @mail($to, $subject, $message, $headers);

        smtp_email($to, $subject, $message, $headers);
    }
}


function smtp_email($targetEmail, $messageSubject, $text, $headers) {
    // prepare variables
    $smtpResult = false;
    $senderEmail = 'no-reply@specify.cc';
    $password = 'Ntcnbhjdfybt1986';

    // helper functions for SMTP
    $getData = function($smtp_conn) {
        $data = "";
        while($str = fgets($smtp_conn,515))
        {
            $data .= $str;
            if(substr($str,3,1) == " ") { break; }
        }
        return $data;
    };
    $makeRequest = function($smtp_conn, $smtp_command, $goodStatusCode) use (&$smtpResult, &$getData) {
        if($smtpResult) {
            fputs($smtp_conn, $smtp_command);

            $data = $getData($smtp_conn);
            $code = substr($data, 0, 3);

            if($code != $goodStatusCode) {
                $smtpResult = false;
            }
        }
    };

    // smtp message sending
    $smtp_conn = fsockopen("ssl://smtp.googlemail.com", 465, $errno, $errstr, 10);
    if($smtp_conn) {
        $smtpResult = true;
        $getData($smtp_conn);

        $makeRequest($smtp_conn,"EHLO w3.co\r\n", 250);
        $makeRequest($smtp_conn,"AUTH LOGIN\r\n", 334);
        $makeRequest($smtp_conn,base64_encode($senderEmail)."\r\n", 334);
        $makeRequest($smtp_conn,base64_encode($password)."\r\n", 235);
        $makeRequest($smtp_conn,"MAIL FROM:<".$senderEmail.">\r\n", 250);
        $makeRequest($smtp_conn,"RCPT TO:<".$targetEmail.">\r\n", 250);
        $makeRequest($smtp_conn,"DATA\r\n", 354);
        $makeRequest($smtp_conn,$headers."\r\n".$text."\r\n.\r\n", 250);
        $makeRequest($smtp_conn,"QUIT\r\n", 221);
    }
    fclose($smtp_conn);
    return $smtpResult;
}

