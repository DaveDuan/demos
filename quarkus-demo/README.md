This is a quarkus demo, only a few of APIs for the chrome extension demo(used to save opened tabs).

Configure your mysql info from the application.properties file, and run following command, the DB tables will be created.
```shell script
./mvnw quarkus:dev
```

Refer to the dockerfiles to create docker image, then run it by 
```shell script
docker run -e quarkus.datasource.url="jdbc:mysql://127.0.0.1:3306/test?useSSL=false&useUnicode=true&characterEncoding=utf-8" -e quarkus.datasource.username=root -e quarkus.datasource.password=admin -i --rm -p 8080:8080 davesmemo/quarkus-demo
```