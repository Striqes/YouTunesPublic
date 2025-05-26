<?php
return [
    'paths'            => ['api/*'],
    'allowed_methods'  => ['GET','POST','PUT','DELETE','OPTIONS'],
    'allowed_origins'  => [env('FRONTEND_URL')],
    'allowed_headers'  => ['Content-Type','X-Requested-With','Accept','Origin','Authorization'],
    'supports_credentials' => true,   // <— allow cookies
];
