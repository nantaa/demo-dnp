2026_01_01_000010_create_dnp_monitor_schema ................................................................ 1s DONE 
 2026_01_01_000011_create_inspector_profiles_table ..................................................... 37.42ms FAIL 

  UnexpectedValueException 

 The stream or file "/var/www/demo-dnp/demo-dnp/dnp-monitor-production/storage/logs/laravel.log" could not be opened in append mode: Failed to open stream: Permission deniedT
he exception occurred while attempting to log: SQLSTATE[42804]: Datatype mismatch: 7 ERROR:  foreign key constraint "inspector_profiles_user_id_foreign" cannot be implementedD
ETAIL:  Key columns "user_id" and "id" are of incompatible types: uuid and bigint. (Connection: pgsql, Host: 127.0.0.1, Port: 5432, Database: dnp_monitor_new, SQL: alter table "inspector_profiles" add constraint "inspector_profiles_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade)C
ontext: {"exception":{"errorInfo":["42804",7,"ERROR:  foreign key constraint \"inspector_profiles_user_id_foreign\" cannot be implemented\nDETAIL:  Key columns \"user_id\" and \"id\" are of incompatible types: uuid and bigint."],"connectionName":"pgsql","readWriteType":"write"}} 

 at vendor/monolog/monolog/src/Monolog/Handler/StreamHandler.php:164 
   160▕             } 
   161▕             if (!\is_resource($stream)) { 
   162▕                 $this->stream = null; 
   163▕ 
 ➜ 164▕                 throw new \UnexpectedValueException(sprintf('The stream or file "%s" could not be opened in append mode: '.$this->errorMessage, $url) . Utils::getRecordMessageForException($record)); 
   165▕             } 
   166▕             stream_set_chunk_size($stream, $this->streamChunkSize); 
   167▕             $this->stream = $stream; 
   168▕             $this->inodeUrl = $this->getInodeFromUrl(); 

     +12 vendor frames 

 13  artisan:16 
     Illuminate\Foundation\Application::handleCommand()