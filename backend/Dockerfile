# Buñuelos Yanelys — imagen del backend de demostración.
#
# Multi-stage (Java 21 + Maven Wrapper). La usa Render
# (render.yaml, runtime: docker) con BuildKit; respeta
# .dockerignore. NO contiene secretos: la configuración
# viene de variables de entorno (ver
# src/main/resources/application-prod.properties).

# ---- 1) Build: compilar y empaquetar con el wrapper ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Wrapper + POM primero: la capa se cachea aunque cambien
# las fuentes. Se invoca con `sh` porque el bit de
# ejecución de mvnw no se conserva al copiar desde Windows.
COPY .mvn .mvn
COPY mvnw ./
COPY pom.xml ./
RUN sh ./mvnw -B dependency:go-offline

# Solo las fuentes de producción (src/test está en
# .dockerignore: la suite no corre dentro de la imagen).
COPY src/main ./src/main
RUN sh ./mvnw -B package -DskipTests

# ---- 2) Runtime: JRE 21 sin Maven, usuario sin privilegios ----
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar ./app.jar

# Render inyecta PORT; la app lo lee (server.port=${PORT:8080}).
EXPOSE 8080

RUN groupadd --system javaapp && useradd --system --gid javaapp javaapp
USER javaapp

ENTRYPOINT ["java", "-jar", "app.jar"]
