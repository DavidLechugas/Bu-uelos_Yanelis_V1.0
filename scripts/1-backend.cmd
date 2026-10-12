@echo off
setlocal
cd /d "%~dp0..\backend"
if not defined JAVA_HOME set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1"
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo Configura JAVA_HOME con la ruta del JDK 21.
  exit /b 1
)
echo Si el backend ya esta en 8080, no abras una segunda instancia.
call mvnw.cmd spring-boot:run
